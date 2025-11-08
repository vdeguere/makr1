-- Create new enum type for recommendation statuses
CREATE TYPE recommendation_status AS ENUM ('draft', 'sent', 'payment_pending', 'paid', 'shipped', 'delivered');

-- Add new column with enum type
ALTER TABLE recommendations ADD COLUMN status_new recommendation_status;

-- Copy data from old column to new, converting values
UPDATE recommendations 
SET status_new = CASE status
  WHEN 'draft' THEN 'draft'::recommendation_status
  WHEN 'sent' THEN 'sent'::recommendation_status
  WHEN 'completed' THEN 'delivered'::recommendation_status
  ELSE 'draft'::recommendation_status
END;

-- Make the new column non-nullable with default
ALTER TABLE recommendations 
  ALTER COLUMN status_new SET NOT NULL,
  ALTER COLUMN status_new SET DEFAULT 'draft'::recommendation_status;

-- Drop old column and rename new one
ALTER TABLE recommendations DROP COLUMN status;
ALTER TABLE recommendations RENAME COLUMN status_new TO status;

-- Create function to update recommendation status based on order status
CREATE OR REPLACE FUNCTION public.update_recommendation_status_from_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update recommendation status based on order payment and shipping status
  -- Note: NEW.status and NEW.payment_status are text from orders table
  IF NEW.payment_status = 'paid' THEN
    IF NEW.status = 'delivered' THEN
      UPDATE recommendations 
      SET status = 'delivered'::recommendation_status
      WHERE id = NEW.recommendation_id;
    ELSIF NEW.status = 'shipped' THEN
      UPDATE recommendations 
      SET status = 'shipped'::recommendation_status
      WHERE id = NEW.recommendation_id;
    ELSE
      UPDATE recommendations 
      SET status = 'paid'::recommendation_status
      WHERE id = NEW.recommendation_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically update recommendation status when order changes
CREATE TRIGGER update_recommendation_status_trigger
AFTER INSERT OR UPDATE OF status, payment_status ON orders
FOR EACH ROW
EXECUTE FUNCTION update_recommendation_status_from_order();