import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { courseSchema, CourseFormData } from '@/lib/validations/course';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, X, Upload, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CourseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course?: any;
  onSuccess: () => void;
}

export function CourseFormDialog({ open, onOpenChange, course, onSuccess }: CourseFormDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [prerequisites, setPrerequisites] = useState<string[]>(course?.prerequisites || []);
  const [learningOutcomes, setLearningOutcomes] = useState<string[]>(course?.learning_outcomes || []);
  const [newPrerequisite, setNewPrerequisite] = useState('');
  const [newOutcome, setNewOutcome] = useState('');
  const [uploading, setUploading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(course?.thumbnail_url || null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: course || {
      is_published: false,
      display_order: 0,
      prerequisites: [],
      learning_outcomes: [],
    },
  });

  useEffect(() => {
    if (course) {
      reset(course);
      setPrerequisites(course.prerequisites || []);
      setLearningOutcomes(course.learning_outcomes || []);
      setThumbnailPreview(course.thumbnail_url || null);
    } else {
      reset({
        is_published: false,
        display_order: 0,
        prerequisites: [],
        learning_outcomes: [],
      });
      setPrerequisites([]);
      setLearningOutcomes([]);
      setThumbnailPreview(null);
    }
  }, [course, reset]);

  const isPublished = watch('is_published');

  const addPrerequisite = () => {
    if (newPrerequisite.trim()) {
      const updated = [...prerequisites, newPrerequisite.trim()];
      setPrerequisites(updated);
      setValue('prerequisites', updated);
      setNewPrerequisite('');
    }
  };

  const removePrerequisite = (index: number) => {
    const updated = prerequisites.filter((_, i) => i !== index);
    setPrerequisites(updated);
    setValue('prerequisites', updated);
  };

  const addOutcome = () => {
    if (newOutcome.trim()) {
      const updated = [...learningOutcomes, newOutcome.trim()];
      setLearningOutcomes(updated);
      setValue('learning_outcomes', updated);
      setNewOutcome('');
    }
  };

  const removeOutcome = (index: number) => {
    const updated = learningOutcomes.filter((_, i) => i !== index);
    setLearningOutcomes(updated);
    setValue('learning_outcomes', updated);
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Image must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `course-thumbnail-${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('course-thumbnails')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('course-thumbnails')
        .getPublicUrl(data.path);

      // Update form value and preview
      setValue('thumbnail_url', publicUrl);
      setThumbnailPreview(publicUrl);

      toast({
        title: 'Success',
        description: 'Thumbnail uploaded successfully',
      });
    } catch (error: any) {
      console.error('Error uploading thumbnail:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload thumbnail',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveThumbnail = () => {
    setValue('thumbnail_url', '');
    setThumbnailPreview(null);
  };

  const onSubmit = async (data: CourseFormData) => {
    setLoading(true);
    try {
      if (!data.title?.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Course title is required',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      const courseData: any = {
        title: data.title,
        description: data.description || null,
        category: data.category || null,
        difficulty_level: data.difficulty_level || null,
        estimated_hours: data.estimated_hours || null,
        thumbnail_url: data.thumbnail_url || null,
        preview_video_url: data.preview_video_url || null,
        is_published: data.is_published || false,
        display_order: data.display_order || 0,
        target_audience: data.target_audience || 'practitioner',
        prerequisites,
        learning_outcomes: learningOutcomes,
        requires_certificate: true,
        certificate_criteria: {
          minimum_score: 70,
          required_quizzes: true,
          minimum_quiz_score: 70,
          requires_final_exam: false,
          time_limit_days: null
        }
      };

      if (course?.id) {
        const { error } = await supabase
          .from('courses')
          .update(courseData)
          .eq('id', course.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Course updated successfully',
        });
      } else {
        const { error } = await supabase
          .from('courses')
          .insert([courseData]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Course created successfully',
        });
      }

      onSuccess();
      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{course ? 'Edit Course' : 'Create New Course'}</DialogTitle>
          <DialogDescription>
            {course ? 'Update course information and settings' : 'Add a new course to the training platform'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Course title"
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Course description"
                rows={4}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  {...register('category')}
                  placeholder="e.g., Herbology"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="difficulty_level">Difficulty Level</Label>
                <Select
                  onValueChange={(value) => setValue('difficulty_level', value as any)}
                  defaultValue={course?.difficulty_level}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="target_audience">Target Audience</Label>
              <Select
                onValueChange={(value) => setValue('target_audience', value as any)}
                defaultValue={course?.target_audience || 'practitioner'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="practitioner">Practitioners</SelectItem>
                  <SelectItem value="patient">Patients</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="estimated_hours">Estimated Hours</Label>
                <Input
                  id="estimated_hours"
                  type="number"
                  {...register('estimated_hours', { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  {...register('display_order', { valueAsNumber: true })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="preview_video_url">Preview Video URL</Label>
              <Input
                id="preview_video_url"
                {...register('preview_video_url')}
                placeholder="https://www.youtube.com/watch?v=... or direct video URL"
              />
              {errors.preview_video_url && (
                <p className="text-sm text-destructive">{errors.preview_video_url.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Supports YouTube, Vimeo, and direct video URLs (MP4, etc.)
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="thumbnail">Thumbnail Image</Label>
              
              {/* Hidden file input */}
              <Input
                id="thumbnail"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleThumbnailUpload}
                disabled={uploading}
                className="hidden"
              />
              
              {/* Upload button or preview */}
              {thumbnailPreview ? (
                <div className="space-y-2">
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border bg-muted">
                    <img
                      src={thumbnailPreview}
                      alt="Course thumbnail preview"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveThumbnail}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Click "Remove" to upload a different image
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('thumbnail')?.click()}
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
                        Upload Thumbnail
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Recommended: 1920x1080px or 16:9 aspect ratio. Max 5MB.
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Prerequisites</Label>
              <div className="space-y-2">
                {prerequisites.map((prereq, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input value={prereq} disabled className="flex-1" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePrerequisite(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newPrerequisite}
                    onChange={(e) => setNewPrerequisite(e.target.value)}
                    placeholder="Add prerequisite"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPrerequisite())}
                  />
                  <Button type="button" onClick={addPrerequisite} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Learning Outcomes</Label>
              <div className="space-y-2">
                {learningOutcomes.map((outcome, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input value={outcome} disabled className="flex-1" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOutcome(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Input
                    value={newOutcome}
                    onChange={(e) => setNewOutcome(e.target.value)}
                    placeholder="Add learning outcome"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOutcome())}
                  />
                  <Button type="button" onClick={addOutcome} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_published">Published</Label>
              <Switch
                id="is_published"
                checked={isPublished}
                onCheckedChange={(checked) => setValue('is_published', checked)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {course ? 'Update' : 'Create'} Course
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
