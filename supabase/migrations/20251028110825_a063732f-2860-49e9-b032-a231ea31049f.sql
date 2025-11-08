-- Create product categories table
CREATE TABLE public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add category and brand fields to herbs table
ALTER TABLE public.herbs 
  ADD COLUMN category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
  ADD COLUMN brand TEXT,
  ADD COLUMN certifications JSONB DEFAULT '[]'::jsonb;

-- Create index for faster category lookups
CREATE INDEX idx_herbs_category_id ON public.herbs(category_id);
CREATE INDEX idx_product_categories_parent_id ON public.product_categories(parent_id);

-- Enable RLS on product_categories
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_categories
CREATE POLICY "Authenticated users can view categories"
  ON public.product_categories
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage categories"
  ON public.product_categories
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_product_categories_updated_at
  BEFORE UPDATE ON public.product_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Insert default categories
INSERT INTO public.product_categories (name, description) VALUES
  ('Traditional Thai Herbs', 'Authentic Thai medicinal herbs and botanicals'),
  ('Supplements', 'Vitamins, minerals, and nutritional supplements'),
  ('Probiotics', 'Gut health and digestive support'),
  ('Herbal Formulas', 'Pre-formulated herbal combinations'),
  ('Tinctures & Extracts', 'Concentrated herbal extracts'),
  ('Teas & Infusions', 'Herbal teas and brewing herbs'),
  ('Topical Remedies', 'Balms, salves, and topical applications'),
  ('Specialty Products', 'Unique and specialty wellness products');