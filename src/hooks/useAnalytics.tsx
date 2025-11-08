import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  GAUserProperties,
  GAPurchaseEvent,
  isGALoaded,
  getGAMeasurementId,
  generateSessionId,
} from '@/lib/analytics';
import { 
  trackPageViewToSupabase, 
  updatePageAnalyticsDuration,
  checkIfBounce 
} from '@/lib/pageAnalytics';

/**
 * Pure analytics hook - no direct Supabase auth queries.
 * User data is provided by AnalyticsAuthBridge component.
 */
export const useAnalytics = () => {
  const location = useLocation();
  const userIdRef = useRef<string | null>(null);
  const userRoleRef = useRef<string | null>(null);

  // Track page views on route change
  useEffect(() => {
    const pageTitle = document.title;
    
    // Track to Google Analytics
    if (isGALoaded()) {
      trackPageView(location.pathname, pageTitle);
    }
    
    // Track to Supabase with delay to ensure client is ready
    const trackTimer = setTimeout(() => {
      trackPageViewToSupabase(
        location.pathname,
        pageTitle,
        userIdRef.current,
        userRoleRef.current
      ).catch(err => {
        console.warn('Page view tracking failed:', err);
      });
    }, 100);

    // Update duration when navigating away
    return () => {
      clearTimeout(trackTimer);
      updatePageAnalyticsDuration(false).catch(err => {
        console.warn('Duration update failed:', err);
      });
    };
  }, [location]);

  // Track page visibility changes and beforeunload
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePageAnalyticsDuration(false).catch(err => {
          console.warn('Duration update failed:', err);
        });
      }
    };

    const handleBeforeUnload = () => {
      const sessionId = generateSessionId();
      checkIfBounce(sessionId).then(isBounce => {
        updatePageAnalyticsDuration(isBounce);
      }).catch(err => {
        console.warn('Bounce check failed:', err);
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Track page view
  const trackPageView = useCallback((path: string, title: string) => {
    if (!isGALoaded()) return;

    const measurementId = getGAMeasurementId();
    if (!measurementId) return;

    window.gtag?.('config', measurementId, {
      page_path: path,
      page_title: title,
      page_location: window.location.href,
    });
  }, []);

  // Track custom event
  const trackEvent = useCallback((eventName: string, params?: Record<string, any>) => {
    if (!isGALoaded()) {
      console.warn('GA4 not loaded, event not tracked:', eventName);
      return;
    }

    window.gtag?.('event', eventName, params);
  }, []);

  // Set user ID
  const setUserId = useCallback((userId: string | null) => {
    if (!isGALoaded()) return;

    const measurementId = getGAMeasurementId();
    if (!measurementId) return;

    window.gtag?.('config', measurementId, {
      user_id: userId,
    });
    
    // Update ref for Supabase tracking
    userIdRef.current = userId;
  }, []);

  // Set user properties
  const setUserProperties = useCallback((properties: GAUserProperties) => {
    if (!isGALoaded()) return;

    window.gtag?.('set', 'user_properties', properties);
    
    // Update role ref if provided
    if (properties.user_role) {
      userRoleRef.current = properties.user_role;
    }
  }, []);

  // Track exception/error
  const trackException = useCallback((description: string, fatal: boolean = false) => {
    if (!isGALoaded()) return;

    window.gtag?.('event', 'exception', {
      description,
      fatal,
    });
  }, []);

  // Track e-commerce purchase
  const trackPurchase = useCallback((purchaseData: GAPurchaseEvent) => {
    if (!isGALoaded()) return;

    window.gtag?.('event', 'purchase', purchaseData);
  }, []);

  // Track begin checkout
  const trackBeginCheckout = useCallback((value: number, currency: string, items: any[]) => {
    if (!isGALoaded()) return;

    window.gtag?.('event', 'begin_checkout', {
      value,
      currency,
      items,
    });
  }, []);

  // Track view item
  const trackViewItem = useCallback((value: number, currency: string, items: any[]) => {
    if (!isGALoaded()) return;

    window.gtag?.('event', 'view_item', {
      value,
      currency,
      items,
    });
  }, []);

  return {
    trackPageView,
    trackEvent,
    setUserId,
    setUserProperties,
    trackException,
    trackPurchase,
    trackBeginCheckout,
    trackViewItem,
  };
};
