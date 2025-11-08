-- Add is_private field to visit_notes table
ALTER TABLE public.visit_notes 
ADD COLUMN is_private boolean NOT NULL DEFAULT false;

-- Create admin_audit_log table
CREATE TABLE public.admin_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  record_type text NOT NULL,
  record_id uuid,
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on admin_audit_log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
ON public.admin_audit_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
ON public.admin_audit_log
FOR INSERT
WITH CHECK (admin_id = auth.uid() AND has_role(auth.uid(), 'admin'::app_role));

-- Update patient view policy for visit_notes to exclude private notes
DROP POLICY IF EXISTS "Patients can view their visit notes" ON public.visit_notes;

CREATE POLICY "Patients can view their non-private visit notes"
ON public.visit_notes
FOR SELECT
USING (
  has_role(auth.uid(), 'patient'::app_role) 
  AND is_private = false
  AND EXISTS (
    SELECT 1
    FROM patient_visits pv
    JOIN patients p ON p.id = pv.patient_id
    WHERE pv.id = visit_notes.visit_id 
    AND p.user_id = auth.uid()
  )
);

-- Create index for better performance
CREATE INDEX idx_visit_notes_is_private ON public.visit_notes(is_private);
CREATE INDEX idx_admin_audit_log_admin_id ON public.admin_audit_log(admin_id);
CREATE INDEX idx_admin_audit_log_patient_id ON public.admin_audit_log(patient_id);
CREATE INDEX idx_admin_audit_log_created_at ON public.admin_audit_log(created_at DESC);