'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  notificationErrorMonitor,
  NotificationErrorType,
  ErrorMetrics,
  PerformanceMetrics,
  Alert,
  AlertRule,
  ErrorSeverity,
  trackNotificationError,
  trackSubscriptionError,
  trackDeliveryError,
  trackApiError,
  startErrorMonitoring,
  stopErrorMonitoring,
  getErrorMetrics,
  getPerformanceMetrics,
  getActiveAlerts
} from '../lib/notifications/error-monitoring';
import { PushNotificationError, NotificationType } from '../types/notifications';
import { useAuth } from './useAuth';

export interface NotificationErrorMonitoringState {
  isMonitoring: boolean;
  errorMetrics: ErrorMetrics | null;
  performanceMetrics: PerformanceMetrics | null;
  activeAlerts: Alert[];
  isLoading: boolean;
  error: string | null;
}

export interface NotificationErrorMonitoringActions {
  startMonitoring: () => void;
  stopMonitoring: () => void;
  trackError: (type: NotificationErrorType, message: string, details?: Record<string, any>) => string;
  trackSubscriptionError: (pushError: PushNotificationError, originalError: any) => string;
  trackDeliveryError: (notificationType: NotificationType, error: any) => string;
  trackApiError: (endpoint: string, method: string, statusCode: number, error: any) => string;
  resolveError: (errorId: string) => boolean;
  resolveAlert: (alertId: string) => boolean;
  addAlertRule: (rule: Omit<AlertRule, 'id' | 'triggerCount'>) => string;
  removeAlertRule: (ruleId: string) => boolean;
  refreshMetrics: () => void;
  exportErrorData: () => any;
  clearError: () => void;
}

export interface UseNotificationErrorMonitoringReturn 
  extends NotificationErrorMonitoringState, 
          NotificationErrorMonitoringActions {}

/**
 * Hook for notification error monitoring and alerting
 */
