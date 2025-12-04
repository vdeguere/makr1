import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Package, ShoppingCart, Calendar } from 'lucide-react';

interface HealthOverviewProps {
  stats: {
    totalAssignments: number;
    activeAssignments: number;
    completedOrders: number;
    upcomingVisits: number;
  };
}

export function HealthOverview({ stats }: HealthOverviewProps) {
  const cards = [
    {
      title: 'Total Assignments',
      value: stats.totalAssignments,
      icon: FileText,
      description: 'All assignments received',
    },
    {
      title: 'Active Assignments',
      value: stats.activeAssignments,
      icon: Package,
      description: 'Currently active',
    },
    {
      title: 'Completed Orders',
      value: stats.completedOrders,
      icon: ShoppingCart,
      description: 'Successfully delivered',
    },
    {
      title: 'Upcoming Sessions',
      value: stats.upcomingVisits,
      icon: Calendar,
      description: 'Scheduled live sessions',
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
