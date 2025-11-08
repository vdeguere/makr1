-- Create patient_messages table for doctor-patient communication
CREATE TABLE public.patient_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  practitioner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  message_body text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  parent_message_id uuid REFERENCES public.patient_messages(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_patient_messages_patient ON public.patient_messages(patient_id);
CREATE INDEX idx_patient_messages_practitioner ON public.patient_messages(practitioner_id);
CREATE INDEX idx_patient_messages_thread ON public.patient_messages(parent_message_id);
CREATE INDEX idx_patient_messages_unread ON public.patient_messages(is_read) WHERE is_read = false;

-- Add trigger for updated_at
CREATE TRIGGER update_patient_messages_updated_at
  BEFORE UPDATE ON public.patient_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.patient_messages ENABLE ROW LEVEL SECURITY;

-- Patients can view their own messages
CREATE POLICY "Patients can view their own messages"
  ON public.patient_messages FOR SELECT
  USING (
    has_role(auth.uid(), 'patient'::app_role) AND
    EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = patient_messages.patient_id 
      AND patients.user_id = auth.uid()
    )
  );

-- Patients can send messages to their practitioner
CREATE POLICY "Patients can send messages"
  ON public.patient_messages FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'patient'::app_role) AND
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = patient_messages.patient_id 
      AND patients.user_id = auth.uid()
      AND patients.practitioner_id = patient_messages.practitioner_id
    )
  );

-- Patients can mark messages as read
CREATE POLICY "Patients can update message read status"
  ON public.patient_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = patient_messages.patient_id 
      AND patients.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = patient_messages.patient_id 
      AND patients.user_id = auth.uid()
    )
  );

-- Practitioners can view messages for their patients
CREATE POLICY "Practitioners can view their patients messages"
  ON public.patient_messages FOR SELECT
  USING (
    has_role(auth.uid(), 'practitioner'::app_role) AND
    practitioner_id = auth.uid()
  );

-- Practitioners can send messages to their patients
CREATE POLICY "Practitioners can send messages"
  ON public.patient_messages FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'practitioner'::app_role) AND
    sender_id = auth.uid() AND
    practitioner_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.patients 
      WHERE patients.id = patient_messages.patient_id 
      AND patients.practitioner_id = auth.uid()
    )
  );

-- Practitioners can update message read status
CREATE POLICY "Practitioners can update message read status"
  ON public.patient_messages FOR UPDATE
  USING (practitioner_id = auth.uid())
  WITH CHECK (practitioner_id = auth.uid());

-- Admins can manage all messages
CREATE POLICY "Admins can manage all messages"
  ON public.patient_messages FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));