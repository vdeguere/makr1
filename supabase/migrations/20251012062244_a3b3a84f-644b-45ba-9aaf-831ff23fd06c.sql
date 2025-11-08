-- Drop the problematic public policies that cause infinite recursion
DROP POLICY IF EXISTS "Public can view recommendations via valid checkout link" ON public.recommendations;
DROP POLICY IF EXISTS "Public can view recommendation items via valid checkout link" ON public.recommendation_items;
DROP POLICY IF EXISTS "Public can view patients via valid checkout link" ON public.patients;
DROP POLICY IF EXISTS "Public can view profiles via valid checkout link" ON public.profiles;
DROP POLICY IF EXISTS "Public can view herbs via valid checkout link" ON public.herbs;

-- Create a security definer function to check for valid checkout links
-- This bypasses RLS and prevents infinite recursion
CREATE OR REPLACE FUNCTION public.has_valid_checkout_link(_recommendation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.recommendation_links
    WHERE recommendation_id = _recommendation_id
    AND expires_at > NOW()
    AND used_at IS NULL
  )
$$;

-- Recreate public policies using the security definer function
CREATE POLICY "Public can view recommendations via valid checkout link"
  ON public.recommendations FOR SELECT
  USING (public.has_valid_checkout_link(id));

CREATE POLICY "Public can view recommendation items via valid checkout link"
  ON public.recommendation_items FOR SELECT
  USING (public.has_valid_checkout_link(recommendation_id));

CREATE POLICY "Public can view patients via valid checkout link"
  ON public.patients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recommendations r
      WHERE r.patient_id = patients.id
      AND public.has_valid_checkout_link(r.id)
    )
  );

CREATE POLICY "Public can view profiles via valid checkout link"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recommendations r
      WHERE r.practitioner_id = profiles.id
      AND public.has_valid_checkout_link(r.id)
    )
  );

CREATE POLICY "Public can view herbs via valid checkout link"
  ON public.herbs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recommendation_items ri
      WHERE ri.herb_id = herbs.id
      AND public.has_valid_checkout_link(ri.recommendation_id)
    )
  );