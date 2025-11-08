import { format } from 'date-fns';
import { Check, Circle, Package, Truck, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineStep {
  status: string;
  label: string;
  date?: Date;
  icon: React.ReactNode;
}

interface TrackingTimelineProps {
  currentStatus: string;
  createdAt: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
  estimatedDelivery?: Date;
}

export function TrackingTimeline({
  currentStatus,
  createdAt,
  shippedAt,
  deliveredAt,
  estimatedDelivery,
}: TrackingTimelineProps) {
  const steps: TimelineStep[] = [
    {
      status: 'pending',
      label: 'Order Received',
      date: createdAt,
      icon: <Package className="w-4 h-4" />,
    },
    {
      status: 'processing',
      label: 'Processing',
      date: currentStatus === 'processing' || currentStatus === 'shipped' || currentStatus === 'delivered' ? createdAt : undefined,
      icon: <Circle className="w-4 h-4" />,
    },
    {
      status: 'shipped',
      label: 'Shipped',
      date: shippedAt,
      icon: <Truck className="w-4 h-4" />,
    },
    {
      status: 'delivered',
      label: 'Delivered',
      date: deliveredAt,
      icon: <Home className="w-4 h-4" />,
    },
  ];

  const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
  const currentIndex = statusOrder.indexOf(currentStatus);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = statusOrder.indexOf(step.status) <= currentIndex;
          const isCurrent = step.status === currentStatus;

          return (
            <div key={step.status} className="flex-1 flex items-center">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 mb-2 transition-colors',
                    isCompleted
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-background border-muted-foreground/30 text-muted-foreground'
                  )}
                >
                  {isCompleted ? <Check className="w-5 h-5" /> : step.icon}
                </div>
                <div className="text-center">
                  <p className={cn(
                    'text-sm font-medium',
                    isCompleted ? 'text-foreground' : 'text-muted-foreground'
                  )}>
                    {step.label}
                  </p>
                  {step.date ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(step.date, 'MMM d, yyyy')}
                      <br />
                      {format(step.date, 'h:mm a')}
                    </p>
                  ) : step.status === 'delivered' && estimatedDelivery && !deliveredAt ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      Est: {format(estimatedDelivery, 'MMM d, yyyy')}
                    </p>
                  ) : null}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-2 transition-colors',
                    isCompleted && !isCurrent ? 'bg-primary' : 'bg-muted-foreground/30'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
