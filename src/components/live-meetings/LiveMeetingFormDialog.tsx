import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { liveMeetingSchema, type LiveMeetingFormData } from '@/lib/validations/liveMeeting';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';

interface LiveMeetingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  meeting?: any;
  onSuccess: () => void;
}

export function LiveMeetingFormDialog({
  open,
  onOpenChange,
  meeting,
  onSuccess,
}: LiveMeetingFormDialogProps) {
  const { toast } = useToast();
  const form = useForm<LiveMeetingFormData>({
    resolver: zodResolver(liveMeetingSchema),
    defaultValues: meeting || {
      title: '',
      description: '',
      stream_url: '',
      stream_platform: 'custom',
      scheduled_start_time: '',
      scheduled_end_time: '',
      is_published: false,
      meeting_type: 'open',
      allowed_roles: ['admin', 'practitioner', 'patient'],
    },
  });

  const onSubmit = async (data: LiveMeetingFormData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (meeting) {
        const { error } = await supabase
          .from('live_meetings')
          .update(data)
          .eq('id', meeting.id);

        if (error) throw error;
        toast({ title: 'Meeting updated successfully' });
      } else {
        const { error } = await supabase
          .from('live_meetings')
          .insert([{
            title: data.title,
            description: data.description,
            stream_url: data.stream_url,
            stream_platform: data.stream_platform,
            scheduled_start_time: data.scheduled_start_time,
            scheduled_end_time: data.scheduled_end_time,
            is_published: data.is_published,
            max_attendees: data.max_attendees,
            meeting_type: data.meeting_type,
            allowed_roles: data.allowed_roles,
            tags: data.tags,
            thumbnail_url: data.thumbnail_url,
            host_user_id: user.id,
          }]);

        if (error) throw error;
        toast({ title: 'Meeting created successfully' });
      }

      form.reset();
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {meeting ? 'Edit Live Meeting' : 'Create Live Meeting'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-fluid-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Monthly TCM Webinar" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ''}
                      placeholder="Describe what participants will learn..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stream_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stream URL *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://..." />
                  </FormControl>
                  <FormDescription>
                    YouTube, Zoom, Google Meet, or custom streaming URL
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stream_platform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Platform</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="google_meet">Google Meet</SelectItem>
                      <SelectItem value="zoom">Zoom</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-fluid-4">
              <FormField
                control={form.control}
                name="scheduled_start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time *</FormLabel>
                    <FormControl>
                      <Input {...field} type="datetime-local" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scheduled_end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ''}
                        type="datetime-local"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="max_attendees"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Attendees</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="Leave empty for unlimited"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_published"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Publish Meeting</FormLabel>
                    <FormDescription>
                      Make this meeting visible to users
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {meeting ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
