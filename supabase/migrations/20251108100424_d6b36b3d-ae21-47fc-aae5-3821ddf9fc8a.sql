-- Remove duplicate roles, keeping the highest priority role per user
-- Priority: dev > admin > practitioner > patient

-- First, create a temp table with the role we want to keep for each user
CREATE TEMP TABLE roles_to_keep AS
SELECT DISTINCT ON (user_id) 
  id,
  user_id,
  role
FROM user_roles
ORDER BY 
  user_id,
  CASE 
    WHEN role = 'dev' THEN 1
    WHEN role = 'admin' THEN 2
    WHEN role = 'practitioner' THEN 3
    WHEN role = 'patient' THEN 4
  END;

-- Delete all roles except the ones we want to keep
DELETE FROM user_roles
WHERE id NOT IN (SELECT id FROM roles_to_keep);

-- Add unique constraint to prevent future duplicates
ALTER TABLE user_roles
ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);