import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus } from 'lucide-react';
import { ConversationItem } from './ConversationItem';

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
  patientId?: string;
  patientName?: string;
}

interface ConversationListProps {
  threads: Thread[];
  selectedThread: Thread | null;
  onThreadSelect: (thread: Thread) => void;
  onNewMessage?: () => void;
}

export function ConversationList({
  threads,
  selectedThread,
  onThreadSelect,
  onNewMessage,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredThreads = threads.filter((thread) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const displayName = thread.patientName || thread.recipientName;
    const lastMessage = thread.messages[thread.messages.length - 1]?.message_body || '';
    
    return (
      displayName.toLowerCase().includes(query) ||
      thread.subject.toLowerCase().includes(query) ||
      lastMessage.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search for chats and messages"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 md:h-11 bg-muted/30 border-muted-foreground/20"
            />
          </div>
          {onNewMessage && (
            <Button
              onClick={onNewMessage}
              size="icon"
              variant="ghost"
              className="shrink-0"
              aria-label="New message"
            >
              <Plus className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2 md:p-3">
        {filteredThreads.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </p>
        ) : (
          filteredThreads.map((thread) => {
            const displayName = thread.patientName || thread.recipientName;
            const threadKey = thread.patientId 
              ? `patient-${thread.patientId}`
              : `${thread.recipientType}-${thread.recipientId || 'support'}`;
            
            return (
              <ConversationItem
                key={threadKey}
                name={displayName}
                subject={thread.subject}
                lastMessage={thread.messages[thread.messages.length - 1]?.message_body || ''}
                lastMessageDate={thread.lastMessageDate}
                unreadCount={thread.unreadCount}
                isSelected={
                  thread.patientId 
                    ? selectedThread?.patientId === thread.patientId
                    : selectedThread?.recipientId === thread.recipientId && 
                      selectedThread?.recipientType === thread.recipientType
                }
                isSupport={thread.recipientType === 'support'}
                onClick={() => onThreadSelect(thread)}
              />
            );
          })
        )}
        </div>
      </ScrollArea>
    </div>
  );
}
