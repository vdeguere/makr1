-- Drop existing course storage policies if they exist
DROP POLICY IF EXISTS "Anyone can view course videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload course videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update course videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete course videos" ON storage.objects;
DROP POLICY IF EXISTS "Enrolled users can view course resources" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage course resources" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view course thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage course thumbnails" ON storage.objects;

-- Create courses core tables for practitioner training

-- Main courses table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_hours INTEGER,
  category TEXT,
  prerequisites JSONB DEFAULT '[]'::jsonb,
  learning_outcomes JSONB DEFAULT '[]'::jsonb,
  instructor_id UUID REFERENCES auth.users(id),
  is_published BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Course lessons table
CREATE TABLE IF NOT EXISTS public.course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  lesson_type TEXT CHECK (lesson_type IN ('video', 'reading', 'quiz', 'mixed')) DEFAULT 'video',
  content_url TEXT,
  video_duration_seconds INTEGER,
  transcript TEXT,
  display_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Lesson resources (downloadable materials)
CREATE TABLE IF NOT EXISTS public.lesson_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE CASCADE NOT NULL,
  resource_name TEXT NOT NULL,
  resource_type TEXT CHECK (resource_type IN ('pdf', 'document', 'link', 'image')),
  file_path TEXT,
  file_size INTEGER,
  external_url TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Lesson quizzes
CREATE TABLE IF NOT EXISTS public.lesson_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 70,
  max_attempts INTEGER,
  time_limit_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Quiz questions
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.lesson_quizzes(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT CHECK (question_type IN ('multiple_choice', 'true_false')) DEFAULT 'multiple_choice',
  explanation TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Quiz answers
CREATE TABLE IF NOT EXISTS public.quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES public.quiz_questions(id) ON DELETE CASCADE NOT NULL,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Course enrollments
CREATE TABLE IF NOT EXISTS public.course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completion_percentage INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  certificate_issued_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(course_id, user_id)
);

-- Lesson progress tracking
CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES public.course_enrollments(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_position_seconds INTEGER DEFAULT 0,
  notes TEXT,
  UNIQUE(enrollment_id, lesson_id)
);

-- Quiz attempts
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.lesson_quizzes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  enrollment_id UUID REFERENCES public.course_enrollments(id) ON DELETE CASCADE NOT NULL,
  attempt_number INTEGER NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  score_percentage INTEGER,
  passed BOOLEAN DEFAULT false,
  answers_data JSONB,
  time_taken_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Course certificates
