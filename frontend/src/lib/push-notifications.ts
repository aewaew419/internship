'use client';

import { ServiceWorkerManager } from './serviceWorker';
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
      // Get VAPID key from environment or parameter
      this.vapidPublicKey = vapidKey || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
      
      if (!this.vapidPublicKey) {
        console.warn('VAPID public key not configured');
        return false;
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
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
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

      // Subscribe to push notifications
      this.subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey) as BufferSource
      });

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
   * Handle push notification errors
   */
  handleError(error: any): PushNotificationError {
    if (error.message?.includes('permission')) {
      return PushNotificationError.PERMISSION_DENIED;
    }
    if (error.message?.includes('not supported')) {
      return PushNotificationError.NOT_SUPPORTED;
    }
    if (error.message?.includes('subscription')) {
      return PushNotificationError.SUBSCRIPTION_FAILED;
    }
    if (error.message?.includes('network')) {
      return PushNotificationError.NETWORK_ERROR;
    }
    if (error.message?.includes('service worker')) {
      return PushNotificationError.SERVICE_WORKER_ERROR;
    }
    if (error.message?.includes('vapid')) {
      return PushNotificationError.VAPID_KEY_MISSING;
    }
    return PushNotificationError.SUBSCRIPTION_FAILED;
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