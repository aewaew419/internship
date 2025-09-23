'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { notificationService } from '../../lib/api/services/notification.service';
import { offlineNotificationManager } from '../../lib/notifications/offline-queue';
import { offlineNotificationStorage } from '../../lib/notifications/offline-storage';
import { networkStatusManager } from '../../lib/notifications/network-status';
import type {
  Notification,
  NotificationSettings,
  NotificationListResponse,
  NotificationQueryParams,
  NotificationType,
  NotificationCategory,
  PushNotificationError,
  BulkNotificationOperation,
  BulkOperationResult,
} from '../../types/notifications';
import type { UserInterface } from '../../types/user';

// Notification Context State Interface
export interface NotificationContextState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  settings: NotificationSettings | null;
  isConnected: boolean;
  lastFetch: number | null;
  hasMore: boolean;
  currentPage: number;
  userRoles: string[];
  isAuthenticated: boolean;
}

// Notification Context Actions Interface
export interface NotificationContextActions {
  // Notification management
  fetchNotifications: (params?: NotificationQueryParams) => Promise<void>;
  loadMoreNotifications: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  
  // Bulk operations
  bulkMarkAsRead: (notificationIds: string[]) => Promise<BulkOperationResult>;
  bulkDelete: (notificationIds: string[]) => Promise<BulkOperationResult>;
  bulkArchive: (notificationIds: string[]) => Promise<BulkOperationResult>;
  
  // Settings management
  fetchSettings: () => Promise<void>;
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  
  // Real-time connection
  connect: () => void;
  disconnect: () => void;
  
  // Utility functions
  getNotificationById: (id: string) => Notification | undefined;
  getNotificationsByType: (type: NotificationType) => Notification[];
  getNotificationsByCategory: (category: NotificationCategory) => Notification[];
  getFilteredNotificationsByRole: () => Notification[];
  clearError: () => void;
  
  // Authentication integration
  syncUserPreferences: () => Promise<void>;
  cleanupOnLogout: () => void;
}

// Combined Context Type
export interface NotificationContextType extends NotificationContextState, NotificationContextActions {}

// Action Types for Reducer
type NotificationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_NOTIFICATIONS'; payload: { notifications: Notification[]; unreadCount: number; hasMore: boolean; page: number } }
  | { type: 'APPEND_NOTIFICATIONS'; payload: { notifications: Notification[]; hasMore: boolean; page: number } }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'UPDATE_NOTIFICATION'; payload: { id: string; updates: Partial<Notification> } }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'SET_SETTINGS'; payload: NotificationSettings }
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'SET_LAST_FETCH'; payload: number }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'UPDATE_UNREAD_COUNT'; payload: number }
  | { type: 'BULK_MARK_AS_READ'; payload: string[] }
  | { type: 'BULK_DELETE'; payload: string[] }
  | { type: 'BULK_ARCHIVE'; payload: string[] }
  | { type: 'SET_USER_ROLES'; payload: string[] }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'RESET_STATE' };

// Initial State
const initialState: NotificationContextState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  settings: null,
  isConnected: false,
  lastFetch: null,
  hasMore: true,
  currentPage: 1,
  userRoles: [],
  isAuthenticated: false,
};

