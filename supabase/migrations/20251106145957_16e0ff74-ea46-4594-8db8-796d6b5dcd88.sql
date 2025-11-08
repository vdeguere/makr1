-- =====================================================
-- PATIENT TREATMENT ADHERENCE TRACKING SYSTEM
-- =====================================================

-- Create treatment schedules table
CREATE TABLE IF NOT EXISTS public.treatment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL REFERENCES public.recommendations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  herb_id UUID REFERENCES public.herbs(id) ON DELETE SET NULL,
  
  -- Schedule details
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('once_daily', 'twice_daily', 'three_times_daily', 'as_needed')),
  times_of_day TEXT[] NOT NULL DEFAULT '{}',
  
  -- Duration
  start_date DATE NOT NULL,
  end_date DATE,
  
  -- Instructions
  instructions TEXT,
  take_with_food BOOLEAN DEFAULT false,
  special_instructions TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for treatment_schedules
CREATE INDEX idx_treatment_schedules_patient ON public.treatment_schedules(patient_id);
CREATE INDEX idx_treatment_schedules_recommendation ON public.treatment_schedules(recommendation_id);
CREATE INDEX idx_treatment_schedules_active ON public.treatment_schedules(is_active, start_date, end_date);

-- Create daily check-ins table
CREATE TABLE IF NOT EXISTS public.patient_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  treatment_schedule_id UUID REFERENCES public.treatment_schedules(id) ON DELETE SET NULL,
  
  -- Check-in data
  check_in_date DATE NOT NULL,
  check_in_time TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('taken', 'missed', 'skipped', 'delayed')),
  taken_at_time TEXT,
  
  -- Feedback
  side_effects TEXT,
  effectiveness_rating INTEGER CHECK (effectiveness_rating BETWEEN 1 AND 5),
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Unique constraint: one check-in per schedule per day
  UNIQUE(treatment_schedule_id, check_in_date)
);

-- Create indexes for patient_check_ins
CREATE INDEX idx_check_ins_patient_date ON public.patient_check_ins(patient_id, check_in_date DESC);
CREATE INDEX idx_check_ins_schedule ON public.patient_check_ins(treatment_schedule_id, check_in_date);
CREATE INDEX idx_check_ins_status ON public.patient_check_ins(status, check_in_date);

-- Create adherence streaks table
CREATE TABLE IF NOT EXISTS public.adherence_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  treatment_schedule_id UUID REFERENCES public.treatment_schedules(id) ON DELETE CASCADE,
  
  -- Streak tracking
  current_streak INTEGER DEFAULT 0 NOT NULL,
  longest_streak INTEGER DEFAULT 0 NOT NULL,
  last_check_in_date DATE,
  
  -- Statistics
  total_check_ins INTEGER DEFAULT 0 NOT NULL,
  total_missed INTEGER DEFAULT 0 NOT NULL,
  adherence_rate NUMERIC(5,2) DEFAULT 0.00 NOT NULL,
  
  -- Metadata
  streak_start_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Unique per patient per schedule
  UNIQUE(patient_id, treatment_schedule_id)
);

-- Create indexes for adherence_streaks
CREATE INDEX idx_streaks_patient ON public.adherence_streaks(patient_id);
CREATE INDEX idx_streaks_current ON public.adherence_streaks(current_streak DESC);

-- Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Achievement details
  achievement_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Criteria
  criteria_type TEXT NOT NULL CHECK (criteria_type IN ('streak', 'total_count', 'rate', 'milestone')),
  criteria_value INTEGER NOT NULL,
  
  -- Visual
  icon_name TEXT NOT NULL,
  color TEXT DEFAULT '#10b981',
  tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
  
  -- Order
  display_order INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create patient achievements table
CREATE TABLE IF NOT EXISTS public.patient_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  
  -- Earning details
  earned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  progress_value INTEGER,
  
  -- Status
  is_viewed BOOLEAN DEFAULT false,
  
  UNIQUE(patient_id, achievement_id)
);

