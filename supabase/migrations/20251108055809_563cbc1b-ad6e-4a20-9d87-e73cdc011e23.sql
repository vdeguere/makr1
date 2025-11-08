-- Add profile_picture_url column to patients table
ALTER TABLE public.patients 
ADD COLUMN profile_picture_url TEXT;

-- Create patient-avatars storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'patient-avatars',
  'patient-avatars',
  true,
  2097152, -- 2MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- RLS policies for patient-avatars bucket
-- Practitioners can upload avatars for their own patients
CREATE POLICY "Practitioners can upload avatars for their patients"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'patient-avatars' AND
  has_role(auth.uid(), 'practitioner'::app_role) AND
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id::text = (storage.foldername(name))[1]
    AND patients.practitioner_id = auth.uid()
  )
);

-- Practitioners can view avatars for their own patients
CREATE POLICY "Practitioners can view avatars for their patients"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'patient-avatars' AND
  has_role(auth.uid(), 'practitioner'::app_role) AND
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id::text = (storage.foldername(name))[1]
    AND patients.practitioner_id = auth.uid()
  )
);

-- Admins can manage all avatars
CREATE POLICY "Admins can manage all avatars"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'patient-avatars' AND
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  bucket_id = 'patient-avatars' AND
  has_role(auth.uid(), 'admin'::app_role)
);

-- Patients can view their own avatar
CREATE POLICY "Patients can view their own avatar"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'patient-avatars' AND
  has_role(auth.uid(), 'patient'::app_role) AND
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id::text = (storage.foldername(name))[1]
    AND patients.user_id = auth.uid()
  )
);

-- Practitioners can delete avatars for their patients
CREATE POLICY "Practitioners can delete avatars for their patients"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'patient-avatars' AND
  has_role(auth.uid(), 'practitioner'::app_role) AND
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id::text = (storage.foldername(name))[1]
    AND patients.practitioner_id = auth.uid()
  )
);