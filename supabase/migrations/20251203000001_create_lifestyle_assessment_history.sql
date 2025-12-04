-- Create lifestyle_assessment_history table to track changes over time
CREATE TABLE IF NOT EXISTS public.lifestyle_assessment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  lifestyle_data JSONB NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_lifestyle_history_patient_id ON public.lifestyle_assessment_history(patient_id);
CREATE INDEX IF NOT EXISTS idx_lifestyle_history_created_at ON public.lifestyle_assessment_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lifestyle_history_changed_by ON public.lifestyle_assessment_history(changed_by);

-- Enable RLS
ALTER TABLE public.lifestyle_assessment_history ENABLE ROW LEVEL SECURITY;

-- Policy: Practitioners and admins can view history for their patients
CREATE POLICY "Practitioners can view lifestyle history for their patients"
  ON public.lifestyle_assessment_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = lifestyle_assessment_history.patient_id
      AND (
        patients.practitioner_id = auth.uid()
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'dev'::app_role)
      )
    )
  );

-- Policy: Practitioners and admins can insert history
CREATE POLICY "Practitioners can insert lifestyle history"
  ON public.lifestyle_assessment_history
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = lifestyle_assessment_history.patient_id
      AND (
        patients.practitioner_id = auth.uid()
        OR has_role(auth.uid(), 'admin'::app_role)
        OR has_role(auth.uid(), 'dev'::app_role)
      )
    )
  );

-- Policy: Admins can delete history
CREATE POLICY "Admins can delete lifestyle history"
  ON public.lifestyle_assessment_history
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'dev'::app_role));

