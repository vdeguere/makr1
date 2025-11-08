-- Create function to safely decrement herb stock quantities
CREATE OR REPLACE FUNCTION public.decrement_stock(herb_id uuid, quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.herbs
  SET stock_quantity = stock_quantity - quantity
  WHERE id = herb_id;
END;
$$;