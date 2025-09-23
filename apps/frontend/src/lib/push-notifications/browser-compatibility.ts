'use client';

/**
 * Browser-specific push notification compatibility layer
 * Handles differences between Chrome/Edge, Firefox, Safari, and other browsers
 */

export interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  isSupported: boolean;
  features: BrowserFeatures;
}

export interface BrowserFeatures {
  pushNotifications: boolean;
  serviceWorker: boolean;
  notificationAPI: boolean;
  vapidSupport: boolean;
  actionButtons: boolean;
  customIcons: boolean;
  badgeSupport: boolean;
  silentNotifications: boolean;
  persistentNotifications: boolean;
  backgroundSync: boolean;
  payloadEncryption: boolean;
  maxPayloadSize: number;
  maxActionButtons: number;
}

export interface BrowserSpecificConfig {
  vapidKeyFormat: 'base64' | 'uint8array';
  requiresUserGesture: boolean;
  supportsCustomActions: boolean;
  maxNotificationTitle: number;
  maxNotificationBody: number;
  defaultIcon: string;
  defaultBadge: string;
  notificationTimeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export class BrowserCompatibilityManager {
  private static instance: BrowserCompatibilityManager;
  private browserInfo: BrowserInfo;
  private config: BrowserSpecificConfig;

  private constructor() {
    this.browserInfo = this.detectBrowser();
    this.config = this.getBrowserSpecificConfig();
  }

  static getInstance(): BrowserCompatibilityManager {
    if (!BrowserCompatibilityManager.instance) {
      BrowserCompatibilityManager.instance = new BrowserCompatibilityManager();
    }
    return BrowserCompatibilityManager.instance;
  }

  /**
   * Detect browser and its capabilities
   */
  private detectBrowser(): BrowserInfo {
    const userAgent = navigator.userAgent;
    const vendor = navigator.vendor || '';

    // Chrome/Chromium-based browsers (including Edge)
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
      const version = this.extractVersion(userAgent, /Chrome\/(\d+)/);
      return {
        name: 'Chrome',
        version,
        engine: 'Blink',
        isSupported: parseInt(version) >= 50,
        features: this.getChromeFeatures(parseInt(version))
      };
    }

    // Microsoft Edge (Chromium-based)
    if (userAgent.includes('Edg')) {
      const version = this.extractVersion(userAgent, /Edg\/(\d+)/);
      return {
        name: 'Edge',
        version,
        engine: 'Blink',
        isSupported: parseInt(version) >= 79,
        features: this.getEdgeFeatures(parseInt(version))
      };
    }

    // Firefox
    if (userAgent.includes('Firefox')) {
      const version = this.extractVersion(userAgent, /Firefox\/(\d+)/);
      return {
        name: 'Firefox',
        version,
        engine: 'Gecko',
        isSupported: parseInt(version) >= 44,
        features: this.getFirefoxFeatures(parseInt(version))
      };
    }

    // Safari
    if (userAgent.includes('Safari') && vendor.includes('Apple')) {
      const version = this.extractVersion(userAgent, /Version\/(\d+)/);
      return {
        name: 'Safari',
        version,
        engine: 'WebKit',
        isSupported: parseInt(version) >= 16, // Safari 16+ has limited push support
        features: this.getSafariFeatures(parseInt(version))
      };
    }

    // Opera
    if (userAgent.includes('OPR') || userAgent.includes('Opera')) {
      const version = this.extractVersion(userAgent, /(?:OPR|Opera)\/(\d+)/);
      return {
        name: 'Opera',
        version,
        engine: 'Blink',
        isSupported: parseInt(version) >= 42,
        features: this.getOperaFeatures(parseInt(version))
      };
    }

    // Samsung Internet
    if (userAgent.includes('SamsungBrowser')) {
      const version = this.extractVersion(userAgent, /SamsungBrowser\/(\d+)/);
      return {
        name: 'Samsung Internet',
        version,
        engine: 'Blink',
        isSupported: parseInt(version) >= 4,
        features: this.getSamsungFeatures(parseInt(version))
      };
    }

    // Default/Unknown browser
    return {
      name: 'Unknown',
      version: '0',
      engine: 'Unknown',
      isSupported: false,
      features: this.getDefaultFeatures()
    };
  }

  /**
   * Extract version number from user agent string
   */
  private extractVersion(userAgent: string, regex: RegExp): string {
    const match = userAgent.match(regex);
    return match ? match[1] : '0';
  }

