import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    console.log('send-recommendation: auth header present?', !!authHeader);
    
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const jwt = authHeader.replace('Bearer ', '');
    console.log('send-recommendation: jwt length', jwt.length);

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Validate user with admin client
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(jwt);
    if (userError || !userData?.user) {
      console.error('send-recommendation: getUser error', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const user = userData.user;
    console.log('send-recommendation: user verified', user.id);

    const { recommendation_id, channels, optional_message, resend } = await req.json();

    if (!recommendation_id || !channels || channels.length === 0) {
      return new Response(
        JSON.stringify({ error: 'recommendation_id and at least one channel required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('send-recommendation: channels', channels, 'for recommendation', recommendation_id, 'resend?', !!resend);

    // Verify user owns this recommendation (devs and admins can access any)
    const { data: activeRole, error: roleError } = await supabase
      .rpc('get_active_role', { _user_id: user.id });
    if (roleError) {
      console.error('send-recommendation: get_active_role error', roleError);
    }
    const hasUnrestrictedAccess = activeRole === 'dev' || activeRole === 'admin';
    console.log('send-recommendation: activeRole', activeRole, 'hasUnrestrictedAccess', hasUnrestrictedAccess);

    let recQuery = supabase
      .from('recommendations')
      .select('id, status, practitioner_id, notification_channels')
      .eq('id', recommendation_id);

    if (!hasUnrestrictedAccess) {
      recQuery = recQuery.eq('practitioner_id', user.id);
    }

    const { data: recommendation, error: recError } = await recQuery.single();

    if (recError || !recommendation) {
      console.error('send-recommendation: recommendation fetch error', recError);
      return new Response(
        JSON.stringify({ error: 'Recommendation not found or unauthorized' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (recommendation.status !== 'draft' && !resend) {
      return new Response(
        JSON.stringify({ error: 'Recommendation has already been sent. Use resend=true to send again.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate checkout link via backend invoke (no raw fetch)
    const { data: checkoutData, error: checkoutErr } = await supabaseAdmin.functions.invoke(
      'generate-checkout-link',
      { body: { recommendation_id } }
    );

    if (checkoutErr) {
      console.error('send-recommendation: checkout link error', checkoutErr);
      return new Response(
        JSON.stringify({ error: `Failed to generate checkout link: ${checkoutErr.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { checkout_url, token } = (checkoutData as { checkout_url: string; token: string });

    const results = {
      email: { success: false, error: null as string | null },
      line: { success: false, error: null as string | null }
    };

    // Send via selected channels in parallel
    const promises = [];
    console.log('send-recommendation: invoking child functions for channels:', channels);

    if (channels.includes('email')) {
      promises.push(
        supabaseAdmin.functions
          .invoke('send-recommendation-email', {
            body: { recommendation_id, checkout_url, optional_message }
          })
          .then((result) => {
            console.log('send-recommendation: email function response:', JSON.stringify(result));
            if (!result.error) {
              results.email.success = true;
            } else {
              results.email.error = result.error.message;
            }
          })
          .catch((err) => {
            console.error('send-recommendation: email function exception:', err);
            results.email.error = err.message;
          })
      );
    }

    if (channels.includes('line')) {
      promises.push(
        supabaseAdmin.functions
          .invoke('send-recommendation-line', {
            body: { recommendation_id, checkout_url, optional_message, token }
          })
          .then((result) => {
            console.log('send-recommendation: line function response:', JSON.stringify(result));
            if (!result.error) {
              results.line.success = true;
            } else {
              results.line.error = result.error.message;
            }
          })
          .catch((err) => {
            console.error('send-recommendation: line function exception:', err);
            results.line.error = err.message;
          })
      );
    }

    await Promise.all(promises);
    console.log('send-recommendation: all notification promises completed, results:', JSON.stringify(results));

    // Check if at least one channel succeeded
    const anySuccess = results.email.success || results.line.success;
    console.log('send-recommendation: any channel succeeded?', anySuccess);

    if (anySuccess) {
      // Update recommendation status and sent_at
      const updateData: any = {
        sent_at: new Date().toISOString(),
      };

      // If this is the first send (status was draft), mark as payment_pending
      if (recommendation.status === 'draft') {
        updateData.status = 'payment_pending';
        updateData.notification_channels = channels;
      } else if (resend) {
        // For resends, merge notification channels (unique union)
        const existingChannels = recommendation.notification_channels || [];
        const mergedChannels = Array.from(new Set([...existingChannels, ...channels]));
        updateData.notification_channels = mergedChannels;
      }

      await supabaseAdmin
        .from('recommendations')
        .update(updateData)
        .eq('id', recommendation_id);

      console.log('send-recommendation: updated recommendation', resend ? '(resent)' : '(first send)');
    }

    return new Response(
      JSON.stringify({ 
        success: anySuccess,
        checkout_url,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in send-recommendation:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});