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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { recommendation_id } = await req.json();

    if (!recommendation_id) {
      throw new Error('recommendation_id is required');
    }

    // Verify recommendation exists and has items
    const { data: recommendation, error: recError } = await supabase
      .from('recommendations')
      .select('id, total_cost, practitioner_id, patient_id')
      .eq('id', recommendation_id)
      .single();

    if (recError || !recommendation) {
      throw new Error('Recommendation not found');
    }

    if (!recommendation.total_cost || recommendation.total_cost <= 0) {
      throw new Error('Recommendation must have items with valid pricing');
    }

    // Generate secure token
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Store token
    const { error: insertError } = await supabase
      .from('recommendation_links')
      .insert({
        recommendation_id,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error('Error creating checkout link:', insertError);
      throw new Error('Failed to create checkout link');
    }

    const siteUrl = Deno.env.get('PUBLIC_SITE_URL');
    if (!siteUrl || !/^https?:\/\//.test(siteUrl)) {
      console.error('PUBLIC_SITE_URL not configured or invalid');
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration: PUBLIC_SITE_URL is missing or invalid' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const checkoutUrl = `${siteUrl.replace(/\/$/, '')}/checkout/${token}`;
    return new Response(
      JSON.stringify({ 
        success: true, 
        checkout_url: checkoutUrl,
        token,
        expires_at: expiresAt.toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in generate-checkout-link:', error);
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