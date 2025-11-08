-- Create function to update recommendation status based on order status
CREATE OR REPLACE FUNCTION public.update_recommendation_status_from_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Update recommendation status based on order payment and shipping status
  IF NEW.payment_status = 'paid' THEN
    IF NEW.status = 'delivered' THEN
      UPDATE recommendations 
      SET status = 'delivered'
      WHERE id = NEW.recommendation_id;
    ELSIF NEW.status = 'shipped' THEN
      UPDATE recommendations 
      SET status = 'shipped'
      WHERE id = NEW.recommendation_id;
    ELSE
      -- Order is paid but not yet shipped
      UPDATE recommendations 
      SET status = 'paid'
      WHERE id = NEW.recommendation_id;
    END IF;
  ELSIF NEW.payment_status = 'pending' AND (SELECT status FROM recommendations WHERE id = NEW.recommendation_id) = 'sent' THEN
    -- Order created but not paid yet
    UPDATE recommendations 
    SET status = 'payment_pending'
    WHERE id = NEW.recommendation_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically update recommendation status when order changes
DROP TRIGGER IF EXISTS update_recommendation_status_trigger ON orders;
CREATE TRIGGER update_recommendation_status_trigger
AFTER INSERT OR UPDATE OF status, payment_status ON orders
FOR EACH ROW
EXECUTE FUNCTION update_recommendation_status_from_order();