-- Create courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_hours INTEGER,
  is_published BOOLEAN DEFAULT false,
  category TEXT,
  prerequisites JSONB DEFAULT '[]'::jsonb,
  learning_outcomes JSONB DEFAULT '[]'::jsonb,
  instructor_id UUID REFERENCES profiles(id),
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  display_order INTEGER DEFAULT 0
);

-- Create course_lessons table
CREATE TABLE course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  lesson_type TEXT CHECK (lesson_type IN ('video', 'reading', 'quiz', 'mixed')) NOT NULL,
  content_url TEXT,
  video_duration_seconds INTEGER,
  transcript TEXT,
  display_order INTEGER NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(course_id, display_order)
);

-- Create lesson_resources table
CREATE TABLE lesson_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE CASCADE NOT NULL,
  resource_name TEXT NOT NULL,
  resource_type TEXT CHECK (resource_type IN ('pdf', 'document', 'link', 'image')) NOT NULL,
  file_path TEXT,
  file_size INTEGER,
  external_url TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create lesson_quizzes table
CREATE TABLE lesson_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 70,
  max_attempts INTEGER,
  time_limit_minutes INTEGER,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create quiz_questions table
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES lesson_quizzes(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT CHECK (question_type IN ('multiple_choice', 'true_false')) DEFAULT 'multiple_choice',
  explanation TEXT,
  points INTEGER DEFAULT 1,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(quiz_id, display_order)
);

-- Create quiz_answers table
CREATE TABLE quiz_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE NOT NULL,
  answer_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(question_id, display_order)
);

-- Create course_enrollments table
CREATE TABLE course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completion_percentage INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  certificate_issued_at TIMESTAMPTZ,
  UNIQUE(course_id, user_id)
);

-- Create lesson_progress table
CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES course_enrollments(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES course_lessons(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  last_position_seconds INTEGER DEFAULT 0,
  notes TEXT,
  UNIQUE(enrollment_id, lesson_id)
);

-- Create quiz_attempts table
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES lesson_quizzes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  enrollment_id UUID REFERENCES course_enrollments(id) ON DELETE CASCADE NOT NULL,
  attempt_number INTEGER NOT NULL,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  score_percentage INTEGER,
  passed BOOLEAN DEFAULT false,
  answers_data JSONB,
  time_taken_seconds INTEGER,
  UNIQUE(quiz_id, user_id, attempt_number)
);

-- Create course_certificates table
CREATE TABLE course_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES course_enrollments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  course_id UUID REFERENCES courses(id) NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT now(),
  certificate_url TEXT,
  verification_code TEXT UNIQUE NOT NULL,
  UNIQUE(enrollment_id)
);

-- Create indexes for better performance
CREATE INDEX idx_courses_published ON courses(is_published);
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_course_lessons_course_id ON course_lessons(course_id);
CREATE INDEX idx_lesson_resources_lesson_id ON lesson_resources(lesson_id);
CREATE INDEX idx_lesson_quizzes_lesson_id ON lesson_quizzes(lesson_id);
CREATE INDEX idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
CREATE INDEX idx_quiz_answers_question_id ON quiz_answers(question_id);
CREATE INDEX idx_course_enrollments_user_id ON course_enrollments(user_id);
CREATE INDEX idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX idx_lesson_progress_enrollment_id ON lesson_progress(enrollment_id);
CREATE INDEX idx_lesson_progress_user_id ON lesson_progress(user_id);
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX idx_course_certificates_user_id ON course_certificates(user_id);

