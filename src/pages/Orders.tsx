import { useState, useEffect } from 'react';
import { useRole } from '@/contexts/RoleContext';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { OrdersTable } from '@/components/orders/OrdersTable';
import { OrderStats } from '@/components/orders/OrderStats';
import { OrderFilters } from '@/components/orders/OrderFilters';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export type Order = {
  id: string;
  recommendation_id: string;
  patient_id: string;
  total_amount: number;
  currency: string;
  status: string;
  payment_status: string;
  payment_method: string | null;
  tracking_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  shipping_address: string | null;
  shipping_city: string | null;
  shipping_postal_code: string | null;
  shipping_phone: string | null;
  payment_reference: string | null;
  courier_name: string | null;
  courier_tracking_url: string | null;
  shipnity_order_id: string | null;
  shipped_at: string | null;
  estimated_delivery_date: string | null;
  actual_delivery_date: string | null;
  shipment_weight: number | null;
  parcel_dimensions: any | null;
  patient: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
  };
  recommendation: {
    id: string;
    title: string;
    practitioner_id: string;
    recommendation_items: Array<{
      id: string;
      herb_id: string;
      quantity: number;
      unit_price: number;
      dosage_instructions: string | null;
      herbs: {
        id: string;
        name: string;
        thai_name: string | null;
        image_url: string | null;
      };
    }>;
  };
  sales_analytics: {
    commission_amount: number;
    commission_rate: number;
    items_breakdown: any;
  } | null;
};

export default function Orders() {
  const { activeRole } = useRole();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchOrders();
      setupRealtimeSubscription();
    }
  }, [user, activeRole]);

  useEffect(() => {
    applyFilters();
  }, [orders, statusFilter, paymentFilter, searchQuery, dateRange]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('orders')
        .select(`
          *,
          patient:patients(id, full_name, email, phone),
          recommendation:recommendations(
            id, 
            title, 
            practitioner_id,
            recommendation_items(
              id,
              herb_id,
              quantity,
              unit_price,
              dosage_instructions,
              herbs(id, name, thai_name, image_url)
            )
          ),
          sales_analytics(
            commission_amount,
            commission_rate,
            items_breakdown
          )
        `)
        .order('created_at', { ascending: false });

      // If practitioner, filter by their recommendations
      if (activeRole === 'practitioner') {
        query = query.eq('recommendation.practitioner_id', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform the data to match our type
      const transformedOrders = (data || []).map(order => ({
        ...order,
        sales_analytics: order.sales_analytics?.[0] || null
      }));
      
      setOrders(transformedOrders);
    } catch (error: any) {
      toast({
        title: 'Error fetching orders',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(order => order.payment_status === paymentFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(query) ||
        order.patient.full_name.toLowerCase().includes(query) ||
        order.tracking_number?.toLowerCase().includes(query)
      );
    }

    // Date range filter
    if (dateRange.from) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= dateRange.from!;
      });
    }
    if (dateRange.to) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate <= dateRange.to!;
      });
    }

    setFilteredOrders(filtered);
  };

  const handleUpdateOrder = async (orderId: string, updates: Partial<Order>) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Order updated',
        description: 'The order has been updated successfully.',
      });

      fetchOrders();
    } catch (error: any) {
      toast({
        title: 'Error updating order',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleSendStatusUpdate = async (orderId: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-order-status-update', {
        body: { order_id: orderId },
      });

      if (error) throw error;

      toast({
        title: 'Notification sent',
        description: 'Status update notification sent to patient.',
      });
    } catch (error: any) {
      toast({
        title: 'Error sending notification',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-fluid-4 md:space-y-6">
        <div>
          <h1 className="text-fluid-xl md:text-fluid-3xl font-bold tracking-tight">Orders Management</h1>
          <p className="text-fluid-sm md:text-fluid-base text-muted-foreground">
            Manage and track all orders {activeRole === 'practitioner' ? 'from your patients' : 'in the system'}
          </p>
        </div>

        <OrderStats orders={filteredOrders} activeRole={activeRole} />

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderFilters
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              paymentFilter={paymentFilter}
              setPaymentFilter={setPaymentFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              dateRange={dateRange}
              setDateRange={setDateRange}
              onClearFilters={() => {
                setStatusFilter('all');
                setPaymentFilter('all');
                setSearchQuery('');
                setDateRange({ from: undefined, to: undefined });
              }}
            />
          </CardContent>
        </Card>

        <OrdersTable
          orders={filteredOrders}
          onUpdateOrder={handleUpdateOrder}
          onSendStatusUpdate={handleSendStatusUpdate}
          activeRole={activeRole}
        />
      </div>
    </DashboardLayout>
  );
}
