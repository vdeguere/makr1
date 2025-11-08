import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useUnreadMessagesCount() {
  const { user } = useAuth();
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    if (!user?.id) return;

    const fetchUnreadCount = async () => {
      try {
        const { count: unreadCount, error } = await supabase
          .from('patient_messages')
          .select('*', { count: 'exact', head: true })
          .eq('recipient_id', user.id)
          .neq('sender_id', user.id)
          .eq('is_read', false);

        if (error) throw error;
        setCount(unreadCount || 0);
      } catch (error) {
        console.error('Error fetching unread message count:', error);
      }
    };

    fetchUnreadCount();

    // Realtime subscription for new messages
    const channel = supabase
      .channel('unread-messages-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patient_messages',
          filter: `recipient_id=eq.${user.id}`
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return count;
}
