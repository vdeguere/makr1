-- Create guest support messages table for non-patient users
CREATE TABLE public.guest_support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT,
  subject TEXT NOT NULL,
  message_body TEXT NOT NULL,
  chat_history JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  is_read BOOLEAN DEFAULT false,
  admin_reply TEXT,
  replied_at TIMESTAMPTZ,
  replied_by UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved'))
);

-- Create indexes for better query performance
CREATE INDEX idx_guest_support_email ON public.guest_support_messages(email);
CREATE INDEX idx_guest_support_status ON public.guest_support_messages(status);
CREATE INDEX idx_guest_support_created_at ON public.guest_support_messages(created_at DESC);

-- Enable RLS
ALTER TABLE public.guest_support_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone (authenticated or anonymous) can insert guest support messages
CREATE POLICY "Anyone can insert guest support messages"
  ON public.guest_support_messages
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Policy: Admins can view all guest support messages
CREATE POLICY "Admins can view all guest support messages"
  ON public.guest_support_messages
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Admins can update guest support messages
CREATE POLICY "Admins can update guest support messages"
  ON public.guest_support_messages
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policy: Admins can delete guest support messages
CREATE POLICY "Admins can delete guest support messages"
  ON public.guest_support_messages
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));