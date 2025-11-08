-- Create live meetings table
CREATE TABLE IF NOT EXISTS public.live_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  host_user_id UUID NOT NULL,
  stream_url TEXT NOT NULL,
  stream_platform TEXT,
  scheduled_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_end_time TIMESTAMP WITH TIME ZONE,
  is_live_now BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  max_attendees INTEGER,
  meeting_type TEXT DEFAULT 'open',
  allowed_roles TEXT[] DEFAULT ARRAY['admin', 'practitioner', 'patient'],
  tags TEXT[],
  thumbnail_url TEXT,
  recording_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create live meeting attendees table
CREATE TABLE IF NOT EXISTS public.live_meeting_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES public.live_meetings(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  left_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(meeting_id, user_id)
);

-- Enable RLS
ALTER TABLE public.live_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_meeting_attendees ENABLE ROW LEVEL SECURITY;

-- RLS Policies for live_meetings
CREATE POLICY "Anyone can view published meetings"
  ON public.live_meetings FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can do everything with meetings"
  ON public.live_meetings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Hosts can manage their own meetings"
  ON public.live_meetings FOR ALL
  USING (host_user_id = auth.uid());

-- RLS Policies for live_meeting_attendees
CREATE POLICY "Users can view their meeting attendance"
  ON public.live_meeting_attendees FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can join meetings"
  ON public.live_meeting_attendees FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all attendees"
  ON public.live_meeting_attendees FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Triggers
CREATE TRIGGER update_live_meetings_updated_at
  BEFORE UPDATE ON public.live_meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Remove live stream fields from course_lessons
ALTER TABLE public.course_lessons 
  DROP COLUMN IF EXISTS stream_url,
  DROP COLUMN IF EXISTS stream_platform,
  DROP COLUMN IF EXISTS scheduled_start_time,
  DROP COLUMN IF EXISTS scheduled_end_time,
  DROP COLUMN IF EXISTS is_live_now;