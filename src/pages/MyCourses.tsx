import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, BookOpen, GraduationCap, Award, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface EnrolledCourse {
  id: string;
  course_id: string;
  completion_percentage: number;
  completed_at: string | null;
  last_accessed_at: string | null;
  courses: {
    title: string;
    description: string;
    thumbnail_url: string | null;
    difficulty_level: string;
    estimated_hours: number;
    category: string;
  };
}

export default function MyCourses() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingCertificate, setDownloadingCertificate] = useState<string | null>(null);

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  const fetchEnrolledCourses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          course_id,
          completion_percentage,
          completed_at,
          last_accessed_at,
          courses (
            title,
            description,
            thumbnail_url,
            difficulty_level,
            estimated_hours,
            category
          )
        `)
        .eq('user_id', user.id)
        .order('last_accessed_at', { ascending: false, nullsFirst: false })
        .order('enrolled_at', { ascending: false });

      if (error) throw error;

      setEnrolledCourses(data || []);
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load enrolled courses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = async (enrollmentId: string) => {
    setDownloadingCertificate(enrollmentId);
    try {
      const { data, error } = await supabase.functions.invoke('generate-certificate', {
        body: { enrollmentId }
      });

      if (error) throw error;

      if (data?.certificateUrl) {
        // Open certificate in new tab
        window.open(data.certificateUrl, '_blank');
        
        toast({
          title: 'Certificate Generated',
          description: 'Your certificate is ready to download',
        });
      }
    } catch (error) {
      console.error('Error generating certificate:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate certificate. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingCertificate(null);
    }
  };

  const inProgressCourses = enrolledCourses.filter(
    e => e.completion_percentage > 0 && e.completion_percentage < 100
  );
  const completedCourses = enrolledCourses.filter(e => e.completion_percentage === 100);
  const notStartedCourses = enrolledCourses.filter(e => e.completion_percentage === 0);

  const renderCourseCard = (enrollment: EnrolledCourse) => (
    <Card key={enrollment.id} className="overflow-hidden hover:shadow-lg transition-shadow">
      {enrollment.courses.thumbnail_url ? (
        <img 
          src={enrollment.courses.thumbnail_url} 
          alt={enrollment.courses.title}
          className="w-full h-48 object-cover"
        />
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
          <GraduationCap className="h-16 w-16 text-primary/30" />
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2">{enrollment.courses.title}</CardTitle>
          {enrollment.completion_percentage === 100 && (
            <Award className="h-5 w-5 text-yellow-500 flex-shrink-0" />
          )}
        </div>
        <CardDescription className="line-clamp-2">
          {enrollment.courses.description}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="space-y-fluid-3">
          <div className="flex items-center gap-fluid-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{enrollment.courses.estimated_hours} {t('courses.hours')}</span>
            </div>
            {enrollment.courses.category && (
              <div className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span>{enrollment.courses.category}</span>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">{t('courses.progress')}</span>
              <span className="font-medium">{enrollment.completion_percentage}%</span>
            </div>
            <Progress value={enrollment.completion_percentage} className="h-2" />
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button 
          className="flex-1"
          onClick={() => navigate(`/dashboard/courses/${enrollment.course_id}`)}
        >
          {enrollment.completion_percentage === 100 
            ? t('courses.viewCourse') 
            : t('courses.continue')}
        </Button>
        
        {enrollment.completion_percentage === 100 && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleDownloadCertificate(enrollment.id)}
            disabled={downloadingCertificate === enrollment.id}
            title="Download Certificate"
          >
            {downloadingCertificate === enrollment.id ? (
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );

  return (
    <DashboardLayout>
      <div className="space-y-fluid-6">
        <div>
          <h1 className="text-fluid-2xl font-bold">{t('courses.enrolledCourses')}</h1>
          <p className="text-muted-foreground mt-fluid-1">
            Track your learning progress and continue where you left off
          </p>
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
        ) : enrolledCourses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-fluid-10">
              <GraduationCap className="h-12 w-12 text-muted-foreground mb-fluid-4" />
              <p className="text-lg font-medium mb-fluid-2">No enrolled courses yet</p>
              <p className="text-muted-foreground mb-fluid-4">Start learning by browsing available courses</p>
              <Button onClick={() => navigate('/dashboard/courses')}>
                <BookOpen className="mr-2 h-4 w-4" />
                Browse Courses
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* In Progress Courses */}
            {inProgressCourses.length > 0 && (
              <div className="space-y-fluid-4">
                <h2 className="text-fluid-xl font-semibold">In Progress</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-fluid-4">
                  {inProgressCourses.map(renderCourseCard)}
                </div>
              </div>
            )}

            {/* Not Started Courses */}
            {notStartedCourses.length > 0 && (
              <div className="space-y-fluid-4">
                <h2 className="text-fluid-xl font-semibold">Not Started</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-fluid-4">
                  {notStartedCourses.map(renderCourseCard)}
                </div>
              </div>
            )}

            {/* Completed Courses */}
            {completedCourses.length > 0 && (
              <div className="space-y-fluid-4">
                <h2 className="text-fluid-xl font-semibold">Completed</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-fluid-4">
                  {completedCourses.map(renderCourseCard)}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}