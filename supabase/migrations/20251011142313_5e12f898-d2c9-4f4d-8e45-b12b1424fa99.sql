-- Add email_consent column to patients table
ALTER TABLE patients 
ADD COLUMN email_consent BOOLEAN DEFAULT false;

-- Set email_consent to true for existing patients who have an email
UPDATE patients 
SET email_consent = true 
WHERE email IS NOT NULL AND email != '';

-- Add a comment for documentation
COMMENT ON COLUMN patients.email_consent IS 'Tracks whether patient has consented to receive email communications';