-- Create patient wellness surveys table for tracking patient health progress
CREATE TABLE public.patient_wellness_surveys (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  recommendation_id uuid REFERENCES public.recommendations(id) ON DELETE SET NULL,
  overall_feeling integer NOT NULL CHECK (overall_feeling >= 1 AND overall_feeling <= 5),
  symptom_improvement integer NOT NULL CHECK (symptom_improvement >= 1 AND symptom_improvement <= 5),
  treatment_satisfaction integer NOT NULL CHECK (treatment_satisfaction >= 1 AND treatment_satisfaction <= 5),
  energy_levels integer NOT NULL CHECK (energy_levels >= 1 AND energy_levels <= 5),
  sleep_quality integer NOT NULL CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patient_wellness_surveys ENABLE ROW LEVEL SECURITY;

-- Patients can insert their own surveys
CREATE POLICY "Patients can create their own wellness surveys"
ON public.patient_wellness_surveys
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'patient'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = patient_wellness_surveys.patient_id
    AND patients.user_id = auth.uid()
  )
);

-- Patients can view their own surveys
CREATE POLICY "Patients can view their own wellness surveys"
ON public.patient_wellness_surveys
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'patient'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = patient_wellness_surveys.patient_id
    AND patients.user_id = auth.uid()
  )
);

-- Practitioners can view surveys for their patients
CREATE POLICY "Practitioners can view their patients wellness surveys"
ON public.patient_wellness_surveys
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'practitioner'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = patient_wellness_surveys.patient_id
    AND patients.practitioner_id = auth.uid()
  )
);

-- Admins can manage all surveys
CREATE POLICY "Admins can manage all wellness surveys"
ON public.patient_wellness_surveys
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));