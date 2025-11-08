-- Fix security warning: add search_path to update_courses_updated_at function
CREATE OR REPLACE FUNCTION update_courses_updated_at()
RETURNS TRIGGER 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;