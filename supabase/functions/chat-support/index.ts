import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, language = 'en' } = await req.json();
    
    console.log('Chat support request:', { messageCount: messages?.length, language });

    if (!messages || !Array.isArray(messages)) {
      throw new Error('Messages array is required');
    }

    // Get environment variables
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Initialize Supabase client to fetch herb data
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch herbs data for context
    const { data: herbs, error: herbsError } = await supabase
      .from('herbs')
      .select(`
        id,
        name,
        thai_name,
        scientific_name,
        description,
        properties,
        dosage_instructions,
        contraindications,
        retail_price,
        cost_per_unit,
        price_currency,
        brand,
        stock_quantity,
        subscription_enabled,
        subscription_discount_percentage,
        subscription_intervals,
        category:product_categories(id, name)
      `)
      .limit(50);

    if (herbsError) {
      console.error('Error fetching herbs:', herbsError);
    }

    // Build herb context
    let herbContext = '';
    if (herbs && herbs.length > 0) {
      herbContext = '\n\nAvailable Traditional Thai Medicine products:\n';
      herbs.forEach(herb => {
        const displayName = herb.thai_name 
          ? `${herb.name} (${herb.thai_name})` 
          : herb.name;
        
        const categoryName = herb.category?.name || 'Uncategorized';
        
        herbContext += `\n- ${displayName}`;
        if (herb.scientific_name) herbContext += ` [${herb.scientific_name}]`;
        herbContext += ` (${categoryName})`;
        
        if (herb.description) herbContext += `\n  Description: ${herb.description}`;
        if (herb.properties) herbContext += `\n  Properties: ${herb.properties}`;
        if (herb.dosage_instructions) herbContext += `\n  Dosage: ${herb.dosage_instructions}`;
        if (herb.contraindications) herbContext += `\n  Contraindications: ${herb.contraindications}`;
        
        // Show pricing
        const currency = herb.price_currency || 'THB';
        const currencySymbol = currency === 'THB' ? '฿' : currency === 'USD' ? '$' : '¥';
        herbContext += `\n  Price: ${currencySymbol}${herb.retail_price?.toFixed(2) || 'N/A'}`;
        
        // Show subscription pricing if available
        if (herb.subscription_enabled && herb.subscription_discount_percentage) {
          const discountedPrice = herb.retail_price * (1 - herb.subscription_discount_percentage / 100);
          herbContext += `\n  Subscribe & Save ${herb.subscription_discount_percentage}%: ${currencySymbol}${discountedPrice.toFixed(2)}`;
          if (herb.subscription_intervals && herb.subscription_intervals.length > 0) {
            herbContext += ` (Available: ${herb.subscription_intervals.join(', ')})`;
          }
        }
        
        // Show stock status
        if (herb.stock_quantity !== null && herb.stock_quantity !== undefined) {
          herbContext += `\n  Stock: ${herb.stock_quantity > 0 ? 'In stock' : 'Out of stock'}`;
        }
      });
    }

    // Build system prompt
    const systemPrompt = `You are an AI support assistant for a Traditional Thai Medicine (TTM) platform. Your role is to:

1. **Educate about Traditional Thai Medicine**: Explain concepts, benefits, and practices of TTM
2. **Provide product information**: Answer questions about specific products, their uses, benefits, and precautions
3. **Guide users**: Help users navigate the platform features including:
   - Browsing and purchasing herbs
   - Connecting with certified practitioners
   - Receiving personalized recommendations
   - Tracking orders and prescriptions
   - Managing health records (for patients)
4. **Customer service**: Address concerns, answer questions, and provide helpful guidance
5. **Language support**: Respond in the user's preferred language (English, Thai, or Chinese)

**Platform Features:**
- Browse catalog of Traditional Thai Medicine products
- Connect with certified practitioners for personalized recommendations
- Receive custom herbal formulations tailored to individual needs
- Secure checkout with multiple payment options (Stripe, PromptPay)
- Order tracking and delivery updates
- Patient health records and wellness tracking
- LINE integration for notifications
- Multi-language support (EN, TH, ZH)

**Guidelines:**
- Be professional, friendly, and empathetic
- Provide accurate information about herbs and TTM practices
- Do not diagnose medical conditions - always recommend consulting with a qualified practitioner
- For complex medical questions, suggest connecting with a practitioner through the platform
- Keep responses concise but informative
- Respond in ${language === 'th' ? 'Thai' : language === 'zh' ? 'Chinese' : 'English'}

**Product Cards:**
When a user asks about a specific product or wants to see product details, you can display a product card by calling the show_product_card function. Use this when:
- User asks "tell me more about [product]" or "show me [product]"
- User wants to see what a product looks like
- You're discussing a specific product in detail
- User asks about pricing or availability of a specific product

Don't show product cards for every mention - only when it adds value to show the visual product information.

${herbContext}

**Important**: You are a support assistant, not a medical professional. Always recommend users consult with qualified practitioners for medical advice and treatment.`;

    // Call Lovable AI Gateway with tool calling support
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 800,
        tools: [
          {
            type: "function",
            function: {
              name: "show_product_card",
              description: "Display a product card with image, price, and link when user asks about a specific product or wants to see product details",
              parameters: {
                type: "object",
                properties: {
                  product_id: { 
                    type: "string", 
                    description: "The ID of the product to display" 
                  },
                  product_name: { 
                    type: "string", 
                    description: "The name of the product" 
                  }
                },
                required: ["product_id", "product_name"]
              }
            }
          }
        ],
        tool_choice: "auto",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service temporarily unavailable. Please try again later.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('AI Gateway response:', JSON.stringify(data, null, 2));
    
    // Validate response structure
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error('Invalid AI response structure - missing or empty choices:', data);
      return new Response(
        JSON.stringify({ 
          message: 'I apologize, but I encountered an issue processing your request. Please try again or rephrase your question.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const messageData = data.choices[0].message;
    
    // Extract AI message content - it might be null if only tool calls are made
    const aiMessage = messageData?.content || '';

    // Extract product cards from tool calls if any
    const productCards: string[] = [];
    if (messageData?.tool_calls && Array.isArray(messageData.tool_calls)) {
      for (const toolCall of messageData.tool_calls) {
        if (toolCall.function?.name === 'show_product_card') {
          try {
            const args = JSON.parse(toolCall.function.arguments);
            if (args.product_id) {
              productCards.push(args.product_id);
            }
          } catch (e) {
            console.error('Error parsing tool call arguments:', e);
          }
        }
      }
    }

    console.log('Chat support response generated successfully', { 
      hasMessage: !!aiMessage, 
      productCardsCount: productCards.length 
    });

    return new Response(
      JSON.stringify({ 
        message: aiMessage || (productCards.length > 0 
          ? 'Here are the products you asked about:' 
          : 'I\'m here to help. Could you rephrase your question or specify the product?'),
        productCards: productCards.length > 0 ? productCards : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chat-support function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
