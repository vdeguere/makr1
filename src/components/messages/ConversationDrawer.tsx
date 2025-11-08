import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConversationItem } from './ConversationItem';
import { useIsMobile } from '@/hooks/use-mobile';

interface Message {
  id: string;
  subject: string;
  message_body: string;
  created_at: string;
  sender_id: string;
  recipient_type: string;
}

interface Thread {
  recipientType: string;
  recipientId: string | null;
  recipientName: string;
  subject: string;
  messages: Message[];
  lastMessageDate: string;
  unreadCount: number;
}

interface ConversationDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  threads: Thread[];
  selectedThread: Thread | null;
  onThreadSelect: (thread: Thread) => void;
}

export function ConversationDrawer({
  isOpen,
  onOpenChange,
  threads,
  selectedThread,
  onThreadSelect,
}: ConversationDrawerProps) {
  const isMobile = useIsMobile();

  const handleThreadClick = (thread: Thread) => {
    onThreadSelect(thread);
    // On mobile, close drawer after selecting
    if (isMobile) {
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent 
        side="left" 
        className="w-full sm:w-[400px] p-0 flex flex-col"
      >
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Conversations</SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="flex-1">
          <div className="p-2">
            {threads.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No conversations yet
              </p>
            ) : (
              threads.map((thread) => (
                <ConversationItem
                  key={`${thread.recipientType}-${thread.recipientId || 'support'}`}
                  name={thread.recipientName}
                  subject={thread.subject}
                  lastMessage={thread.messages[thread.messages.length - 1]?.message_body || ''}
                  lastMessageDate={thread.lastMessageDate}
                  unreadCount={thread.unreadCount}
                  isSelected={selectedThread?.recipientId === thread.recipientId && 
                             selectedThread?.recipientType === thread.recipientType}
                  isSupport={thread.recipientType === 'support'}
                  onClick={() => handleThreadClick(thread)}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
