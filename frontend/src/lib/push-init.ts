'use client';

import { PushNotificationManager } from './push-notifications';
import { PushNotificationConfig } from './push-config';
import { ServiceWorkerManager } from './serviceWorker';

export interface PushInitializationResult {
  success: boolean;
  error?: string;
  subscription?: PushSubscription;
  config?: any;
}

/**
 * Initialize push notification system
 * This function should be called once when the app starts
 */
export async function initializePushNotifications(): Promise<PushInitializationResult> {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return {
        success: false,
        error: 'Not in browser environment'
      };
    }

    // Get configuration
    const configManager = PushNotificationConfig.getInstance();
    const config = configManager.getConfig();
    
    // Validate configuration
    const validation = configManager.validateConfig();
    if (!validation.isValid) {
      console.warn('Push notification configuration invalid:', validation.errors);
      return {
        success: false,
        error: `Configuration invalid: ${validation.errors.join(', ')}`,
        config: configManager.getDebugInfo()
      };
    }

    // Initialize service worker first
    const serviceWorkerManager = ServiceWorkerManager.getInstance();
    const registration = await serviceWorkerManager.register();
    
    if (!registration) {
      return {
        success: false,
        error: 'Service worker registration failed'
      };
    }

    // Initialize push notification manager
    const pushManager = PushNotificationManager.getInstance();
    const initialized = await pushManager.initialize(config.vapidPublicKey || undefined);
    
    if (!initialized) {
      return {
        success: false,
        error: 'Push notification manager initialization failed'
      };
    }

    // Check if already subscribed
    const existingSubscription = pushManager.getSubscription();
    
    console.log('Push notification system initialized successfully');
    
    return {
      success: true,
      subscription: existingSubscription || undefined,
      config: config.isDevelopment ? configManager.getDebugInfo() : undefined
    };
    
  } catch (error) {
    console.error('Push notification initialization failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Request push notification permission and subscribe
 */
export async function requestPushNotificationPermission(): Promise<PushInitializationResult> {
  try {
    const pushManager = PushNotificationManager.getInstance();
    
    // Request permission
    const permission = await pushManager.requestPermission();
    
    if (permission !== 'granted') {
      return {
        success: false,
        error: `Permission ${permission}`
      };
    }

    // Subscribe to push notifications
    const subscription = await pushManager.subscribe();
    
    if (!subscription) {
      return {
        success: false,
        error: 'Failed to create push subscription'
      };
    }

    console.log('Push notification permission granted and subscribed');
    
    return {
      success: true,
      subscription
    };
    
  } catch (error) {
    console.error('Push notification permission request failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check push notification status
 */
export function getPushNotificationStatus(): {
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isEnabled: boolean;
} {
  const pushManager = PushNotificationManager.getInstance();
  const configManager = PushNotificationConfig.getInstance();
  
  return {
    isSupported: pushManager.isSupported(),
    permission: pushManager.getPermissionStatus(),
    isSubscribed: pushManager.isSubscribed(),
    isEnabled: configManager.isEnabled()
  };
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  try {
    const pushManager = PushNotificationManager.getInstance();
    return await pushManager.unsubscribe();
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
    return false;
  }
}

/**
 * Get push subscription data for backend registration
 */
export function getPushSubscriptionData(userId: number) {
  const pushManager = PushNotificationManager.getInstance();
  return pushManager.createDeviceTokenRegistration(userId);
}

/**
 * Test push notification (development only)
 */
export async function testPushNotification(title?: string, body?: string): Promise<boolean> {
  try {
    const configManager = PushNotificationConfig.getInstance();
    
    if (!configManager.isDevelopment()) {
      console.warn('Test notifications only available in development');
      return false;
    }

    const pushManager = PushNotificationManager.getInstance();
    await pushManager.sendTestNotification(title, body);
    return true;
  } catch (error) {
    console.error('Test notification failed:', error);
    return false;
  }
}