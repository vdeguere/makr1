-- Create patient connection tokens table
CREATE TABLE public.patient_connection_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  connection_type TEXT NOT NULL CHECK (connection_type IN ('account_signup', 'line_connect')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.patient_connection_tokens ENABLE ROW LEVEL SECURITY;

-- Public can read valid tokens by token value (for verification)
CREATE POLICY "Public can read valid tokens by token value"
ON public.patient_connection_tokens
FOR SELECT
USING (
  expires_at > NOW() 
  AND used_at IS NULL
);

-- Practitioners can view tokens for their patients
CREATE POLICY "Practitioners can view their patient tokens"
ON public.patient_connection_tokens
FOR SELECT
USING (
  has_role(auth.uid(), 'practitioner'::app_role)
  AND EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = patient_connection_tokens.patient_id
    AND patients.practitioner_id = auth.uid()
  )
);

-- Admins can view all tokens
CREATE POLICY "Admins can view all tokens"
ON public.patient_connection_tokens
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Practitioners can create tokens for their patients
CREATE POLICY "Practitioners can create tokens for their patients"
ON public.patient_connection_tokens
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'practitioner'::app_role)
  AND created_by = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = patient_connection_tokens.patient_id
    AND patients.practitioner_id = auth.uid()
  )
);

-- Admins can create tokens
CREATE POLICY "Admins can create tokens"
ON public.patient_connection_tokens
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND created_by = auth.uid()
);

-- System can update tokens (mark as used)
CREATE POLICY "System can update tokens"
ON public.patient_connection_tokens
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Create index for faster token lookups
CREATE INDEX idx_patient_connection_tokens_token ON public.patient_connection_tokens(token);
CREATE INDEX idx_patient_connection_tokens_patient_id ON public.patient_connection_tokens(patient_id);