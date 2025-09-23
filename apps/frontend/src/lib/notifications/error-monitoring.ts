/**
 * Notification Error Monitoring System
 * 
 * Provides comprehensive error tracking, monitoring, and alerting for the push notification system.
 * Tracks subscription failures, permission issues, delivery problems, and performance metrics.
 */

import { PushNotificationError, NotificationType } from '../../types/notifications';

// Error monitoring interfaces
export interface NotificationError {
  id: string;
  type: NotificationErrorType;
  category: NotificationErrorCategory;
  message: string;
  details: Record<string, any>;
  timestamp: number;
  userId?: number;
  userAgent: string;
  url: string;
  stackTrace?: string;
  severity: ErrorSeverity;
  resolved: boolean;
  resolvedAt?: number;
  occurrenceCount: number;
  lastOccurrence: number;
}

export enum NotificationErrorType {
  // Push notification errors
  PUSH_SUBSCRIPTION_FAILED = 'push_subscription_failed',
  PUSH_PERMISSION_DENIED = 'push_permission_denied',
  PUSH_NOT_SUPPORTED = 'push_not_supported',
  VAPID_KEY_INVALID = 'vapid_key_invalid',
  SERVICE_WORKER_ERROR = 'service_worker_error',
  
  // Delivery errors
  NOTIFICATION_DELIVERY_FAILED = 'notification_delivery_failed',
  NOTIFICATION_DISPLAY_FAILED = 'notification_display_failed',
  NOTIFICATION_ACTION_FAILED = 'notification_action_failed',
  
  // API errors
  API_REQUEST_FAILED = 'api_request_failed',
  API_TIMEOUT = 'api_timeout',
  API_RATE_LIMITED = 'api_rate_limited',
  
  // Network errors
  NETWORK_OFFLINE = 'network_offline',
  NETWORK_TIMEOUT = 'network_timeout',
  NETWORK_CONNECTION_FAILED = 'network_connection_failed',
  
  // Performance errors
  PERFORMANCE_DEGRADATION = 'performance_degradation',
  MEMORY_LEAK = 'memory_leak',
  HIGH_CPU_USAGE = 'high_cpu_usage',
  
  // Browser compatibility errors
  BROWSER_NOT_SUPPORTED = 'browser_not_supported',
  FEATURE_NOT_AVAILABLE = 'feature_not_available',
  POLYFILL_FAILED = 'polyfill_failed'
}

export enum NotificationErrorCategory {
  SUBSCRIPTION = 'subscription',
  PERMISSION = 'permission',
  DELIVERY = 'delivery',
  PERFORMANCE = 'performance',
  NETWORK = 'network',
  COMPATIBILITY = 'compatibility',
  API = 'api'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Record<NotificationErrorType, number>;
  errorsByCategory: Record<NotificationErrorCategory, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorRate: number;
  averageResolutionTime: number;
  unresolvedErrors: number;
  recentErrors: NotificationError[];
}

export interface PerformanceMetrics {
  subscriptionTime: number;
  notificationDisplayTime: number;
  apiResponseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  errorRate: number;
  successRate: number;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: AlertCondition;
  threshold: number;
  timeWindow: number; // in minutes
  severity: ErrorSeverity;
  enabled: boolean;
  lastTriggered?: number;
  triggerCount: number;
}

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  value: number;
}

export interface Alert {
  id: string;
  ruleId: string;
  message: string;
  severity: ErrorSeverity;
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
  data: Record<string, any>;
}

/**
 * Main error monitoring class
 */
export class NotificationErrorMonitor {
  private static instance: NotificationErrorMonitor;
  private errors: Map<string, NotificationError> = new Map();
  private metrics: PerformanceMetrics = {
    subscriptionTime: 0,
    notificationDisplayTime: 0,
    apiResponseTime: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    networkLatency: 0,
    errorRate: 0,
    successRate: 100
  };
  private alertRules: Map<string, AlertRule> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private isMonitoring: boolean = false;
  private performanceObserver?: PerformanceObserver;
  private memoryMonitorInterval?: NodeJS.Timeout;

  private constructor() {
    this.initializeDefaultAlertRules();
  }

  static getInstance(): NotificationErrorMonitor {
    if (!NotificationErrorMonitor.instance) {
      NotificationErrorMonitor.instance = new NotificationErrorMonitor();
    }
    return NotificationErrorMonitor.instance;
  }

