'use client';

import { browserCompatibility } from './browser-compatibility';
import { polyfillManager } from './polyfills';

/**
 * Compatibility layers for consistent push notification behavior across browsers
 */

export interface CompatibilityLayer {
  name: string;
  isActive: boolean;
  initialize(): Promise<void>;
  cleanup(): void;
}

export class ServiceWorkerCompatibilityLayer implements CompatibilityLayer {
  name = 'ServiceWorkerCompatibility';
  isActive = false;

  async initialize(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return;
    }

    // Handle different service worker implementations
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none' // Ensure fresh service worker updates
    });

    // Handle browser-specific service worker behaviors
    const browserInfo = browserCompatibility.getBrowserInfo();
    
    switch (browserInfo.name) {
      case 'Safari':
        // Safari has stricter service worker requirements
        await this.handleSafariServiceWorker(registration);
        break;
      case 'Firefox':
        // Firefox has different update mechanisms
        await this.handleFirefoxServiceWorker(registration);
        break;
      default:
        // Chrome/Edge standard behavior
        await this.handleStandardServiceWorker(registration);
    }

    this.isActive = true;
  }

  private async handleSafariServiceWorker(registration: ServiceWorkerRegistration): Promise<void> {
    // Safari requires explicit update checks
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            console.log('New service worker available (Safari)');
          }
        });
      }
    });

    // Check for updates more frequently in Safari
    setInterval(() => {
      registration.update();
    }, 60000); // Check every minute
  }

  private async handleFirefoxServiceWorker(registration: ServiceWorkerRegistration): Promise<void> {
    // Firefox handles updates differently
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            console.log('New service worker available (Firefox)');
            // Firefox may need explicit activation
            newWorker.postMessage({ action: 'skipWaiting' });
          }
        });
      }
    });
  }

  private async handleStandardServiceWorker(registration: ServiceWorkerRegistration): Promise<void> {
    // Standard Chrome/Edge behavior
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('New service worker available');
          }
        });
      }
    });
  }

  cleanup(): void {
    this.isActive = false;
  }
}

export class PushSubscriptionCompatibilityLayer implements CompatibilityLayer {
  name = 'PushSubscriptionCompatibility';
  isActive = false;

  async initialize(): Promise<void> {
    if (!('PushManager' in window)) {
      console.warn('Push Manager not supported');
      return;
    }

    // Normalize push subscription behavior across browsers
    this.normalizePushSubscription();
    this.isActive = true;
  }

  private normalizePushSubscription(): void {
    const browserInfo = browserCompatibility.getBrowserInfo();
    
    // Add browser-specific subscription handling
    const originalSubscribe = PushManager.prototype.subscribe;
    PushManager.prototype.subscribe = async function(options: PushSubscriptionOptions) {
      try {
        // Apply browser-specific options
        const normalizedOptions = browserCompatibility.getSubscriptionOptions(
          options.applicationServerKey as string
        );
        
        return await originalSubscribe.call(this, normalizedOptions);
      } catch (error) {
        // Handle browser-specific errors
        console.error(`Push subscription failed in ${browserInfo.name}:`, error);
        throw error;
      }
    };
  }

  cleanup(): void {
    this.isActive = false;
  }
}

export class NotificationCompatibilityLayer implements CompatibilityLayer {
  name = 'NotificationCompatibility';
  isActive = false;

  async initialize(): Promise<void> {
    if (!('Notification' in window)) {
      console.warn('Notification API not supported');
      return;
    }

    // Normalize notification behavior
    this.normalizeNotificationAPI();
    this.normalizeNotificationPermissions();
    this.isActive = true;
  }

  private normalizeNotificationAPI(): void {
    const browserInfo = browserCompatibility.getBrowserInfo();
    
    // Store original constructor
    const OriginalNotification = window.Notification;
    
    // Create wrapper constructor
    (window as any).Notification = function(title: string, options: NotificationOptions = {}) {
      // Adapt options for browser compatibility
      const adaptedOptions = browserCompatibility.adaptNotificationPayload({
        title,
        ...options
      });
      
      // Remove title from options since it's passed separately
      const { title: _, ...notificationOptions } = adaptedOptions;
      
      return new OriginalNotification(adaptedOptions.title, notificationOptions);
    };
    
    // Copy static properties
    Object.setPrototypeOf(window.Notification, OriginalNotification);
    Object.defineProperty(window.Notification, 'permission', {
      get: () => OriginalNotification.permission
    });
    Object.defineProperty(window.Notification, 'requestPermission', {
      value: OriginalNotification.requestPermission.bind(OriginalNotification)
    });
  }

