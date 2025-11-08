import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Flame, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

interface DailyCheckInCardProps {
  patientId: string;
}

export function DailyCheckInCard({ patientId }: DailyCheckInCardProps) {
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  // Fetch active schedules for today
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['treatment-schedules', patientId, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('treatment_schedules')
        .select('*, herbs(name)')
        .eq('patient_id', patientId)
        .eq('is_active', true)
        .lte('start_date', today)
        .or(`end_date.is.null,end_date.gte.${today}`)
        .order('created_at');

      if (error) throw error;
      return data;
    },
  });

  // Fetch today's check-ins
  const { data: checkIns } = useQuery({
    queryKey: ['check-ins', patientId, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_check_ins')
        .select('*')
        .eq('patient_id', patientId)
        .eq('check_in_date', today);

      if (error) throw error;
      return data;
    },
  });

  // Fetch current streak
  const { data: streaks } = useQuery({
    queryKey: ['adherence-streaks', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('adherence_streaks')
        .select('*')
        .eq('patient_id', patientId)
        .order('current_streak', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const checkInMutation = useMutation({
    mutationFn: async ({ scheduleId, status }: { scheduleId: string; status: string }) => {
      const { data, error } = await supabase
        .from('patient_check_ins')
        .insert({
          patient_id: patientId,
          treatment_schedule_id: scheduleId,
          check_in_date: today,
          status,
          taken_at_time: format(new Date(), 'HH:mm'),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['check-ins', patientId] });
      queryClient.invalidateQueries({ queryKey: ['adherence-streaks', patientId] });
      toast.success('Check-in recorded successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to record check-in');
    },
  });

  const handleCheckIn = (scheduleId: string) => {
    checkInMutation.mutate({ scheduleId, status: 'taken' });
  };

  const isCheckedIn = (scheduleId: string) => {
    return checkIns?.some(ci => ci.treatment_schedule_id === scheduleId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentStreak = streaks?.current_streak || 0;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Daily Check-in
              {currentStreak > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <Flame className="h-3 w-3 text-orange-500" />
                  {currentStreak} day streak
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Mark your medications as taken today</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!schedules || schedules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No active treatment schedules</p>
          </div>
        ) : (
          schedules.map((schedule) => {
            const checkedIn = isCheckedIn(schedule.id);
            return (
              <div
                key={schedule.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-card"
              >
                <div className="flex-1">
                  <div className="font-medium">{schedule.medication_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {schedule.dosage} • {schedule.frequency.replace('_', ' ')}
                  </div>
                  {schedule.times_of_day && schedule.times_of_day.length > 0 && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {schedule.times_of_day.join(', ')}
                    </div>
                  )}
                </div>
                <div>
                  {checkedIn ? (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Done
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleCheckIn(schedule.id)}
                      disabled={checkInMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Mark Taken
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
