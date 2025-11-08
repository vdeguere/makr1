import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPercentageChange } from '@/lib/comparisonUtils';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  comparison?: {
    previousValue: string | number;
    percentageChange: number;
    isPositive: boolean;
    label: string;
  };
}

export function MetricCard({ title, value, icon: Icon, trend, description, comparison }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        
        {/* Comparison Badge */}
        {comparison && (
          <div className="flex flex-col gap-1 mt-2">
            <div className="flex items-center gap-2">
              <Badge 
                variant={comparison.isPositive ? 'default' : 'destructive'}
                className={cn(
                  'flex items-center gap-1',
                  comparison.isPositive 
                    ? 'bg-green-100 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-red-100 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400'
                )}
              >
                {comparison.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {formatPercentageChange(comparison.percentageChange)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {comparison.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Previous: {comparison.previousValue}
            </p>
          </div>
        )}
        
        {/* Legacy trend support */}
        {trend && !comparison && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
            {trend.isPositive ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={trend.isPositive ? 'text-green-500' : 'text-red-500'}>
              {Math.abs(trend.value)}%
            </span>
            <span>from last month</span>
          </div>
        )}
        
        {description && !comparison && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
