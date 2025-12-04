import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2024-12-18.acacia",
});

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
    const { course_id, user_id } = await req.json();

    if (!course_id || !user_id) {
      throw new Error("course_id and user_id are required");
    }

    // Get course details including price and included items
    const { data: course, error: courseError } = await supabaseClient
      .from("courses")
      .select("id, title, price, included_products, included_kits")
      .eq("id", course_id)
      .single();

    if (courseError || !course) {
      throw new Error("Course not found");
    }

    if (!course.price || course.price <= 0) {
      throw new Error("Course is free - use direct enrollment");
    }

    // Build line items for Stripe
    const lineItems = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: course.title,
            description: "Course Enrollment",
          },
          unit_amount: Math.round(course.price * 100), // Convert to cents
        },
        quantity: 1,
      },
    ];

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      success_url: `${Deno.env.get("PUBLIC_SITE_URL") || "https://xcherbs.com"}/dashboard/courses/${course_id}?enrollment=success`,
      cancel_url: `${Deno.env.get("PUBLIC_SITE_URL") || "https://xcherbs.com"}/dashboard/courses/${course_id}?enrollment=cancelled`,
      metadata: {
        course_id: course_id,
        user_id: user_id,
        included_products: JSON.stringify(course.included_products || []),
        included_kits: JSON.stringify(course.included_kits || []),
      },
    });

    console.log("create-course-checkout-session: session created", session.id);

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
    console.error("create-course-checkout-session: error", error);
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

