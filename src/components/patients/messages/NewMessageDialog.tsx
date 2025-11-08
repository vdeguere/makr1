import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { messageSchema, type MessageFormData } from '@/lib/validations/message';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

interface RecipientOption {
  id: string | null;
  name: string;
  type: 'practitioner' | 'support';
}

interface NewMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
  practitionerId: string;
  onMessageSent: () => void;
}

export function NewMessageDialog({
  open,
  onOpenChange,
  patientId,
  practitionerId,
  onMessageSent,
}: NewMessageDialogProps) {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [recipients, setRecipients] = useState<RecipientOption[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(true);

  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      message_body: '',
      recipient_type: 'practitioner',
      recipient_id: practitionerId,
    },
  });

  useEffect(() => {
    if (open) {
      fetchRecipients();
    }
  }, [open, practitionerId]);

  const fetchRecipients = async () => {
    setLoadingRecipients(true);
    try {
      const recipientList: RecipientOption[] = [
        {
          id: null,
          name: 'Support Team',
          type: 'support',
        },
      ];

      if (practitionerId) {
        const { data: practitioner } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('id', practitionerId)
          .single();

        if (practitioner) {
          recipientList.push({
            id: practitioner.id,
            name: practitioner.full_name,
            type: 'practitioner',
          });
        }
      }

      setRecipients(recipientList);
    } catch (error) {
      console.error('Error fetching recipients:', error);
    } finally {
      setLoadingRecipients(false);
    }
  };

  const onSubmit = async (values: MessageFormData) => {
    if (!user?.id) return;

    setSending(true);
    try {
      const insertData: any = {
        patient_id: patientId,
        sender_id: user.id,
        subject: 'Message',
        message_body: values.message_body,
        is_read: false,
        recipient_type: values.recipient_type,
        recipient_id: values.recipient_id,
      };

      if (values.recipient_type === 'practitioner') {
        insertData.practitioner_id = values.recipient_id;
      } else {
        insertData.practitioner_id = null;
      }

      const { error } = await supabase.from('patient_messages').insert(insertData);

      if (error) throw error;

      toast.success('Message sent successfully');
      form.reset();
      onOpenChange(false);
      onMessageSent();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>New Message</DialogTitle>
          <DialogDescription>
            Send a message to your doctor or support team.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="recipient_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Send To</FormLabel>
                  <Select
                    disabled={loadingRecipients || sending}
                    onValueChange={(value) => {
                      const selected = recipients.find(
                        (r) => (r.type === 'support' ? 'support' : r.id) === value
                      );
                      if (selected) {
                        field.onChange(selected.type);
                        form.setValue('recipient_id', selected.id);
                      }
                    }}
                    value={field.value === 'support' ? 'support' : form.watch('recipient_id') || ''}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recipient" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {recipients.map((recipient) => (
                        <SelectItem
                          key={recipient.type === 'support' ? 'support' : recipient.id}
                          value={recipient.type === 'support' ? 'support' : recipient.id!}
                        >
                          {recipient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message_body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Type your message here..."
                      className="min-h-[200px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={sending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={sending || loadingRecipients}>
                {sending ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
