import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Clock, BookOpen, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { logger } from "@/lib/logger";

interface CourseProgressTrackerProps {
  courseId: string;
  enrollmentId: string;
}

interface ProgressStats {
  completedLessons: number;
  totalLessons: number;
  completionPercentage: number;
  totalTimeSpent: number;
  nextLesson: {
    id: string;
    title: string;
    display_order: number;
  } | null;
}

export function CourseProgressTracker({ courseId, enrollmentId }: CourseProgressTrackerProps) {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProgressStats();
  }, [courseId, enrollmentId]);

  const fetchProgressStats = async () => {
    try {
      // Fetch all lessons for the course
      const { data: lessons, error: lessonsError } = await supabase
        .from("course_lessons")
        .select("id, title, display_order, video_duration_seconds")
        .eq("course_id", courseId)
        .eq("is_published", true)
        .order("display_order");

      if (lessonsError) throw lessonsError;

      // Fetch progress for all lessons
      const { data: progress, error: progressError } = await supabase
        .from("lesson_progress")
        .select("lesson_id, completed_at, last_position_seconds")
        .eq("enrollment_id", enrollmentId);

      if (progressError) throw progressError;

      const completedLessons = progress?.filter(p => p.completed_at)?.length || 0;
      const totalLessons = lessons?.length || 0;
      const completionPercentage = totalLessons > 0 
        ? Math.round((completedLessons / totalLessons) * 100) 
        : 0;

      // Calculate total time spent (sum of video durations for completed lessons)
      let totalTimeSpent = 0;
      progress?.forEach(p => {
        if (p.completed_at) {
          const lesson = lessons?.find(l => l.id === p.lesson_id);
          if (lesson?.video_duration_seconds) {
            totalTimeSpent += lesson.video_duration_seconds;
          }
        } else if (p.last_position_seconds) {
          // Add partial progress for incomplete lessons
          totalTimeSpent += p.last_position_seconds;
        }
      });

      // Find next incomplete lesson
      const completedLessonIds = new Set(
        progress?.filter(p => p.completed_at).map(p => p.lesson_id) || []
      );
      const nextLesson = lessons?.find(lesson => !completedLessonIds.has(lesson.id)) || null;

      setStats({
        completedLessons,
        totalLessons,
        completionPercentage,
        totalTimeSpent,
        nextLesson: nextLesson ? {
          id: nextLesson.id,
          title: nextLesson.title,
          display_order: nextLesson.display_order
        } : null
      });
    } catch (error) {
      logger.error("Error fetching progress stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const handleContinueLearning = () => {
    if (stats?.nextLesson) {
      navigate(`/dashboard/courses/${courseId}/learn`, {
        state: { lessonId: stats.nextLesson.id }
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-20 bg-muted animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Your Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-semibold text-primary">
              {stats.completionPercentage}%
            </span>
          </div>
          <Progress value={stats.completionPercentage} className="h-3" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-2xl font-bold">
                {stats.completedLessons}/{stats.totalLessons}
              </p>
              <p className="text-sm text-muted-foreground">Lessons Complete</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <Clock className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="text-2xl font-bold">
                {formatTime(stats.totalTimeSpent)}
              </p>
              <p className="text-sm text-muted-foreground">Time Spent</p>
            </div>
          </div>
        </div>

        {/* Next Lesson Recommendation */}
        {stats.nextLesson ? (
          <div className="space-y-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Up Next</span>
            </div>
            <div>
              <p className="font-medium mb-1">{stats.nextLesson.title}</p>
              <p className="text-sm text-muted-foreground">
                Lesson {stats.nextLesson.display_order}
              </p>
            </div>
            <Button 
              onClick={handleContinueLearning}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Continue Learning
            </Button>
          </div>
        ) : (
          <div className="text-center p-6 rounded-lg bg-green-50 border border-green-200">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
            <p className="font-semibold text-green-900">Course Completed!</p>
            <p className="text-sm text-green-700 mt-1">
              Congratulations on finishing all lessons
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
