import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Radio, TrendingUp, Users } from 'lucide-react';

interface MeetingStatsProps {
  meetings: Array<{
    id: string;
    scheduled_start_time: string;
    is_live_now: boolean;
  }>;
}

export function MeetingStats({ meetings }: MeetingStatsProps) {
  const now = new Date();
  const totalMeetings = meetings.length;
  const upcomingMeetings = meetings.filter(m => new Date(m.scheduled_start_time) > now).length;
  const liveMeetings = meetings.filter(m => m.is_live_now).length;
  const stats = [
    {
      title: 'Total Meetings',
      value: totalMeetings,
      icon: Calendar,
      description: 'All time',
    },
    {
      title: 'Upcoming',
      value: upcomingMeetings,
      icon: TrendingUp,
      description: 'Scheduled',
    },
    {
      title: 'Live Now',
      value: liveMeetings,
      icon: Radio,
      description: 'Active',
      highlight: liveMeetings > 0,
    },
  ];

  return (
    <div className="grid gap-fluid-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className={stat.highlight ? 'border-destructive' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.highlight ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.highlight ? 'text-destructive' : ''}`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
