'use client';

import { browserCompatibility } from './browser-compatibility';
import { featureDetection } from './feature-detection';
import type { PushNotificationPayload } from '../../types/notifications';

/**
 * Browser-specific notification handlers
 * Provides optimized notification handling for different browsers
 */

export interface BrowserNotificationHandler {
  canHandle(): boolean;
  displayNotification(payload: PushNotificationPayload): Promise<void>;
  handleNotificationClick(event: NotificationEvent): Promise<void>;
  handleNotificationClose(event: NotificationEvent): Promise<void>;
  handleNotificationAction(event: NotificationEvent): Promise<void>;
}

export class ChromeNotificationHandler implements BrowserNotificationHandler {
  canHandle(): boolean {
    const browserInfo = browserCompatibility.getBrowserInfo();
    return browserInfo.name === 'Chrome' || browserInfo.name === 'Edge';
  }

  async displayNotification(payload: PushNotificationPayload): Promise<void> {
    // Adapt payload for Chrome/Edge
    const adaptedPayload = browserCompatibility.adaptNotificationPayload(payload);
    
    // Chrome supports all features
    const notificationOptions: NotificationOptions = {
      body: adaptedPayload.body,
      icon: adaptedPayload.icon,
      badge: adaptedPayload.badge,
      image: adaptedPayload.image,
      data: adaptedPayload.data,
      actions: adaptedPayload.actions,
      tag: adaptedPayload.tag,
      requireInteraction: adaptedPayload.requireInteraction,
      silent: adaptedPayload.silent,
      timestamp: adaptedPayload.timestamp || Date.now(),
      vibrate: [200, 100, 200], // Default vibration pattern
      renotify: true
    };

    // Use service worker registration to show notification
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(adaptedPayload.title, notificationOptions);
    } else {
      // Fallback to regular notification
      new Notification(adaptedPayload.title, notificationOptions);
    }
  }

  async handleNotificationClick(event: NotificationEvent): Promise<void> {
    event.notification.close();

    // Handle click action
    const data = event.notification.data;
    if (data?.url) {
      // Open URL in existing tab or new tab
      const clients = await self.clients.matchAll({ type: 'window' });
      const existingClient = clients.find(client => client.url === data.url);
      
      if (existingClient) {
        await existingClient.focus();
      } else {
        await self.clients.openWindow(data.url);
      }
    }

    // Track click event
    this.trackNotificationEvent('click', event.notification);
  }

  async handleNotificationClose(event: NotificationEvent): Promise<void> {
    // Track close event
    this.trackNotificationEvent('close', event.notification);
  }

  async handleNotificationAction(event: NotificationEvent): Promise<void> {
    event.notification.close();

    const action = event.action;
    const data = event.notification.data;

    // Handle specific actions
    switch (action) {
      case 'view':
        if (data?.url) {
          await self.clients.openWindow(data.url);
        }
        break;
      case 'dismiss':
        // Just close the notification
        break;
      case 'reply':
        // Handle reply action (if supported)
        break;
      default:
        // Handle custom actions
        if (data?.actions?.[action]) {
          const actionData = data.actions[action];
          if (actionData.url) {
            await self.clients.openWindow(actionData.url);
          }
        }
    }

    // Track action event
    this.trackNotificationEvent('action', event.notification, action);
  }

  private trackNotificationEvent(type: string, notification: Notification, action?: string): void {
    // Send analytics event
    console.log(`Chrome notification ${type}:`, {
      title: notification.title,
      tag: notification.tag,
      action,
      timestamp: Date.now()
    });
  }
}

export class FirefoxNotificationHandler implements BrowserNotificationHandler {
  canHandle(): boolean {
    const browserInfo = browserCompatibility.getBrowserInfo();
    return browserInfo.name === 'Firefox';
  }

