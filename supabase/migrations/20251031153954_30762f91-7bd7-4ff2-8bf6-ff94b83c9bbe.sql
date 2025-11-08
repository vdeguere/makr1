-- Add reviewer_name column to product_reviews table
ALTER TABLE public.product_reviews
ADD COLUMN reviewer_name text;