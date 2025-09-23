/**
 * @jest-environment jsdom
 */

import {
  NotificationErrorMonitor,
  NotificationErrorType,
  NotificationErrorCategory,
  ErrorSeverity,
  trackNotificationError,
  trackSubscriptionError,
  trackDeliveryError,
  trackApiError
} from '../error-monitoring';
import { PushNotificationError, NotificationType } from '../../../types/notifications';

// Mock navigator and window objects
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    onLine: true
  },
  writable: true
});

Object.defineProperty(window, 'location', {
  value: {
    href: 'https://example.com/test'
  },
  writable: true
});

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    memory: {
      usedJSHeapSize: 1000000,
      jsHeapSizeLimit: 10000000
    }
  },
  writable: true
});

describe('NotificationErrorMonitor', () => {
  let monitor: NotificationErrorMonitor;

  beforeEach(() => {
    // Get fresh instance for each test
    monitor = NotificationErrorMonitor.getInstance();
    // Clear any existing errors
    monitor['errors'].clear();
    monitor['alerts'].clear();
  });

  afterEach(() => {
    monitor.stopMonitoring();
  });

  describe('Error Tracking', () => {
    it('should track basic notification errors', () => {
      const errorId = monitor.trackError(
        NotificationErrorType.PUSH_SUBSCRIPTION_FAILED,
        'Test error message',
        { testDetail: 'test value' }
      );

      expect(errorId).toBeDefined();
      expect(errorId).toMatch(/^error_\d+_[a-z0-9]+$/);

      const metrics = monitor.getErrorMetrics();
      expect(metrics.totalErrors).toBe(1);
      expect(metrics.errorsByType[NotificationErrorType.PUSH_SUBSCRIPTION_FAILED]).toBe(1);
      expect(metrics.errorsByCategory[NotificationErrorCategory.SUBSCRIPTION]).toBe(1);
    });

    it('should track subscription errors', () => {
      const errorId = trackSubscriptionError(
        PushNotificationError.PERMISSION_DENIED,
        new Error('Permission denied'),
        123
      );

      expect(errorId).toBeDefined();

      const metrics = monitor.getErrorMetrics();
      expect(metrics.totalErrors).toBe(1);
      expect(metrics.errorsByType[NotificationErrorType.PUSH_PERMISSION_DENIED]).toBe(1);
    });

    it('should track delivery errors', () => {
      const errorId = trackDeliveryError(
        NotificationType.ASSIGNMENT_CHANGE,
        new Error('Delivery failed'),
        123
      );

      expect(errorId).toBeDefined();

      const metrics = monitor.getErrorMetrics();
      expect(metrics.totalErrors).toBe(1);
      expect(metrics.errorsByType[NotificationErrorType.NOTIFICATION_DELIVERY_FAILED]).toBe(1);
    });

    it('should track API errors', () => {
      const errorId = trackApiError(
        '/api/notifications',
        'GET',
        500,
        new Error('Server error'),
        123
      );

      expect(errorId).toBeDefined();

      const metrics = monitor.getErrorMetrics();
      expect(metrics.totalErrors).toBe(1);
      expect(metrics.errorsByType[NotificationErrorType.API_REQUEST_FAILED]).toBe(1);
    });

    it('should handle duplicate errors by incrementing occurrence count', () => {
      const errorId1 = monitor.trackError(
        NotificationErrorType.PUSH_SUBSCRIPTION_FAILED,
        'Same error message'
      );

      const errorId2 = monitor.trackError(
        NotificationErrorType.PUSH_SUBSCRIPTION_FAILED,
        'Same error message'
      );

      expect(errorId1).toBe(errorId2);

      const metrics = monitor.getErrorMetrics();
      expect(metrics.totalErrors).toBe(1);
      
      const errors = Array.from(monitor['errors'].values());
      expect(errors[0].occurrenceCount).toBe(2);
    });
  });

  describe('Error Resolution', () => {
    it('should resolve errors correctly', () => {
      const errorId = monitor.trackError(
        NotificationErrorType.PUSH_SUBSCRIPTION_FAILED,
        'Test error'
      );

      const resolved = monitor.resolveError(errorId);
      expect(resolved).toBe(true);

      const metrics = monitor.getErrorMetrics();
      expect(metrics.unresolvedErrors).toBe(0);
    });

    it('should return false for non-existent error IDs', () => {
      const resolved = monitor.resolveError('non-existent-id');
      expect(resolved).toBe(false);
    });
  });

  describe('Performance Metrics', () => {
    it('should return performance metrics', () => {
      const metrics = monitor.getPerformanceMetrics();

      expect(metrics).toHaveProperty('subscriptionTime');
      expect(metrics).toHaveProperty('notificationDisplayTime');
      expect(metrics).toHaveProperty('apiResponseTime');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('errorRate');
      expect(metrics).toHaveProperty('successRate');
    });

    it('should track performance issues', () => {
      const errorId = monitor.trackPerformanceIssue(
        'subscriptionTime',
        5000,
        3000,
        123
      );

      expect(errorId).toBeDefined();

      const metrics = monitor.getErrorMetrics();
      expect(metrics.errorsByType[NotificationErrorType.PERFORMANCE_DEGRADATION]).toBe(1);
    });
  });

  describe('Alert System', () => {
    it('should create default alert rules', () => {
      monitor.startMonitoring();
      
      const alertRules = monitor['alertRules'];
      expect(alertRules.size).toBeGreaterThan(0);
    });

    it('should add custom alert rules', () => {
      const ruleId = monitor.addAlertRule({
        name: 'Test Rule',
        condition: { metric: 'errorRate', operator: 'gt', value: 5 },
        threshold: 5,
        timeWindow: 10,
        severity: ErrorSeverity.HIGH,
        enabled: true
      });

      expect(ruleId).toBeDefined();
      expect(monitor['alertRules'].has(ruleId)).toBe(true);
    });

    it('should remove alert rules', () => {
      const ruleId = monitor.addAlertRule({
        name: 'Test Rule',
        condition: { metric: 'errorRate', operator: 'gt', value: 5 },
        threshold: 5,
        timeWindow: 10,
        severity: ErrorSeverity.HIGH,
        enabled: true
      });

      const removed = monitor.removeAlertRule(ruleId);
      expect(removed).toBe(true);
      expect(monitor['alertRules'].has(ruleId)).toBe(false);
    });
  });

  describe('Error Categories and Severity', () => {
    it('should categorize errors correctly', () => {
      monitor.trackError(NotificationErrorType.PUSH_SUBSCRIPTION_FAILED, 'Test');
      monitor.trackError(NotificationErrorType.API_REQUEST_FAILED, 'Test');
      monitor.trackError(NotificationErrorType.NETWORK_OFFLINE, 'Test');

      const metrics = monitor.getErrorMetrics();
      expect(metrics.errorsByCategory[NotificationErrorCategory.SUBSCRIPTION]).toBe(1);
      expect(metrics.errorsByCategory[NotificationErrorCategory.API]).toBe(1);
      expect(metrics.errorsByCategory[NotificationErrorCategory.NETWORK]).toBe(1);
    });

    it('should assign severity levels correctly', () => {
      monitor.trackError(NotificationErrorType.VAPID_KEY_INVALID, 'Critical error');
      monitor.trackError(NotificationErrorType.PUSH_SUBSCRIPTION_FAILED, 'High error');
      monitor.trackError(NotificationErrorType.API_REQUEST_FAILED, 'Medium error');
      monitor.trackError(NotificationErrorType.PUSH_NOT_SUPPORTED, 'Low error');

      const metrics = monitor.getErrorMetrics();
      expect(metrics.errorsBySeverity[ErrorSeverity.CRITICAL]).toBe(1);
      expect(metrics.errorsBySeverity[ErrorSeverity.HIGH]).toBe(1);
      expect(metrics.errorsBySeverity[ErrorSeverity.MEDIUM]).toBe(1);
      expect(metrics.errorsBySeverity[ErrorSeverity.LOW]).toBe(1);
    });
  });

  describe('Data Export', () => {
    it('should export error data correctly', () => {
      monitor.trackError(NotificationErrorType.PUSH_SUBSCRIPTION_FAILED, 'Test error');
      
      const exportData = monitor.exportErrorData();
      
      expect(exportData).toHaveProperty('errors');
      expect(exportData).toHaveProperty('metrics');
      expect(exportData).toHaveProperty('alerts');
      expect(exportData).toHaveProperty('timestamp');
      
      expect(exportData.errors).toHaveLength(1);
      expect(exportData.errors[0].message).toBe('Test error');
    });
  });

  describe('Monitoring Lifecycle', () => {
    it('should start and stop monitoring', () => {
      expect(monitor['isMonitoring']).toBe(false);
      
      monitor.startMonitoring();
      expect(monitor['isMonitoring']).toBe(true);
      
      monitor.stopMonitoring();
      expect(monitor['isMonitoring']).toBe(false);
    });
  });

  describe('Error Filtering and Recent Errors', () => {
    it('should return recent errors in metrics', () => {
      // Create some errors
      monitor.trackError(NotificationErrorType.PUSH_SUBSCRIPTION_FAILED, 'Error 1');
      monitor.trackError(NotificationErrorType.API_REQUEST_FAILED, 'Error 2');
      monitor.trackError(NotificationErrorType.NETWORK_OFFLINE, 'Error 3');

      const metrics = monitor.getErrorMetrics();
      expect(metrics.recentErrors).toHaveLength(3);
      expect(metrics.recentErrors[0].message).toBe('Error 3'); // Most recent first
    });

    it('should limit recent errors to 10', () => {
      // Create more than 10 errors
      for (let i = 0; i < 15; i++) {
        monitor.trackError(NotificationErrorType.API_REQUEST_FAILED, `Error ${i}`);
      }

      const metrics = monitor.getErrorMetrics();
      expect(metrics.recentErrors).toHaveLength(10);
    });
  });
});

