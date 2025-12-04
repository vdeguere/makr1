import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2, Download, FileText, Play, Pause, ClipboardList, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import LessonQuiz from '@/components/quiz/LessonQuiz';
import { SkillSubmissionDialog } from '@/components/students/skills/SkillSubmissionDialog';

interface Lesson {
  id: string;
  title: string;
  content_url: string;
  video_duration_seconds: number;
  is_completed: boolean;
  lesson_type: string;
}

interface Resource {
  id: string;
  resource_name: string;
  file_path: string;
  resource_type: string;
}

export default function CourseLearning() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [enrollmentId, setEnrollmentId] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [hasQuiz, setHasQuiz] = useState(false);
  const [showSubmissionDialog, setShowSubmissionDialog] = useState(false);

  useEffect(() => {
    fetchCourseData();
  }, [courseId]);

  // Handle navigation from course detail page with specific lesson
  useEffect(() => {
    const lessonId = (location.state as any)?.lessonId;
    if (lessonId && lessons.length > 0) {
      const lesson = lessons.find(l => l.id === lessonId);
      if (lesson) {
        setCurrentLesson(lesson);
        loadLessonResources(lesson.id);
        checkLessonQuiz(lesson.id);
        if (enrollmentId) {
          loadLastPosition(enrollmentId, lesson.id);
        }
      }
      // Clear the state to avoid re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state, lessons, enrollmentId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      saveProgress(video.currentTime);
    };

    const handleEnded = () => {
      markLessonComplete();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [currentLesson, enrollmentId]);

  const fetchCourseData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: enrollment } = await supabase
        .from('course_enrollments')
        .select('id, completion_percentage')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .single();

      if (!enrollment) {
        toast({ title: 'Error', description: 'Not enrolled in this course', variant: 'destructive' });
        navigate(`/dashboard/courses/${courseId}`);
        return;
      }

      setEnrollmentId(enrollment.id);
      setCompletionPercentage(enrollment.completion_percentage);

      // Fetch student ID (patient ID) for the current user
      const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (patient) {
        setStudentId(patient.id);
      }

      const { data: lessonsData } = await supabase
        .from('course_lessons')
        .select('id, title, content_url, video_duration_seconds, lesson_type')
        .eq('course_id', courseId)
        .eq('is_published', true)
        .order('display_order');

      const { data: progress } = await supabase
        .from('lesson_progress')
        .select('lesson_id')
        .eq('enrollment_id', enrollment.id)
        .not('completed_at', 'is', null);

      const completedIds = new Set(progress?.map(p => p.lesson_id) || []);
      const lessonsWithProgress = lessonsData?.map(l => ({
        ...l,
        is_completed: completedIds.has(l.id),
      })) || [];

      setLessons(lessonsWithProgress);
      if (lessonsWithProgress.length > 0) {
        const firstIncomplete = lessonsWithProgress.find(l => !l.is_completed) || lessonsWithProgress[0];
        setCurrentLesson(firstIncomplete);
        loadLessonResources(firstIncomplete.id);
        await loadLastPosition(enrollment.id, firstIncomplete.id);
        await checkLessonQuiz(firstIncomplete.id);
      }
    } catch (error) {
      logger.error('Error:', error);
    }
  };

  const loadLessonResources = async (lessonId: string) => {
    const { data } = await supabase
      .from('lesson_resources')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('display_order');
    setResources(data || []);
  };

  const checkLessonQuiz = async (lessonId: string) => {
    const { data } = await supabase
      .from('lesson_quizzes')
      .select('id')
      .eq('lesson_id', lessonId)
      .maybeSingle();

    setHasQuiz(!!data);
    setShowQuiz(false);
  };

  const loadLastPosition = async (enrollmentId: string, lessonId: string) => {
    const { data } = await supabase
      .from('lesson_progress')
      .select('last_position_seconds')
      .eq('enrollment_id', enrollmentId)
      .eq('lesson_id', lessonId)
      .maybeSingle();
    
    if (data?.last_position_seconds && videoRef.current) {
      videoRef.current.currentTime = data.last_position_seconds;
    }
  };

  let lastSaveTime = 0;
  const saveProgress = async (currentTime: number) => {
    if (!currentLesson || !enrollmentId) return;
    const now = Date.now();
    if (now - lastSaveTime < 10000) return; // Save every 10 seconds
    lastSaveTime = now;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('lesson_progress').upsert({
      enrollment_id: enrollmentId,
      lesson_id: currentLesson.id,
      user_id: user.id,
      last_position_seconds: Math.floor(currentTime),
    }, { onConflict: 'enrollment_id,lesson_id' });
  };

  const markLessonComplete = async () => {
    if (!currentLesson || !enrollmentId) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('lesson_progress').upsert({
      enrollment_id: enrollmentId,
      lesson_id: currentLesson.id,
      user_id: user.id,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'enrollment_id,lesson_id' });

    setLessons(prev => prev.map(l => 
      l.id === currentLesson.id ? { ...l, is_completed: true } : l
    ));

    toast({ title: 'Lesson completed!' });
    await fetchCourseData();
  };

  const downloadResource = async (resource: Resource) => {
    const { data } = await supabase.storage
      .from('course-resources')
      .download(resource.file_path);
    
    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = resource.resource_name;
      a.click();
    }
  };

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleQuizComplete = () => {
    setShowQuiz(false);
    markLessonComplete();
  };

  return (
    <DashboardLayout>
      <div className="space-y-fluid-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate(`/dashboard/courses/${courseId}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Course
          </Button>
          <div className="text-sm">
            <span className="text-muted-foreground">Progress:</span>
            <span className="ml-2 font-medium">{completionPercentage}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-fluid-4">
          <div className="lg:col-span-3 space-y-fluid-4">
            {currentLesson && !showQuiz && (
              <Card>
                <CardContent className="p-0">
                  <div className="relative aspect-video bg-black group">
                    <video
                      ref={videoRef}
                      src={currentLesson.content_url}
                      className="w-full h-full"
                      controls
                    />
                    <button
                      onClick={handlePlayPause}
                      className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {isPlaying ? (
                        <Pause className="h-16 w-16 text-white" />
                      ) : (
                        <Play className="h-16 w-16 text-white" />
                      )}
                    </button>
                  </div>
                  <div className="p-fluid-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-fluid-xl font-bold">{currentLesson.title}</h2>
                      <div className="flex items-center gap-2">
                        <Button onClick={() => setShowSubmissionDialog(true)} variant="outline">
                          <Camera className="mr-2 h-4 w-4" />
                          Submit Work
                        </Button>
                        {hasQuiz && (
                          <Button onClick={() => setShowQuiz(true)} variant="outline">
                            <ClipboardList className="mr-2 h-4 w-4" />
                            Take Quiz
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {currentLesson && showQuiz && enrollmentId && (
              <LessonQuiz
                lessonId={currentLesson.id}
                enrollmentId={enrollmentId}
                onComplete={handleQuizComplete}
              />
            )}

            {currentLesson && showSubmissionDialog && enrollmentId && studentId && (
              <SkillSubmissionDialog
                open={showSubmissionDialog}
                onOpenChange={setShowSubmissionDialog}
                studentId={studentId}
                enrollmentId={enrollmentId}
                lessonId={currentLesson.id}
                lessonName={currentLesson.title}
                onSuccess={() => {
                  setShowSubmissionDialog(false);
                  toast({
                    title: 'Work Submitted',
                    description: 'Your submission has been sent for review.',
                  });
                }}
              />
            )}

            {resources.length > 0 && (
              <Card>
                <CardContent className="p-fluid-4">
                  <h3 className="font-semibold mb-fluid-3">Resources</h3>
                  <div className="space-y-fluid-2">
                    {resources.map(resource => (
                      <div key={resource.id} className="flex items-center justify-between p-fluid-2 rounded-lg hover:bg-muted">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>{resource.resource_name}</span>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => downloadResource(resource)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Card className="lg:col-span-1">
            <CardContent className="p-fluid-4">
              <h3 className="font-semibold mb-fluid-3">Lessons</h3>
              <Progress value={completionPercentage} className="mb-fluid-4" />
              <ScrollArea className="h-[600px]">
                <div className="space-y-fluid-2">
                  {lessons.map(lesson => (
                    <button
                      key={lesson.id}
                      onClick={async () => {
                        setCurrentLesson(lesson);
                        loadLessonResources(lesson.id);
                        await checkLessonQuiz(lesson.id);
                        if (enrollmentId) {
                          loadLastPosition(enrollmentId, lesson.id);
                        }
                      }}
                      className={`w-full text-left p-fluid-3 rounded-lg transition-colors ${
                        currentLesson?.id === lesson.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-start gap-2">
                          {lesson.is_completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 flex-shrink-0 mt-0.5" />
                          )}
                          <span className="text-sm font-medium line-clamp-2 flex-1">{lesson.title}</span>
                        </div>
                        {currentLesson?.id === lesson.id && hasQuiz && (
                          <div className="ml-7">
                            <Badge variant="secondary" className="text-xs">
                              <ClipboardList className="h-3 w-3 mr-1" />
                              Has Quiz
                            </Badge>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}