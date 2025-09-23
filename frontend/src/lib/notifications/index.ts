export {
  NotificationRealTimeManager,
  notificationRealTimeManager,
  type NotificationEventHandler,
  type NotificationUpdateHandler,
  type ConnectionStatusHandler,
  type ErrorHandler,
  type ReconnectionConfig,
  type NotificationRealTimeManagerConfig,
} from './real-time-manager';

export {
  NotificationWebSocketManager,
  notificationWebSocketManager,
  type WebSocketManagerConfig,
} from './websocket-manager';

export {
  UnifiedNotificationManager,
  unifiedNotificationManager,
  type ConnectionType,
  type UnifiedManagerConfig,
} from './unified-manager';

// Re-export notification types for convenience
export type {
  Notification,
  NotificationAction,
  NotificationType,
  NotificationCategory,
  NotificationSettings,
  PushSubscriptionData,
  NotificationEventData,
  NotificationListResponse,
  NotificationQueryParams,
  BulkNotificationOperation,
  BulkOperationResult,
  NotificationStats,
  PushNotificationPayload,
  DeviceTokenRegistration,
  PushNotificationError,
} from '../../types/notifications';

// Re-export validation functions
export {
  validateNotification,
  validateNotificationSettings,
  validatePushSubscriptionData,
  validatePushNotificationPayload,
  validateNotificationListResponse,
  validateNotificationQueryParams,
  validateBulkNotificationOperation,
  isNotificationType,
  isNotificationCategory,
  isPushNotificationError,
} from '../../types/notifications';

// Re-export notification service
export { notificationService, NotificationService } from '../api/services/notification.service';

// Export error monitoring
export {
  NotificationErrorMonitor,
  notificationErrorMonitor,
  trackNotificationError,
  trackSubscriptionError,
  trackDeliveryError,
  trackApiError,
  startErrorMonitoring,
  stopErrorMonitoring,
  getErrorMetrics,
  getPerformanceMetrics,
  getActiveAlerts,
  type NotificationError,
  type ErrorMetrics,
  type PerformanceMetrics,
  type Alert,
  type AlertRule,
  NotificationErrorType,
  NotificationErrorCategory,
  ErrorSeverity,
} from './error-monitoring';

// Export service worker error monitoring
export {
  ServiceWorkerErrorMonitor,
  serviceWorkerErrorMonitor,
  setupServiceWorkerErrorMonitoring,
  createMonitoredPushHandler,
  createMonitoredNotificationClickHandler,
  createMonitoredSyncHandler,
  trackServiceWorkerError,
  trackPushError,
  trackNotificationDisplayError,
  trackNotificationActionError,
  trackSyncError,
  type ServiceWorkerError,
} from './service-worker-error-monitoring';