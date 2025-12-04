import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/contexts/RoleContext';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquarePlus } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { NewMessageDialog } from '@/components/patients/messages/NewMessageDialog';
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
  sender?: {
    full_name: string;
  };
}

interface Thread {
  recipientType: string;
  recipientId: string | null;
  recipientName: string;
  subject: string;
  lastMessage: string;
  lastMessageDate: string;
  unreadCount: number;
  messages: Message[];
}

export default function Messages() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeRole } = useRole();
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [patientId, setPatientId] = useState<string>('');
  const [practitionerId, setPractitionerId] = useState<string>('');
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const fetchingRef = useRef(false);

  useEffect(() => {
    if (activeRole && activeRole !== 'patient') {
      navigate('/dashboard');
      return;
    }
    if (!user?.id || fetchingRef.current) return;
    fetchPatientData();
  }, [activeRole, user?.id, navigate]);

  // Realtime subscription for new messages
  useEffect(() => {
    if (!patientId) return;

    const channel = supabase
      .channel('patient-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'patient_messages',
          filter: `patient_id=eq.${patientId}`
        },
        () => {
          fetchMessages(patientId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [patientId]);

  const fetchPatientData = async () => {
    if (!user?.id || fetchingRef.current) return;

    fetchingRef.current = true;
    try {
      const { data: patient, error } = await supabase
        .from('patients')
        .select('id, practitioner_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!patient) {
        logger.error('No patient record found for user');
        toast.error('Student record not found. Please contact support.');
        return;
      }

      setPatientId(patient.id);
      setPractitionerId(patient.practitioner_id);
      await fetchMessages(patient.id);
    } catch (error) {
      logger.error('Error fetching patient data:', error);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  };

  const fetchMessages = async (pId: string) => {
    try {
      const { data: messages, error } = await supabase
        .from('patient_messages')
        .select(`
          *,
          sender:profiles!patient_messages_sender_id_fkey(full_name)
        `)
        .eq('patient_id', pId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const threadMap = new Map<string, Thread>();

      messages?.forEach((msg: any) => {
        const threadKey =
          msg.recipient_type === 'support'
            ? 'support'
            : `practitioner-${msg.recipient_id}`;

        if (!threadMap.has(threadKey)) {
          threadMap.set(threadKey, {
            recipientType: msg.recipient_type,
            recipientId: msg.recipient_id,
            recipientName:
              msg.recipient_type === 'support' ? 'Support Team' : 'Doctor',
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

      // Fetch practitioner names for practitioner threads
      for (const [key, thread] of threadMap.entries()) {
        if (thread.recipientType === 'practitioner' && thread.recipientId) {
          try {
            const { data: practitioner } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', thread.recipientId)
              .maybeSingle();

            if (practitioner) {
              thread.recipientName = practitioner.full_name;
            }
          } catch (error) {
            logger.error('Error fetching practitioner name:', error);
            // Keep default "Doctor" name if fetch fails
          }
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
          t => t.recipientType === selectedThread.recipientType &&
               t.recipientId === selectedThread.recipientId
        );
        if (updatedSelectedThread) {
          setSelectedThread(updatedSelectedThread);
        }
      } else if (sortedThreads.length > 0) {
        setSelectedThread(sortedThreads[0]);
      }
    } catch (error) {
      logger.error('Error fetching messages:', error);
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

        await fetchMessages(patientId);
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
      <div className="hidden lg:flex gap-4 lg:gap-6 flex-1">
        {/* Left: Conversation List - Responsive Width */}
        <div className="lg:w-[30%] border rounded-lg lg:rounded-xl bg-card flex flex-col overflow-hidden">
          <ConversationList
            threads={threads}
            selectedThread={selectedThread}
            onThreadSelect={handleThreadSelect}
            onNewMessage={() => setShowNewMessageDialog(true)}
          />
        </div>

        {/* Right: Message Thread - Flexible */}
        <div className="flex-1 border rounded-lg lg:rounded-xl bg-card overflow-hidden">
          {selectedThread ? (
            <MessageThread
              thread={selectedThread}
              patientId={patientId}
              practitionerId={practitionerId}
              onMessageSent={() => fetchMessages(patientId)}
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
              patientId={patientId}
              practitionerId={practitionerId}
              onMessageSent={() => fetchMessages(patientId)}
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

      <NewMessageDialog
        open={showNewMessageDialog}
        onOpenChange={setShowNewMessageDialog}
        patientId={patientId}
        practitionerId={practitionerId}
        onMessageSent={() => fetchMessages(patientId)}
      />
    </div>
  );

  return <DashboardLayout>{content}</DashboardLayout>;
}
