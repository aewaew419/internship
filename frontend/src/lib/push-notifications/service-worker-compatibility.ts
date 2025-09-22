'use client';

import { browserCompatibility } from './browser-compatibility';
import { browserNotificationManager } from './browser-handlers';

/**
 * Service worker compatibility enhancements for cross-browser support
 */

export interface ServiceWorkerEnhancement {
  name: string;
  isActive: boolean;
  enhance(): void;
  cleanup(): void;
}

export class PushEventEnhancement implements ServiceWorkerEnhancement {
  name = 'PushEventEnhancement';
  isActive = false;

  enhance(): void {
    if (typeof self === 'undefined' || !('addEventListener' in self)) {
      return;
    }

    // Enhance push event handling for different browsers
    const originalPushHandler = self.onpush;
    
    self.addEventListener('push', async (event: PushEvent) => {
      try {
        const browserInfo = browserCompatibility.getBrowserInfo();
        console.log(`Push event received in ${browserInfo.name}`);

        // Browser-specific push event handling
        await this.handleBrowserSpecificPush(event, browserInfo);
        
        // Call original handler if it exists
        if (originalPushHandler) {
          originalPushHandler.call(self, event);
        }
      } catch (error) {
        console.error('Enhanced push event handler failed:', error);
        
        // Fallback to basic notification
        event.waitUntil(
          self.registration.showNotification('New Notification', {
            body: 'You have received a new notification',
            icon: '/icons/notification-icon-192.png'
          })
        );
      }
    });

    this.isActive = true;
  }

  private async handleBrowserSpecificPush(event: PushEvent, browserInfo: any): Promise<void> {
    let data: any = {};
    
    // Extract data based on browser capabilities
    if (event.data) {
      try {
        data = event.data.json();
      } catch (error) {
        // Some browsers might send data differently
        try {
          data = { body: event.data.text() };
        } catch (textError) {
          data = { body: 'New notification' };
        }
      }
    }

    // Browser-specific handling
    switch (browserInfo.name) {
      case 'Safari':
        await this.handleSafariPush(event, data);
        break;
      case 'Firefox':
        await this.handleFirefoxPush(event, data);
        break;
      case 'Chrome':
      case 'Edge':
        await this.handleChromiumPush(event, data);
        break;
      default:
        await this.handleGenericPush(event, data);
    }
  }

  private async handleSafariPush(event: PushEvent, data: any): Promise<void> {
    // Safari has limited push notification support
    const options: NotificationOptions = {
      body: data.body || 'New notification',
      icon: data.icon || '/icons/notification-icon-192.png',
      data: data.data || { url: '/' },
      tag: data.tag || 'safari-notification',
      // Safari doesn't support many advanced features
      requireInteraction: false,
      silent: false
    };

    // Don't use action buttons in Safari
    if (data.actions) {
      console.warn('Action buttons not supported in Safari push notifications');
    }

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'Internship Management',
        options
      )
    );
  }

  private async handleFirefoxPush(event: PushEvent, data: any): Promise<void> {
    // Firefox supports most features but with some limitations
    const options: NotificationOptions = {
      body: data.body || 'New notification',
      icon: data.icon || '/icons/notification-icon-192.png',
      data: data.data || { url: '/' },
      tag: data.tag || 'firefox-notification',
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false,
      timestamp: data.timestamp || Date.now()
    };

    // Firefox supports limited action buttons
    if (data.actions && Array.isArray(data.actions)) {
      options.actions = data.actions.slice(0, 2); // Max 2 actions in Firefox
    }

    // Firefox doesn't support badges
    if (data.badge) {
      console.warn('Badges not supported in Firefox');
    }

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'Internship Management',
        options
      )
    );
  }

  private async handleChromiumPush(event: PushEvent, data: any): Promise<void> {
    // Chrome/Edge support all features
    const options: NotificationOptions = {
      body: data.body || 'New notification',
      icon: data.icon || '/icons/notification-icon-192.png',
      badge: data.badge || '/icons/notification-badge-72.png',
      image: data.image,
      data: data.data || { url: '/' },
      tag: data.tag || 'chromium-notification',
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false,
      timestamp: data.timestamp || Date.now(),
      actions: data.actions || [],
      vibrate: data.vibrate || [200, 100, 200]
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'Internship Management',
        options
      )
    );
  }

  private async handleGenericPush(event: PushEvent, data: any): Promise<void> {
    // Generic handling for unknown browsers
    const options: NotificationOptions = {
      body: data.body || 'New notification',
      icon: data.icon || '/icons/notification-icon-192.png',
      data: data.data || { url: '/' },
      tag: data.tag || 'generic-notification'
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'Internship Management',
        options
      )
    );
  }

  cleanup(): void {
    this.isActive = false;
  }
}

