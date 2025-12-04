import { useState } from 'react';
import { Order } from '@/pages/Orders';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, MapPin, CreditCard, Calendar, Truck, Loader2, ExternalLink, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getStatusDisplayName, getStatusBadgeVariant } from '@/lib/orderUtils';
import { CourierBadge } from './CourierBadge';
import { logger } from '@/lib/logger';
import { TrackingTimeline } from './TrackingTimeline';

interface OrderDetailDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeRole: string;
}

export function OrderDetailDialog({ order, open, onOpenChange, activeRole }: OrderDetailDialogProps) {
  const [isLoadingCheckout, setIsLoadingCheckout] = useState(false);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'THB',
    }).format(amount);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handlePayNow = async () => {
    setIsLoadingCheckout(true);
    try {
      // Fetch the recommendation checkout link
      const { data: linkData, error: linkError } = await supabase
        .from('recommendation_links')
        .select('token, expires_at')
        .eq('recommendation_id', order.recommendation_id)
        .gt('expires_at', new Date().toISOString())
        .is('used_at', null)
        .single();

      if (linkError || !linkData) {
        toast.error("Checkout link expired. Please contact your practitioner.");
        return;
      }

      // Open checkout in new tab
      window.open(`/checkout/${linkData.token}`, '_blank');
      toast.success("Opening checkout page...");
    } catch (error) {
      logger.error('Error fetching checkout link:', error);
      toast.error("Failed to open checkout. Please try again.");
    } finally {
      setIsLoadingCheckout(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
          <DialogDescription>
            Order ID: {order.id}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6 pr-4">
            {/* Order Summary */}
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Package className="w-4 h-4" />
                Order Summary
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={getStatusBadgeVariant(order.status)}>
                    {getStatusDisplayName(order.status)}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Status</p>
                  <Badge variant={order.payment_status === 'paid' ? 'default' : 'outline'}>
                    {order.payment_status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Amount</p>
                  <p className="font-medium">
                    {formatCurrency(order.total_amount, order.currency)}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Tracking Timeline */}
            {(order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered') && (
              <>
                <div className="space-y-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Order Timeline
                  </h3>
                  <TrackingTimeline
                    currentStatus={order.status}
                    createdAt={new Date(order.created_at)}
                    shippedAt={order.shipped_at ? new Date(order.shipped_at) : undefined}
                    deliveredAt={order.actual_delivery_date ? new Date(order.actual_delivery_date) : undefined}
                    estimatedDelivery={order.estimated_delivery_date ? new Date(order.estimated_delivery_date) : undefined}
                  />
                </div>
                <Separator />
              </>
            )}

            {/* Courier & Tracking Information */}
            {(order.courier_name || order.tracking_number) && (
              <>
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Shipping & Tracking
                  </h3>
                  <div className="space-y-3">
                    {order.courier_name && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Courier</p>
                        <CourierBadge courierName={order.courier_name} />
                      </div>
                    )}
                    {order.tracking_number && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Tracking Number</p>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-muted px-3 py-1.5 rounded flex-1">
                            {order.tracking_number}
                          </code>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => copyToClipboard(order.tracking_number!)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          {order.courier_tracking_url && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => window.open(order.courier_tracking_url!, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                    {order.shipped_at && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Shipped On</p>
                        <p className="text-sm">{format(new Date(order.shipped_at), 'MMM dd, yyyy HH:mm')}</p>
                      </div>
                    )}
                    {order.estimated_delivery_date && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Estimated Delivery</p>
                        <p className="text-sm">{format(new Date(order.estimated_delivery_date), 'MMM dd, yyyy')}</p>
                      </div>
                    )}
                    {order.shipment_weight && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Shipment Weight</p>
                        <p className="text-sm">{order.shipment_weight} kg</p>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Patient Information */}
            <div className="space-y-2">
              <h3 className="font-semibold">Patient Information</h3>
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Name:</span> {order.patient.full_name}</p>
                <p><span className="text-muted-foreground">Email:</span> {order.patient.email || 'N/A'}</p>
                <p><span className="text-muted-foreground">Phone:</span> {order.patient.phone || 'N/A'}</p>
              </div>
            </div>

            <Separator />

            {/* Shipping Information */}
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Shipping Information
              </h3>
              <div className="text-sm space-y-1">
                {order.shipping_address ? (
                  <>
                    <p>{order.shipping_address}</p>
                    <p>{order.shipping_city} {order.shipping_postal_code}</p>
                    <p><span className="text-muted-foreground">Phone:</span> {order.shipping_phone}</p>
                  </>
                ) : (
                  <p className="text-muted-foreground">No shipping address provided</p>
                )}
              </div>
            </div>

            {order.tracking_number && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Tracking Information
                  </h3>
                  <code className="text-sm bg-muted px-3 py-2 rounded block">
                    {order.tracking_number}
                  </code>
                </div>
              </>
            )}

            <Separator />

            {/* Recommendation & Items */}
            <div className="space-y-2">
              <h3 className="font-semibold">Recommendation</h3>
              <p className="text-sm font-medium">{order.recommendation.title}</p>
              
              <div className="mt-4 space-y-3">
                <h4 className="text-sm font-semibold">Items</h4>
                {order.recommendation.recommendation_items.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    {item.herbs.image_url && (
                      <img
                        src={item.herbs.image_url}
                        alt={item.herbs.name}
                        className="w-12 h-12 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.herbs.name}</p>
                      {item.herbs.thai_name && (
                        <p className="text-xs text-muted-foreground">{item.herbs.thai_name}</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        Quantity: {item.quantity} × {formatCurrency(item.unit_price, order.currency)}
                      </p>
                      {item.dosage_instructions && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.dosage_instructions}
                        </p>
                      )}
                    </div>
                    <p className="font-medium text-sm">
                      {formatCurrency(item.quantity * item.unit_price, order.currency)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Payment Pending Alert */}
            {order.payment_status === 'pending' && activeRole === 'patient' && order.status !== 'cancelled' && (
              <>
                <Alert className="border-orange-500/50 bg-orange-50 dark:bg-orange-950/20">
                  <CreditCard className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="ml-2">
                    <div className="flex flex-col gap-3">
                      <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                        Payment Required
                      </p>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        This order requires payment to be processed. Please complete your payment to continue.
                      </p>
                      <Button 
                        onClick={handlePayNow}
                        disabled={isLoadingCheckout}
                        className="w-full sm:w-auto"
                      >
                        {isLoadingCheckout && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Complete Payment Now
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
                <Separator />
              </>
            )}

            {/* Payment Information */}
            <div className="space-y-2">
              <h3 className="font-semibold flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Payment Information
              </h3>
              <div className="text-sm space-y-1">
                <p><span className="text-muted-foreground">Method:</span> {order.payment_method || 'N/A'}</p>
                {order.payment_reference && (
                  <p><span className="text-muted-foreground">Reference:</span> {order.payment_reference}</p>
                )}
                {order.paid_at && (
                  <p><span className="text-muted-foreground">Paid at:</span> {format(new Date(order.paid_at), 'MMM dd, yyyy HH:mm')}</p>
                )}
              </div>
            </div>

            {/* Commission Information (Practitioner only) */}
            {activeRole === 'practitioner' && order.sales_analytics && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold">Commission Details</h3>
                  <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Commission</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(order.sales_analytics.commission_amount, order.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Rate: {(order.sales_analytics.commission_rate * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Notes */}
            {order.notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold">Notes</h3>
                  <p className="text-sm text-muted-foreground">{order.notes}</p>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
