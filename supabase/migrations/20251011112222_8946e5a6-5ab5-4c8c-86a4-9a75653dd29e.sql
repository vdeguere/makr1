-- Phase 1: Fix existing RLS policies for patient access
DROP POLICY IF EXISTS "Patients can view their own recommendations" ON recommendations;

CREATE POLICY "Patients can view recommendations for their linked record"
ON recommendations FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'patient'::app_role) AND (
    EXISTS (
      SELECT 1 FROM patients 
      WHERE patients.id = recommendations.patient_id 
      AND patients.user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Patients can view their own orders" ON orders;

CREATE POLICY "Patients can view orders for their linked record"
ON orders FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'patient'::app_role) AND (
    EXISTS (
      SELECT 1 FROM patients 
      WHERE patients.id = orders.patient_id 
      AND patients.user_id = auth.uid()
    )
  )
);

-- Phase 2: Add new columns for LINE integration and notifications
ALTER TABLE patients ADD COLUMN IF NOT EXISTS line_user_id TEXT;

ALTER TABLE recommendations ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE recommendations ADD COLUMN IF NOT EXISTS notification_channels TEXT[];

-- Phase 3: Add shipping and payment columns to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_city TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_postal_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_phone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reference TEXT;

-- Phase 4: Create recommendation_links table for secure checkout
CREATE TABLE IF NOT EXISTS recommendation_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID NOT NULL REFERENCES recommendations(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recommendation_links_token ON recommendation_links(token);
CREATE INDEX IF NOT EXISTS idx_recommendation_links_recommendation ON recommendation_links(recommendation_id);

-- Enable RLS on recommendation_links
ALTER TABLE recommendation_links ENABLE ROW LEVEL SECURITY;

-- Public can read valid (non-expired, unused) links by token
CREATE POLICY "Public can read valid links by token"
  ON recommendation_links FOR SELECT
  USING (expires_at > NOW() AND used_at IS NULL);

-- Practitioners can view links for their recommendations
CREATE POLICY "Practitioners can view their recommendation links"
  ON recommendation_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recommendations 
      WHERE recommendations.id = recommendation_links.recommendation_id 
      AND recommendations.practitioner_id = auth.uid()
    )
  );

-- System can create and update links (via edge functions)
CREATE POLICY "System can create recommendation links"
  ON recommendation_links FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update recommendation links"
  ON recommendation_links FOR UPDATE
  USING (true);