-- Enable RLS on all tables
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for courses table
CREATE POLICY "Practitioners and admins can view published courses"
  ON courses FOR SELECT
  TO authenticated
  USING (
    is_published = true 
    OR created_by = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can insert courses"
  ON courses FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update courses"
  ON courses FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete courses"
  ON courses FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for course_lessons table
CREATE POLICY "Enrolled users can view published lessons"
  ON course_lessons FOR SELECT
  TO authenticated
  USING (
    (is_published = true AND EXISTS (
      SELECT 1 FROM course_enrollments 
      WHERE course_enrollments.course_id = course_lessons.course_id 
      AND course_enrollments.user_id = auth.uid()
    ))
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can manage lessons"
  ON course_lessons FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for lesson_resources table
CREATE POLICY "Enrolled users can view resources"
  ON lesson_resources FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM course_lessons cl
      JOIN course_enrollments ce ON ce.course_id = cl.course_id
      WHERE cl.id = lesson_resources.lesson_id 
      AND ce.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can manage resources"
  ON lesson_resources FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for lesson_quizzes table
CREATE POLICY "Enrolled users can view quizzes"
  ON lesson_quizzes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM course_lessons cl
      JOIN course_enrollments ce ON ce.course_id = cl.course_id
      WHERE cl.id = lesson_quizzes.lesson_id 
      AND ce.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can manage quizzes"
  ON lesson_quizzes FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for quiz_questions table
CREATE POLICY "Enrolled users can view questions"
  ON quiz_questions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lesson_quizzes lq
      JOIN course_lessons cl ON cl.id = lq.lesson_id
      JOIN course_enrollments ce ON ce.course_id = cl.course_id
      WHERE lq.id = quiz_questions.quiz_id 
      AND ce.user_id = auth.uid()
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can manage questions"
  ON quiz_questions FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for quiz_answers table
CREATE POLICY "Users can view answers after quiz completion"
  ON quiz_answers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quiz_attempts qa
      WHERE qa.quiz_id IN (
        SELECT quiz_id FROM quiz_questions WHERE id = quiz_answers.question_id
      )
      AND qa.user_id = auth.uid()
      AND qa.completed_at IS NOT NULL
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can manage answers"
  ON quiz_answers FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for course_enrollments table
CREATE POLICY "Users can view their own enrollments"
  ON course_enrollments FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Practitioners can enroll themselves"
  ON course_enrollments FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND has_role(auth.uid(), 'practitioner'::app_role)
  );

CREATE POLICY "Users can update their own enrollments"
  ON course_enrollments FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can delete enrollments"
  ON course_enrollments FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for lesson_progress table
CREATE POLICY "Users can view their own progress"
  ON lesson_progress FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can track their own progress"
  ON lesson_progress FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
  );

-- RLS Policies for quiz_attempts table
CREATE POLICY "Users can view their own quiz attempts"
  ON quiz_attempts FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can create their own quiz attempts"
  ON quiz_attempts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own quiz attempts"
  ON quiz_attempts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for course_certificates table
CREATE POLICY "Users can view their own certificates"
  ON course_certificates FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "System can create certificates"
  ON course_certificates FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('course-videos', 'course-videos', true, 524288000, ARRAY['video/mp4', 'video/webm', 'video/quicktime']),
  ('course-resources', 'course-resources', false, 52428800, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('course-thumbnails', 'course-thumbnails', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('certificates', 'certificates', false, 2097152, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

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
    AND (
      has_role(auth.uid(), 'admin'::app_role)
      OR auth.uid()::text = ANY(STRING_TO_ARRAY(name, '/'))
    )
  );

CREATE POLICY "Admins can upload course resources"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'course-resources'
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can update course resources"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'course-resources'
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can delete course resources"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'course-resources'
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- Storage policies for course-thumbnails bucket
CREATE POLICY "Anyone can view course thumbnails"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-thumbnails');

CREATE POLICY "Admins can upload course thumbnails"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'course-thumbnails'
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can update course thumbnails"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'course-thumbnails'
    AND has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Admins can delete course thumbnails"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'course-thumbnails'
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- Storage policies for certificates bucket
CREATE POLICY "Users can view their own certificates"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'certificates'
    AND (
      auth.uid()::text = (STRING_TO_ARRAY(name, '/'))[1]
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

CREATE POLICY "System can upload certificates"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'certificates');

-- Create function to update course progress
CREATE OR REPLACE FUNCTION update_course_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE course_enrollments
  SET 
    completion_percentage = (
      SELECT 
        COALESCE((COUNT(lp.completed_at)::FLOAT / NULLIF(COUNT(cl.id)::FLOAT, 0) * 100)::INTEGER, 0)
      FROM course_lessons cl
      LEFT JOIN lesson_progress lp ON lp.lesson_id = cl.id 
        AND lp.enrollment_id = NEW.enrollment_id
      WHERE cl.course_id = (
        SELECT course_id FROM course_enrollments WHERE id = NEW.enrollment_id
      )
    ),
    last_accessed_at = NOW(),
    started_at = COALESCE(started_at, NOW())
  WHERE id = NEW.enrollment_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for lesson completion
CREATE TRIGGER lesson_completion_trigger
AFTER INSERT OR UPDATE OF completed_at ON lesson_progress
FOR EACH ROW
WHEN (NEW.completed_at IS NOT NULL)
EXECUTE FUNCTION update_course_progress();

-- Create triggers for updated_at
CREATE TRIGGER update_courses_updated_at
BEFORE UPDATE ON courses
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_course_lessons_updated_at
BEFORE UPDATE ON course_lessons
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_lesson_quizzes_updated_at
BEFORE UPDATE ON lesson_quizzes
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_quiz_questions_updated_at
BEFORE UPDATE ON quiz_questions
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();