  /**
   * Start error monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.setupGlobalErrorHandlers();
    this.startPerformanceMonitoring();
    this.startMemoryMonitoring();
    
    console.log('Notification error monitoring started');
  }

  /**
   * Stop error monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    this.removeGlobalErrorHandlers();
    this.stopPerformanceMonitoring();
    this.stopMemoryMonitoring();
    
    console.log('Notification error monitoring stopped');
  }

  /**
   * Track a notification error
   */
  trackError(
    type: NotificationErrorType,
    message: string,
    details: Record<string, any> = {},
    userId?: number
  ): string {
    const errorId = this.generateErrorId();
    const category = this.getErrorCategory(type);
    const severity = this.getErrorSeverity(type);
    
    const existingError = this.findSimilarError(type, message);
    
    if (existingError) {
      // Update existing error
      existingError.occurrenceCount++;
      existingError.lastOccurrence = Date.now();
      existingError.details = { ...existingError.details, ...details };
      
      this.checkAlertRules(existingError);
      return existingError.id;
    }

    const error: NotificationError = {
      id: errorId,
      type,
      category,
      message,
      details,
      timestamp: Date.now(),
      userId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      stackTrace: new Error().stack,
      severity,
      resolved: false,
      occurrenceCount: 1,
      lastOccurrence: Date.now()
    };

    this.errors.set(errorId, error);
    this.updateMetrics();
    this.checkAlertRules(error);
    
    // Log error for debugging
    console.error(`Notification Error [${type}]:`, message, details);
    
    return errorId;
  }

  /**
   * Track push notification subscription errors
   */
  trackSubscriptionError(
    pushError: PushNotificationError,
    originalError: any,
    userId?: number
  ): string {
    const errorTypeMap: Record<PushNotificationError, NotificationErrorType> = {
      [PushNotificationError.PERMISSION_DENIED]: NotificationErrorType.PUSH_PERMISSION_DENIED,
      [PushNotificationError.NOT_SUPPORTED]: NotificationErrorType.PUSH_NOT_SUPPORTED,
      [PushNotificationError.SUBSCRIPTION_FAILED]: NotificationErrorType.PUSH_SUBSCRIPTION_FAILED,
      [PushNotificationError.VAPID_KEY_MISSING]: NotificationErrorType.VAPID_KEY_INVALID,
      [PushNotificationError.SERVICE_WORKER_ERROR]: NotificationErrorType.SERVICE_WORKER_ERROR,
      [PushNotificationError.NETWORK_ERROR]: NotificationErrorType.NETWORK_CONNECTION_FAILED
    };

    const errorType = errorTypeMap[pushError] || NotificationErrorType.PUSH_SUBSCRIPTION_FAILED;
    
    return this.trackError(
      errorType,
      originalError?.message || `Push notification error: ${pushError}`,
      {
        pushError,
        originalError: originalError?.toString(),
        browserInfo: this.getBrowserInfo(),
        subscriptionAttempt: true
      },
      userId
    );
  }

  /**
   * Track notification delivery errors
   */
  trackDeliveryError(
    notificationType: NotificationType,
    error: any,
    userId?: number
  ): string {
    return this.trackError(
      NotificationErrorType.NOTIFICATION_DELIVERY_FAILED,
      `Failed to deliver ${notificationType} notification: ${error?.message || 'Unknown error'}`,
      {
        notificationType,
        originalError: error?.toString(),
        deliveryAttempt: true
      },
      userId
    );
  }

  /**
   * Track API errors
   */
  trackApiError(
    endpoint: string,
    method: string,
    statusCode: number,
    error: any,
    userId?: number
  ): string {
    const errorType = statusCode === 429 
      ? NotificationErrorType.API_RATE_LIMITED 
      : NotificationErrorType.API_REQUEST_FAILED;

    return this.trackError(
      errorType,
      `API request failed: ${method} ${endpoint} (${statusCode})`,
      {
        endpoint,
        method,
        statusCode,
        responseError: error?.toString(),
        apiCall: true
      },
      userId
    );
  }

  /**
   * Track performance issues
   */
  trackPerformanceIssue(
    metric: string,
    value: number,
    threshold: number,
    userId?: number
  ): string {
    return this.trackError(
      NotificationErrorType.PERFORMANCE_DEGRADATION,
      `Performance degradation detected: ${metric} (${value}) exceeded threshold (${threshold})`,
      {
        metric,
        value,
        threshold,
        performanceIssue: true
      },
      userId
    );
  }

