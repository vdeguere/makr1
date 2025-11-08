-- Add new column for multiple images
ALTER TABLE public.herbs 
ADD COLUMN images JSONB DEFAULT '[]'::jsonb;

-- Add comment for clarity
COMMENT ON COLUMN public.herbs.images IS 'Array of image objects with url, isPrimary flag, and order: [{"url": "...", "isPrimary": true, "order": 0, "caption": "..."}]';

-- Optional: Migrate existing single images to new format (if they exist)
UPDATE public.herbs
SET images = jsonb_build_array(
  jsonb_build_object(
    'url', image_url,
    'isPrimary', true,
    'order', 0
  )
)
WHERE image_url IS NOT NULL 
  AND image_url != ''
  AND (images IS NULL OR images = '[]'::jsonb);