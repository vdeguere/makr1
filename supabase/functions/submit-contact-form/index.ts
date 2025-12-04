import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";
import { validateInput, sanitizeHTML } from "../_shared/sanitize.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting: max 3 submissions per hour from same IP/email
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_SUBMISSIONS_PER_WINDOW = 3;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { name, email, subject, message } = await req.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: 'All fields are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate and sanitize inputs
    const sanitizedName = validateInput(name.trim(), 200);
    const sanitizedEmail = validateInput(email.trim().toLowerCase(), 255);
    const sanitizedSubject = validateInput(subject.trim(), 200);
    const sanitizedMessage = validateInput(message.trim(), 5000);

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitizedEmail)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get IP address and user agent for rate limiting
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Rate limiting: Check recent submissions from same email or IP
    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    
    const { count: recentCount, error: rateLimitError } = await supabase
      .from('contact_submissions')
      .select('*', { count: 'exact', head: true })
      .or(`email.eq.${sanitizedEmail},ip_address.eq.${ipAddress}`)
      .gte('created_at', oneHourAgo);

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
    }

    if (recentCount && recentCount >= MAX_SUBMISSIONS_PER_WINDOW) {
      return new Response(
        JSON.stringify({ 
          error: 'Too many submissions. Please wait before submitting again.' 
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Insert submission into database
    const { data: submission, error: insertError } = await supabase
      .from('contact_submissions')
      .insert([{
        name: sanitizedName,
        email: sanitizedEmail,
        subject: sanitizedSubject,
        message: sanitizedMessage,
        ip_address: ipAddress,
        user_agent: userAgent,
        status: 'new',
        is_read: false,
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting contact submission:', insertError);
      throw new Error('Failed to save submission');
    }

    // Send email notification to admin team
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      try {
        const adminEmail = Deno.env.get("ADMIN_EMAIL") || "support@xianherbs.com";
        
        const emailHtml = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">New Contact Form Submission</h1>
              </div>
              
              <div style="background: white; padding: 30px; border: 1px solid #eee; border-top: none; border-radius: 0 0 10px 10px;">
                <p style="font-size: 16px; margin-bottom: 20px;">
                  You have received a new message from the contact form.
                </p>

                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                  <p style="margin: 5px 0;"><strong>Name:</strong> ${sanitizeHTML(sanitizedName)}</p>
                  <p style="margin: 5px 0;"><strong>Email:</strong> ${sanitizeHTML(sanitizedEmail)}</p>
                  <p style="margin: 5px 0;"><strong>Subject:</strong> ${sanitizeHTML(sanitizedSubject)}</p>
                </div>

                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                  <h3 style="margin-top: 0; color: #667eea;">Message</h3>
                  <p style="margin-bottom: 0; white-space: pre-wrap;">${sanitizeHTML(sanitizedMessage)}</p>
                </div>

                <p style="color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                  Submission ID: ${submission.id}<br>
                  Submitted at: ${new Date().toLocaleString()}
                </p>
              </div>
            </body>
          </html>
        `;

        await resend.emails.send({
          from: "Contact Form <noreply@xcherbs.com>",
          to: [adminEmail],
          replyTo: sanitizedEmail,
          subject: `New Contact Form: ${sanitizedSubject}`,
          html: emailHtml,
        });
      } catch (emailError) {
        // Log email error but don't fail the submission
        console.error('Error sending notification email:', emailError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Thank you for your message. We will get back to you soon.' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('submit-contact-form: ERROR:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Failed to submit form. Please try again later.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