  /**
   * Mark error as resolved
   */
  resolveError(errorId: string): boolean {
    const error = this.errors.get(errorId);
    if (!error) return false;

    error.resolved = true;
    error.resolvedAt = Date.now();
    
    this.updateMetrics();
    return true;
  }

  /**
   * Get error metrics
   */
  getErrorMetrics(): ErrorMetrics {
    const errors = Array.from(this.errors.values());
    const recentErrors = errors
      .filter(e => Date.now() - e.timestamp < 24 * 60 * 60 * 1000) // Last 24 hours
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    const errorsByType = errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + error.occurrenceCount;
      return acc;
    }, {} as Record<NotificationErrorType, number>);

    const errorsByCategory = errors.reduce((acc, error) => {
      acc[error.category] = (acc[error.category] || 0) + error.occurrenceCount;
      return acc;
    }, {} as Record<NotificationErrorCategory, number>);

    const errorsBySeverity = errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + error.occurrenceCount;
      return acc;
    }, {} as Record<ErrorSeverity, number>);

    const totalOccurrences = errors.reduce((sum, error) => sum + error.occurrenceCount, 0);
    const resolvedErrors = errors.filter(e => e.resolved);
    const averageResolutionTime = resolvedErrors.length > 0
      ? resolvedErrors.reduce((sum, error) => {
          return sum + ((error.resolvedAt || 0) - error.timestamp);
        }, 0) / resolvedErrors.length
      : 0;

    return {
      totalErrors: errors.length,
      errorsByType,
      errorsByCategory,
      errorsBySeverity,
      errorRate: this.metrics.errorRate,
      averageResolutionTime,
      unresolvedErrors: errors.filter(e => !e.resolved).length,
      recentErrors
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.resolved)
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Add custom alert rule
   */
  addAlertRule(rule: Omit<AlertRule, 'id' | 'triggerCount'>): string {
    const ruleId = this.generateErrorId();
    const alertRule: AlertRule = {
      ...rule,
      id: ruleId,
      triggerCount: 0
    };
    
    this.alertRules.set(ruleId, alertRule);
    return ruleId;
  }

  /**
   * Remove alert rule
   */
  removeAlertRule(ruleId: string): boolean {
    return this.alertRules.delete(ruleId);
  }

  /**
   * Export error data for analysis
   */
  exportErrorData(): {
    errors: NotificationError[];
    metrics: PerformanceMetrics;
    alerts: Alert[];
    timestamp: number;
  } {
    return {
      errors: Array.from(this.errors.values()),
      metrics: this.metrics,
      alerts: Array.from(this.alerts.values()),
      timestamp: Date.now()
    };
  }

  // Private methods

  private initializeDefaultAlertRules(): void {
    // High error rate alert
    this.addAlertRule({
      name: 'High Error Rate',
      condition: { metric: 'errorRate', operator: 'gt', value: 10 },
      threshold: 10,
      timeWindow: 5,
      severity: ErrorSeverity.HIGH,
      enabled: true
    });

    // Critical subscription failures
    this.addAlertRule({
      name: 'Critical Subscription Failures',
      condition: { metric: 'subscriptionFailures', operator: 'gt', value: 5 },
      threshold: 5,
      timeWindow: 10,
      severity: ErrorSeverity.CRITICAL,
      enabled: true
    });

    // Performance degradation
    this.addAlertRule({
      name: 'Performance Degradation',
      condition: { metric: 'averageResponseTime', operator: 'gt', value: 5000 },
      threshold: 5000,
      timeWindow: 15,
      severity: ErrorSeverity.MEDIUM,
      enabled: true
    });
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      if (this.isNotificationRelatedError(event.reason)) {
        this.trackError(
          NotificationErrorType.API_REQUEST_FAILED,
          `Unhandled promise rejection: ${event.reason?.message || 'Unknown error'}`,
          {
            reason: event.reason?.toString(),
            unhandledRejection: true
          }
        );
      }
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      if (this.isNotificationRelatedError(event.error)) {
        this.trackError(
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
      }
    });
  }

  private removeGlobalErrorHandlers(): void {
    // Error handlers are automatically removed when the page unloads
    // This is a placeholder for cleanup if needed
  }

  private startPerformanceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name.includes('notification') || entry.name.includes('push')) {
            this.updatePerformanceMetrics(entry);
          }
        });
      });

      this.performanceObserver.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
    }
  }

  private stopPerformanceMonitoring(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = undefined;
    }
  }

  private startMemoryMonitoring(): void {
    this.memoryMonitorInterval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = memory.usedJSHeapSize;
        
        // Check for memory leaks
        if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
          this.trackError(
            NotificationErrorType.MEMORY_LEAK,
            'High memory usage detected',
            {
              usedHeapSize: memory.usedJSHeapSize,
              heapSizeLimit: memory.jsHeapSizeLimit,
              memoryPressure: true
            }
          );
        }
      }
    }, 30000); // Check every 30 seconds
  }

  private stopMemoryMonitoring(): void {
    if (this.memoryMonitorInterval) {
      clearInterval(this.memoryMonitorInterval);
      this.memoryMonitorInterval = undefined;
    }
  }

  private updatePerformanceMetrics(entry: PerformanceEntry): void {
    if (entry.name.includes('subscription')) {
      this.metrics.subscriptionTime = entry.duration;
    } else if (entry.name.includes('notification-display')) {
      this.metrics.notificationDisplayTime = entry.duration;
    } else if (entry.name.includes('api')) {
      this.metrics.apiResponseTime = entry.duration;
    }
  }

  private updateMetrics(): void {
    const errors = Array.from(this.errors.values());
    const recentErrors = errors.filter(e => Date.now() - e.timestamp < 60 * 60 * 1000); // Last hour
    const totalOperations = 100; // This should be tracked separately
    
    this.metrics.errorRate = (recentErrors.length / totalOperations) * 100;
    this.metrics.successRate = 100 - this.metrics.errorRate;
  }

  private checkAlertRules(error: NotificationError): void {
    this.alertRules.forEach((rule) => {
      if (!rule.enabled) return;

      const shouldTrigger = this.evaluateAlertCondition(rule, error);
      if (shouldTrigger) {
        this.triggerAlert(rule, error);
      }
    });
  }

  private evaluateAlertCondition(rule: AlertRule, error: NotificationError): boolean {
    // Simple evaluation - in a real implementation, this would be more sophisticated
    const timeWindow = rule.timeWindow * 60 * 1000; // Convert to milliseconds
    const recentErrors = Array.from(this.errors.values())
      .filter(e => Date.now() - e.timestamp < timeWindow);

    switch (rule.condition.metric) {
      case 'errorRate':
        return recentErrors.length > rule.threshold;
      case 'subscriptionFailures':
        return recentErrors.filter(e => e.category === NotificationErrorCategory.SUBSCRIPTION).length > rule.threshold;
      default:
        return false;
    }
  }

  private triggerAlert(rule: AlertRule, error: NotificationError): void {
    const alertId = this.generateErrorId();
    const alert: Alert = {
      id: alertId,
      ruleId: rule.id,
      message: `Alert: ${rule.name} - ${error.message}`,
      severity: rule.severity,
      timestamp: Date.now(),
      resolved: false,
      data: {
        errorId: error.id,
        errorType: error.type,
        errorCategory: error.category
      }
    };

    this.alerts.set(alertId, alert);
    rule.triggerCount++;
    rule.lastTriggered = Date.now();

    // Log alert
    console.warn(`Notification Alert [${rule.name}]:`, alert.message);
    
    // In a real implementation, this would send notifications to administrators
    this.sendAlertNotification(alert);
  }

  private sendAlertNotification(alert: Alert): void {
    // This would integrate with external alerting systems
    // For now, just log to console
    console.error('NOTIFICATION SYSTEM ALERT:', {
      id: alert.id,
      message: alert.message,
      severity: alert.severity,
      timestamp: new Date(alert.timestamp).toISOString()
    });
  }

  private findSimilarError(type: NotificationErrorType, message: string): NotificationError | undefined {
    return Array.from(this.errors.values()).find(error => 
      error.type === type && 
      error.message === message &&
      Date.now() - error.timestamp < 60 * 60 * 1000 // Within last hour
    );
  }

  private getErrorCategory(type: NotificationErrorType): NotificationErrorCategory {
    const categoryMap: Record<NotificationErrorType, NotificationErrorCategory> = {
      [NotificationErrorType.PUSH_SUBSCRIPTION_FAILED]: NotificationErrorCategory.SUBSCRIPTION,
      [NotificationErrorType.PUSH_PERMISSION_DENIED]: NotificationErrorCategory.PERMISSION,
      [NotificationErrorType.PUSH_NOT_SUPPORTED]: NotificationErrorCategory.COMPATIBILITY,
      [NotificationErrorType.VAPID_KEY_INVALID]: NotificationErrorCategory.SUBSCRIPTION,
      [NotificationErrorType.SERVICE_WORKER_ERROR]: NotificationErrorCategory.COMPATIBILITY,
      [NotificationErrorType.NOTIFICATION_DELIVERY_FAILED]: NotificationErrorCategory.DELIVERY,
      [NotificationErrorType.NOTIFICATION_DISPLAY_FAILED]: NotificationErrorCategory.DELIVERY,
      [NotificationErrorType.NOTIFICATION_ACTION_FAILED]: NotificationErrorCategory.DELIVERY,
      [NotificationErrorType.API_REQUEST_FAILED]: NotificationErrorCategory.API,
      [NotificationErrorType.API_TIMEOUT]: NotificationErrorCategory.API,
      [NotificationErrorType.API_RATE_LIMITED]: NotificationErrorCategory.API,
      [NotificationErrorType.NETWORK_OFFLINE]: NotificationErrorCategory.NETWORK,
      [NotificationErrorType.NETWORK_TIMEOUT]: NotificationErrorCategory.NETWORK,
      [NotificationErrorType.NETWORK_CONNECTION_FAILED]: NotificationErrorCategory.NETWORK,
      [NotificationErrorType.PERFORMANCE_DEGRADATION]: NotificationErrorCategory.PERFORMANCE,
      [NotificationErrorType.MEMORY_LEAK]: NotificationErrorCategory.PERFORMANCE,
      [NotificationErrorType.HIGH_CPU_USAGE]: NotificationErrorCategory.PERFORMANCE,
      [NotificationErrorType.BROWSER_NOT_SUPPORTED]: NotificationErrorCategory.COMPATIBILITY,
      [NotificationErrorType.FEATURE_NOT_AVAILABLE]: NotificationErrorCategory.COMPATIBILITY,
      [NotificationErrorType.POLYFILL_FAILED]: NotificationErrorCategory.COMPATIBILITY
    };

    return categoryMap[type] || NotificationErrorCategory.API;
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

  private isNotificationRelatedError(error: any): boolean {
    if (!error) return false;
    
    const errorString = error.toString().toLowerCase();
    const notificationKeywords = [
      'notification', 'push', 'subscription', 'vapid', 'service worker',
      'sw.js', 'firebase', 'fcm', 'webpush'
    ];
    
    return notificationKeywords.some(keyword => errorString.includes(keyword));
  }

  private getBrowserInfo(): Record<string, any> {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      serviceWorkerSupported: 'serviceWorker' in navigator,
      pushSupported: 'PushManager' in window,
      notificationSupported: 'Notification' in window
    };
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const notificationErrorMonitor = NotificationErrorMonitor.getInstance();

// Convenience functions
export const trackNotificationError = (
  type: NotificationErrorType,
  message: string,
  details?: Record<string, any>,
  userId?: number
): string => {
  return notificationErrorMonitor.trackError(type, message, details, userId);
};

export const trackSubscriptionError = (
  pushError: PushNotificationError,
  originalError: any,
  userId?: number
): string => {
  return notificationErrorMonitor.trackSubscriptionError(pushError, originalError, userId);
};

export const trackDeliveryError = (
  notificationType: NotificationType,
  error: any,
  userId?: number
): string => {
  return notificationErrorMonitor.trackDeliveryError(notificationType, error, userId);
};

export const trackApiError = (
  endpoint: string,
  method: string,
  statusCode: number,
  error: any,
  userId?: number
): string => {
  return notificationErrorMonitor.trackApiError(endpoint, method, statusCode, error, userId);
};

export const startErrorMonitoring = (): void => {
  notificationErrorMonitor.startMonitoring();
};

export const stopErrorMonitoring = (): void => {
  notificationErrorMonitor.stopMonitoring();
};

export const getErrorMetrics = (): ErrorMetrics => {
  return notificationErrorMonitor.getErrorMetrics();
};

export const getPerformanceMetrics = (): PerformanceMetrics => {
  return notificationErrorMonitor.getPerformanceMetrics();
};

export const getActiveAlerts = (): Alert[] => {
  return notificationErrorMonitor.getActiveAlerts();
};