-- Add user_id column to patients table to link patient records with user accounts
ALTER TABLE public.patients 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add unique constraint to ensure one patient record per user
ALTER TABLE public.patients 
ADD CONSTRAINT patients_user_id_unique UNIQUE (user_id);

-- Create index for better query performance
CREATE INDEX idx_patients_user_id ON public.patients(user_id);

-- Update RLS policy to allow patients to view their own record via user_id
CREATE POLICY "Patients can view their linked patient record"
ON public.patients
FOR SELECT
USING (
  has_role(auth.uid(), 'patient'::app_role) 
  AND user_id = auth.uid()
);