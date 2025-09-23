// Push notification data models and TypeScript interfaces
import * as yup from 'yup';

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

// API Response interfaces
export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  page?: number;
  limit?: number;
}

export interface NotificationApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Notification query parameters
export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  type?: NotificationType;
  category?: NotificationCategory;
  unreadOnly?: boolean;
  startDate?: string;
  endDate?: string;
}

// Bulk operation interfaces
export interface BulkNotificationOperation {
  notificationIds: string[];
  operation: 'mark_read' | 'delete' | 'archive';
}

export interface BulkOperationResult {
  success: boolean;
  processedCount: number;
  failedIds?: string[];
  errors?: NotificationApiError[];
}

// Notification statistics
export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byCategory: Record<NotificationCategory, number>;
  todayCount: number;
  weekCount: number;
}

// Validation Schemas
export const NotificationActionSchema = yup.object({
  id: yup.string().required('Action ID is required'),
  title: yup.string().required('Action title is required').max(50, 'Title must be 50 characters or less'),
  action: yup.string().required('Action is required'),
  icon: yup.string().optional(),
  url: yup.string().url('Must be a valid URL').optional()
});

export const NotificationSchema = yup.object({
  id: yup.string().required('Notification ID is required'),
  userId: yup.number().positive('User ID must be positive').required('User ID is required'),
  type: yup.string().oneOf(Object.values(NotificationType), 'Invalid notification type').required('Type is required'),
  title: yup.string().required('Title is required').max(100, 'Title must be 100 characters or less'),
  body: yup.string().required('Body is required').max(500, 'Body must be 500 characters or less'),
  data: yup.object().optional(),
  priority: yup.string().oneOf(['high', 'normal', 'low'], 'Invalid priority').required('Priority is required'),
  category: yup.string().oneOf(Object.values(NotificationCategory), 'Invalid category').required('Category is required'),
  isRead: yup.boolean().required('Read status is required'),
  createdAt: yup.string().required('Created date is required'),
  readAt: yup.string().optional(),
  expiresAt: yup.string().optional(),
  actions: yup.array().of(NotificationActionSchema).optional()
});

export const PushSubscriptionDataSchema = yup.object({
  endpoint: yup.string().url('Must be a valid URL').required('Endpoint is required'),
  keys: yup.object({
    p256dh: yup.string().required('p256dh key is required'),
    auth: yup.string().required('Auth key is required')
  }).required('Keys are required'),
  userId: yup.number().positive('User ID must be positive').required('User ID is required'),
  deviceInfo: yup.object({
    userAgent: yup.string().required('User agent is required'),
    platform: yup.string().required('Platform is required'),
    isMobile: yup.boolean().required('Mobile status is required')
  }).required('Device info is required')
});

export const NotificationSettingsSchema = yup.object({
  pushNotifications: yup.boolean().required('Push notification setting is required'),
  emailNotifications: yup.boolean().required('Email notification setting is required'),
  types: yup.object().test('valid-types', 'Invalid notification types', (value) => {
    if (!value) return false;
    return Object.keys(value).every(key => Object.values(NotificationType).includes(key as NotificationType));
  }).required('Notification types are required'),
  frequency: yup.string().oneOf(['immediate', 'daily', 'weekly'], 'Invalid frequency').required('Frequency is required'),
  quietHours: yup.object({
    enabled: yup.boolean().required('Quiet hours enabled status is required'),
    startTime: yup.string().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').required('Start time is required'),
    endTime: yup.string().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)').required('End time is required')
  }).required('Quiet hours settings are required'),
  sound: yup.boolean().required('Sound setting is required'),
  vibration: yup.boolean().required('Vibration setting is required')
});

export const PushNotificationPayloadSchema = yup.object({
  title: yup.string().required('Title is required').max(100, 'Title must be 100 characters or less'),
  body: yup.string().required('Body is required').max(500, 'Body must be 500 characters or less'),
  icon: yup.string().url('Must be a valid URL').optional(),
  badge: yup.string().url('Must be a valid URL').optional(),
  image: yup.string().url('Must be a valid URL').optional(),
  data: yup.object().optional(),
  actions: yup.array().of(NotificationActionSchema).optional(),
  tag: yup.string().optional(),
  requireInteraction: yup.boolean().optional(),
  silent: yup.boolean().optional(),
  timestamp: yup.number().positive('Timestamp must be positive').optional()
});

