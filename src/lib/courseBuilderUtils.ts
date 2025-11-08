import { supabase } from "@/integrations/supabase/client";

export type Section = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  display_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type Lesson = {
  id: string;
  course_id: string;
  section_id: string | null;
  title: string;
  description: string | null;
  lesson_type: 'video' | 'reading' | 'quiz';
  content_url: string | null;
  video_duration_seconds: number | null;
  transcript: string | null;
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type CourseStructure = {
  sections: Section[];
  lessons: Lesson[];
};

export async function fetchCourseStructure(courseId: string): Promise<CourseStructure> {
  // Fetch sections
  const { data: sections, error: sectionsError } = await supabase
    .from('course_sections')
    .select('*')
    .eq('course_id', courseId)
    .order('display_order');

  if (sectionsError) throw sectionsError;

  // Fetch lessons
  const { data: lessons, error: lessonsError } = await supabase
    .from('course_lessons')
    .select('*')
    .eq('course_id', courseId)
    .order('display_order');

  if (lessonsError) throw lessonsError;

  return {
    sections: sections || [],
    lessons: (lessons || []) as Lesson[],
  };
}

export async function updateSectionOrder(sectionId: string, newOrder: number) {
  const { error } = await supabase
    .from('course_sections')
    .update({ display_order: newOrder })
    .eq('id', sectionId);

  if (error) throw error;
}

export async function updateLessonOrder(lessonId: string, newOrder: number, sectionId?: string) {
  const updateData: any = { display_order: newOrder };
  if (sectionId !== undefined) {
    updateData.section_id = sectionId;
  }

  const { error } = await supabase
    .from('course_lessons')
    .update(updateData)
    .eq('id', lessonId);

  if (error) throw error;
}

export async function createSection(data: Partial<Section>) {
  const { data: section, error } = await supabase
    .from('course_sections')
    .insert([data as any])
    .select()
    .single();

  if (error) throw error;
  return section as Section;
}

export async function updateSection(sectionId: string, data: Partial<Section>) {
  const { error } = await supabase
    .from('course_sections')
    .update(data)
    .eq('id', sectionId);

  if (error) throw error;
}

export async function deleteSection(sectionId: string) {
  const { error } = await supabase
    .from('course_sections')
    .delete()
    .eq('id', sectionId);

  if (error) throw error;
}

export async function createLesson(data: Partial<Lesson>) {
  const { data: lesson, error } = await supabase
    .from('course_lessons')
    .insert([data as any])
    .select()
    .single();

  if (error) throw error;
  return lesson as Lesson;
}

export async function updateLesson(lessonId: string, data: Partial<Lesson>) {
  const { error } = await supabase
    .from('course_lessons')
    .update(data)
    .eq('id', lessonId);

  if (error) throw error;
}

export async function deleteLesson(lessonId: string) {
  const { error } = await supabase
    .from('course_lessons')
    .delete()
    .eq('id', lessonId);

  if (error) throw error;
}

export function formatDuration(seconds: number | null): string {
  if (!seconds) return '—';
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function getLessonTypeIcon(type: string): string {
  switch (type) {
    case 'video':
      return '▶️';
    case 'reading':
      return '📖';
    case 'quiz':
      return '❓';
    default:
      return '📄';
  }
}

export function getLessonTypeColor(type: string): string {
  switch (type) {
    case 'video':
      return 'text-blue-600';
    case 'reading':
      return 'text-green-600';
    case 'quiz':
      return 'text-purple-600';
    default:
      return 'text-muted-foreground';
  }
}
