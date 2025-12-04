-- Add alumni mode support to profiles table
-- This migration adds fields to track graduation status and enable business mode

-- Add has_graduated flag
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS has_graduated BOOLEAN DEFAULT false;

-- Add graduation_date
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS graduation_date TIMESTAMPTZ;

-- Add alumni_mode_enabled flag
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS alumni_mode_enabled BOOLEAN DEFAULT false;

-- Create index for quick filtering of graduates
CREATE INDEX IF NOT EXISTS idx_profiles_has_graduated ON public.profiles(has_graduated);
CREATE INDEX IF NOT EXISTS idx_profiles_alumni_mode_enabled ON public.profiles(alumni_mode_enabled);

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.has_graduated IS 'Whether the user has completed at least one course and received a certificate';
COMMENT ON COLUMN public.profiles.graduation_date IS 'Date of first certificate issuance';
COMMENT ON COLUMN public.profiles.alumni_mode_enabled IS 'Whether the user has enabled Business Mode (repurposed CRM features)';