export function useNotificationErrorMonitoring(): UseNotificationErrorMonitoringReturn {
  const { user } = useAuth();
  const [state, setState] = useState<NotificationErrorMonitoringState>({
    isMonitoring: false,
    errorMetrics: null,
    performanceMetrics: null,
    activeAlerts: [],
    isLoading: false,
    error: null
  });

  const metricsUpdateInterval = useRef<NodeJS.Timeout>();
  const alertCheckInterval = useRef<NodeJS.Timeout>();

  const updateState = useCallback((updates: Partial<NotificationErrorMonitoringState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const setError = useCallback((error: string | null) => {
    updateState({ error, isLoading: false });
  }, [updateState]);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  /**
   * Start error monitoring
   */
  const handleStartMonitoring = useCallback(() => {
    try {
      startErrorMonitoring();
      updateState({ isMonitoring: true, error: null });
      
      // Start periodic metrics updates
      metricsUpdateInterval.current = setInterval(() => {
        refreshMetrics();
      }, 30000); // Update every 30 seconds

      // Start periodic alert checks
      alertCheckInterval.current = setInterval(() => {
        const alerts = getActiveAlerts();
        updateState({ activeAlerts: alerts });
      }, 10000); // Check every 10 seconds

      console.log('Notification error monitoring started');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start monitoring';
      setError(errorMessage);
    }
  }, [updateState, setError]);

  /**
   * Stop error monitoring
   */
  const handleStopMonitoring = useCallback(() => {
    try {
      stopErrorMonitoring();
      updateState({ isMonitoring: false, error: null });

      // Clear intervals
      if (metricsUpdateInterval.current) {
        clearInterval(metricsUpdateInterval.current);
        metricsUpdateInterval.current = undefined;
      }

      if (alertCheckInterval.current) {
        clearInterval(alertCheckInterval.current);
        alertCheckInterval.current = undefined;
      }

      console.log('Notification error monitoring stopped');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to stop monitoring';
      setError(errorMessage);
    }
  }, [updateState, setError]);

  /**
   * Track a notification error
   */
  const handleTrackError = useCallback((
    type: NotificationErrorType,
    message: string,
    details: Record<string, any> = {}
  ): string => {
    try {
      return trackNotificationError(type, message, details, user?.id);
    } catch (error) {
      console.error('Failed to track error:', error);
      return '';
    }
  }, [user?.id]);

  /**
   * Track subscription error
   */
  const handleTrackSubscriptionError = useCallback((
    pushError: PushNotificationError,
    originalError: any
  ): string => {
    try {
      return trackSubscriptionError(pushError, originalError, user?.id);
    } catch (error) {
      console.error('Failed to track subscription error:', error);
      return '';
    }
  }, [user?.id]);

  /**
   * Track delivery error
   */
  const handleTrackDeliveryError = useCallback((
    notificationType: NotificationType,
    error: any
  ): string => {
    try {
      return trackDeliveryError(notificationType, error, user?.id);
    } catch (error) {
      console.error('Failed to track delivery error:', error);
      return '';
    }
  }, [user?.id]);

  /**
   * Track API error
   */
  const handleTrackApiError = useCallback((
    endpoint: string,
    method: string,
    statusCode: number,
    error: any
  ): string => {
    try {
      return trackApiError(endpoint, method, statusCode, error, user?.id);
    } catch (error) {
      console.error('Failed to track API error:', error);
      return '';
    }
  }, [user?.id]);

  /**
   * Resolve an error
   */
  const resolveError = useCallback((errorId: string): boolean => {
    try {
      const success = notificationErrorMonitor.resolveError(errorId);
      if (success) {
        refreshMetrics();
      }
      return success;
    } catch (error) {
      console.error('Failed to resolve error:', error);
      return false;
    }
  }, []);

  /**
   * Resolve an alert
   */
  const resolveAlert = useCallback((alertId: string): boolean => {
    try {
      const alerts = getActiveAlerts();
      const alert = alerts.find(a => a.id === alertId);
      if (alert) {
        alert.resolved = true;
        alert.resolvedAt = Date.now();
        updateState({ activeAlerts: alerts.filter(a => a.id !== alertId) });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      return false;
    }
  }, [updateState]);

  /**
   * Add custom alert rule
   */
  const addAlertRule = useCallback((rule: Omit<AlertRule, 'id' | 'triggerCount'>): string => {
    try {
      return notificationErrorMonitor.addAlertRule(rule);
    } catch (error) {
      console.error('Failed to add alert rule:', error);
      return '';
    }
  }, []);

  /**
   * Remove alert rule
   */
  const removeAlertRule = useCallback((ruleId: string): boolean => {
    try {
      return notificationErrorMonitor.removeAlertRule(ruleId);
    } catch (error) {
      console.error('Failed to remove alert rule:', error);
      return false;
    }
  }, []);

  /**
   * Refresh metrics
   */
  const refreshMetrics = useCallback(() => {
    try {
      const errorMetrics = getErrorMetrics();
      const performanceMetrics = getPerformanceMetrics();
      const activeAlerts = getActiveAlerts();

      updateState({
        errorMetrics,
        performanceMetrics,
        activeAlerts
      });
    } catch (error) {
      console.error('Failed to refresh metrics:', error);
    }
  }, [updateState]);

  /**
   * Export error data
   */
  const exportErrorData = useCallback(() => {
    try {
      return notificationErrorMonitor.exportErrorData();
    } catch (error) {
      console.error('Failed to export error data:', error);
      return null;
    }
  }, []);

  // Initialize monitoring on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      handleStartMonitoring();
    }

    return () => {
      handleStopMonitoring();
    };
  }, [handleStartMonitoring, handleStopMonitoring]);

  // Initial metrics load
  useEffect(() => {
    if (state.isMonitoring) {
      refreshMetrics();
    }
  }, [state.isMonitoring, refreshMetrics]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (metricsUpdateInterval.current) {
        clearInterval(metricsUpdateInterval.current);
      }
      if (alertCheckInterval.current) {
        clearInterval(alertCheckInterval.current);
      }
    };
  }, []);

  return {
    // State
    ...state,

    // Actions
    startMonitoring: handleStartMonitoring,
    stopMonitoring: handleStopMonitoring,
    trackError: handleTrackError,
    trackSubscriptionError: handleTrackSubscriptionError,
    trackDeliveryError: handleTrackDeliveryError,
    trackApiError: handleTrackApiError,
    resolveError,
    resolveAlert,
    addAlertRule,
    removeAlertRule,
    refreshMetrics,
    exportErrorData,
    clearError
  };
}

