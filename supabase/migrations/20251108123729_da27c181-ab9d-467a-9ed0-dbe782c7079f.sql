-- Create course_sections table for organizing lessons into modules
CREATE TABLE IF NOT EXISTS public.course_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add section_id to course_lessons table
ALTER TABLE public.course_lessons 
ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.course_sections(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_course_sections_course_id ON public.course_sections(course_id);
CREATE INDEX IF NOT EXISTS idx_course_sections_display_order ON public.course_sections(course_id, display_order);
CREATE INDEX IF NOT EXISTS idx_course_lessons_section_id ON public.course_lessons(section_id);

-- Enable RLS
ALTER TABLE public.course_sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_sections
CREATE POLICY "Admins can manage all sections"
  ON public.course_sections
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Enrolled users can view published sections"
  ON public.course_sections
  FOR SELECT
  TO authenticated
  USING (
    is_published = true 
    AND EXISTS (
      SELECT 1 FROM public.course_enrollments
      WHERE course_enrollments.course_id = course_sections.course_id
      AND course_enrollments.user_id = auth.uid()
    )
  );

-- Create trigger for updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_course_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_course_sections_updated_at
  BEFORE UPDATE ON public.course_sections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_course_sections_updated_at();

-- Migrate existing lessons to default sections
DO $$
DECLARE
  course_record RECORD;
  default_section_id UUID;
BEGIN
  FOR course_record IN 
    SELECT DISTINCT course_id FROM public.course_lessons WHERE section_id IS NULL
  LOOP
    -- Create a default section for each course with lessons
    INSERT INTO public.course_sections (course_id, title, description, display_order, is_published)
    VALUES (
      course_record.course_id,
      'Course Content',
      'Main course content',
      0,
      true
    )
    RETURNING id INTO default_section_id;
    
    -- Move all lessons without a section to the default section
    UPDATE public.course_lessons
    SET section_id = default_section_id
    WHERE course_id = course_record.course_id AND section_id IS NULL;
  END LOOP;
END $$;