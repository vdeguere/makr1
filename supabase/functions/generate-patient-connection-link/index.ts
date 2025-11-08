import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateLinkRequest {
  patient_id: string;
  connection_type: 'account_signup' | 'line_connect';
  app_origin: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { patient_id, connection_type, app_origin }: GenerateLinkRequest = await req.json();

    console.log('Generating connection link:', {
      patient_id,
      connection_type,
      user_id: user.id
    });

    // Verify practitioner owns the patient or is admin
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('practitioner_id')
      .eq('id', patient_id)
      .single();

    if (patientError || !patient) {
      console.error('Patient not found:', { patient_id, error: patientError });
      return new Response(
        JSON.stringify({ error: 'Patient not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin, dev, or practitioner for this patient
    const { data: role } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    console.log('Authorization check:', {
      user_role: role?.role,
      user_id: user.id,
      patient_practitioner_id: patient.practitioner_id
    });

    const isAuthorized = 
      role?.role === 'admin' || 
      role?.role === 'dev' ||
      patient.practitioner_id === user.id;

    if (!isAuthorized) {
      console.error('Authorization failed:', { 
        userRole: role?.role, 
        userId: user.id, 
        patientPractitionerId: patient.practitioner_id 
      });
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authorization passed');

    // Generate secure token
    const connectionToken = crypto.randomUUID();

    // Set expiration based on type
    const expirationHours = connection_type === 'account_signup' ? 168 : 24; // 7 days or 24 hours
    const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);

    console.log('Generated token:', { 
      tokenPrefix: connectionToken.substring(0, 8) + '...', 
      expiresAt: expiresAt.toISOString(),
      expirationHours
    });

    // Insert token
    const { error: insertError } = await supabase
      .from('patient_connection_tokens')
      .insert({
        patient_id,
        token: connectionToken,
        expires_at: expiresAt.toISOString(),
        connection_type,
        created_by: user.id,
      });

    if (insertError) {
      console.error('Error inserting token:', {
        error: insertError,
        patient_id,
        connection_type,
        user_id: user.id,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      });
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate connection link',
          details: insertError.message 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Token inserted successfully');

    // Generate connection URL
    const appUrl = app_origin || supabaseUrl.replace('.supabase.co', '.lovable.app');
    let connectionUrl: string;

    if (connection_type === 'account_signup') {
      connectionUrl = `${appUrl}/patient-connect/signup/${connectionToken}`;
    } else {
      // LINE connect URL - will be used in LINE OAuth flow
      connectionUrl = `${appUrl}/patient-connect/line/${connectionToken}`;
    }

    console.log('Generated connection link:', { patient_id, connection_type, expires_at: expiresAt });

    return new Response(
      JSON.stringify({
        connection_url: connectionUrl,
        expires_at: expiresAt.toISOString(),
        token: connectionToken,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-patient-connection-link:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