  async displayNotification(payload: PushNotificationPayload): Promise<void> {
    // Adapt payload for Firefox limitations
    const adaptedPayload = browserCompatibility.adaptNotificationPayload(payload);
    
    // Firefox has limited badge support and different action handling
    const notificationOptions: NotificationOptions = {
      body: adaptedPayload.body,
      icon: adaptedPayload.icon,
      image: adaptedPayload.image,
      data: adaptedPayload.data,
      tag: adaptedPayload.tag,
      requireInteraction: adaptedPayload.requireInteraction,
      timestamp: adaptedPayload.timestamp || Date.now()
    };

    // Add actions if supported
    const browserInfo = browserCompatibility.getBrowserInfo();
    if (browserInfo.features.actionButtons && adaptedPayload.actions) {
      notificationOptions.actions = adaptedPayload.actions.slice(0, 2); // Firefox supports max 2 actions
    }

    // Firefox doesn't support silent notifications well
    if (adaptedPayload.silent) {
      console.warn('Silent notifications not fully supported in Firefox');
    }

    // Use service worker registration to show notification
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(adaptedPayload.title, notificationOptions);
    } else {
      new Notification(adaptedPayload.title, notificationOptions);
    }
  }

  async handleNotificationClick(event: NotificationEvent): Promise<void> {
    event.notification.close();

    const data = event.notification.data;
    if (data?.url) {
      // Firefox has good support for client management
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const existingClient = clients.find(client => client.url.includes(data.url));
      
      if (existingClient) {
        await existingClient.focus();
      } else {
        await self.clients.openWindow(data.url);
      }
    }

    this.trackNotificationEvent('click', event.notification);
  }

  async handleNotificationClose(event: NotificationEvent): Promise<void> {
    this.trackNotificationEvent('close', event.notification);
  }

  async handleNotificationAction(event: NotificationEvent): Promise<void> {
    event.notification.close();

    const action = event.action;
    const data = event.notification.data;

    // Firefox action handling
    if (data?.url) {
      await self.clients.openWindow(data.url);
    }

    this.trackNotificationEvent('action', event.notification, action);
  }

  private trackNotificationEvent(type: string, notification: Notification, action?: string): void {
    console.log(`Firefox notification ${type}:`, {
      title: notification.title,
      tag: notification.tag,
      action,
      timestamp: Date.now()
    });
  }
}

export class SafariNotificationHandler implements BrowserNotificationHandler {
  canHandle(): boolean {
    const browserInfo = browserCompatibility.getBrowserInfo();
    return browserInfo.name === 'Safari';
  }

  async displayNotification(payload: PushNotificationPayload): Promise<void> {
    // Safari has the most limitations
    const adaptedPayload = browserCompatibility.adaptNotificationPayload(payload);
    
    // Safari doesn't support many advanced features
    const notificationOptions: NotificationOptions = {
      body: adaptedPayload.body,
      icon: adaptedPayload.icon,
      data: adaptedPayload.data,
      tag: adaptedPayload.tag,
      timestamp: adaptedPayload.timestamp || Date.now()
    };

    // Safari doesn't support action buttons, badges, or images in web push
    if (adaptedPayload.actions) {
      console.warn('Action buttons not supported in Safari web push');
    }

    if (adaptedPayload.badge) {
      console.warn('Badges not supported in Safari web push');
    }

    if (adaptedPayload.image) {
      console.warn('Images not fully supported in Safari web push');
    }

    // Safari requires user interaction for many features
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(adaptedPayload.title, notificationOptions);
    } else {
      // Fallback for older Safari versions
      if (Notification.permission === 'granted') {
        new Notification(adaptedPayload.title, notificationOptions);
      }
    }
  }

  async handleNotificationClick(event: NotificationEvent): Promise<void> {
    event.notification.close();

    const data = event.notification.data;
    if (data?.url) {
      // Safari has limited client management
      await self.clients.openWindow(data.url);
    }

    this.trackNotificationEvent('click', event.notification);
  }

  async handleNotificationClose(event: NotificationEvent): Promise<void> {
    this.trackNotificationEvent('close', event.notification);
  }

  async handleNotificationAction(event: NotificationEvent): Promise<void> {
    // Safari doesn't support action buttons in web push
    console.warn('Notification actions not supported in Safari');
    event.notification.close();
  }

  private trackNotificationEvent(type: string, notification: Notification, action?: string): void {
    console.log(`Safari notification ${type}:`, {
      title: notification.title,
      tag: notification.tag,
      action,
      timestamp: Date.now()
    });
  }
}

export class FallbackNotificationHandler implements BrowserNotificationHandler {
  canHandle(): boolean {
    return true; // Always can handle as fallback
  }