// Notification Reducer
function notificationReducer(state: NotificationContextState, action: NotificationAction): NotificationContextState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload.notifications,
        unreadCount: action.payload.unreadCount,
        hasMore: action.payload.hasMore,
        currentPage: action.payload.page,
        isLoading: false,
        error: null,
      };
    
    case 'APPEND_NOTIFICATIONS':
      return {
        ...state,
        notifications: [...state.notifications, ...action.payload.notifications],
        hasMore: action.payload.hasMore,
        currentPage: action.payload.page,
        isLoading: false,
      };
    
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: action.payload.isRead ? state.unreadCount : state.unreadCount + 1,
      };
    
    case 'UPDATE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload.id
            ? { ...notification, ...action.payload.updates }
            : notification
        ),
      };
    
    case 'REMOVE_NOTIFICATION':
      const removedNotification = state.notifications.find(n => n.id === action.payload);
      return {
        ...state,
        notifications: state.notifications.filter(notification => notification.id !== action.payload),
        unreadCount: removedNotification && !removedNotification.isRead 
          ? Math.max(0, state.unreadCount - 1) 
          : state.unreadCount,
      };
    
    case 'MARK_AS_READ':
      const notification = state.notifications.find(n => n.id === action.payload);
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        ),
        unreadCount: notification && !notification.isRead 
          ? Math.max(0, state.unreadCount - 1) 
          : state.unreadCount,
      };
    
    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification => ({
          ...notification,
          isRead: true,
          readAt: notification.readAt || new Date().toISOString(),
        })),
        unreadCount: 0,
      };
    
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    
    case 'SET_CONNECTED':
      return { ...state, isConnected: action.payload };
    
    case 'SET_LAST_FETCH':
      return { ...state, lastFetch: action.payload };
    
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [], unreadCount: 0 };
    
    case 'UPDATE_UNREAD_COUNT':
      return { ...state, unreadCount: action.payload };
    
    case 'BULK_MARK_AS_READ':
      const bulkReadNotifications = state.notifications.map(notification =>
        action.payload.includes(notification.id)
          ? { ...notification, isRead: true, readAt: notification.readAt || new Date().toISOString() }
          : notification
      );
      const unreadAfterBulkRead = bulkReadNotifications.filter(n => !n.isRead).length;
      return {
        ...state,
        notifications: bulkReadNotifications,
        unreadCount: unreadAfterBulkRead,
      };
    
    case 'BULK_DELETE':
      const remainingNotifications = state.notifications.filter(n => !action.payload.includes(n.id));
      const unreadAfterBulkDelete = remainingNotifications.filter(n => !n.isRead).length;
      return {
        ...state,
        notifications: remainingNotifications,
        unreadCount: unreadAfterBulkDelete,
      };
    
    case 'BULK_ARCHIVE':
      // For now, archive behaves like delete (could be extended to add archived flag)
      const remainingAfterArchive = state.notifications.filter(n => !action.payload.includes(n.id));
      const unreadAfterArchive = remainingAfterArchive.filter(n => !n.isRead).length;
      return {
        ...state,
        notifications: remainingAfterArchive,
        unreadCount: unreadAfterArchive,
      };
    
    case 'SET_USER_ROLES':
      return { ...state, userRoles: action.payload };
    
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
    
    case 'RESET_STATE':
      return { ...initialState };
    
    default:
      return state;
  }
}

// Create Context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Local Storage Keys
const STORAGE_KEYS = {
  NOTIFICATIONS: 'notifications_cache',
  SETTINGS: 'notification_settings_cache',
  LAST_FETCH: 'notifications_last_fetch',
} as const;

// Cache Configuration
const CACHE_CONFIG = {
  NOTIFICATIONS_TTL: 5 * 60 * 1000, // 5 minutes
  SETTINGS_TTL: 30 * 60 * 1000, // 30 minutes
  MAX_CACHED_NOTIFICATIONS: 100,
} as const;

// Provider Props
interface NotificationProviderProps {
  children: React.ReactNode;
  enableRealTime?: boolean;
  cacheEnabled?: boolean;
  autoFetch?: boolean;
  fetchInterval?: number;
}

