-- Add recipient tracking columns to patient_messages
ALTER TABLE patient_messages 
  ADD COLUMN recipient_type text NOT NULL DEFAULT 'practitioner',
  ADD COLUMN recipient_id uuid;

-- Add constraint to validate recipient_type
ALTER TABLE patient_messages
  ADD CONSTRAINT check_recipient_type 
  CHECK (recipient_type IN ('practitioner', 'support'));

-- Update existing data to set recipient_type and recipient_id
UPDATE patient_messages 
SET recipient_type = 'practitioner',
    recipient_id = practitioner_id;

-- Make practitioner_id nullable for support messages
ALTER TABLE patient_messages 
  ALTER COLUMN practitioner_id DROP NOT NULL;

-- Add indexes for performance
CREATE INDEX idx_patient_messages_support 
  ON patient_messages(recipient_type) 
  WHERE recipient_type = 'support';

CREATE INDEX idx_patient_messages_recipient 
  ON patient_messages(recipient_id, recipient_type);

-- Drop existing policies
DROP POLICY IF EXISTS "Patients can view their own messages" ON patient_messages;
DROP POLICY IF EXISTS "Patients can send messages" ON patient_messages;
DROP POLICY IF EXISTS "Practitioners can view their patients messages" ON patient_messages;
DROP POLICY IF EXISTS "Practitioners can send messages" ON patient_messages;
DROP POLICY IF EXISTS "Practitioners can update message read status" ON patient_messages;
DROP POLICY IF EXISTS "Patients can update message read status" ON patient_messages;

-- NEW: Patients can view their messages (both practitioner and support)
CREATE POLICY "Patients can view their own messages"
  ON patient_messages FOR SELECT
  USING (
    has_role(auth.uid(), 'patient'::app_role) AND
    EXISTS (
      SELECT 1 FROM patients 
      WHERE patients.id = patient_messages.patient_id 
      AND patients.user_id = auth.uid()
    )
  );

-- NEW: Patients can send messages to practitioner or support
CREATE POLICY "Patients can send messages"
  ON patient_messages FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'patient'::app_role) AND
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM patients 
      WHERE patients.id = patient_messages.patient_id 
      AND patients.user_id = auth.uid()
      AND (
        (recipient_type = 'practitioner' AND patients.practitioner_id = patient_messages.practitioner_id)
        OR
        (recipient_type = 'support' AND patient_messages.practitioner_id IS NULL)
      )
    )
  );

-- NEW: Practitioners can view messages directed to them
CREATE POLICY "Practitioners can view their patients messages"
  ON patient_messages FOR SELECT
  USING (
    has_role(auth.uid(), 'practitioner'::app_role) AND
    recipient_type = 'practitioner' AND
    recipient_id = auth.uid()
  );

-- NEW: Practitioners can send messages to their patients
CREATE POLICY "Practitioners can send messages"
  ON patient_messages FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'practitioner'::app_role) AND
    sender_id = auth.uid() AND
    recipient_type = 'practitioner' AND
    recipient_id = auth.uid() AND
    practitioner_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM patients 
      WHERE patients.id = patient_messages.patient_id 
      AND patients.practitioner_id = auth.uid()
    )
  );

-- NEW: Admins can view ALL messages (including support)
CREATE POLICY "Admins can view all messages"
  ON patient_messages FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- NEW: Admins can send support messages
CREATE POLICY "Admins can send support messages"
  ON patient_messages FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role) AND
    sender_id = auth.uid() AND
    recipient_type = 'support' AND
    practitioner_id IS NULL
  );

-- NEW: Users can update message read status
CREATE POLICY "Users can update message read status"
  ON patient_messages FOR UPDATE
  USING (
    (has_role(auth.uid(), 'practitioner'::app_role) AND recipient_id = auth.uid())
    OR
    (has_role(auth.uid(), 'patient'::app_role) AND EXISTS (
      SELECT 1 FROM patients 
      WHERE patients.id = patient_messages.patient_id 
      AND patients.user_id = auth.uid()
    ))
    OR
    has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    (has_role(auth.uid(), 'practitioner'::app_role) AND recipient_id = auth.uid())
    OR
    (has_role(auth.uid(), 'patient'::app_role) AND EXISTS (
      SELECT 1 FROM patients 
      WHERE patients.id = patient_messages.patient_id 
      AND patients.user_id = auth.uid()
    ))
    OR
    has_role(auth.uid(), 'admin'::app_role)
  );