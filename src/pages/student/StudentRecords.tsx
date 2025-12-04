import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/contexts/RoleContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, FileText, Calendar, Activity, Package, GraduationCap, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAnalytics } from '@/hooks/useAnalytics';
import { HealthOverview } from '@/components/patients/health/HealthOverview';
import { StudentWorkGallery } from '@/components/students/skills/StudentWorkGallery';
import { ProgressSpiderChart } from '@/components/students/ProgressSpiderChart';
import { VisitNotesTab } from '@/components/patients/medical/VisitNotesTab';
import { VitalSignsTab } from '@/components/patients/medical/VitalSignsTab';
import { OrdersTab } from '@/components/patients/medical/OrdersTab';
import { DocumentsTab } from '@/components/patients/medical/DocumentsTab';
import { RecommendationDetailDialog } from '@/components/recommendations/RecommendationDetailDialog';
import { DailyCheckInCard } from '@/components/adherence/DailyCheckInCard';
import { AdherenceDashboard } from '@/components/adherence/AdherenceDashboard';
import { AchievementBadges } from '@/components/adherence/AchievementBadges';
import { TreatmentScheduleList } from '@/components/adherence/TreatmentScheduleList';
import { logger } from '@/lib/logger';

interface AssignmentRecord {
  id: string;
  title: string;
  diagnosis: string;
  instructions: string;
  status: string;
  created_at: string;
  practitioner_id: string;
}

interface StudentStats {
  totalAssignments: number;
  activeAssignments: number;
  completedOrders: number;
  upcomingVisits: number;
}

