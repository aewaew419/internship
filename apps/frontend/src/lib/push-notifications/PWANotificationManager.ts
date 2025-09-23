'use client';

import type { 
  PushSubscriptionData, 
  NotificationSettings, 
  PushNotificationPayload,
  Notification 
} from '../../types/notifications';

export class PWANotificationManager {
  private static instance: PWANotificationManager;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private vapidPublicKey: string;
  private isInitialized = false;

  constructor(vapidPublicKey: string) {
    this.vapidPublicKey = vapidPublicKey;
  }

  static getInstance(vapidPublicKey?: string): PWANotificationManager {
    if (!PWANotificationManager.instance) {
      if (!vapidPublicKey) {
        throw new Error('VAPID public key is required for first initialization');
      }
      PWANotificationManager.instance = new PWANotificationManager(vapidPublicKey);
    }
    return PWANotificationManager.instance;
  }

  // Initialize PWA notification support
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    try {
      // Check if service workers are supported
      if (!('serviceWorker' in navigator)) {
        console.warn('Service workers not supported');
        return false;
      }

      // Check if push notifications are supported
      if (!('PushManager' in window)) {
        console.warn('Push notifications not supported');
        return false;
      }

      // Register service worker
      this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Set up message listener for service worker communication
      this.setupMessageListener();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize PWA notifications:', error);
      return false;
    }
  }

  // Set up message listener for service worker communication
  private setupMessageListener(): void {
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, url, notificationData, action } = event.data;

      switch (type) {
        case 'NOTIFICATION_CLICK':
          this.handleNotificationClick(url, notificationData);
          break;
        case 'NOTIFICATION_ACTION':
          this.handleNotificationAction(action, notificationData);
          break;
      }
    });
  }

  // Handle notification click from service worker
  private handleNotificationClick(url: string, notificationData: any): void {
    // Navigate to the URL
    if (url && url !== window.location.pathname) {
      window.location.href = url;
    }

    // Dispatch custom event for app to handle
    window.dispatchEvent(new CustomEvent('notificationClick', {
      detail: { url, notificationData }
    }));
  }

  // Handle notification action from service worker
  private handleNotificationAction(action: string, notificationData: any): void {
    // Dispatch custom event for app to handle
    window.dispatchEvent(new CustomEvent('notificationAction', {
      detail: { action, notificationData }
    }));
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    return permission;
  }

  // Subscribe to push notifications
  async subscribe(): Promise<PushSubscriptionData | null> {
    if (!this.serviceWorkerRegistration) {
      throw new Error('Service worker not registered');
    }

    try {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Check for existing subscription
      let subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();

      if (!subscription) {
        // Create new subscription
        subscription = await this.serviceWorkerRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
        });
      }

      // Convert to our format
      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!),
        },
        userId: 0, // Will be set by the caller
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          isMobile: this.isMobileDevice(),
        },
      };

      return subscriptionData;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<boolean> {
    if (!this.serviceWorkerRegistration) {
      return false;
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
      }
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  // Check if currently subscribed
  async isSubscribed(): Promise<boolean> {
    if (!this.serviceWorkerRegistration) {
      return false;
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      return subscription !== null;
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      return false;
    }
  }

  // Get current subscription
  async getSubscription(): Promise<PushSubscriptionData | null> {
    if (!this.serviceWorkerRegistration) {
      return null;
    }

    try {
      const subscription = await this.serviceWorkerRegistration.pushManager.getSubscription();
      if (!subscription) return null;

      return {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!),
        },
        userId: 0, // Will be set by the caller
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          isMobile: this.isMobileDevice(),
        },
      };
    } catch (error) {
      console.error('Failed to get subscription:', error);
      return null;
    }
  }

  // Show local notification (for testing or fallback)
  async showLocalNotification(payload: PushNotificationPayload): Promise<void> {
    const permission = await this.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission denied');
    }

    const options: NotificationOptions = {
      body: payload.body,
      icon: payload.icon || '/favicon.ico',
      badge: payload.badge || '/favicon.ico',
      image: payload.image,
      data: payload.data,
      tag: payload.tag,
      requireInteraction: payload.requireInteraction,
      silent: payload.silent,
      timestamp: payload.timestamp,
      actions: payload.actions?.map(action => ({
        action: action.action,
        title: action.title,
        icon: action.icon,
      })),
    };

    new Notification(payload.title, options);
  }

  // Store notification settings in service worker
  async storeSettings(settings: NotificationSettings): Promise<void> {
    if (!this.serviceWorkerRegistration) {
      throw new Error('Service worker not registered');
    }

    // Send settings to service worker
    const messageChannel = new MessageChannel();
    
    return new Promise((resolve, reject) => {
      messageChannel.port1.onmessage = (event) => {
        if (event.data.success) {
          resolve();
        } else {
          reject(new Error(event.data.error));
        }
      };

      this.serviceWorkerRegistration!.active?.postMessage({
        type: 'STORE_SETTINGS',
        settings: settings,
      }, [messageChannel.port2]);

      // Timeout after 5 seconds
      setTimeout(() => reject(new Error('Timeout storing settings')), 5000);
    });
  }

  // Get stored notification settings from service worker
  async getStoredSettings(): Promise<NotificationSettings | null> {
    if (!this.serviceWorkerRegistration) {
      return null;
    }

    const messageChannel = new MessageChannel();
    
    return new Promise((resolve) => {
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.settings || null);
      };

      this.serviceWorkerRegistration!.active?.postMessage({
        type: 'GET_SETTINGS',
      }, [messageChannel.port2]);

      // Timeout after 5 seconds
      setTimeout(() => resolve(null), 5000);
    });
  }

  // Clear all stored notifications
  async clearStoredNotifications(): Promise<void> {
    if (!this.serviceWorkerRegistration) {
      return;
    }

    const messageChannel = new MessageChannel();
    
    return new Promise((resolve) => {
      messageChannel.port1.onmessage = () => resolve();

      this.serviceWorkerRegistration!.active?.postMessage({
        type: 'CLEAR_NOTIFICATIONS',
      }, [messageChannel.port2]);

      // Timeout after 5 seconds
      setTimeout(() => resolve(), 5000);
    });
  }

  // Get stored notifications for offline access
  async getStoredNotifications(): Promise<Notification[]> {
    if (!this.serviceWorkerRegistration) {
      return [];
    }

    const messageChannel = new MessageChannel();
    
    return new Promise((resolve) => {
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.notifications || []);
      };

      this.serviceWorkerRegistration!.active?.postMessage({
        type: 'GET_NOTIFICATIONS',
      }, [messageChannel.port2]);

      // Timeout after 5 seconds
      setTimeout(() => resolve([]), 5000);
    });
  }

  // Utility methods
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

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
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

  // Check if PWA is installed
  isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  // Check if PWA installation is available
  canInstall(): boolean {
    return 'beforeinstallprompt' in window;
  }

  // Get notification permission status
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  // Check if push notifications are supported
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window;
  }
}