-- Create page_analytics table
CREATE TABLE IF NOT EXISTS public.page_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Page information
  page_path TEXT NOT NULL,
  page_title TEXT,
  page_location TEXT,
  referrer TEXT,
  
  -- User information
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_role TEXT,
  session_id TEXT NOT NULL,
  
  -- Device & Browser information
  device_type TEXT,
  user_agent TEXT,
  screen_resolution TEXT,
  
  -- Timing information
  duration_seconds INTEGER,
  entry_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  exit_time TIMESTAMPTZ,
  
  -- Navigation context
  previous_page TEXT,
  is_bounce BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT page_analytics_duration_check CHECK (duration_seconds IS NULL OR duration_seconds >= 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_page_analytics_page_path ON public.page_analytics(page_path);
CREATE INDEX IF NOT EXISTS idx_page_analytics_created_at ON public.page_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_analytics_user_id ON public.page_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_page_analytics_session_id ON public.page_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_page_analytics_user_role ON public.page_analytics(user_role);
CREATE INDEX IF NOT EXISTS idx_page_analytics_device_type ON public.page_analytics(device_type);
CREATE INDEX IF NOT EXISTS idx_page_analytics_date_path ON public.page_analytics(created_at DESC, page_path);

-- Enable RLS
ALTER TABLE public.page_analytics ENABLE ROW LEVEL SECURITY;

-- Admins can view all analytics
CREATE POLICY "Admins can view all page analytics"
ON public.page_analytics
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can insert their own page views
CREATE POLICY "Users can insert their own page views"
ON public.page_analytics
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Anonymous users can insert page views
CREATE POLICY "Anonymous users can insert page views"
ON public.page_analytics
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

-- Users can update their own page analytics
CREATE POLICY "Users can update their own page analytics"
ON public.page_analytics
FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR user_id IS NULL)
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Anonymous users can update their page analytics
CREATE POLICY "Anonymous users can update page analytics"
ON public.page_analytics
FOR UPDATE
TO anon
USING (user_id IS NULL)
WITH CHECK (user_id IS NULL);

-- Function to calculate bounce rate for a specific page
CREATE OR REPLACE FUNCTION public.get_page_bounce_rate(
  _page_path TEXT,
  _start_date TIMESTAMPTZ DEFAULT now() - interval '30 days',
  _end_date TIMESTAMPTZ DEFAULT now()
)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND((COUNT(*) FILTER (WHERE is_bounce = true)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
    END
  FROM page_analytics
  WHERE page_path = _page_path
    AND created_at BETWEEN _start_date AND _end_date;
$$;

-- Function to get average time on page
CREATE OR REPLACE FUNCTION public.get_avg_time_on_page(
  _page_path TEXT,
  _start_date TIMESTAMPTZ DEFAULT now() - interval '30 days',
  _end_date TIMESTAMPTZ DEFAULT now()
)
RETURNS NUMERIC
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(ROUND(AVG(duration_seconds)), 0)
  FROM page_analytics
  WHERE page_path = _page_path
    AND duration_seconds IS NOT NULL
    AND created_at BETWEEN _start_date AND _end_date;
$$;

-- Function to get top pages by views
CREATE OR REPLACE FUNCTION public.get_top_pages_by_views(
  _limit INTEGER DEFAULT 10,
  _start_date TIMESTAMPTZ DEFAULT now() - interval '30 days',
  _end_date TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE (
  page_path TEXT,
  page_title TEXT,
  view_count BIGINT,
  unique_visitors BIGINT,
  avg_duration NUMERIC,
  bounce_rate NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    pa.page_path,
    MAX(pa.page_title) as page_title,
    COUNT(*) as view_count,
    COUNT(DISTINCT pa.session_id) as unique_visitors,
    COALESCE(ROUND(AVG(pa.duration_seconds)), 0) as avg_duration,
    CASE 
      WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND((COUNT(*) FILTER (WHERE pa.is_bounce = true)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
    END as bounce_rate
  FROM page_analytics pa
  WHERE pa.created_at BETWEEN _start_date AND _end_date
  GROUP BY pa.page_path
  ORDER BY view_count DESC
  LIMIT _limit;
$$;