import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OnboardingData {
  role: 'patient' | 'practitioner';
  phone?: string;
  date_of_birth?: string;
  medical_history?: string;
  allergies?: string;
  email_consent?: boolean;
  specialization?: string;
  license_number?: string;
  practice_name?: string;
  years_of_experience?: number;
  bio?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const onboardingData: OnboardingData = await req.json();
    console.log('Onboarding data received for user:', user.id, 'role:', onboardingData.role);

    // Prepare update data based on role
    const updateData: any = {
      phone: onboardingData.phone || null,
    };

    if (onboardingData.role === 'patient') {
      updateData.date_of_birth = onboardingData.date_of_birth || null;
      updateData.medical_history = onboardingData.medical_history || null;
      updateData.allergies = onboardingData.allergies || null;
      updateData.email_consent = onboardingData.email_consent || false;
    } else if (onboardingData.role === 'practitioner') {
      updateData.specialization = onboardingData.specialization || null;
      updateData.license_number = onboardingData.license_number || null;
      updateData.practice_name = onboardingData.practice_name || null;
      updateData.years_of_experience = onboardingData.years_of_experience || null;
      updateData.bio = onboardingData.bio || null;
    }

    // Update user profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update profile', details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Profile updated successfully for user:', user.id);

    return new Response(
      JSON.stringify({ success: true, message: 'Onboarding completed successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in complete-onboarding function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
