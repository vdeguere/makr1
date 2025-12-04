/**
 * Centralized logging utility
 * 
 * In development: Logs all messages to console
 * In production: Only logs errors (console.error always available)
 * 
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.log('Info message');
 *   logger.error('Error message');
 *   logger.debug('Debug message');
 */

const isDev = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;

export const logger = {
  /**
   * Log informational messages
   * Only logs in development mode
   */
  log: (...args: unknown[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Log error messages
   * Always logs errors (even in production) for debugging
   */
  error: (...args: unknown[]) => {
    console.error(...args);
    
    // In production, you might want to send to error tracking service
    if (isProduction) {
      // TODO: Integrate with error tracking service (Sentry, etc.)
      // errorTracking.captureException(new Error(args.join(' ')));
    }
  },

  /**
   * Log warning messages
   * Only logs in development mode
   */
  warn: (...args: unknown[]) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Log debug messages
   * Only logs in development mode
   */
  debug: (...args: unknown[]) => {
    if (isDev) {
      console.debug(...args);
    }
  },

  /**
   * Log with context (useful for debugging)
   * Only logs in development mode
   */
  logWithContext: (message: string, context?: Record<string, unknown>) => {
    if (isDev) {
      console.log(`[${message}]`, context || '');
    }
  },
};

