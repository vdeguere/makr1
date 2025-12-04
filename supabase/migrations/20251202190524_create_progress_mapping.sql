-- Create progress metrics system for spider web charting
-- This migration creates tables for admin-configurable progress metrics and student scores

-- Create progress_metrics table (admin-configurable metrics)
CREATE TABLE IF NOT EXISTS public.progress_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create student_progress_scores table
CREATE TABLE IF NOT EXISTS public.student_progress_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  metric_id UUID REFERENCES public.progress_metrics(id) ON DELETE CASCADE NOT NULL,
  score INTEGER CHECK (score BETWEEN 1 AND 5) NOT NULL,
  scored_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(student_id, metric_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_progress_metrics_is_active ON public.progress_metrics(is_active);
CREATE INDEX IF NOT EXISTS idx_progress_metrics_display_order ON public.progress_metrics(display_order);
CREATE INDEX IF NOT EXISTS idx_student_progress_scores_student_id ON public.student_progress_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_scores_metric_id ON public.student_progress_scores(metric_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_scores_scored_by ON public.student_progress_scores(scored_by);

-- Enable RLS
ALTER TABLE public.progress_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for progress_metrics
CREATE POLICY "Authenticated users can view active metrics"
  ON public.progress_metrics
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can manage metrics"
  ON public.progress_metrics
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for student_progress_scores
CREATE POLICY "Students can view their own scores"
  ON public.student_progress_scores
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = student_progress_scores.student_id
      AND p.practitioner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.course_enrollments ce
      JOIN public.patients p ON p.id = student_progress_scores.student_id
      WHERE ce.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'practitioner'::app_role)
  );

CREATE POLICY "Instructors can score students"
  ON public.student_progress_scores
  FOR ALL
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'practitioner'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'practitioner'::app_role)
  );

-- Create trigger for updated_at
CREATE TRIGGER update_progress_metrics_updated_at
  BEFORE UPDATE ON public.progress_metrics
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_student_progress_scores_updated_at
  BEFORE UPDATE ON public.student_progress_scores
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.progress_metrics IS 'Admin-configurable progress metrics for spider web chart (e.g., Color Theory, Precision, Safety)';
COMMENT ON TABLE public.student_progress_scores IS 'Student scores on progress metrics (1-5 scale)';
COMMENT ON COLUMN public.student_progress_scores.score IS 'Score from 1 (needs improvement) to 5 (excellent)';