  async displayNotification(payload: PushNotificationPayload): Promise<void> {
    // Basic notification with minimal features
    const notificationOptions: NotificationOptions = {
      body: payload.body,
      icon: payload.icon,
      data: payload.data,
      tag: payload.tag
    };

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(payload.title, notificationOptions);
    } else {
      // Ultimate fallback: console log
      console.log(`📢 Notification: ${payload.title}`, payload.body);
      
      // Show in-page notification
      this.showInPageNotification(payload);
    }
  }

  async handleNotificationClick(event: NotificationEvent): Promise<void> {
    event.notification.close();
    
    const data = event.notification.data;
    if (data?.url) {
      window.open(data.url, '_blank');
    }

    this.trackNotificationEvent('click', event.notification);
  }

  async handleNotificationClose(event: NotificationEvent): Promise<void> {
    this.trackNotificationEvent('close', event.notification);
  }

  async handleNotificationAction(event: NotificationEvent): Promise<void> {
    event.notification.close();
    this.trackNotificationEvent('action', event.notification, event.action);
  }

  private showInPageNotification(payload: PushNotificationPayload): void {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #333;
      color: white;
      padding: 15px;
      border-radius: 8px;
      max-width: 350px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      cursor: pointer;
      transition: transform 0.2s ease;
    `;
    
    notification.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 8px; font-size: 16px;">${payload.title}</div>
      <div style="font-size: 14px; line-height: 1.4; opacity: 0.9;">${payload.body || ''}</div>
      <div style="position: absolute; top: 8px; right: 8px; font-size: 18px; opacity: 0.7;">×</div>
    `;
    
    document.body.appendChild(notification);
    
    // Hover effect
    notification.addEventListener('mouseenter', () => {
      notification.style.transform = 'translateY(-2px)';
    });
    
    notification.addEventListener('mouseleave', () => {
      notification.style.transform = 'translateY(0)';
    });
    
    // Auto-remove after 8 seconds
    const timeout = setTimeout(() => {
      if (notification.parentNode) {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    }, 8000);
    
    // Click to dismiss or navigate
    notification.addEventListener('click', () => {
      clearTimeout(timeout);
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      
      if (payload.data?.url) {
        window.open(payload.data.url, '_blank');
      }
    });
  }

  private trackNotificationEvent(type: string, notification: Notification, action?: string): void {
    console.log(`Fallback notification ${type}:`, {
      title: notification.title,
      tag: notification.tag,
      action,
      timestamp: Date.now()
    });
  }
}

export class BrowserNotificationManager {
  private static instance: BrowserNotificationManager;
  private handlers: BrowserNotificationHandler[];
  private activeHandler: BrowserNotificationHandler | null = null;

  private constructor() {
    this.handlers = [
      new ChromeNotificationHandler(),
      new FirefoxNotificationHandler(),
      new SafariNotificationHandler(),
      new FallbackNotificationHandler()
    ];
  }

  static getInstance(): BrowserNotificationManager {
    if (!BrowserNotificationManager.instance) {
      BrowserNotificationManager.instance = new BrowserNotificationManager();
    }
    return BrowserNotificationManager.instance;
  }

  /**
   * Initialize and select appropriate handler
   */
  initialize(): void {
    this.activeHandler = this.handlers.find(handler => handler.canHandle()) || null;
    
    if (this.activeHandler) {
      const browserInfo = browserCompatibility.getBrowserInfo();
      console.log(`Initialized notification handler for ${browserInfo.name}`);
    }
  }

  /**
   * Display notification using appropriate handler
   */
  async displayNotification(payload: PushNotificationPayload): Promise<void> {
    if (!this.activeHandler) {
      this.initialize();
    }

    if (this.activeHandler) {
      // Validate payload for browser compatibility
      const validation = browserCompatibility.validateNotificationPayload(payload);
      if (!validation.isValid) {
        console.warn('Notification payload validation failed:', validation.errors);
      }

      await this.activeHandler.displayNotification(payload);
    } else {
      throw new Error('No notification handler available');
    }
  }

  /**
   * Handle notification click
   */
  async handleNotificationClick(event: NotificationEvent): Promise<void> {
    if (this.activeHandler) {
      await this.activeHandler.handleNotificationClick(event);
    }
  }

  /**
   * Handle notification close
   */
  async handleNotificationClose(event: NotificationEvent): Promise<void> {
    if (this.activeHandler) {
      await this.activeHandler.handleNotificationClose(event);
    }
  }

  /**
   * Handle notification action
   */
  async handleNotificationAction(event: NotificationEvent): Promise<void> {
    if (this.activeHandler) {
      await this.activeHandler.handleNotificationAction(event);
    }
  }

  /**
   * Get active handler info
   */
  getActiveHandlerInfo(): { name: string; canHandle: boolean } | null {
    if (!this.activeHandler) {
      return null;
    }

    return {
      name: this.activeHandler.constructor.name,
      canHandle: this.activeHandler.canHandle()
    };
  }
}

// Export singleton instance
export const browserNotificationManager = BrowserNotificationManager.getInstance();