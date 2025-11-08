import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/contexts/RoleContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2,
  GripVertical,
  Video,
  FileText,
  HelpCircle,
  Paperclip,
  ArrowLeft
} from 'lucide-react';
import { LessonFormDialog } from '@/components/admin/LessonFormDialog';
import { QuizFormDialog } from '@/components/admin/QuizFormDialog';
import { ResourceFormDialog } from '@/components/admin/ResourceFormDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  lesson_type: string;
  content_url: string | null;
  video_duration_seconds: number | null;
  is_published: boolean;
  display_order: number;
  quiz_count?: number;
  resource_count?: number;
}

interface Course {
  id: string;
  title: string;
}

function SortableLesson({ lesson, onEdit, onDelete, onManageQuiz, onManageResources }: {
  lesson: Lesson;
  onEdit: (lesson: Lesson) => void;
  onDelete: (lesson: Lesson) => void;
  onManageQuiz: (lesson: Lesson) => void;
  onManageResources: (lesson: Lesson) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getLessonIcon = () => {
    switch (lesson.lesson_type) {
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'reading':
        return <FileText className="h-4 w-4" />;
      case 'quiz':
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 p-4 border rounded-lg bg-background"
    >
      <button
        className="cursor-grab active:cursor-grabbing mt-1 touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {getLessonIcon()}
          <h3 className="font-semibold truncate">{lesson.title}</h3>
          <Badge variant={lesson.is_published ? 'default' : 'secondary'} className="shrink-0">
            {lesson.is_published ? 'Published' : 'Draft'}
          </Badge>
        </div>
        {lesson.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {lesson.description}
          </p>
        )}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="capitalize">{lesson.lesson_type}</span>
          {lesson.video_duration_seconds && (
            <span>{Math.floor(lesson.video_duration_seconds / 60)}min</span>
          )}
          {lesson.quiz_count !== undefined && (
            <span>{lesson.quiz_count} quiz{lesson.quiz_count !== 1 ? 'zes' : ''}</span>
          )}
          {lesson.resource_count !== undefined && (
            <span>{lesson.resource_count} resource{lesson.resource_count !== 1 ? 's' : ''}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onManageQuiz(lesson)}
          title="Manage Quiz"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onManageResources(lesson)}
          title="Manage Resources"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(lesson)}
          title="Edit Lesson"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(lesson)}
          title="Delete Lesson"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function LessonManagement() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  const [selectedLessonForManagement, setSelectedLessonForManagement] = useState<Lesson | null>(null);

  const { activeRole, loading: roleLoading } = useRole();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (roleLoading) return;
    
    if (activeRole !== 'admin' && activeRole !== 'dev') {
      navigate('/dashboard');
      return;
    }
    
    if (courseId) {
      fetchCourseAndLessons();
    }
  }, [activeRole, roleLoading, navigate, courseId]);

  const fetchCourseAndLessons = async () => {
    if (!courseId) return;

    try {
      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('id, title')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('display_order', { ascending: true });

      if (lessonsError) throw lessonsError;

      // Get quiz counts
      const { data: quizzes } = await supabase
        .from('lesson_quizzes')
        .select('lesson_id');

      // Get resource counts
      const { data: resources } = await supabase
        .from('lesson_resources')
        .select('lesson_id');

      const quizCounts = quizzes?.reduce((acc, quiz) => {
        acc[quiz.lesson_id] = (acc[quiz.lesson_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const resourceCounts = resources?.reduce((acc, resource) => {
        acc[resource.lesson_id] = (acc[resource.lesson_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const lessonsWithCounts = lessonsData?.map(lesson => ({
        ...lesson,
        quiz_count: quizCounts[lesson.id] || 0,
        resource_count: resourceCounts[lesson.id] || 0,
      })) || [];

      setLessons(lessonsWithCounts);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLesson = () => {
    setSelectedLesson(undefined);
    setLessonDialogOpen(true);
  };

  const handleEditLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setLessonDialogOpen(true);
  };

  const handleDeleteClick = (lesson: Lesson) => {
    setLessonToDelete(lesson);
    setDeleteDialogOpen(true);
  };

  const handleDeleteLesson = async () => {
    if (!lessonToDelete) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('course_lessons')
        .delete()
        .eq('id', lessonToDelete.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Lesson deleted successfully',
      });

      fetchCourseAndLessons();
      setDeleteDialogOpen(false);
      setLessonToDelete(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleManageQuiz = (lesson: Lesson) => {
    setSelectedLessonForManagement(lesson);
    setQuizDialogOpen(true);
  };

  const handleManageResources = (lesson: Lesson) => {
    setSelectedLessonForManagement(lesson);
    setResourceDialogOpen(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = lessons.findIndex((l) => l.id === active.id);
    const newIndex = lessons.findIndex((l) => l.id === over.id);

    const newLessons = arrayMove(lessons, oldIndex, newIndex);
    setLessons(newLessons);

    // Update display order in database
    try {
      const updates = newLessons.map((lesson, index) => ({
        id: lesson.id,
        display_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from('course_lessons')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }

      toast({
        title: 'Success',
        description: 'Lesson order updated',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      fetchCourseAndLessons();
    }
  };

  if (loading || roleLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!course) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Course not found</p>
          <Button onClick={() => navigate('/dashboard/admin/courses')} className="mt-4">
            Back to Courses
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard/admin/courses')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8" />
              <div>
                <h1 className="text-3xl font-bold">{course.title}</h1>
                <p className="text-muted-foreground">Manage lessons and content</p>
              </div>
            </div>
          </div>
          
          <Button onClick={handleCreateLesson}>
            <Plus className="h-4 w-4 mr-2" />
            Add Lesson
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Course Lessons</CardTitle>
            <CardDescription>Drag to reorder lessons</CardDescription>
          </CardHeader>
          <CardContent>
            {lessons.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={lessons.map(l => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {lessons.map((lesson) => (
                      <SortableLesson
                        key={lesson.id}
                        lesson={lesson}
                        onEdit={handleEditLesson}
                        onDelete={handleDeleteClick}
                        onManageQuiz={handleManageQuiz}
                        onManageResources={handleManageResources}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No lessons yet. Add your first lesson to get started.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <LessonFormDialog
        open={lessonDialogOpen}
        onOpenChange={setLessonDialogOpen}
        courseId={courseId!}
        lesson={selectedLesson}
        onSuccess={fetchCourseAndLessons}
      />

      <QuizFormDialog
        open={quizDialogOpen}
        onOpenChange={setQuizDialogOpen}
        lesson={selectedLessonForManagement}
        onSuccess={fetchCourseAndLessons}
      />

      <ResourceFormDialog
        open={resourceDialogOpen}
        onOpenChange={setResourceDialogOpen}
        lesson={selectedLessonForManagement}
        onSuccess={fetchCourseAndLessons}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{lessonToDelete?.title}"? This will also remove
              all associated quizzes, resources, and student progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLesson}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
