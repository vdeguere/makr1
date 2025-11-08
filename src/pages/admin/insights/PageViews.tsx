import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricCard } from '@/components/admin/insights/MetricCard';
import { DateRangePicker } from '@/components/admin/insights/DateRangePicker';
import { ExportButton } from '@/components/admin/insights/ExportButton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Eye, 
  Users, 
  Clock, 
  TrendingUp,
  Smartphone,
} from 'lucide-react';
import { formatPercentageForExport } from '@/lib/exportCsv';
import { 
  PieChart, 
  Pie, 
  Cell,
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { subDays } from 'date-fns';
import { DateRange } from 'react-day-picker';

export default function PageViews() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const startDate = dateRange?.from || subDays(new Date(), 30);
  const endDate = dateRange?.to || new Date();

  // Fetch top pages data
  const { data: topPages, isLoading: topPagesLoading } = useQuery({
    queryKey: ['top-pages', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_top_pages_by_views', {
          _limit: 20,
          _start_date: startDate.toISOString(),
          _end_date: endDate.toISOString(),
        });

      if (error) throw error;
      return data || [];
    },
  });

  // Fetch page view metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['page-metrics', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_analytics')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      const totalViews = data.length;
      const uniqueVisitors = new Set(data.map(d => d.session_id)).size;
      const avgDuration = data
        .filter(d => d.duration_seconds !== null)
        .reduce((sum, d) => sum + (d.duration_seconds || 0), 0) / 
        (data.filter(d => d.duration_seconds !== null).length || 1);
      const bounceRate = totalViews > 0 ? (data.filter(d => d.is_bounce).length / totalViews) * 100 : 0;

      return {
        totalViews,
        uniqueVisitors,
        avgDuration: Math.round(avgDuration),
        bounceRate: bounceRate.toFixed(1),
      };
    },
  });

  // Fetch device breakdown
  const { data: deviceData, isLoading: deviceLoading } = useQuery({
    queryKey: ['device-breakdown', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_analytics')
        .select('device_type')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (error) throw error;

      const counts = data.reduce((acc, item) => {
        acc[item.device_type] = (acc[item.device_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(counts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }));
    },
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  const exportOptions = [
    {
      label: 'Top Pages Performance',
      data: topPages || [],
      columns: [
        { key: 'page_path', header: 'Page Path' },
        { key: 'page_title', header: 'Page Title' },
        { key: 'view_count', header: 'Total Views' },
        { key: 'unique_visitors', header: 'Unique Visitors' },
        { key: 'avg_duration', header: 'Avg Duration (seconds)' },
        { key: 'bounce_rate', header: 'Bounce Rate (%)', formatter: (val: number) => formatPercentageForExport(val) },
      ],
      filename: 'page_views_top_pages',
    },
    {
      label: 'Device Breakdown',
      data: deviceData || [],
      columns: [
        { key: 'name', header: 'Device Type' },
        { key: 'value', header: 'Number of Views' },
      ],
      filename: 'page_views_device_breakdown',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Page Analytics</h1>
            <p className="text-muted-foreground">
              Track page views, engagement duration, and navigation patterns
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton 
              options={exportOptions}
              disabled={metricsLoading || topPagesLoading || deviceLoading}
            />
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metricsLoading ? (
            <>
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </>
          ) : (
            <>
              <MetricCard
                title="Total Page Views"
                value={metrics?.totalViews.toLocaleString() || '0'}
                icon={Eye}
                description="All page views"
              />
              <MetricCard
                title="Unique Visitors"
                value={metrics?.uniqueVisitors.toLocaleString() || '0'}
                icon={Users}
                description="Distinct sessions"
              />
              <MetricCard
                title="Avg Time on Page"
                value={`${Math.floor((metrics?.avgDuration || 0) / 60)}m ${(metrics?.avgDuration || 0) % 60}s`}
                icon={Clock}
                description="Average duration"
              />
              <MetricCard
                title="Bounce Rate"
                value={`${metrics?.bounceRate || '0'}%`}
                icon={TrendingUp}
                description="Single-page sessions"
              />
            </>
          )}
        </div>

        {/* Charts and Tables */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Device Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Device Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              {deviceLoading ? (
                <Skeleton className="h-[300px]" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={deviceData || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {(deviceData || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Top Pages Table */}
          <Card>
            <CardHeader>
              <CardTitle>Top Pages by Views</CardTitle>
            </CardHeader>
            <CardContent>
              {topPagesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Page</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                        <TableHead className="text-right">Avg Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(topPages || []).slice(0, 10).map((page: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium text-sm">
                            {page.page_path}
                          </TableCell>
                          <TableCell className="text-right">{page.view_count}</TableCell>
                          <TableCell className="text-right">
                            {Math.floor(page.avg_duration / 60)}m {page.avg_duration % 60}s
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Pages Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {topPagesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Page Path</TableHead>
                    <TableHead>Page Title</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">Unique Visitors</TableHead>
                    <TableHead className="text-right">Avg Duration</TableHead>
                    <TableHead className="text-right">Bounce Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(topPages || []).map((page: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">{page.page_path}</TableCell>
                      <TableCell>{page.page_title || 'N/A'}</TableCell>
                      <TableCell className="text-right">{page.view_count}</TableCell>
                      <TableCell className="text-right">{page.unique_visitors}</TableCell>
                      <TableCell className="text-right">
                        {Math.floor(page.avg_duration / 60)}m {page.avg_duration % 60}s
                      </TableCell>
                      <TableCell className="text-right">{page.bounce_rate}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