/**
 * Hook for error tracking only (lightweight version)
 */
export function useNotificationErrorTracking() {
  const { user } = useAuth();

  const trackError = useCallback((
    type: NotificationErrorType,
    message: string,
    details?: Record<string, any>
  ): string => {
    return trackNotificationError(type, message, details, user?.id);
  }, [user?.id]);

  const trackSubscriptionError = useCallback((
    pushError: PushNotificationError,
    originalError: any
  ): string => {
    return trackSubscriptionError(pushError, originalError, user?.id);
  }, [user?.id]);

  const trackDeliveryError = useCallback((
    notificationType: NotificationType,
    error: any
  ): string => {
    return trackDeliveryError(notificationType, error, user?.id);
  }, [user?.id]);

  const trackApiError = useCallback((
    endpoint: string,
    method: string,
    statusCode: number,
    error: any
  ): string => {
    return trackApiError(endpoint, method, statusCode, error, user?.id);
  }, [user?.id]);

  return {
    trackError,
    trackSubscriptionError,
    trackDeliveryError,
    trackApiError
  };
}

/**
 * Hook for monitoring metrics only
 */
export function useNotificationMetrics() {
  const [metrics, setMetrics] = useState<{
    errorMetrics: ErrorMetrics | null;
    performanceMetrics: PerformanceMetrics | null;
  }>({
    errorMetrics: null,
    performanceMetrics: null
  });

  const refreshMetrics = useCallback(() => {
    try {
      const errorMetrics = getErrorMetrics();
      const performanceMetrics = getPerformanceMetrics();
      setMetrics({ errorMetrics, performanceMetrics });
    } catch (error) {
      console.error('Failed to refresh metrics:', error);
    }
  }, []);

  useEffect(() => {
    refreshMetrics();
    const interval = setInterval(refreshMetrics, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [refreshMetrics]);

  return {
    ...metrics,
    refreshMetrics
  };
}

/**
 * Hook for alert management
 */
export function useNotificationAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const refreshAlerts = useCallback(() => {
    try {
      const activeAlerts = getActiveAlerts();
      setAlerts(activeAlerts);
    } catch (error) {
      console.error('Failed to refresh alerts:', error);
    }
  }, []);

  const resolveAlert = useCallback((alertId: string): boolean => {
    try {
      const alert = alerts.find(a => a.id === alertId);
      if (alert) {
        alert.resolved = true;
        alert.resolvedAt = Date.now();
        setAlerts(prev => prev.filter(a => a.id !== alertId));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      return false;
    }
  }, [alerts]);

  const addAlertRule = useCallback((rule: Omit<AlertRule, 'id' | 'triggerCount'>): string => {
    try {
      return notificationErrorMonitor.addAlertRule(rule);
    } catch (error) {
      console.error('Failed to add alert rule:', error);
      return '';
    }
  }, []);

  const removeAlertRule = useCallback((ruleId: string): boolean => {
    try {
      return notificationErrorMonitor.removeAlertRule(ruleId);
    } catch (error) {
      console.error('Failed to remove alert rule:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    refreshAlerts();
    const interval = setInterval(refreshAlerts, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [refreshAlerts]);

  return {
    alerts,
    refreshAlerts,
    resolveAlert,
    addAlertRule,
    removeAlertRule
  };
}