import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const { token, shipping_address, shipping_city, shipping_postal_code, shipping_phone, currency = 'THB' } = await req.json();

    console.log("create-stripe-checkout-session: token received", token);

    if (!token) {
      throw new Error("Token is required");
    }

    // Validate the token
    const { data: linkData, error: linkError } = await supabaseClient
      .from("recommendation_links")
      .select("*, recommendation:recommendations(*)")
      .eq("token", token)
      .single();

    if (linkError || !linkData) {
      console.error("create-stripe-checkout-session: invalid token", linkError);
      throw new Error("Invalid or expired checkout link");
    }

    if (linkData.used_at) {
      throw new Error("This checkout link has already been used");
    }

    if (new Date(linkData.expires_at) < new Date()) {
      throw new Error("This checkout link has expired");
    }

    console.log("create-stripe-checkout-session: token validated, recommendation_id:", linkData.recommendation_id);

    // Get recommendation items with herb details
    const { data: items, error: itemsError } = await supabaseClient
      .from("recommendation_items")
      .select(`
        *,
        herb:herbs(name, retail_price, supported_currencies, price_currency)
      `)
      .eq("recommendation_id", linkData.recommendation_id);

    if (itemsError || !items || items.length === 0) {
      console.error("create-stripe-checkout-session: no items found", itemsError);
      throw new Error("No items found in recommendation");
    }

    console.log("create-stripe-checkout-session: found", items.length, "items");

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Helper to get price in requested currency
    const getPriceInCurrency = (item: any, currency: string): number => {
      // Check supported_currencies first
      if (item.herb.supported_currencies && item.herb.supported_currencies[currency]) {
        return item.herb.supported_currencies[currency].retail_price || item.herb.retail_price;
      }
      // Fallback to unit_price or retail_price
      return item.unit_price || item.herb.retail_price;
    };

    // Create line items for Stripe
    const lineItems = items.map((item: any) => {
      const price = getPriceInCurrency(item, currency);
      return {
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: item.herb.name,
            description: item.dosage_instructions || undefined,
          },
          unit_amount: Math.round(price * 100), // Convert to smallest currency unit
        },
        quantity: item.quantity,
      };
    });

    // Fetch exchange rate for currency
    const { data: currencyData } = await supabaseClient
      .from("currency_settings")
      .select("exchange_rate_to_base")
      .eq("currency_code", currency)
      .single();

    const exchangeRate = currencyData?.exchange_rate_to_base || 1.0;

    const totalAmount = items.reduce((sum: number, item: any) => {
      const price = getPriceInCurrency(item, currency);
      return sum + price * item.quantity;
    }, 0);

    console.log("create-stripe-checkout-session: total amount", totalAmount);

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["promptpay"],
      mode: "payment",
      line_items: lineItems,
      success_url: `https://xcherbs.com/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://xcherbs.com/checkout/cancel?token=${token}`,
      metadata: {
        token,
        recommendation_id: linkData.recommendation_id,
        patient_id: linkData.recommendation.patient_id,
        shipping_address: shipping_address || "",
        shipping_city: shipping_city || "",
        shipping_postal_code: shipping_postal_code || "",
        shipping_phone: shipping_phone || "",
        currency,
        exchange_rate: String(exchangeRate),
      },
    });

    console.log("create-stripe-checkout-session: session created", session.id);

    return new Response(
      JSON.stringify({ 
        url: session.url,
        session_id: session.id 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("create-stripe-checkout-session: error", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
