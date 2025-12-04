import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Upload, Trash2, FileText, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { logger } from '@/lib/logger';

interface Resource {
  id: string;
  lesson_id: string;
  resource_name: string;
  resource_type: string | null;
  file_path: string | null;
  external_url: string | null;
  description: string | null;
  file_size: number | null;
  display_order: number;
}

interface ResourceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: any;
  onSuccess: () => void;
}

export function ResourceFormDialog({
  open,
  onOpenChange,
  lesson,
  onSuccess,
}: ResourceFormDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [newResource, setNewResource] = useState({
    resource_name: '',
    description: '',
    external_url: '',
  });

  useEffect(() => {
    if (open && lesson) {
      fetchResources();
    }
  }, [open, lesson]);

  const fetchResources = async () => {
    if (!lesson) return;

    try {
      const { data, error } = await supabase
        .from('lesson_resources')
        .select('*')
        .eq('lesson_id', lesson.id)
        .order('display_order');

      if (error) throw error;
      setResources(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !lesson) return;

    setUploading(true);

    try {
      const timestamp = Date.now();
      const fileName = `resource-${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `${lesson.id}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('course-resources')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { error: insertError } = await supabase
        .from('lesson_resources')
        .insert([{
          lesson_id: lesson.id,
          resource_name: file.name,
          resource_type: file.type,
          file_path: data.path,
          file_size: file.size,
          display_order: resources.length,
        }]);

      if (insertError) throw insertError;

      toast({
        title: 'Success',
        description: 'Resource uploaded successfully',
      });

      fetchResources();
      onSuccess();
    } catch (error: any) {
      logger.error('Error uploading resource:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload resource',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleCreateExternalLink = async () => {
    if (!lesson || !newResource.resource_name || !newResource.external_url) {
      toast({
        title: 'Error',
        description: 'Please provide a name and URL',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('lesson_resources')
        .insert([{
          lesson_id: lesson.id,
          resource_name: newResource.resource_name,
          description: newResource.description || null,
          external_url: newResource.external_url,
          display_order: resources.length,
        }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'External link added successfully',
      });

      setNewResource({
        resource_name: '',
        description: '',
        external_url: '',
      });

      fetchResources();
      onSuccess();
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

  const handleDeleteResource = async (resourceId: string, filePath: string | null) => {
    setLoading(true);
    try {
      if (filePath) {
        await supabase.storage
          .from('course-resources')
          .remove([filePath]);
      }

      const { error } = await supabase
        .from('lesson_resources')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Resource deleted successfully',
      });

      fetchResources();
      onSuccess();
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

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${Math.round(bytes / 1024)}KB` : `${mb.toFixed(1)}MB`;
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Resources: ${lesson?.title || ''}`}
      description="Upload files or add external links"
      className="max-w-3xl"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
            <CardDescription>Upload a document, PDF, or other resource file</CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              id="file-upload"
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Choose File to Upload
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add External Link</CardTitle>
            <CardDescription>Link to external resources or websites</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Resource Name *</Label>
              <Input
                value={newResource.resource_name}
                onChange={(e) => setNewResource({ ...newResource, resource_name: e.target.value })}
                placeholder="e.g., Additional Reading Material"
              />
            </div>

            <div className="grid gap-2">
              <Label>URL *</Label>
              <Input
                value={newResource.external_url}
                onChange={(e) => setNewResource({ ...newResource, external_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea
                value={newResource.description}
                onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                placeholder="Brief description"
                rows={2}
              />
            </div>

            <Button onClick={handleCreateExternalLink} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Plus className="h-4 w-4 mr-2" />
              Add Link
            </Button>
          </CardContent>
        </Card>

        {resources.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Existing Resources</h3>
            <div className="space-y-2">
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {resource.external_url ? (
                      <ExternalLink className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    ) : (
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{resource.resource_name}</h4>
                      {resource.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {resource.description}
                        </p>
                      )}
                      <div className="flex gap-2 mt-1">
                        {resource.resource_type && (
                          <Badge variant="outline" className="text-xs">
                            {resource.resource_type.split('/')[1]?.toUpperCase()}
                          </Badge>
                        )}
                        {resource.file_size && (
                          <Badge variant="outline" className="text-xs">
                            {formatFileSize(resource.file_size)}
                          </Badge>
                        )}
                        {resource.external_url && (
                          <Badge variant="outline" className="text-xs">External Link</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteResource(resource.id, resource.file_path)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {resources.length === 0 && (
          <p className="text-muted-foreground text-center py-8">
            No resources yet. Upload files or add links above.
          </p>
        )}
      </div>
    </ResponsiveDialog>
  );
}