export const DeviceTokenRegistrationSchema = yup.object({
  subscription: PushSubscriptionDataSchema.required('Subscription is required'),
  userAgent: yup.string().required('User agent is required'),
  platform: yup.string().required('Platform is required'),
  isMobile: yup.boolean().required('Mobile status is required')
});

export const NotificationEventDataSchema = yup.object({
  type: yup.string().oneOf(['new_notification', 'notification_read', 'notification_deleted'], 'Invalid event type').required('Event type is required'),
  notification: NotificationSchema.optional(),
  notificationId: yup.string().optional(),
  userId: yup.number().positive('User ID must be positive').required('User ID is required')
});

export const NotificationListResponseSchema = yup.object({
  notifications: yup.array().of(NotificationSchema).required('Notifications array is required'),
  total: yup.number().min(0, 'Total must be non-negative').required('Total is required'),
  unreadCount: yup.number().min(0, 'Unread count must be non-negative').required('Unread count is required'),
  page: yup.number().positive('Page must be positive').optional(),
  limit: yup.number().positive('Limit must be positive').optional()
});

export const NotificationQueryParamsSchema = yup.object({
  page: yup.number().positive('Page must be positive').optional(),
  limit: yup.number().positive('Limit must be positive').max(100, 'Limit cannot exceed 100').optional(),
  type: yup.string().oneOf(Object.values(NotificationType), 'Invalid notification type').optional(),
  category: yup.string().oneOf(Object.values(NotificationCategory), 'Invalid category').optional(),
  unreadOnly: yup.boolean().optional(),
  startDate: yup.string().optional(),
  endDate: yup.string().optional()
});

export const BulkNotificationOperationSchema = yup.object({
  notificationIds: yup.array().of(yup.string().required()).min(1, 'At least one notification ID is required').required('Notification IDs are required'),
  operation: yup.string().oneOf(['mark_read', 'delete', 'archive'], 'Invalid operation').required('Operation is required')
});

export const BulkOperationResultSchema = yup.object({
  success: yup.boolean().required('Success status is required'),
  processedCount: yup.number().min(0, 'Processed count must be non-negative').required('Processed count is required'),
  failedIds: yup.array().of(yup.string()).optional(),
  errors: yup.array().of(yup.object({
    code: yup.string().required('Error code is required'),
    message: yup.string().required('Error message is required'),
    details: yup.object().optional()
  })).optional()
});

// Validation helper functions
export const validateNotification = (data: unknown): data is Notification => {
  try {
    NotificationSchema.validateSync(data);
    return true;
  } catch {
    return false;
  }
};

export const validateNotificationSettings = (data: unknown): data is NotificationSettings => {
  try {
    NotificationSettingsSchema.validateSync(data);
    return true;
  } catch {
    return false;
  }
};

export const validatePushSubscriptionData = (data: unknown): data is PushSubscriptionData => {
  try {
    PushSubscriptionDataSchema.validateSync(data);
    return true;
  } catch {
    return false;
  }
};

export const validatePushNotificationPayload = (data: unknown): data is PushNotificationPayload => {
  try {
    PushNotificationPayloadSchema.validateSync(data);
    return true;
  } catch {
    return false;
  }
};

export const validateNotificationListResponse = (data: unknown): data is NotificationListResponse => {
  try {
    NotificationListResponseSchema.validateSync(data);
    return true;
  } catch {
    return false;
  }
};

export const validateNotificationQueryParams = (data: unknown): data is NotificationQueryParams => {
  try {
    NotificationQueryParamsSchema.validateSync(data);
    return true;
  } catch {
    return false;
  }
};

export const validateBulkNotificationOperation = (data: unknown): data is BulkNotificationOperation => {
  try {
    BulkNotificationOperationSchema.validateSync(data);
    return true;
  } catch {
    return false;
  }
};

// Type guards for runtime type checking
export const isNotificationType = (value: string): value is NotificationType => {
  return Object.values(NotificationType).includes(value as NotificationType);
};

export const isNotificationCategory = (value: string): value is NotificationCategory => {
  return Object.values(NotificationCategory).includes(value as NotificationCategory);
};

export const isPushNotificationError = (value: string): value is PushNotificationError => {
  return Object.values(PushNotificationError).includes(value as PushNotificationError);
};