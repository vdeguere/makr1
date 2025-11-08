export const THAI_COURIERS = [
  'Kerry Express',
  'Flash Express',
  'Thailand Post',
  'J&T Express',
  'Ninja Van',
  'Best Express',
  'DHL eCommerce',
  'SCG Express',
  'Lalamove',
  'Custom/Other',
] as const;

export type CourierName = typeof THAI_COURIERS[number];

export const TRACKING_URL_TEMPLATES: Record<string, string> = {
  'Kerry Express': 'https://th.kerryexpress.com/en/track/?track={tracking}',
  'Flash Express': 'https://flashexpress.com/tracking/?se={tracking}',
  'Thailand Post': 'https://track.thailandpost.co.th/?trackNumber={tracking}',
  'J&T Express': 'https://www.jtexpress.co.th/service/track?billcode={tracking}',
  'Ninja Van': 'https://www.ninjavan.co/th-th/tracking?id={tracking}',
  'Best Express': 'https://www.best-inc.co.th/track?waybill_no={tracking}',
  'DHL eCommerce': 'https://www.dhl.com/th-en/home/tracking/tracking-ecommerce.html?tracking-id={tracking}',
  'SCG Express': 'https://www.scgexpress.co.th/tracking/{tracking}',
  'Lalamove': 'https://www.lalamove.com/th/track/{tracking}',
};

export const generateTrackingUrl = (courierName: string, trackingNumber: string): string => {
  const template = TRACKING_URL_TEMPLATES[courierName];
  if (!template) return '';
  return template.replace('{tracking}', trackingNumber);
};

export const getStatusDisplayName = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'Order Received',
    'processing': 'Processing',
    'shipped': 'Shipped',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled',
  };
  return statusMap[status] || status;
};

export const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'delivered':
      return 'default';
    case 'shipped':
      return 'secondary';
    case 'processing':
      return 'outline';
    case 'cancelled':
      return 'destructive';
    case 'pending':
      return 'outline';
    default:
      return 'outline';
  }
};

export const getCourierColor = (courierName: string): string => {
  const courierColors: Record<string, string> = {
    'Kerry Express': 'bg-green-600 hover:bg-green-700',
    'Flash Express': 'bg-orange-500 hover:bg-orange-600',
    'Thailand Post': 'bg-red-600 hover:bg-red-700',
    'J&T Express': 'bg-red-500 hover:bg-red-600',
    'Ninja Van': 'bg-purple-600 hover:bg-purple-700',
    'Best Express': 'bg-blue-600 hover:bg-blue-700',
    'DHL eCommerce': 'bg-yellow-500 hover:bg-yellow-600 text-black',
    'SCG Express': 'bg-teal-600 hover:bg-teal-700',
    'Lalamove': 'bg-orange-600 hover:bg-orange-700',
  };
  return courierColors[courierName] || 'bg-gray-500 hover:bg-gray-600';
};

export const estimateDeliveryDate = (courierName: string, shippedDate: Date = new Date()): Date => {
  // Typical delivery times in days
  const deliveryDays: Record<string, number> = {
    'Kerry Express': 2,
    'Flash Express': 3,
    'Thailand Post': 5,
    'J&T Express': 3,
    'Ninja Van': 3,
    'Best Express': 4,
    'DHL eCommerce': 2,
    'SCG Express': 3,
    'Lalamove': 1,
    'Custom/Other': 3,
  };
  
  const days = deliveryDays[courierName] || 3;
  const estimatedDate = new Date(shippedDate);
  estimatedDate.setDate(estimatedDate.getDate() + days);
  return estimatedDate;
};
