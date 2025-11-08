import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('generate-promptpay-checkout: function invoked');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recommendation_id, token } = await req.json();
    console.log('generate-promptpay-checkout: processing', recommendation_id, 'with token', token);

    if (!recommendation_id || !token) {
      throw new Error('recommendation_id and token are required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate the token and recommendation
    const { data: linkData, error: linkError } = await supabase
      .from('recommendation_links')
      .select('*')
      .eq('recommendation_id', recommendation_id)
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .is('used_at', null)
      .single();

    if (linkError || !linkData) {
      console.error('generate-promptpay-checkout: invalid token', linkError);
      throw new Error('Invalid or expired checkout link');
    }

    console.log('generate-promptpay-checkout: token validated');

    // Fetch recommendation with items
    const { data: items, error: itemsError } = await supabase
      .from('recommendation_items')
      .select(`
        quantity,
        unit_price,
        herbs:herb_id (
          name
        )
      `)
      .eq('recommendation_id', recommendation_id);

    if (itemsError || !items || items.length === 0) {
      console.error('generate-promptpay-checkout: items fetch error', itemsError);
      throw new Error('No items found for recommendation');
    }

    console.log('generate-promptpay-checkout: found', items.length, 'items');

    // Fetch patient info for metadata
    const { data: recommendation, error: recError } = await supabase
      .from('recommendations')
      .select('patient_id')
      .eq('id', recommendation_id)
      .single();

    if (recError || !recommendation) {
      console.error('generate-promptpay-checkout: recommendation fetch error', recError);
      throw new Error('Recommendation not found');
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2025-08-27.basil',
    });

    // Calculate total and create line items
    const lineItems = items.map((item: any) => {
      const herbName = item.herbs?.name || 'Herb';
      const unitPrice = Number(item.unit_price) || 0;
      const quantity = Number(item.quantity) || 1;

      return {
        price_data: {
          currency: 'thb',
          product_data: {
            name: herbName,
          },
          unit_amount: Math.round(unitPrice * 100), // Convert to cents
        },
        quantity: quantity,
      };
    });

    const totalAmount = items.reduce((sum: number, item: any) => {
      return sum + (Number(item.unit_price) * Number(item.quantity));
    }, 0);

    console.log('generate-promptpay-checkout: total amount', totalAmount);

    // Create Stripe checkout session for PromptPay
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['promptpay'],
      mode: 'payment',
      line_items: lineItems,
      shipping_address_collection: {
        allowed_countries: ['TH'],
      },
      success_url: `${Deno.env.get('PUBLIC_SITE_URL')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${Deno.env.get('PUBLIC_SITE_URL')}/checkout/cancel`,
      metadata: {
        token,
        recommendation_id,
        patient_id: recommendation.patient_id,
      },
    });

    console.log('generate-promptpay-checkout: session created', session.id);

    return new Response(
      JSON.stringify({ 
        checkout_url: session.url,
        session_id: session.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('generate-promptpay-checkout: FATAL ERROR:', error);
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
