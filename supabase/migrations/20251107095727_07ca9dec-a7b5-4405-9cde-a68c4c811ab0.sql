-- Add target_audience enum and column to courses table
CREATE TYPE public.course_audience AS ENUM ('practitioner', 'patient', 'both');

ALTER TABLE public.courses 
ADD COLUMN target_audience public.course_audience NOT NULL DEFAULT 'practitioner';

-- Update RLS policies on courses table
DROP POLICY IF EXISTS "Practitioners can view published courses" ON public.courses;

-- New policy: Users can view published courses targeted to their role
CREATE POLICY "Users can view published courses for their role"
ON public.courses
FOR SELECT
TO authenticated
USING (
  is_published = true 
  AND (
    target_audience = 'both'
    OR (target_audience = 'practitioner' AND has_role(auth.uid(), 'practitioner'))
    OR (target_audience = 'patient' AND has_role(auth.uid(), 'patient'))
  )
);

-- Update course_enrollments RLS policies
DROP POLICY IF EXISTS "Practitioners can enroll themselves" ON public.course_enrollments;

-- New policy: Users can enroll in appropriate courses
CREATE POLICY "Users can enroll in appropriate courses"
ON public.course_enrollments
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM courses
    WHERE courses.id = course_enrollments.course_id
    AND courses.is_published = true
    AND (
      (courses.target_audience = 'practitioner' AND has_role(auth.uid(), 'practitioner'))
      OR (courses.target_audience = 'patient' AND has_role(auth.uid(), 'patient'))
      OR courses.target_audience = 'both'
    )
  )
);