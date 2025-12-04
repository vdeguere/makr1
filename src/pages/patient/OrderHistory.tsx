import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useNavigate } from 'react-router-dom';
import { Loader2, History, Calendar, DollarSign, ExternalLink, Package } from 'lucide-react';
import { logger } from '@/lib/logger';
import { useAnalytics } from '@/hooks/useAnalytics';
import { getStatusDisplayName, getStatusBadgeVariant } from '@/lib/orderUtils';
import { CourierBadge } from '@/components/orders/CourierBadge';

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  tracking_number: string | null;
  courier_name: string | null;
  courier_tracking_url: string | null;
}

export default function OrderHistory() {
  const { user } = useAuth();
  const { role } = useUserRole(user?.id);
  const navigate = useNavigate();
  const { trackEvent } = useAnalytics();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (role && role !== 'patient') {
      navigate('/dashboard');
      return;
    }
    fetchOrders();
  }, [role, navigate, user?.id]);

  const fetchOrders = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at, tracking_number, courier_name, courier_tracking_url')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
      
      // Track GA4 event
      const hasPendingOrders = data?.some(order => order.status === 'pending') || false;
      trackEvent('track_order', {
        order_count: data?.length || 0,
        has_pending_orders: hasPendingOrders,
      });
    } catch (error) {
      logger.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    return getStatusBadgeVariant(status);
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <History className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Purchase History</h1>
            <p className="text-muted-foreground">View all your past orders</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <History className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No orders found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>Order #{order.id.slice(0, 8)}</CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(order.created_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          ฿{Number(order.total_amount).toFixed(2)}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusBadgeVariant(order.status)}>
                      {getStatusDisplayName(order.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.courier_name && (
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <CourierBadge courierName={order.courier_name} className="text-xs" />
                    </div>
                  )}
                  {order.tracking_number && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Tracking Number</p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded flex-1">
                          {order.tracking_number}
                        </code>
                        {order.courier_tracking_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(order.courier_tracking_url!, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Track
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
