-- Remove duplicate static patient history fields from visit_notes
-- These fields should only exist on the patients table, not visit_notes
-- Keep present_illness as it's visit-specific

ALTER TABLE visit_notes 
  DROP COLUMN IF EXISTS past_medical_history,
  DROP COLUMN IF EXISTS family_history,
  DROP COLUMN IF EXISTS social_history,
  DROP COLUMN IF EXISTS current_medications;