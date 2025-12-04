import { supabase } from '@/integrations/supabase/client';
import { 
  generateSessionId, 
  getDeviceType, 
  getScreenResolution,
  getPreviousPage,
  setPreviousPage
} from './analytics';
import { logger } from './logger';

// Store the current page analytics ID for updating later
let currentPageAnalyticsId: string | null = null;
let pageEntryTime: number = Date.now();

export const trackPageViewToSupabase = async (
  path: string,
  title: string,
  userId: string | null,
  userRole: string | null
) => {
  try {
    const sessionId = generateSessionId();
    const previousPage = getPreviousPage();
    
    const analyticsData = {
      page_path: path,
      page_title: title,
      page_location: window.location.href,
      referrer: document.referrer || null,
      user_id: userId,
      user_role: userRole,
      session_id: sessionId,
      device_type: getDeviceType(),
      user_agent: navigator.userAgent,
      screen_resolution: getScreenResolution(),
      entry_time: new Date().toISOString(),
      previous_page: previousPage,
      is_bounce: false,
    };

    const { data, error } = await supabase
      .from('page_analytics')
      .insert(analyticsData)
      .select('id')
      .single();

    if (error) {
      // Silently fail analytics - don't block the app
      logger.warn('Analytics tracking failed (non-critical):', error.message);
      return null;
    }

    // Store the ID for later updates
    currentPageAnalyticsId = data.id;
    pageEntryTime = Date.now();
    
    // Update previous page for next navigation
    setPreviousPage(path);
    
    return data.id;
  } catch (error) {
    // Silently fail analytics - don't block the app
    logger.warn('Analytics tracking error (non-critical):', error);
    return null;
  }
};

export const updatePageAnalyticsDuration = async (isBounce: boolean = false) => {
  if (!currentPageAnalyticsId) return;

  try {
    const durationSeconds = Math.floor((Date.now() - pageEntryTime) / 1000);
    
    const { error } = await supabase
      .from('page_analytics')
      .update({
        duration_seconds: durationSeconds,
        exit_time: new Date().toISOString(),
        is_bounce: isBounce,
      })
      .eq('id', currentPageAnalyticsId);

    if (error) {
      // Silently fail analytics - don't block the app
      logger.warn('Analytics update failed (non-critical):', error.message);
    }

    // Reset for next page
    currentPageAnalyticsId = null;
  } catch (error) {
    // Silently fail analytics - don't block the app
    logger.warn('Analytics update error (non-critical):', error);
  }
};

// Check if session has only one page view (bounce detection)
export const checkIfBounce = async (sessionId: string): Promise<boolean> => {
  try {
    const { count, error } = await supabase
      .from('page_analytics')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    if (error) {
      // Silently fail analytics - don't block the app
      logger.warn('Bounce check failed (non-critical):', error.message);
      return false;
    }

    return count === 1;
  } catch (error) {
    // Silently fail analytics - don't block the app
    logger.warn('Bounce check error (non-critical):', error);
    return false;
  }
};