export class NotificationClickEnhancement implements ServiceWorkerEnhancement {
  name = 'NotificationClickEnhancement';
  isActive = false;

  enhance(): void {
    if (typeof self === 'undefined' || !('addEventListener' in self)) {
      return;
    }

    // Enhance notification click handling
    self.addEventListener('notificationclick', async (event: NotificationEvent) => {
      try {
        const browserInfo = browserCompatibility.getBrowserInfo();
        
        // Use browser-specific notification manager
        browserNotificationManager.initialize();
        await browserNotificationManager.handleNotificationClick(event);
        
        // Browser-specific click handling
        await this.handleBrowserSpecificClick(event, browserInfo);
      } catch (error) {
        console.error('Enhanced notification click handler failed:', error);
        
        // Fallback click handling
        event.notification.close();
        if (event.notification.data?.url) {
          self.clients.openWindow(event.notification.data.url);
        }
      }
    });

    this.isActive = true;
  }

  private async handleBrowserSpecificClick(event: NotificationEvent, browserInfo: any): Promise<void> {
    switch (browserInfo.name) {
      case 'Safari':
        await this.handleSafariClick(event);
        break;
      case 'Firefox':
        await this.handleFirefoxClick(event);
        break;
      case 'Chrome':
      case 'Edge':
        await this.handleChromiumClick(event);
        break;
      default:
        await this.handleGenericClick(event);
    }
  }

  private async handleSafariClick(event: NotificationEvent): Promise<void> {
    event.notification.close();
    
    // Safari has limited client management
    const url = event.notification.data?.url || '/';
    await self.clients.openWindow(url);
  }

  private async handleFirefoxClick(event: NotificationEvent): Promise<void> {
    event.notification.close();
    
    // Firefox has good client management
    const url = event.notification.data?.url || '/';
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    
    // Try to focus existing window
    const existingClient = clients.find(client => client.url.includes(url));
    if (existingClient) {
      await existingClient.focus();
    } else {
      await self.clients.openWindow(url);
    }
  }

  private async handleChromiumClick(event: NotificationEvent): Promise<void> {
    event.notification.close();
    
    // Chrome/Edge have full client management support
    const url = event.notification.data?.url || '/';
    const clients = await self.clients.matchAll({ type: 'window' });
    
    // Smart client focusing
    const existingClient = clients.find(client => client.url === url);
    if (existingClient) {
      await existingClient.focus();
    } else {
      const newClient = await self.clients.openWindow(url);
      if (newClient) {
        await newClient.focus();
      }
    }
  }

  private async handleGenericClick(event: NotificationEvent): Promise<void> {
    event.notification.close();
    
    const url = event.notification.data?.url || '/';
    await self.clients.openWindow(url);
  }

  cleanup(): void {
    this.isActive = false;
  }
}

export class NotificationCloseEnhancement implements ServiceWorkerEnhancement {
  name = 'NotificationCloseEnhancement';
  isActive = false;

  enhance(): void {
    if (typeof self === 'undefined' || !('addEventListener' in self)) {
      return;
    }

    self.addEventListener('notificationclose', async (event: NotificationEvent) => {
      try {
        // Use browser-specific notification manager
        await browserNotificationManager.handleNotificationClose(event);
        
        // Track notification dismissal
        await this.trackNotificationClose(event);
      } catch (error) {
        console.error('Enhanced notification close handler failed:', error);
      }
    });

    this.isActive = true;
  }

  private async trackNotificationClose(event: NotificationEvent): Promise<void> {
    // Track notification close for analytics
    const data = {
      notificationId: event.notification.data?.notificationId,
      tag: event.notification.tag,
      timestamp: Date.now(),
      action: 'close'
    };

    // Store analytics data
    try {
      const cache = await caches.open('notifications-analytics');
      const response = new Response(JSON.stringify(data));
      await cache.put(`/analytics/notification-close/${Date.now()}`, response);
    } catch (error) {
      console.error('Failed to track notification close:', error);
    }
  }

  cleanup(): void {
    this.isActive = false;
  }
}

export class BackgroundSyncEnhancement implements ServiceWorkerEnhancement {
  name = 'BackgroundSyncEnhancement';
  isActive = false;

  enhance(): void {
    if (typeof self === 'undefined' || !('addEventListener' in self)) {
      return;
    }

    // Check if background sync is supported
    if (!('sync' in self.ServiceWorkerRegistration.prototype)) {
      console.warn('Background sync not supported');
      return;
    }

    self.addEventListener('sync', async (event: SyncEvent) => {
      try {
        const browserInfo = browserCompatibility.getBrowserInfo();
        
        // Browser-specific sync handling
        await this.handleBrowserSpecificSync(event, browserInfo);
      } catch (error) {
        console.error('Enhanced background sync handler failed:', error);
      }
    });

    this.isActive = true;
  }

