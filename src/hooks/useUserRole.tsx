import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'dev' | 'admin' | 'practitioner' | 'patient' | null;

export function useUserRole(userId: string | undefined) {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchUserRole = async () => {
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setRole(null);
        } else {
          setRole(data?.role as UserRole);
        }
      } catch (error) {
        console.error('Error in fetchUserRole:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [userId]);

  return { role, loading };
}
