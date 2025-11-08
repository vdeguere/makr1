import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Trash2, LifeBuoy, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { EscalationDialog } from '@/components/chat/EscalationDialog';
import { ProductCard } from '@/components/chat/ProductCard';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  productCards?: string[];
}

const ChatSupportWidget = () => {
  const { t } = useTranslation('chat');
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEscalation, setShowEscalation] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, buttonX: 0, buttonY: 0 });
  const wasDraggedRef = useRef(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message, unread count, button position, and hidden state
  useEffect(() => {
    const storedMessages = sessionStorage.getItem('app:chat:messages');
    const storedUnreadCount = sessionStorage.getItem('app:chat:unreadCount');
    const storedPosition = sessionStorage.getItem('app:chat:buttonPosition');
    const storedHidden = localStorage.getItem('app:chat:hidden');
    
    if (storedMessages) {
      const parsed = JSON.parse(storedMessages);
      setMessages(parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
    } else {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: t('welcomeMessage'),
        timestamp: new Date(),
      }]);
    }
    
    if (storedUnreadCount) {
      setUnreadCount(parseInt(storedUnreadCount, 10));
    }
    
    if (storedHidden === '1') {
      setIsHidden(true);
    }
    
    if (storedPosition) {
      try {
        setButtonPosition(JSON.parse(storedPosition));
      } catch (error) {
        console.error('Error loading button position:', error);
        setButtonPosition({
          x: window.innerWidth - 96,
          y: window.innerHeight - 96
        });
      }
    } else {
      // Set default position (bottom-right)
      setButtonPosition({
        x: window.innerWidth - 96,
        y: window.innerHeight - 96
      });
    }

    // Listen for global event to reopen chat
    const handleChatOpen = () => {
      setIsHidden(false);
      localStorage.removeItem('app:chat:hidden');
      setIsOpen(true);
    };

    window.addEventListener('app:chat:open', handleChatOpen);
    return () => window.removeEventListener('app:chat:open', handleChatOpen);
  }, [t]);

  // Save messages and unread count to session storage
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem('app:chat:messages', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    sessionStorage.setItem('app:chat:unreadCount', unreadCount.toString());
  }, [unreadCount]);

  // Save button position to session storage
  useEffect(() => {
    sessionStorage.setItem('app:chat:buttonPosition', JSON.stringify(buttonPosition));
  }, [buttonPosition]);

  // Handle window resize to keep button in viewport
  useEffect(() => {
    const handleResize = () => {
      setButtonPosition(prev => ({
        x: Math.min(prev.x, window.innerWidth - 96),
        y: Math.min(prev.y, window.innerHeight - 96)
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Reset unread count when chat is opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a pleasant two-tone notification sound
      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        // Envelope for smooth sound
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };
      
      const currentTime = audioContext.currentTime;
      playTone(800, currentTime, 0.15); // First tone
      playTone(1000, currentTime + 0.15, 0.15); // Second tone (higher pitch)
      
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Prepare conversation history for API
      const conversationHistory = [...messages, userMessage]
        .filter(m => m.id !== 'welcome')
        .map(m => ({
          role: m.role,
          content: m.content,
        }));

      const { data, error } = await supabase.functions.invoke('chat-support', {
        body: {
          messages: conversationHistory,
          language,
        },
      });

      if (error) throw error;

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.message) {
        const aiMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.message,
          timestamp: new Date(),
          productCards: data.productCards || [],
        };
        setMessages(prev => [...prev, aiMessage]);
        
        // Increment unread count and play sound if chat is closed
        if (!isOpen) {
          setUnreadCount(prev => prev + 1);
          playNotificationSound();
        }
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      
      let errorMessage = t('error');
      if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
        errorMessage = t('rateLimitError');
      } else if (error.message?.includes('402') || error.message?.includes('Payment')) {
        errorMessage = t('paymentError');
      } else if (error.message?.includes('Internal server error') || error.message?.includes('500')) {
        errorMessage = 'The assistant is temporarily unavailable. Please try again shortly or escalate to support.';
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: t('welcomeMessage'),
      timestamp: new Date(),
    }]);
    setUnreadCount(0);
    sessionStorage.removeItem('app:chat:messages');
    sessionStorage.removeItem('app:chat:unreadCount');
    sessionStorage.removeItem('app:chat:buttonPosition');
    // Reset to default position
    setButtonPosition({
      x: window.innerWidth - 96,
      y: window.innerHeight - 96
    });
    toast.success(t('clear'));
  };

  const handleDragStart = (clientX: number, clientY: number) => {
    wasDraggedRef.current = false;
    setIsDragging(true);
    dragStartRef.current = {
      x: clientX,
      y: clientY,
      buttonX: buttonPosition.x,
      buttonY: buttonPosition.y
    };
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    
    const deltaX = clientX - dragStartRef.current.x;
    const deltaY = clientY - dragStartRef.current.y;
    
    // Mark as dragged if moved more than 5 pixels
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      wasDraggedRef.current = true;
    }
    
    const newX = Math.max(0, Math.min(dragStartRef.current.buttonX + deltaX, window.innerWidth - 96));
    const newY = Math.max(0, Math.min(dragStartRef.current.buttonY + deltaY, window.innerHeight - 96));
    
    setButtonPosition({ x: newX, y: newY });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  };

  const handleButtonClick = () => {
    if (!wasDraggedRef.current) {
      setIsOpen(true);
    }
  };

  const handleHideWidget = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsHidden(true);
    localStorage.setItem('app:chat:hidden', '1');
    toast.success('Assistant hidden. Reopen via More > AI Assistant');
  };

  // Add document-level event listeners for dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientX, e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleDragMove(touch.clientX, touch.clientY);
    };

    const handleMouseUp = () => {
      handleDragEnd();
    };

    const handleTouchEnd = () => {
      handleDragEnd();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  if (isHidden) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
      <div className="relative">
        <Button
          onClick={handleButtonClick}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className="fixed top-0 left-0 h-14 w-14 rounded-full shadow-lg z-50 transition-shadow"
          style={{
            transform: `translate(${buttonPosition.x}px, ${buttonPosition.y}px)`,
            cursor: isDragging ? 'grabbing' : 'grab',
            boxShadow: isDragging ? '0 20px 25px -5px rgb(0 0 0 / 0.3)' : undefined
          }}
          size="icon"
          aria-label={t('open')}
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 ? (
            <span className="absolute -top-1 -right-1 h-6 w-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs font-semibold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : (
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-primary rounded-full animate-pulse" />
          )}
        </Button>
        <Button
          onClick={handleHideWidget}
          className="fixed top-0 left-0 h-5 w-5 rounded-full shadow-sm z-[51] bg-destructive/90 hover:bg-destructive text-destructive-foreground p-0"
          style={{
            transform: `translate(${buttonPosition.x + 42}px, ${buttonPosition.y - 2}px)`,
          }}
          size="icon"
          aria-label="Hide assistant"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed right-6 w-[380px] h-[600px] shadow-2xl flex flex-col z-[60] sm:w-[380px] sm:bottom-6 max-sm:w-[calc(100vw-2rem)] max-sm:right-4 max-sm:h-[calc(100vh-12rem)] max-sm:max-h-[600px] max-sm:bottom-24">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <h3 className="font-semibold">{t('title')}</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowEscalation(true)}
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                aria-label={t('escalate')}
              >
                <LifeBuoy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsHidden(true);
                  setIsOpen(false);
                  localStorage.setItem('app:chat:hidden', '1');
                  toast.success('Assistant hidden. Reopen via More > AI Assistant');
                }}
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                aria-label="Hide assistant"
              >
                <EyeOff className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearChat}
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                aria-label={t('clear')}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                aria-label={t('close')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div className={cn(
                    'max-w-[80%] space-y-3',
                    message.role === 'user' ? 'flex flex-col items-end' : ''
                  )}>
                    <div
                      className={cn(
                        'rounded-lg px-4 py-2 text-sm whitespace-pre-wrap',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      )}
                    >
                      {message.content}
                    </div>
                    {message.productCards && message.productCards.length > 0 && (
                      <div className="space-y-2">
                        {message.productCards.map(productId => (
                          <ProductCard key={productId} productId={productId} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-secondary text-secondary-foreground max-w-[80%] rounded-lg px-4 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span className="text-xs">{t('typing')}</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('placeholder')}
                disabled={isLoading}
                className="flex-1"
                maxLength={500}
              />
              <Button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                size="icon"
                aria-label={t('send')}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-1 text-right">
              {inputValue.length}/500
            </div>
          </div>
        </Card>
      )}

      <EscalationDialog
        open={showEscalation}
        onOpenChange={setShowEscalation}
        chatHistory={messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString(),
        }))}
      />
    </>
  );
};

export default ChatSupportWidget;
