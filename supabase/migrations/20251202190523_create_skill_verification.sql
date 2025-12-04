-- Create skill verification system
-- This migration creates tables for student work submissions and instructor grading

-- Create skill_submissions table
CREATE TABLE IF NOT EXISTS public.skill_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES public.course_enrollments(id) ON DELETE CASCADE NOT NULL,
  assignment_id UUID REFERENCES public.recommendations(id) ON DELETE SET NULL,
  submission_type TEXT CHECK (submission_type IN ('photo', 'video', 'document')) NOT NULL DEFAULT 'photo',
  file_urls JSONB DEFAULT '[]'::jsonb NOT NULL,
  notes TEXT,
  status TEXT CHECK (status IN ('submitted', 'reviewing', 'passed', 'failed', 'needs_revision')) DEFAULT 'submitted' NOT NULL,
  instructor_feedback TEXT,
  annotation_data JSONB,
  graded_by UUID REFERENCES public.profiles(id),
  graded_at TIMESTAMPTZ,
  score INTEGER CHECK (score BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_skill_submissions_student_id ON public.skill_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_skill_submissions_lesson_id ON public.skill_submissions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_skill_submissions_enrollment_id ON public.skill_submissions(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_skill_submissions_status ON public.skill_submissions(status);
CREATE INDEX IF NOT EXISTS idx_skill_submissions_graded_by ON public.skill_submissions(graded_by);
CREATE INDEX IF NOT EXISTS idx_skill_submissions_assignment_id ON public.skill_submissions(assignment_id);

-- Enable RLS
ALTER TABLE public.skill_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for skill_submissions
-- Students can insert and view their own submissions
-- Note: patients table acts as students, linked via user_id or practitioner_id
CREATE POLICY "Students can insert their own submissions"
  ON public.skill_submissions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.course_enrollments ce
      WHERE ce.id = skill_submissions.enrollment_id
      AND ce.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = skill_submissions.student_id
      AND p.practitioner_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their own submissions"
  ON public.skill_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.course_enrollments ce
      WHERE ce.id = skill_submissions.enrollment_id
      AND ce.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.patients p
      WHERE p.id = skill_submissions.student_id
      AND p.practitioner_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'practitioner'::app_role)
  );

-- Instructors and admins can update submissions (grade them)
CREATE POLICY "Instructors can grade submissions"
  ON public.skill_submissions
  FOR UPDATE
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
CREATE TRIGGER update_skill_submissions_updated_at
  BEFORE UPDATE ON public.skill_submissions
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.skill_submissions IS 'Student work submissions for skill verification (photos/videos/documents)';
COMMENT ON COLUMN public.skill_submissions.file_urls IS 'Array of Supabase Storage URLs for submitted files';
COMMENT ON COLUMN public.skill_submissions.annotation_data IS 'JSONB storing canvas annotation coordinates and tools used by instructor';
COMMENT ON COLUMN public.skill_submissions.score IS 'Optional 1-5 scale score (1=poor, 5=excellent)';

