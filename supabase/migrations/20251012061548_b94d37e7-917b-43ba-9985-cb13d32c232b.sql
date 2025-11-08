-- Allow public to view recommendations via valid checkout links
CREATE POLICY "Public can view recommendations via valid checkout link"
  ON public.recommendations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recommendation_links 
      WHERE recommendation_links.recommendation_id = recommendations.id
      AND recommendation_links.expires_at > NOW() 
      AND recommendation_links.used_at IS NULL
    )
  );

-- Allow public to view recommendation items via valid checkout links
CREATE POLICY "Public can view recommendation items via valid checkout link"
  ON public.recommendation_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recommendation_links rl
      JOIN public.recommendations r ON r.id = rl.recommendation_id
      WHERE r.id = recommendation_items.recommendation_id
      AND rl.expires_at > NOW() 
      AND rl.used_at IS NULL
    )
  );

-- Allow public to view patient names via valid checkout links
CREATE POLICY "Public can view patients via valid checkout link"
  ON public.patients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recommendation_links rl
      JOIN public.recommendations r ON r.id = rl.recommendation_id
      WHERE r.patient_id = patients.id
      AND rl.expires_at > NOW() 
      AND rl.used_at IS NULL
    )
  );

-- Allow public to view practitioner profiles via valid checkout links
CREATE POLICY "Public can view profiles via valid checkout link"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recommendation_links rl
      JOIN public.recommendations r ON r.id = rl.recommendation_id
      WHERE r.practitioner_id = profiles.id
      AND rl.expires_at > NOW() 
      AND rl.used_at IS NULL
    )
  );

-- Allow public to view herbs for valid checkout links
CREATE POLICY "Public can view herbs via valid checkout link"
  ON public.herbs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recommendation_links rl
      JOIN public.recommendations r ON r.id = rl.recommendation_id
      JOIN public.recommendation_items ri ON ri.recommendation_id = r.id
      WHERE ri.herb_id = herbs.id
      AND rl.expires_at > NOW() 
      AND rl.used_at IS NULL
    )
  );
