/**
 * Service Worker Error Monitoring Integration
 * 
 * Provides error monitoring capabilities within the service worker context
 * for push notification handling and background sync operations.
 */

import { NotificationErrorType, ErrorSeverity } from './error-monitoring';

// Service worker error monitoring interface
export interface ServiceWorkerError {
  id: string;
  type: NotificationErrorType;
  message: string;
  details: Record<string, any>;
  timestamp: number;
  severity: ErrorSeverity;
  context: 'push' | 'sync' | 'notification' | 'general';
}

/**
 * Service Worker Error Monitor
 * Lightweight error monitoring for service worker context
 */
export class ServiceWorkerErrorMonitor {
  private static instance: ServiceWorkerErrorMonitor;
  private errors: ServiceWorkerError[] = [];
  private maxErrors: number = 100; // Limit memory usage

  private constructor() {}

  static getInstance(): ServiceWorkerErrorMonitor {
    if (!ServiceWorkerErrorMonitor.instance) {
      ServiceWorkerErrorMonitor.instance = new ServiceWorkerErrorMonitor();
    }
    return ServiceWorkerErrorMonitor.instance;
  }

  /**
   * Track error in service worker context
   */
  trackError(
    type: NotificationErrorType,
    message: string,
    details: Record<string, any> = {},
    context: 'push' | 'sync' | 'notification' | 'general' = 'general'
  ): string {
    const errorId = this.generateErrorId();
    const severity = this.getErrorSeverity(type);

    const error: ServiceWorkerError = {
      id: errorId,
      type,
      message,
      details: {
        ...details,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        serviceWorkerContext: true
      },
      timestamp: Date.now(),
      severity,
      context
    };

    this.errors.push(error);

    // Limit memory usage
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Log error for debugging
    console.error(`[SW] Notification Error [${type}]:`, message, details);

    // Send error to main thread if possible
    this.sendErrorToMainThread(error);

    return errorId;
  }

  /**
   * Track push notification errors
   */
  trackPushError(error: any, pushEvent?: any): string {
    return this.trackError(
      NotificationErrorType.NOTIFICATION_DELIVERY_FAILED,
      `Push notification error: ${error?.message || 'Unknown error'}`,
      {
        originalError: error?.toString(),
        pushEventData: pushEvent?.data?.json?.() || null,
        pushEventTag: pushEvent?.tag,
        pushEventTimestamp: pushEvent?.timeStamp
      },
      'push'
    );
  }

  /**
   * Track notification display errors
   */
  trackNotificationDisplayError(error: any, notificationData?: any): string {
    return this.trackError(
      NotificationErrorType.NOTIFICATION_DISPLAY_FAILED,
      `Notification display error: ${error?.message || 'Unknown error'}`,
      {
        originalError: error?.toString(),
        notificationData,
        displayAttempt: true
      },
      'notification'
    );
  }

  /**
   * Track notification action errors
   */
  trackNotificationActionError(error: any, action?: string, notificationData?: any): string {
    return this.trackError(
      NotificationErrorType.NOTIFICATION_ACTION_FAILED,
      `Notification action error: ${error?.message || 'Unknown error'}`,
      {
        originalError: error?.toString(),
        action,
        notificationData,
        actionAttempt: true
      },
      'notification'
    );
  }

  /**
   * Track background sync errors
   */
  trackSyncError(error: any, syncTag?: string): string {
    return this.trackError(
      NotificationErrorType.API_REQUEST_FAILED,
      `Background sync error: ${error?.message || 'Unknown error'}`,
      {
        originalError: error?.toString(),
        syncTag,
        backgroundSync: true
      },
      'sync'
    );
  }

  /**
   * Get all errors
   */
  getErrors(): ServiceWorkerError[] {
    return [...this.errors];
  }

