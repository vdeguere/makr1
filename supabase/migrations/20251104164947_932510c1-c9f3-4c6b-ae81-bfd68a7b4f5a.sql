-- Add section support to lessons for chapter grouping
ALTER TABLE course_lessons
ADD COLUMN IF NOT EXISTS section_name TEXT,
ADD COLUMN IF NOT EXISTS section_order INTEGER DEFAULT 0;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_course_lessons_section ON course_lessons(course_id, section_order, display_order);

-- Update existing lessons to have a default section
UPDATE course_lessons
SET section_name = 'Lessons'
WHERE section_name IS NULL;