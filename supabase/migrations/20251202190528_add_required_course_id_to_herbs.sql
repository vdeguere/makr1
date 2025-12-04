-- Add required_course_id to herbs table for course-gated products
-- This allows products to be restricted until a student completes a prerequisite course

ALTER TABLE public.herbs 
  ADD COLUMN IF NOT EXISTS required_course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL;

-- Create index for faster course requirement lookups
CREATE INDEX IF NOT EXISTS idx_herbs_required_course_id ON public.herbs(required_course_id);

-- Add comment for documentation
COMMENT ON COLUMN public.herbs.required_course_id IS 'Course ID that must be completed before this product can be purchased. NULL means no course restriction.';


