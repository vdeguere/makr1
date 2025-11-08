import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const handler = async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Parse state to extract token and origin
    let token: string;
    let appUrl: string;
    
    try {
      const stateData = JSON.parse(state || '{}');
      token = stateData.token;
      appUrl = stateData.origin;
    } catch (e) {
      // Fallback for backwards compatibility
      token = state || '';
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      appUrl = supabaseUrl.replace('.supabase.co', '.lovable.app');
    }

    // Handle LINE OAuth errors
    if (error) {
      console.error('LINE OAuth error:', error);
      return Response.redirect(`${appUrl}/patient-connect/line-error?error=${error}`);
    }

    if (!code || !state) {
      console.error('Missing code or state in LINE callback');
      return Response.redirect(`${appUrl}/patient-connect/line-error?error=missing_parameters`);
    }

    // Exchange code for access token
    const lineChannelId = Deno.env.get('LINE_CHANNEL_ID');
    const lineChannelSecret = Deno.env.get('LINE_CHANNEL_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;

    if (!lineChannelId || !lineChannelSecret) {
      console.error('LINE credentials not configured');
      return Response.redirect(`${appUrl}/patient-connect/line-error?error=configuration_error`);
    }

    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${supabaseUrl}/functions/v1/line-oauth-callback`,
        client_id: lineChannelId,
        client_secret: lineChannelSecret,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Failed to exchange LINE code for token:', errorText);
      return Response.redirect(`${appUrl}/patient-connect/line-error?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get LINE user profile
    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error('Failed to get LINE profile:', errorText);
      return Response.redirect(`${appUrl}/patient-connect/line-error?error=profile_fetch_failed`);
    }

    const profile = await profileResponse.json();
    const lineUserId = profile.userId;
    const displayName = profile.displayName;

    console.log('LINE profile retrieved:', { lineUserId, displayName });

    // Connect LINE account using our edge function
    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    
    const { data, error: connectError } = await supabase.functions.invoke('connect-line-account', {
      body: {
        token: token,
        line_user_id: lineUserId,
        line_display_name: displayName,
      },
    });

    if (connectError || !data?.success) {
      console.error('Failed to connect LINE account:', connectError);
      return Response.redirect(`${appUrl}/patient-connect/line-error?error=connection_failed`);
    }

    console.log('LINE account connected successfully via callback');

    // Redirect to success page
    return Response.redirect(`${appUrl}/patient-connect/line-success`);

  } catch (error) {
    console.error('Error in LINE OAuth callback:', error);
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const appUrl = supabaseUrl.replace('.supabase.co', '.lovable.app');
    return Response.redirect(`${appUrl}/patient-connect/line-error?error=unknown_error`);
  }
};

serve(handler);
