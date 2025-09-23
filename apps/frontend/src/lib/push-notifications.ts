'use client';

import { ServiceWorkerManager } from './serviceWorker';
import { initializeCrossBrowserCompatibility } from './push-notifications';
import { browserCompatibility } from './push-notifications/browser-compatibility';
import { featureDetection } from './push-notifications/feature-detection';
import { compatibilityManager } from './push-notifications/compatibility-layers';
import { 
  PushSubscriptionData, 
  DeviceTokenRegistration, 
  PushNotificationError,
  NotificationSettings 
} from '../types/notifications';

export class PushNotificationManager {
  private static instance: PushNotificationManager;
  private serviceWorkerManager: ServiceWorkerManager;
  private vapidPublicKey: string | null = null;
  private subscription: PushSubscription | null = null;
  private isInitialized: boolean = false;

  private constructor() {
    this.serviceWorkerManager = ServiceWorkerManager.getInstance();
  }

  static getInstance(): PushNotificationManager {
    if (!PushNotificationManager.instance) {
      PushNotificationManager.instance = new PushNotificationManager();
    }
    return PushNotificationManager.instance;
  }

  /**
   * Initialize push notification manager with VAPID key
   */
  async initialize(vapidKey?: string): Promise<boolean> {
    try {
      // Initialize cross-browser compatibility system
      const compatibilityResult = await initializeCrossBrowserCompatibility();
      
      if (!compatibilityResult.isSupported) {
        console.warn('Push notifications not supported:', compatibilityResult.detectionResult.limitations);
        return false;
      }

      // Get VAPID key from environment or parameter
      this.vapidPublicKey = vapidKey || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
      
      if (!this.vapidPublicKey) {
        console.warn('VAPID public key not configured');
        return false;
      }

      // Validate VAPID key for browser compatibility
      if (!browserCompatibility.isVapidSupported()) {
        console.warn('VAPID not supported in this browser');
      }

      // Register service worker
      const registration = await this.serviceWorkerManager.register();
      if (!registration) {
        throw new Error('Service worker registration failed');
      }

      // Check if already subscribed
      this.subscription = await registration.pushManager.getSubscription();
      
      this.isInitialized = true;
      console.log('Push notification manager initialized successfully');
      console.log('Compatibility result:', compatibilityResult);
      return true;
    } catch (error) {
      console.error('Push notification manager initialization failed:', error);
      return false;
    }
  }

  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return browserCompatibility.isSupported();
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!this.isSupported()) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error(PushNotificationError.NOT_SUPPORTED);
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission;
    }

    return Notification.permission;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<PushSubscription | null> {
    try {
      if (!this.isInitialized) {
        throw new Error('Push notification manager not initialized');
      }

      if (!this.vapidPublicKey) {
        throw new Error(PushNotificationError.VAPID_KEY_MISSING);
      }

      // Check browser compatibility
      const config = browserCompatibility.getConfig();
      if (config.requiresUserGesture) {
        console.log('Browser requires user gesture for subscription');
      }

      // Request permission first
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error(PushNotificationError.PERMISSION_DENIED);
      }

      // Get service worker registration
      const registration = await this.serviceWorkerManager.register();
      if (!registration) {
        throw new Error(PushNotificationError.SERVICE_WORKER_ERROR);
      }

      // Get browser-specific subscription options
      const subscriptionOptions = browserCompatibility.getSubscriptionOptions(this.vapidPublicKey);

      // Subscribe to push notifications with browser-specific options
      this.subscription = await registration.pushManager.subscribe(subscriptionOptions);

      console.log('Push subscription successful');
      return this.subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    try {
      if (this.subscription) {
        const success = await this.subscription.unsubscribe();
        if (success) {
          this.subscription = null;
          console.log('Push unsubscription successful');
        }
        return success;
      }
      return true;
    } catch (error) {
      console.error('Push unsubscription failed:', error);
      return false;
    }
  }

  /**
   * Get current push subscription
   */
  getSubscription(): PushSubscription | null {
    return this.subscription;
  }

  /**
   * Check if currently subscribed to push notifications
   */
  isSubscribed(): boolean {
    return this.subscription !== null;
  }

  /**
   * Convert push subscription to registration data
   */
  getSubscriptionData(): PushSubscriptionData | null {
    if (!this.subscription) {
      return null;
    }

    const keys = this.subscription.getKey ? {
      p256dh: this.arrayBufferToBase64(this.subscription.getKey('p256dh')),
      auth: this.arrayBufferToBase64(this.subscription.getKey('auth'))
    } : { p256dh: '', auth: '' };

    return {
      endpoint: this.subscription.endpoint,
      keys,
      userId: 0, // Will be set when registering with backend
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        isMobile: this.isMobileDevice()
      }
    };
  }

  /**
   * Create device token registration payload
   */
  createDeviceTokenRegistration(userId: number): DeviceTokenRegistration | null {
    const subscriptionData = this.getSubscriptionData();
    if (!subscriptionData) {
      return null;
    }

    return {
      subscription: {
        ...subscriptionData,
        userId
      },
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      isMobile: this.isMobileDevice()
    };
  }

  /**
   * Test push notification (for development)
   */
  async sendTestNotification(title: string = 'Test Notification', body: string = 'This is a test notification'): Promise<void> {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      throw new Error('Notifications not supported or permission not granted');
    }

    // Show local notification for testing
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico'
    });
  }

  /**
   * Handle push notification errors with browser-specific messages
   */
  handleError(error: any): PushNotificationError {
    let errorType: PushNotificationError;
    
    if (error.message?.includes('permission')) {
      errorType = PushNotificationError.PERMISSION_DENIED;
    } else if (error.message?.includes('not supported')) {
      errorType = PushNotificationError.NOT_SUPPORTED;
    } else if (error.message?.includes('subscription')) {
      errorType = PushNotificationError.SUBSCRIPTION_FAILED;
    } else if (error.message?.includes('network')) {
      errorType = PushNotificationError.NETWORK_ERROR;
    } else if (error.message?.includes('service worker')) {
      errorType = PushNotificationError.SERVICE_WORKER_ERROR;
    } else if (error.message?.includes('vapid')) {
      errorType = PushNotificationError.VAPID_KEY_MISSING;
    } else {
      errorType = PushNotificationError.SUBSCRIPTION_FAILED;
    }

    // Log browser-specific error message
    const browserSpecificMessage = browserCompatibility.getBrowserSpecificErrorMessage(errorType);
    console.error('Browser-specific error message:', browserSpecificMessage);

    return errorType;
  }

  /**
   * Get browser-specific error message
   */
  getBrowserSpecificErrorMessage(error: PushNotificationError): string {
    return browserCompatibility.getBrowserSpecificErrorMessage(error);
  }

  /**
   * Get browser setup instructions
   */
  getSetupInstructions(): string[] {
    return browserCompatibility.getSetupInstructions();
  }

  /**
   * Get browser compatibility information
   */
  getBrowserInfo() {
    return browserCompatibility.getBrowserInfo();
  }

  /**
   * Get feature detection results
   */
  getFeatureDetectionResult() {
    return featureDetection.getDetectionResult();
  }

  // Private helper methods

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer | null): string {
    if (!buffer) return '';
    
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
}

// Hook for using push notifications in React components
export function usePushNotifications() {
  const pushManager = PushNotificationManager.getInstance();

  return {
    initialize: (vapidKey?: string) => pushManager.initialize(vapidKey),
    isSupported: () => pushManager.isSupported(),
    getPermissionStatus: () => pushManager.getPermissionStatus(),
    requestPermission: () => pushManager.requestPermission(),
    subscribe: () => pushManager.subscribe(),
    unsubscribe: () => pushManager.unsubscribe(),
    getSubscription: () => pushManager.getSubscription(),
    isSubscribed: () => pushManager.isSubscribed(),
    getSubscriptionData: () => pushManager.getSubscriptionData(),
    createDeviceTokenRegistration: (userId: number) => pushManager.createDeviceTokenRegistration(userId),
    sendTestNotification: (title?: string, body?: string) => pushManager.sendTestNotification(title, body),
    handleError: (error: any) => pushManager.handleError(error)
  };
}