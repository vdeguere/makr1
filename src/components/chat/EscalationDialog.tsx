import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { logger } from '@/lib/logger';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2, Clock } from 'lucide-react';
import { escalationSchema, type EscalationFormData } from '@/lib/validations/escalation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface EscalationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatHistory: Message[];
}

export function EscalationDialog({ open, onOpenChange, chatHistory }: EscalationDialogProps) {
  const { t } = useTranslation(['chat', 'validation']);
  const { user, session } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EscalationFormData>({
    resolver: zodResolver(escalationSchema),
    defaultValues: {
      email: user?.email || '',
      full_name: user?.user_metadata?.full_name || '',
      subject: '',
      message_body: '',
      include_chat_history: true,
    },
  });

  const onSubmit = async (data: EscalationFormData) => {
    setIsSubmitting(true);
    try {
      const { data: response, error } = await supabase.functions.invoke('escalate-chat-support', {
        body: {
          ...data,
          chat_history: data.include_chat_history ? chatHistory : undefined,
        },
        headers: session?.access_token ? {
          Authorization: `Bearer ${session.access_token}`,
        } : undefined,
      });

      if (error) throw error;

      toast.success(t('chat:escalateSuccess'), {
        description: t('chat:escalateTicketId', { ticketId: response.ticket_id }),
      });

      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      logger.error('Error submitting support request:', error);
      toast.error(t('chat:error'), {
        description: error.message || 'Failed to submit support request',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const messageLength = form.watch('message_body')?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t('chat:escalate')}</DialogTitle>
          <DialogDescription>
            {t('chat:escalateDescription')}
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            {t('chat:escalateWarning')}
          </AlertDescription>
        </Alert>

        {user && (
          <Alert>
            <AlertDescription>
              Logged in as <strong>{user.email}</strong>
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!user && (
              <>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common:email')}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="your@email.com"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        {t('chat:escalateEmailRequired')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('chat:escalateName')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('chat:escalateSubject')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message_body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('chat:escalateMessage')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={5}
                      placeholder={t('chat:escalateMessage')}
                    />
                  </FormControl>
                  <FormDescription>
                    {messageLength}/2000 characters
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="include_chat_history"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      {t('chat:escalateIncludeHistory')}
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {t('common:cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('chat:escalateSubmit')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}