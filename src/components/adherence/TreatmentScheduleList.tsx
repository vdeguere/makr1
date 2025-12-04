import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, Pill } from 'lucide-react';
import { format } from 'date-fns';

interface TreatmentScheduleListProps {
  patientId: string;
}

export function TreatmentScheduleList({ patientId }: TreatmentScheduleListProps) {
  const { data: schedules, isLoading } = useQuery({
    queryKey: ['all-treatment-schedules', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('treatment_schedules')
        .select(`
          *,
          herbs(name),
          recommendations(title)
        `)
        .eq('patient_id', patientId)
        .order('is_active', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Treatment Schedules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Treatment Schedules</CardTitle>
        <CardDescription>
          All your treatment schedules
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!schedules || schedules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Pill className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No treatment schedules yet</p>
          </div>
        ) : (
          schedules.map((schedule) => (
            <div
              key={schedule.id}
              className="p-4 border rounded-lg space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium">{schedule.medication_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {schedule.dosage}
                  </div>
                </div>
                <Badge variant={schedule.is_active ? 'default' : 'secondary'}>
                  {schedule.is_active ? 'Active' : 'Completed'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(new Date(schedule.start_date), 'MMM d, yyyy')}
                    {schedule.end_date && ` - ${format(new Date(schedule.end_date), 'MMM d, yyyy')}`}
                  </span>
                </div>
                {schedule.times_of_day && schedule.times_of_day.length > 0 && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{schedule.times_of_day.join(', ')}</span>
                  </div>
                )}
              </div>

              {schedule.instructions && (
                <div className="text-sm text-muted-foreground pt-2 border-t">
                  {schedule.instructions}
                </div>
              )}

              {schedule.take_with_food && (
                <Badge variant="outline" className="text-xs">
                  Take with food
                </Badge>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