  private normalizeNotificationPermissions(): void {
    const browserInfo = browserCompatibility.getBrowserInfo();
    
    // Handle browser-specific permission behaviors
    const originalRequestPermission = Notification.requestPermission;
    
    Notification.requestPermission = async function(): Promise<NotificationPermission> {
      try {
        // Safari and some browsers require user gesture
        if (browserInfo.name === 'Safari' && !document.hasFocus()) {
          throw new Error('User gesture required for Safari notification permission');
        }
        
        const permission = await originalRequestPermission();
        
        // Log browser-specific permission result
        console.log(`Notification permission in ${browserInfo.name}:`, permission);
        
        return permission;
      } catch (error) {
        console.error(`Permission request failed in ${browserInfo.name}:`, error);
        return 'denied';
      }
    };
  }

  cleanup(): void {
    this.isActive = false;
  }
}

export class EventCompatibilityLayer implements CompatibilityLayer {
  name = 'EventCompatibility';
  isActive = false;

  async initialize(): Promise<void> {
    // Normalize event handling across browsers
    this.normalizeVisibilityAPI();
    this.normalizeConnectionAPI();
    this.normalizeVibrationAPI();
    this.isActive = true;
  }

  private normalizeVisibilityAPI(): void {
    // Already handled in polyfills, but add additional normalization
    if (!('visibilityState' in document)) {
      return;
    }

    // Add consistent event handling
    const originalAddEventListener = document.addEventListener;
    document.addEventListener = function(type: string, listener: EventListener, options?: boolean | AddEventListenerOptions) {
      if (type === 'visibilitychange') {
        // Ensure consistent behavior across browsers
        const wrappedListener = (event: Event) => {
          // Add small delay for Safari
          const browserInfo = browserCompatibility.getBrowserInfo();
          if (browserInfo.name === 'Safari') {
            setTimeout(() => listener(event), 10);
          } else {
            listener(event);
          }
        };
        return originalAddEventListener.call(this, type, wrappedListener, options);
      }
      return originalAddEventListener.call(this, type, listener, options);
    };
  }

  private normalizeConnectionAPI(): void {
    if (!('connection' in navigator)) {
      return;
    }

    // Add consistent connection change handling
    const connection = (navigator as any).connection;
    if (connection && connection.addEventListener) {
      const originalAddEventListener = connection.addEventListener;
      connection.addEventListener = function(type: string, listener: EventListener) {
        if (type === 'change') {
          // Add debouncing for connection changes
          let timeout: NodeJS.Timeout;
          const debouncedListener = (event: Event) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => listener(event), 100);
          };
          return originalAddEventListener.call(this, type, debouncedListener);
        }
        return originalAddEventListener.call(this, type, listener);
      };
    }
  }

  private normalizeVibrationAPI(): void {
    if (!('vibrate' in navigator)) {
      return;
    }

    // Normalize vibration patterns across browsers
    const originalVibrate = navigator.vibrate;
    (navigator as any).vibrate = function(pattern: number | number[]): boolean {
      const browserInfo = browserCompatibility.getBrowserInfo();
      
      // Some browsers have different vibration limits
      if (Array.isArray(pattern)) {
        // Limit pattern length for compatibility
        const limitedPattern = pattern.slice(0, 10);
        return originalVibrate.call(this, limitedPattern);
      }
      
      // Limit single vibration duration
      const duration = Math.min(pattern, 5000);
      return originalVibrate.call(this, duration);
    };
  }

  cleanup(): void {
    this.isActive = false;
  }
}

export class CompatibilityManager {
  private static instance: CompatibilityManager;
  private layers: CompatibilityLayer[] = [];
  private isInitialized = false;

  private constructor() {
    this.layers = [
      new ServiceWorkerCompatibilityLayer(),
      new PushSubscriptionCompatibilityLayer(),
      new NotificationCompatibilityLayer(),
      new EventCompatibilityLayer()
    ];
  }

  static getInstance(): CompatibilityManager {
    if (!CompatibilityManager.instance) {
      CompatibilityManager.instance = new CompatibilityManager();
    }
    return CompatibilityManager.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Initialize polyfills first
    polyfillManager.initialize();

    // Initialize compatibility layers
    for (const layer of this.layers) {
      try {
        await layer.initialize();
        console.log(`Initialized compatibility layer: ${layer.name}`);
      } catch (error) {
        console.error(`Failed to initialize compatibility layer ${layer.name}:`, error);
      }
    }

    this.isInitialized = true;
    console.log('Cross-browser compatibility layers initialized');
  }

  cleanup(): void {
    for (const layer of this.layers) {
      try {
        layer.cleanup();
      } catch (error) {
        console.error(`Failed to cleanup compatibility layer ${layer.name}:`, error);
      }
    }
    this.isInitialized = false;
  }

  getActiveLayersStatus(): { name: string; isActive: boolean }[] {
    return this.layers.map(layer => ({
      name: layer.name,
      isActive: layer.isActive
    }));
  }

  isLayerActive(layerName: string): boolean {
    const layer = this.layers.find(l => l.name === layerName);
    return layer?.isActive || false;
  }
}

// Export singleton instance
export const compatibilityManager = CompatibilityManager.getInstance();