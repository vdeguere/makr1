import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface ConversationItemProps {
  name: string;
  subject: string;
  lastMessage: string;
  lastMessageDate: string;
  unreadCount: number;
  isSelected: boolean;
  isSupport?: boolean;
  onClick: () => void;
}

export function ConversationItem({
  name,
  subject,
  lastMessage,
  lastMessageDate,
  unreadCount,
  isSelected,
  isSupport,
  onClick,
}: ConversationItemProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={`flex items-start gap-3 p-3 md:p-4 rounded-lg cursor-pointer transition-all hover:bg-accent/50 ${
        isSelected ? 'bg-accent' : ''
      }`}
      onClick={onClick}
    >
      <Avatar className="h-12 w-12 md:h-14 md:w-14 flex-shrink-0">
        <AvatarFallback className="bg-primary/10 text-primary font-semibold md:text-base">
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-sm md:text-base truncate">{name}</span>
          <span className="text-xs md:text-sm text-muted-foreground ml-2 flex-shrink-0">
            {format(new Date(lastMessageDate), 'd/M')}
          </span>
        </div>
        
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs md:text-sm font-medium text-muted-foreground truncate">
            {subject}
          </p>
          {isSupport && (
            <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4">
              Support
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs md:text-sm text-muted-foreground truncate flex-1">
            {lastMessage}
          </p>
          {unreadCount > 0 && (
            <Badge className="ml-2 h-5 w-5 md:h-6 md:w-6 flex items-center justify-center rounded-full p-0 bg-green-600 hover:bg-green-700 text-xs flex-shrink-0">
              {unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
