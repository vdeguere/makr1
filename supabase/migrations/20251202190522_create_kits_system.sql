-- Create product kits system
-- This migration creates tables for bundling products into kits that can be included in courses

-- Create product_kits table
CREATE TABLE IF NOT EXISTS public.product_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2),
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create product_kit_items table (junction table for kit contents)
CREATE TABLE IF NOT EXISTS public.product_kit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id UUID REFERENCES public.product_kits(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.herbs(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(kit_id, product_id)
);

-- Add is_kit flag to herbs table to distinguish kits from regular products
ALTER TABLE public.herbs 
  ADD COLUMN IF NOT EXISTS is_kit BOOLEAN DEFAULT false;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_kits_is_active ON public.product_kits(is_active);
CREATE INDEX IF NOT EXISTS idx_product_kit_items_kit_id ON public.product_kit_items(kit_id);
CREATE INDEX IF NOT EXISTS idx_product_kit_items_product_id ON public.product_kit_items(product_id);
CREATE INDEX IF NOT EXISTS idx_herbs_is_kit ON public.herbs(is_kit);

-- Enable RLS
ALTER TABLE public.product_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_kit_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_kits
CREATE POLICY "Authenticated users can view active kits"
  ON public.product_kits
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can manage kits"
  ON public.product_kits
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for product_kit_items
CREATE POLICY "Authenticated users can view kit items"
  ON public.product_kit_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.product_kits pk
      WHERE pk.id = product_kit_items.kit_id
      AND (pk.is_active = true OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "Admins can manage kit items"
  ON public.product_kit_items
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_product_kits_updated_at
  BEFORE UPDATE ON public.product_kits
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.product_kits IS 'Bundled product kits that can be included in course enrollment';
COMMENT ON TABLE public.product_kit_items IS 'Junction table linking kits to their constituent products';
COMMENT ON COLUMN public.herbs.is_kit IS 'Flag to distinguish kit products from regular products';

