import { Order } from '@/pages/Orders';

export function exportOrdersToCSV(orders: Order[], filename: string = 'orders.csv') {
  // Define CSV headers
  const headers = [
    'Order ID',
    'Patient Name',
    'Patient Email',
    'Patient Phone',
    'Order Date',
    'Status',
    'Payment Status',
    'Payment Method',
    'Total Amount',
    'Currency',
    'Tracking Number',
    'Shipping Address',
    'Shipping City',
    'Shipping Postal Code',
    'Shipping Phone',
    'Recommendation Title',
    'Commission Amount',
    'Commission Rate',
    'Notes',
  ];

  // Convert orders to CSV rows
  const rows = orders.map(order => [
    order.id,
    order.patient.full_name,
    order.patient.email || '',
    order.patient.phone || '',
    new Date(order.created_at).toLocaleString(),
    order.status,
    order.payment_status,
    order.payment_method || '',
    order.total_amount.toString(),
    order.currency,
    order.tracking_number || '',
    order.shipping_address || '',
    order.shipping_city || '',
    order.shipping_postal_code || '',
    order.shipping_phone || '',
    order.recommendation.title,
    order.sales_analytics?.commission_amount?.toString() || '',
    order.sales_analytics?.commission_rate?.toString() || '',
    order.notes || '',
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => 
      row.map(cell => {
        // Escape quotes and wrap in quotes if contains comma, newline, or quote
        const escaped = String(cell).replace(/"/g, '""');
        return /[,\n"]/.test(escaped) ? `"${escaped}"` : escaped;
      }).join(',')
    ),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
