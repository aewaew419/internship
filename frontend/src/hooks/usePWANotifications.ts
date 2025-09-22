'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PWANotificationManager } from '../lib/push-notifications/PWANotificationManager';
import { useNotifications } from './useNotifications';
import type { 
  PushSubscriptionData, 
  NotificationSettings, 
  PushNotificationPayload,
  Notification 
} from '../types/notifications';

interface PWANotificationState {
  isSupported: boolean;
  isInstalled: boolean;
  canInstall: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isInitializing: boolean;
  error: string | null;
}

export function usePWANotifications() {
  const [state, setState] = useState<PWANotificationState>({
    isSupported: false,
    isInstalled: false,
    canInstall: false,
    permission: 'default',
    isSubscribed: false,
    isInitializing: true,
    error: null,
  });

  const { settings, updateSettings } = useNotifications();
  const managerRef = useRef<PWANotificationManager | null>(null);
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

  // Initialize PWA notification manager
  useEffect(() => {
    const initializePWA = async () => {
      try {
        if (!vapidPublicKey) {
          throw new Error('VAPID public key not configured');
        }

        const manager = PWANotificationManager.getInstance(vapidPublicKey);
        managerRef.current = manager;

        const initialized = await manager.initialize();
        if (!initialized) {
          throw new Error('Failed to initialize PWA notifications');
        }

        // Update state
        setState(prev => ({
          ...prev,
          isSupported: manager.isSupported(),
          isInstalled: manager.isInstalled(),
          canInstall: manager.canInstall(),
          permission: manager.getPermissionStatus(),
          isSubscribed: await manager.isSubscribed(),
          isInitializing: false,
        }));

        // Set up event listeners
        setupEventListeners();

      } catch (error) {
        console.error('PWA initialization error:', error);
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Unknown error',
          isInitializing: false,
        }));
      }
    };

    initializePWA();
  }, [vapidPublicKey]);

  // Set up event listeners for PWA events
  const setupEventListeners = useCallback(() => {
    // Listen for notification clicks
    const handleNotificationClick = (event: CustomEvent) => {
      const { url, notificationData } = event.detail;
      console.log('Notification clicked:', { url, notificationData });
      
      // Handle navigation or other actions
      if (url && url !== window.location.pathname) {
        window.location.href = url;
      }
    };

    // Listen for notification actions
    const handleNotificationAction = (event: CustomEvent) => {
      const { action, notificationData } = event.detail;
      console.log('Notification action:', { action, notificationData });
      
      // Handle specific actions
      switch (action) {
        case 'accept':
          // Handle accept action
          break;
        case 'evaluate':
          // Handle evaluate action
          break;
        case 'upload':
          // Handle upload action
          break;
        default:
          console.log('Unhandled notification action:', action);
      }
    };

    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setState(prev => ({ ...prev, canInstall: true }));
    };

    // Listen for PWA app installed
    const handleAppInstalled = () => {
      setState(prev => ({ ...prev, isInstalled: true, canInstall: false }));
    };

    window.addEventListener('notificationClick', handleNotificationClick as EventListener);
    window.addEventListener('notificationAction', handleNotificationAction as EventListener);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('notificationClick', handleNotificationClick as EventListener);
      window.removeEventListener('notificationAction', handleNotificationAction as EventListener);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!managerRef.current) {
      throw new Error('PWA manager not initialized');
    }

    try {
      const permission = await managerRef.current.requestPermission();
      setState(prev => ({ ...prev, permission }));
      return permission;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to request permission';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<PushSubscriptionData | null> => {
    if (!managerRef.current) {
      throw new Error('PWA manager not initialized');
    }

    try {
      const subscription = await managerRef.current.subscribe();
      if (subscription) {
        setState(prev => ({ ...prev, isSubscribed: true }));
        
        // Update settings to enable push notifications
        await updateSettings({ pushNotifications: true });
      }
      return subscription;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to subscribe';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [updateSettings]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!managerRef.current) {
      throw new Error('PWA manager not initialized');
    }

    try {
      const success = await managerRef.current.unsubscribe();
      if (success) {
        setState(prev => ({ ...prev, isSubscribed: false }));
        
        // Update settings to disable push notifications
        await updateSettings({ pushNotifications: false });
      }
      return success;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to unsubscribe';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [updateSettings]);

  // Get current subscription
  const getSubscription = useCallback(async (): Promise<PushSubscriptionData | null> => {
    if (!managerRef.current) {
      return null;
    }

    try {
      return await managerRef.current.getSubscription();
    } catch (error) {
      console.error('Failed to get subscription:', error);
      return null;
    }
  }, []);

  // Show local notification (for testing)
  const showLocalNotification = useCallback(async (payload: PushNotificationPayload): Promise<void> => {
    if (!managerRef.current) {
      throw new Error('PWA manager not initialized');
    }

    try {
      await managerRef.current.showLocalNotification(payload);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to show notification';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  // Store settings in service worker
  const storeSettings = useCallback(async (settings: NotificationSettings): Promise<void> => {
    if (!managerRef.current) {
      return;
    }

    try {
      await managerRef.current.storeSettings(settings);
    } catch (error) {
      console.error('Failed to store settings in service worker:', error);
    }
  }, []);

  // Get stored settings from service worker
  const getStoredSettings = useCallback(async (): Promise<NotificationSettings | null> => {
    if (!managerRef.current) {
      return null;
    }

    try {
      return await managerRef.current.getStoredSettings();
    } catch (error) {
      console.error('Failed to get stored settings:', error);
      return null;
    }
  }, []);

  // Clear stored notifications
  const clearStoredNotifications = useCallback(async (): Promise<void> => {
    if (!managerRef.current) {
      return;
    }

    try {
      await managerRef.current.clearStoredNotifications();
    } catch (error) {
      console.error('Failed to clear stored notifications:', error);
    }
  }, []);

  // Get stored notifications for offline access
  const getStoredNotifications = useCallback(async (): Promise<Notification[]> => {
    if (!managerRef.current) {
      return [];
    }

    try {
      return await managerRef.current.getStoredNotifications();
    } catch (error) {
      console.error('Failed to get stored notifications:', error);
      return [];
    }
  }, []);

  // Install PWA
  const installPWA = useCallback(async (): Promise<boolean> => {
    if (!state.canInstall) {
      return false;
    }

    try {
      const beforeInstallPromptEvent = (window as any).deferredPrompt;
      if (beforeInstallPromptEvent) {
        beforeInstallPromptEvent.prompt();
        const { outcome } = await beforeInstallPromptEvent.userChoice;
        
        if (outcome === 'accepted') {
          setState(prev => ({ ...prev, isInstalled: true, canInstall: false }));
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to install PWA:', error);
      return false;
    }
  }, [state.canInstall]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Sync settings with service worker when they change
  useEffect(() => {
    if (settings && managerRef.current) {
      storeSettings(settings);
    }
  }, [settings, storeSettings]);

  return {
    // State
    ...state,
    
    // Actions
    requestPermission,
    subscribe,
    unsubscribe,
    getSubscription,
    showLocalNotification,
    installPWA,
    clearError,
    
    // Storage
    storeSettings,
    getStoredSettings,
    clearStoredNotifications,
    getStoredNotifications,
    
    // Utilities
    manager: managerRef.current,
  };
}

// Hook for PWA installation prompt
export function usePWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to prompt install:', error);
      return false;
    }
  }, [deferredPrompt]);

  return {
    isInstallable,
    isInstalled,
    promptInstall,
  };
}