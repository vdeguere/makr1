import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { ProgressSpiderChart } from '@/components/students/ProgressSpiderChart';
import { Badge } from '@/components/ui/badge';
import { logger } from '@/lib/logger';

interface ProgressMetric {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

interface StudentScore {
  metric_id: string;
  score: number;
  notes: string;
}

interface StudentProgressScorerProps {
  studentId: string;
  studentName: string;
}

export function StudentProgressScorer({ studentId, studentName }: StudentProgressScorerProps) {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<ProgressMetric[]>([]);
  const [scores, setScores] = useState<Record<string, StudentScore>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [studentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch active metrics
      const { data: metricsData, error: metricsError } = await supabase
        .from('progress_metrics')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (metricsError) throw metricsError;
      setMetrics(metricsData || []);

      // Fetch existing scores
      const { data: scoresData, error: scoresError } = await supabase
        .from('student_progress_scores')
        .select('metric_id, score, notes')
        .eq('student_id', studentId);

      if (scoresError) throw scoresError;

      const scoresMap: Record<string, StudentScore> = {};
      (scoresData || []).forEach((score: any) => {
        scoresMap[score.metric_id] = {
          metric_id: score.metric_id,
          score: score.score,
          notes: score.notes || '',
        };
      });
      setScores(scoresMap);
    } catch (error) {
      logger.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load progress data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (metricId: string, value: number[]) => {
    setScores(prev => ({
      ...prev,
      [metricId]: {
        metric_id: metricId,
        score: value[0],
        notes: prev[metricId]?.notes || '',
      },
    }));
  };

  const handleNotesChange = (metricId: string, notes: string) => {
    setScores(prev => ({
      ...prev,
      [metricId]: {
        ...prev[metricId],
        metric_id: metricId,
        score: prev[metricId]?.score || 3,
        notes,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upsert all scores
      const scoreEntries = Object.values(scores);
      const upserts = scoreEntries.map(score => ({
        student_id: studentId,
        metric_id: score.metric_id,
        score: score.score,
        notes: score.notes || null,
        scored_by: user.id,
      }));

      if (upserts.length > 0) {
        // Delete existing scores for this student
        await supabase
          .from('student_progress_scores')
          .delete()
          .eq('student_id', studentId);

        // Insert new scores
        const { error } = await supabase
          .from('student_progress_scores')
          .insert(upserts);

        if (error) throw error;
      }

      toast({
        title: 'Success',
        description: 'Progress scores saved successfully',
      });
    } catch (error) {
      logger.error('Error saving scores:', error);
      toast({
        title: 'Error',
        description: 'Failed to save progress scores',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const chartData = metrics.map(metric => ({
    name: metric.name,
    value: scores[metric.id]?.score || 0,
  }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Score Progress: {studentName}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Spider Chart Visualization */}
          <div className="mb-6">
            <ProgressSpiderChart data={chartData} />
          </div>

          {/* Scoring Interface */}
          <div className="space-y-6">
            {metrics.map(metric => {
              const currentScore = scores[metric.id]?.score || 0;
              const currentNotes = scores[metric.id]?.notes || '';

              return (
                <div key={metric.id} className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-semibold">{metric.name}</Label>
                      {metric.description && (
                        <p className="text-sm text-muted-foreground">{metric.description}</p>
                      )}
                    </div>
                    <Badge variant="outline" className="text-lg font-semibold">
                      {currentScore}/5
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground w-12">1</span>
                      <Slider
                        value={[currentScore]}
                        onValueChange={(value) => handleScoreChange(metric.id, value)}
                        min={1}
                        max={5}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-sm text-muted-foreground w-12 text-right">5</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Needs Improvement</span>
                      <span>Excellent</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`notes-${metric.id}`}>Notes (Optional)</Label>
                    <Textarea
                      id={`notes-${metric.id}`}
                      value={currentNotes}
                      onChange={(e) => handleNotesChange(metric.id, e.target.value)}
                      placeholder={`Add notes about ${studentName}'s performance in ${metric.name}...`}
                      rows={2}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {metrics.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No progress metrics configured yet.</p>
              <p className="text-sm mt-2">Contact an administrator to set up progress metrics.</p>
            </div>
          )}

          {metrics.length > 0 && (
            <div className="mt-6 flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Scores
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

