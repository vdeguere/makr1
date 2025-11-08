import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('generate-promptpay-qr: function invoked');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recommendation_id, token } = await req.json();
    console.log('generate-promptpay-qr: processing', recommendation_id, 'with token', token);

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
      console.error('generate-promptpay-qr: invalid token', linkError);
      throw new Error('Invalid or expired checkout link');
    }

    console.log('generate-promptpay-qr: token validated');

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
      console.error('generate-promptpay-qr: items fetch error', itemsError);
      throw new Error('No items found for recommendation');
    }

    console.log('generate-promptpay-qr: found', items.length, 'items');

    // Fetch recommendation and patient info for metadata and billing details
    const { data: recommendation, error: recError } = await supabase
      .from('recommendations')
      .select(`
        patient_id,
        practitioner_id,
        patients!inner(email, full_name)
      `)
      .eq('id', recommendation_id)
      .single();

    if (recError || !recommendation) {
      console.error('generate-promptpay-qr: recommendation fetch error', recError);
      throw new Error('Recommendation not found');
    }

    const patient = Array.isArray(recommendation.patients) ? recommendation.patients[0] : recommendation.patients;
    
    if (!patient?.email) {
      throw new Error('Patient email not found');
    }

    // Calculate total
    const totalAmount = items.reduce((sum: number, item: any) => {
      return sum + (Number(item.unit_price) * Number(item.quantity));
    }, 0);

    console.log('generate-promptpay-qr: total amount', totalAmount);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2025-08-27.basil',
    });

    // Create PaymentIntent with PromptPay, billing details, and confirm it immediately
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to satang (Thai cents)
      currency: 'thb',
      payment_method_types: ['promptpay'],
      payment_method_data: {
        type: 'promptpay',
        billing_details: {
          email: patient.email,
          name: patient.full_name,
        },
      },
      confirm: true,
      metadata: {
        token,
        recommendation_id,
        patient_id: recommendation.patient_id,
        practitioner_id: recommendation.practitioner_id,
      },
    });

    console.log('generate-promptpay-qr: PaymentIntent created', paymentIntent.id, 'status:', paymentIntent.status);

    // Get QR code URL from next_action
    let qrCodeUrl = paymentIntent.next_action?.promptpay_display_qr_code?.image_url_png;
    
    // Fallback: if next_action is missing, try confirming explicitly
    if (!qrCodeUrl) {
      console.log('generate-promptpay-qr: No next_action on creation, attempting explicit confirm');
      try {
        const confirmed = await stripe.paymentIntents.confirm(paymentIntent.id, {
          payment_method_data: {
            type: 'promptpay',
          },
        });
        qrCodeUrl = confirmed.next_action?.promptpay_display_qr_code?.image_url_png;
        console.log('generate-promptpay-qr: After confirm - has next_action:', !!confirmed.next_action, 'has QR:', !!qrCodeUrl);
      } catch (confirmError) {
        console.error('generate-promptpay-qr: Confirm error:', confirmError);
      }
    }
    
    if (!qrCodeUrl) {
      console.error('generate-promptpay-qr: No QR code URL after confirm. PaymentIntent:', JSON.stringify({
        id: paymentIntent.id,
        status: paymentIntent.status,
        has_next_action: !!paymentIntent.next_action,
      }));
      throw new Error('Failed to generate PromptPay QR code');
    }

    console.log('generate-promptpay-qr: QR code URL retrieved');

    return new Response(
      JSON.stringify({ 
        qr_code_url: qrCodeUrl,
        payment_intent_id: paymentIntent.id,
        amount: totalAmount,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('generate-promptpay-qr: FATAL ERROR:', error);
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
