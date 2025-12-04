import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts';

interface ProgressSpiderChartProps {
  data: Array<{ name: string; value: number }>;
  showLegend?: boolean;
}

export function ProgressSpiderChart({ data, showLegend = true }: ProgressSpiderChartProps) {
  // Ensure we have data
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p>No progress data available</p>
      </div>
    );
  }

  // Recharts expects data in a specific format
  const chartData = data.map(item => ({
    metric: item.name,
    score: item.value,
    fullMark: 5,
  }));

  return (
    <div className="w-full h-96">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            className="text-xs"
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 5]}
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            tickCount={6}
          />
          <Radar
            name="Progress"
            dataKey="score"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.6}
            strokeWidth={2}
          />
          {showLegend && <Legend />}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

