-- Restrict public link-based read policies to the anon DB role to avoid recursion for authenticated users

-- Recommendations
DROP POLICY IF EXISTS "Public can view recommendations via valid checkout link" ON public.recommendations;
CREATE POLICY "Public can view recommendations via valid checkout link"
  ON public.recommendations FOR SELECT
  TO anon
  USING (public.has_valid_checkout_link(id));

-- Recommendation Items
DROP POLICY IF EXISTS "Public can view recommendation items via valid checkout link" ON public.recommendation_items;
CREATE POLICY "Public can view recommendation items via valid checkout link"
  ON public.recommendation_items FOR SELECT
  TO anon
  USING (public.has_valid_checkout_link(recommendation_id));

-- Patients
DROP POLICY IF EXISTS "Public can view patients via valid checkout link" ON public.patients;
CREATE POLICY "Public can view patients via valid checkout link"
  ON public.patients FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.recommendations r
      WHERE r.patient_id = patients.id
      AND public.has_valid_checkout_link(r.id)
    )
  );

-- Profiles (practitioners)
DROP POLICY IF EXISTS "Public can view profiles via valid checkout link" ON public.profiles;
CREATE POLICY "Public can view profiles via valid checkout link"
  ON public.profiles FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.recommendations r
      WHERE r.practitioner_id = profiles.id
      AND public.has_valid_checkout_link(r.id)
    )
  );

-- Herbs
DROP POLICY IF EXISTS "Public can view herbs via valid checkout link" ON public.herbs;
CREATE POLICY "Public can view herbs via valid checkout link"
  ON public.herbs FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.recommendation_items ri
      WHERE ri.herb_id = herbs.id
      AND public.has_valid_checkout_link(ri.recommendation_id)
    )
  );