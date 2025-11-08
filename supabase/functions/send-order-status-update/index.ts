import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

    const { order_id } = await req.json();

    if (!order_id) {
      throw new Error('order_id is required');
    }

    // Fetch order details with courier information
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        tracking_number,
        courier_name,
        courier_tracking_url,
        estimated_delivery_date,
        patients!inner(full_name, email, line_user_id)
      `)
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      throw new Error('Order not found');
    }

    const getStatusDisplayName = (status: string): string => {
      const statusMap: Record<string, string> = {
        'pending': 'Order Received',
        'processing': 'Processing',
        'shipped': 'Shipped',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled',
      };
      return statusMap[status] || status;
    };

    const patient = Array.isArray(order.patients) ? order.patients[0] : order.patients;
    const statusText = getStatusDisplayName(order.status);

    // Send email if patient has email
    if (patient.email) {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0;">Order Status Update</h1>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #eee; border-top: none;">
              <p>Hello ${patient.full_name},</p>
              
              <p>Your order status has been updated:</p>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Order ID:</strong> #${order.id.slice(0, 8)}</p>
                <p style="margin: 10px 0 0 0;"><strong>Status:</strong> 
                  <span style="color: #667eea; font-weight: bold;">${statusText}</span>
                </p>
                ${order.courier_name ? `
                  <p style="margin: 10px 0 0 0;"><strong>Courier:</strong> ${order.courier_name}</p>
                ` : ''}
                ${order.tracking_number ? `
                  <p style="margin: 10px 0 0 0;"><strong>Tracking Number:</strong> ${order.tracking_number}</p>
                ` : ''}
                ${order.courier_tracking_url ? `
                  <p style="margin: 10px 0 0 0;">
                    <a href="${order.courier_tracking_url}" style="color: #667eea; text-decoration: none;">
                      Track Your Package →
                    </a>
                  </p>
                ` : ''}
                ${order.estimated_delivery_date ? `
                  <p style="margin: 10px 0 0 0;"><strong>Est. Delivery:</strong> ${new Date(order.estimated_delivery_date).toLocaleDateString()}</p>
                ` : ''}
              </div>

              ${order.status === 'shipped' && order.tracking_number ? `
                <p>Your order has been shipped${order.courier_name ? ` via ${order.courier_name}` : ''}! ${order.courier_tracking_url ? `<a href="${order.courier_tracking_url}" style="color: #667eea;">Track your package here</a>.` : 'You can track your package using the tracking number above.'}</p>
              ` : ''}
              
              <p style="color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                Thank you for your order!
              </p>
            </div>
          </body>
        </html>
      `;

      await resend.emails.send({
        from: "Order Updates <noreply@xcherbs.com>",
        to: [patient.email],
        subject: `Order Update - ${statusText}`,
        html: emailHtml,
      });
    }

    // Send LINE message if patient has LINE ID
    if (patient.line_user_id) {
      const LINE_TOKEN = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
      
      if (LINE_TOKEN) {
        await fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${LINE_TOKEN}`
          },
          body: JSON.stringify({
            to: patient.line_user_id,
            messages: [
              {
                type: 'text',
                text: `✅ Order Update #${order.id.slice(0, 8)}\n\nStatus: ${statusText}${order.courier_name ? `\n📦 Courier: ${order.courier_name}` : ''}${order.tracking_number ? `\n🔢 Tracking: ${order.tracking_number}` : ''}${order.courier_tracking_url ? `\n🔗 Track: ${order.courier_tracking_url}` : ''}${order.estimated_delivery_date ? `\n📅 Est. Delivery: ${new Date(order.estimated_delivery_date).toLocaleDateString()}` : ''}`
              }
            ]
          })
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in send-order-status-update:', error);
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