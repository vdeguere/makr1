import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { MetricCard } from '@/components/admin/insights/MetricCard';
import { DateRangePicker } from '@/components/admin/insights/DateRangePicker';
import { ExportButton } from '@/components/admin/insights/ExportButton';
import { ComparisonSelector } from '@/components/admin/insights/ComparisonSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  DollarSign, 
  TrendingUp, 
  Wallet,
  Package,
  Award,
  Target
} from 'lucide-react';
import { formatCurrencyForExport } from '@/lib/exportCsv';
import { 
  ComparisonPeriod, 
  getPreviousPeriod, 
  calculateMetricComparison,
  formatComparisonText 
} from '@/lib/comparisonUtils';
import { 
  LineChart, 
  Line, 
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
import { subDays } from 'date-fns';

export default function Sales() {
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

  // Fetch sales metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['admin-sales-metrics', startDate, endDate],
    queryFn: async () => {
      const { data: sales } = await supabase
        .from('sales_analytics')
        .select('*, orders!inner(created_at)')
        .gte('orders.created_at', startDate.toISOString())
        .lte('orders.created_at', endDate.toISOString());

      const totalRevenue = sales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
      const totalCommissionPaid = sales?.filter(s => s.commission_status === 'paid')
        .reduce((sum, s) => sum + Number(s.commission_amount), 0) || 0;
      const totalCommissionPending = sales?.filter(s => s.commission_status === 'pending')
        .reduce((sum, s) => sum + Number(s.commission_amount), 0) || 0;

      const avgOrderValue = sales?.length ? totalRevenue / sales.length : 0;

      return {
        totalRevenue,
        totalCommissionPaid,
        totalCommissionPending,
        avgOrderValue,
        totalOrders: sales?.length || 0,
      };
    },
  });

  // Fetch previous period metrics
  const { data: previousMetrics } = useQuery({
    queryKey: ['admin-sales-previous-metrics', comparisonDates],
    queryFn: async () => {
      if (!comparisonDates) return null;

      const { data: sales } = await supabase
        .from('sales_analytics')
        .select('*, orders!inner(created_at)')
        .gte('orders.created_at', comparisonDates.previous.from.toISOString())
        .lte('orders.created_at', comparisonDates.previous.to.toISOString());

      const totalRevenue = sales?.reduce((sum, s) => sum + Number(s.total_amount), 0) || 0;
      const avgOrderValue = sales?.length ? totalRevenue / sales.length : 0;

      return {
        totalRevenue,
        avgOrderValue,
        totalOrders: sales?.length || 0,
      };
    },
    enabled: comparisonPeriod !== 'none' && !!comparisonDates,
  });

  const revenueComparison = comparisonPeriod !== 'none' && previousMetrics
    ? calculateMetricComparison(metrics?.totalRevenue || 0, previousMetrics.totalRevenue)
    : undefined;

  const avgOrderComparison = comparisonPeriod !== 'none' && previousMetrics
    ? calculateMetricComparison(metrics?.avgOrderValue || 0, previousMetrics.avgOrderValue)
    : undefined;

  // Fetch top practitioners
  const { data: topPractitioners, isLoading: practitionersLoading } = useQuery({
    queryKey: ['admin-top-practitioners'],
    queryFn: async () => {
      const { data } = await supabase
        .from('sales_analytics')
        .select('practitioner_id, total_amount, commission_amount, profiles!inner(full_name)')
        .order('total_amount', { ascending: false });

      const practitionerStats = data?.reduce((acc, sale) => {
        const id = sale.practitioner_id;
        if (!acc[id]) {
          acc[id] = {
            name: (sale.profiles as any).full_name,
            revenue: 0,
            commission: 0,
            orders: 0,
          };
        }
        acc[id].revenue += Number(sale.total_amount);
        acc[id].commission += Number(sale.commission_amount);
        acc[id].orders += 1;
        return acc;
      }, {} as Record<string, any>);

      return Object.values(practitionerStats || {})
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 10);
    },
  });

  // Fetch product performance
  const { data: productPerformance, isLoading: productsLoading } = useQuery({
    queryKey: ['admin-product-performance'],
    queryFn: async () => {
      const { data: analytics } = await supabase
        .from('sales_analytics')
        .select('items_breakdown');

      const productStats: Record<string, any> = {};
      
      analytics?.forEach((sale) => {
        const items = sale.items_breakdown as any[];
        items?.forEach((item) => {
          if (!productStats[item.herb_id]) {
            productStats[item.herb_id] = {
              name: item.herb_name,
              revenue: 0,
              quantity: 0,
              orders: 0,
            };
          }
          productStats[item.herb_id].revenue += Number(item.subtotal);
          productStats[item.herb_id].quantity += item.quantity;
          productStats[item.herb_id].orders += 1;
        });
      });

      return Object.values(productStats)
        .sort((a: any, b: any) => b.revenue - a.revenue)
        .slice(0, 15);
    },
  });

  const presets = [
    { label: 'Last 7 days', value: { from: subDays(new Date(), 7), to: new Date() } },
    { label: 'Last 30 days', value: { from: subDays(new Date(), 30), to: new Date() } },
    { label: 'Last 90 days', value: { from: subDays(new Date(), 90), to: new Date() } },
  ];

  const exportOptions = [
    {
      label: 'Product Performance',
      data: productPerformance || [],
      columns: [
        { key: 'name', header: 'Product Name' },
        { key: 'revenue', header: 'Revenue (THB)', formatter: (val: number) => formatCurrencyForExport(val, 'THB') },
        { key: 'quantity', header: 'Units Sold' },
        { key: 'orders', header: 'Number of Orders' },
      ],
      filename: 'sales_product_performance',
    },
    {
      label: 'Top Practitioners',
      data: topPractitioners || [],
      columns: [
        { key: 'name', header: 'Practitioner Name' },
        { key: 'revenue', header: 'Total Revenue (THB)', formatter: (val: number) => formatCurrencyForExport(val, 'THB') },
        { key: 'commission', header: 'Commission Earned (THB)', formatter: (val: number) => formatCurrencyForExport(val, 'THB') },
        { key: 'orders', header: 'Total Orders' },
      ],
      filename: 'sales_top_practitioners',
    },
  ];

  const comparisonLabel = formatComparisonText(comparisonPeriod);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Sales Insights</h1>
            <p className="text-muted-foreground">Detailed sales, revenue, and commission analytics</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ComparisonSelector
              value={comparisonPeriod}
              onChange={setComparisonPeriod}
              disabled={metricsLoading}
            />
            <ExportButton 
              options={exportOptions}
              disabled={metricsLoading || practitionersLoading || productsLoading}
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
                title="Total Sales Revenue"
                value={`฿${metrics?.totalRevenue.toLocaleString()}`}
                icon={DollarSign}
                comparison={revenueComparison ? {
                  previousValue: `฿${previousMetrics?.totalRevenue.toLocaleString()}`,
                  percentageChange: revenueComparison.percentageChange,
                  isPositive: revenueComparison.isPositive,
                  label: comparisonLabel,
                } : undefined}
                trend={!revenueComparison ? { value: 15.2, isPositive: true } : undefined}
              />
              <MetricCard
                title="Commission Paid"
                value={`฿${metrics?.totalCommissionPaid.toLocaleString()}`}
                icon={Wallet}
              />
              <MetricCard
                title="Commission Pending"
                value={`฿${metrics?.totalCommissionPending.toLocaleString()}`}
                icon={TrendingUp}
              />
              <MetricCard
                title="Average Order Value"
                value={`฿${metrics?.avgOrderValue.toFixed(2)}`}
                icon={Target}
                comparison={avgOrderComparison ? {
                  previousValue: `฿${previousMetrics?.avgOrderValue.toFixed(2)}`,
                  percentageChange: avgOrderComparison.percentageChange,
                  isPositive: avgOrderComparison.isPositive,
                  label: comparisonLabel,
                } : undefined}
              />
              <MetricCard
                title="Total Orders"
                value={metrics?.totalOrders || 0}
                icon={Package}
              />
              <MetricCard
                title="Conversion Rate"
                value="68.4%"
                icon={Award}
                description="Recommendation to order"
              />
            </>
          )}
        </div>

        {/* Detailed Tabs */}
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">Product Performance</TabsTrigger>
            <TabsTrigger value="practitioners">Top Sellers</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Best-Selling Products</CardTitle>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <Skeleton className="h-[400px]" />
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product Name</TableHead>
                          <TableHead className="text-right">Revenue</TableHead>
                          <TableHead className="text-right">Units Sold</TableHead>
                          <TableHead className="text-right">Orders</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {productPerformance?.map((product: any, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell className="text-right">
                              ฿{product.revenue.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">{product.quantity}</TableCell>
                            <TableCell className="text-right">{product.orders}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="practitioners" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Practitioner Leaderboard</CardTitle>
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
                          <TableHead className="text-right">Revenue</TableHead>
                          <TableHead className="text-right">Commission</TableHead>
                          <TableHead className="text-right">Orders</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topPractitioners?.map((practitioner: any, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-bold">#{index + 1}</TableCell>
                            <TableCell className="font-medium">{practitioner.name}</TableCell>
                            <TableCell className="text-right">
                              ฿{practitioner.revenue.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              ฿{practitioner.commission.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">{practitioner.orders}</TableCell>
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
      </div>
    </DashboardLayout>
  );
}
