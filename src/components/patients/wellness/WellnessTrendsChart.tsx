import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { TrendingUp } from 'lucide-react';

interface WellnessSurvey {
  id: string;
  overall_feeling: number;
  symptom_improvement: number;
  treatment_satisfaction: number;
  energy_levels: number;
  sleep_quality: number;
  notes: string | null;
  created_at: string;
  recommendation_id: string | null;
}

interface WellnessTrendsChartProps {
  surveys: WellnessSurvey[];
  startDate?: Date;
  endDate?: Date;
}

const chartConfig = {
  overall_feeling: {
    label: "Overall Feeling",
    color: "hsl(var(--chart-1))",
  },
  symptom_improvement: {
    label: "Symptoms",
    color: "hsl(var(--chart-2))",
  },
  treatment_satisfaction: {
    label: "Treatment",
    color: "hsl(var(--chart-3))",
  },
  energy_levels: {
    label: "Energy",
    color: "hsl(var(--chart-4))",
  },
  sleep_quality: {
    label: "Sleep",
    color: "hsl(var(--chart-5))",
  },
};

export function WellnessTrendsChart({ surveys, startDate, endDate }: WellnessTrendsChartProps) {
  const chartData = useMemo(() => {
    let filteredSurveys = [...surveys];
    
    // Filter by date range if provided
    if (startDate || endDate) {
      filteredSurveys = filteredSurveys.filter((survey) => {
        const surveyDate = new Date(survey.created_at);
        if (startDate && surveyDate < startDate) return false;
        if (endDate && surveyDate > endDate) return false;
        return true;
      });
    }
    
    // Sort by date ascending for proper chart display
    return filteredSurveys
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .map((survey) => ({
        date: format(new Date(survey.created_at), 'MMM dd'),
        overall_feeling: survey.overall_feeling,
        symptom_improvement: survey.symptom_improvement,
        treatment_satisfaction: survey.treatment_satisfaction,
        energy_levels: survey.energy_levels,
        sleep_quality: survey.sleep_quality,
      }));
  }, [surveys, startDate, endDate]);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            No data available for the selected date range
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Wellness Trends Over Time
        </CardTitle>
        <CardDescription>
          Track your progress across all wellness metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="date" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                domain={[0, 5]} 
                ticks={[1, 2, 3, 4, 5]}
                className="text-xs"
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              <Line
                type="monotone"
                dataKey="overall_feeling"
                stroke="var(--color-overall_feeling)"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Overall Feeling"
              />
              <Line
                type="monotone"
                dataKey="symptom_improvement"
                stroke="var(--color-symptom_improvement)"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Symptoms"
              />
              <Line
                type="monotone"
                dataKey="treatment_satisfaction"
                stroke="var(--color-treatment_satisfaction)"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Treatment"
              />
              <Line
                type="monotone"
                dataKey="energy_levels"
                stroke="var(--color-energy_levels)"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Energy"
              />
              <Line
                type="monotone"
                dataKey="sleep_quality"
                stroke="var(--color-sleep_quality)"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Sleep"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
