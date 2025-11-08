import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Query token with patient info
    const { data: tokenData, error: tokenError } = await supabase
      .from('patient_connection_tokens')
      .select(`
        id,
        patient_id,
        connection_type,
        expires_at,
        used_at,
        patients (
          id,
          full_name,
          email,
          phone,
          user_id,
          line_user_id
        )
      `)
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      console.log('Token not found:', token);
      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid token' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    
    if (expiresAt < now) {
      console.log('Token expired:', token);
      return new Response(
        JSON.stringify({ valid: false, error: 'Token has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if token is already used
    if (tokenData.used_at) {
      console.log('Token already used:', token);
      return new Response(
        JSON.stringify({ valid: false, error: 'Token has already been used' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get patient data (handle array from join)
    const patient = Array.isArray(tokenData.patients) ? tokenData.patients[0] : tokenData.patients;

    // Check if already connected based on type
    if (tokenData.connection_type === 'account_signup' && patient?.user_id) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Patient account already connected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (tokenData.connection_type === 'line_connect' && patient?.line_user_id) {
      return new Response(
        JSON.stringify({ valid: false, error: 'LINE account already connected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Token verified successfully:', token);

    return new Response(
      JSON.stringify({
        valid: true,
        patient: patient ? {
          id: patient.id,
          full_name: patient.full_name,
          email: patient.email,
          phone: patient.phone,
        } : null,
        connection_type: tokenData.connection_type,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-patient-connection-token:', error);
    return new Response(
      JSON.stringify({ 
        valid: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
