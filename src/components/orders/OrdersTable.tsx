import { useState } from 'react';
import { Order } from '@/pages/Orders';
import { OrderDetailDialog } from './OrderDetailDialog';
import { OrderStatusUpdateDialog } from './OrderStatusUpdateDialog';
import { OrderCard } from './OrderCard';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Eye, Edit, Send, ExternalLink } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getStatusDisplayName, getStatusBadgeVariant } from '@/lib/orderUtils';
import { CourierBadge } from './CourierBadge';
import { useIsMobile } from '@/hooks/use-mobile';

interface OrdersTableProps {
  orders: Order[];
  onUpdateOrder: (orderId: string, updates: Partial<Order>) => Promise<void>;
  onSendStatusUpdate: (orderId: string) => Promise<void>;
  activeRole: string;
}

export function OrdersTable({ orders, onUpdateOrder, onSendStatusUpdate, activeRole }: OrdersTableProps) {
  const isMobile = useIsMobile();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);

  const getPaymentBadgeVariant = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'THB',
    }).format(amount);
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailDialogOpen(true);
  };

  const handleEditStatus = (order: Order) => {
    setSelectedOrder(order);
    setStatusDialogOpen(true);
  };

  const openTrackingUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (orders.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <p>No orders found matching your filters.</p>
        </div>
      </Card>
    );
  }

  // Mobile view: Card-based layout
  if (isMobile) {
    return (
      <>
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onViewDetails={handleViewDetails}
              onEditStatus={handleEditStatus}
              onSendUpdate={onSendStatusUpdate}
              onOpenTracking={openTrackingUrl}
              showCommission={activeRole === 'practitioner'}
            />
          ))}
        </div>

        {selectedOrder && (
          <>
            <OrderDetailDialog
              order={selectedOrder}
              open={detailDialogOpen}
              onOpenChange={setDetailDialogOpen}
              activeRole={activeRole}
            />
            <OrderStatusUpdateDialog
              order={selectedOrder}
              open={statusDialogOpen}
              onOpenChange={setStatusDialogOpen}
              onUpdate={onUpdateOrder}
            />
          </>
        )}
      </>
    );
  }

  // Desktop view: Table layout
  return (
    <>
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Courier & Tracking</TableHead>
                {activeRole === 'practitioner' && <TableHead>Commission</TableHead>}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">
                    {order.id.slice(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium">{order.patient.full_name}</p>
                        <p className="text-sm text-muted-foreground">{order.patient.email}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onSendStatusUpdate(order.id)}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">
                        {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(order.total_amount, order.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(order.status)}>
                      {getStatusDisplayName(order.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPaymentBadgeVariant(order.payment_status)}>
                      {order.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {order.courier_name && (
                        <CourierBadge courierName={order.courier_name} className="text-xs" />
                      )}
                      {order.tracking_number ? (
                        <div className="flex items-center gap-1">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {order.tracking_number}
                          </code>
                          {order.courier_tracking_url && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => openTrackingUrl(order.courier_tracking_url!)}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">No tracking</span>
                      )}
                    </div>
                  </TableCell>
                  {activeRole === 'practitioner' && (
                    <TableCell>
                      {order.sales_analytics?.commission_amount ? (
                        <span className="text-sm font-medium text-green-600">
                          {formatCurrency(
                            order.sales_analytics.commission_amount,
                            order.currency
                          )}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDetails(order)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditStatus(order)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {selectedOrder && (
        <>
          <OrderDetailDialog
            order={selectedOrder}
            open={detailDialogOpen}
            onOpenChange={setDetailDialogOpen}
            activeRole={activeRole}
          />
          <OrderStatusUpdateDialog
            order={selectedOrder}
            open={statusDialogOpen}
            onOpenChange={setStatusDialogOpen}
            onUpdate={onUpdateOrder}
          />
        </>
      )}
    </>
  );
}
