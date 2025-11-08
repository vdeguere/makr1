import { Order } from '@/pages/Orders';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, DollarSign, TrendingUp, Clock } from 'lucide-react';

interface OrderStatsProps {
  orders: Order[];
  activeRole: string;
}

export function OrderStats({ orders, activeRole }: OrderStatsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'THB',
    }).format(amount);
  };

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
  
  const totalRevenue = orders
    .filter(o => o.payment_status === 'paid')
    .reduce((sum, o) => sum + o.total_amount, 0);

  const totalCommission = activeRole === 'practitioner'
    ? orders.reduce((sum, o) => {
        const commission = o.sales_analytics?.commission_amount || 0;
        return sum + commission;
      }, 0)
    : 0;

  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const stats = [
    {
      title: 'Total Orders',
      value: totalOrders.toString(),
      icon: Package,
      description: `${pendingOrders} pending`,
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      description: 'Paid orders',
    },
    {
      title: 'Average Order',
      value: formatCurrency(averageOrderValue),
      icon: TrendingUp,
      description: 'Per order',
    },
  ];

  if (activeRole === 'practitioner') {
    stats.push({
      title: 'Commission Earned',
      value: formatCurrency(totalCommission),
      icon: DollarSign,
      description: 'Total earned',
    });
  } else {
    stats.push({
      title: 'Pending Orders',
      value: pendingOrders.toString(),
      icon: Clock,
      description: 'Needs attention',
    });
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
