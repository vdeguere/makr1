import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { sanitizeForLINE, validateURL, validateInput } from "../_shared/sanitize.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('send-recommendation-line: function invoked');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LINE_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
    console.log('send-recommendation-line: LINE_CHANNEL_ACCESS_TOKEN present?', !!LINE_TOKEN);
    
    if (!LINE_TOKEN) {
      throw new Error('LINE_CHANNEL_ACCESS_TOKEN not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { recommendation_id, checkout_url, optional_message, token } = await req.json();
    console.log('send-recommendation-line: processing recommendation', recommendation_id);

    if (!recommendation_id || !checkout_url || !token) {
      throw new Error('recommendation_id, checkout_url, and token are required');
    }

    // Validate and sanitize inputs
    const sanitizedCheckoutUrl = validateURL(checkout_url, ['lovable.app', 'lovable.dev', 'xcherbs.com']);
    const sanitizedOptionalMessage = optional_message ? validateInput(optional_message, 1000) : '';
    console.log('send-recommendation-line: checkout URL validated');

    // Generate PromptPay QR code
    console.log('send-recommendation-line: generating PromptPay QR code');
    const qrGenResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-promptpay-qr`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({ recommendation_id, token }),
      }
    );

    if (!qrGenResponse.ok) {
      const errorText = await qrGenResponse.text();
      console.error('send-recommendation-line: generate-promptpay-qr failed', errorText);
      throw new Error(`Failed to generate PromptPay QR code: ${errorText}`);
    }

    const { qr_code_url, payment_intent_id, amount } = await qrGenResponse.json();
    console.log('send-recommendation-line: QR code generated', payment_intent_id);

    // Fetch recommendation details with patient info and items
    const { data: recommendation, error: recError } = await supabase
      .from('recommendations')
      .select(`
        id,
        title,
        diagnosis,
        instructions,
        patients!inner(full_name, line_user_id),
        profiles!recommendations_practitioner_id_fkey(full_name)
      `)
      .eq('id', recommendation_id)
      .single();

    // Fetch recommendation items for display
    const { data: items, error: itemsError } = await supabase
      .from('recommendation_items')
      .select(`
        quantity,
        unit_price,
        dosage_instructions,
        herbs:herb_id (
          name,
          thai_name
        )
      `)
      .eq('recommendation_id', recommendation_id);

    if (itemsError) {
      console.error('send-recommendation-line: items fetch error', itemsError);
    }

    const totalCost = items?.reduce((sum: number, item: any) => {
      return sum + (Number(item.unit_price) * Number(item.quantity));
    }, 0) || 0;

    if (recError || !recommendation) {
      console.error('send-recommendation-line: recommendation fetch error', recError);
      throw new Error('Recommendation not found');
    }

    const patient = Array.isArray(recommendation.patients) ? recommendation.patients[0] : recommendation.patients;
    const practitioner = Array.isArray(recommendation.profiles) ? recommendation.profiles[0] : recommendation.profiles;

    console.log('send-recommendation-line: patient LINE ID available?', !!patient.line_user_id);
    
    if (!patient.line_user_id) {
      throw new Error('Patient LINE user ID not found');
    }

    // Build item bubbles for prescription details
    const itemBubbles = (items || []).map((item: any) => {
      const herbName = item.herbs?.name || 'Unknown Herb';
      const thaiName = item.herbs?.thai_name;
      const displayName = thaiName ? `${herbName} (${thaiName})` : herbName;
      
      return {
        type: "box",
        layout: "horizontal",
        contents: [
          {
            type: "text",
            text: displayName,
            size: "sm",
            color: "#555555",
            flex: 3,
            wrap: true
          },
          {
            type: "text",
            text: `x${item.quantity}`,
            size: "sm",
            color: "#111111",
            flex: 1,
            align: "end"
          },
          {
            type: "text",
            text: `฿${(Number(item.unit_price) * Number(item.quantity)).toFixed(2)}`,
            size: "sm",
            color: "#111111",
            weight: "bold",
            flex: 1,
            align: "end"
          }
        ]
      };
    });

    // Build LINE Flex Message
    const flexMessage = {
      type: "bubble",
      hero: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "💊 คำสั่งยาจากคุณหมอ",
            weight: "bold",
            size: "xl",
            color: "#ffffff",
            align: "center"
          },
          {
            type: "text",
            text: `จาก ${practitioner?.full_name || 'คุณหมอ'}`,
            size: "sm",
            color: "#ffffff",
            align: "center",
            margin: "sm"
          }
        ],
        backgroundColor: "#2E7D32",
        paddingAll: "20px"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: recommendation.title,
            weight: "bold",
            size: "lg",
            color: "#2E7D32",
            wrap: true
          },
          {
            type: "separator",
            margin: "md"
          },
          ...(recommendation.diagnosis ? [{
            type: "box",
            layout: "vertical",
            margin: "md",
            spacing: "xs",
            contents: [
              {
                type: "text",
                text: "การวินิจฉัย (Diagnosis):",
                color: "#666666",
                size: "sm",
                weight: "bold"
              },
              {
                type: "text",
                text: sanitizeForLINE(recommendation.diagnosis),
                size: "sm",
                color: "#111111",
                wrap: true
              }
            ]
          }] : []),
          ...(recommendation.instructions ? [{
            type: "box",
            layout: "vertical",
            margin: "md",
            spacing: "xs",
            contents: [
              {
                type: "text",
                text: "คำแนะนำ (Instructions):",
                color: "#666666",
                size: "sm",
                weight: "bold"
              },
              {
                type: "text",
                text: sanitizeForLINE(recommendation.instructions),
                size: "sm",
                color: "#111111",
                wrap: true
              }
            ]
          }] : []),
          {
            type: "separator",
            margin: "md"
          },
          {
            type: "text",
            text: "รายการยา (Herbs):",
            weight: "bold",
            size: "sm",
            color: "#2E7D32",
            margin: "md"
          },
          {
            type: "box",
            layout: "vertical",
            margin: "sm",
            spacing: "sm",
            contents: itemBubbles
          },
          {
            type: "separator",
            margin: "md"
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "md",
            contents: [
              {
                type: "text",
                text: "ยอดรวมทั้งหมด:",
                size: "md",
                color: "#555555",
                weight: "bold",
                flex: 0
              },
              {
                type: "text",
                text: `฿${totalCost.toFixed(2)}`,
                size: "xl",
                color: "#2E7D32",
                weight: "bold",
                align: "end"
              }
            ]
          },
          ...(sanitizedOptionalMessage ? [{
            type: "box",
            layout: "vertical",
            margin: "lg",
            backgroundColor: "#FFF9E6",
            cornerRadius: "8px",
            paddingAll: "12px",
            contents: [
              {
                type: "text",
                text: "💬 ข้อความจากคุณหมอ:",
                size: "xs",
                color: "#666666",
                weight: "bold",
                margin: "none"
              },
              {
                type: "text",
                text: sanitizeForLINE(sanitizedOptionalMessage),
                size: "sm",
                color: "#666666",
                wrap: true,
                margin: "xs"
              }
            ]
          }] : [])
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "text",
            text: "📱 QR Code สำหรับชำระเงินจะถูกส่งในข้อความถัดไป",
            size: "xs",
            color: "#2E7D32",
            weight: "bold",
            align: "center",
            wrap: true
          },
          {
            type: "button",
            style: "link",
            height: "sm",
            action: {
              type: "uri",
              label: "ดูรายละเอียดเต็ม",
              uri: sanitizedCheckoutUrl
            }
          }
        ],
        flex: 0
      }
    };

    // Send prescription details
    console.log('send-recommendation-line: sending prescription details to LINE');
    
    const lineResponse = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_TOKEN}`
      },
      body: JSON.stringify({
        to: patient.line_user_id,
        messages: [
          {
            type: 'flex',
            altText: `💊 คำสั่งยาใหม่จาก ${practitioner?.full_name || 'คุณหมอ'}`,
            contents: flexMessage
          }
        ]
      })
    });

    if (!lineResponse.ok) {
      const errorData = await lineResponse.text();
      console.error('send-recommendation-line: LINE API error:', errorData);
      throw new Error(`Failed to send prescription: ${lineResponse.status}`);
    }
    
    console.log('send-recommendation-line: prescription sent successfully');

    // Send PromptPay QR code as separate image message
    console.log('send-recommendation-line: sending PromptPay QR code');
    
    const qrImageMessage = {
      type: 'image',
      originalContentUrl: qr_code_url,
      previewImageUrl: qr_code_url,
    };

    const qrTextMessage = {
      type: 'text',
      text: `💳 ชำระเงิน ฿${amount.toFixed(2)} ผ่าน PromptPay\n\n` +
            `📱 สแกน QR Code ด้านบนด้วยแอปธนาคารของคุณ\n` +
            `⏰ QR Code หมดอายุใน 24 ชั่วโมง\n\n` +
            `✅ ระบบจะส่งการแจ้งเตือนอัตโนมัติเมื่อชำระเงินสำเร็จ`,
    };

    const qrResponse = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_TOKEN}`
      },
      body: JSON.stringify({
        to: patient.line_user_id,
        messages: [qrImageMessage, qrTextMessage],
      })
    });

    if (!qrResponse.ok) {
      const errorText = await qrResponse.text();
      console.error('send-recommendation-line: Failed to send QR code:', errorText);
      throw new Error(`Failed to send QR code: ${qrResponse.status}`);
    }

    console.log('send-recommendation-line: QR code sent successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'LINE message sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('send-recommendation-line: FATAL ERROR:', error);
    console.error('send-recommendation-line: error type:', typeof error);
    console.error('send-recommendation-line: error details:', error instanceof Error ? {
      message: error.message,
      name: error.name,
      stack: error.stack
    } : error);
    
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