  /**
   * Get Chrome-specific features
   */
  private getChromeFeatures(version: number): BrowserFeatures {
    return {
      pushNotifications: version >= 50,
      serviceWorker: version >= 40,
      notificationAPI: version >= 22,
      vapidSupport: version >= 52,
      actionButtons: version >= 48,
      customIcons: version >= 22,
      badgeSupport: version >= 53,
      silentNotifications: version >= 50,
      persistentNotifications: version >= 42,
      backgroundSync: version >= 49,
      payloadEncryption: version >= 50,
      maxPayloadSize: 4096,
      maxActionButtons: 2
    };
  }

  /**
   * Get Edge-specific features
   */
  private getEdgeFeatures(version: number): BrowserFeatures {
    return {
      pushNotifications: version >= 79,
      serviceWorker: version >= 79,
      notificationAPI: version >= 79,
      vapidSupport: version >= 79,
      actionButtons: version >= 79,
      customIcons: version >= 79,
      badgeSupport: version >= 79,
      silentNotifications: version >= 79,
      persistentNotifications: version >= 79,
      backgroundSync: version >= 79,
      payloadEncryption: version >= 79,
      maxPayloadSize: 4096,
      maxActionButtons: 2
    };
  }

  /**
   * Get Firefox-specific features
   */
  private getFirefoxFeatures(version: number): BrowserFeatures {
    return {
      pushNotifications: version >= 44,
      serviceWorker: version >= 44,
      notificationAPI: version >= 22,
      vapidSupport: version >= 46,
      actionButtons: version >= 53,
      customIcons: version >= 22,
      badgeSupport: false, // Firefox doesn't support badges
      silentNotifications: version >= 44,
      persistentNotifications: version >= 44,
      backgroundSync: false, // Firefox doesn't support background sync
      payloadEncryption: version >= 44,
      maxPayloadSize: 4096,
      maxActionButtons: 2
    };
  }

  /**
   * Get Safari-specific features
   */
  private getSafariFeatures(version: number): BrowserFeatures {
    return {
      pushNotifications: version >= 16, // Safari 16+ has limited support
      serviceWorker: version >= 11.1,
      notificationAPI: version >= 6,
      vapidSupport: version >= 16,
      actionButtons: false, // Safari doesn't support action buttons in web push
      customIcons: version >= 6,
      badgeSupport: false, // Safari doesn't support badges
      silentNotifications: false, // Safari requires user interaction
      persistentNotifications: version >= 16,
      backgroundSync: false, // Safari doesn't support background sync
      payloadEncryption: version >= 16,
      maxPayloadSize: 2048, // Safari has smaller payload limit
      maxActionButtons: 0
    };
  }

  /**
   * Get Opera-specific features
   */
  private getOperaFeatures(version: number): BrowserFeatures {
    return {
      pushNotifications: version >= 42,
      serviceWorker: version >= 27,
      notificationAPI: version >= 25,
      vapidSupport: version >= 44,
      actionButtons: version >= 39,
      customIcons: version >= 25,
      badgeSupport: version >= 44,
      silentNotifications: version >= 42,
      persistentNotifications: version >= 42,
      backgroundSync: version >= 44,
      payloadEncryption: version >= 42,
      maxPayloadSize: 4096,
      maxActionButtons: 2
    };
  }

  /**
   * Get Samsung Internet-specific features
   */
  private getSamsungFeatures(version: number): BrowserFeatures {
    return {
      pushNotifications: version >= 4,
      serviceWorker: version >= 4,
      notificationAPI: version >= 4,
      vapidSupport: version >= 5,
      actionButtons: version >= 5,
      customIcons: version >= 4,
      badgeSupport: version >= 6,
      silentNotifications: version >= 4,
      persistentNotifications: version >= 4,
      backgroundSync: version >= 5,
      payloadEncryption: version >= 4,
      maxPayloadSize: 4096,
      maxActionButtons: 2
    };
  }

  /**
   * Get default features for unknown browsers
   */
  private getDefaultFeatures(): BrowserFeatures {
    return {
      pushNotifications: false,
      serviceWorker: false,
      notificationAPI: false,
      vapidSupport: false,
      actionButtons: false,
      customIcons: false,
      badgeSupport: false,
      silentNotifications: false,
      persistentNotifications: false,
      backgroundSync: false,
      payloadEncryption: false,
      maxPayloadSize: 0,
      maxActionButtons: 0
    };
  }

