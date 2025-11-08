import { Order } from '@/pages/Orders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Send, ExternalLink, User, Calendar, CreditCard, Package } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getStatusDisplayName, getStatusBadgeVariant } from '@/lib/orderUtils';
import { CourierBadge } from './CourierBadge';
import { TouchCard } from '@/components/mobile/TouchOptimized';

interface OrderCardProps {
  order: Order;
  onViewDetails: (order: Order) => void;
  onEditStatus: (order: Order) => void;
  onSendUpdate: (orderId: string) => void;
  onOpenTracking?: (url: string) => void;
  showCommission?: boolean;
}

export function OrderCard({
  order,
  onViewDetails,
  onEditStatus,
  onSendUpdate,
  onOpenTracking,
  showCommission = false,
}: OrderCardProps) {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'THB',
    }).format(amount);
  };

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

  return (
    <TouchCard className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-mono truncate">
              #{order.id.slice(0, 8)}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Calendar className="h-3 w-3 shrink-0" />
              <span className="truncate">{formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant={getStatusBadgeVariant(order.status)} className="shrink-0">
              {getStatusDisplayName(order.status)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 pt-0">
        {/* Patient Info */}
        <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
          <User className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{order.patient.full_name}</p>
            <p className="text-xs text-muted-foreground truncate">{order.patient.email}</p>
          </div>
        </div>

        {/* Amount and Payment */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-lg font-bold">{formatCurrency(order.total_amount, order.currency)}</p>
              <Badge variant={getPaymentBadgeVariant(order.payment_status)} className="text-xs">
                {order.payment_status}
              </Badge>
            </div>
          </div>

          {showCommission && order.sales_analytics?.commission_amount && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Commission</p>
              <p className="text-sm font-semibold text-green-600">
                {formatCurrency(order.sales_analytics.commission_amount, order.currency)}
              </p>
            </div>
          )}
        </div>

        {/* Courier and Tracking */}
        {(order.courier_name || order.tracking_number) && (
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
            <Package className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0 space-y-1">
              {order.courier_name && <CourierBadge courierName={order.courier_name} />}
              {order.tracking_number && (
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-background px-2 py-1 rounded truncate flex-1">
                    {order.tracking_number}
                  </code>
                  {order.courier_tracking_url && onOpenTracking && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenTracking(order.courier_tracking_url!);
                      }}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 min-h-touch"
            onClick={() => onViewDetails(order)}
          >
            <Eye className="w-4 h-4 mr-2" />
            View
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 min-h-touch"
            onClick={() => onEditStatus(order)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 min-h-touch min-w-touch"
            onClick={() => onSendUpdate(order.id)}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </TouchCard>
  );
}
