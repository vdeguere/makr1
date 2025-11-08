-- Add preview_video_url column to courses table
ALTER TABLE public.courses 
ADD COLUMN preview_video_url TEXT;