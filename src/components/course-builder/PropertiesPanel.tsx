import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { lessonSchema, sectionSchema, type LessonFormData, type SectionFormData } from '@/lib/validations/course';
import type { Lesson, Section } from '@/lib/courseBuilderUtils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PropertiesPanelProps {
  selectedItem: Lesson | Section | null;
  itemType: 'lesson' | 'section' | null;
  onSave: (data: any) => void;
}

export function PropertiesPanel({ selectedItem, itemType, onSave }: PropertiesPanelProps) {
  const lessonForm = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
  });

  const sectionForm = useForm<SectionFormData>({
    resolver: zodResolver(sectionSchema),
  });

  useEffect(() => {
    if (itemType === 'lesson' && selectedItem) {
      lessonForm.reset(selectedItem as Lesson);
    } else if (itemType === 'section' && selectedItem) {
      sectionForm.reset(selectedItem as Section);
    }
  }, [selectedItem, itemType]);

  if (!selectedItem || !itemType) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">Select a lesson or section</p>
          <p className="text-xs mt-1">to view and edit its properties</p>
        </div>
      </div>
    );
  }

  if (itemType === 'lesson') {
    return (
      <ScrollArea className="h-full">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Lesson Properties</h3>
          <Form {...lessonForm}>
            <form onSubmit={lessonForm.handleSubmit(onSave)} className="space-y-4">
              <FormField
                control={lessonForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Lesson title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={lessonForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        value={field.value || ''}
                        placeholder="Lesson description"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={lessonForm.control}
                name="lesson_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="reading">Reading</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={lessonForm.control}
                name="content_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content URL</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ''}
                        placeholder="https://..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={lessonForm.control}
                name="video_duration_seconds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (seconds)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                        placeholder="0"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={lessonForm.control}
                name="is_published"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel>Published</FormLabel>
                      <p className="text-xs text-muted-foreground">Make this lesson visible to students</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                Save Changes
              </Button>
            </form>
          </Form>
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Section Properties</h3>
        <Form {...sectionForm}>
          <form onSubmit={sectionForm.handleSubmit(onSave)} className="space-y-4">
            <FormField
              control={sectionForm.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Section title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={sectionForm.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ''}
                      placeholder="Section description"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={sectionForm.control}
              name="is_published"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel>Published</FormLabel>
                    <p className="text-xs text-muted-foreground">Make this section visible to students</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full">
              Save Changes
            </Button>
          </form>
        </Form>
      </div>
    </ScrollArea>
  );
}
