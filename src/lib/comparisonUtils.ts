import { subDays, subWeeks, subMonths, subYears, startOfWeek, startOfMonth, startOfYear, endOfWeek, endOfMonth, endOfYear } from 'date-fns';

export type ComparisonPeriod = 'none' | 'previous' | 'week' | 'month' | 'year';

export interface DateRangeComparison {
  current: {
    from: Date;
    to: Date;
  };
  previous: {
    from: Date;
    to: Date;
  };
}

export interface MetricComparison {
  current: number;
  previous: number;
  change: number;
  percentageChange: number;
  isPositive: boolean;
}

/**
 * Calculate the previous period date range based on comparison type
 */
export const getPreviousPeriod = (
  currentFrom: Date,
  currentTo: Date,
  comparisonType: ComparisonPeriod
): DateRangeComparison => {
  const daysDiff = Math.ceil((currentTo.getTime() - currentFrom.getTime()) / (1000 * 60 * 60 * 24));

  switch (comparisonType) {
    case 'previous':
      // Compare to the previous period of the same length
      return {
        current: { from: currentFrom, to: currentTo },
        previous: {
          from: subDays(currentFrom, daysDiff + 1),
          to: subDays(currentTo, daysDiff + 1),
        },
      };

    case 'week':
      // Compare to same week last week
      return {
        current: { from: currentFrom, to: currentTo },
        previous: {
          from: subWeeks(currentFrom, 1),
          to: subWeeks(currentTo, 1),
        },
      };

    case 'month':
      // Compare to same period last month
      return {
        current: { from: currentFrom, to: currentTo },
        previous: {
          from: subMonths(currentFrom, 1),
          to: subMonths(currentTo, 1),
        },
      };

    case 'year':
      // Compare to same period last year
      return {
        current: { from: currentFrom, to: currentTo },
        previous: {
          from: subYears(currentFrom, 1),
          to: subYears(currentTo, 1),
        },
      };

    default:
      return {
        current: { from: currentFrom, to: currentTo },
        previous: { from: currentFrom, to: currentTo },
      };
  }
};

/**
 * Calculate metric comparison with percentage change
 */
export const calculateMetricComparison = (
  currentValue: number,
  previousValue: number
): MetricComparison => {
  const change = currentValue - previousValue;
  const percentageChange = previousValue !== 0 
    ? ((change / previousValue) * 100)
    : currentValue > 0 ? 100 : 0;

  return {
    current: currentValue,
    previous: previousValue,
    change,
    percentageChange,
    isPositive: change >= 0,
  };
};

/**
 * Format comparison text for display
 */
export const formatComparisonText = (
  comparisonType: ComparisonPeriod,
  includeVs: boolean = true
): string => {
  const vs = includeVs ? 'vs ' : '';
  
  switch (comparisonType) {
    case 'previous':
      return `${vs}previous period`;
    case 'week':
      return `${vs}last week`;
    case 'month':
      return `${vs}last month`;
    case 'year':
      return `${vs}last year`;
    default:
      return '';
  }
};

/**
 * Format percentage change for display
 */
export const formatPercentageChange = (percentageChange: number): string => {
  const abs = Math.abs(percentageChange);
  const sign = percentageChange >= 0 ? '+' : '-';
  
  if (abs >= 1000) {
    return `${sign}${(abs / 1000).toFixed(1)}k%`;
  }
  
  return `${sign}${abs.toFixed(1)}%`;
};

/**
 * Get comparison period presets
 */
export const getComparisonPresets = () => [
  { label: 'No Comparison', value: 'none' as ComparisonPeriod },
  { label: 'Previous Period', value: 'previous' as ComparisonPeriod },
  { label: 'Week over Week', value: 'week' as ComparisonPeriod },
  { label: 'Month over Month', value: 'month' as ComparisonPeriod },
  { label: 'Year over Year', value: 'year' as ComparisonPeriod },
];

/**
 * Calculate rate of change (velocity)
 */
export const calculateRateOfChange = (
  currentValue: number,
  previousValue: number,
  days: number
): number => {
  const change = currentValue - previousValue;
  return change / days;
};

/**
 * Determine if metric trend is favorable based on metric type
 */
export const isTrendFavorable = (
  change: number,
  metricType: 'revenue' | 'cost' | 'neutral'
): boolean => {
  if (metricType === 'revenue') {
    return change >= 0; // Positive change is good for revenue
  } else if (metricType === 'cost') {
    return change <= 0; // Negative change is good for costs
  }
  return true; // Neutral metrics don't have a favorable direction
};
