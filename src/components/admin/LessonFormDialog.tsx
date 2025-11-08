import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { lessonSchema, type LessonFormData } from '@/lib/validations/course';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Upload } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface LessonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  lesson?: any;
  onSuccess: () => void;
}

export function LessonFormDialog({
  open,
  onOpenChange,
  courseId,
  lesson,
  onSuccess,
}: LessonFormDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      course_id: courseId,
      lesson_type: 'video',
      is_published: false,
      display_order: 0,
    },
  });

  const lessonType = watch('lesson_type');

  useEffect(() => {
    if (lesson) {
      reset({
        ...lesson,
        course_id: courseId,
      });
    } else {
      reset({
        course_id: courseId,
        lesson_type: 'video',
        is_published: false,
        display_order: 0,
      });
    }
  }, [lesson, courseId, reset]);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a video file',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const timestamp = Date.now();
      const fileName = `lesson-video-${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('course-videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('course-videos')
        .getPublicUrl(data.path);

      setValue('content_url', publicUrl);

      toast({
        title: 'Success',
        description: 'Video uploaded successfully',
      });
    } catch (error: any) {
      console.error('Error uploading video:', error);
      toast({
        title: 'Upload failed',
        description: error.message || 'Failed to upload video',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const onSubmit = async (data: LessonFormData) => {
    setLoading(true);

    try {
      if (lesson) {
        const { error } = await supabase
          .from('course_lessons')
          .update(data)
          .eq('id', lesson.id);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Lesson updated successfully',
        });
      } else {
        const { error } = await supabase
          .from('course_lessons')
          .insert([{
            course_id: courseId,
            title: data.title,
            description: data.description || null,
            lesson_type: data.lesson_type || 'video',
            content_url: data.content_url || null,
            video_duration_seconds: data.video_duration_seconds || null,
            transcript: data.transcript || null,
            is_published: data.is_published || false,
            display_order: data.display_order || 0,
          }]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Lesson created successfully',
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
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={lesson ? 'Edit Lesson' : 'Create Lesson'}
      description={lesson ? 'Update lesson details' : 'Add a new lesson to this course'}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Lesson title"
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
              placeholder="Lesson description"
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="lesson_type">Lesson Type *</Label>
            <Select
              value={lessonType || 'video'}
              onValueChange={(value) => setValue('lesson_type', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="reading">Reading</SelectItem>
                <SelectItem value="quiz">Quiz</SelectItem>
              </SelectContent>
            </Select>
            {errors.lesson_type && (
              <p className="text-sm text-destructive">{errors.lesson_type.message}</p>
            )}
          </div>

          {lessonType === 'video' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="content_url">Video</Label>
                <Input
                  id="video-upload"
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('video-upload')?.click()}
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
                        Upload Video
                      </>
                    )}
                  </Button>
                  <Input
                    {...register('content_url')}
                    placeholder="Or paste video URL"
                  />
                </div>
                {errors.content_url && (
                  <p className="text-sm text-destructive">{errors.content_url.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="video_duration_seconds">Duration (seconds)</Label>
                <Input
                  id="video_duration_seconds"
                  type="number"
                  {...register('video_duration_seconds', { valueAsNumber: true })}
                  placeholder="e.g., 300 for 5 minutes"
                />
                {errors.video_duration_seconds && (
                  <p className="text-sm text-destructive">{errors.video_duration_seconds.message}</p>
                )}
              </div>
            </>
          )}

          {lessonType === 'reading' && (
            <div className="grid gap-2">
              <Label htmlFor="content_url">Content URL</Label>
              <Input
                id="content_url"
                {...register('content_url')}
                placeholder="URL to reading material"
              />
              {errors.content_url && (
                <p className="text-sm text-destructive">{errors.content_url.message}</p>
              )}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="transcript">Transcript/Content</Label>
            <Textarea
              id="transcript"
              {...register('transcript')}
              placeholder="Full transcript or lesson content"
              rows={5}
            />
            {errors.transcript && (
              <p className="text-sm text-destructive">{errors.transcript.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="display_order">Display Order</Label>
            <Input
              id="display_order"
              type="number"
              {...register('display_order', { valueAsNumber: true })}
              placeholder="0"
            />
            {errors.display_order && (
              <p className="text-sm text-destructive">{errors.display_order.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_published">Published</Label>
            <Switch
              id="is_published"
              checked={watch('is_published')}
              onCheckedChange={(checked) => setValue('is_published', checked)}
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {lesson ? 'Update' : 'Create'} Lesson
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
