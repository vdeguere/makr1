import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { MetricCard } from '@/components/admin/insights/MetricCard';
import { DateRangePicker } from '@/components/admin/insights/DateRangePicker';
import { ExportButton } from '@/components/admin/insights/ExportButton';
import { ComparisonSelector } from '@/components/admin/insights/ComparisonSelector';
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
  GraduationCap, 
  Users, 
  Award,
  Clock,
  TrendingUp,
  BookOpen
} from 'lucide-react';
import { formatPercentageForExport } from '@/lib/exportCsv';
import { 
  ComparisonPeriod, 
  getPreviousPeriod, 
  calculateMetricComparison,
  formatComparisonText 
} from '@/lib/comparisonUtils';
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { subDays } from 'date-fns';
import { useTranslation } from 'react-i18next';

const AUDIENCE_COLORS = {
  practitioner: 'hsl(var(--primary))',
  patient: 'hsl(var(--secondary))',
  both: 'hsl(var(--accent))',
};

export default function Courses() {
  const { t } = useTranslation('common');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [comparisonPeriod, setComparisonPeriod] = useState<ComparisonPeriod>('none');

  const startDate = dateRange?.from || subDays(new Date(), 30);
  const endDate = dateRange?.to || new Date();

  const comparisonDates = comparisonPeriod !== 'none' 
    ? getPreviousPeriod(startDate, endDate, comparisonPeriod)
    : null;

  // Fetch course metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['admin-course-metrics', startDate, endDate],
    queryFn: async () => {
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('*, courses!inner(target_audience)')
        .gte('enrolled_at', startDate.toISOString())
        .lte('enrolled_at', endDate.toISOString());

      const { data: certificates } = await supabase
        .from('course_certificates')
        .select('issued_at')
        .gte('issued_at', startDate.toISOString())
        .lte('issued_at', endDate.toISOString());

      const totalEnrollments = enrollments?.length || 0;
      const activeEnrollments = enrollments?.filter(e => !e.completed_at).length || 0;
      const completedEnrollments = enrollments?.filter(e => e.completed_at).length || 0;
      const completionRate = totalEnrollments > 0 
        ? (completedEnrollments / totalEnrollments) * 100 
        : 0;

      // Calculate average completion time
      const completionTimes = enrollments
        ?.filter(e => e.completed_at)
        .map(e => {
          const start = new Date(e.enrolled_at).getTime();
          const end = new Date(e.completed_at).getTime();
          return (end - start) / (1000 * 60 * 60 * 24); // Convert to days
        }) || [];

      const avgCompletionTime = completionTimes.length > 0
        ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
        : 0;

      return {
        totalEnrollments,
        activeEnrollments,
        completedEnrollments,
        completionRate: completionRate.toFixed(1),
        avgCompletionTime: avgCompletionTime.toFixed(1),
        certificatesIssued: certificates?.length || 0,
      };
    },
  });

  // Fetch previous period metrics
  const { data: previousMetrics } = useQuery({
    queryKey: ['admin-course-previous-metrics', comparisonDates],
    queryFn: async () => {
      if (!comparisonDates) return null;

      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('*')
        .gte('enrolled_at', comparisonDates.previous.from.toISOString())
        .lte('enrolled_at', comparisonDates.previous.to.toISOString());

      const totalEnrollments = enrollments?.length || 0;
      const completedEnrollments = enrollments?.filter(e => e.completed_at).length || 0;
      const completionRate = totalEnrollments > 0 
        ? (completedEnrollments / totalEnrollments) * 100 
        : 0;

      return {
        totalEnrollments,
        completionRate,
      };
    },
    enabled: comparisonPeriod !== 'none' && !!comparisonDates,
  });

  const enrollmentComparison = comparisonPeriod !== 'none' && previousMetrics
    ? calculateMetricComparison(metrics?.totalEnrollments || 0, previousMetrics.totalEnrollments)
    : undefined;

  const completionComparison = comparisonPeriod !== 'none' && previousMetrics
    ? calculateMetricComparison(parseFloat(metrics?.completionRate || '0'), previousMetrics.completionRate)
    : undefined;

  // Fetch audience distribution
  const { data: audienceDistribution, isLoading: audienceLoading } = useQuery({
    queryKey: ['admin-course-audience-distribution'],
    queryFn: async () => {
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('*, courses!inner(target_audience)');

      const distribution = enrollments?.reduce((acc, e) => {
        const audience = (e.courses as any).target_audience;
        acc[audience] = (acc[audience] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(distribution || {}).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }));
    },
  });

  // Fetch popular courses
  const { data: popularCourses, isLoading: popularLoading } = useQuery({
    queryKey: ['admin-popular-courses'],
    queryFn: async () => {
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('course_id, completed_at, courses!inner(title, target_audience)');

      const courseStats = enrollments?.reduce((acc, e) => {
        const id = e.course_id;
        if (!acc[id]) {
          acc[id] = {
            title: (e.courses as any).title,
            audience: (e.courses as any).target_audience,
            enrollments: 0,
            completions: 0,
          };
        }
        acc[id].enrollments += 1;
        if (e.completed_at) acc[id].completions += 1;
        return acc;
      }, {} as Record<string, any>);

      return Object.values(courseStats || {})
        .map((course: any) => ({
          ...course,
          completionRate: course.enrollments > 0 
            ? ((course.completions / course.enrollments) * 100).toFixed(1)
            : '0',
        }))
        .sort((a: any, b: any) => b.enrollments - a.enrollments)
        .slice(0, 10);
    },
  });

  // Fetch course performance
  const { data: coursePerformance, isLoading: performanceLoading } = useQuery({
    queryKey: ['admin-course-performance'],
    queryFn: async () => {
      const { data: courses } = await supabase
        .from('courses')
        .select('id, title, target_audience, is_published');

      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('course_id, completed_at, enrolled_at');

      const { data: certificates } = await supabase
        .from('course_certificates')
        .select('course_id');

      const performance = courses?.map(course => {
        const courseEnrollments = enrollments?.filter(e => e.course_id === course.id) || [];
        const courseCertificates = certificates?.filter(c => c.course_id === course.id) || [];
        const completions = courseEnrollments.filter(e => e.completed_at).length;
        const completionRate = courseEnrollments.length > 0
          ? (completions / courseEnrollments.length) * 100
          : 0;

        // Calculate average time to complete
        const completionTimes = courseEnrollments
          .filter(e => e.completed_at)
          .map(e => {
            const start = new Date(e.enrolled_at).getTime();
            const end = new Date(e.completed_at).getTime();
            return (end - start) / (1000 * 60 * 60 * 24);
          });

        const avgTime = completionTimes.length > 0
          ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
          : 0;

        return {
          title: course.title,
          audience: course.target_audience,
          enrollments: courseEnrollments.length,
          completionRate: completionRate.toFixed(1),
          avgCompletionTime: avgTime.toFixed(1),
          certificates: courseCertificates.length,
        };
      });

      return performance?.sort((a, b) => b.enrollments - a.enrollments) || [];
    },
  });

  const presets = [
    { label: 'Last 7 days', value: { from: subDays(new Date(), 7), to: new Date() } },
    { label: 'Last 30 days', value: { from: subDays(new Date(), 30), to: new Date() } },
    { label: 'Last 90 days', value: { from: subDays(new Date(), 90), to: new Date() } },
  ];

  const exportOptions = [
    {
      label: 'Course Performance',
      data: coursePerformance || [],
      columns: [
        { key: 'title', header: 'Course Title' },
        { key: 'audience', header: 'Target Audience' },
        { key: 'enrollments', header: 'Total Enrollments' },
        { key: 'completionRate', header: 'Completion Rate (%)', formatter: (val: string) => `${val}%` },
        { key: 'avgCompletionTime', header: 'Avg Completion Time (days)' },
        { key: 'certificates', header: 'Certificates Issued' },
      ],
      filename: 'course_performance',
    },
    {
      label: 'Popular Courses',
      data: popularCourses || [],
      columns: [
        { key: 'title', header: 'Course Title' },
        { key: 'audience', header: 'Audience' },
        { key: 'enrollments', header: 'Enrollments' },
        { key: 'completionRate', header: 'Completion Rate (%)', formatter: (val: string) => `${val}%` },
      ],
      filename: 'popular_courses',
    },
  ];

  const comparisonLabel = formatComparisonText(comparisonPeriod);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">{t('analytics.courses.title')}</h1>
            <p className="text-muted-foreground">{t('analytics.courses.description')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ComparisonSelector
              value={comparisonPeriod}
              onChange={setComparisonPeriod}
              disabled={metricsLoading}
            />
            <ExportButton 
              options={exportOptions}
              disabled={metricsLoading || popularLoading || performanceLoading}
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
                title={t('analytics.courses.totalEnrollments')}
                value={metrics?.totalEnrollments || 0}
                icon={GraduationCap}
                comparison={enrollmentComparison ? {
                  previousValue: previousMetrics?.totalEnrollments || 0,
                  percentageChange: enrollmentComparison.percentageChange,
                  isPositive: enrollmentComparison.isPositive,
                  label: comparisonLabel,
                } : undefined}
              />
              <MetricCard
                title={t('analytics.courses.activeStudents')}
                value={metrics?.activeEnrollments || 0}
                icon={Users}
                description="Currently enrolled"
              />
              <MetricCard
                title={t('analytics.courses.completionRate')}
                value={`${metrics?.completionRate}%`}
                icon={Award}
                comparison={completionComparison ? {
                  previousValue: `${previousMetrics?.completionRate.toFixed(1)}%`,
                  percentageChange: completionComparison.percentageChange,
                  isPositive: completionComparison.isPositive,
                  label: comparisonLabel,
                } : undefined}
              />
              <MetricCard
                title={t('analytics.courses.avgCompletionTime')}
                value={`${metrics?.avgCompletionTime} ${t('analytics.courses.days')}`}
                icon={Clock}
              />
              <MetricCard
                title={t('analytics.courses.certificatesIssued')}
                value={metrics?.certificatesIssued || 0}
                icon={Award}
              />
              <MetricCard
                title={t('analytics.courses.enrollmentGrowth')}
                value="+24.5%"
                icon={TrendingUp}
                trend={{ value: 24.5, isPositive: true }}
              />
            </>
          )}
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Audience Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.courses.audienceDistribution')}</CardTitle>
            </CardHeader>
            <CardContent>
              {audienceLoading ? (
                <Skeleton className="h-[300px]" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={audienceDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.name}: ${entry.value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {audienceDistribution?.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={AUDIENCE_COLORS[entry.name.toLowerCase() as keyof typeof AUDIENCE_COLORS] || '#8884d8'} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Popular Courses */}
          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.courses.popularCourses')}</CardTitle>
            </CardHeader>
            <CardContent>
              {popularLoading ? (
                <Skeleton className="h-[300px]" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={popularCourses?.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="title" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="enrollments" fill="hsl(var(--primary))" name="Enrollments" />
                    <Bar dataKey="completions" fill="hsl(var(--secondary))" name="Completions" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Course Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.courses.coursePerformance')}</CardTitle>
          </CardHeader>
          <CardContent>
            {performanceLoading ? (
              <Skeleton className="h-[400px]" />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course Title</TableHead>
                      <TableHead>Audience</TableHead>
                      <TableHead className="text-right">Enrollments</TableHead>
                      <TableHead className="text-right">Completion Rate</TableHead>
                      <TableHead className="text-right">Avg Time (days)</TableHead>
                      <TableHead className="text-right">Certificates</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coursePerformance?.map((course: any, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{course.title}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={course.audience === 'practitioner' ? 'default' : 
                                    course.audience === 'patient' ? 'secondary' : 'outline'}
                          >
                            {t(`analytics.courses.${course.audience}Only`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{course.enrollments}</TableCell>
                        <TableCell className="text-right">{course.completionRate}%</TableCell>
                        <TableCell className="text-right">{course.avgCompletionTime}</TableCell>
                        <TableCell className="text-right">{course.certificates}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completion Rate by Course */}
        <Card>
          <CardHeader>
            <CardTitle>{t('analytics.courses.completionByCourse')}</CardTitle>
          </CardHeader>
          <CardContent>
            {popularLoading ? (
              <Skeleton className="h-[300px]" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={popularCourses} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="title" type="category" width={150} />
                  <Tooltip />
                  <Bar 
                    dataKey="completionRate" 
                    fill="hsl(var(--primary))" 
                    name="Completion Rate (%)"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
