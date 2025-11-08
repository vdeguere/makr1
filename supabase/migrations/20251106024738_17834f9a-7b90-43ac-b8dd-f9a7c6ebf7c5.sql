-- Fix RLS policies for page_analytics to allow proper insertion
-- Drop restrictive policies
DROP POLICY IF EXISTS "Users can insert their own page views" ON public.page_analytics;
DROP POLICY IF EXISTS "Anonymous users can insert page views" ON public.page_analytics;
DROP POLICY IF EXISTS "Users can update their own page analytics" ON public.page_analytics;
DROP POLICY IF EXISTS "Anonymous users can update page analytics" ON public.page_analytics;

-- Create more permissive policies for authenticated users
CREATE POLICY "Authenticated users can insert page views"
ON public.page_analytics
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update page analytics"
ON public.page_analytics
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow anonymous users to track page views
CREATE POLICY "Anonymous users can insert page views"
ON public.page_analytics
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

CREATE POLICY "Anonymous users can update their page analytics"
ON public.page_analytics
FOR UPDATE
TO anon
USING (user_id IS NULL)
WITH CHECK (user_id IS NULL);