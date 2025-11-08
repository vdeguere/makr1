-- Add default shipping information fields to patients table
ALTER TABLE patients
ADD COLUMN default_shipping_address TEXT,
ADD COLUMN default_shipping_city TEXT,
ADD COLUMN default_shipping_postal_code TEXT,
ADD COLUMN default_shipping_phone TEXT;