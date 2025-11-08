import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { sanitizeHTML, validateURL, validateInput } from "../_shared/sanitize.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('send-recommendation-email: function invoked');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    console.log('send-recommendation-email: RESEND_API_KEY present?', !!resendApiKey);
    
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { recommendation_id, checkout_url, optional_message } = await req.json();
    console.log('send-recommendation-email: processing recommendation', recommendation_id);

    if (!recommendation_id || !checkout_url) {
      throw new Error('recommendation_id and checkout_url are required');
    }

    // Validate and sanitize inputs
    const sanitizedCheckoutUrl = validateURL(checkout_url, ['lovable.app', 'lovable.dev', 'xcherbs.com']);
    const sanitizedOptionalMessage = optional_message ? validateInput(optional_message, 1000) : '';

    // Fetch recommendation details with patient and practitioner info
    const { data: recommendation, error: recError } = await supabase
      .from('recommendations')
      .select(`
        id,
        title,
        diagnosis,
        instructions,
        total_cost,
        patient_id,
        practitioner_id,
        patients!inner(full_name, email),
        profiles!recommendations_practitioner_id_fkey(full_name)
      `)
      .eq('id', recommendation_id)
      .single();

    if (recError || !recommendation) {
      console.error('send-recommendation-email: recommendation fetch error', recError);
      throw new Error('Recommendation not found');
    }

    const patient = Array.isArray(recommendation.patients) ? recommendation.patients[0] : recommendation.patients;
    const practitioner = Array.isArray(recommendation.profiles) ? recommendation.profiles[0] : recommendation.profiles;

    console.log('send-recommendation-email: patient email available?', !!patient.email);
    
    if (!patient.email) {
      throw new Error('Patient email not found');
    }

    // Fetch herbs in recommendation
    const { data: items, error: itemsError } = await supabase
      .from('recommendation_items')
      .select(`
        quantity,
        dosage_instructions,
        herbs(name, thai_name)
      `)
      .eq('recommendation_id', recommendation_id);

    if (itemsError) {
      console.error('Error fetching items:', itemsError);
    }

    const herbsList = items?.map(item => {
      const herb = Array.isArray(item.herbs) ? item.herbs[0] : item.herbs;
      return `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">
          ${herb.name} ${herb.thai_name ? `(${herb.thai_name})` : ''}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">
          ${item.quantity}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">
          ${item.dosage_instructions || 'As prescribed'}
        </td>
      </tr>
    `;
    }).join('') || '';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">New Prescription</h1>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px; margin-bottom: 20px;">Hello ${patient.full_name},</p>
            
            <p style="margin-bottom: 20px;">
              ${practitioner?.full_name || 'Your practitioner'} has prepared a personalized herbal prescription for you.
            </p>

            ${recommendation.diagnosis ? `
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="margin-top: 0; color: #667eea;">Diagnosis</h3>
                <p style="margin-bottom: 0;">${sanitizeHTML(recommendation.diagnosis)}</p>
              </div>
            ` : ''}

            ${recommendation.instructions ? `
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="margin-top: 0; color: #667eea;">Instructions</h3>
                <p style="margin-bottom: 0;">${sanitizeHTML(recommendation.instructions)}</p>
              </div>
            ` : ''}

            ${sanitizedOptionalMessage ? `
              <div style="background: #fff9e6; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
                <p style="margin: 0; font-style: italic;">"${sanitizeHTML(sanitizedOptionalMessage)}"</p>
              </div>
            ` : ''}

            ${items && items.length > 0 ? `
              <h3 style="color: #667eea;">Prescribed Herbs</h3>
              <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                <thead>
                  <tr style="background: #f8f9fa;">
                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Herb</th>
                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Quantity</th>
                    <th style="padding: 10px; text-align: left; border-bottom: 2px solid #dee2e6;">Dosage</th>
                  </tr>
                </thead>
                <tbody>
                  ${herbsList}
                </tbody>
              </table>
            ` : ''}

            <div style="text-align: center; margin: 30px 0;">
              <a href="${sanitizedCheckoutUrl}"
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 40px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        display: inline-block; 
                        font-weight: bold;
                        font-size: 16px;">
                View &amp; Complete Your Order
              </a>
            </div>

            <p style="color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              This link will expire in 7 days. If you have any questions, please contact your practitioner.
            </p>
          </div>
        </body>
      </html>
    `;

    console.log('send-recommendation-email: attempting to send email to', patient.email);
    
    const { error: emailError } = await resend.emails.send({
      from: "Health Recommendations <noreply@xcherbs.com>",
      to: [patient.email],
      subject: `New Prescription from ${practitioner?.full_name || 'Your Practitioner'}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error('send-recommendation-email: Resend API error:', JSON.stringify(emailError));
      throw new Error(`Failed to send email: ${emailError.message || 'Unknown Resend error'}`);
    }
    
    console.log('send-recommendation-email: email sent successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('send-recommendation-email: FATAL ERROR:', error);
    console.error('send-recommendation-email: error type:', typeof error);
    console.error('send-recommendation-email: error details:', error instanceof Error ? {
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