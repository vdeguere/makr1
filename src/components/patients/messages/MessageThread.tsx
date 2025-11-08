import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Send, ArrowLeft } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  subject: string;
  message_body: string;
  created_at: string;
  sender_id: string;
  recipient_type: string;
  sender?: {
    full_name: string;
  };
}

interface Thread {
  recipientType: string;
  recipientId: string | null;
  recipientName: string;
  subject: string;
  messages: Message[];
}

interface MessageThreadProps {
  thread: Thread;
  patientId: string;
  practitionerId: string;
  onMessageSent: () => void;
  viewerRole?: 'patient' | 'practitioner';
  onBack?: () => void;
}

const replySchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
});

type ReplyFormData = z.infer<typeof replySchema>;

export function MessageThread({
  thread,
  patientId,
  practitionerId,
  onMessageSent,
  viewerRole = 'patient',
  onBack,
}: MessageThreadProps) {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  const isMobile = useIsMobile();

  const form = useForm<ReplyFormData>({
    resolver: zodResolver(replySchema),
    defaultValues: {
      message: '',
    },
  });

  const onSubmit = async (values: ReplyFormData) => {
    if (!user?.id) return;

    setSending(true);
    try {
      const insertData: any = {
        patient_id: patientId,
        sender_id: user.id,
        subject: thread.subject,
        message_body: values.message,
        is_read: false,
        recipient_type: thread.recipientType,
        recipient_id: thread.recipientId,
      };

      if (thread.recipientType === 'practitioner') {
        insertData.practitioner_id = thread.recipientId;
      } else {
        insertData.practitioner_id = null;
      }

      const { error } = await supabase.from('patient_messages').insert(insertData);

      if (error) throw error;

      toast.success('Reply sent successfully');
      form.reset();
      onMessageSent();
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const getSenderName = (message: Message): string => {
    if (message.sender_id === user?.id) {
      return 'You';
    }
    
    if (thread.recipientType === 'support') {
      return 'Support Team';
    }
    
    if (viewerRole === 'practitioner') {
      return message.sender?.full_name || 'Patient';
    }
    
    return message.sender?.full_name || 'Doctor';
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 md:p-5 lg:p-6 flex items-center gap-3">
        {isMobile && onBack && (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onBack}
            className="h-8 w-8 -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <Avatar className="h-10 w-10 md:h-12 md:w-12">
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {getInitials(thread.recipientName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold md:text-lg">{thread.recipientName}</h3>
            {thread.recipientType === 'support' && (
              <Badge variant="secondary" className="text-xs">Support</Badge>
            )}
          </div>
          <p className="text-xs md:text-sm text-muted-foreground">{thread.subject}</p>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4 md:p-5 lg:p-6">
        <div className="space-y-3 md:space-y-4">
          {thread.messages.map((message, index) => {
            const isOwnMessage = message.sender_id === user?.id;
            const senderName = getSenderName(message);
            
            return (
              <div
                key={message.id}
                className={`flex gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                {!isOwnMessage && (
                  <Avatar className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs md:text-sm">
                      {getInitials(senderName)}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`flex flex-col max-w-[70%] md:max-w-[75%] lg:max-w-[65%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`rounded-2xl px-4 py-2 ${
                      isOwnMessage
                        ? 'bg-green-600 text-white rounded-br-sm'
                        : 'bg-muted text-foreground rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm md:text-base whitespace-pre-wrap break-words">
                      {message.message_body}
                    </p>
                  </div>
                  <span className="text-xs md:text-sm text-muted-foreground mt-1 px-1">
                    {format(new Date(message.created_at), 'h:mm a')}
                  </span>
                </div>

                {isOwnMessage && (
                  <Avatar className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0">
                    <AvatarFallback className="bg-green-600 text-white text-xs md:text-sm">
                      {getInitials(senderName)}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="border-t p-4 md:p-5 lg:p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Textarea
                      placeholder="Type a message..."
                      className="resize-none min-h-[44px] md:min-h-[52px] max-h-[120px] border-muted-foreground/20"
                      rows={1}
                      {...field}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          form.handleSubmit(onSubmit)();
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              disabled={sending}
              size="icon"
              className="h-[44px] w-[44px] md:h-[48px] md:w-[48px] rounded-full bg-green-600 hover:bg-green-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
