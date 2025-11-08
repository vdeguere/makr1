-- Create product reviews table
CREATE TABLE public.product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  herb_id UUID NOT NULL REFERENCES public.herbs(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  review_text TEXT,
  verified_purchase BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(herb_id, patient_id)
);

-- Create indexes for performance
CREATE INDEX idx_product_reviews_herb_id ON public.product_reviews(herb_id);
CREATE INDEX idx_product_reviews_patient_id ON public.product_reviews(patient_id);
CREATE INDEX idx_product_reviews_rating ON public.product_reviews(rating);

-- Enable RLS
ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view reviews
CREATE POLICY "Anyone can view product reviews"
ON public.product_reviews FOR SELECT
TO authenticated
USING (true);

-- Patients can create reviews for products they've received
CREATE POLICY "Patients can create reviews for purchased products"
ON public.product_reviews FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'patient'::app_role)
  AND user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM patients p WHERE p.user_id = auth.uid() AND p.id = patient_id
  )
  AND EXISTS (
    SELECT 1 
    FROM orders o
    JOIN recommendations r ON r.id = o.recommendation_id
    JOIN recommendation_items ri ON ri.recommendation_id = r.id
    JOIN patients p ON p.id = r.patient_id
    WHERE p.user_id = auth.uid()
    AND ri.herb_id = product_reviews.herb_id
    AND o.status = 'delivered'
  )
);

-- Patients can update their own reviews
CREATE POLICY "Patients can update their own reviews"
ON public.product_reviews FOR UPDATE
TO authenticated
USING (user_id = auth.uid() AND has_role(auth.uid(), 'patient'::app_role))
WITH CHECK (user_id = auth.uid());

-- Patients can delete their own reviews
CREATE POLICY "Patients can delete their own reviews"
ON public.product_reviews FOR DELETE
TO authenticated
USING (user_id = auth.uid() AND has_role(auth.uid(), 'patient'::app_role));

-- Admins can manage all reviews
CREATE POLICY "Admins can manage all reviews"
ON public.product_reviews FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add review statistics to herbs table
ALTER TABLE public.herbs 
ADD COLUMN average_rating NUMERIC(3,2),
ADD COLUMN review_count INTEGER DEFAULT 0;

-- Create function to update review stats
CREATE OR REPLACE FUNCTION update_herb_review_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.herbs
  SET 
    average_rating = (
      SELECT AVG(rating)::NUMERIC(3,2)
      FROM product_reviews
      WHERE herb_id = COALESCE(NEW.herb_id, OLD.herb_id)
    ),
    review_count = (
      SELECT COUNT(*)
      FROM product_reviews
      WHERE herb_id = COALESCE(NEW.herb_id, OLD.herb_id)
    )
  WHERE id = COALESCE(NEW.herb_id, OLD.herb_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger
CREATE TRIGGER update_herb_review_stats_trigger
AFTER INSERT OR UPDATE OR DELETE ON product_reviews
FOR EACH ROW
EXECUTE FUNCTION update_herb_review_stats();