describe('Convenience Functions', () => {
  beforeEach(() => {
    const monitor = NotificationErrorMonitor.getInstance();
    monitor['errors'].clear();
    monitor['alerts'].clear();
  });

  it('should track notification errors via convenience function', () => {
    const errorId = trackNotificationError(
      NotificationErrorType.PUSH_SUBSCRIPTION_FAILED,
      'Test error',
      { test: true },
      123
    );

    expect(errorId).toBeDefined();
  });

  it('should track subscription errors via convenience function', () => {
    const errorId = trackSubscriptionError(
      PushNotificationError.PERMISSION_DENIED,
      new Error('Permission denied'),
      123
    );

    expect(errorId).toBeDefined();
  });

  it('should track delivery errors via convenience function', () => {
    const errorId = trackDeliveryError(
      NotificationType.ASSIGNMENT_CHANGE,
      new Error('Delivery failed'),
      123
    );

    expect(errorId).toBeDefined();
  });

  it('should track API errors via convenience function', () => {
    const errorId = trackApiError(
      '/api/test',
      'POST',
      500,
      new Error('Server error'),
      123
    );

    expect(errorId).toBeDefined();
  });
});

describe('Error Monitoring Integration', () => {
  it('should handle browser compatibility issues', () => {
    // Mock unsupported browser
    const originalPushManager = window.PushManager;
    delete (window as any).PushManager;

    const errorId = trackNotificationError(
      NotificationErrorType.BROWSER_NOT_SUPPORTED,
      'Push notifications not supported'
    );

    expect(errorId).toBeDefined();

    // Restore
    (window as any).PushManager = originalPushManager;
  });

  it('should handle network errors gracefully', () => {
    // Mock offline state
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true
    });

    const errorId = trackNotificationError(
      NotificationErrorType.NETWORK_OFFLINE,
      'Network is offline'
    );

    expect(errorId).toBeDefined();

    // Restore
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true
    });
  });
});