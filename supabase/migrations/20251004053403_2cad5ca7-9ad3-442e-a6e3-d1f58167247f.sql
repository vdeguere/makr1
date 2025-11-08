-- Allow patients to upload documents to their own medical file
CREATE POLICY "Patients can upload their own documents"
ON public.patient_documents
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'patient'::app_role) 
  AND EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.id = patient_documents.patient_id 
    AND patients.user_id = auth.uid()
  )
);

-- Allow patients to delete their own uploaded documents
CREATE POLICY "Patients can delete their own uploaded documents"
ON public.patient_documents
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'patient'::app_role) 
  AND EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.id = patient_documents.patient_id 
    AND patients.user_id = auth.uid()
  )
);

-- Storage policies for patient-documents bucket
-- Allow patients to upload files to their own folder
CREATE POLICY "Patients can upload files to patient-documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'patient-documents'
  AND EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.user_id = auth.uid()
    AND (storage.foldername(name))[1] = patients.id::text
  )
);

-- Allow patients to view their own documents in storage
CREATE POLICY "Patients can view files in patient-documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'patient-documents'
  AND EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.user_id = auth.uid()
    AND (storage.foldername(name))[1] = patients.id::text
  )
);

-- Allow patients to delete their own uploaded documents from storage
CREATE POLICY "Patients can delete files in patient-documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'patient-documents'
  AND EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.user_id = auth.uid()
    AND (storage.foldername(name))[1] = patients.id::text
  )
);

-- Allow practitioners to manage documents in patient folders
CREATE POLICY "Practitioners can upload to patient-documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'patient-documents'
  AND has_role(auth.uid(), 'practitioner'::app_role)
  AND EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.practitioner_id = auth.uid()
    AND (storage.foldername(name))[1] = patients.id::text
  )
);

CREATE POLICY "Practitioners can view patient-documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'patient-documents'
  AND has_role(auth.uid(), 'practitioner'::app_role)
  AND EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.practitioner_id = auth.uid()
    AND (storage.foldername(name))[1] = patients.id::text
  )
);

CREATE POLICY "Practitioners can delete patient-documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'patient-documents'
  AND has_role(auth.uid(), 'practitioner'::app_role)
  AND EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.practitioner_id = auth.uid()
    AND (storage.foldername(name))[1] = patients.id::text
  )
);

-- Allow admins full access to patient documents storage
CREATE POLICY "Admins can manage patient-documents storage"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'patient-documents'
  AND has_role(auth.uid(), 'admin'::app_role)
);