  /**
   * Get browser-specific configuration
   */
  private getBrowserSpecificConfig(): BrowserSpecificConfig {
    const browser = this.browserInfo;

    switch (browser.name) {
      case 'Chrome':
      case 'Edge':
        return {
          vapidKeyFormat: 'uint8array',
          requiresUserGesture: false,
          supportsCustomActions: true,
          maxNotificationTitle: 100,
          maxNotificationBody: 500,
          defaultIcon: '/icons/notification-icon-192.png',
          defaultBadge: '/icons/notification-badge-72.png',
          notificationTimeout: 20000,
          retryAttempts: 3,
          retryDelay: 1000
        };

      case 'Firefox':
        return {
          vapidKeyFormat: 'uint8array',
          requiresUserGesture: false,
          supportsCustomActions: browser.features.actionButtons,
          maxNotificationTitle: 100,
          maxNotificationBody: 500,
          defaultIcon: '/icons/notification-icon-192.png',
          defaultBadge: '/icons/notification-badge-72.png',
          notificationTimeout: 0, // Firefox doesn't auto-close notifications
          retryAttempts: 3,
          retryDelay: 1000
        };

      case 'Safari':
        return {
          vapidKeyFormat: 'uint8array',
          requiresUserGesture: true,
          supportsCustomActions: false,
          maxNotificationTitle: 80,
          maxNotificationBody: 300,
          defaultIcon: '/icons/notification-icon-192.png',
          defaultBadge: '/icons/notification-badge-72.png',
          notificationTimeout: 10000,
          retryAttempts: 2,
          retryDelay: 2000
        };

      case 'Opera':
      case 'Samsung Internet':
        return {
          vapidKeyFormat: 'uint8array',
          requiresUserGesture: false,
          supportsCustomActions: true,
          maxNotificationTitle: 100,
          maxNotificationBody: 500,
          defaultIcon: '/icons/notification-icon-192.png',
          defaultBadge: '/icons/notification-badge-72.png',
          notificationTimeout: 20000,
          retryAttempts: 3,
          retryDelay: 1000
        };

      default:
        return {
          vapidKeyFormat: 'uint8array',
          requiresUserGesture: true,
          supportsCustomActions: false,
          maxNotificationTitle: 80,
          maxNotificationBody: 300,
          defaultIcon: '/icons/notification-icon-192.png',
          defaultBadge: '/icons/notification-badge-72.png',
          notificationTimeout: 15000,
          retryAttempts: 2,
          retryDelay: 2000
        };
    }
  }

  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return (
      this.browserInfo.isSupported &&
      this.browserInfo.features.pushNotifications &&
      this.browserInfo.features.serviceWorker &&
      this.browserInfo.features.notificationAPI
    );
  }

  /**
   * Check if VAPID is supported
   */
  isVapidSupported(): boolean {
    return this.browserInfo.features.vapidSupport;
  }

  /**
   * Check if action buttons are supported
   */
  areActionButtonsSupported(): boolean {
    return this.browserInfo.features.actionButtons;
  }

  /**
   * Check if badges are supported
   */
  areBadgesSupported(): boolean {
    return this.browserInfo.features.badgeSupport;
  }

  /**
   * Check if background sync is supported
   */
  isBackgroundSyncSupported(): boolean {
    return this.browserInfo.features.backgroundSync;
  }

  /**
   * Get browser information
   */
  getBrowserInfo(): BrowserInfo {
    return this.browserInfo;
  }

  /**
   * Get browser-specific configuration
   */
  getConfig(): BrowserSpecificConfig {
    return this.config;
  }

  /**
   * Get maximum payload size for this browser
   */
  getMaxPayloadSize(): number {
    return this.browserInfo.features.maxPayloadSize;
  }

  /**
   * Get maximum number of action buttons
   */
  getMaxActionButtons(): number {
    return this.browserInfo.features.maxActionButtons;
  }

  /**
   * Validate notification payload for browser compatibility
   */
  validateNotificationPayload(payload: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = this.config;
    const features = this.browserInfo.features;

    // Check title length
    if (payload.title && payload.title.length > config.maxNotificationTitle) {
      errors.push(`Title too long (max ${config.maxNotificationTitle} characters)`);
    }

    // Check body length
    if (payload.body && payload.body.length > config.maxNotificationBody) {
      errors.push(`Body too long (max ${config.maxNotificationBody} characters)`);
    }

    // Check action buttons
    if (payload.actions && payload.actions.length > 0) {
      if (!features.actionButtons) {
        errors.push('Action buttons not supported in this browser');
      } else if (payload.actions.length > features.maxActionButtons) {
        errors.push(`Too many action buttons (max ${features.maxActionButtons})`);
      }
    }

    // Check badge support
    if (payload.badge && !features.badgeSupport) {
      errors.push('Badge not supported in this browser');
    }

    // Check silent notifications
    if (payload.silent && !features.silentNotifications) {
      errors.push('Silent notifications not supported in this browser');
    }

    // Check payload size
    const payloadSize = JSON.stringify(payload).length;
    if (payloadSize > features.maxPayloadSize) {
      errors.push(`Payload too large (max ${features.maxPayloadSize} bytes)`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Adapt notification payload for browser compatibility
   */
  adaptNotificationPayload(payload: any): any {
    const config = this.config;
    const features = this.browserInfo.features;
    const adapted = { ...payload };

    // Truncate title if too long
    if (adapted.title && adapted.title.length > config.maxNotificationTitle) {
      adapted.title = adapted.title.substring(0, config.maxNotificationTitle - 3) + '...';
    }

    // Truncate body if too long
    if (adapted.body && adapted.body.length > config.maxNotificationBody) {
      adapted.body = adapted.body.substring(0, config.maxNotificationBody - 3) + '...';
    }

    // Remove action buttons if not supported
    if (adapted.actions && !features.actionButtons) {
      delete adapted.actions;
    }

    // Limit action buttons to maximum supported
    if (adapted.actions && adapted.actions.length > features.maxActionButtons) {
      adapted.actions = adapted.actions.slice(0, features.maxActionButtons);
    }

    // Remove badge if not supported
    if (adapted.badge && !features.badgeSupport) {
      delete adapted.badge;
    }

    // Remove silent flag if not supported
    if (adapted.silent && !features.silentNotifications) {
      delete adapted.silent;
    }

    // Set default icon if not provided
    if (!adapted.icon) {
      adapted.icon = config.defaultIcon;
    }

    // Set default badge if supported and not provided
    if (!adapted.badge && features.badgeSupport) {
      adapted.badge = config.defaultBadge;
    }

    return adapted;
  }

  /**
   * Get browser-specific subscription options
   */
  getSubscriptionOptions(vapidKey: string): PushSubscriptionOptions {
    const config = this.config;
    
    const options: PushSubscriptionOptions = {
      userVisibleOnly: true
    };

    // Add VAPID key if supported
    if (this.isVapidSupported() && vapidKey) {
      if (config.vapidKeyFormat === 'uint8array') {
        options.applicationServerKey = this.urlBase64ToUint8Array(vapidKey);
      } else {
        options.applicationServerKey = vapidKey;
      }
    }

    return options;
  }

  /**
   * Convert base64 VAPID key to Uint8Array
   */
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

  /**
   * Get browser-specific error messages
   */
  getBrowserSpecificErrorMessage(error: string): string {
    const browser = this.browserInfo.name;

    switch (error) {
      case 'permission_denied':
        switch (browser) {
          case 'Chrome':
          case 'Edge':
            return 'Notifications blocked. Click the lock icon in the address bar to enable notifications.';
          case 'Firefox':
            return 'Notifications blocked. Click the shield icon in the address bar to enable notifications.';
          case 'Safari':
            return 'Notifications blocked. Go to Safari > Preferences > Websites > Notifications to enable.';
          default:
            return 'Notifications blocked. Please enable notifications in your browser settings.';
        }

      case 'not_supported':
        switch (browser) {
          case 'Safari':
            return 'Push notifications require Safari 16 or later. Please update your browser.';
          case 'Unknown':
            return 'Push notifications are not supported in this browser. Please use Chrome, Firefox, or Edge.';
          default:
            return 'Push notifications are not supported in this browser version. Please update your browser.';
        }

      case 'vapid_key_missing':
        return 'Push notification configuration is missing. Please contact support.';

      case 'service_worker_error':
        switch (browser) {
          case 'Safari':
            return 'Service worker error. Please refresh the page and try again.';
          default:
            return 'Service worker registration failed. Please refresh the page and try again.';
        }

      default:
        return 'An error occurred with push notifications. Please try again.';
    }
  }

  /**
   * Get browser-specific setup instructions
   */
  getSetupInstructions(): string[] {
    const browser = this.browserInfo.name;

    switch (browser) {
      case 'Chrome':
      case 'Edge':
        return [
          'Click "Allow" when prompted for notification permission',
          'If blocked, click the lock icon in the address bar',
          'Select "Allow" for notifications',
          'Refresh the page if needed'
        ];

      case 'Firefox':
        return [
          'Click "Allow" when prompted for notification permission',
          'If blocked, click the shield icon in the address bar',
          'Select "Allow" for notifications',
          'Refresh the page if needed'
        ];

      case 'Safari':
        return [
          'Click "Allow" when prompted for notification permission',
          'If blocked, go to Safari > Preferences > Websites > Notifications',
          'Find this website and select "Allow"',
          'Refresh the page'
        ];

      case 'Opera':
        return [
          'Click "Allow" when prompted for notification permission',
          'If blocked, click the lock icon in the address bar',
          'Select "Allow" for notifications',
          'Refresh the page if needed'
        ];

      default:
        return [
          'Click "Allow" when prompted for notification permission',
          'If blocked, check your browser settings for notifications',
          'Enable notifications for this website',
          'Refresh the page'
        ];
    }
  }
}

// Export singleton instance
export const browserCompatibility = BrowserCompatibilityManager.getInstance();