export function NotificationProvider({
  children,
  enableRealTime = true,
  cacheEnabled = true,
  autoFetch = true,
  fetchInterval = 30000, // 30 seconds
}: NotificationProviderProps) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { user, isAuthenticated, logout } = useAuth();
  const eventSourceRef = useRef<EventSource | null>(null);
  const fetchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Role-based notification filtering
  const getRoleBasedNotificationTypes = useCallback((userRoles: string[]): NotificationType[] => {
    const allowedTypes: NotificationType[] = [];
    
    // System announcements are visible to all authenticated users
    allowedTypes.push(NotificationType.SYSTEM_ANNOUNCEMENT);
    
    // Role-specific notification types
    if (userRoles.includes('student')) {
      allowedTypes.push(
        NotificationType.ASSIGNMENT_CHANGE,
        NotificationType.GRADE_UPDATE,
        NotificationType.SCHEDULE_REMINDER,
        NotificationType.DOCUMENT_UPDATE,
        NotificationType.DEADLINE_REMINDER
      );
    }
    
    if (userRoles.includes('instructor') || userRoles.includes('courseInstructor')) {
      allowedTypes.push(
        NotificationType.ASSIGNMENT_CHANGE,
        NotificationType.EVALUATION_REQUEST,
        NotificationType.DOCUMENT_UPDATE,
        NotificationType.DEADLINE_REMINDER
      );
    }
    
    if (userRoles.includes('visitor')) {
      allowedTypes.push(
        NotificationType.VISIT_SCHEDULED,
        NotificationType.SCHEDULE_REMINDER,
        NotificationType.EVALUATION_REQUEST
      );
    }
    
    if (userRoles.includes('committee')) {
      allowedTypes.push(
        NotificationType.EVALUATION_REQUEST,
        NotificationType.DOCUMENT_UPDATE,
        NotificationType.DEADLINE_REMINDER
      );
    }
    
    return allowedTypes;
  }, []);

  const filterNotificationsByRole = useCallback((notifications: Notification[], userRoles: string[]): Notification[] => {
    if (!userRoles.length) return [];
    
    const allowedTypes = getRoleBasedNotificationTypes(userRoles);
    return notifications.filter(notification => allowedTypes.includes(notification.type));
  }, [getRoleBasedNotificationTypes]);

  // Authentication integration functions
  const syncUserPreferences = useCallback(async () => {
    if (!user || !isAuthenticated) return;
    
    try {
      // Sync notification settings with user preferences
      const settings = await notificationService.getSettings();
      dispatch({ type: 'SET_SETTINGS', payload: settings });
      
      // Store user-specific settings in cache
      const userCacheKey = `${STORAGE_KEYS.SETTINGS}_${user.user.id}`;
      saveToCache(userCacheKey, settings, CACHE_CONFIG.SETTINGS_TTL);
      
      console.log('User notification preferences synchronized');
    } catch (error) {
      console.warn('Failed to sync user preferences:', error);
    }
  }, [user, isAuthenticated]);

  const cleanupOnLogout = useCallback(() => {
    // Clear all notification data
    dispatch({ type: 'RESET_STATE' });
    
    // Clear user-specific cache
    if (user?.user.id) {
      const userCacheKey = `${STORAGE_KEYS.SETTINGS}_${user.user.id}`;
      localStorage.removeItem(userCacheKey);
      localStorage.removeItem(`${STORAGE_KEYS.NOTIFICATIONS}_${user.user.id}`);
    }
    
    // Disconnect real-time connection
    disconnect();
    
    // Clear offline storage for the user
    if (user?.user.id) {
      offlineNotificationStorage.clearUserData(user.user.id).catch(error => {
        console.warn('Failed to clear offline user data:', error);
      });
    }
    
    console.log('Notification system cleaned up on logout');
  }, [user, disconnect]);

  // Cache Management Functions
  const saveToCache = useCallback((key: string, data: any, ttl: number) => {
    if (!cacheEnabled || typeof window === 'undefined') return;
    
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl,
      };
      localStorage.setItem(key, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save to cache:', error);
    }
  }, [cacheEnabled]);

  const loadFromCache = useCallback((key: string) => {
    if (!cacheEnabled || typeof window === 'undefined') return null;
    
    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      
      const { data, timestamp, ttl } = JSON.parse(cached);
      if (Date.now() - timestamp > ttl) {
        localStorage.removeItem(key);
        return null;
      }
      
      return data;
    } catch (error) {
      console.warn('Failed to load from cache:', error);
      return null;
    }
  }, [cacheEnabled]);

  // Fetch Notifications
  const fetchNotifications = useCallback(async (params?: NotificationQueryParams) => {
    if (!isAuthenticated || !user) {
      dispatch({ type: 'SET_ERROR', payload: 'User not authenticated' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      if (networkStatusManager.isOnline()) {
        const response: NotificationListResponse = await notificationService.getNotificationsWithRetry(params);
        
        // Filter notifications based on user roles
        const filteredNotifications = filterNotificationsByRole(response.notifications, state.userRoles);
        const filteredUnreadCount = filteredNotifications.filter(n => !n.isRead).length;
        
        dispatch({
          type: 'SET_NOTIFICATIONS',
          payload: {
            notifications: filteredNotifications,
            unreadCount: filteredUnreadCount,
            hasMore: response.notifications.length === (params?.limit || 20),
            page: params?.page || 1,
          },
        });

        // Cache the results with user-specific key
        const userCacheKey = `${STORAGE_KEYS.NOTIFICATIONS}_${user.user.id}`;
        saveToCache(userCacheKey, filteredNotifications.slice(0, CACHE_CONFIG.MAX_CACHED_NOTIFICATIONS), CACHE_CONFIG.NOTIFICATIONS_TTL);
        
        // Store in IndexedDB for offline access
        await offlineNotificationStorage.storeNotifications(filteredNotifications, user.user.id);
        
        dispatch({ type: 'SET_LAST_FETCH', payload: Date.now() });
        retryCount.current = 0; // Reset retry count on success
      } else {
        // Load from offline storage when offline
        console.log('Loading notifications from offline storage');
        const offlineResponse = await offlineNotificationStorage.getNotifications(params, user.user.id);
        
        // Filter offline notifications by role as well
        const filteredNotifications = filterNotificationsByRole(offlineResponse.notifications, state.userRoles);
        const filteredUnreadCount = filteredNotifications.filter(n => !n.isRead).length;
        
        dispatch({
          type: 'SET_NOTIFICATIONS',
          payload: {
            notifications: filteredNotifications,
            unreadCount: filteredUnreadCount,
            hasMore: offlineResponse.notifications.length === (params?.limit || 20),
            page: params?.page || 1,
          },
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch notifications';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      // Try to load from cache on error
      try {
        const userCacheKey = `${STORAGE_KEYS.NOTIFICATIONS}_${user.user.id}`;
        const cachedNotifications = loadFromCache(userCacheKey);
        if (cachedNotifications) {
          const filteredNotifications = filterNotificationsByRole(cachedNotifications, state.userRoles);
          dispatch({
            type: 'SET_NOTIFICATIONS',
            payload: {
              notifications: filteredNotifications,
              unreadCount: filteredNotifications.filter((n: Notification) => !n.isRead).length,
              hasMore: false,
              page: 1,
            },
          });
        } else {
          // Fallback to offline storage
          const offlineResponse = await offlineNotificationStorage.getNotifications(params, user.user.id);
          const filteredNotifications = filterNotificationsByRole(offlineResponse.notifications, state.userRoles);
          dispatch({
            type: 'SET_NOTIFICATIONS',
            payload: {
              notifications: filteredNotifications,
              unreadCount: filteredNotifications.filter(n => !n.isRead).length,
              hasMore: false,
              page: 1,
            },
          });
        }
      } catch (offlineError) {
        console.error('Failed to load notifications from offline storage:', offlineError);
      }
    }
  }, [saveToCache, loadFromCache, isAuthenticated, user, state.userRoles, filterNotificationsByRole]);

  // Load More Notifications
  const loadMoreNotifications = useCallback(async () => {
    if (state.isLoading || !state.hasMore) return;

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response: NotificationListResponse = await notificationService.getNotificationsWithRetry({
        page: state.currentPage + 1,
        limit: 20,
      });

      dispatch({
        type: 'APPEND_NOTIFICATIONS',
        payload: {
          notifications: response.notifications,
          hasMore: response.notifications.length === 20,
          page: state.currentPage + 1,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load more notifications';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [state.isLoading, state.hasMore, state.currentPage]);

  // Refresh Notifications
  const refreshNotifications = useCallback(async () => {
    await fetchNotifications({ page: 1, limit: 20 });
  }, [fetchNotifications]);

  // Mark as Read
  const markAsRead = useCallback(async (notificationId: string) => {
    // Optimistically update UI
    dispatch({ type: 'MARK_AS_READ', payload: notificationId });
    
    try {
      if (networkStatusManager.isOnline()) {
        await notificationService.markAsRead(notificationId);
        // Update offline storage
        await offlineNotificationStorage.updateNotification(notificationId, { 
          isRead: true, 
          readAt: new Date().toISOString() 
        });
      } else {
        // Queue for offline processing
        offlineNotificationManager.queueAction('mark_read', { notificationId });
        console.log('Queued mark as read action for offline processing');
      }
    } catch (error) {
      // Revert optimistic update on error
      dispatch({ type: 'UPDATE_NOTIFICATION', payload: { 
        id: notificationId, 
        updates: { isRead: false, readAt: undefined } 
      }});
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark notification as read';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      // Queue for retry if network error
      if (!networkStatusManager.isOnline()) {
        offlineNotificationManager.queueAction('mark_read', { notificationId });
      }
    }
  }, []);

  // Mark All as Read
  const markAllAsRead = useCallback(async () => {
    // Optimistically update UI
    dispatch({ type: 'MARK_ALL_AS_READ' });
    
    try {
      if (networkStatusManager.isOnline()) {
        await notificationService.markAllAsRead();
        // Update offline storage
        const notifications = await offlineNotificationStorage.getNotifications();
        for (const notification of notifications.notifications) {
          if (!notification.isRead) {
            await offlineNotificationStorage.updateNotification(notification.id, { 
              isRead: true, 
              readAt: new Date().toISOString() 
            });
          }
        }
      } else {
        // Queue for offline processing
        offlineNotificationManager.queueAction('mark_all_read', {});
        console.log('Queued mark all as read action for offline processing');
      }
    } catch (error) {
      // Revert optimistic update on error - would need to restore previous read states
      await refreshNotifications();
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark all notifications as read';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      // Queue for retry if network error
      if (!networkStatusManager.isOnline()) {
        offlineNotificationManager.queueAction('mark_all_read', {});
      }
    }
  }, []);

  // Delete Notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    // Store notification for potential restoration
    const notificationToDelete = state.notifications.find(n => n.id === notificationId);
    
    // Optimistically update UI
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: notificationId });
    
    try {
      if (networkStatusManager.isOnline()) {
        await notificationService.deleteNotification(notificationId);
        // Remove from offline storage
        await offlineNotificationStorage.deleteNotification(notificationId);
      } else {
        // Queue for offline processing
        offlineNotificationManager.queueAction('delete', { notificationId });
        console.log('Queued delete notification action for offline processing');
      }
    } catch (error) {
      // Restore notification on error
      if (notificationToDelete) {
        dispatch({ type: 'ADD_NOTIFICATION', payload: notificationToDelete });
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete notification';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      // Queue for retry if network error
      if (!networkStatusManager.isOnline()) {
        offlineNotificationManager.queueAction('delete', { notificationId });
      }
    }
  }, [state.notifications]);

  // Clear All Notifications
  const clearAll = useCallback(async () => {
    // Store notifications for potential restoration
    const notificationsToRestore = [...state.notifications];
    
    // Optimistically update UI
    dispatch({ type: 'CLEAR_NOTIFICATIONS' });
    
    try {
      if (networkStatusManager.isOnline()) {
        await notificationService.clearAll();
        // Clear offline storage
        await offlineNotificationStorage.clearNotifications();
      } else {
        // Queue for offline processing
        offlineNotificationManager.queueAction('clear_all', {});
        console.log('Queued clear all notifications action for offline processing');
      }
    } catch (error) {
      // Restore notifications on error
      dispatch({
        type: 'SET_NOTIFICATIONS',
        payload: {
          notifications: notificationsToRestore,
          unreadCount: notificationsToRestore.filter(n => !n.isRead).length,
          hasMore: false,
          page: 1,
        },
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear all notifications';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      // Queue for retry if network error
      if (!networkStatusManager.isOnline()) {
        offlineNotificationManager.queueAction('clear_all', {});
      }
    }
  }, [state.notifications]);

  // Fetch Settings
  const fetchSettings = useCallback(async () => {
    try {
      const settings = await notificationService.getSettings();
      dispatch({ type: 'SET_SETTINGS', payload: settings });
      saveToCache(STORAGE_KEYS.SETTINGS, settings, CACHE_CONFIG.SETTINGS_TTL);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch notification settings';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      // Try to load from cache on error
      const cachedSettings = loadFromCache(STORAGE_KEYS.SETTINGS);
      if (cachedSettings) {
        dispatch({ type: 'SET_SETTINGS', payload: cachedSettings });
      }
    }
  }, [saveToCache, loadFromCache]);

  // Update Settings
  const updateSettings = useCallback(async (settings: Partial<NotificationSettings>) => {
    // Store current settings for potential restoration
    const currentSettings = state.settings;
    
    // Optimistically update UI
    if (currentSettings) {
      const updatedSettings = { ...currentSettings, ...settings };
      dispatch({ type: 'SET_SETTINGS', payload: updatedSettings });
    }
    
    try {
      if (networkStatusManager.isOnline()) {
        const updatedSettings = await notificationService.updateSettingsWithRetry(settings);
        dispatch({ type: 'SET_SETTINGS', payload: updatedSettings });
        saveToCache(STORAGE_KEYS.SETTINGS, updatedSettings, CACHE_CONFIG.SETTINGS_TTL);
        
        // Update offline storage
        // Note: Would need userId - this is a simplified version
        await offlineNotificationStorage.storeSettings(updatedSettings, 1);
      } else {
        // Queue for offline processing
        offlineNotificationManager.queueAction('update_settings', { settings });
        console.log('Queued update settings action for offline processing');
      }
    } catch (error) {
      // Restore previous settings on error
      if (currentSettings) {
        dispatch({ type: 'SET_SETTINGS', payload: currentSettings });
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to update notification settings';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      // Queue for retry if network error
      if (!networkStatusManager.isOnline()) {
        offlineNotificationManager.queueAction('update_settings', { settings });
      }
    }
  }, [saveToCache, state.settings]);

  // Real-time Connection Management
  const connect = useCallback(() => {
    if (!enableRealTime || eventSourceRef.current) return;

    try {
      // Note: This would need to be implemented with actual SSE endpoint
      // For now, we'll use polling as fallback
      if (fetchIntervalRef.current) {
        clearInterval(fetchIntervalRef.current);
      }

      fetchIntervalRef.current = setInterval(() => {
        if (document.visibilityState === 'visible') {
          refreshNotifications();
        }
      }, fetchInterval);

      dispatch({ type: 'SET_CONNECTED', payload: true });
    } catch (error) {
      console.warn('Failed to establish real-time connection, falling back to polling');
      dispatch({ type: 'SET_CONNECTED', payload: false });
    }
  }, [enableRealTime, fetchInterval, refreshNotifications]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (fetchIntervalRef.current) {
      clearInterval(fetchIntervalRef.current);
      fetchIntervalRef.current = null;
    }

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    dispatch({ type: 'SET_CONNECTED', payload: false });
  }, []);

  // Utility Functions
  const getNotificationById = useCallback((id: string): Notification | undefined => {
    return state.notifications.find(notification => notification.id === id);
  }, [state.notifications]);

  const getNotificationsByType = useCallback((type: NotificationType): Notification[] => {
    return state.notifications.filter(notification => notification.type === type);
  }, [state.notifications]);

  const getNotificationsByCategory = useCallback((category: NotificationCategory): Notification[] => {
    return state.notifications.filter(notification => notification.category === category);
  }, [state.notifications]);

  const getFilteredNotificationsByRole = useCallback((): Notification[] => {
    return filterNotificationsByRole(state.notifications, state.userRoles);
  }, [state.notifications, state.userRoles, filterNotificationsByRole]);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  // Bulk Operations
  const bulkMarkAsRead = useCallback(async (notificationIds: string[]): Promise<BulkOperationResult> => {
    try {
      const operation: BulkNotificationOperation = {
        notificationIds,
        operation: 'mark_read',
      };
      
      const result = await notificationService.bulkOperation(operation);
      
      if (result.success) {
        dispatch({ type: 'BULK_MARK_AS_READ', payload: notificationIds });
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark notifications as read';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      return {
        success: false,
        processedCount: 0,
        failedIds: notificationIds,
        errors: [{ code: 'BULK_OPERATION_FAILED', message: errorMessage }],
      };
    }
  }, []);

  const bulkDelete = useCallback(async (notificationIds: string[]): Promise<BulkOperationResult> => {
    try {
      const operation: BulkNotificationOperation = {
        notificationIds,
        operation: 'delete',
      };
      
      const result = await notificationService.bulkOperation(operation);
      
      if (result.success) {
        dispatch({ type: 'BULK_DELETE', payload: notificationIds });
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete notifications';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      return {
        success: false,
        processedCount: 0,
        failedIds: notificationIds,
        errors: [{ code: 'BULK_OPERATION_FAILED', message: errorMessage }],
      };
    }
  }, []);

  const bulkArchive = useCallback(async (notificationIds: string[]): Promise<BulkOperationResult> => {
    try {
      const operation: BulkNotificationOperation = {
        notificationIds,
        operation: 'archive',
      };
      
      const result = await notificationService.bulkOperation(operation);
      
      if (result.success) {
        dispatch({ type: 'BULK_ARCHIVE', payload: notificationIds });
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to archive notifications';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      return {
        success: false,
        processedCount: 0,
        failedIds: notificationIds,
        errors: [{ code: 'BULK_OPERATION_FAILED', message: errorMessage }],
      };
    }
  }, []);

  // Authentication state management
  useEffect(() => {
    dispatch({ type: 'SET_AUTHENTICATED', payload: isAuthenticated });
    
    if (isAuthenticated && user) {
      // Set user roles
      const userRoles = user.roles?.list || [];
      dispatch({ type: 'SET_USER_ROLES', payload: userRoles });
      
      // Sync user preferences
      syncUserPreferences();
    } else {
      // Clean up on logout
      cleanupOnLogout();
    }
  }, [isAuthenticated, user, syncUserPreferences, cleanupOnLogout]);

  // Initialize on mount
  useEffect(() => {
    // Initialize offline storage
    offlineNotificationStorage.initialize().catch(error => {
      console.warn('Failed to initialize offline storage:', error);
    });

    // Only proceed if user is authenticated
    if (!isAuthenticated || !user) {
      return;
    }

    // Load cached data first (user-specific)
    const userCacheKey = `${STORAGE_KEYS.NOTIFICATIONS}_${user.user.id}`;
    const userSettingsKey = `${STORAGE_KEYS.SETTINGS}_${user.user.id}`;
    const cachedNotifications = loadFromCache(userCacheKey);
    const cachedSettings = loadFromCache(userSettingsKey);

    if (cachedNotifications) {
      const filteredNotifications = filterNotificationsByRole(cachedNotifications, state.userRoles);
      dispatch({
        type: 'SET_NOTIFICATIONS',
        payload: {
          notifications: filteredNotifications,
          unreadCount: filteredNotifications.filter((n: Notification) => !n.isRead).length,
          hasMore: false,
          page: 1,
        },
      });
    }

    if (cachedSettings) {
      dispatch({ type: 'SET_SETTINGS', payload: cachedSettings });
    }

    // Set up network status monitoring
    const unsubscribeNetwork = networkStatusManager.addListener((status) => {
      if (status.isOnline) {
        console.log('Network restored, processing offline queue');
        // Process offline queue when network is restored
        offlineNotificationManager.processQueue();
        
        // Refresh notifications to sync with server
        if (autoFetch && isAuthenticated) {
          fetchNotifications();
        }
      }
    });

    // Fetch fresh data if auto-fetch is enabled and online
    if (autoFetch && networkStatusManager.isOnline()) {
      fetchNotifications();
      fetchSettings();
    }

    // Connect to real-time updates
    if (enableRealTime) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
      unsubscribeNetwork();
    };
  }, [autoFetch, enableRealTime, connect, disconnect, fetchNotifications, fetchSettings, loadFromCache, isAuthenticated, user, state.userRoles, filterNotificationsByRole]);

  // Handle visibility change for efficient polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && state.isConnected) {
        // Refresh notifications when tab becomes visible
        const timeSinceLastFetch = state.lastFetch ? Date.now() - state.lastFetch : Infinity;
        if (timeSinceLastFetch > 60000) { // 1 minute
          refreshNotifications();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [state.isConnected, state.lastFetch, refreshNotifications]);

  // Context value
  const contextValue: NotificationContextType = {
    // State
    ...state,
    
    // Actions
    fetchNotifications,
    loadMoreNotifications,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    fetchSettings,
    updateSettings,
    connect,
    disconnect,
    getNotificationById,
    getNotificationsByType,
    getNotificationsByCategory,
    getFilteredNotificationsByRole,
    clearError,
    bulkMarkAsRead,
    bulkDelete,
    bulkArchive,
    syncUserPreferences,
    cleanupOnLogout,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

// Custom hook to use notification context
export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Export context for advanced usage
export { NotificationContext };