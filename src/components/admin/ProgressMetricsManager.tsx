import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil, Trash2, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { logger } from '@/lib/logger';

interface ProgressMetric {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

function SortableMetricItem({ metric, onEdit, onDelete }: { metric: ProgressMetric; onEdit: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: metric.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 border rounded-lg bg-card">
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{metric.name}</span>
          {!metric.is_active && <Badge variant="secondary">Inactive</Badge>}
        </div>
        {metric.description && (
          <p className="text-sm text-muted-foreground">{metric.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function ProgressMetricsManager() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<ProgressMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMetric, setEditingMetric] = useState<ProgressMetric | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('progress_metrics')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setMetrics(data || []);
    } catch (error) {
      logger.error('Error fetching metrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load progress metrics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (metric?: ProgressMetric) => {
    if (metric) {
      setEditingMetric(metric);
      setFormData({
        name: metric.name,
        description: metric.description || '',
        is_active: metric.is_active,
      });
    } else {
      setEditingMetric(null);
      setFormData({
        name: '',
        description: '',
        is_active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Metric name is required',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      if (editingMetric) {
        // Update existing
        const { error } = await supabase
          .from('progress_metrics')
          .update({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            is_active: formData.is_active,
          })
          .eq('id', editingMetric.id);

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Metric updated successfully',
        });
      } else {
        // Create new - get max display_order
        const maxOrder = metrics.length > 0 ? Math.max(...metrics.map(m => m.display_order)) : -1;
        
        const { error } = await supabase
          .from('progress_metrics')
          .insert({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            is_active: formData.is_active,
            display_order: maxOrder + 1,
          });

        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Metric created successfully',
        });
      }

      setDialogOpen(false);
      fetchMetrics();
    } catch (error) {
      logger.error('Error saving metric:', error);
      toast({
        title: 'Error',
        description: 'Failed to save metric',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (metric: ProgressMetric) => {
    if (!confirm(`Are you sure you want to delete "${metric.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('progress_metrics')
        .delete()
        .eq('id', metric.id);

      if (error) throw error;
      toast({
        title: 'Success',
        description: 'Metric deleted successfully',
      });
      fetchMetrics();
    } catch (error) {
      logger.error('Error deleting metric:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete metric',
        variant: 'destructive',
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = metrics.findIndex(m => m.id === active.id);
    const newIndex = metrics.findIndex(m => m.id === over.id);

    const newMetrics = arrayMove(metrics, oldIndex, newIndex);
    setMetrics(newMetrics);

    // Update display_order in database
    try {
      const updates = newMetrics.map((metric, index) => ({
        id: metric.id,
        display_order: index,
      }));

      for (const update of updates) {
        await supabase
          .from('progress_metrics')
          .update({ display_order: update.display_order })
          .eq('id', update.id);
      }
    } catch (error) {
      logger.error('Error updating order:', error);
      toast({
        title: 'Error',
        description: 'Failed to update metric order',
        variant: 'destructive',
      });
      fetchMetrics(); // Revert on error
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Progress Metrics</CardTitle>
              <CardDescription>
                Configure custom metrics for tracking student progress (e.g., "Color Theory", "Precision", "Safety")
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Metric
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {metrics.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No metrics configured yet.</p>
              <p className="text-sm mt-2">Click "Add Metric" to create your first progress metric.</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={metrics.map(m => m.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {metrics.map(metric => (
                    <SortableMetricItem
                      key={metric.id}
                      metric={metric}
                      onEdit={() => handleOpenDialog(metric)}
                      onDelete={() => handleDelete(metric)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingMetric ? 'Edit Metric' : 'Create New Metric'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Metric Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Color Theory, Precision, Safety"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description of what this metric measures"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
              <Label htmlFor="is_active" className="cursor-pointer">
                Active (visible to instructors and students)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

