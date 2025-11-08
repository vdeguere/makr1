-- Add live streaming support to course_lessons table
ALTER TABLE course_lessons
ADD COLUMN IF NOT EXISTS stream_url TEXT,
ADD COLUMN IF NOT EXISTS stream_platform TEXT,
ADD COLUMN IF NOT EXISTS scheduled_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS scheduled_end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_live_now BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN course_lessons.stream_url IS 'Embed URL for live stream (Google Meet, Zoom, YouTube, etc.)';
COMMENT ON COLUMN course_lessons.stream_platform IS 'Platform type: google_meet, zoom, youtube, custom';
COMMENT ON COLUMN course_lessons.scheduled_start_time IS 'When the live class is scheduled to start';
COMMENT ON COLUMN course_lessons.scheduled_end_time IS 'When the live class is scheduled to end';
COMMENT ON COLUMN course_lessons.is_live_now IS 'Whether the stream is currently live';