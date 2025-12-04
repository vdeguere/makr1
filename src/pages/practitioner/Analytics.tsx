import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useNavigate } from 'react-router-dom';
import { Loader2, TrendingUp, DollarSign, ShoppingCart, Percent, Calendar, CheckCircle, Clock, Package } from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { logger } from '@/lib/logger';

interface SalesData {
  total_sales: number;
  total_commission: number;
  pending_commission: number;
  paid_commission: number;
  order_count: number;
  avg_commission_rate: number;
}

interface ProductBreakdown {
  herb_name: string;
  total_quantity: number;
  total_sales: number;
  total_commission: number;
  order_count: number;
}

interface OrderDetail {
  order_id: string;
  order_date: string;
  patient_name: string;
  total_amount: number;
  commission_amount: number;
  commission_status: string;
  items_breakdown: any;
}

interface PayoutHistory {
  id: string;
  total_amount: number;
  status: string;
  payment_method: string;
  payment_date: string;
  period_start: string;
  period_end: string;
}

interface MonthlyData {
  month: string;
  sales: number;
  commission: number;
}

export default function PractitionerAnalytics() {
  const { user } = useAuth();
  const { role } = useUserRole(user?.id);
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<SalesData>({
    total_sales: 0,
    total_commission: 0,
    pending_commission: 0,
    paid_commission: 0,
    order_count: 0,
    avg_commission_rate: 0,
  });
  const [productBreakdown, setProductBreakdown] = useState<ProductBreakdown[]>([]);
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<PayoutHistory[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);

  useEffect(() => {
    if (role && role !== 'practitioner') {
      navigate('/dashboard');
      return;
    }
    fetchSalesData();
  }, [role, navigate, user?.id]);

  const fetchSalesData = async () => {
    if (!user?.id) return;

    try {
      // Fetch sales analytics with order details
      const { data: analyticsData, error: analyticsError } = await supabase
        .from('sales_analytics')
        .select(`
          *,
          orders!inner(
            id,
            created_at,
            total_amount,
            recommendations!inner(
              patients!inner(full_name)
            )
          )
        `)
        .eq('practitioner_id', user.id)
        .order('created_at', { ascending: false });

      if (analyticsError) throw analyticsError;

      // Calculate overview metrics
      const totalSales = analyticsData?.reduce((sum, item) => sum + Number(item.total_amount), 0) || 0;
      const totalCommission = analyticsData?.reduce((sum, item) => sum + Number(item.commission_amount), 0) || 0;
      const pendingCommission = analyticsData?.filter(item => item.commission_status === 'pending').reduce((sum, item) => sum + Number(item.commission_amount), 0) || 0;
      const paidCommission = analyticsData?.filter(item => item.commission_status === 'paid').reduce((sum, item) => sum + Number(item.commission_amount), 0) || 0;
      const orderCount = analyticsData?.length || 0;
      const avgCommissionRate = totalSales > 0 ? (totalCommission / totalSales) * 100 : 0;

      setSalesData({
        total_sales: totalSales,
        total_commission: totalCommission,
        pending_commission: pendingCommission,
        paid_commission: paidCommission,
        order_count: orderCount,
        avg_commission_rate: avgCommissionRate,
      });

      // Build product breakdown
      const productMap = new Map<string, ProductBreakdown>();
      analyticsData?.forEach(item => {
        if (item.items_breakdown) {
          const items = Array.isArray(item.items_breakdown) ? item.items_breakdown : [];
          items.forEach((product: any) => {
            const existing = productMap.get(product.herb_name) || {
              herb_name: product.herb_name,
              total_quantity: 0,
              total_sales: 0,
              total_commission: 0,
              order_count: 0,
            };
            productMap.set(product.herb_name, {
              herb_name: product.herb_name,
              total_quantity: existing.total_quantity + Number(product.quantity),
              total_sales: existing.total_sales + Number(product.subtotal),
              total_commission: existing.total_commission + Number(product.commission_amount),
              order_count: existing.order_count + 1,
            });
          });
        }
      });
      setProductBreakdown(Array.from(productMap.values()).sort((a, b) => b.total_commission - a.total_commission));

      // Build order details
      const orders: OrderDetail[] = analyticsData?.map(item => ({
        order_id: item.orders.id,
        order_date: item.orders.created_at,
        patient_name: item.orders.recommendations?.patients?.full_name || 'Unknown',
        total_amount: Number(item.total_amount),
        commission_amount: Number(item.commission_amount),
        commission_status: item.commission_status || 'pending',
        items_breakdown: item.items_breakdown,
      })) || [];
      setOrderDetails(orders);

      // Build monthly data (last 6 months)
      const monthlyMap = new Map<string, MonthlyData>();
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthKey = format(date, 'MMM yyyy');
        monthlyMap.set(monthKey, { month: monthKey, sales: 0, commission: 0 });
      }
      
      analyticsData?.forEach(item => {
        const monthKey = format(new Date(item.orders.created_at), 'MMM yyyy');
        const existing = monthlyMap.get(monthKey);
        if (existing) {
          existing.sales += Number(item.total_amount);
          existing.commission += Number(item.commission_amount);
        }
      });
      setMonthlyData(Array.from(monthlyMap.values()));

      // Fetch payout history
      const { data: payoutsData, error: payoutsError } = await supabase
        .from('commission_payouts')
        .select('*')
        .eq('practitioner_id', user.id)
        .order('created_at', { ascending: false });

      if (!payoutsError && payoutsData) {
        setPayoutHistory(payoutsData);
      }

      trackEvent('view_analytics', {
        total_sales: totalSales,
        total_commission: totalCommission,
        order_count: orderCount,
      });
    } catch (error) {
      logger.error('Error fetching sales data:', error);
    } finally {
      setLoading(false);
    }
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      approved: "secondary",
      paid: "default",
      rejected: "destructive",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Earnings Dashboard</h1>
            <p className="text-muted-foreground">Comprehensive view of your sales and commission</p>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Commission</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">฿{salesData.pending_commission.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Awaiting payout</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Commission</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">฿{salesData.paid_commission.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Already received</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">฿{salesData.total_sales.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{salesData.order_count} orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Commission</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salesData.avg_commission_rate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Commission rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trends</CardTitle>
            <CardDescription>Sales and commission over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" name="Sales" />
                <Line type="monotone" dataKey="commission" stroke="hsl(var(--chart-2))" name="Commission" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Detailed Tabs */}
        <Tabs defaultValue="products" className="space-y-4">
          <TabsList>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Earnings by Product</CardTitle>
                <CardDescription>Top products by commission earned</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Quantity Sold</TableHead>
                      <TableHead className="text-right">Total Sales</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productBreakdown.slice(0, 20).map((product, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{product.herb_name}</TableCell>
                        <TableCell className="text-right">{product.total_quantity}</TableCell>
                        <TableCell className="text-right">฿{product.total_sales.toFixed(2)}</TableCell>
                        <TableCell className="text-right">฿{product.total_commission.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{product.order_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
                <CardDescription>All orders with commission breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderDetails.map((order) => (
                      <TableRow key={order.order_id}>
                        <TableCell>{format(new Date(order.order_date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>{order.patient_name}</TableCell>
                        <TableCell className="text-right">฿{order.total_amount.toFixed(2)}</TableCell>
                        <TableCell className="text-right">฿{order.commission_amount.toFixed(2)}</TableCell>
                        <TableCell>{getStatusBadge(order.commission_status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payout History</CardTitle>
                <CardDescription>Record of all commission payouts</CardDescription>
              </CardHeader>
              <CardContent>
                {payoutHistory.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead>Payment Date</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payoutHistory.map((payout) => (
                        <TableRow key={payout.id}>
                          <TableCell>
                            {format(new Date(payout.period_start), 'MMM dd')} - {format(new Date(payout.period_end), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            {payout.payment_date ? format(new Date(payout.payment_date), 'MMM dd, yyyy') : '-'}
                          </TableCell>
                          <TableCell className="capitalize">{payout.payment_method?.replace('_', ' ') || '-'}</TableCell>
                          <TableCell className="text-right">฿{Number(payout.total_amount).toFixed(2)}</TableCell>
                          <TableCell>{getStatusBadge(payout.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No payout history yet</p>
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
