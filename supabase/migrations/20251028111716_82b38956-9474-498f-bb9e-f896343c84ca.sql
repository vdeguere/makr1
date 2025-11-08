-- Create commission_payouts table
CREATE TABLE IF NOT EXISTS public.commission_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID REFERENCES public.profiles(id) NOT NULL,
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  payment_method TEXT CHECK (payment_method IN ('bank_transfer', 'promptpay')),
  payment_reference TEXT,
  payment_date TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id),
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  paid_by UUID REFERENCES public.profiles(id),
  paid_at TIMESTAMPTZ,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extend sales_analytics table
ALTER TABLE public.sales_analytics 
  ADD COLUMN IF NOT EXISTS commission_status TEXT DEFAULT 'pending' CHECK (commission_status IN ('pending', 'approved', 'paid', 'rejected')),
  ADD COLUMN IF NOT EXISTS payout_id UUID REFERENCES public.commission_payouts(id),
  ADD COLUMN IF NOT EXISTS items_breakdown JSONB,
  ADD COLUMN IF NOT EXISTS commission_rate NUMERIC;

-- Extend profiles table for payment info
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
  ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
  ADD COLUMN IF NOT EXISTS bank_name TEXT,
  ADD COLUMN IF NOT EXISTS promptpay_number TEXT,
  ADD COLUMN IF NOT EXISTS tax_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_notes TEXT;

-- Create practitioner_commission_overrides table
CREATE TABLE IF NOT EXISTS public.practitioner_commission_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID REFERENCES public.profiles(id) NOT NULL,
  herb_id UUID REFERENCES public.herbs(id),
  category_id UUID REFERENCES public.product_categories(id),
  commission_rate NUMERIC NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 1),
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_until DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_override_target CHECK (
    (herb_id IS NOT NULL AND category_id IS NULL) OR 
    (herb_id IS NULL AND category_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.commission_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practitioner_commission_overrides ENABLE ROW LEVEL SECURITY;

-- RLS Policies for commission_payouts
CREATE POLICY "Admins can manage all payouts"
  ON public.commission_payouts
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Practitioners can view their own payouts"
  ON public.commission_payouts
  FOR SELECT
  USING (has_role(auth.uid(), 'practitioner'::app_role) AND practitioner_id = auth.uid());

-- RLS Policies for practitioner_commission_overrides
CREATE POLICY "Admins can manage commission overrides"
  ON public.practitioner_commission_overrides
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Practitioners can view their own overrides"
  ON public.practitioner_commission_overrides
  FOR SELECT
  USING (has_role(auth.uid(), 'practitioner'::app_role) AND practitioner_id = auth.uid());

-- Update trigger for commission_payouts
CREATE TRIGGER update_commission_payouts_updated_at
  BEFORE UPDATE ON public.commission_payouts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_practitioner_commission_overrides_updated_at
  BEFORE UPDATE ON public.practitioner_commission_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Function to get effective commission rate
CREATE OR REPLACE FUNCTION public.get_commission_rate(
  _practitioner_id UUID, 
  _herb_id UUID
) RETURNS NUMERIC
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    -- Check practitioner-specific herb override
    (SELECT commission_rate FROM public.practitioner_commission_overrides 
     WHERE practitioner_id = _practitioner_id 
       AND herb_id = _herb_id
       AND (effective_from IS NULL OR effective_from <= CURRENT_DATE)
       AND (effective_until IS NULL OR effective_until >= CURRENT_DATE)
     LIMIT 1),
    -- Check practitioner-specific category override
    (SELECT pco.commission_rate FROM public.practitioner_commission_overrides pco
     JOIN public.herbs h ON h.category_id = pco.category_id
     WHERE pco.practitioner_id = _practitioner_id 
       AND h.id = _herb_id
       AND (pco.effective_from IS NULL OR pco.effective_from <= CURRENT_DATE)
       AND (pco.effective_until IS NULL OR pco.effective_until >= CURRENT_DATE)
     LIMIT 1),
    -- Default to herb's commission rate
    (SELECT commission_rate FROM public.herbs WHERE id = _herb_id),
    0.10 -- Fallback default
  );
$$;

-- Update create_sales_analytics trigger to use new fields
CREATE OR REPLACE FUNCTION public.create_sales_analytics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_practitioner_id uuid;
  v_commission_amount numeric;
  v_items_breakdown jsonb;
  v_item record;
  v_herb_commission_rate numeric;
  v_item_commission numeric;
BEGIN
  -- Get practitioner_id from the recommendation
  SELECT practitioner_id INTO v_practitioner_id
  FROM public.recommendations
  WHERE id = NEW.recommendation_id;

  -- Build items breakdown with per-item commission
  v_items_breakdown := '[]'::jsonb;
  v_commission_amount := 0;

  FOR v_item IN 
    SELECT 
      ri.herb_id,
      ri.quantity,
      ri.unit_price,
      h.name as herb_name,
      h.commission_rate as default_rate
    FROM public.recommendation_items ri
    JOIN public.herbs h ON h.id = ri.herb_id
    WHERE ri.recommendation_id = NEW.recommendation_id
  LOOP
    -- Get effective commission rate for this practitioner and herb
    v_herb_commission_rate := public.get_commission_rate(v_practitioner_id, v_item.herb_id);
    v_item_commission := (v_item.quantity * v_item.unit_price) * v_herb_commission_rate;
    v_commission_amount := v_commission_amount + v_item_commission;

    -- Add to breakdown
    v_items_breakdown := v_items_breakdown || jsonb_build_object(
      'herb_id', v_item.herb_id,
      'herb_name', v_item.herb_name,
      'quantity', v_item.quantity,
      'unit_price', v_item.unit_price,
      'subtotal', v_item.quantity * v_item.unit_price,
      'commission_rate', v_herb_commission_rate,
      'commission_amount', v_item_commission
    );
  END LOOP;

  -- Insert sales analytics record with enhanced data
  INSERT INTO public.sales_analytics (
    practitioner_id, 
    order_id, 
    total_amount, 
    commission_amount,
    commission_status,
    items_breakdown,
    commission_rate
  )
  VALUES (
    v_practitioner_id, 
    NEW.id, 
    NEW.total_amount, 
    v_commission_amount,
    'pending',
    v_items_breakdown,
    v_commission_amount / NULLIF(NEW.total_amount, 0) -- Overall commission rate
  )
  ON CONFLICT (order_id) DO UPDATE
  SET 
    commission_amount = v_commission_amount,
    items_breakdown = v_items_breakdown,
    commission_rate = v_commission_amount / NULLIF(NEW.total_amount, 0);

  RETURN NEW;
END;
$$;