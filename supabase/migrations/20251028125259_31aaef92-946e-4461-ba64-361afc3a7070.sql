-- Create product-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images', 
  'product-images', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
);

-- Allow admins and devs to upload product images
CREATE POLICY "Admins and devs can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'dev'::app_role)
  )
);

-- Allow admins and devs to update product images
CREATE POLICY "Admins and devs can update product images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' 
  AND (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'dev'::app_role)
  )
);

-- Allow admins and devs to delete product images
CREATE POLICY "Admins and devs can delete product images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role)
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'dev'::app_role)
  )
);

-- Allow public read access to product images
CREATE POLICY "Public can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');