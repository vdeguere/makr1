import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { MetricCard } from '@/components/admin/insights/MetricCard';
import { DateRangePicker } from '@/components/admin/insights/DateRangePicker';
import { ExportButton } from '@/components/admin/insights/ExportButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users as UsersIcon, 
  UserPlus, 
  Activity,
  TrendingUp,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { formatPercentageForExport } from '@/lib/exportCsv';
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { subDays, subMonths, format } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Users() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  // Fetch user metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['admin-user-metrics', dateRange],
    queryFn: async () => {
      // Get all profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, created_at, full_name');

      // Get user roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      // Get active users (users with orders in date range)
      const { data: orders } = await supabase
        .from('orders')
        .select('patient_id, created_at')
        .gte('created_at', dateRange?.from?.toISOString())
        .lte('created_at', dateRange?.to?.toISOString());

      // Get message activity
      const { data: messages } = await supabase
        .from('patient_messages')
        .select('sender_id, created_at')
        .gte('created_at', dateRange?.from?.toISOString())
        .lte('created_at', dateRange?.to?.toISOString());

      // Calculate role distribution
      const roleMap = roles?.reduce((acc, r) => {
        acc[r.user_id] = r.role;
        return acc;
      }, {} as Record<string, string>);

      const roleDistribution = roles?.reduce((acc, r) => {
        acc[r.role] = (acc[r.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate active users
      const activeUserIds = new Set([
        ...orders?.map(o => o.patient_id) || [],
        ...messages?.map(m => m.sender_id) || []
      ]);

      // New users in period
      const newUsers = profiles?.filter(p => {
        const createdAt = new Date(p.created_at);
        return createdAt >= (dateRange?.from || new Date()) && 
               createdAt <= (dateRange?.to || new Date());
      }).length || 0;

      // Calculate retention (users from previous period still active)
      const previousPeriodStart = subMonths(dateRange?.from || new Date(), 1);
      const previousPeriodEnd = dateRange?.from || new Date();
      
      const { data: previousOrders } = await supabase
        .from('orders')
        .select('patient_id')
        .gte('created_at', previousPeriodStart.toISOString())
        .lt('created_at', previousPeriodEnd.toISOString());

      const previousActiveUsers = new Set(previousOrders?.map(o => o.patient_id) || []);
      const retainedUsers = [...previousActiveUsers].filter(id => activeUserIds.has(id)).length;
      const retentionRate = previousActiveUsers.size > 0 
        ? (retainedUsers / previousActiveUsers.size) * 100 
        : 0;

      return {
        totalUsers: profiles?.length || 0,
        activeUsers: activeUserIds.size,
        newUsers,
        retentionRate: retentionRate.toFixed(1),
        roleDistribution,
        adminCount: roleDistribution?.admin || 0,
        practitionerCount: roleDistribution?.practitioner || 0,
        patientCount: roleDistribution?.patient || 0,
      };
    },
  });

  // Fetch registration trend
  const { data: registrationTrend, isLoading: trendLoading } = useQuery({
    queryKey: ['admin-registration-trend'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', subMonths(new Date(), 6).toISOString())
        .order('created_at', { ascending: true });

      const monthlyData = data?.reduce((acc, profile) => {
        const month = format(new Date(profile.created_at), 'MMM yyyy');
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(monthlyData || {}).map(([month, count]) => ({
        month,
        users: count,
      }));
    },
  });

  // Fetch most active practitioners
  const { data: activePractitioners, isLoading: practitionersLoading } = useQuery({
    queryKey: ['admin-active-practitioners'],
    queryFn: async () => {
      const { data: recommendations } = await supabase
        .from('recommendations')
        .select('practitioner_id, profiles!inner(full_name)');

      const { data: orders } = await supabase
        .from('orders')
        .select('recommendation_id, recommendations!inner(practitioner_id)');

      const practitionerStats = recommendations?.reduce((acc, rec) => {
        const id = rec.practitioner_id;
        if (!acc[id]) {
          acc[id] = {
            name: (rec.profiles as any).full_name,
            recommendations: 0,
            orders: 0,
          };
        }
        acc[id].recommendations += 1;
        return acc;
      }, {} as Record<string, any>);

      orders?.forEach((order) => {
        const practitionerId = (order.recommendations as any)?.practitioner_id;
        if (practitionerId && practitionerStats?.[practitionerId]) {
          practitionerStats[practitionerId].orders += 1;
        }
      });

      return Object.values(practitionerStats || {})
        .sort((a: any, b: any) => b.recommendations - a.recommendations)
        .slice(0, 10);
    },
  });

  // Fetch most active patients
  const { data: activePatients, isLoading: patientsLoading } = useQuery({
    queryKey: ['admin-active-patients'],
    queryFn: async () => {
      const { data: orders } = await supabase
        .from('orders')
        .select('patient_id, patients!inner(full_name, email)');

      const { data: messages } = await supabase
        .from('patient_messages')
        .select('patient_id, patients!inner(full_name)');

      const patientStats = orders?.reduce((acc, order) => {
        const id = order.patient_id;
        if (!acc[id]) {
          acc[id] = {
            name: (order.patients as any).full_name,
            email: (order.patients as any).email,
            orders: 0,
            messages: 0,
          };
        }
        acc[id].orders += 1;
        return acc;
      }, {} as Record<string, any>);

      messages?.forEach((msg) => {
        const patientId = msg.patient_id;
        if (patientId && patientStats?.[patientId]) {
          patientStats[patientId].messages += 1;
        }
      });

      return Object.values(patientStats || {})
        .sort((a: any, b: any) => b.orders - a.orders)
        .slice(0, 10);
    },
  });

  // Fetch user journey metrics
  const { data: journeyMetrics, isLoading: journeyLoading } = useQuery({
    queryKey: ['admin-user-journey'],
    queryFn: async () => {
      const { data: patients } = await supabase
        .from('patients')
        .select('id, user_id, created_at');

      const { data: recommendations } = await supabase
        .from('recommendations')
        .select('patient_id, created_at, status');

      const { data: orders } = await supabase
        .from('orders')
        .select('patient_id, created_at, recommendation_id');

      // Calculate average time from registration to first order
      let totalTimeToFirstOrder = 0;
      let patientsWithOrders = 0;

      patients?.forEach(patient => {
        const firstOrder = orders?.find(o => o.patient_id === patient.id);
        if (firstOrder && patient.created_at) {
          const timeDiff = new Date(firstOrder.created_at).getTime() - 
                          new Date(patient.created_at).getTime();
          totalTimeToFirstOrder += timeDiff;
          patientsWithOrders++;
        }
      });

      const avgTimeToFirstOrder = patientsWithOrders > 0 
        ? totalTimeToFirstOrder / patientsWithOrders / (1000 * 60 * 60 * 24) // Convert to days
        : 0;

      // Patient connection success rate
      const connectedPatients = patients?.filter(p => p.user_id !== null).length || 0;
      const connectionRate = patients?.length 
        ? (connectedPatients / patients.length) * 100 
        : 0;

      // Recommendation acceptance rate
      const sentRecommendations = recommendations?.filter(r => r.status !== 'draft').length || 0;
      const acceptedRecommendations = orders?.length || 0;
      const acceptanceRate = sentRecommendations > 0
        ? (acceptedRecommendations / sentRecommendations) * 100
        : 0;

      return {
        avgTimeToFirstOrder: avgTimeToFirstOrder.toFixed(1),
        connectionRate: connectionRate.toFixed(1),
        acceptanceRate: acceptanceRate.toFixed(1),
        connectedPatients,
        totalPatients: patients?.length || 0,
      };
    },
  });

  const roleData = metrics?.roleDistribution 
    ? Object.entries(metrics.roleDistribution).map(([name, value]) => ({ 
        name: name.charAt(0).toUpperCase() + name.slice(1), 
        value 
      }))
    : [];

  const presets = [
    { label: 'Last 7 days', value: { from: subDays(new Date(), 7), to: new Date() } },
    { label: 'Last 30 days', value: { from: subDays(new Date(), 30), to: new Date() } },
    { label: 'Last 90 days', value: { from: subDays(new Date(), 90), to: new Date() } },
  ];

  const exportOptions = [
    {
      label: 'Registration Trend',
      data: registrationTrend || [],
      columns: [
        { key: 'month', header: 'Month' },
        { key: 'users', header: 'New Users' },
      ],
      filename: 'users_registration_trend',
    },
    {
      label: 'Active Practitioners',
      data: activePractitioners || [],
      columns: [
        { key: 'name', header: 'Practitioner Name' },
        { key: 'recommendations', header: 'Total Recommendations' },
        { key: 'orders', header: 'Converted Orders' },
      ],
      filename: 'users_active_practitioners',
    },
    {
      label: 'Active Patients',
      data: activePatients || [],
      columns: [
        { key: 'name', header: 'Patient Name' },
        { key: 'email', header: 'Email' },
        { key: 'orders', header: 'Total Orders' },
        { key: 'messages', header: 'Messages Sent' },
      ],
      filename: 'users_active_patients',
    },
    {
      label: 'Role Distribution',
      data: roleData,
      columns: [
        { key: 'name', header: 'Role' },
        { key: 'value', header: 'Count' },
      ],
      filename: 'users_role_distribution',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">User Insights</h1>
            <p className="text-muted-foreground">User engagement and behavioral metrics</p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton 
              options={exportOptions}
              disabled={metricsLoading || trendLoading || practitionersLoading || patientsLoading}
            />
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              presets={presets}
            />
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {metricsLoading ? (
            <>
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </>
          ) : (
            <>
              <MetricCard
                title="Total Registered Users"
                value={metrics?.totalUsers || 0}
                icon={UsersIcon}
              />
              <MetricCard
                title="Active Users"
                value={metrics?.activeUsers || 0}
                icon={Activity}
                description="Last 30 days"
              />
              <MetricCard
                title="New Registrations"
                value={metrics?.newUsers || 0}
                icon={UserPlus}
                trend={{ value: 12.3, isPositive: true }}
              />
              <MetricCard
                title="User Retention Rate"
                value={`${metrics?.retentionRate}%`}
                icon={UserCheck}
              />
              <MetricCard
                title="Patient to Practitioner"
                value={`${Math.round((metrics?.patientCount || 0) / (metrics?.practitionerCount || 1))}:1`}
                icon={TrendingUp}
                description="Ratio"
              />
              <MetricCard
                title="Practitioners"
                value={metrics?.practitionerCount || 0}
                icon={UsersIcon}
                description={`${metrics?.adminCount || 0} admins`}
              />
            </>
          )}
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Registration Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Registration Trend (Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              {trendLoading ? (
                <Skeleton className="h-[300px]" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={registrationTrend}>
                    <defs>
                      <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="users" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1} 
                      fill="url(#colorUsers)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* User Distribution by Role */}
          <Card>
            <CardHeader>
              <CardTitle>User Distribution by Role</CardTitle>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-[300px]" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={roleData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {roleData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* User Journey Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>User Journey Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            {journeyLoading ? (
              <Skeleton className="h-32" />
            ) : (
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Avg Time to First Order</p>
                  <p className="text-2xl font-bold">{journeyMetrics?.avgTimeToFirstOrder} days</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Patient Connection Rate</p>
                  <p className="text-2xl font-bold">{journeyMetrics?.connectionRate}%</p>
                  <p className="text-xs text-muted-foreground">
                    {journeyMetrics?.connectedPatients} of {journeyMetrics?.totalPatients} connected
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Recommendation Acceptance</p>
                  <p className="text-2xl font-bold">{journeyMetrics?.acceptanceRate}%</p>
                  <p className="text-xs text-muted-foreground">Conversion rate</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Tables */}
        <Tabs defaultValue="practitioners" className="space-y-4">
          <TabsList>
            <TabsTrigger value="practitioners">Most Active Practitioners</TabsTrigger>
            <TabsTrigger value="patients">Most Engaged Patients</TabsTrigger>
          </TabsList>

          <TabsContent value="practitioners" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Practitioners by Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {practitionersLoading ? (
                  <Skeleton className="h-[400px]" />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rank</TableHead>
                          <TableHead>Practitioner</TableHead>
                          <TableHead className="text-right">Recommendations Sent</TableHead>
                          <TableHead className="text-right">Orders Completed</TableHead>
                          <TableHead className="text-right">Conversion Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activePractitioners?.map((practitioner: any, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-bold">#{index + 1}</TableCell>
                            <TableCell className="font-medium">{practitioner.name}</TableCell>
                            <TableCell className="text-right">{practitioner.recommendations}</TableCell>
                            <TableCell className="text-right">{practitioner.orders}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant={
                                (practitioner.orders / practitioner.recommendations * 100) > 70 
                                  ? "default" 
                                  : "secondary"
                              }>
                                {((practitioner.orders / practitioner.recommendations) * 100).toFixed(1)}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="patients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Most Engaged Patients</CardTitle>
              </CardHeader>
              <CardContent>
                {patientsLoading ? (
                  <Skeleton className="h-[400px]" />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Rank</TableHead>
                          <TableHead>Patient Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead className="text-right">Orders</TableHead>
                          <TableHead className="text-right">Messages</TableHead>
                          <TableHead className="text-right">Engagement</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activePatients?.map((patient: any, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-bold">#{index + 1}</TableCell>
                            <TableCell className="font-medium">{patient.name}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {patient.email || 'N/A'}
                            </TableCell>
                            <TableCell className="text-right">{patient.orders}</TableCell>
                            <TableCell className="text-right">{patient.messages || 0}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant={
                                (patient.orders + (patient.messages || 0)) > 10 
                                  ? "default" 
                                  : "secondary"
                              }>
                                {patient.orders + (patient.messages || 0)} actions
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Inactive Users Alert */}
        <Card className="border-amber-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Inactive Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Users with no activity in the last 60 days should be identified and re-engaged. 
              Consider implementing automated email campaigns or surveys to understand their needs.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
