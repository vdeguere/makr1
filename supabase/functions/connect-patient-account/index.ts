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

    const { token, user_id } = await req.json();

    if (!token || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Token and user_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify token exists and is valid
    const { data: tokenData, error: tokenError } = await supabase
      .from('patient_connection_tokens')
      .select('id, patient_id, connection_type, expires_at, used_at')
      .eq('token', token)
      .eq('connection_type', 'account_signup')
      .single();

    if (tokenError || !tokenData) {
      console.error('Token not found:', tokenError);
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check token validity
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    
    if (expiresAt < now) {
      return new Response(
        JSON.stringify({ error: 'Token has expired' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (tokenData.used_at) {
      return new Response(
        JSON.stringify({ error: 'Token has already been used' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify user exists
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id);
    
    if (userError || !userData) {
      console.error('User not found:', userError);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update patient record with user_id
    const { error: updateError } = await supabase
      .from('patients')
      .update({ user_id })
      .eq('id', tokenData.patient_id);

    if (updateError) {
      console.error('Error updating patient:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to link patient account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add patient role to user_roles
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id,
        role: 'patient',
      });

    if (roleError) {
      console.error('Error adding patient role:', roleError);
      // Continue even if role already exists
    }

    // Mark token as used
    const { error: tokenUpdateError } = await supabase
      .from('patient_connection_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    if (tokenUpdateError) {
      console.error('Error updating token:', tokenUpdateError);
    }

    console.log('Patient account connected successfully:', { patient_id: tokenData.patient_id, user_id });

    return new Response(
      JSON.stringify({
        success: true,
        patient_id: tokenData.patient_id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in connect-patient-account:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
