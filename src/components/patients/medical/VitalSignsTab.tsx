import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Plus, Activity, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

interface VitalSign {
  id: string;
  recorded_at: string;
  blood_pressure_systolic: number | null;
  blood_pressure_diastolic: number | null;
  heart_rate: number | null;
  temperature: number | null;
  weight: number | null;
  height: number | null;
  respiratory_rate: number | null;
  oxygen_saturation: number | null;
  notes: string | null;
}

interface VitalSignsTabProps {
  patientId: string;
}

export function VitalSignsTab({ patientId }: VitalSignsTabProps) {
  const [vitals, setVitals] = useState<VitalSign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    recorded_at: new Date().toISOString().split('T')[0],
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    heart_rate: '',
    temperature: '',
    weight: '',
    height: '',
    respiratory_rate: '',
    oxygen_saturation: '',
    notes: '',
  });

  useEffect(() => {
    fetchVitals();
  }, [patientId]);

  const fetchVitals = async () => {
    try {
      const { data, error } = await supabase
        .from('patient_vital_signs')
        .select('*')
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: false });

      if (error) throw error;
      setVitals(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('patient_vital_signs')
        .insert({
          patient_id: patientId,
          recorded_by: user.id,
          recorded_at: new Date(formData.recorded_at).toISOString(),
          blood_pressure_systolic: formData.blood_pressure_systolic ? parseInt(formData.blood_pressure_systolic) : null,
          blood_pressure_diastolic: formData.blood_pressure_diastolic ? parseInt(formData.blood_pressure_diastolic) : null,
          heart_rate: formData.heart_rate ? parseInt(formData.heart_rate) : null,
          temperature: formData.temperature ? parseFloat(formData.temperature) : null,
          weight: formData.weight ? parseFloat(formData.weight) : null,
          height: formData.height ? parseFloat(formData.height) : null,
          respiratory_rate: formData.respiratory_rate ? parseInt(formData.respiratory_rate) : null,
          oxygen_saturation: formData.oxygen_saturation ? parseInt(formData.oxygen_saturation) : null,
          notes: formData.notes || null,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Vital signs recorded successfully',
      });

      setIsDialogOpen(false);
      setFormData({
        recorded_at: new Date().toISOString().split('T')[0],
        blood_pressure_systolic: '',
        blood_pressure_diastolic: '',
        heart_rate: '',
        temperature: '',
        weight: '',
        height: '',
        respiratory_rate: '',
        oxygen_saturation: '',
        notes: '',
      });
      fetchVitals();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && vitals.length === 0) {
    return <div className="text-center py-8">Loading vital signs...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Vital Signs History</h3>
        <Button onClick={() => setIsDialogOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Record Vitals
        </Button>
      </div>

      {vitals.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No vital signs recorded yet</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {vitals.map((vital) => (
            <Card key={vital.id} className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {format(new Date(vital.recorded_at), 'PPP p')}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {vital.blood_pressure_systolic && vital.blood_pressure_diastolic && (
                  <div>
                    <span className="text-sm text-muted-foreground">Blood Pressure</span>
                    <p className="font-medium">{vital.blood_pressure_systolic}/{vital.blood_pressure_diastolic} mmHg</p>
                  </div>
                )}
                {vital.heart_rate && (
                  <div>
                    <span className="text-sm text-muted-foreground">Heart Rate</span>
                    <p className="font-medium">{vital.heart_rate} bpm</p>
                  </div>
                )}
                {vital.temperature && (
                  <div>
                    <span className="text-sm text-muted-foreground">Temperature</span>
                    <p className="font-medium">{vital.temperature}°C</p>
                  </div>
                )}
                {vital.weight && (
                  <div>
                    <span className="text-sm text-muted-foreground">Weight</span>
                    <p className="font-medium">{vital.weight} kg</p>
                  </div>
                )}
                {vital.height && (
                  <div>
                    <span className="text-sm text-muted-foreground">Height</span>
                    <p className="font-medium">{vital.height} cm</p>
                  </div>
                )}
                {vital.respiratory_rate && (
                  <div>
                    <span className="text-sm text-muted-foreground">Respiratory Rate</span>
                    <p className="font-medium">{vital.respiratory_rate} /min</p>
                  </div>
                )}
                {vital.oxygen_saturation && (
                  <div>
                    <span className="text-sm text-muted-foreground">O2 Saturation</span>
                    <p className="font-medium">{vital.oxygen_saturation}%</p>
                  </div>
                )}
              </div>

              {vital.notes && (
                <div className="mt-3 pt-3 border-t">
                  <span className="text-sm font-medium">Notes:</span>
                  <p className="text-sm text-muted-foreground mt-1">{vital.notes}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Vital Signs</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recorded_at">Date & Time</Label>
              <Input
                id="recorded_at"
                type="date"
                value={formData.recorded_at}
                onChange={(e) => setFormData({ ...formData, recorded_at: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bp_systolic">Blood Pressure (Systolic)</Label>
                <Input
                  id="bp_systolic"
                  type="number"
                  value={formData.blood_pressure_systolic}
                  onChange={(e) => setFormData({ ...formData, blood_pressure_systolic: e.target.value })}
                  placeholder="120 mmHg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bp_diastolic">Blood Pressure (Diastolic)</Label>
                <Input
                  id="bp_diastolic"
                  type="number"
                  value={formData.blood_pressure_diastolic}
                  onChange={(e) => setFormData({ ...formData, blood_pressure_diastolic: e.target.value })}
                  placeholder="80 mmHg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="heart_rate">Heart Rate (bpm)</Label>
                <Input
                  id="heart_rate"
                  type="number"
                  value={formData.heart_rate}
                  onChange={(e) => setFormData({ ...formData, heart_rate: e.target.value })}
                  placeholder="72"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (°C)</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                  placeholder="36.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="70.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  placeholder="170"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="respiratory_rate">Respiratory Rate (/min)</Label>
                <Input
                  id="respiratory_rate"
                  type="number"
                  value={formData.respiratory_rate}
                  onChange={(e) => setFormData({ ...formData, respiratory_rate: e.target.value })}
                  placeholder="16"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="oxygen_saturation">O2 Saturation (%)</Label>
                <Input
                  id="oxygen_saturation"
                  type="number"
                  value={formData.oxygen_saturation}
                  onChange={(e) => setFormData({ ...formData, oxygen_saturation: e.target.value })}
                  placeholder="98"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional observations"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Vitals'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
