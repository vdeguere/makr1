-- Fix function search path security issue
CREATE OR REPLACE FUNCTION update_course_progress()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE course_enrollments
  SET 
    completion_percentage = (
      SELECT 
        COALESCE((COUNT(lp.completed_at)::FLOAT / NULLIF(COUNT(cl.id)::FLOAT, 0) * 100)::INTEGER, 0)
      FROM course_lessons cl
      LEFT JOIN lesson_progress lp ON lp.lesson_id = cl.id 
        AND lp.enrollment_id = NEW.enrollment_id
      WHERE cl.course_id = (
        SELECT course_id FROM course_enrollments WHERE id = NEW.enrollment_id
      )
    ),
    last_accessed_at = NOW(),
    started_at = COALESCE(started_at, NOW())
  WHERE id = NEW.enrollment_id;
  
  RETURN NEW;
END;
$$;