-- Create indexes for patient_achievements
CREATE INDEX idx_patient_achievements_patient ON public.patient_achievements(patient_id, earned_at DESC);
CREATE INDEX idx_patient_achievements_viewed ON public.patient_achievements(is_viewed, patient_id);

-- Create reminder settings table
CREATE TABLE IF NOT EXISTS public.reminder_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  
  -- Reminder preferences
  enabled BOOLEAN DEFAULT true,
  reminder_methods TEXT[] DEFAULT ARRAY['in_app'],
  
  -- Timing
  advance_notice_minutes INTEGER DEFAULT 15,
  enable_morning_summary BOOLEAN DEFAULT true,
  morning_summary_time TEXT DEFAULT '08:00',
  
  -- Quiet hours
  quiet_hours_start TEXT DEFAULT '22:00',
  quiet_hours_end TEXT DEFAULT '07:00',
  
  -- Follow-up reminders
  send_missed_reminder BOOLEAN DEFAULT true,
  missed_reminder_delay_minutes INTEGER DEFAULT 60,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(patient_id)
);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.treatment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adherence_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;

-- Treatment Schedules RLS Policies
CREATE POLICY "Patients can view their own treatment schedules"
  ON public.treatment_schedules FOR SELECT
  USING (
    has_role(auth.uid(), 'patient'::app_role) 
    AND EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = treatment_schedules.patient_id 
      AND patients.user_id = auth.uid()
    )
  );

CREATE POLICY "Practitioners can view their patients treatment schedules"
  ON public.treatment_schedules FOR SELECT
  USING (
    has_role(auth.uid(), 'practitioner'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = treatment_schedules.patient_id 
      AND patients.practitioner_id = auth.uid()
    )
  );

CREATE POLICY "Practitioners can create treatment schedules"
  ON public.treatment_schedules FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'practitioner'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = treatment_schedules.patient_id 
      AND patients.practitioner_id = auth.uid()
    )
  );

CREATE POLICY "Practitioners can update treatment schedules"
  ON public.treatment_schedules FOR UPDATE
  USING (
    has_role(auth.uid(), 'practitioner'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = treatment_schedules.patient_id 
      AND patients.practitioner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all treatment schedules"
  ON public.treatment_schedules FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Patient Check-ins RLS Policies
CREATE POLICY "Patients can create check-ins"
  ON public.patient_check_ins FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'patient'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = patient_check_ins.patient_id 
      AND patients.user_id = auth.uid()
    )
  );

CREATE POLICY "Patients can view their check-ins"
  ON public.patient_check_ins FOR SELECT
  USING (
    has_role(auth.uid(), 'patient'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = patient_check_ins.patient_id 
      AND patients.user_id = auth.uid()
    )
  );

