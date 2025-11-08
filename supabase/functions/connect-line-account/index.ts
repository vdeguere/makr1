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

    const { token, line_user_id, line_display_name } = await req.json();

    if (!token || !line_user_id) {
      return new Response(
        JSON.stringify({ error: 'Token and line_user_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify token exists and is valid
    const { data: tokenData, error: tokenError } = await supabase
      .from('patient_connection_tokens')
      .select('id, patient_id, connection_type, expires_at, used_at')
      .eq('token', token)
      .eq('connection_type', 'line_connect')
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

    // Update patient record with LINE user ID
    const { error: updateError } = await supabase
      .from('patients')
      .update({ line_user_id })
      .eq('id', tokenData.patient_id);

    if (updateError) {
      console.error('Error updating patient LINE ID:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to link LINE account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark token as used
    const { error: tokenUpdateError } = await supabase
      .from('patient_connection_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id);

    if (tokenUpdateError) {
      console.error('Error updating token:', tokenUpdateError);
    }

    // Send welcome LINE message
    const lineAccessToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
    if (lineAccessToken) {
      try {
        const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${lineAccessToken}`,
          },
          body: JSON.stringify({
            to: line_user_id,
            messages: [{
              type: 'text',
              text: `Welcome! Your LINE account has been successfully connected. You'll now receive health recommendations and updates here.`,
            }],
          }),
        });

        if (!lineResponse.ok) {
          console.error('Failed to send welcome LINE message:', await lineResponse.text());
        } else {
          console.log('Welcome LINE message sent successfully');
        }
      } catch (lineError) {
        console.error('Error sending LINE message:', lineError);
      }
    }

    console.log('LINE account connected successfully:', { 
      patient_id: tokenData.patient_id, 
      line_user_id,
      line_display_name 
    });

    return new Response(
      JSON.stringify({
        success: true,
        patient_id: tokenData.patient_id,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in connect-line-account:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
