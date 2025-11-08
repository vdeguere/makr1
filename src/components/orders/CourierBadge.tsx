import { Badge } from '@/components/ui/badge';
import { getCourierColor } from '@/lib/orderUtils';

interface CourierBadgeProps {
  courierName: string;
  className?: string;
}

export function CourierBadge({ courierName, className }: CourierBadgeProps) {
  if (!courierName) return null;
  
  return (
    <Badge 
      className={`${getCourierColor(courierName)} text-white border-0 ${className}`}
      variant="default"
    >
      {courierName}
    </Badge>
  );
}
