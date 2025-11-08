-- Drop the existing admin-only policy
DROP POLICY IF EXISTS "Admins can manage all courses" ON courses;

-- Create new policy allowing both admins and devs to manage courses
CREATE POLICY "Admins and devs can manage all courses" 
ON courses
FOR ALL 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'dev'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'dev'::app_role)
);