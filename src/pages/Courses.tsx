import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen, GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  difficulty_level: string;
  estimated_hours: number;
  category: string;
  is_enrolled?: boolean;
  completion_percentage?: number;
}

export default function Courses() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch published courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .order('display_order', { ascending: true });

      if (coursesError) throw coursesError;

      // Check enrollment status
      const { data: enrollments, error: enrollError } = await supabase
        .from('course_enrollments')
        .select('course_id, completion_percentage')
        .eq('user_id', user.id);

      if (enrollError) throw enrollError;

      const enrollmentMap = new Map(
        enrollments?.map(e => [e.course_id, e.completion_percentage]) || []
      );

      const coursesWithEnrollment = coursesData?.map(course => ({
        ...course,
        is_enrolled: enrollmentMap.has(course.id),
        completion_percentage: enrollmentMap.get(course.id) || 0,
      })) || [];

      setCourses(coursesWithEnrollment);
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load courses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-500/10 text-green-600';
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-600';
      case 'advanced': return 'bg-red-500/10 text-red-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-fluid-4">
        <div>
          <p className="text-muted-foreground">{t('courses.allCourses')}</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-fluid-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <Skeleton className="h-48 w-full" />
                <CardHeader>
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full mt-2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-fluid-10">
              <GraduationCap className="h-12 w-12 text-muted-foreground mb-fluid-4" />
              <p className="text-lg font-medium">{t('courses.noCourses')}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-fluid-4">
            {courses.map(course => (
              <Card 
                key={course.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/dashboard/courses/${course.id}`)}
              >
                {course.thumbnail_url && !failedImages.has(course.id) ? (
                  <img 
                    src={course.thumbnail_url} 
                    alt={course.title}
                    className="w-full h-48 object-cover"
                    loading="lazy"
                    onError={() => {
                      setFailedImages(prev => new Set(prev).add(course.id));
                    }}
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <GraduationCap className="h-16 w-16 text-primary/30" />
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-2">{course.title}</CardTitle>
                    <Badge className={getDifficultyColor(course.difficulty_level)}>
                      {t(`courses.${course.difficulty_level}`)}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-3">
                    {course.description}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="flex items-center gap-fluid-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{course.estimated_hours} {t('courses.hours')}</span>
                    </div>
                    {course.category && (
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{course.category}</span>
                      </div>
                    )}
                  </div>

                  {course.is_enrolled && (
                    <div className="mt-fluid-3">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{t('courses.progress')}</span>
                        <span className="font-medium">{course.completion_percentage}%</span>
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${course.completion_percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter>
                  <Button 
                    className="w-full"
                    onClick={() => navigate(`/dashboard/courses/${course.id}`)}
                  >
                    {course.is_enrolled ? t('courses.continue') : t('courses.viewCourse')}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}