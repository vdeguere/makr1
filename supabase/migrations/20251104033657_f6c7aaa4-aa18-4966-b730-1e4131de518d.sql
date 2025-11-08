-- Add subscription pricing columns to herbs table
ALTER TABLE public.herbs
ADD COLUMN IF NOT EXISTS subscription_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS subscription_discount_percentage numeric CHECK (subscription_discount_percentage >= 0 AND subscription_discount_percentage <= 100),
ADD COLUMN IF NOT EXISTS subscription_intervals jsonb DEFAULT '["monthly"]'::jsonb;

COMMENT ON COLUMN public.herbs.subscription_enabled IS 'Whether subscription pricing is available for this product';
COMMENT ON COLUMN public.herbs.subscription_discount_percentage IS 'Discount percentage applied when customer subscribes (0-100)';
COMMENT ON COLUMN public.herbs.subscription_intervals IS 'Available subscription intervals (e.g., ["weekly", "monthly", "quarterly"])';