import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type UserRole = 'dev' | 'admin' | 'practitioner' | 'patient' | null;

interface RoleContextType {
  role: UserRole;
  activeRole: UserRole;
  loading: boolean;
  switchRole?: (newRole: Exclude<UserRole, 'dev' | null>) => Promise<void>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const user = auth?.user ?? null;
  const [role, setRole] = useState<UserRole>(null);
  const [activeRole, setActiveRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = useCallback(async () => {
    if (!user) {
      setRole(null);
      setActiveRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get active role first (supports dev overrides or DB-computed role)
      const { data: activeRoleData, error: activeRoleError } = await supabase
        .rpc('get_active_role', { _user_id: user.id });

      // Get the user's stored role; allow 0 rows without throwing
      const { data: roleRow, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      const userRole = (roleRow?.role as UserRole) ?? null;
      setRole(userRole);

      const effectiveRole = (activeRoleData as UserRole) ?? userRole;
      setActiveRole(effectiveRole);

      if (roleError && (roleError as any).code !== 'PGRST116') {
        console.error('Error fetching user role:', roleError);
      }
      if (activeRoleError) {
        console.error('Error fetching active role (get_active_role):', activeRoleError);
      }

      if (import.meta.env.DEV) {
        console.debug('[RoleContext] fetchUserRole', user.id, {
          userRole,
          activeRoleData,
          effectiveRole,
        });
      }
    } catch (error) {
      console.error('Error in fetchUserRole:', error);
      setRole(null);
      setActiveRole(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserRole();
  }, [fetchUserRole]);

  const switchRole = async (newRole: Exclude<UserRole, 'dev' | null>) => {
    if (!user || role !== 'dev') return;

    try {
      const { error } = await supabase
        .from('dev_role_overrides')
        .upsert({
          user_id: user.id,
          active_role: newRole,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setActiveRole(newRole);
    } catch (error) {
      console.error('Error switching role:', error);
    }
  };

  return (
    <RoleContext.Provider value={{ role, activeRole, loading, switchRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
