-- Create storage bucket for student work submissions
-- This migration creates the storage bucket and policies for student work (photos/videos)

-- Create student-work storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-work',
  'student-work',
  false,
  52428800, -- 50MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for student-work bucket
-- Students can upload their own work
CREATE POLICY "Students can upload their own work"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'student-work'
    AND (
      -- Check if the path includes their user ID or enrollment ID
      auth.uid()::text = (STRING_TO_ARRAY(name, '/'))[1]
      OR EXISTS (
        SELECT 1 FROM public.course_enrollments ce
        WHERE ce.id::text = (STRING_TO_ARRAY(name, '/'))[2]
        AND ce.user_id = auth.uid()
      )
    )
  );

-- Students can view their own work
CREATE POLICY "Students can view their own work"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'student-work'
    AND (
      auth.uid()::text = (STRING_TO_ARRAY(name, '/'))[1]
      OR EXISTS (
        SELECT 1 FROM public.course_enrollments ce
        WHERE ce.id::text = (STRING_TO_ARRAY(name, '/'))[2]
        AND ce.user_id = auth.uid()
      )
    )
  );

-- Instructors and admins can view all student work
CREATE POLICY "Instructors can view all student work"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'student-work'
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR has_role(auth.uid(), 'practitioner'::app_role)
    )
  );

-- Students can update their own work (before grading)
CREATE POLICY "Students can update their own work"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'student-work'
    AND auth.uid()::text = (STRING_TO_ARRAY(name, '/'))[1]
  );

-- Students can delete their own work (before grading)
CREATE POLICY "Students can delete their own work"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'student-work'
    AND auth.uid()::text = (STRING_TO_ARRAY(name, '/'))[1]
  );

-- Admins can manage all student work
CREATE POLICY "Admins can manage all student work"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'student-work'
    AND has_role(auth.uid(), 'admin'::app_role)
  );

