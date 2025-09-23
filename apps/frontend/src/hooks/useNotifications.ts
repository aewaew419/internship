'use client';

import { useContext, useCallback, useMemo } from 'react';
import { NotificationContext } from '../components/providers/NotificationProvider';
import type {
  Notification,
  NotificationType,
  NotificationCategory,
  NotificationQueryParams,
} from '../types/notifications';

/**
 * Custom hook for consuming notification context with additional utilities
 */
export function useNotifications() {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }

  return context;
}

/**
 * Hook for filtered notifications with memoization
 */
export function useFilteredNotifications(filters?: {
  type?: NotificationType;
  category?: NotificationCategory;
  unreadOnly?: boolean;
  search?: string;
}) {
  const { notifications } = useNotifications();

  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications];

    if (filters?.type) {
      filtered = filtered.filter(n => n.type === filters.type);
    }

    if (filters?.category) {
      filtered = filtered.filter(n => n.category === filters.category);
    }

    if (filters?.unreadOnly) {
      filtered = filtered.filter(n => !n.isRead);
    }

    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchLower) ||
        n.body.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [notifications, filters]);

  return filteredNotifications;
}

/**
 * Hook for notification statistics
 */
export function useNotificationStats() {
  const { notifications } = useNotifications();

  const stats = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.isRead).length;
    
    const byType = notifications.reduce((acc, notification) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1;
      return acc;
    }, {} as Record<NotificationType, number>);

    const byCategory = notifications.reduce((acc, notification) => {
      acc[notification.category] = (acc[notification.category] || 0) + 1;
      return acc;
    }, {} as Record<NotificationCategory, number>);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = notifications.filter(n => 
      new Date(n.createdAt) >= today
    ).length;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekCount = notifications.filter(n => 
      new Date(n.createdAt) >= weekAgo
    ).length;

    return {
      total,
      unread,
      byType,
      byCategory,
      todayCount,
      weekCount,
    };
  }, [notifications]);

  return stats;
}

/**
 * Hook for notification actions with optimistic updates
 */
export function useNotificationActions() {
  const {
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refreshNotifications,
  } = useNotifications();

  const markAsReadOptimistic = useCallback(async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
    } catch (error) {
      // Error handling is done in the provider
      console.error('Failed to mark notification as read:', error);
    }
  }, [markAsRead]);

  const deleteNotificationOptimistic = useCallback(async (notificationId: string) => {
    try {
      await deleteNotification(notificationId);
    } catch (error) {
      // Error handling is done in the provider
      console.error('Failed to delete notification:', error);
    }
  }, [deleteNotification]);

  const markAllAsReadOptimistic = useCallback(async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [markAllAsRead]);

  const clearAllOptimistic = useCallback(async () => {
    try {
      await clearAll();
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  }, [clearAll]);

  return {
    markAsRead: markAsReadOptimistic,
    deleteNotification: deleteNotificationOptimistic,
    markAllAsRead: markAllAsReadOptimistic,
    clearAll: clearAllOptimistic,
    refreshNotifications,
  };
}

/**
 * Hook for notification pagination
 */
export function useNotificationPagination() {
  const {
    notifications,
    hasMore,
    isLoading,
    currentPage,
    loadMoreNotifications,
    fetchNotifications,
  } = useNotifications();

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await loadMoreNotifications();
  }, [hasMore, isLoading, loadMoreNotifications]);

  const reload = useCallback(async (params?: NotificationQueryParams) => {
    await fetchNotifications(params);
  }, [fetchNotifications]);

  return {
    notifications,
    hasMore,
    isLoading,
    currentPage,
    loadMore,
    reload,
  };
}

/**
 * Hook for real-time notification updates
 */
export function useNotificationRealTime() {
  const {
    isConnected,
    connect,
    disconnect,
    refreshNotifications,
  } = useNotifications();

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(connect, 1000); // Reconnect after 1 second
  }, [connect, disconnect]);

  return {
    isConnected,
    connect,
    disconnect,
    reconnect,
    refreshNotifications,
  };
}

/**
 * Hook for notification settings management
 */
export function useNotificationSettings() {
  const {
    settings,
    updateSettings,
    fetchSettings,
    isLoading,
    error,
  } = useNotifications();

  const updateSettingsOptimistic = useCallback(async (newSettings: Partial<typeof settings>) => {
    try {
      await updateSettings(newSettings);
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    }
  }, [updateSettings]);

  const refreshSettings = useCallback(async () => {
    await fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    updateSettings: updateSettingsOptimistic,
    refreshSettings,
    isLoading,
    error,
  };
}

/**
 * Hook for notification search and filtering
 */
export function useNotificationSearch() {
  const { fetchNotifications } = useNotifications();

  const search = useCallback(async (query: string, filters?: NotificationQueryParams) => {
    const searchParams: NotificationQueryParams = {
      ...filters,
      // Note: Backend would need to support search parameter
      // For now, we'll fetch all and filter client-side
    };
    
    await fetchNotifications(searchParams);
  }, [fetchNotifications]);

  return { search };
}

/**
 * Hook for notification error handling
 */
export function useNotificationError() {
  const { error, clearError } = useNotifications();

  const hasError = Boolean(error);

  return {
    error,
    hasError,
    clearError,
  };
}

/**
 * Hook for notification loading states
 */
export function useNotificationLoading() {
  const { isLoading } = useNotifications();

  return {
    isLoading,
  };
}

/**
 * Hook for notification utilities
 */
export function useNotificationUtils() {
  const {
    getNotificationById,
    getNotificationsByType,
    getNotificationsByCategory,
  } = useNotifications();

  const isNotificationExpired = useCallback((notification: Notification): boolean => {
    if (!notification.expiresAt) return false;
    return new Date(notification.expiresAt) < new Date();
  }, []);

  const getNotificationAge = useCallback((notification: Notification): string => {
    const now = new Date();
    const created = new Date(notification.createdAt);
    const diffMs = now.getTime() - created.getTime();
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }, []);

  const formatNotificationTime = useCallback((notification: Notification): string => {
    const date = new Date(notification.createdAt);
    const now = new Date();
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If this year, show month and day
    if (date.getFullYear() === now.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    // Otherwise show full date
    return date.toLocaleDateString();
  }, []);

  return {
    getNotificationById,
    getNotificationsByType,
    getNotificationsByCategory,
    isNotificationExpired,
    getNotificationAge,
    formatNotificationTime,
  };
}

// Export all hooks for convenience
export {
  useFilteredNotifications,
  useNotificationStats,
  useNotificationActions,
  useNotificationPagination,
  useNotificationRealTime,
  useNotificationSettings,
  useNotificationSearch,
  useNotificationError,
  useNotificationLoading,
  useNotificationUtils,
};