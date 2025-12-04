import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { logger } from '@/lib/logger';
import { z } from 'zod';
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

interface Patient {
  id: string;
  full_name: string;
  user_id: string | null;
}

interface PractitionerNewMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  practitionerId: string;
  onMessageSent: () => void;
}

const messageSchema = z.object({
  recipient_type: z.enum(['patient', 'support']),
  patient_id: z.string().optional(),
  message_body: z.string()
    .trim()
    .min(1, 'Message is required')
    .max(5000, 'Message must be less than 5000 characters'),
}).refine(
  (data) => data.recipient_type === 'support' || data.patient_id,
  {
    message: 'Please select a student',
    path: ['patient_id'],
  }
);

type MessageFormData = z.infer<typeof messageSchema>;

export function PractitionerNewMessageDialog({
  open,
  onOpenChange,
  practitionerId,
  onMessageSent,
}: PractitionerNewMessageDialogProps) {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);

  const form = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      recipient_type: 'patient',
      patient_id: '',
      message_body: '',
    },
  });

  const recipientType = form.watch('recipient_type');

  useEffect(() => {
    if (open && practitionerId) {
      fetchPatients();
    }
  }, [open, practitionerId]);

  const fetchPatients = async () => {
    setLoadingPatients(true);
    try {
      const { data: patientList, error } = await supabase
        .from('patients')
        .select('id, full_name, user_id')
        .eq('practitioner_id', practitionerId)
        .order('full_name');

      if (error) throw error;

      setPatients(patientList || []);
    } catch (error) {
      logger.error('Error fetching patients:', error);
      toast.error('Failed to load students');
    } finally {
      setLoadingPatients(false);
    }
  };

  const onSubmit = async (values: MessageFormData) => {
    if (!user?.id) return;

    setSending(true);
    try {
      // Auto-generate subject based on recipient type
      let subject: string;
      if (values.recipient_type === 'support') {
        subject = 'Support Request';
      } else {
        const selectedPatient = patients.find(p => p.id === values.patient_id);
        subject = selectedPatient 
          ? `Message to ${selectedPatient.full_name}` 
          : 'Message to Student';
      }

      const insertData = values.recipient_type === 'support' 
        ? {
            sender_id: user.id,
            subject,
            message_body: values.message_body,
            is_read: false,
            recipient_type: 'support' as const,
            recipient_id: null,
            practitioner_id: null,
            patient_id: null,
          }
        : {
            patient_id: values.patient_id!,
            sender_id: user.id,
            subject,
            message_body: values.message_body,
            is_read: false,
            recipient_type: 'practitioner' as const,
            recipient_id: practitionerId,
            practitioner_id: practitionerId,
          };

      const { error } = await supabase.from('patient_messages').insert(insertData);

      if (error) throw error;

      toast.success(
        values.recipient_type === 'support' 
          ? 'Support message sent successfully' 
          : 'Message sent successfully'
      );
      form.reset();
      onOpenChange(false);
      onMessageSent();
    } catch (error) {
      logger.error('Error sending message:', error);
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
            Send a message to a student or contact the support team.
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
                    disabled={sending}
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recipient type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="patient">Student</SelectItem>
                      <SelectItem value="support">Support Team</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {recipientType === 'patient' && (
              <FormField
                control={form.control}
                name="patient_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student</FormLabel>
                    <Select
                      disabled={loadingPatients || sending}
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a student" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
                            {patient.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
              <Button type="submit" disabled={sending || loadingPatients}>
                {sending ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
