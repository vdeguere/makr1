import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/contexts/RoleContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Package, Award, GraduationCap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { logger } from '@/lib/logger';

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('dashboard');
  const { user, loading: authLoading } = useAuth();
  const { role, activeRole, loading: roleLoading } = useRole();
  const [stats, setStats] = useState({
    activeStudents: 0,
    kitsToShip: 0,
    pendingCertifications: 0,
    pendingGradings: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // ProtectedRoute handles auth redirect - no need for page-level check

  useEffect(() => {
    if (!authLoading && !roleLoading && user && activeRole === 'patient' && location.pathname === '/dashboard') {
      navigate('/dashboard/student/records', { replace: true });
    }
  }, [authLoading, roleLoading, user, activeRole, navigate, location.pathname]);

  useEffect(() => {
    if (user && (activeRole === 'admin' || activeRole === 'practitioner')) {
      fetchStats();
    }
  }, [user, activeRole]);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);

      // Active Students (patients with user_id linked)
      const { count: studentsCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .not('user_id', 'is', null);

      // Kits To Ship (orders with enrollment_id and status='pending')
      const { count: kitsCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .not('enrollment_id', 'is', null)
        .eq('status', 'pending');

      // Pending Certifications (enrollments with completion_percentage=100 but no certificate)
      const { data: completedEnrollments } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('completion_percentage', 100);

      const enrollmentIds = completedEnrollments?.map(e => e.id) || [];
      let pendingCertCount = 0;

      if (enrollmentIds.length > 0) {
        const { data: certificates } = await supabase
          .from('course_certificates')
          .select('enrollment_id')
          .in('enrollment_id', enrollmentIds);

        const certifiedEnrollmentIds = new Set(certificates?.map(c => c.enrollment_id) || []);
        pendingCertCount = enrollmentIds.filter(id => !certifiedEnrollmentIds.has(id)).length;
      }

      // Pending Gradings (skill_submissions with status='submitted' or 'reviewing')
      const { count: gradingsCount } = await supabase
        .from('skill_submissions')
        .select('*', { count: 'exact', head: true })
        .in('status', ['submitted', 'reviewing']);

      setStats({
        activeStudents: studentsCount || 0,
        kitsToShip: kitsCount || 0,
        pendingCertifications: pendingCertCount,
        pendingGradings: gradingsCount || 0,
      });
    } catch (error) {
      logger.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  if (authLoading || roleLoading || statsLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) return null;

  const statsCards = [
    {
      title: t('stats.totalStudents.title'),
      value: stats.activeStudents.toString(),
      description: t('stats.totalStudents.description'),
      icon: Users,
    },
    {
      title: t('stats.kitsToShip.title'),
      value: stats.kitsToShip.toString(),
      description: t('stats.kitsToShip.description'),
      icon: Package,
    },
    {
      title: t('stats.pendingCertifications.title'),
      value: stats.pendingCertifications.toString(),
      description: t('stats.pendingCertifications.description'),
      icon: Award,
    },
    {
      title: t('stats.pendingGradings.title'),
      value: stats.pendingGradings.toString(),
      description: t('stats.pendingGradings.description'),
      icon: GraduationCap,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">{t('overview')}</h2>
          <p className="text-sm text-muted-foreground">
            {t('welcome')}! {t('welcomeMessage')}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {activeRole === 'patient' && role === 'patient' && (
          <Card className="border-warning">
            <CardHeader>
              <CardTitle>{t('warning.actionRequired')}</CardTitle>
              <CardDescription>
                {t('warning.roleAssignment')}
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
