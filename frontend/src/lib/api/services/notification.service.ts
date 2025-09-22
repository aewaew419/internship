'use client';

import { apiClient } from '../client';
import { PROTECTED_PATH } from '../../../constants/api-routes';
import type {
  Notification,
  NotificationListResponse,
  NotificationQueryParams,
  NotificationSettings,
  PushSubscriptionData,
  BulkNotificationOperation,
  BulkOperationResult,
  NotificationStats,
  NotificationApiError,
  validateNotificationListResponse,
  validateNotificationSettings,
  validateBulkOperationResult,
} from '../../../types/notifications';
import type { AxiosResponse } from 'axios';

export class NotificationService {
  /**
   * Get notifications with optional filtering and pagination
   */
  async getNotifications(params?: NotificationQueryParams): Promise<NotificationListResponse> {
    try {
      const response = await apiClient.getAxiosInstance().get(
        PROTECTED_PATH.NOTIFICATIONS,
        { params }
      );

      // Validate response data
      if (!validateNotificationListResponse(response.data)) {
        throw new Error('Invalid notification list response format');
      }

      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to fetch notifications');
    }
  }

  /**
   * Get notifications with retry mechanism for mobile networks
   */
  async getNotificationsWithRetry(params?: NotificationQueryParams): Promise<NotificationListResponse> {
    return apiClient.retryRequest(() => this.getNotifications(params));
  }

  /**
   * Mark a specific notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await apiClient.getAxiosInstance().patch(
        `${PROTECTED_PATH.NOTIFICATIONS_MARK_READ}/${notificationId}`
      );
    } catch (error) {
      throw this.handleApiError(error, 'Failed to mark notification as read');
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      await apiClient.getAxiosInstance().patch(
        PROTECTED_PATH.NOTIFICATIONS_MARK_ALL_READ
      );
    } catch (error) {
      throw this.handleApiError(error, 'Failed to mark all notifications as read');
    }
  }

  /**
   * Delete a specific notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await apiClient.getAxiosInstance().delete(
        `${PROTECTED_PATH.NOTIFICATIONS_DELETE}/${notificationId}`
      );
    } catch (error) {
      throw this.handleApiError(error, 'Failed to delete notification');
    }
  }

  /**
   * Clear all notifications
   */
  async clearAll(): Promise<void> {
    try {
      await apiClient.getAxiosInstance().delete(
        PROTECTED_PATH.NOTIFICATIONS
      );
    } catch (error) {
      throw this.handleApiError(error, 'Failed to clear all notifications');
    }
  }

  /**
   * Perform bulk operations on notifications
   */
  async bulkOperation(operation: BulkNotificationOperation): Promise<BulkOperationResult> {
    try {
      const response = await apiClient.getAxiosInstance().post(
        PROTECTED_PATH.NOTIFICATIONS_BULK,
        operation
      );

      // Validate response data
      if (!validateBulkOperationResult(response.data)) {
        throw new Error('Invalid bulk operation response format');
      }

      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to perform bulk operation');
    }
  }

  /**
   * Get notification settings
   */
  async getSettings(): Promise<NotificationSettings> {
    try {
      const response = await apiClient.getAxiosInstance().get(
        PROTECTED_PATH.NOTIFICATIONS_SETTINGS
      );

      // Validate response data
      if (!validateNotificationSettings(response.data)) {
        throw new Error('Invalid notification settings response format');
      }

      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to fetch notification settings');
    }
  }

  /**
   * Update notification settings
   */
  async updateSettings(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    try {
      const response = await apiClient.getAxiosInstance().patch(
        PROTECTED_PATH.NOTIFICATIONS_SETTINGS,
        settings
      );

      // Validate response data
      if (!validateNotificationSettings(response.data)) {
        throw new Error('Invalid notification settings response format');
      }

      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to update notification settings');
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(subscription: PushSubscriptionData): Promise<void> {
    try {
      await apiClient.getAxiosInstance().post(
        PROTECTED_PATH.NOTIFICATIONS_PUSH_SUBSCRIBE,
        subscription
      );
    } catch (error) {
      throw this.handleApiError(error, 'Failed to subscribe to push notifications');
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPush(endpoint: string): Promise<void> {
    try {
      await apiClient.getAxiosInstance().post(
        PROTECTED_PATH.NOTIFICATIONS_PUSH_UNSUBSCRIBE,
        { endpoint }
      );
    } catch (error) {
      throw this.handleApiError(error, 'Failed to unsubscribe from push notifications');
    }
  }

  /**
   * Send a test notification
   */
  async sendTestNotification(): Promise<void> {
    try {
      await apiClient.getAxiosInstance().post(
        PROTECTED_PATH.NOTIFICATIONS_TEST
      );
    } catch (error) {
      throw this.handleApiError(error, 'Failed to send test notification');
    }
  }

  /**
   * Get notification statistics
   */
  async getStats(): Promise<NotificationStats> {
    try {
      const response = await apiClient.getAxiosInstance().get(
        PROTECTED_PATH.NOTIFICATIONS_STATS
      );

      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to fetch notification statistics');
    }
  }

  /**
   * Subscribe to push notifications with retry mechanism
   */
  async subscribeToPushWithRetry(subscription: PushSubscriptionData): Promise<void> {
    return apiClient.retryRequest(() => this.subscribeToPush(subscription));
  }

  /**
   * Update settings with retry mechanism for mobile networks
   */
  async updateSettingsWithRetry(settings: Partial<NotificationSettings>): Promise<NotificationSettings> {
    return apiClient.retryRequest(() => this.updateSettings(settings));
  }

  /**
   * Handle API errors and provide meaningful error messages
   */
  private handleApiError(error: any, defaultMessage: string): Error {
    if (error?.response?.data) {
      const apiError = error.response.data as NotificationApiError;
      return new Error(apiError.message || defaultMessage);
    }

    if (error?.message) {
      return new Error(error.message);
    }

    return new Error(defaultMessage);
  }

  /**
   * Check if the device is online (useful for mobile networks)
   */
  isOnline(): boolean {
    if (typeof window === 'undefined') return true;
    return navigator.onLine;
  }

  /**
   * Wait for network connection to be restored
   */
  async waitForConnection(timeout: number = 30000): Promise<boolean> {
    if (typeof window === 'undefined') return true;

    return new Promise((resolve) => {
      if (navigator.onLine) {
        resolve(true);
        return;
      }

      const timeoutId = setTimeout(() => {
        window.removeEventListener('online', onlineHandler);
        resolve(false);
      }, timeout);

      const onlineHandler = () => {
        clearTimeout(timeoutId);
        window.removeEventListener('online', onlineHandler);
        resolve(true);
      };

      window.addEventListener('online', onlineHandler);
    });
  }

  /**
   * Batch multiple notification operations for efficiency
   */
  async batchOperations(operations: Array<() => Promise<any>>): Promise<any[]> {
    try {
      // Execute operations in parallel with a reasonable concurrency limit
      const batchSize = 5;
      const results: any[] = [];

      for (let i = 0; i < operations.length; i += batchSize) {
        const batch = operations.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(batch.map(op => op()));
        results.push(...batchResults);
      }

      return results;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to execute batch operations');
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();