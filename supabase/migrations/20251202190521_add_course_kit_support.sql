-- Add kit and pricing support to courses table
-- This migration adds fields for course pricing, included products/kits, and prerequisites

-- Add price field (NULL = free course)
ALTER TABLE public.courses 
  ADD COLUMN IF NOT EXISTS price DECIMAL(10,2);

-- Add included products array (array of product IDs from herbs table)
ALTER TABLE public.courses 
  ADD COLUMN IF NOT EXISTS included_products JSONB DEFAULT '[]'::jsonb;

-- Add included kits array (array of kit IDs from product_kits table - will be created in next migration)
ALTER TABLE public.courses 
  ADD COLUMN IF NOT EXISTS included_kits JSONB DEFAULT '[]'::jsonb;

-- Add required course ID for prerequisites
ALTER TABLE public.courses 
  ADD COLUMN IF NOT EXISTS required_course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL;

-- Create index for faster prerequisite lookups
CREATE INDEX IF NOT EXISTS idx_courses_required_course_id ON public.courses(required_course_id);

-- Create index for price filtering
CREATE INDEX IF NOT EXISTS idx_courses_price ON public.courses(price) WHERE price IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.courses.price IS 'Course enrollment fee in currency. NULL means free course.';
COMMENT ON COLUMN public.courses.included_products IS 'Array of product IDs (from herbs table) included in course price';
COMMENT ON COLUMN public.courses.included_kits IS 'Array of kit IDs (from product_kits table) included in course price';
COMMENT ON COLUMN public.courses.required_course_id IS 'Prerequisite course that must be completed before enrolling';

