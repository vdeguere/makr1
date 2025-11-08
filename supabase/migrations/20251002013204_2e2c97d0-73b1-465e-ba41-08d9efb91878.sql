-- 1. Assign admin role to vick.umythy@gmail.com
INSERT INTO public.user_roles (user_id, role)
VALUES ('4a91cd89-ef7c-48f3-aa72-ea3a6b1e4132', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Add commission tracking to herbs table
ALTER TABLE public.herbs
ADD COLUMN IF NOT EXISTS commission_rate numeric DEFAULT 0.10 CHECK (commission_rate >= 0 AND commission_rate <= 1);

-- 3. Add practitioner_id tracking to orders for commission calculation
-- (already exists based on schema)

-- 4. Create sales analytics table for practitioners
CREATE TABLE IF NOT EXISTS public.sales_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  practitioner_id uuid NOT NULL,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  total_amount numeric NOT NULL,
  commission_amount numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(order_id)
);

ALTER TABLE public.sales_analytics ENABLE ROW LEVEL SECURITY;

-- 5. Update RLS policies for three-tier access

-- Admin policies: Admins can do everything
CREATE POLICY "Admins can manage all profiles"
ON public.profiles FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all patients"
ON public.patients FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all recommendations"
ON public.recommendations FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all orders"
ON public.orders FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage all herbs"
ON public.herbs FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Patient policies: Patients can view their own data and herbs (retail pricing)
CREATE POLICY "Patients can view their own profile"
ON public.profiles FOR SELECT
USING (has_role(auth.uid(), 'patient') AND id = auth.uid());

CREATE POLICY "Patients can view their own patient record"
ON public.patients FOR SELECT
USING (has_role(auth.uid(), 'patient') AND id = auth.uid());

CREATE POLICY "Patients can view their own recommendations"
ON public.recommendations FOR SELECT
USING (has_role(auth.uid(), 'patient') AND patient_id = auth.uid());

CREATE POLICY "Patients can view their own orders"
ON public.orders FOR SELECT
USING (has_role(auth.uid(), 'patient') AND patient_id = auth.uid());

CREATE POLICY "Patients can view all herbs"
ON public.herbs FOR SELECT
USING (has_role(auth.uid(), 'patient'));

-- Sales analytics policies
CREATE POLICY "Practitioners can view their own sales analytics"
ON public.sales_analytics FOR SELECT
USING (has_role(auth.uid(), 'practitioner') AND practitioner_id = auth.uid());

CREATE POLICY "Admins can manage all sales analytics"
ON public.sales_analytics FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Create function to calculate and insert sales analytics
CREATE OR REPLACE FUNCTION public.create_sales_analytics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_practitioner_id uuid;
  v_commission_amount numeric;
BEGIN
  -- Get practitioner_id from the recommendation
  SELECT practitioner_id INTO v_practitioner_id
  FROM recommendations
  WHERE id = NEW.recommendation_id;

  -- Calculate commission (10% of total_amount for now, can be customized per herb)
  v_commission_amount := NEW.total_amount * 0.10;

  -- Insert sales analytics record
  INSERT INTO public.sales_analytics (practitioner_id, order_id, total_amount, commission_amount)
  VALUES (v_practitioner_id, NEW.id, NEW.total_amount, v_commission_amount)
  ON CONFLICT (order_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Create trigger for sales analytics
DROP TRIGGER IF EXISTS create_sales_analytics_trigger ON public.orders;
CREATE TRIGGER create_sales_analytics_trigger
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.create_sales_analytics();