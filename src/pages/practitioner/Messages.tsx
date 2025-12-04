import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/contexts/RoleContext';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquarePlus } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { PractitionerNewMessageDialog } from '@/components/practitioner/messages/PractitionerNewMessageDialog';
import { MessageThread } from '@/components/patients/messages/MessageThread';
import { ConversationList } from '@/components/messages/ConversationList';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface Message {
  id: string;
  subject: string;
  message_body: string;
  created_at: string;
  is_read: boolean;
  sender_id: string;
  recipient_type: string;
  recipient_id: string | null;
  patient_id: string;
  sender?: {
    full_name: string;
  };
}

interface Thread {
  patientId: string;
  patientName: string;
  recipientType: string;
  recipientId: string | null;
  recipientName: string;
  subject: string;
  lastMessage: string;
  lastMessageDate: string;
  unreadCount: number;
  messages: Message[];
}

export default function PractitionerMessages() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeRole } = useRole();
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const fetchingRef = useRef(false);

  useEffect(() => {
    if (activeRole && activeRole !== 'practitioner') {
      navigate('/dashboard');
      return;
    }
    if (!user?.id || fetchingRef.current) return;
    fetchMessages();
  }, [activeRole, user?.id, navigate]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('practitioner-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'patient_messages',
          filter: `recipient_id=eq.${user.id}`
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchMessages = async () => {
    if (!user?.id || fetchingRef.current) return;

    fetchingRef.current = true;
    setLoading(true);
    try {
      // Fetch messages where practitioner is recipient or sender
      const { data: messages, error } = await supabase
        .from('patient_messages')
        .select(`
          *,
          sender:profiles!patient_messages_sender_id_fkey(full_name)
        `)
        .or(`recipient_id.eq.${user.id},sender_id.eq.${user.id}`)
        .eq('recipient_type', 'practitioner')
        .order('created_at', { ascending: true });

      if (error) throw error;

      const threadMap = new Map<string, Thread>();

      messages?.forEach((msg: any) => {
        const threadKey = `patient-${msg.patient_id}`;

        if (!threadMap.has(threadKey)) {
          threadMap.set(threadKey, {
            patientId: msg.patient_id,
            patientName: 'Patient',
            recipientType: msg.recipient_type,
            recipientId: msg.recipient_id,
            recipientName: 'Patient',
            subject: msg.subject,
            lastMessage: msg.message_body,
            lastMessageDate: msg.created_at,
            unreadCount: 0,
            messages: [],
          });
        }

        const thread = threadMap.get(threadKey)!;
        thread.messages.push(msg);
        thread.lastMessage = msg.message_body;
        thread.lastMessageDate = msg.created_at;

        if (!msg.is_read && msg.sender_id !== user?.id) {
          thread.unreadCount++;
        }
      });

      // Fetch patient names for all threads
      for (const [key, thread] of threadMap.entries()) {
        try {
          const { data: patient } = await supabase
            .from('patients')
            .select('full_name')
            .eq('id', thread.patientId)
            .maybeSingle();

          if (patient) {
            thread.patientName = patient.full_name;
            thread.recipientName = patient.full_name;
          }
        } catch (error) {
          logger.error('Error fetching patient name:', error);
        }
      }

      const sortedThreads = Array.from(threadMap.values()).sort(
        (a, b) =>
          new Date(b.lastMessageDate).getTime() -
          new Date(a.lastMessageDate).getTime()
      );

      setThreads(sortedThreads);

      // Update selected thread with latest data if it exists
      if (selectedThread) {
        const updatedSelectedThread = sortedThreads.find(
          t => t.patientId === selectedThread.patientId
        );
        if (updatedSelectedThread) {
          setSelectedThread(updatedSelectedThread);
        }
      }
    } catch (error) {
      logger.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  const handleThreadSelect = async (thread: Thread) => {
    setSelectedThread(thread);

    const unreadMessageIds = thread.messages
      .filter((msg) => !msg.is_read && msg.sender_id !== user?.id)
      .map((msg) => msg.id);

    if (unreadMessageIds.length > 0) {
      try {
        await supabase
          .from('patient_messages')
          .update({ is_read: true })
          .in('id', unreadMessageIds);

        await fetchMessages();
      } catch (error) {
        logger.error('Error marking messages as read:', error);
      }
    }
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

  const content = (
    <div className="flex flex-col h-[calc(100vh-6rem)]">
      {/* Desktop: Two-column split layout */}
      <div className="hidden lg:flex gap-4 flex-1">
        {/* Left: Conversation List - Fixed Width */}
        <div className="w-80 border rounded-lg bg-card flex flex-col overflow-hidden">
          <ConversationList
            threads={threads}
            selectedThread={selectedThread}
            onThreadSelect={handleThreadSelect}
            onNewMessage={() => setShowNewMessageDialog(true)}
          />
        </div>

        {/* Right: Message Thread - Flexible */}
        <div className="flex-1 border rounded-lg bg-card overflow-hidden">
          {selectedThread ? (
            <MessageThread
              thread={selectedThread}
              patientId={selectedThread.patientId}
              practitionerId={user?.id || ''}
              onMessageSent={fetchMessages}
              viewerRole="practitioner"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p className="text-lg">Select a conversation to view messages</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile & Tablet: Conditional single column */}
      <div className="lg:hidden flex-1 flex flex-col">
        {selectedThread ? (
          <div className="border rounded-lg bg-card overflow-hidden flex-1 flex flex-col">
            <MessageThread
              thread={selectedThread}
              patientId={selectedThread.patientId}
              practitionerId={user?.id || ''}
              onMessageSent={fetchMessages}
              viewerRole="practitioner"
              onBack={() => setSelectedThread(null)}
            />
          </div>
        ) : (
          <div className="border rounded-lg bg-card overflow-hidden flex-1 flex flex-col">
            <ConversationList
              threads={threads}
              selectedThread={selectedThread}
              onThreadSelect={handleThreadSelect}
              onNewMessage={() => setShowNewMessageDialog(true)}
            />
          </div>
        )}
      </div>

      <PractitionerNewMessageDialog
        open={showNewMessageDialog}
        onOpenChange={setShowNewMessageDialog}
        practitionerId={user?.id || ''}
        onMessageSent={fetchMessages}
      />
    </div>
  );

  return <DashboardLayout>{content}</DashboardLayout>;
}
