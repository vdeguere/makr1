import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Flame, Target, TrendingUp, Calendar } from 'lucide-react';
import { format, subDays, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';

interface AdherenceDashboardProps {
  patientId: string;
}

export function AdherenceDashboard({ patientId }: AdherenceDashboardProps) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  
  // Fetch streaks data
  const { data: streaks, isLoading: streaksLoading } = useQuery({
    queryKey: ['adherence-streaks', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('adherence_streaks')
        .select('*')
        .eq('patient_id', patientId);

      if (error) throw error;
      return data;
    },
  });

  // Fetch check-ins for the last 30 days
  const { data: checkIns, isLoading: checkInsLoading } = useQuery({
    queryKey: ['check-ins-history', patientId],
    queryFn: async () => {
      const thirtyDaysAgo = format(subDays(today, 30), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('patient_check_ins')
        .select('*')
        .eq('patient_id', patientId)
        .gte('check_in_date', thirtyDaysAgo)
        .order('check_in_date', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (streaksLoading || checkInsLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Calculate aggregate statistics
  const totalCheckIns = streaks?.reduce((sum, s) => sum + s.total_check_ins, 0) || 0;
  const totalMissed = streaks?.reduce((sum, s) => sum + s.total_missed, 0) || 0;
  const overallAdherenceRate = totalCheckIns + totalMissed > 0
    ? Math.round((totalCheckIns / (totalCheckIns + totalMissed)) * 100)
    : 0;
  const currentStreak = streaks?.[0]?.current_streak || 0;
  const longestStreak = Math.max(...(streaks?.map(s => s.longest_streak) || [0]));

  // Get this week's check-ins
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const weekCheckIns = checkIns?.filter(ci => {
    const checkInDate = new Date(ci.check_in_date);
    return checkInDate >= weekStart && checkInDate <= weekEnd;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentStreak} days</div>
            <p className="text-xs text-muted-foreground">
              Keep it up!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Adherence Rate</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallAdherenceRate}%</div>
            <p className="text-xs text-muted-foreground">
              Overall consistency
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCheckIns}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Longest Streak</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{longestStreak} days</div>
            <p className="text-xs text-muted-foreground">
              Personal best
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>This Week</CardTitle>
          <CardDescription>Your check-in activity for the current week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const hasCheckIn = weekCheckIns.some(
                ci => format(new Date(ci.check_in_date), 'yyyy-MM-dd') === dayStr
              );
              const isFuture = day > today;

              return (
                <div key={dayStr} className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">
                    {format(day, 'EEE')}
                  </div>
                  <div
                    className={`h-12 rounded-md border-2 flex items-center justify-center ${
                      isFuture
                        ? 'bg-muted/30 border-muted'
                        : hasCheckIn
                        ? 'bg-primary/20 border-primary'
                        : 'bg-destructive/10 border-destructive/30'
                    }`}
                  >
                    {!isFuture && hasCheckIn && (
                      <Flame className="h-5 w-5 text-orange-500" />
                    )}
                  </div>
                  <div className="text-xs mt-1">{format(day, 'd')}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
