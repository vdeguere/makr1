import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { herbId, currency = 'THB' } = await req.json();

    if (!herbId) {
      throw new Error('herbId is required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Fetch herb with currency data
    const { data: herb, error } = await supabase
      .from('herbs')
      .select('id, name, retail_price, cost_per_unit, price_currency, supported_currencies')
      .eq('id', herbId)
      .single();

    if (error) throw error;
    if (!herb) throw new Error('Herb not found');

    // Check if we have a price for the requested currency
    let price = null;
    let costPerUnit = null;
    let usedCurrency = currency;

    if (herb.supported_currencies && herb.supported_currencies[currency]) {
      price = herb.supported_currencies[currency].retail_price;
      costPerUnit = herb.supported_currencies[currency].cost_per_unit;
    } else {
      // Fallback to default price if requested currency not available
      price = herb.retail_price;
      costPerUnit = herb.cost_per_unit;
      usedCurrency = herb.price_currency || 'THB';
    }

    return new Response(
      JSON.stringify({
        herbId: herb.id,
        herbName: herb.name,
        price,
        costPerUnit,
        currency: usedCurrency,
        availableCurrencies: herb.supported_currencies ? Object.keys(herb.supported_currencies) : [herb.price_currency || 'THB'],
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in get-herb-price:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
