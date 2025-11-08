-- Fix foreign key constraint for patient_messages.sender_id
-- Currently points to auth.users, but we need it to point to profiles for proper joins
ALTER TABLE patient_messages 
DROP CONSTRAINT IF EXISTS patient_messages_sender_id_fkey;

ALTER TABLE patient_messages
ADD CONSTRAINT patient_messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Enable realtime updates for patient_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE patient_messages;