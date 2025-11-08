import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

serve(async (req) => {
  const signature = req.headers.get("Stripe-Signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    console.error("stripe-webhook: missing signature or secret");
    return new Response("Webhook signature or secret missing", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );

    console.log("stripe-webhook: event received", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log("stripe-webhook: processing checkout completion", session.id);

      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      await handleCheckoutSession(session, supabaseClient);
    } else if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      console.log("stripe-webhook: processing PaymentIntent success", paymentIntent.id);
      
      // Only process PromptPay payments (they have recommendation_id in metadata)
      if (paymentIntent.metadata?.recommendation_id) {
        const supabaseClient = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
          { auth: { persistSession: false } }
        );

        await handlePaymentIntent(paymentIntent, supabaseClient);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("stripe-webhook: error", error);
    const errorMessage = error instanceof Error ? error.message : "An error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

async function handleCheckoutSession(session: Stripe.Checkout.Session, supabaseClient: any) {

  const metadata = session.metadata;
  if (!metadata || !metadata.token || !metadata.recommendation_id) {
    throw new Error("Missing required metadata");
  }

  // Validate the token
  const { data: linkData, error: linkError } = await supabaseClient
    .from("recommendation_links")
    .select("*")
    .eq("token", metadata.token)
    .single();

  if (linkError || !linkData || linkData.used_at) {
    console.log("stripe-webhook: invalid or used token, skipping");
    return;
  }

  // Get recommendation items
  const { data: items, error: itemsError } = await supabaseClient
    .from("recommendation_items")
    .select("*")
    .eq("recommendation_id", metadata.recommendation_id);

  if (itemsError || !items) {
    throw new Error("Failed to fetch recommendation items");
  }

  // Calculate total
  const totalAmount = session.amount_total ? session.amount_total / 100 : 0;

  // Create order
  const { data: order, error: orderError } = await supabaseClient
    .from("orders")
    .insert({
      recommendation_id: metadata.recommendation_id,
      patient_id: metadata.patient_id,
      total_amount: totalAmount,
      shipping_address: metadata.shipping_address,
      shipping_city: metadata.shipping_city,
      shipping_postal_code: metadata.shipping_postal_code,
      shipping_phone: metadata.shipping_phone,
      payment_method: "promptpay",
      payment_status: "paid",
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string,
      paid_at: new Date().toISOString(),
      status: "pending",
      currency: metadata.currency || "THB",
      exchange_rate: parseFloat(metadata.exchange_rate || "1.0"),
    })
    .select()
    .single();

  if (orderError) {
    console.error("stripe-webhook: order creation failed", orderError);
    throw new Error("Failed to create order");
  }

  console.log("stripe-webhook: order created", order.id);

  // Update stock
  for (const item of items) {
    await supabaseClient.rpc("decrement_stock", {
      herb_id: item.herb_id,
      quantity: item.quantity,
    });
  }

  // Mark link as used and update recommendation
  await supabaseClient
    .from("recommendation_links")
    .update({ used_at: new Date().toISOString() })
    .eq("id", linkData.id);

  await supabaseClient
    .from("recommendations")
    .update({ status: "paid" })
    .eq("id", metadata.recommendation_id);

  // Save shipping information to patient's default fields
  if (metadata.patient_id && metadata.shipping_address) {
    await supabaseClient
      .from("patients")
      .update({
        default_shipping_address: metadata.shipping_address,
        default_shipping_city: metadata.shipping_city,
        default_shipping_postal_code: metadata.shipping_postal_code,
        default_shipping_phone: metadata.shipping_phone,
      })
      .eq("id", metadata.patient_id);
    
    console.log("stripe-webhook: shipping information saved to patient record");
  }

  console.log("stripe-webhook: checkout session processed");
}

async function handlePaymentIntent(paymentIntent: Stripe.PaymentIntent, supabaseClient: any) {
  const { recommendation_id, token, patient_id } = paymentIntent.metadata;

  if (!recommendation_id || !token || !patient_id) {
    console.error("stripe-webhook: missing metadata in PaymentIntent");
    return;
  }

  // Validate token
  const { data: linkData, error: linkError } = await supabaseClient
    .from("recommendation_links")
    .select("*")
    .eq("recommendation_id", recommendation_id)
    .eq("token", token)
    .single();

  if (linkError || !linkData || linkData.used_at) {
    console.log("stripe-webhook: invalid or used token for PaymentIntent");
    return;
  }

  // Fetch recommendation items
  const { data: items, error: itemsError } = await supabaseClient
    .from("recommendation_items")
    .select("herb_id, quantity, unit_price")
    .eq("recommendation_id", recommendation_id);

  if (itemsError || !items) {
    console.error("stripe-webhook: failed to fetch items for PaymentIntent");
    return;
  }

  // Calculate total
  const totalAmount = items.reduce((sum: number, item: any) => {
    return sum + (Number(item.unit_price) * Number(item.quantity));
  }, 0);

  // Create order
  const { data: order, error: orderError } = await supabaseClient
    .from("orders")
    .insert({
      recommendation_id,
      patient_id,
      total_amount: totalAmount,
      payment_status: "paid",
      payment_method: "promptpay",
      stripe_payment_intent_id: paymentIntent.id,
      paid_at: new Date().toISOString(),
      status: "pending",
    })
    .select()
    .single();

  if (orderError) {
    console.error("stripe-webhook: failed to create order from PaymentIntent", orderError);
    return;
  }

  console.log("stripe-webhook: order created from PaymentIntent", order.id);

  // Update stock
  for (const item of items) {
    await supabaseClient.rpc("decrement_stock", {
      herb_id: item.herb_id,
      quantity: item.quantity,
    });
  }

  // Mark link as used and update recommendation
  await supabaseClient
    .from("recommendation_links")
    .update({ used_at: new Date().toISOString() })
    .eq("token", token);

  await supabaseClient
    .from("recommendations")
    .update({ status: "paid" })
    .eq("id", recommendation_id);

  console.log("stripe-webhook: PaymentIntent processed successfully");
}
