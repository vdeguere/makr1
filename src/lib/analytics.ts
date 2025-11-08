// Google Analytics 4 Types and Utilities

export interface GAEvent {
  action?: string;
  category?: string;
  label?: string;
  value?: number;
  [key: string]: any;
}

export interface GAPageView {
  page_path: string;
  page_title: string;
  page_location?: string;
}

export interface GAUserProperties {
  user_role?: 'admin' | 'practitioner' | 'patient';
  account_created_date?: string;
  total_patients?: number;
  total_recommendations?: number;
  [key: string]: any;
}

export interface GAEcommerceItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  price: number;
  quantity: number;
}

export interface GAPurchaseEvent {
  transaction_id: string;
  value: number;
  currency: string;
  items: GAEcommerceItem[];
  payment_method?: string;
  shipping?: {
    address?: string;
    city?: string;
    country?: string;
  };
}

// Check if GA4 is loaded
export const isGALoaded = (): boolean => {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
};

// Get GA4 Measurement ID from environment
export const getGAMeasurementId = (): string | undefined => {
  return import.meta.env.VITE_GA4_MEASUREMENT_ID;
};

// Declare gtag function for TypeScript
declare global {
  interface Window {
    gtag?: (
      command: 'config' | 'event' | 'consent' | 'set',
      targetOrAction: string,
      params?: any
    ) => void;
    dataLayer?: any[];
  }
}

// Page Analytics Types for Supabase
export interface PageAnalytics {
  page_path: string;
  page_title: string;
  page_location: string;
  referrer: string;
  user_id: string | null;
  user_role: string | null;
  session_id: string;
  device_type: 'mobile' | 'tablet' | 'desktop';
  user_agent: string;
  screen_resolution: string;
  entry_time: string;
  previous_page: string | null;
}

export interface PageAnalyticsUpdate {
  id: string;
  duration_seconds: number;
  exit_time: string;
  is_bounce: boolean;
}

// Helper to detect device type
export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
};

// Helper to get screen resolution
export const getScreenResolution = (): string => {
  return `${window.screen.width}x${window.screen.height}`;
};

// Session ID generator
export const generateSessionId = (): string => {
  const sessionKey = '__analytics_session_id';
  let sessionId = sessionStorage.getItem(sessionKey);
  
  if (!sessionId) {
    sessionId = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem(sessionKey, sessionId);
  }
  
  return sessionId;
};

// Track previous page
export const getPreviousPage = (): string | null => {
  return sessionStorage.getItem('__analytics_previous_page') || null;
};

export const setPreviousPage = (path: string): void => {
  sessionStorage.setItem('__analytics_previous_page', path);
};
