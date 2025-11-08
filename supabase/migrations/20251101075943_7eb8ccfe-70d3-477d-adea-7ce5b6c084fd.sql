-- Add shipping provider and tracking fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS courier_tracking_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipnity_order_id TEXT;

-- Add shipping dates
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS actual_delivery_date TIMESTAMPTZ;

-- Add shipment metadata
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipment_weight NUMERIC;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS parcel_dimensions JSONB;