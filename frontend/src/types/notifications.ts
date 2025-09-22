// Push notification data models and TypeScript interfaces

export interface Notification {
  id: string;
  userId: number;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  priority: 'high' | 'normal' | 'low';
  category: NotificationCategory;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
  expiresAt?: string;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  title: string;
  action: string;
  icon?: string;
  url?: string;
}

export enum NotificationType {
  ASSIGNMENT_CHANGE = 'assignment_change',
  GRADE_UPDATE = 'grade_update',
  SCHEDULE_REMINDER = 'schedule_reminder',
  DOCUMENT_UPDATE = 'document_update',
  DEADLINE_REMINDER = 'deadline_reminder',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  EVALUATION_REQUEST = 'evaluation_request',
  VISIT_SCHEDULED = 'visit_scheduled'
}

export enum NotificationCategory {
  ACADEMIC = 'academic',
  ADMINISTRATIVE = 'administrative',
  SYSTEM = 'system',
  REMINDER = 'reminder'
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userId: number;
  deviceInfo: {
    userAgent: string;
    platform: string;
    isMobile: boolean;
  };
}

export interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  types: Record<NotificationType, boolean>;
  frequency: 'immediate' | 'daily' | 'weekly';
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  sound: boolean;
  vibration: boolean;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, any>;
  actions?: NotificationAction[];
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp?: number;
}

export interface DeviceTokenRegistration {
  subscription: PushSubscriptionData;
  userAgent: string;
  platform: string;
  isMobile: boolean;
}

export enum PushNotificationError {
  PERMISSION_DENIED = 'permission_denied',
  NOT_SUPPORTED = 'not_supported',
  SUBSCRIPTION_FAILED = 'subscription_failed',
  NETWORK_ERROR = 'network_error',
  SERVICE_WORKER_ERROR = 'service_worker_error',
  VAPID_KEY_MISSING = 'vapid_key_missing'
}

export interface NotificationEventData {
  type: 'new_notification' | 'notification_read' | 'notification_deleted';
  notification?: Notification;
  notificationId?: string;
  userId: number;
}