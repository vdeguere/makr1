-- Step 1: Make patient_id nullable first (drop NOT NULL constraint)
ALTER TABLE public.patient_messages 
  ALTER COLUMN patient_id DROP NOT NULL;

-- Step 2: Clean up existing data - set patient_id to NULL for support messages
UPDATE public.patient_messages 
SET patient_id = NULL 
WHERE recipient_type = 'support' AND patient_id IS NOT NULL;

-- Step 3: Add a check constraint to ensure data integrity going forward
-- Either it's a support message (patient_id can be null) 
-- OR it's a patient message (patient_id must be set)
ALTER TABLE public.patient_messages
  ADD CONSTRAINT valid_patient_message CHECK (
    (recipient_type = 'support' AND patient_id IS NULL) OR
    (recipient_type != 'support' AND patient_id IS NOT NULL)
  );

-- Step 4: Add an index for better query performance on support messages
CREATE INDEX IF NOT EXISTS idx_patient_messages_support 
  ON public.patient_messages(recipient_type, created_at) 
  WHERE recipient_type = 'support';