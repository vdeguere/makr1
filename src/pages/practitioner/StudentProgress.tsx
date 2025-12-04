import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { StudentProgressScorer } from '@/components/instructors/StudentProgressScorer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { logger } from '@/lib/logger';

export default function StudentProgress() {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [studentName, setStudentName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (studentId) {
      fetchStudentName();
    }
  }, [studentId]);

  const fetchStudentName = async () => {
    if (!studentId) return;

    try {
      const { data, error } = await supabase
        .from('patients')
        .select('full_name')
        .eq('id', studentId)
        .single();

      if (error) throw error;
      setStudentName(data?.full_name || 'Student');
    } catch (error) {
      logger.error('Error fetching student name:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  if (!studentId) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Student ID not provided</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Score Student Progress</h1>
            <p className="text-muted-foreground">
              Evaluate and score student performance across different skill metrics
            </p>
          </div>
        </div>
        <StudentProgressScorer studentId={studentId} studentName={studentName} />
      </div>
    </DashboardLayout>
  );
}

