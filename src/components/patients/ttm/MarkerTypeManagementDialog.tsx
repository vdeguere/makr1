import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IconPicker, iconMap } from "@/components/ui/icon-picker";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkerType {
  id: string;
  name: string;
  icon_name: string;
  color: string;
  description: string | null;
  is_system_default: boolean;
}

interface MarkerTypeManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTypesUpdated: () => void;
}

const colorOptions = [
  { value: 'text-red-500', label: 'Red' },
  { value: 'text-blue-500', label: 'Blue' },
  { value: 'text-purple-500', label: 'Purple' },
  { value: 'text-orange-500', label: 'Orange' },
  { value: 'text-yellow-500', label: 'Yellow' },
  { value: 'text-green-500', label: 'Green' },
  { value: 'text-pink-500', label: 'Pink' },
  { value: 'text-indigo-500', label: 'Indigo' },
  { value: 'text-teal-500', label: 'Teal' },
];

export function MarkerTypeManagementDialog({ open, onOpenChange, onTypesUpdated }: MarkerTypeManagementDialogProps) {
  const { toast } = useToast();
  const [markerTypes, setMarkerTypes] = useState<MarkerType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingType, setEditingType] = useState<MarkerType | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    icon_name: 'Circle',
    color: 'text-red-500',
    description: '',
  });

  useEffect(() => {
    if (open) {
      fetchMarkerTypes();
    }
  }, [open]);

  const fetchMarkerTypes = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('body_marker_types')
      .select('*')
      .order('is_system_default', { ascending: false })
      .order('name');

    if (error) {
      toast({ title: "Error loading marker types", variant: "destructive" });
    } else {
      setMarkerTypes(data || []);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    if (editingType) {
      const { error } = await supabase
        .from('body_marker_types')
        .update({
          name: formData.name,
          icon_name: formData.icon_name,
          color: formData.color,
          description: formData.description || null,
        })
        .eq('id', editingType.id);

      if (error) {
        toast({ title: "Error updating marker type", variant: "destructive" });
      } else {
        toast({ title: "Marker type updated successfully" });
        resetForm();
        fetchMarkerTypes();
        onTypesUpdated();
      }
    } else {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('body_marker_types')
        .insert({
          name: formData.name,
          icon_name: formData.icon_name,
          color: formData.color,
          description: formData.description || null,
          created_by: userData.user?.id,
        });

      if (error) {
        toast({ title: "Error creating marker type", variant: "destructive" });
      } else {
        toast({ title: "Marker type created successfully" });
        resetForm();
        fetchMarkerTypes();
        onTypesUpdated();
      }
    }

    setIsLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this marker type?")) return;

    setIsLoading(true);
    const { error } = await supabase
      .from('body_marker_types')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: "Error deleting marker type", variant: "destructive" });
    } else {
      toast({ title: "Marker type deleted successfully" });
      fetchMarkerTypes();
      onTypesUpdated();
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      icon_name: 'Circle',
      color: 'text-red-500',
      description: '',
    });
    setEditingType(null);
    setShowForm(false);
  };

  const startEdit = (type: MarkerType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      icon_name: type.icon_name,
      color: type.color,
      description: type.description || '',
    });
    setShowForm(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Marker Types</DialogTitle>
        </DialogHeader>

        {!showForm ? (
          <div className="space-y-4">
            <Button onClick={() => setShowForm(true)} className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add New Marker Type
            </Button>

            <div className="space-y-2">
              {markerTypes.map((type) => {
                const Icon = iconMap[type.icon_name as keyof typeof iconMap] || iconMap.Circle;
                return (
                  <div key={type.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className={cn("h-8 w-8 flex items-center justify-center", type.color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{type.name}</div>
                      {type.description && (
                        <div className="text-sm text-muted-foreground">{type.description}</div>
                      )}
                      {type.is_system_default && (
                        <div className="text-xs text-muted-foreground">System Default</div>
                      )}
                    </div>
                    {!type.is_system_default && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => startEdit(type)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(type.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Aching"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Icon *</Label>
              <IconPicker
                value={formData.icon_name}
                onChange={(icon) => setFormData({ ...formData, icon_name: icon })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color *</Label>
              <Select value={formData.color} onValueChange={(color) => setFormData({ ...formData, color })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div className={cn("h-4 w-4 rounded-full", option.value)}>●</div>
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description / Additional Info</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe when to use this marker type..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {editingType ? 'Update' : 'Create'} Marker Type
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
