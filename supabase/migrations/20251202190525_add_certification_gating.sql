-- Add certification gating to products
-- This migration adds fields to gate product purchases based on certifications

-- Check if course_certificates table exists, if not create a reference
-- Note: course_certificates should already exist from course migrations
-- We'll reference it, but if it doesn't exist, this will need to be created first

-- Add required_certification_id to herbs table
-- This references course_certificates.id (which links to course_enrollments)
-- Note: We'll use course_id from course_certificates to check if user has completed that course
ALTER TABLE public.herbs 
  ADD COLUMN IF NOT EXISTS required_certification_id UUID REFERENCES public.course_certificates(id) ON DELETE SET NULL;

-- Add safety_waiver_required flag
ALTER TABLE public.herbs 
  ADD COLUMN IF NOT EXISTS safety_waiver_required BOOLEAN DEFAULT false;

-- Create user_certifications junction table if it doesn't exist
-- This tracks which users have which certificates
CREATE TABLE IF NOT EXISTS public.user_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  certificate_id UUID REFERENCES public.course_certificates(id) ON DELETE CASCADE NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  issued_by UUID REFERENCES public.profiles(id),
  UNIQUE(user_id, certificate_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_herbs_required_certification_id ON public.herbs(required_certification_id);
CREATE INDEX IF NOT EXISTS idx_user_certifications_user_id ON public.user_certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_certifications_certificate_id ON public.user_certifications(certificate_id);

-- Enable RLS on user_certifications
ALTER TABLE public.user_certifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_certifications
CREATE POLICY "Users can view their own certifications"
  ON public.user_certifications
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'practitioner'::app_role)
  );

CREATE POLICY "System can create certifications"
  ON public.user_certifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage certifications"
  ON public.user_certifications
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add comments for documentation
COMMENT ON COLUMN public.herbs.required_certification_id IS 'Certificate ID required to purchase this product. NULL means no restriction.';
COMMENT ON COLUMN public.herbs.safety_waiver_required IS 'Whether a safety waiver is required before purchase';
COMMENT ON TABLE public.user_certifications IS 'Junction table tracking which users have which certificates';

