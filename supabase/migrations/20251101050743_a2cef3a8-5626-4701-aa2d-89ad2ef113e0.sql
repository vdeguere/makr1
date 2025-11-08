-- Add currency support to herbs table
ALTER TABLE herbs 
ADD COLUMN price_currency text DEFAULT 'THB' NOT NULL,
ADD COLUMN supported_currencies jsonb DEFAULT '{"THB": {"cost_per_unit": null, "retail_price": null}}'::jsonb;

-- Add check constraint for valid currency codes
ALTER TABLE herbs
ADD CONSTRAINT valid_currency CHECK (price_currency ~ '^[A-Z]{3}$');

-- Create currency_settings table for global defaults
CREATE TABLE currency_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  currency_code text NOT NULL UNIQUE,
  symbol text NOT NULL,
  display_name text NOT NULL,
  exchange_rate_to_base numeric NOT NULL DEFAULT 1.0,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on currency_settings
ALTER TABLE currency_settings ENABLE ROW LEVEL SECURITY;

-- Public can view active currencies
CREATE POLICY "Anyone can view active currencies"
ON currency_settings
FOR SELECT
USING (is_active = true);

-- Admins can manage currencies
CREATE POLICY "Admins can manage currencies"
ON currency_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add user currency preference to profiles
ALTER TABLE profiles
ADD COLUMN preferred_currency text DEFAULT 'THB';

-- Update orders table for currency tracking
ALTER TABLE orders
ADD COLUMN currency text DEFAULT 'THB' NOT NULL,
ADD COLUMN exchange_rate numeric DEFAULT 1.0 NOT NULL;

-- Insert default currencies
INSERT INTO currency_settings (currency_code, symbol, display_name, exchange_rate_to_base, is_default, is_active)
VALUES 
  ('THB', '฿', 'Thai Baht', 1.0, true, true),
  ('USD', '$', 'US Dollar', 0.029, false, true),
  ('EUR', '€', 'Euro', 0.027, false, true),
  ('GBP', '£', 'British Pound', 0.023, false, true),
  ('JPY', '¥', 'Japanese Yen', 4.5, false, true);

-- Backfill existing herbs with THB prices in supported_currencies
UPDATE herbs
SET supported_currencies = jsonb_build_object(
  'THB', jsonb_build_object(
    'cost_per_unit', cost_per_unit,
    'retail_price', retail_price
  )
)
WHERE supported_currencies = '{"THB": {"cost_per_unit": null, "retail_price": null}}'::jsonb;