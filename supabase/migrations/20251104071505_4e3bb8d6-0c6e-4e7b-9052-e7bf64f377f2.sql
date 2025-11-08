-- Add target_audience column to courses table
ALTER TABLE courses 
ADD COLUMN target_audience text[] DEFAULT '{practitioner}';

-- Add comment to explain the column
COMMENT ON COLUMN courses.target_audience IS 'Array of audiences who can access this course: patient, practitioner';

-- Create GIN index for efficient array queries
CREATE INDEX idx_courses_target_audience ON courses USING gin(target_audience);

-- Drop existing policy for viewing published courses
DROP POLICY IF EXISTS "Practitioners and admins can view published courses" ON courses;

-- Create new policy that checks target_audience based on user role
CREATE POLICY "Users can view courses for their audience"
ON courses
FOR SELECT
TO authenticated
USING (
  (is_published = true AND 
   CASE 
     WHEN has_role(auth.uid(), 'patient'::app_role) THEN 'patient' = ANY(target_audience)
     WHEN has_role(auth.uid(), 'practitioner'::app_role) THEN 'practitioner' = ANY(target_audience)
     ELSE false
   END)
  OR created_by = auth.uid() 
  OR has_role(auth.uid(), 'admin'::app_role)
);