CREATE POLICY "Practitioners can view patient check-ins"
  ON public.patient_check_ins FOR SELECT
  USING (
    has_role(auth.uid(), 'practitioner'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = patient_check_ins.patient_id 
      AND patients.practitioner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all check-ins"
  ON public.patient_check_ins FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Adherence Streaks RLS Policies
CREATE POLICY "Patients can view their streaks"
  ON public.adherence_streaks FOR SELECT
  USING (
    has_role(auth.uid(), 'patient'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = adherence_streaks.patient_id 
      AND patients.user_id = auth.uid()
    )
  );

CREATE POLICY "Practitioners can view patient streaks"
  ON public.adherence_streaks FOR SELECT
  USING (
    has_role(auth.uid(), 'practitioner'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = adherence_streaks.patient_id 
      AND patients.practitioner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all streaks"
  ON public.adherence_streaks FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Achievements RLS Policies (public read for definitions)
CREATE POLICY "Anyone can view achievement definitions"
  ON public.achievements FOR SELECT
  USING (true);

-- Patient Achievements RLS Policies
CREATE POLICY "Patients can view their achievements"
  ON public.patient_achievements FOR SELECT
  USING (
    has_role(auth.uid(), 'patient'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = patient_achievements.patient_id 
      AND patients.user_id = auth.uid()
    )
  );

CREATE POLICY "Patients can update their achievement view status"
  ON public.patient_achievements FOR UPDATE
  USING (
    has_role(auth.uid(), 'patient'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = patient_achievements.patient_id 
      AND patients.user_id = auth.uid()
    )
  );

CREATE POLICY "Practitioners can view patient achievements"
  ON public.patient_achievements FOR SELECT
  USING (
    has_role(auth.uid(), 'practitioner'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = patient_achievements.patient_id 
      AND patients.practitioner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all achievements"
  ON public.patient_achievements FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Reminder Settings RLS Policies
CREATE POLICY "Patients can manage their reminder settings"
  ON public.reminder_settings FOR ALL
  USING (
    has_role(auth.uid(), 'patient'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = reminder_settings.patient_id 
      AND patients.user_id = auth.uid()
    )
  )
  WITH CHECK (
    has_role(auth.uid(), 'patient'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = reminder_settings.patient_id 
      AND patients.user_id = auth.uid()
    )
  );

CREATE POLICY "Practitioners can view patient reminder settings"
  ON public.reminder_settings FOR SELECT
  USING (
    has_role(auth.uid(), 'practitioner'::app_role)
    AND EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = reminder_settings.patient_id 
      AND patients.practitioner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all reminder settings"
  ON public.reminder_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- DATABASE FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update adherence streaks
CREATE OR REPLACE FUNCTION public.update_adherence_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_streak INTEGER := 0;
  v_last_check_in DATE;
  v_consecutive BOOLEAN;
BEGIN
  -- Get current streak data
  SELECT current_streak, last_check_in_date
  INTO v_current_streak, v_last_check_in
  FROM public.adherence_streaks
  WHERE patient_id = NEW.patient_id 
    AND treatment_schedule_id = NEW.treatment_schedule_id;
  
  -- Check if this is consecutive
  IF v_last_check_in IS NULL THEN
    v_consecutive := true;
  ELSIF NEW.check_in_date = v_last_check_in + INTERVAL '1 day' THEN
    v_consecutive := true;
  ELSE
    v_consecutive := false;
  END IF;
  
  -- Update or insert streak
  INSERT INTO public.adherence_streaks (
    patient_id, 
    treatment_schedule_id, 
    current_streak, 
    longest_streak,
    last_check_in_date,
    total_check_ins,
    total_missed,
    streak_start_date
  )
  VALUES (
    NEW.patient_id,
    NEW.treatment_schedule_id,
    CASE WHEN NEW.status = 'taken' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'taken' THEN 1 ELSE 0 END,
    NEW.check_in_date,
    CASE WHEN NEW.status = 'taken' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status IN ('missed', 'skipped') THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'taken' THEN NEW.check_in_date ELSE NULL END
  )
  ON CONFLICT (patient_id, treatment_schedule_id)
  DO UPDATE SET
    current_streak = CASE 
      WHEN NEW.status = 'taken' AND v_consecutive THEN adherence_streaks.current_streak + 1
      WHEN NEW.status = 'taken' THEN 1
      ELSE 0
    END,
    longest_streak = GREATEST(
      adherence_streaks.longest_streak,
      CASE 
        WHEN NEW.status = 'taken' AND v_consecutive THEN adherence_streaks.current_streak + 1
        WHEN NEW.status = 'taken' THEN 1
        ELSE adherence_streaks.longest_streak
      END
    ),
    last_check_in_date = NEW.check_in_date,
    total_check_ins = adherence_streaks.total_check_ins + CASE WHEN NEW.status = 'taken' THEN 1 ELSE 0 END,
    total_missed = adherence_streaks.total_missed + CASE WHEN NEW.status IN ('missed', 'skipped') THEN 1 ELSE 0 END,
    adherence_rate = ROUND(
      (adherence_streaks.total_check_ins + CASE WHEN NEW.status = 'taken' THEN 1 ELSE 0 END)::NUMERIC / 
      (adherence_streaks.total_check_ins + adherence_streaks.total_missed + 1)::NUMERIC * 100, 
      2
    ),
    streak_start_date = CASE
      WHEN NEW.status = 'taken' AND NOT v_consecutive THEN NEW.check_in_date
      ELSE adherence_streaks.streak_start_date
    END,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Create trigger for streak updates
CREATE TRIGGER on_check_in_update_streak
  AFTER INSERT ON public.patient_check_ins
  FOR EACH ROW
  EXECUTE FUNCTION public.update_adherence_streak();

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION public.check_and_award_achievements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_achievement RECORD;
BEGIN
  -- Loop through all active achievements
  FOR v_achievement IN 
    SELECT * FROM public.achievements WHERE is_active = true
  LOOP
    -- Check streak-based achievements
    IF v_achievement.criteria_type = 'streak' THEN
      IF NEW.current_streak >= v_achievement.criteria_value THEN
        INSERT INTO public.patient_achievements (patient_id, achievement_id, progress_value)
        VALUES (NEW.patient_id, v_achievement.id, NEW.current_streak)
        ON CONFLICT (patient_id, achievement_id) DO NOTHING;
      END IF;
    
    -- Check total count achievements
    ELSIF v_achievement.criteria_type = 'total_count' THEN
      IF NEW.total_check_ins >= v_achievement.criteria_value THEN
        INSERT INTO public.patient_achievements (patient_id, achievement_id, progress_value)
        VALUES (NEW.patient_id, v_achievement.id, NEW.total_check_ins)
        ON CONFLICT (patient_id, achievement_id) DO NOTHING;
      END IF;
    
    -- Check adherence rate achievements
    ELSIF v_achievement.criteria_type = 'rate' THEN
      IF NEW.adherence_rate >= v_achievement.criteria_value THEN
        INSERT INTO public.patient_achievements (patient_id, achievement_id, progress_value)
        VALUES (NEW.patient_id, v_achievement.id, NEW.adherence_rate)
        ON CONFLICT (patient_id, achievement_id) DO NOTHING;
      END IF;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger for achievement checks
CREATE TRIGGER on_streak_update_check_achievements
  AFTER INSERT OR UPDATE ON public.adherence_streaks
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_award_achievements();

-- =====================================================
-- SEED DEFAULT ACHIEVEMENTS
-- =====================================================

INSERT INTO public.achievements (achievement_key, name, description, criteria_type, criteria_value, icon_name, color, tier, display_order) VALUES
  ('first_check_in', 'First Step', 'Completed your first medication check-in', 'total_count', 1, 'CheckCircle', '#10b981', 'bronze', 1),
  ('week_streak', 'Week Warrior', 'Maintained a 7-day streak', 'streak', 7, 'Flame', '#f59e0b', 'silver', 2),
  ('two_week_streak', 'Fortnight Fighter', 'Maintained a 14-day streak', 'streak', 14, 'Zap', '#f59e0b', 'silver', 3),
  ('month_streak', 'Monthly Master', 'Maintained a 30-day streak', 'streak', 30, 'Award', '#eab308', 'gold', 4),
  ('perfect_week', 'Perfect Week', '100% adherence for 7 days', 'rate', 100, 'Star', '#eab308', 'gold', 5),
  ('hundred_check_ins', 'Century Club', 'Completed 100 check-ins', 'total_count', 100, 'TrendingUp', '#3b82f6', 'platinum', 6),
  ('three_month_streak', 'Quarter Champion', 'Maintained a 90-day streak', 'streak', 90, 'Trophy', '#a855f7', 'platinum', 7),
  ('high_adherence', 'Consistency King', 'Maintained 90% adherence rate', 'rate', 90, 'Crown', '#ec4899', 'platinum', 8)
ON CONFLICT (achievement_key) DO NOTHING;