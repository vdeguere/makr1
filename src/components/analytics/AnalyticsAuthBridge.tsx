import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

/**
 * Bridge component that syncs auth state with analytics.
 * Separates auth concerns from analytics to avoid circular dependencies.
 */
export function AnalyticsAuthBridge() {
  const { user } = useAuth();
  const { setUserId, setUserProperties } = useAnalytics();

  useEffect(() => {
    // Set user ID immediately
    setUserId(user?.id ?? null);

    if (user?.id) {
      // Defer Supabase queries to avoid blocking auth initialization
      setTimeout(() => {
        fetchAndSetUserProperties(user.id);
      }, 0);
    }
  }, [user?.id, setUserId, setUserProperties]);

  const fetchAndSetUserProperties = async (userId: string) => {
    try {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('id', userId)
        .maybeSingle();
      
      if (roleData) {
        const properties: Record<string, any> = {
          user_role: roleData.role as 'admin' | 'patient' | 'practitioner',
          account_created_date: profileData?.created_at,
        };
        
        // Add practitioner-specific properties
        if (roleData.role === 'practitioner') {
          const { count: patientCount } = await supabase
            .from('patients')
            .select('*', { count: 'exact', head: true })
            .eq('practitioner_id', userId);
          
          const { count: recommendationCount } = await supabase
            .from('recommendations')
            .select('*', { count: 'exact', head: true })
            .eq('practitioner_id', userId);
          
          properties.total_patients = patientCount || 0;
          properties.total_recommendations = recommendationCount || 0;
        }
        
        setUserProperties(properties);
      }
    } catch (error) {
      logger.warn('Analytics: Failed to set user properties', error);
    }
  };

  return null;
}
