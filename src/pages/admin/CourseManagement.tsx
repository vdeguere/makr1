import { useEffect, useState } from 'react';
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
  GraduationCap, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Users,
  Clock,
  BookOpen,
  List
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CourseFormDialog } from '@/components/admin/CourseFormDialog';
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
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  difficulty_level: string | null;
  estimated_hours: number | null;
  is_published: boolean;
  display_order: number;
  thumbnail_url: string | null;
  target_audience: string | null;
  created_at: string;
  enrollment_count?: number;
}

export default function CourseManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { activeRole, loading: roleLoading } = useRole();

  useEffect(() => {
    if (roleLoading) return;
    
    if (activeRole !== 'admin' && activeRole !== 'dev') {
      navigate('/dashboard');
      return;
    }
    
    fetchCourses();
  }, [activeRole, roleLoading, navigate]);

  const fetchCourses = async () => {
    try {
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('display_order', { ascending: true });

      if (coursesError) throw coursesError;

      // Get enrollment counts
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select('course_id');

      if (enrollmentsError) throw enrollmentsError;

      const enrollmentCounts = enrollments?.reduce((acc, enrollment) => {
        acc[enrollment.course_id] = (acc[enrollment.course_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const coursesWithCounts = coursesData?.map(course => ({
        ...course,
        enrollment_count: enrollmentCounts?.[course.id] || 0,
      })) || [];

      setCourses(coursesWithCounts);
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

  const handleCreateCourse = () => {
    setSelectedCourse(undefined);
    setDialogOpen(true);
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setDialogOpen(true);
  };

  const handleDeleteClick = (course: Course) => {
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseToDelete.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Course deleted successfully',
      });

      fetchCourses();
      setDeleteDialogOpen(false);
      setCourseToDelete(null);
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

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'published' && course.is_published) ||
      (statusFilter === 'draft' && !course.is_published);

    return matchesSearch && matchesStatus;
  });

  if (loading || roleLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Course Management</h1>
              <p className="text-muted-foreground">Manage training courses and content</p>
            </div>
          </div>
          
          <Button onClick={handleCreateCourse}>
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Courses</CardTitle>
            <CardDescription>View and manage all training courses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-6">
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              {filteredCourses.length > 0 ? (
                filteredCourses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{course.title}</h3>
                        <Badge variant={course.is_published ? 'default' : 'secondary'}>
                          {course.is_published ? 'Published' : 'Draft'}
                        </Badge>
                        {course.target_audience && (
                          <Badge variant="outline">
                            {course.target_audience === 'both' ? 'All Users' : 
                             course.target_audience === 'practitioner' ? 'Practitioners' : 'Patients'}
                          </Badge>
                        )}
                        {course.difficulty_level && (
                          <Badge variant="outline">
                            {course.difficulty_level}
                          </Badge>
                        )}
                      </div>
                      {course.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {course.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {course.category && (
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            {course.category}
                          </div>
                        )}
                        {course.estimated_hours && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {course.estimated_hours}h
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {course.enrollment_count || 0} enrolled
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/dashboard/admin/courses/${course.id}/builder`)}
                        title="Visual Builder"
                        className="gap-2"
                      >
                        <List className="h-4 w-4" />
                        Edit Structure
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/dashboard/courses/${course.id}`)}
                        title="View Course"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditCourse(course)}
                        title="Edit Course"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(course)}
                        title="Delete Course"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  {searchTerm || statusFilter !== 'all'
                    ? 'No courses match your filters'
                    : 'No courses available. Create your first course to get started.'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <CourseFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        course={selectedCourse}
        onSuccess={fetchCourses}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{courseToDelete?.title}"? This action cannot be undone
              and will remove all associated lessons, resources, and student progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCourse}
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
