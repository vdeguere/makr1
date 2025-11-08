import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Pencil, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Category {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
}

interface CategoryManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CategoryManagementDialog({ open, onOpenChange }: CategoryManagementDialogProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchCategories();
    }
  }, [open]);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .order('name');

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load categories',
      });
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (editingId) {
      const { error } = await supabase
        .from('product_categories')
        .update(formData)
        .eq('id', editingId);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to update category',
        });
      } else {
        toast({ title: 'Category updated successfully' });
        setFormData({ name: '', description: '' });
        setEditingId(null);
        fetchCategories();
      }
    } else {
      const { error } = await supabase
        .from('product_categories')
        .insert([formData]);

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to create category',
        });
      } else {
        toast({ title: 'Category created successfully' });
        setFormData({ name: '', description: '' });
        fetchCategories();
      }
    }
    setLoading(false);
  };

  const handleEdit = (category: Category) => {
    setFormData({ 
      name: category.name, 
      description: category.description || '' 
    });
    setEditingId(category.id);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    setLoading(true);
    const { error } = await supabase
      .from('product_categories')
      .delete()
      .eq('id', deleteId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete category. It may be in use by products.',
      });
    } else {
      toast({ title: 'Category deleted successfully' });
      fetchCategories();
    }
    setLoading(false);
    setDeleteId(null);
  };

  const handleCancel = () => {
    setFormData({ name: '', description: '' });
    setEditingId(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Product Categories</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Traditional Thai Herbs"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this category"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Plus className="mr-2 h-4 w-4" />
                {editingId ? 'Update Category' : 'Add Category'}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </form>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                      No categories yet. Create your first one above.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {category.description || '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(category)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(category.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? Products in this category will not be deleted but will no longer have a category assigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