  private async handleBrowserSpecificSync(event: SyncEvent, browserInfo: any): Promise<void> {
    switch (browserInfo.name) {
      case 'Chrome':
      case 'Edge':
        // Chrome/Edge have full background sync support
        await this.handleFullBackgroundSync(event);
        break;
      case 'Firefox':
        // Firefox doesn't support background sync
        console.warn('Background sync not supported in Firefox');
        break;
      case 'Safari':
        // Safari doesn't support background sync
        console.warn('Background sync not supported in Safari');
        break;
      default:
        // Try basic sync for unknown browsers
        await this.handleBasicSync(event);
    }
  }

  private async handleFullBackgroundSync(event: SyncEvent): Promise<void> {
    switch (event.tag) {
      case 'notification-sync':
        event.waitUntil(this.syncNotifications());
        break;
      case 'analytics-sync':
        event.waitUntil(this.syncAnalytics());
        break;
      default:
        console.log('Unknown sync tag:', event.tag);
    }
  }

  private async handleBasicSync(event: SyncEvent): Promise<void> {
    // Basic sync functionality
    event.waitUntil(this.syncNotifications());
  }

  private async syncNotifications(): Promise<void> {
    try {
      // Sync pending notification actions
      const cache = await caches.open('notifications-pending');
      const requests = await cache.keys();
      
      for (const request of requests) {
        try {
          const response = await cache.match(request);
          if (response) {
            const data = await response.json();
            
            // Send to server
            await fetch('/api/notifications/sync', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            
            // Remove from cache after successful sync
            await cache.delete(request);
          }
        } catch (error) {
          console.error('Failed to sync notification:', error);
        }
      }
    } catch (error) {
      console.error('Notification sync failed:', error);
    }
  }

  private async syncAnalytics(): Promise<void> {
    try {
      // Sync analytics data
      const cache = await caches.open('notifications-analytics');
      const requests = await cache.keys();
      
      const analyticsData = [];
      for (const request of requests) {
        try {
          const response = await cache.match(request);
          if (response) {
            const data = await response.json();
            analyticsData.push(data);
          }
        } catch (error) {
          console.error('Failed to read analytics data:', error);
        }
      }
      
      if (analyticsData.length > 0) {
        await fetch('/api/notifications/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events: analyticsData })
        });
        
        // Clear analytics cache after successful sync
        for (const request of requests) {
          await cache.delete(request);
        }
      }
    } catch (error) {
      console.error('Analytics sync failed:', error);
    }
  }

  cleanup(): void {
    this.isActive = false;
  }
}

export class ServiceWorkerCompatibilityManager {
  private static instance: ServiceWorkerCompatibilityManager;
  private enhancements: ServiceWorkerEnhancement[] = [];
  private isInitialized = false;

  private constructor() {
    this.enhancements = [
      new PushEventEnhancement(),
      new NotificationClickEnhancement(),
      new NotificationCloseEnhancement(),
      new BackgroundSyncEnhancement()
    ];
  }

  static getInstance(): ServiceWorkerCompatibilityManager {
    if (!ServiceWorkerCompatibilityManager.instance) {
      ServiceWorkerCompatibilityManager.instance = new ServiceWorkerCompatibilityManager();
    }
    return ServiceWorkerCompatibilityManager.instance;
  }

  initialize(): void {
    if (this.isInitialized || typeof self === 'undefined') {
      return;
    }

    const browserInfo = browserCompatibility.getBrowserInfo();
    console.log(`Initializing service worker enhancements for ${browserInfo.name}`);

    // Apply all enhancements
    for (const enhancement of this.enhancements) {
      try {
        enhancement.enhance();
        console.log(`Applied enhancement: ${enhancement.name}`);
      } catch (error) {
        console.error(`Failed to apply enhancement ${enhancement.name}:`, error);
      }
    }

    this.isInitialized = true;
  }

  cleanup(): void {
    for (const enhancement of this.enhancements) {
      try {
        enhancement.cleanup();
      } catch (error) {
        console.error(`Failed to cleanup enhancement ${enhancement.name}:`, error);
      }
    }
    this.isInitialized = false;
  }

  getEnhancementStatus(): { name: string; isActive: boolean }[] {
    return this.enhancements.map(enhancement => ({
      name: enhancement.name,
      isActive: enhancement.isActive
    }));
  }
}

// Auto-initialize if running in service worker context
if (typeof self !== 'undefined' && 'ServiceWorkerGlobalScope' in self) {
  const swCompatibility = ServiceWorkerCompatibilityManager.getInstance();
  swCompatibility.initialize();
}

export const serviceWorkerCompatibility = ServiceWorkerCompatibilityManager.getInstance();