import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/contexts/RoleContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Leaf, ShoppingCart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('dashboard');
  const { user, loading: authLoading } = useAuth();
  const { role, activeRole, loading: roleLoading } = useRole();

  // ProtectedRoute handles auth redirect - no need for page-level check

  useEffect(() => {
    if (!authLoading && !roleLoading && user && activeRole === 'patient' && location.pathname === '/dashboard') {
      navigate('/dashboard/patient/records', { replace: true });
    }
  }, [authLoading, roleLoading, user, activeRole, navigate, location.pathname]);

  if (authLoading || roleLoading) {
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

  const stats = [
    {
      title: t('stats.totalPatients.title'),
      value: '0',
      description: t('stats.totalPatients.description'),
      icon: Users,
    },
    {
      title: t('stats.recommendations.title'),
      value: '0',
      description: t('stats.recommendations.description'),
      icon: FileText,
    },
    {
      title: t('stats.herbsInStock.title'),
      value: '0',
      description: t('stats.herbsInStock.description'),
      icon: Leaf,
    },
    {
      title: t('stats.pendingOrders.title'),
      value: '0',
      description: t('stats.pendingOrders.description'),
      icon: ShoppingCart,
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
          {stats.map((stat) => (
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
