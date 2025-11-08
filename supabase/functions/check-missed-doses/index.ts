import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];

    console.log(`Checking for missed doses on ${yesterdayDate}`);

    // Get all active schedules for yesterday
    const { data: schedules, error: schedulesError } = await supabaseClient
      .from('treatment_schedules')
      .select('id, patient_id, medication_name')
      .eq('is_active', true)
      .lte('start_date', yesterdayDate)
      .or(`end_date.is.null,end_date.gte.${yesterdayDate}`);

    if (schedulesError) {
      throw schedulesError;
    }

    console.log(`Found ${schedules?.length || 0} active schedules to check`);

    let missedCount = 0;

    // Check each schedule for missing check-ins
    for (const schedule of schedules || []) {
      const { data: existingCheckIn } = await supabaseClient
        .from('patient_check_ins')
        .select('id')
        .eq('treatment_schedule_id', schedule.id)
        .eq('check_in_date', yesterdayDate)
        .maybeSingle();

      if (!existingCheckIn) {
        // No check-in found - create a "missed" entry
        const { error: insertError } = await supabaseClient
          .from('patient_check_ins')
          .insert({
            patient_id: schedule.patient_id,
            treatment_schedule_id: schedule.id,
            check_in_date: yesterdayDate,
            status: 'missed',
            notes: 'Automatically marked as missed',
          });

        if (insertError) {
          console.error(`Error creating missed check-in for schedule ${schedule.id}:`, insertError);
        } else {
          missedCount++;
          console.log(`Marked ${schedule.medication_name} as missed for patient ${schedule.patient_id}`);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Checked ${schedules?.length || 0} schedules, marked ${missedCount} as missed`,
        date: yesterdayDate,
        missed_count: missedCount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in check-missed-doses:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
