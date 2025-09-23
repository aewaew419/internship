'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PushNotificationManager } from '../lib/push-notifications';
import { notificationService } from '../lib/api/services/notification.service';
import { useAuth } from './useAuth';
import { useNotificationErrorTracking } from './useNotificationErrorMonitoring';
import { NotificationErrorType } from '../lib/notifications/error-monitoring';
import type {
  PushSubscriptionData,
  DeviceTokenRegistration,
  PushNotificationError,
  NotificationSettings,
} from '../types/notifications';

export interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
  subscription: PushSubscription | null;
  isInitialized: boolean;
}

export interface PushNotificationActions {
  initialize: (vapidKey?: string) => Promise<boolean>;
  requestPermission: () => Promise<NotificationPermission>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  sendTestNotification: () => Promise<void>;
  clearError: () => void;
  checkSubscriptionStatus: () => Promise<void>;
  resubscribe: () => Promise<boolean>;
}

export interface UsePushNotificationsReturn extends PushNotificationState, PushNotificationActions {}

/**
 * Comprehensive hook for push notification subscription management
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const { user } = useAuth();
  const { trackError, trackSubscriptionError, trackApiError } = useNotificationErrorTracking();
  const pushManagerRef = useRef<PushNotificationManager>(PushNotificationManager.getInstance());
  
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: 'default',
    isSubscribed: false,
    isLoading: false,
    error: null,
    subscription: null,
    isInitialized: false,
  });

  const updateState = useCallback((updates: Partial<PushNotificationState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const setError = useCallback((error: string | null) => {
    updateState({ error, isLoading: false });
  }, [updateState]);

  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  /**
   * Initialize push notification manager
   */
  const initialize = useCallback(async (vapidKey?: string): Promise<boolean> => {
    updateState({ isLoading: true, error: null });

    try {
      const pushManager = pushManagerRef.current;
      
      // Check support first
      const isSupported = pushManager.isSupported();
      if (!isSupported) {
        updateState({ 
          isSupported: false, 
          isLoading: false,
          error: 'Push notifications are not supported in this browser'
        });
        return false;
      }

      // Initialize the manager
      const success = await pushManager.initialize(vapidKey);
      if (!success) {
        setError('Failed to initialize push notification manager');
        return false;
      }

      // Get current state
      const permission = pushManager.getPermissionStatus();
      const subscription = pushManager.getSubscription();
      const isSubscribed = pushManager.isSubscribed();

      updateState({
        isSupported: true,
        permission,
        subscription,
        isSubscribed,
        isInitialized: true,
        isLoading: false,
        error: null,
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize push notifications';
      
      // Track initialization error
      trackError(
        NotificationErrorType.SERVICE_WORKER_ERROR,
        errorMessage,
        {
          initializationFailed: true,
          vapidKeyProvided: !!vapidKey,
          browserInfo: {
            userAgent: navigator.userAgent,
            pushSupported: 'PushManager' in window,
            serviceWorkerSupported: 'serviceWorker' in navigator
          }
        }
      );
      
      setError(errorMessage);
      return false;
    }
  }, [updateState, setError]);

  /**
   * Request notification permission with user-friendly prompts
   */
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    updateState({ isLoading: true, error: null });

    try {
      const pushManager = pushManagerRef.current;
      
      if (!pushManager.isSupported()) {
        throw new Error('Push notifications are not supported');
      }

      const permission = await pushManager.requestPermission();
      
      updateState({ 
        permission, 
        isLoading: false,
        error: permission === 'denied' ? 'Notification permission was denied' : null
      });

      return permission;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to request permission';
      
      // Track permission error
      trackError(
        NotificationErrorType.PUSH_PERMISSION_DENIED,
        errorMessage,
        {
          permissionRequest: true,
          currentPermission: Notification.permission,
          browserSupported: pushManager.isSupported()
        }
      );
      
      setError(errorMessage);
      return 'denied';
    }
  }, [updateState, setError]);

  /**
   * Subscribe to push notifications and register with backend
   */
  const subscribe = useCallback(async (): Promise<boolean> => {
    updateState({ isLoading: true, error: null });

    try {
      const pushManager = pushManagerRef.current;

      if (!state.isInitialized) {
        throw new Error('Push notification manager not initialized');
      }

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Request permission if not granted
      if (state.permission !== 'granted') {
        const permission = await pushManager.requestPermission();
        if (permission !== 'granted') {
          throw new Error('Notification permission required');
        }
        updateState({ permission });
      }

      // Subscribe to push notifications
      const subscription = await pushManager.subscribe();
      if (!subscription) {
        throw new Error('Failed to create push subscription');
      }

      // Register device token with backend
      const deviceRegistration = pushManager.createDeviceTokenRegistration(user.id);
      if (!deviceRegistration) {
        throw new Error('Failed to create device registration');
      }

      await notificationService.subscribeToPushWithRetry(deviceRegistration.subscription);

      updateState({
        subscription,
        isSubscribed: true,
        isLoading: false,
        error: null,
      });

      console.log('Successfully subscribed to push notifications');
      return true;
    } catch (error) {
      const pushManager = pushManagerRef.current;
      const pushError = pushManager.handleError(error);
      
      // Track subscription error with detailed context
      trackSubscriptionError(pushError, error);
      
      let errorMessage = 'Failed to subscribe to push notifications';
      switch (pushError) {
        case 'permission_denied':
          errorMessage = 'Notification permission was denied. Please enable notifications in your browser settings.';
          break;
        case 'not_supported':
          errorMessage = 'Push notifications are not supported in this browser.';
          break;
        case 'vapid_key_missing':
          errorMessage = 'Push notification configuration is missing. Please contact support.';
          break;
        case 'network_error':
          errorMessage = 'Network error occurred. Please check your connection and try again.';
          break;
        case 'service_worker_error':
          errorMessage = 'Service worker error. Please refresh the page and try again.';
          break;
      }

      setError(errorMessage);
      return false;
    }
  }, [state.isInitialized, state.permission, user?.id, updateState, setError]);

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    updateState({ isLoading: true, error: null });

    try {
      const pushManager = pushManagerRef.current;
      const currentSubscription = pushManager.getSubscription();

      if (currentSubscription) {
        // Unregister from backend first
        try {
          await notificationService.unsubscribeFromPush(currentSubscription.endpoint);
        } catch (error) {
          console.warn('Failed to unregister from backend:', error);
          
          // Track API error for unsubscription
          trackApiError(
            '/api/notifications/unsubscribe',
            'DELETE',
            error?.status || 500,
            error
          );
          
          // Continue with local unsubscription even if backend fails
        }

        // Unsubscribe locally
        const success = await pushManager.unsubscribe();
        if (!success) {
          throw new Error('Failed to unsubscribe from push notifications');
        }
      }

      updateState({
        subscription: null,
        isSubscribed: false,
        isLoading: false,
        error: null,
      });

      console.log('Successfully unsubscribed from push notifications');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to unsubscribe from push notifications';
      
      // Track unsubscription error
      trackError(
        NotificationErrorType.PUSH_SUBSCRIPTION_FAILED,
        errorMessage,
        {
          unsubscriptionFailed: true,
          hadSubscription: !!currentSubscription,
          endpoint: currentSubscription?.endpoint
        }
      );
      
      setError(errorMessage);
      return false;
    }
  }, [updateState, setError]);

  /**
   * Check current subscription status and sync with backend
   */
  const checkSubscriptionStatus = useCallback(async (): Promise<void> => {
    try {
      const pushManager = pushManagerRef.current;
      
      if (!pushManager.isSupported()) {
        return;
      }

      const subscription = pushManager.getSubscription();
      const isSubscribed = pushManager.isSubscribed();
      const permission = pushManager.getPermissionStatus();

      updateState({
        subscription,
        isSubscribed,
        permission,
      });

      // If we have a subscription but user is not authenticated, clean up
      if (subscription && !user?.id) {
        await pushManager.unsubscribe();
        updateState({
          subscription: null,
          isSubscribed: false,
        });
      }
    } catch (error) {
      console.warn('Failed to check subscription status:', error);
    }
  }, [updateState, user?.id]);

  /**
   * Resubscribe to push notifications (useful for error recovery)
   */
  const resubscribe = useCallback(async (): Promise<boolean> => {
    try {
      // First unsubscribe if currently subscribed
      if (state.isSubscribed) {
        await unsubscribe();
      }

      // Wait a moment before resubscribing
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Subscribe again
      return await subscribe();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resubscribe to push notifications';
      
      // Track resubscription error
      trackError(
        NotificationErrorType.PUSH_SUBSCRIPTION_FAILED,
        errorMessage,
        {
          resubscriptionFailed: true,
          wasSubscribed: state.isSubscribed
        }
      );
      
      setError(errorMessage);
      return false;
    }
  }, [state.isSubscribed, unsubscribe, subscribe, setError]);

  /**
   * Send test notification
   */
  const sendTestNotification = useCallback(async (): Promise<void> => {
    updateState({ isLoading: true, error: null });

    try {
      const pushManager = pushManagerRef.current;

      if (!state.isSubscribed) {
        throw new Error('Not subscribed to push notifications');
      }

      // Send test notification through backend
      await notificationService.sendTestNotification();

      updateState({ isLoading: false });
      console.log('Test notification sent');
    } catch (error) {
      // Track API error for test notification
      trackApiError(
        '/api/notifications/test',
        'POST',
        error?.status || 500,
        error
      );
      
      // Fallback to local test notification
      try {
        const pushManager = pushManagerRef.current;
        await pushManager.sendTestNotification(
          'Test Notification',
          'This is a test notification from your internship management system.'
        );
        updateState({ isLoading: false });
      } catch (localError) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to send test notification';
        
        // Track local test notification error
        trackError(
          NotificationErrorType.NOTIFICATION_DISPLAY_FAILED,
          errorMessage,
          {
            testNotificationFailed: true,
            fallbackAttempted: true,
            localError: localError?.toString()
          }
        );
        
        setError(errorMessage);
      }
    }
  }, [state.isSubscribed, updateState, setError]);

  // Initialize on mount and when user changes
  useEffect(() => {
    const initializePushNotifications = async () => {
      if (typeof window === 'undefined') return;

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      await initialize(vapidKey);
    };

    initializePushNotifications();
  }, [initialize]);

  // Check subscription status when user changes
  useEffect(() => {
    if (state.isInitialized) {
      checkSubscriptionStatus();
    }
  }, [user?.id, state.isInitialized, checkSubscriptionStatus]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && state.isInitialized) {
        checkSubscriptionStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [state.isInitialized, checkSubscriptionStatus]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      if (state.isInitialized && state.isSubscribed) {
        checkSubscriptionStatus();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [state.isInitialized, state.isSubscribed, checkSubscriptionStatus]);

  return {
    // State
    ...state,
    
    // Actions
    initialize,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
    clearError,
    checkSubscriptionStatus,
    resubscribe,
  };
}

/**
 * Hook for push notification permission management
 */
export function usePushPermission() {
  const { permission, requestPermission, isSupported } = usePushNotifications();

  const canRequestPermission = isSupported && permission === 'default';
  const hasPermission = permission === 'granted';
  const isBlocked = permission === 'denied';

  return {
    permission,
    canRequestPermission,
    hasPermission,
    isBlocked,
    requestPermission,
    isSupported,
  };
}

/**
 * Hook for push notification subscription status
 */
export function usePushSubscriptionStatus() {
  const {
    isSubscribed,
    subscription,
    subscribe,
    unsubscribe,
    resubscribe,
    isLoading,
    error,
  } = usePushNotifications();

  return {
    isSubscribed,
    subscription,
    subscribe,
    unsubscribe,
    resubscribe,
    isLoading,
    error,
  };
}

/**
 * Hook for push notification testing
 */
export function usePushNotificationTesting() {
  const {
    sendTestNotification,
    isSubscribed,
    isLoading,
    error,
  } = usePushNotifications();

  const canSendTest = isSubscribed && !isLoading;

  return {
    sendTestNotification,
    canSendTest,
    isLoading,
    error,
  };
}