-- Drop all course-related tables in correct order (respecting foreign key dependencies)

-- Drop course certificates table
DROP TABLE IF EXISTS public.course_certificates CASCADE;

-- Drop quiz-related tables
DROP TABLE IF EXISTS public.quiz_attempts CASCADE;
DROP TABLE IF EXISTS public.quiz_answers CASCADE;
DROP TABLE IF EXISTS public.quiz_questions CASCADE;

-- Drop lesson-related tables
DROP TABLE IF EXISTS public.lesson_quizzes CASCADE;
DROP TABLE IF EXISTS public.lesson_resources CASCADE;
DROP TABLE IF EXISTS public.lesson_progress CASCADE;

-- Drop course enrollment and lessons
DROP TABLE IF EXISTS public.course_enrollments CASCADE;
DROP TABLE IF EXISTS public.course_lessons CASCADE;

-- Drop main courses table
DROP TABLE IF EXISTS public.courses CASCADE;

-- Remove the update_course_progress function
DROP FUNCTION IF EXISTS public.update_course_progress() CASCADE;

-- Remove storage buckets
DELETE FROM storage.buckets WHERE id = 'course-videos';
DELETE FROM storage.buckets WHERE id = 'course-resources';
DELETE FROM storage.buckets WHERE id = 'course-thumbnails';