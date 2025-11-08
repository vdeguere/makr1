-- Add media column to product_reviews table for customer review images/videos
ALTER TABLE public.product_reviews 
ADD COLUMN media JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.product_reviews.media IS 'Array of media objects: [{"url": "...", "type": "image|video", "order": 0}]';