  /**
   * Get errors by context
   */
  getErrorsByContext(context: 'push' | 'sync' | 'notification' | 'general'): ServiceWorkerError[] {
    return this.errors.filter(error => error.context === context);
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Export errors for main thread
   */
  exportErrors(): {
    errors: ServiceWorkerError[];
    timestamp: number;
    serviceWorkerVersion: string;
  } {
    return {
      errors: this.getErrors(),
      timestamp: Date.now(),
      serviceWorkerVersion: '1.0.0' // This should be dynamic
    };
  }

  // Private methods

  private generateErrorId(): string {
    return `sw_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getErrorSeverity(type: NotificationErrorType): ErrorSeverity {
    const severityMap: Record<NotificationErrorType, ErrorSeverity> = {
      [NotificationErrorType.PUSH_SUBSCRIPTION_FAILED]: ErrorSeverity.HIGH,
      [NotificationErrorType.PUSH_PERMISSION_DENIED]: ErrorSeverity.MEDIUM,
      [NotificationErrorType.PUSH_NOT_SUPPORTED]: ErrorSeverity.LOW,
      [NotificationErrorType.VAPID_KEY_INVALID]: ErrorSeverity.CRITICAL,
      [NotificationErrorType.SERVICE_WORKER_ERROR]: ErrorSeverity.HIGH,
      [NotificationErrorType.NOTIFICATION_DELIVERY_FAILED]: ErrorSeverity.HIGH,
      [NotificationErrorType.NOTIFICATION_DISPLAY_FAILED]: ErrorSeverity.MEDIUM,
      [NotificationErrorType.NOTIFICATION_ACTION_FAILED]: ErrorSeverity.MEDIUM,
      [NotificationErrorType.API_REQUEST_FAILED]: ErrorSeverity.MEDIUM,
      [NotificationErrorType.API_TIMEOUT]: ErrorSeverity.MEDIUM,
      [NotificationErrorType.API_RATE_LIMITED]: ErrorSeverity.LOW,
      [NotificationErrorType.NETWORK_OFFLINE]: ErrorSeverity.LOW,
      [NotificationErrorType.NETWORK_TIMEOUT]: ErrorSeverity.MEDIUM,
      [NotificationErrorType.NETWORK_CONNECTION_FAILED]: ErrorSeverity.MEDIUM,
      [NotificationErrorType.PERFORMANCE_DEGRADATION]: ErrorSeverity.MEDIUM,
      [NotificationErrorType.MEMORY_LEAK]: ErrorSeverity.HIGH,
      [NotificationErrorType.HIGH_CPU_USAGE]: ErrorSeverity.MEDIUM,
      [NotificationErrorType.BROWSER_NOT_SUPPORTED]: ErrorSeverity.LOW,
      [NotificationErrorType.FEATURE_NOT_AVAILABLE]: ErrorSeverity.LOW,
      [NotificationErrorType.POLYFILL_FAILED]: ErrorSeverity.MEDIUM
    };

    return severityMap[type] || ErrorSeverity.MEDIUM;
  }

  private sendErrorToMainThread(error: ServiceWorkerError): void {
    try {
      // Send error to all clients
      if ('clients' in self) {
        (self as any).clients.matchAll().then((clients: any[]) => {
          clients.forEach(client => {
            client.postMessage({
              type: 'NOTIFICATION_ERROR',
              error: {
                id: error.id,
                type: error.type,
                message: error.message,
                details: error.details,
                timestamp: error.timestamp,
                severity: error.severity,
                context: error.context
              }
            });
          });
        }).catch((err: any) => {
          console.warn('[SW] Failed to send error to main thread:', err);
        });
      }
    } catch (err) {
      console.warn('[SW] Failed to send error to main thread:', err);
    }
  }
}

// Global error handlers for service worker
export function setupServiceWorkerErrorMonitoring(): void {
  const monitor = ServiceWorkerErrorMonitor.getInstance();

  // Handle unhandled promise rejections
  self.addEventListener('unhandledrejection', (event) => {
    monitor.trackError(
      NotificationErrorType.SERVICE_WORKER_ERROR,
      `Unhandled promise rejection: ${event.reason?.message || 'Unknown error'}`,
      {
        reason: event.reason?.toString(),
        unhandledRejection: true
      }
    );
  });

  // Handle JavaScript errors
  self.addEventListener('error', (event) => {
    monitor.trackError(
      NotificationErrorType.SERVICE_WORKER_ERROR,
      `JavaScript error: ${event.message}`,
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.toString(),
        javascriptError: true
      }
    );
  });

  console.log('[SW] Error monitoring initialized');
}

// Enhanced push event handler with error monitoring
export function createMonitoredPushHandler(originalHandler: (event: any) => Promise<void>) {
  return async (event: any) => {
    const monitor = ServiceWorkerErrorMonitor.getInstance();
    const startTime = Date.now();

    try {
      await originalHandler(event);
      
      // Track successful push handling performance
      const duration = Date.now() - startTime;
      if (duration > 5000) { // More than 5 seconds
        monitor.trackError(
          NotificationErrorType.PERFORMANCE_DEGRADATION,
          `Push handler took ${duration}ms to complete`,
          {
            duration,
            performanceIssue: true,
            pushEventData: event.data?.json?.() || null
          },
          'push'
        );
      }
    } catch (error) {
      monitor.trackPushError(error, event);
      throw error; // Re-throw to maintain original behavior
    }
  };
}

// Enhanced notification click handler with error monitoring
export function createMonitoredNotificationClickHandler(originalHandler: (event: any) => Promise<void>) {
  return async (event: any) => {
    const monitor = ServiceWorkerErrorMonitor.getInstance();

    try {
      await originalHandler(event);
    } catch (error) {
      monitor.trackNotificationActionError(
        error,
        event.action || 'click',
        event.notification?.data
      );
      throw error; // Re-throw to maintain original behavior
    }
  };
}

// Enhanced background sync handler with error monitoring
export function createMonitoredSyncHandler(originalHandler: (event: any) => Promise<void>) {
  return async (event: any) => {
    const monitor = ServiceWorkerErrorMonitor.getInstance();

    try {
      await originalHandler(event);
    } catch (error) {
      monitor.trackSyncError(error, event.tag);
      throw error; // Re-throw to maintain original behavior
    }
  };
}

// Singleton instance
export const serviceWorkerErrorMonitor = ServiceWorkerErrorMonitor.getInstance();

// Convenience functions
export const trackServiceWorkerError = (
  type: NotificationErrorType,
  message: string,
  details?: Record<string, any>,
  context?: 'push' | 'sync' | 'notification' | 'general'
): string => {
  return serviceWorkerErrorMonitor.trackError(type, message, details, context);
};

export const trackPushError = (error: any, pushEvent?: any): string => {
  return serviceWorkerErrorMonitor.trackPushError(error, pushEvent);
};

export const trackNotificationDisplayError = (error: any, notificationData?: any): string => {
  return serviceWorkerErrorMonitor.trackNotificationDisplayError(error, notificationData);
};

export const trackNotificationActionError = (error: any, action?: string, notificationData?: any): string => {
  return serviceWorkerErrorMonitor.trackNotificationActionError(error, action, notificationData);
};

export const trackSyncError = (error: any, syncTag?: string): string => {
  return serviceWorkerErrorMonitor.trackSyncError(error, syncTag);
};