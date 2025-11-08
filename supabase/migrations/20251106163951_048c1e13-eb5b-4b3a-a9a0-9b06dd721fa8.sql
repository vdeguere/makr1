-- Phase 2: Practitioner Certifications table
CREATE TABLE IF NOT EXISTS public.practitioner_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certification_name TEXT NOT NULL,
  issuing_organization TEXT NOT NULL,
  certification_number TEXT,
  issue_date DATE NOT NULL,
  expiry_date DATE,
  credential_type TEXT NOT NULL DEFAULT 'certification',
  file_path TEXT,
  verification_url TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  is_verified BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX idx_practitioner_certifications_user_id ON public.practitioner_certifications(user_id);
CREATE INDEX idx_practitioner_certifications_status ON public.practitioner_certifications(status);
CREATE INDEX idx_practitioner_certifications_expiry ON public.practitioner_certifications(expiry_date);

-- RLS policies for practitioner_certifications
ALTER TABLE public.practitioner_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own certifications"
  ON public.practitioner_certifications
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own certifications"
  ON public.practitioner_certifications
  FOR INSERT
  WITH CHECK (user_id = auth.uid() AND has_role(auth.uid(), 'practitioner'::app_role));

CREATE POLICY "Users can update their own certifications"
  ON public.practitioner_certifications
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all certifications"
  ON public.practitioner_certifications
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Patients can view verified practitioner certifications"
  ON public.practitioner_certifications
  FOR SELECT
  USING (is_verified = true AND status = 'active');

-- Phase 3: Add certificate criteria to courses table
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS requires_certificate BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS certificate_criteria JSONB DEFAULT '{
  "minimum_score": 70,
  "required_quizzes": true,
  "minimum_quiz_score": 70,
  "requires_final_exam": false,
  "time_limit_days": null
}'::jsonb;

-- Phase 5: Certificate Templates table
CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  template_type TEXT NOT NULL DEFAULT 'course',
  design_config JSONB DEFAULT '{
    "backgroundColor": "#ffffff",
    "borderColor": "#0EA5E9",
    "primaryFont": "serif",
    "secondaryFont": "sans-serif",
    "layout": "classic"
  }'::jsonb,
  svg_template TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS policies for certificate_templates
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage templates"
  ON public.certificate_templates
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view templates"
  ON public.certificate_templates
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Add index for certificate verification lookups
CREATE INDEX IF NOT EXISTS idx_course_certificates_verification_code 
  ON public.course_certificates(verification_code);

-- Add template_id to course_certificates
ALTER TABLE public.course_certificates 
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.certificate_templates(id);

-- Update timestamp trigger for new tables
CREATE TRIGGER update_practitioner_certifications_updated_at
  BEFORE UPDATE ON public.practitioner_certifications
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_certificate_templates_updated_at
  BEFORE UPDATE ON public.certificate_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create storage bucket for practitioner credentials
INSERT INTO storage.buckets (id, name, public)
VALUES ('practitioner-credentials', 'practitioner-credentials', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for practitioner credentials
CREATE POLICY "Practitioners can upload their credentials"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'practitioner-credentials' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Practitioners can view their credentials"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'practitioner-credentials' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all credentials"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'practitioner-credentials' 
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can delete their credentials"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'practitioner-credentials' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );