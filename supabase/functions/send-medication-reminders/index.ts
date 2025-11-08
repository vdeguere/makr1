import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TreatmentSchedule {
  id: string;
  medication_name: string;
  dosage: string;
  times_of_day: string[];
  patients: {
    id: string;
    full_name: string;
    email: string;
    line_user_id: string;
    user_id: string;
  };
  reminder_settings: {
    enabled: boolean;
    reminder_methods: string[];
    advance_notice_minutes: number;
    quiet_hours_start: string;
    quiet_hours_end: string;
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    const todayDate = now.toISOString().split('T')[0];

    console.log(`Checking for medication reminders at ${currentTime}`);

    // Get all active schedules with reminder settings
    const { data: schedules, error: schedulesError } = await supabaseClient
      .from('treatment_schedules')
      .select(`
        id,
        medication_name,
        dosage,
        times_of_day,
        patients!inner (
          id,
          full_name,
          email,
          line_user_id,
          user_id
        ),
        reminder_settings!inner (
          enabled,
          reminder_methods,
          advance_notice_minutes,
          quiet_hours_start,
          quiet_hours_end
        )
      `)
      .eq('is_active', true)
      .eq('reminder_settings.enabled', true)
      .lte('start_date', todayDate)
      .or(`end_date.is.null,end_date.gte.${todayDate}`);

    if (schedulesError) {
      throw schedulesError;
    }

    console.log(`Found ${schedules?.length || 0} active schedules with reminders`);

    let remindersSent = 0;

    // Process each schedule
    for (const schedule of (schedules as any[]) || []) {
      const reminderSettings = schedule.reminder_settings;
      const advanceMinutes = reminderSettings.advance_notice_minutes || 15;

      // Check if we're in quiet hours
      const quietStart = reminderSettings.quiet_hours_start || '22:00';
      const quietEnd = reminderSettings.quiet_hours_end || '07:00';
      
      if (isInQuietHours(currentTime, quietStart, quietEnd)) {
        console.log(`Skipping reminder for ${schedule.medication_name} - quiet hours`);
        continue;
      }

      // Check if any scheduled time is coming up
      for (const scheduledTime of schedule.times_of_day || []) {
        if (shouldSendReminder(currentTime, scheduledTime, advanceMinutes)) {
          // Check if already checked in for today
          const { data: existingCheckIn } = await supabaseClient
            .from('patient_check_ins')
            .select('id')
            .eq('treatment_schedule_id', schedule.id)
            .eq('check_in_date', todayDate)
            .maybeSingle();

          if (existingCheckIn) {
            console.log(`Skipping - already checked in for ${schedule.medication_name}`);
            continue;
          }

          // Send reminders based on methods
          const methods = reminderSettings.reminder_methods || ['in_app'];
          
          if (methods.includes('email') && schedule.patients.email) {
            await sendEmailReminder(schedule, scheduledTime);
            remindersSent++;
          }

          if (methods.includes('line') && schedule.patients.line_user_id) {
            await sendLineReminder(schedule, scheduledTime);
            remindersSent++;
          }

          // In-app notifications would be handled by the frontend
          console.log(`Sent reminder for ${schedule.medication_name} to ${schedule.patients.full_name}`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Checked ${schedules?.length || 0} schedules, sent ${remindersSent} reminders`,
        reminders_sent: remindersSent,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in send-medication-reminders:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function isInQuietHours(currentTime: string, quietStart: string, quietEnd: string): boolean {
  const current = parseTime(currentTime);
  const start = parseTime(quietStart);
  const end = parseTime(quietEnd);

  if (start < end) {
    // Normal case: e.g., 22:00 to 07:00 doesn't cross midnight
    return current >= start && current <= end;
  } else {
    // Crosses midnight
    return current >= start || current <= end;
  }
}

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

function shouldSendReminder(currentTime: string, scheduledTime: string, advanceMinutes: number): boolean {
  const currentMinutes = parseTime(currentTime);
  const scheduledMinutes = parseTime(scheduledTime);
  const reminderTime = scheduledMinutes - advanceMinutes;

  // Send reminder if we're within 5 minutes of the reminder time
  return Math.abs(currentMinutes - reminderTime) <= 5;
}

async function sendEmailReminder(schedule: any, scheduledTime: string) {
  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const siteUrl = Deno.env.get('PUBLIC_SITE_URL') || 'http://localhost:8080';

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'Medication Reminders <noreply@xcherbs.com>',
        to: schedule.patients.email,
        subject: `Medication Reminder: ${schedule.medication_name}`,
        html: `
          <h2>Time for Your Medication</h2>
          <p>Hi ${schedule.patients.full_name},</p>
          <p>This is a reminder to take your medication:</p>
          <ul>
            <li><strong>Medication:</strong> ${schedule.medication_name}</li>
            <li><strong>Dosage:</strong> ${schedule.dosage}</li>
            <li><strong>Scheduled Time:</strong> ${scheduledTime}</li>
          </ul>
          <p><a href="${siteUrl}/health-records?tab=adherence">Log your check-in now</a></p>
          <p>Stay consistent with your treatment plan! 🔥</p>
        `,
      }),
    });

    if (!response.ok) {
      throw new Error(`Resend API error: ${response.statusText}`);
    }

    console.log(`Email reminder sent to ${schedule.patients.email}`);
  } catch (error) {
    console.error('Failed to send email reminder:', error);
  }
}

async function sendLineReminder(schedule: any, scheduledTime: string) {
  try {
    const lineToken = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN');
    if (!lineToken) {
      console.warn('LINE_CHANNEL_ACCESS_TOKEN not configured');
      return;
    }

    const message = {
      to: schedule.patients.line_user_id,
      messages: [
        {
          type: 'text',
          text: `⏰ Medication Reminder\n\n${schedule.medication_name}\nDosage: ${schedule.dosage}\nTime: ${scheduledTime}\n\nDon't forget to check in! 🔥`,
        },
      ],
    };

    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lineToken}`,
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      throw new Error(`LINE API error: ${response.statusText}`);
    }

    console.log(`LINE reminder sent to ${schedule.patients.line_user_id}`);
  } catch (error) {
    console.error('Failed to send LINE reminder:', error);
  }
}
