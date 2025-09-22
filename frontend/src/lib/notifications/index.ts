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