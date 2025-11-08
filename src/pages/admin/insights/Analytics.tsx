import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { MetricCard } from '@/components/admin/insights/MetricCard';
import { DateRangePicker } from '@/components/admin/insights/DateRangePicker';
import { ExportButton } from '@/components/admin/insights/ExportButton';
import { ComparisonSelector } from '@/components/admin/insights/ComparisonSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package, 
  TrendingUp,
  Wallet
} from 'lucide-react';
import { formatCurrencyForExport, formatDateForExport } from '@/lib/exportCsv';
import { 
  ComparisonPeriod, 
  getPreviousPeriod, 
  calculateMetricComparison,
  formatComparisonText 
} from '@/lib/comparisonUtils';
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  BarChart, 
  Bar, 
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Analytics() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [comparisonPeriod, setComparisonPeriod] = useState<ComparisonPeriod>('none');

  const startDate = dateRange?.from || subDays(new Date(), 30);
  const endDate = dateRange?.to || new Date();

  // Get comparison date ranges
  const comparisonDates = comparisonPeriod !== 'none' 
    ? getPreviousPeriod(startDate, endDate, comparisonPeriod)
    : null;

  // Fetch platform metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['admin-analytics-metrics', startDate, endDate],
    queryFn: async () => {
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, status, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, created_at');

      const { data: herbs } = await supabase
        .from('herbs')
        .select('id');

      const { data: commissions } = await supabase
        .from('sales_analytics')
        .select('commission_amount, commission_status');

      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const pendingCommissions = commissions?.filter(c => c.commission_status === 'pending')
        .reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;

      return {
        totalRevenue,
        totalOrders: orders?.length || 0,
        activeUsers: profiles?.length || 0,
        totalProducts: herbs?.length || 0,
        pendingCommissions,
        ordersByStatus: orders?.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      };
    },
  });

  // Fetch previous period metrics for comparison
  const { data: previousMetrics } = useQuery({
    queryKey: ['admin-analytics-previous-metrics', comparisonDates],
    queryFn: async () => {
      if (!comparisonDates) return null;

      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .gte('created_at', comparisonDates.previous.from.toISOString())
        .lte('created_at', comparisonDates.previous.to.toISOString());

      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

      return {
        totalRevenue,
        totalOrders: orders?.length || 0,
      };
    },
    enabled: comparisonPeriod !== 'none' && !!comparisonDates,
  });

  // Calculate comparisons
  const revenueComparison = comparisonPeriod !== 'none' && previousMetrics
    ? calculateMetricComparison(metrics?.totalRevenue || 0, previousMetrics.totalRevenue)
    : undefined;

  const ordersComparison = comparisonPeriod !== 'none' && previousMetrics
    ? calculateMetricComparison(metrics?.totalOrders || 0, previousMetrics.totalOrders)
    : undefined;

  // Fetch monthly revenue trend
  const { data: revenueTrend, isLoading: trendLoading } = useQuery({
    queryKey: ['admin-revenue-trend'],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .gte('created_at', subDays(new Date(), 365).toISOString())
        .order('created_at', { ascending: true });

      const monthlyData = data?.reduce((acc, order) => {
        const month = new Date(order.created_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
        if (!acc[month]) {
          acc[month] = 0;
        }
        acc[month] += Number(order.total_amount);
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(monthlyData || {}).map(([month, revenue]) => ({
        month,
        revenue,
      })).slice(-12);
    },
  });

  // Fetch top products
  const { data: topProducts, isLoading: productsLoading } = useQuery({
    queryKey: ['admin-top-products'],
    queryFn: async () => {
      const { data: analytics } = await supabase
        .from('sales_analytics')
        .select('items_breakdown');

      const productTotals: Record<string, { name: string; revenue: number }> = {};
      
      analytics?.forEach((sale) => {
        const items = sale.items_breakdown as any[];
        items?.forEach((item) => {
          if (!productTotals[item.herb_id]) {
            productTotals[item.herb_id] = { name: item.herb_name, revenue: 0 };
          }
          productTotals[item.herb_id].revenue += Number(item.subtotal);
        });
      });

      return Object.values(productTotals)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
    },
  });

  const orderStatusData = metrics?.ordersByStatus 
    ? Object.entries(metrics.ordersByStatus).map(([name, value]) => ({ name, value }))
    : [];

  const presets = [
    {
      label: 'Last 7 days',
      value: { from: subDays(new Date(), 7), to: new Date() },
    },
    {
      label: 'Last 30 days',
      value: { from: subDays(new Date(), 30), to: new Date() },
    },
    {
      label: 'Last 90 days',
      value: { from: subDays(new Date(), 90), to: new Date() },
    },
  ];

  const exportOptions = [
    {
      label: 'Revenue Trend',
      data: revenueTrend || [],
      columns: [
        { key: 'month', header: 'Month' },
        { key: 'revenue', header: 'Revenue (THB)', formatter: (val: number) => formatCurrencyForExport(val, 'THB') },
      ],
      filename: 'analytics_revenue_trend',
    },
    {
      label: 'Top Products',
      data: topProducts || [],
      columns: [
        { key: 'name', header: 'Product Name' },
        { key: 'revenue', header: 'Total Revenue (THB)', formatter: (val: number) => formatCurrencyForExport(val, 'THB') },
      ],
      filename: 'analytics_top_products',
    },
    {
      label: 'Order Status',
      data: orderStatusData,
      columns: [
        { key: 'name', header: 'Status' },
        { key: 'value', header: 'Count' },
      ],
      filename: 'analytics_order_status',
    },
  ];

  const comparisonLabel = formatComparisonText(comparisonPeriod);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Analytics Overview</h1>
            <p className="text-muted-foreground">Platform-wide insights and metrics</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ComparisonSelector
              value={comparisonPeriod}
              onChange={setComparisonPeriod}
              disabled={metricsLoading}
            />
            <ExportButton 
              options={exportOptions}
              disabled={metricsLoading || trendLoading || productsLoading}
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
                title="Total Revenue"
                value={`฿${metrics?.totalRevenue.toLocaleString()}`}
                icon={DollarSign}
                comparison={revenueComparison ? {
                  previousValue: `฿${previousMetrics?.totalRevenue.toLocaleString()}`,
                  percentageChange: revenueComparison.percentageChange,
                  isPositive: revenueComparison.isPositive,
                  label: comparisonLabel,
                } : undefined}
                trend={!revenueComparison ? { value: 12.5, isPositive: true } : undefined}
              />
              <MetricCard
                title="Total Orders"
                value={metrics?.totalOrders || 0}
                icon={ShoppingCart}
                comparison={ordersComparison ? {
                  previousValue: previousMetrics?.totalOrders || 0,
                  percentageChange: ordersComparison.percentageChange,
                  isPositive: ordersComparison.isPositive,
                  label: comparisonLabel,
                } : undefined}
                trend={!ordersComparison ? { value: 8.2, isPositive: true } : undefined}
              />
              <MetricCard
                title="Active Users"
                value={metrics?.activeUsers || 0}
                icon={Users}
                trend={{ value: 5.1, isPositive: true }}
              />
              <MetricCard
                title="Products in Catalog"
                value={metrics?.totalProducts || 0}
                icon={Package}
              />
              <MetricCard
                title="Pending Commissions"
                value={`฿${metrics?.pendingCommissions.toLocaleString()}`}
                icon={Wallet}
              />
              <MetricCard
                title="Growth Rate"
                value="15.3%"
                icon={TrendingUp}
                description="Month-over-month"
              />
            </>
          )}
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend (Last 12 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              {trendLoading ? (
                <Skeleton className="h-[300px]" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Order Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {metricsLoading ? (
                <Skeleton className="h-[300px]" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => entry.name}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {orderStatusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Top Products by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <Skeleton className="h-[300px]" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProducts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