export default function StudentRecords() {
  const { user } = useAuth();
  const { activeRole } = useRole();
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [records, setRecords] = useState<AssignmentRecord[]>([]);
  const [stats, setStats] = useState<StudentStats>({
    totalAssignments: 0,
    activeAssignments: 0,
    completedOrders: 0,
    upcomingVisits: 0,
  });
  const [selectedRecommendationId, setSelectedRecommendationId] = useState<string | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [progressData, setProgressData] = useState<Array<{ name: string; value: number }>>([]);

  useEffect(() => {
    if (activeRole && activeRole !== 'patient') {
      navigate('/dashboard');
      return;
    }
    fetchStudentData();
  }, [activeRole, navigate, user?.id]);

  const fetchStudentData = async () => {
    if (!user?.id) return;

    try {
      // First, get the student (patient) record ID
      const { data: studentData, error: studentError } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (studentError) throw studentError;
      if (!studentData) {
        logger.error('No student record found');
        setLoading(false);
        return;
      }

      setStudentId(studentData.id);

      // Fetch assignments (recommendations) using the correct student_id
      const { data: assignmentsData, error: recsError } = await supabase
        .from('recommendations')
        .select('id, title, diagnosis, instructions, status, created_at, practitioner_id')
        .eq('patient_id', studentData.id)
        .order('created_at', { ascending: false });

      if (recsError) throw recsError;
      setRecords(assignmentsData || []);

      // Fetch orders for stats
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('status')
        .eq('patient_id', studentData.id);

      if (ordersError) throw ordersError;

      // Fetch visits for stats
      const { data: visitsData, error: visitsError } = await supabase
        .from('patient_visits')
        .select('status, visit_date')
        .eq('patient_id', studentData.id)
        .gte('visit_date', new Date().toISOString());

      if (visitsError) throw visitsError;

      // Fetch progress scores
      const { data: progressScores, error: progressError } = await supabase
        .from('student_progress_scores')
        .select(`
          score,
          progress_metrics!inner(name, is_active)
        `)
        .eq('student_id', studentData.id)
        .eq('progress_metrics.is_active', true);

      if (progressError) {
        logger.error('Error fetching progress:', progressError);
      } else if (progressScores && progressScores.length > 0) {
        const progressMap = progressScores.map((ps: any) => ({
          name: ps.progress_metrics?.name || 'Unknown',
          value: ps.score || 0,
        }));
        setProgressData(progressMap);
      } else {
        // Fetch active metrics to show empty state with all metrics at 0
        const { data: activeMetrics } = await supabase
          .from('progress_metrics')
          .select('name')
          .eq('is_active', true)
          .order('display_order');

        if (activeMetrics && activeMetrics.length > 0) {
          setProgressData(activeMetrics.map(m => ({ name: m.name, value: 0 })));
        }
      }

      // Calculate stats
      const activeStatuses = ['sent', 'payment_pending', 'paid', 'shipped'];
      setStats({
        totalAssignments: assignmentsData?.length || 0,
        activeAssignments: assignmentsData?.filter(r => activeStatuses.includes(r.status)).length || 0,
        completedOrders: ordersData?.filter(o => o.status === 'delivered').length || 0,
        upcomingVisits: visitsData?.length || 0,
      });

      // Track analytics
      trackEvent('view_student_records', {
        assignment_count: assignmentsData?.length || 0,
        has_active_assignments: (assignmentsData?.filter(r => activeStatuses.includes(r.status)).length || 0) > 0,
      });
    } catch (error) {
      logger.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentClick = (assignmentId: string) => {
    setSelectedRecommendationId(assignmentId);
    setIsDetailDialogOpen(true);
    trackEvent('view_assignment_details', { assignment_id: assignmentId });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (!studentId) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="py-10 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No student record found. Please contact support.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">My Student Portal</h1>
            <p className="text-muted-foreground">Track your learning journey and skill progress</p>
          </div>
        </div>

        <HealthOverview stats={{
          totalAssignments: stats.totalAssignments,
          activeAssignments: stats.activeAssignments,
          completedOrders: stats.completedOrders,
          upcomingVisits: stats.upcomingVisits,
        }} />

        <Tabs defaultValue="assignments" className="space-y-4">
          <TabsList className="w-full inline-flex h-auto flex-wrap justify-start gap-1">
            <TabsTrigger value="assignments" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Assignments</span>
            </TabsTrigger>
            <TabsTrigger value="adherence" className="flex items-center gap-2">
              <Flame className="h-4 w-4" />
              <span>Adherence</span>
            </TabsTrigger>
            <TabsTrigger value="work" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span>My Work</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              <span>Progress</span>
            </TabsTrigger>
            <TabsTrigger value="visits" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Live Sessions</span>
            </TabsTrigger>
            <TabsTrigger value="vitals" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span>Vitals</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span>Orders</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Documents</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="space-y-4">
            {records.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No assignments yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {records.map((record) => (
                  <Card 
                    key={record.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleAssignmentClick(record.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{record.title}</CardTitle>
                          <CardDescription className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(record.created_at).toLocaleDateString()}
                            </span>
                          </CardDescription>
                        </div>
                        <Badge variant={record.status === 'delivered' ? 'default' : 'secondary'}>
                          {record.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {record.diagnosis && (
                        <div>
                          <h4 className="font-semibold mb-1">Assignment Description</h4>
                          <p className="text-sm text-muted-foreground">{record.diagnosis}</p>
                        </div>
                      )}
                      {record.instructions && (
                        <div>
                          <h4 className="font-semibold mb-1">Instructions</h4>
                          <p className="text-sm text-muted-foreground">{record.instructions}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="adherence" className="space-y-6">
            <DailyCheckInCard patientId={studentId} />
            <AdherenceDashboard patientId={studentId} />
            <AchievementBadges patientId={studentId} />
            <TreatmentScheduleList patientId={studentId} />
          </TabsContent>

          <TabsContent value="work" className="space-y-6">
            <StudentWorkGallery studentId={studentId} />
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Progress</CardTitle>
                <CardDescription>Track your skills across different metrics</CardDescription>
              </CardHeader>
              <CardContent>
                {progressData.length > 0 ? (
                  <ProgressSpiderChart data={progressData} />
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No progress metrics configured yet.</p>
                    <p className="text-sm mt-2">Your instructor will score you on various skills.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="visits">
            <VisitNotesTab patientId={studentId} />
          </TabsContent>

          <TabsContent value="vitals">
            <VitalSignsTab patientId={studentId} />
          </TabsContent>

          <TabsContent value="orders">
            <OrdersTab patientId={studentId} />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentsTab patientId={studentId} />
          </TabsContent>
        </Tabs>
      </div>

      {selectedRecommendationId && (
        <RecommendationDetailDialog
          recommendationId={selectedRecommendationId}
          open={isDetailDialogOpen}
          onOpenChange={setIsDetailDialogOpen}
          onUpdate={fetchStudentData}
        />
      )}
    </DashboardLayout>
  );
}

