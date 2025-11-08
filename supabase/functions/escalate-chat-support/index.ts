import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EscalationRequest {
  email: string;
  full_name?: string;
  subject: string;
  message_body: string;
  chat_history?: Array<{ role: string; content: string; timestamp: string }>;
  include_chat_history?: boolean;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    // Check if user is authenticated
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && user) {
        userId = user.id;
      }
    }

    const body: EscalationRequest = await req.json();

    // Validate required fields
    if (!body.email || !body.subject || !body.message_body) {
      return new Response(
        JSON.stringify({ error: 'Email, subject, and message are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email address' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs
    const sanitizedSubject = body.subject.trim().substring(0, 200);
    const sanitizedMessage = body.message_body.trim().substring(0, 2000);
    const sanitizedEmail = body.email.trim().toLowerCase();
    const sanitizedName = body.full_name?.trim().substring(0, 100);

    // Prepare chat history if included
    const chatHistory = body.include_chat_history && body.chat_history 
      ? body.chat_history 
      : null;

    let ticketId: string;
    let ticketType: 'patient' | 'guest';

    // Check if user is authenticated and has a patient record
    if (userId) {
      const { data: patient } = await supabase
        .from('patients')
        .select('id, practitioner_id')
        .eq('user_id', userId)
        .single();

      if (patient) {
        // User has a patient record - create patient message
        const { data: message, error: messageError } = await supabase
          .from('patient_messages')
          .insert({
            patient_id: patient.id,
            sender_id: userId,
            recipient_type: 'support',
            subject: sanitizedSubject,
            message_body: sanitizedMessage + (chatHistory ? '\n\n--- AI Chat History ---\n' + JSON.stringify(chatHistory, null, 2) : ''),
            is_read: false
          })
          .select('id')
          .single();

        if (messageError) {
          console.error('Error creating patient message:', messageError);
          throw messageError;
        }

        ticketId = message.id;
        ticketType = 'patient';

        console.log(`Created patient support ticket: ${ticketId}`);
      } else {
        // Authenticated user without patient record - create guest message
        const { data: guestMessage, error: guestError } = await supabase
          .from('guest_support_messages')
          .insert({
            email: sanitizedEmail,
            full_name: sanitizedName,
            subject: sanitizedSubject,
            message_body: sanitizedMessage,
            chat_history: chatHistory,
            status: 'open',
            is_read: false
          })
          .select('id')
          .single();

        if (guestError) {
          console.error('Error creating guest message:', guestError);
          throw guestError;
        }

        ticketId = guestMessage.id;
        ticketType = 'guest';

        console.log(`Created guest support ticket: ${ticketId}`);
      }
    } else {
      // Anonymous user - create guest message
      const { data: guestMessage, error: guestError } = await supabase
        .from('guest_support_messages')
        .insert({
          email: sanitizedEmail,
          full_name: sanitizedName,
          subject: sanitizedSubject,
          message_body: sanitizedMessage,
          chat_history: chatHistory,
          status: 'open',
          is_read: false
        })
        .select('id')
        .single();

      if (guestError) {
        console.error('Error creating guest message:', guestError);
        throw guestError;
      }

      ticketId = guestMessage.id;
      ticketType = 'guest';

      console.log(`Created guest support ticket: ${ticketId}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        ticket_id: ticketId,
        ticket_type: ticketType,
        message: 'Support request submitted successfully. You will receive a response via email within 24 hours.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in escalate-chat-support:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to submit support request',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});