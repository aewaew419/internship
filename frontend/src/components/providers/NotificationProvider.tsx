'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { notificationService } from '../../lib/api/services/notification.service';
import type {
  Notification,
  NotificationSettings,
  NotificationListResponse,
  NotificationQueryParams,
  NotificationType,
  NotificationCategory,
  PushNotificationError,
} from '../../types/notifications';

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
  clearError: () => void;
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
  | { type: 'UPDATE_UNREAD_COUNT'; payload: number };

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
  const eventSourceRef = useRef<EventSource | null>(null);
  const fetchIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCount = useRef(0);
  const maxRetries = 3;

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
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response: NotificationListResponse = await notificationService.getNotificationsWithRetry(params);
      
      dispatch({
        type: 'SET_NOTIFICATIONS',
        payload: {
          notifications: response.notifications,
          unreadCount: response.unreadCount,
          hasMore: response.notifications.length === (params?.limit || 20),
          page: params?.page || 1,
        },
      });

      // Cache the results
      saveToCache(STORAGE_KEYS.NOTIFICATIONS, response.notifications.slice(0, CACHE_CONFIG.MAX_CACHED_NOTIFICATIONS), CACHE_CONFIG.NOTIFICATIONS_TTL);
      dispatch({ type: 'SET_LAST_FETCH', payload: Date.now() });
      
      retryCount.current = 0; // Reset retry count on success
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch notifications';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      
      // Try to load from cache on error
      const cachedNotifications = loadFromCache(STORAGE_KEYS.NOTIFICATIONS);
      if (cachedNotifications) {
        dispatch({
          type: 'SET_NOTIFICATIONS',
          payload: {
            notifications: cachedNotifications,
            unreadCount: cachedNotifications.filter((n: Notification) => !n.isRead).length,
            hasMore: false,
            page: 1,
          },
        });
      }
    }
  }, [saveToCache, loadFromCache]);

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
    try {
      await notificationService.markAsRead(notificationId);
      dispatch({ type: 'MARK_AS_READ', payload: notificationId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark notification as read';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, []);

  // Mark All as Read
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      dispatch({ type: 'MARK_ALL_AS_READ' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark all notifications as read';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, []);

  // Delete Notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: notificationId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete notification';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, []);

  // Clear All Notifications
  const clearAll = useCallback(async () => {
    try {
      await notificationService.clearAll();
      dispatch({ type: 'CLEAR_NOTIFICATIONS' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear all notifications';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, []);

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
    try {
      const updatedSettings = await notificationService.updateSettingsWithRetry(settings);
      dispatch({ type: 'SET_SETTINGS', payload: updatedSettings });
      saveToCache(STORAGE_KEYS.SETTINGS, updatedSettings, CACHE_CONFIG.SETTINGS_TTL);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update notification settings';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [saveToCache]);

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

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  // Initialize on mount
  useEffect(() => {
    // Load cached data first
    const cachedNotifications = loadFromCache(STORAGE_KEYS.NOTIFICATIONS);
    const cachedSettings = loadFromCache(STORAGE_KEYS.SETTINGS);

    if (cachedNotifications) {
      dispatch({
        type: 'SET_NOTIFICATIONS',
        payload: {
          notifications: cachedNotifications,
          unreadCount: cachedNotifications.filter((n: Notification) => !n.isRead).length,
          hasMore: false,
          page: 1,
        },
      });
    }

    if (cachedSettings) {
      dispatch({ type: 'SET_SETTINGS', payload: cachedSettings });
    }

    // Fetch fresh data if auto-fetch is enabled
    if (autoFetch) {
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
    };
  }, [autoFetch, enableRealTime, connect, disconnect, fetchNotifications, fetchSettings, loadFromCache]);

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
    clearError,
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