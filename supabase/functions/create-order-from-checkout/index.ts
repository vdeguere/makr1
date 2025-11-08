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

    const { 
      token, 
      shipping_address, 
      shipping_city, 
      shipping_postal_code, 
      shipping_phone,
      payment_method 
    } = await req.json();

    if (!token || !shipping_address || !shipping_city || !shipping_phone || !payment_method) {
      throw new Error('Missing required fields');
    }

    // Validate token
    const { data: link, error: linkError } = await supabase
      .from('recommendation_links')
      .select('*, recommendations(*)')
      .eq('token', token)
      .single();

    if (linkError || !link) {
      throw new Error('Invalid checkout link');
    }

    if (link.used_at) {
      throw new Error('This checkout link has already been used');
    }

    if (new Date(link.expires_at) < new Date()) {
      throw new Error('This checkout link has expired');
    }

    const recommendation = link.recommendations;

    // Get recommendation items
    const { data: items, error: itemsError } = await supabase
      .from('recommendation_items')
      .select('*, herbs(*)')
      .eq('recommendation_id', recommendation.id);

    if (itemsError || !items || items.length === 0) {
      throw new Error('No items found in recommendation');
    }

    // Check stock availability and prepare updates
    const stockUpdates = [];
    for (const item of items) {
      if (item.herbs.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${item.herbs.name}`);
      }
      stockUpdates.push({
        id: item.herb_id,
        new_quantity: item.herbs.stock_quantity - item.quantity
      });
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        patient_id: recommendation.patient_id,
        recommendation_id: recommendation.id,
        total_amount: recommendation.total_cost,
        status: 'pending',
        payment_status: 'pending',
        payment_method,
        shipping_address,
        shipping_city,
        shipping_postal_code,
        shipping_phone,
        notes: JSON.stringify(items) // Store order items snapshot
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      throw new Error('Failed to create order');
    }

    // Update stock quantities
    for (const update of stockUpdates) {
      await supabase
        .from('herbs')
        .update({ stock_quantity: update.new_quantity })
        .eq('id', update.id);
    }

    // Mark token as used
    await supabase
      .from('recommendation_links')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token);

    // Update recommendation status
    await supabase
      .from('recommendations')
      .update({ status: 'completed' })
      .eq('id', recommendation.id);

    // Save shipping information to patient's default fields
    await supabase
      .from('patients')
      .update({
        default_shipping_address: shipping_address,
        default_shipping_city: shipping_city,
        default_shipping_postal_code: shipping_postal_code,
        default_shipping_phone: shipping_phone,
      })
      .eq('id', recommendation.patient_id);

    console.log('Shipping information saved to patient record');

    return new Response(
      JSON.stringify({ 
        success: true, 
        order_id: order.id,
        message: 'Order created successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in create-order-from-checkout:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});