CREATE TABLE IF NOT EXISTS public.course_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES public.course_enrollments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  certificate_url TEXT,
  verification_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  UNIQUE(enrollment_id)
);

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('course-videos', 'course-videos', true, 524288000, ARRAY['video/mp4', 'video/webm', 'video/quicktime']),
  ('course-resources', 'course-resources', false, 52428800, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/webp']),
  ('course-thumbnails', 'course-thumbnails', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Practitioners can view published courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can manage all courses" ON public.courses;

CREATE POLICY "Practitioners can view published courses"
  ON public.courses FOR SELECT
  TO authenticated
  USING (is_published = true AND has_role(auth.uid(), 'practitioner'::app_role));

CREATE POLICY "Admins can manage all courses"
  ON public.courses FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for course_lessons
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enrolled users can view published lessons" ON public.course_lessons;
DROP POLICY IF EXISTS "Admins can manage all lessons" ON public.course_lessons;

CREATE POLICY "Enrolled users can view published lessons"
  ON public.course_lessons FOR SELECT
  TO authenticated
  USING (
    is_published = true 
    AND EXISTS (
      SELECT 1 FROM public.course_enrollments
      WHERE course_id = course_lessons.course_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all lessons"
  ON public.course_lessons FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for lesson_resources
ALTER TABLE public.lesson_resources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enrolled users can view lesson resources" ON public.lesson_resources;
DROP POLICY IF EXISTS "Admins can manage all resources" ON public.lesson_resources;

CREATE POLICY "Enrolled users can view lesson resources"
  ON public.lesson_resources FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.course_lessons cl
      JOIN public.course_enrollments ce ON ce.course_id = cl.course_id
      WHERE cl.id = lesson_resources.lesson_id
      AND ce.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all resources"
  ON public.lesson_resources FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for course_enrollments
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Practitioners can enroll themselves" ON public.course_enrollments;
DROP POLICY IF EXISTS "Users can view their own enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Users can update their own enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Admins can manage all enrollments" ON public.course_enrollments;

CREATE POLICY "Practitioners can enroll themselves"
  ON public.course_enrollments FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'practitioner'::app_role)
    AND user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.courses
      WHERE id = course_enrollments.course_id
      AND is_published = true
    )
  );

CREATE POLICY "Users can view their own enrollments"
  ON public.course_enrollments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own enrollments"
  ON public.course_enrollments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all enrollments"
  ON public.course_enrollments FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for lesson_progress
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own lesson progress" ON public.lesson_progress;
DROP POLICY IF EXISTS "Admins can view all lesson progress" ON public.lesson_progress;

CREATE POLICY "Users can manage their own lesson progress"
  ON public.lesson_progress FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all lesson progress"
  ON public.lesson_progress FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for quiz_attempts
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own quiz attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Admins can view all quiz attempts" ON public.quiz_attempts;

CREATE POLICY "Users can manage their own quiz attempts"
  ON public.quiz_attempts FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all quiz attempts"
  ON public.quiz_attempts FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for course_certificates
ALTER TABLE public.course_certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own certificates" ON public.course_certificates;
DROP POLICY IF EXISTS "System can issue certificates" ON public.course_certificates;
DROP POLICY IF EXISTS "Admins can view all certificates" ON public.course_certificates;

CREATE POLICY "Users can view their own certificates"
  ON public.course_certificates FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can issue certificates"
  ON public.course_certificates FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all certificates"
  ON public.course_certificates FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for quiz-related tables
ALTER TABLE public.lesson_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enrolled users can view quizzes" ON public.lesson_quizzes;
DROP POLICY IF EXISTS "Admins can manage quizzes" ON public.lesson_quizzes;
DROP POLICY IF EXISTS "Enrolled users can view questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Admins can manage questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Enrolled users can view answers" ON public.quiz_answers;
DROP POLICY IF EXISTS "Admins can manage answers" ON public.quiz_answers;

CREATE POLICY "Enrolled users can view quizzes"
  ON public.lesson_quizzes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.course_lessons cl
      JOIN public.course_enrollments ce ON ce.course_id = cl.course_id
      WHERE cl.id = lesson_quizzes.lesson_id
      AND ce.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage quizzes"
  ON public.lesson_quizzes FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Enrolled users can view questions"
  ON public.quiz_questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.lesson_quizzes lq
      JOIN public.course_lessons cl ON cl.id = lq.lesson_id
      JOIN public.course_enrollments ce ON ce.course_id = cl.course_id
      WHERE lq.id = quiz_questions.quiz_id
      AND ce.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage questions"
  ON public.quiz_questions FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Enrolled users can view answers"
  ON public.quiz_answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.quiz_questions qq
      JOIN public.lesson_quizzes lq ON lq.id = qq.quiz_id
      JOIN public.course_lessons cl ON cl.id = lq.lesson_id
      JOIN public.course_enrollments ce ON ce.course_id = cl.course_id
      WHERE qq.id = quiz_answers.question_id
      AND ce.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage answers"
  ON public.quiz_answers FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for course-videos bucket
CREATE POLICY "Anyone can view course videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-videos');

CREATE POLICY "Admins can upload course videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'course-videos'
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can update course videos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'course-videos'
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can delete course videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'course-videos'
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- Storage policies for course-resources bucket
CREATE POLICY "Enrolled users can view course resources"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'course-resources'
    AND EXISTS (
      SELECT 1 FROM public.lesson_resources lr
      JOIN public.course_lessons cl ON cl.id = lr.lesson_id
      JOIN public.course_enrollments ce ON ce.course_id = cl.course_id
      WHERE lr.file_path = storage.objects.name
      AND ce.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage course resources"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'course-resources'
    AND has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    bucket_id = 'course-resources'
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- Storage policies for course-thumbnails bucket
CREATE POLICY "Anyone can view course thumbnails"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-thumbnails');

CREATE POLICY "Admins can manage course thumbnails"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'course-thumbnails'
    AND has_role(auth.uid(), 'admin'::app_role)
  )
  WITH CHECK (
    bucket_id = 'course-thumbnails'
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- Function to calculate course completion percentage
CREATE OR REPLACE FUNCTION update_course_progress()
RETURNS TRIGGER AS $$
DECLARE
  total_lessons INTEGER;
  completed_lessons INTEGER;
  new_percentage INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_lessons
  FROM public.course_lessons cl
  JOIN public.course_enrollments ce ON ce.course_id = cl.course_id
  WHERE ce.id = NEW.enrollment_id
  AND cl.is_published = true;

  SELECT COUNT(*) INTO completed_lessons
  FROM public.lesson_progress lp
  WHERE lp.enrollment_id = NEW.enrollment_id
  AND lp.completed_at IS NOT NULL;

  IF total_lessons > 0 THEN
    new_percentage := ROUND((completed_lessons::NUMERIC / total_lessons::NUMERIC) * 100);
  ELSE
    new_percentage := 0;
  END IF;

  UPDATE public.course_enrollments
  SET 
    completion_percentage = new_percentage,
    last_accessed_at = now(),
    started_at = COALESCE(started_at, now()),
    completed_at = CASE WHEN new_percentage = 100 THEN now() ELSE NULL END
  WHERE id = NEW.enrollment_id;

  IF new_percentage = 100 THEN
    INSERT INTO public.course_certificates (enrollment_id, user_id, course_id, issued_at)
    SELECT 
      ce.id,
      ce.user_id,
      ce.course_id,
      now()
    FROM public.course_enrollments ce
    WHERE ce.id = NEW.enrollment_id
    ON CONFLICT (enrollment_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS update_progress_on_lesson_complete ON public.lesson_progress;
CREATE TRIGGER update_progress_on_lesson_complete
  AFTER INSERT OR UPDATE ON public.lesson_progress
  FOR EACH ROW
  WHEN (NEW.completed_at IS NOT NULL)
  EXECUTE FUNCTION update_course_progress();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_courses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_courses_timestamp ON public.courses;
DROP TRIGGER IF EXISTS update_lessons_timestamp ON public.course_lessons;
DROP TRIGGER IF EXISTS update_quizzes_timestamp ON public.lesson_quizzes;

CREATE TRIGGER update_courses_timestamp
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION update_courses_updated_at();

CREATE TRIGGER update_lessons_timestamp
  BEFORE UPDATE ON public.course_lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_courses_updated_at();

CREATE TRIGGER update_quizzes_timestamp
  BEFORE UPDATE ON public.lesson_quizzes
  FOR EACH ROW
  EXECUTE FUNCTION update_courses_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_courses_published ON public.courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category);
CREATE INDEX IF NOT EXISTS idx_course_lessons_course_id ON public.course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_order ON public.course_lessons(course_id, display_order);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON public.course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_enrollment ON public.lesson_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON public.lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user ON public.course_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_verification ON public.course_certificates(verification_code);