-- Make patient_id nullable for admin/practitioner reviews
ALTER TABLE public.product_reviews 
ALTER COLUMN patient_id DROP NOT NULL;

-- Drop the existing patient insert policy
DROP POLICY IF EXISTS "Patients can create reviews for purchased products" ON public.product_reviews;

-- Create new policies for different roles
CREATE POLICY "Patients can create reviews for purchased products"
ON public.product_reviews
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'patient'::app_role) 
  AND user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM patients p
    WHERE p.user_id = auth.uid() 
    AND p.id = product_reviews.patient_id
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

CREATE POLICY "Practitioners can create reviews"
ON public.product_reviews
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'practitioner'::app_role)
  AND user_id = auth.uid()
);

CREATE POLICY "Admins can create reviews"
ON public.product_reviews
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND user_id = auth.uid()
);