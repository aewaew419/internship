'use client';

// Push notification configuration and environment setup

export interface PushConfig {
  vapidPublicKey: string | null;
  isEnabled: boolean;
  isDevelopment: boolean;
}

export class PushNotificationConfig {
  private static instance: PushNotificationConfig;
  private config: PushConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): PushNotificationConfig {
    if (!PushNotificationConfig.instance) {
      PushNotificationConfig.instance = new PushNotificationConfig();
    }
    return PushNotificationConfig.instance;
  }

  private loadConfig(): PushConfig {
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
    const isEnabled = process.env.NEXT_PUBLIC_ENABLE_PWA === 'true' && !!vapidPublicKey;
    const isDevelopment = process.env.NODE_ENV === 'development';

    return {
      vapidPublicKey,
      isEnabled,
      isDevelopment
    };
  }

  getConfig(): PushConfig {
    return this.config;
  }

  getVapidPublicKey(): string | null {
    return this.config.vapidPublicKey;
  }

  isEnabled(): boolean {
    return this.config.isEnabled;
  }

  isDevelopment(): boolean {
    return this.config.isDevelopment;
  }

  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.vapidPublicKey) {
      errors.push('VAPID public key is not configured');
    }

    if (this.config.vapidPublicKey && this.config.vapidPublicKey.length < 80) {
      errors.push('VAPID public key appears to be invalid (too short)');
    }

    if (typeof window !== 'undefined') {
      if (!('serviceWorker' in navigator)) {
        errors.push('Service Worker not supported in this browser');
      }

      if (!('PushManager' in window)) {
        errors.push('Push Manager not supported in this browser');
      }

      if (!('Notification' in window)) {
        errors.push('Notifications not supported in this browser');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get push notification configuration for debugging
   */
  getDebugInfo(): Record<string, any> {
    const validation = this.validateConfig();
    
    return {
      config: this.config,
      validation,
      browserSupport: typeof window !== 'undefined' ? {
        serviceWorker: 'serviceWorker' in navigator,
        pushManager: 'PushManager' in window,
        notifications: 'Notification' in window,
        userAgent: navigator.userAgent,
        platform: navigator.platform
      } : null,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        pwaEnabled: process.env.NEXT_PUBLIC_ENABLE_PWA,
        hasVapidKey: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      }
    };
  }
}

// Utility functions for push notification configuration
export function getPushConfig(): PushConfig {
  return PushNotificationConfig.getInstance().getConfig();
}

export function validatePushConfig(): { isValid: boolean; errors: string[] } {
  return PushNotificationConfig.getInstance().validateConfig();
}

export function isPushNotificationEnabled(): boolean {
  return PushNotificationConfig.getInstance().isEnabled();
}

export function getVapidPublicKey(): string | null {
  return PushNotificationConfig.getInstance().getVapidPublicKey();
}

// Hook for using push configuration in React components
export function usePushConfig() {
  const configManager = PushNotificationConfig.getInstance();

  return {
    config: configManager.getConfig(),
    isEnabled: configManager.isEnabled(),
    isDevelopment: configManager.isDevelopment(),
    getVapidPublicKey: () => configManager.getVapidPublicKey(),
    validateConfig: () => configManager.validateConfig(),
    getDebugInfo: () => configManager.getDebugInfo()
  };
}