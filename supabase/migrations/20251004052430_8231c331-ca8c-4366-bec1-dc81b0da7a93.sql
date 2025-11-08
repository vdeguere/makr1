-- Create patient_visits table
CREATE TABLE public.patient_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  practitioner_id uuid NOT NULL,
  visit_date timestamp with time zone NOT NULL DEFAULT now(),
  chief_complaint text NOT NULL,
  visit_type text NOT NULL DEFAULT 'consultation',
  duration_minutes integer,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create visit_notes table (SOAP format)
CREATE TABLE public.visit_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL REFERENCES public.patient_visits(id) ON DELETE CASCADE,
  subjective text,
  objective text,
  assessment text,
  plan text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create patient_vital_signs table
CREATE TABLE public.patient_vital_signs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  recorded_at timestamp with time zone NOT NULL DEFAULT now(),
  recorded_by uuid NOT NULL,
  blood_pressure_systolic integer,
  blood_pressure_diastolic integer,
  heart_rate integer,
  temperature numeric(4,1),
  weight numeric(5,2),
  height numeric(5,2),
  respiratory_rate integer,
  oxygen_saturation integer,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create patient_documents table
CREATE TABLE public.patient_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL,
  document_name text NOT NULL,
  document_type text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  file_path text NOT NULL,
  file_size integer,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_patient_visits_patient_id ON public.patient_visits(patient_id);
CREATE INDEX idx_patient_visits_practitioner_id ON public.patient_visits(practitioner_id);
CREATE INDEX idx_patient_visits_visit_date ON public.patient_visits(visit_date);
CREATE INDEX idx_visit_notes_visit_id ON public.visit_notes(visit_id);
CREATE INDEX idx_patient_vital_signs_patient_id ON public.patient_vital_signs(patient_id);
CREATE INDEX idx_patient_vital_signs_recorded_at ON public.patient_vital_signs(recorded_at);
CREATE INDEX idx_patient_documents_patient_id ON public.patient_documents(patient_id);

-- Enable RLS
ALTER TABLE public.patient_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patient_visits
CREATE POLICY "Practitioners can view their patients visits"
ON public.patient_visits FOR SELECT
USING (
  has_role(auth.uid(), 'practitioner'::app_role) 
  AND EXISTS (
    SELECT 1 FROM public.patients 
    WHERE patients.id = patient_visits.patient_id 
    AND patients.practitioner_id = auth.uid()
  )
);

CREATE POLICY "Practitioners can create visits for their patients"
ON public.patient_visits FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'practitioner'::app_role) 
  AND practitioner_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.patients 
    WHERE patients.id = patient_visits.patient_id 
    AND patients.practitioner_id = auth.uid()
  )
);

CREATE POLICY "Practitioners can update their patients visits"
ON public.patient_visits FOR UPDATE
USING (
  has_role(auth.uid(), 'practitioner'::app_role) 
  AND practitioner_id = auth.uid()
);

CREATE POLICY "Patients can view their own visits"
ON public.patient_visits FOR SELECT
USING (
  has_role(auth.uid(), 'patient'::app_role) 
  AND EXISTS (
    SELECT 1 FROM public.patients 
    WHERE patients.id = patient_visits.patient_id 
    AND patients.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all visits"
ON public.patient_visits FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for visit_notes
CREATE POLICY "Practitioners can manage visit notes"
ON public.visit_notes FOR ALL
USING (
  has_role(auth.uid(), 'practitioner'::app_role) 
  AND EXISTS (
    SELECT 1 FROM public.patient_visits pv
    JOIN public.patients p ON p.id = pv.patient_id
    WHERE pv.id = visit_notes.visit_id 
    AND p.practitioner_id = auth.uid()
  )
);

CREATE POLICY "Patients can view their visit notes"
ON public.visit_notes FOR SELECT
USING (
  has_role(auth.uid(), 'patient'::app_role) 
  AND EXISTS (
    SELECT 1 FROM public.patient_visits pv
    JOIN public.patients p ON p.id = pv.patient_id
    WHERE pv.id = visit_notes.visit_id 
    AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all visit notes"
ON public.visit_notes FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for patient_vital_signs
CREATE POLICY "Practitioners can view vital signs for their patients"
ON public.patient_vital_signs FOR SELECT
USING (
  has_role(auth.uid(), 'practitioner'::app_role) 
  AND EXISTS (
    SELECT 1 FROM public.patients 
    WHERE patients.id = patient_vital_signs.patient_id 
    AND patients.practitioner_id = auth.uid()
  )
);

CREATE POLICY "Practitioners can create vital signs for their patients"
ON public.patient_vital_signs FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'practitioner'::app_role) 
  AND recorded_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.patients 
    WHERE patients.id = patient_vital_signs.patient_id 
    AND patients.practitioner_id = auth.uid()
  )
);

CREATE POLICY "Patients can view their own vital signs"
ON public.patient_vital_signs FOR SELECT
USING (
  has_role(auth.uid(), 'patient'::app_role) 
  AND EXISTS (
    SELECT 1 FROM public.patients 
    WHERE patients.id = patient_vital_signs.patient_id 
    AND patients.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all vital signs"
ON public.patient_vital_signs FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for patient_documents
CREATE POLICY "Practitioners can view documents for their patients"
ON public.patient_documents FOR SELECT
USING (
  has_role(auth.uid(), 'practitioner'::app_role) 
  AND EXISTS (
    SELECT 1 FROM public.patients 
    WHERE patients.id = patient_documents.patient_id 
    AND patients.practitioner_id = auth.uid()
  )
);

CREATE POLICY "Practitioners can upload documents for their patients"
ON public.patient_documents FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'practitioner'::app_role) 
  AND uploaded_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.patients 
    WHERE patients.id = patient_documents.patient_id 
    AND patients.practitioner_id = auth.uid()
  )
);

CREATE POLICY "Practitioners can delete documents for their patients"
ON public.patient_documents FOR DELETE
USING (
  has_role(auth.uid(), 'practitioner'::app_role) 
  AND uploaded_by = auth.uid()
);

CREATE POLICY "Patients can view their own documents"
ON public.patient_documents FOR SELECT
USING (
  has_role(auth.uid(), 'patient'::app_role) 
  AND EXISTS (
    SELECT 1 FROM public.patients 
    WHERE patients.id = patient_documents.patient_id 
    AND patients.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all documents"
ON public.patient_documents FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for patient documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('patient-documents', 'patient-documents', false);

-- Storage RLS policies
CREATE POLICY "Practitioners can upload documents for their patients"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'patient-documents' 
  AND has_role(auth.uid(), 'practitioner'::app_role)
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.patients WHERE practitioner_id = auth.uid()
  )
);

CREATE POLICY "Practitioners can view documents for their patients"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'patient-documents' 
  AND has_role(auth.uid(), 'practitioner'::app_role)
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.patients WHERE practitioner_id = auth.uid()
  )
);

CREATE POLICY "Patients can view their own documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'patient-documents' 
  AND has_role(auth.uid(), 'patient'::app_role)
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM public.patients WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all patient documents"
ON storage.objects FOR ALL
USING (
  bucket_id = 'patient-documents' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_patient_visits_updated_at
BEFORE UPDATE ON public.patient_visits
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_visit_notes_updated_at
BEFORE UPDATE ON public.visit_notes
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_patient_documents_updated_at
BEFORE UPDATE ON public.patient_documents
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();