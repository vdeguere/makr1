import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/contexts/RoleContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, FileText, Calendar, Activity, Package, Heart, Flame } from 'lucide-react';
import { logger } from '@/lib/logger';
import { Badge } from '@/components/ui/badge';
import { useAnalytics } from '@/hooks/useAnalytics';
import { HealthOverview } from '@/components/patients/health/HealthOverview';
import { WellnessTrackerTab } from '@/components/patients/wellness/WellnessTrackerTab';
import { SkinProgressGallery } from '@/components/patients/skincare/SkinProgressGallery';
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

interface HealthRecord {
  id: string;
  title: string;
  diagnosis: string;
  instructions: string;
  status: string;
  created_at: string;
  practitioner_id: string;
}

interface HealthStats {
  totalAssignments: number;
  activeAssignments: number;
  completedOrders: number;
  upcomingVisits: number;
}

export default function HealthRecords() {
  const { user } = useAuth();
  const { activeRole } = useRole();
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();
  const [loading, setLoading] = useState(true);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [stats, setStats] = useState<HealthStats>({
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
    fetchPatientData();
  }, [activeRole, navigate, user?.id]);

  const fetchPatientData = async () => {
    if (!user?.id) return;

    try {
      // First, get the patient record ID
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (patientError) throw patientError;
      if (!patientData) {
        logger.error('No patient record found');
        setLoading(false);
        return;
      }

      setPatientId(patientData.id);

      // Fetch recommendations using the correct patient_id
      const { data: recommendationsData, error: recsError } = await supabase
        .from('recommendations')
        .select('id, title, diagnosis, instructions, status, created_at, practitioner_id')
        .eq('patient_id', patientData.id)
        .order('created_at', { ascending: false });

      if (recsError) throw recsError;
      setRecords(recommendationsData || []);

      // Fetch orders for stats
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('status')
        .eq('patient_id', patientData.id);

      if (ordersError) throw ordersError;

      // Fetch visits for stats
      const { data: visitsData, error: visitsError } = await supabase
        .from('patient_visits')
        .select('status, visit_date')
        .eq('patient_id', patientData.id)
        .gte('visit_date', new Date().toISOString());

      if (visitsError) throw visitsError;

      // Calculate stats
      const activeStatuses = ['sent', 'payment_pending', 'paid', 'shipped'];
      setStats({
        totalAssignments: recommendationsData?.length || 0,
        activeAssignments: recommendationsData?.filter(r => activeStatuses.includes(r.status)).length || 0,
        completedOrders: ordersData?.filter(o => o.status === 'delivered').length || 0,
        upcomingVisits: visitsData?.length || 0,
      });

      // Track analytics
      trackEvent('view_health_records', {
        recommendation_count: recommendationsData?.length || 0,
        has_active_treatments: (recommendationsData?.filter(r => activeStatuses.includes(r.status)).length || 0) > 0,
      });
    } catch (error) {
      logger.error('Error fetching patient data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendationClick = (recommendationId: string) => {
    setSelectedRecommendationId(recommendationId);
    setIsDetailDialogOpen(true);
    trackEvent('view_recommendation_details', { recommendation_id: recommendationId });
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

  if (!patientId) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="py-10 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No patient record found. Please contact your practitioner.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Heart className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">My Health Portal</h1>
            <p className="text-muted-foreground">Track your health journey and wellness progress</p>
          </div>
        </div>

        <HealthOverview stats={stats} />

        <Tabs defaultValue="recommendations" className="space-y-4">
          <TabsList className="w-full inline-flex h-auto flex-wrap justify-start gap-1">
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Recommendations</span>
            </TabsTrigger>
            <TabsTrigger value="adherence" className="flex items-center gap-2">
              <Flame className="h-4 w-4" />
              <span>Adherence</span>
            </TabsTrigger>
            <TabsTrigger value="wellness" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span>My Work</span>
            </TabsTrigger>
            <TabsTrigger value="visits" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Visits</span>
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

          <TabsContent value="recommendations" className="space-y-4">
            {records.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No recommendations yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {records.map((record) => (
                  <Card 
                    key={record.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleRecommendationClick(record.id)}
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
                          <h4 className="font-semibold mb-1">Diagnosis</h4>
                          <p className="text-sm text-muted-foreground">{record.diagnosis}</p>
                        </div>
                      )}
                      {record.instructions && (
                        <div>
                          <h4 className="font-semibold mb-1">Treatment Instructions</h4>
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
            <DailyCheckInCard patientId={patientId} />
            <AdherenceDashboard patientId={patientId} />
            <AchievementBadges patientId={patientId} />
            <TreatmentScheduleList patientId={patientId} />
          </TabsContent>

          <TabsContent value="wellness" className="space-y-6">
            <StudentWorkGallery studentId={patientId} />
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
            <VisitNotesTab patientId={patientId} />
          </TabsContent>

          <TabsContent value="vitals">
            <VitalSignsTab patientId={patientId} />
          </TabsContent>

          <TabsContent value="orders">
            <OrdersTab patientId={patientId} />
          </TabsContent>

          <TabsContent value="documents">
            <DocumentsTab patientId={patientId} />
          </TabsContent>
        </Tabs>
      </div>

      {selectedRecommendationId && (
        <RecommendationDetailDialog
          recommendationId={selectedRecommendationId}
          open={isDetailDialogOpen}
          onOpenChange={setIsDetailDialogOpen}
          onUpdate={fetchPatientData}
        />
      )}
    </DashboardLayout>
  );
}
