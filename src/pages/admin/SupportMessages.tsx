import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/contexts/RoleContext';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { logger } from '@/lib/logger';

interface SupportMessage {
  id: string;
  subject: string;
  message_body: string;
  created_at: string;
  sender_id: string;
  is_read: boolean;
  patient_id: string;
  patient?: {
    full_name: string;
    practitioner?: {
      full_name: string;
    };
  };
  sender?: {
    full_name: string;
  };
}

interface SupportThread {
  patientId: string;
  patientName: string;
  practitionerName: string;
  subject: string;
  lastMessage: string;
  lastMessageDate: string;
  unreadCount: number;
  messages: SupportMessage[];
}

export default function SupportMessages() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeRole } = useRole();
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<SupportThread | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (activeRole !== 'admin' && activeRole !== 'dev') {
      navigate('/dashboard');
      return;
    }
    fetchSupportMessages();
  }, [activeRole, navigate]);

  const fetchSupportMessages = async () => {
    setLoading(true);
    try {
      const { data: messages, error } = await supabase
        .from('patient_messages')
        .select(`
          *,
          patient:patients!patient_messages_patient_id_fkey(
            id,
            full_name,
            practitioner:profiles!patients_practitioner_id_fkey(full_name)
          ),
          sender:profiles!patient_messages_sender_id_fkey(
            full_name
          )
        `)
        .eq('recipient_type', 'support')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const threadMap = new Map<string, SupportThread>();

      messages?.forEach((msg: any) => {
        const patientId = msg.patient_id;
        
        if (!threadMap.has(patientId)) {
          threadMap.set(patientId, {
            patientId,
            patientName: msg.patient?.full_name || 'Unknown Patient',
            practitionerName: msg.patient?.practitioner?.full_name || 'No Practitioner',
            subject: msg.subject,
            lastMessage: msg.message_body,
            lastMessageDate: msg.created_at,
            unreadCount: 0,
            messages: [],
          });
        }

        const thread = threadMap.get(patientId)!;
        thread.messages.push(msg);
        thread.lastMessage = msg.message_body;
        thread.lastMessageDate = msg.created_at;

        if (!msg.is_read) {
          thread.unreadCount++;
        }
      });

      const sortedThreads = Array.from(threadMap.values()).sort(
        (a, b) =>
          new Date(b.lastMessageDate).getTime() -
          new Date(a.lastMessageDate).getTime()
      );

      setThreads(sortedThreads);

      if (selectedThread) {
        const updatedSelectedThread = sortedThreads.find(
          t => t.patientId === selectedThread.patientId
        );
        if (updatedSelectedThread) {
          setSelectedThread(updatedSelectedThread);
        }
      } else if (sortedThreads.length > 0) {
        setSelectedThread(sortedThreads[0]);
      }
    } catch (error) {
      logger.error('Error fetching support messages:', error);
      toast.error('Failed to load support messages');
    } finally {
      setLoading(false);
    }
  };

  const handleThreadSelect = async (thread: SupportThread) => {
    setSelectedThread(thread);

    const unreadMessageIds = thread.messages
      .filter((msg) => !msg.is_read)
      .map((msg) => msg.id);

    if (unreadMessageIds.length > 0) {
      try {
        await supabase
          .from('patient_messages')
          .update({ is_read: true })
          .in('id', unreadMessageIds);

        await fetchSupportMessages();
      } catch (error) {
        logger.error('Error marking messages as read:', error);
      }
    }
  };

  const handleSendReply = async () => {
    if (!user?.id || !selectedThread || !replyText.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase.from('patient_messages').insert({
        patient_id: selectedThread.patientId,
        sender_id: user.id,
        subject: selectedThread.subject,
        message_body: replyText,
        is_read: false,
        recipient_type: 'support',
        recipient_id: null,
        practitioner_id: null,
      });

      if (error) throw error;

      toast.success('Reply sent successfully');
      setReplyText('');
      await fetchSupportMessages();
    } catch (error) {
      logger.error('Error sending reply:', error);
      toast.error('Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const getSenderDisplayName = (message: SupportMessage): string => {
    return message.sender?.full_name || 'Unknown';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Support Messages</h1>
          <p className="text-muted-foreground">Manage patient and guest support tickets</p>
        </div>

        <Tabs defaultValue="patient" className="w-full">
          <TabsList>
            <TabsTrigger value="patient">Patient Support</TabsTrigger>
            <TabsTrigger value="guest">Guest Support</TabsTrigger>
          </TabsList>

          <TabsContent value="patient" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-16rem)]">
              <Card className="md:col-span-1 p-4">
                <h3 className="font-semibold mb-4">Support Tickets</h3>
                <ScrollArea className="h-[calc(100%-3rem)]">
                  <div className="space-y-2">
                    {threads.map((thread) => (
                      <div
                        key={thread.patientId}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedThread?.patientId === thread.patientId
                            ? 'bg-primary/10 border border-primary'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => handleThreadSelect(thread)}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <span className="font-medium">{thread.patientName}</span>
                          {thread.unreadCount > 0 && (
                            <Badge variant="default">{thread.unreadCount}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Doctor: {thread.practitionerName}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {thread.lastMessage}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>

              <Card className="md:col-span-2 p-4">
                {selectedThread ? (
                  <div className="flex flex-col h-full">
                    <div className="border-b pb-3 mb-4">
                      <p className="text-sm text-muted-foreground">
                        Patient: {selectedThread.patientName} | Doctor: {selectedThread.practitionerName}
                      </p>
                    </div>

                    <ScrollArea className="flex-1 pr-4">
                      <div className="space-y-4 w-full">
                        {selectedThread.messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${
                              message.sender_id === selectedThread.patientId ? 'justify-start' : 'justify-end'
                            }`}
                          >
                            <div
                              className={`max-w-[70%] p-3 shadow-sm ${
                                message.sender_id === selectedThread.patientId
                                  ? 'bg-secondary/10 border border-secondary/20 rounded-tr-2xl rounded-tl-sm rounded-b-2xl'
                                  : 'bg-primary text-primary-foreground rounded-tl-2xl rounded-tr-sm rounded-b-2xl'
                              }`}
                            >
                              <div className="flex items-baseline justify-between gap-2 mb-1">
                                <span className="font-medium text-sm">
                                  {getSenderDisplayName(message)}
                                </span>
                                <span className="text-xs opacity-70">
                                  {format(new Date(message.created_at), 'MMM d, h:mm a')}
                                </span>
                              </div>
                              <p className="text-sm whitespace-pre-wrap">
                                {message.message_body}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    <div className="border-t pt-4 mt-4">
                      <Textarea
                        placeholder="Type your reply..."
                        className="resize-none mb-2"
                        rows={3}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                      />
                      <div className="flex justify-end">
                        <Button onClick={handleSendReply} disabled={sending || !replyText.trim()}>
                          {sending ? 'Sending...' : 'Send Reply'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Select a support ticket to view messages
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="guest" className="mt-6">
            <div className="text-center text-muted-foreground py-8">
              <p>Guest support interface will redirect to dedicated page...</p>
              <Button
                onClick={() => navigate('/admin/guest-support')}
                className="mt-4"
              >
                Go to Guest Support
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}