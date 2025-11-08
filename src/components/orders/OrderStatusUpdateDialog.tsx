import { useState, useEffect } from 'react';
import { Order } from '@/pages/Orders';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Calendar as CalendarIcon, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { THAI_COURIERS, generateTrackingUrl, estimateDeliveryDate } from '@/lib/orderUtils';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface OrderStatusUpdateDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (orderId: string, updates: Partial<Order>) => Promise<void>;
}

export function OrderStatusUpdateDialog({
  order,
  open,
  onOpenChange,
  onUpdate,
}: OrderStatusUpdateDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(order.status);
  const [trackingNumber, setTrackingNumber] = useState(order.tracking_number || '');
  const [notes, setNotes] = useState(order.notes || '');
  const [sendNotification, setSendNotification] = useState(true);
  const [courierName, setCourierName] = useState(order.courier_name || '');
  const [courierTrackingUrl, setCourierTrackingUrl] = useState(order.courier_tracking_url || '');
  const [shippedAt, setShippedAt] = useState<Date | undefined>(
    order.shipped_at ? new Date(order.shipped_at) : undefined
  );
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState<Date | undefined>(
    order.estimated_delivery_date ? new Date(order.estimated_delivery_date) : undefined
  );
  const [weight, setWeight] = useState<string>(order.shipment_weight?.toString() || '');

  // Auto-generate tracking URL when courier or tracking number changes
  useEffect(() => {
    if (courierName && trackingNumber.trim()) {
      const generatedUrl = generateTrackingUrl(courierName, trackingNumber.trim());
      if (generatedUrl) {
        setCourierTrackingUrl(generatedUrl);
      }
    }
  }, [courierName, trackingNumber]);

  // Auto-set shipped_at when status changes to shipped
  useEffect(() => {
    if (status === 'shipped' && !shippedAt) {
      setShippedAt(new Date());
    }
  }, [status, shippedAt]);

  // Auto-estimate delivery date when courier is selected and shipped
  useEffect(() => {
    if (status === 'shipped' && courierName && shippedAt && !estimatedDeliveryDate) {
      const estimated = estimateDeliveryDate(courierName, shippedAt);
      setEstimatedDeliveryDate(estimated);
    }
  }, [status, courierName, shippedAt, estimatedDeliveryDate]);

  const handleSubmit = async () => {
    // Validation
    if (status === 'shipped' && !trackingNumber.trim()) {
      toast({
        title: 'Tracking number required',
        description: 'Please provide a tracking number for shipped orders.',
        variant: 'destructive',
      });
      return;
    }

    if (status === 'shipped' && !courierName) {
      toast({
        title: 'Courier required',
        description: 'Please select a courier for shipped orders.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const updates: Partial<Order> = {
        status,
        tracking_number: trackingNumber.trim() || null,
        notes: notes.trim() || null,
        courier_name: courierName || null,
        courier_tracking_url: courierTrackingUrl || null,
        shipped_at: shippedAt?.toISOString() || null,
        estimated_delivery_date: estimatedDeliveryDate?.toISOString().split('T')[0] || null,
        shipment_weight: weight ? parseFloat(weight) : null,
      };

      await onUpdate(order.id, updates);

      if (sendNotification) {
        const { error } = await supabase.functions.invoke('send-order-status-update', {
          body: { order_id: order.id },
        });
        
        if (error) {
          console.error('Failed to send notification:', error);
          toast({
            title: 'Warning',
            description: 'Order updated but notification failed to send.',
            variant: 'destructive',
          });
        }
      }

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Order Status</DialogTitle>
          <DialogDescription>
            Update the status and details for order {order.id.slice(0, 8)}...
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label htmlFor="status">Order Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Order Received</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(status === 'processing' || status === 'shipped' || status === 'delivered') && (
            <>
              <div className="space-y-2">
                <Label htmlFor="courier">
                  Courier {status === 'shipped' && <span className="text-destructive">*</span>}
                </Label>
                <Select value={courierName} onValueChange={setCourierName}>
                  <SelectTrigger id="courier">
                    <SelectValue placeholder="Select courier" />
                  </SelectTrigger>
                  <SelectContent>
                    {THAI_COURIERS.map((courier) => (
                      <SelectItem key={courier} value={courier}>
                        {courier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tracking">
                  Tracking Number {status === 'shipped' && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id="tracking"
                  placeholder="Enter tracking number"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
              </div>

              {courierTrackingUrl && (
                <div className="space-y-2">
                  <Label>Tracking URL (Auto-generated)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={courierTrackingUrl}
                      onChange={(e) => setCourierTrackingUrl(e.target.value)}
                      placeholder="Tracking URL"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(courierTrackingUrl, '_blank')}
                      disabled={!courierTrackingUrl}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Auto-generated based on courier and tracking number. You can edit if needed.
                  </p>
                </div>
              )}

              {status === 'shipped' && (
                <>
                  <div className="space-y-2">
                    <Label>Shipped Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !shippedAt && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {shippedAt ? format(shippedAt, 'PPP p') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={shippedAt}
                          onSelect={setShippedAt}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Estimated Delivery Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !estimatedDeliveryDate && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {estimatedDeliveryDate ? (
                            format(estimatedDeliveryDate, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={estimatedDeliveryDate}
                          onSelect={setEstimatedDeliveryDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground">
                      Auto-estimated based on courier. You can adjust if needed.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight">Shipment Weight (kg) - Optional</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      placeholder="e.g., 2.5"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                    />
                  </div>
                </>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this update..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="notify"
              checked={sendNotification}
              onCheckedChange={(checked) => setSendNotification(checked as boolean)}
            />
            <Label htmlFor="notify" className="text-sm font-normal cursor-pointer">
              Send notification to patient (email/LINE)
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Order'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
