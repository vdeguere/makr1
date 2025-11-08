import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, TrendingUp, Activity, Plus, Calendar } from 'lucide-react';
import { WellnessCheckDialog } from './WellnessCheckDialog';
import { WellnessTrendsChart } from './WellnessTrendsChart';
import { format, subDays, subMonths } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

interface WellnessTrackerTabProps {
  patientId: string;
}

export function WellnessTrackerTab({ patientId }: WellnessTrackerTabProps) {
  const [loading, setLoading] = useState(true);
  const [surveys, setSurveys] = useState<WellnessSurvey[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

  const fetchSurveys = async () => {
    try {
      const { data, error } = await supabase
        .from('patient_wellness_surveys')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSurveys(data || []);
    } catch (error) {
      console.error('Error fetching wellness surveys:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, [patientId]);

  useEffect(() => {
    const now = new Date();
    switch (dateFilter) {
      case '7days':
        setStartDate(subDays(now, 7));
        setEndDate(now);
        break;
      case '30days':
        setStartDate(subDays(now, 30));
        setEndDate(now);
        break;
      case '3months':
        setStartDate(subMonths(now, 3));
        setEndDate(now);
        break;
      case '6months':
        setStartDate(subMonths(now, 6));
        setEndDate(now);
        break;
      case 'all':
      default:
        setStartDate(undefined);
        setEndDate(undefined);
        break;
    }
  }, [dateFilter]);

  const getScoreColor = (score: number) => {
    if (score <= 2) return 'destructive';
    if (score === 3) return 'secondary';
    return 'default';
  };

  const getScoreLabel = (score: number) => {
    const labels = ['Much Worse', 'Worse', 'Same', 'Better', 'Much Better'];
    return labels[score - 1];
  };

  const calculateAverage = (surveys: WellnessSurvey[], field: keyof WellnessSurvey) => {
    if (surveys.length === 0) return 0;
    const sum = surveys.reduce((acc, survey) => acc + (survey[field] as number), 0);
    return (sum / surveys.length).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* New Wellness Check Button */}
      <Card className="border-dashed">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <h3 className="font-semibold mb-1">Ready for a wellness check?</h3>
            <p className="text-sm text-muted-foreground">
              Track your progress with a quick 2-minute check-in
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            New Wellness Check
          </Button>
        </CardContent>
      </Card>

      <WellnessCheckDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        patientId={patientId}
        onSuccess={fetchSurveys}
      />

      {surveys.length > 0 && (
        <>
          {/* Date Filter */}
          <Card>
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Time Period:</span>
              </div>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Trends Chart */}
          <WellnessTrendsChart 
            surveys={surveys} 
            startDate={startDate}
            endDate={endDate}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Average Scores
              </CardTitle>
              <CardDescription>Overall averages across all check-ins</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {calculateAverage(surveys, 'overall_feeling')}
                </div>
                <div className="text-sm text-muted-foreground">Overall Feeling</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {calculateAverage(surveys, 'symptom_improvement')}
                </div>
                <div className="text-sm text-muted-foreground">Symptoms</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {calculateAverage(surveys, 'treatment_satisfaction')}
                </div>
                <div className="text-sm text-muted-foreground">Treatment</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {calculateAverage(surveys, 'energy_levels')}
                </div>
                <div className="text-sm text-muted-foreground">Energy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {calculateAverage(surveys, 'sleep_quality')}
                </div>
                <div className="text-sm text-muted-foreground">Sleep</div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Previous Check-Ins
            </h3>
            {surveys.map((survey) => (
              <Card key={survey.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">
                      {format(new Date(survey.created_at), 'PPP')}
                    </CardTitle>
                    <Badge variant={getScoreColor(survey.overall_feeling)}>
                      {getScoreLabel(survey.overall_feeling)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Symptoms:</span>
                      <span className="ml-2 font-medium">{survey.symptom_improvement}/5</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Treatment:</span>
                      <span className="ml-2 font-medium">{survey.treatment_satisfaction}/5</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Energy:</span>
                      <span className="ml-2 font-medium">{survey.energy_levels}/5</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sleep:</span>
                      <span className="ml-2 font-medium">{survey.sleep_quality}/5</span>
                    </div>
                  </div>
                  {survey.notes && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground italic">{survey.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {surveys.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No wellness check-ins yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start tracking your health progress today
            </p>
            <Button onClick={() => setDialogOpen(true)} variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Take Your First Wellness Check
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
