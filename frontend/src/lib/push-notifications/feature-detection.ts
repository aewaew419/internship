'use client';

/**
 * Comprehensive feature detection for push notifications
 * Provides progressive enhancement and fallback strategies
 */

export interface FeatureDetectionResult {
  isSupported: boolean;
  features: DetectedFeatures;
  limitations: string[];
  recommendations: string[];
  fallbackOptions: FallbackOption[];
}

export interface DetectedFeatures {
  // Core APIs
  serviceWorker: boolean;
  pushManager: boolean;
  notificationAPI: boolean;
  
  // Push notification features
  vapidSupport: boolean;
  payloadEncryption: boolean;
  actionButtons: boolean;
  customIcons: boolean;
  badgeSupport: boolean;
  imageSupport: boolean;
  
  // Advanced features
  silentNotifications: boolean;
  persistentNotifications: boolean;
  backgroundSync: boolean;
  periodicBackgroundSync: boolean;
  
  // Permission features
  permissionAPI: boolean;
  permissionQuery: boolean;
  
  // Device features
  vibrationAPI: boolean;
  visibilityAPI: boolean;
  
  // Storage features
  localStorage: boolean;
  indexedDB: boolean;
  
  // Network features
  onlineStatus: boolean;
  connectionAPI: boolean;
}

export interface FallbackOption {
  type: 'polling' | 'websocket' | 'sse' | 'local-storage' | 'manual-refresh';
  name: string;
  description: string;
  isAvailable: boolean;
  implementation: () => void;
}

export class FeatureDetectionManager {
  private static instance: FeatureDetectionManager;
  private detectionResult: FeatureDetectionResult | null = null;

  private constructor() {}

  static getInstance(): FeatureDetectionManager {
    if (!FeatureDetectionManager.instance) {
      FeatureDetectionManager.instance = new FeatureDetectionManager();
    }
    return FeatureDetectionManager.instance;
  }

  /**
   * Perform comprehensive feature detection
   */
  async detectFeatures(): Promise<FeatureDetectionResult> {
    if (this.detectionResult) {
      return this.detectionResult;
    }

    const features = await this.detectAllFeatures();
    const limitations = this.identifyLimitations(features);
    const recommendations = this.generateRecommendations(features, limitations);
    const fallbackOptions = this.identifyFallbackOptions(features);

    this.detectionResult = {
      isSupported: this.isPushNotificationSupported(features),
      features,
      limitations,
      recommendations,
      fallbackOptions
    };

    return this.detectionResult;
  }

  /**
   * Detect all available features
   */
  private async detectAllFeatures(): Promise<DetectedFeatures> {
    const features: DetectedFeatures = {
      // Core APIs
      serviceWorker: this.detectServiceWorker(),
      pushManager: this.detectPushManager(),
      notificationAPI: this.detectNotificationAPI(),
      
      // Push notification features
      vapidSupport: await this.detectVapidSupport(),
      payloadEncryption: this.detectPayloadEncryption(),
      actionButtons: this.detectActionButtons(),
      customIcons: this.detectCustomIcons(),
      badgeSupport: this.detectBadgeSupport(),
      imageSupport: this.detectImageSupport(),
      
      // Advanced features
      silentNotifications: this.detectSilentNotifications(),
      persistentNotifications: this.detectPersistentNotifications(),
      backgroundSync: this.detectBackgroundSync(),
      periodicBackgroundSync: this.detectPeriodicBackgroundSync(),
      
      // Permission features
      permissionAPI: this.detectPermissionAPI(),
      permissionQuery: await this.detectPermissionQuery(),
      
      // Device features
      vibrationAPI: this.detectVibrationAPI(),
      visibilityAPI: this.detectVisibilityAPI(),
      
      // Storage features
      localStorage: this.detectLocalStorage(),
      indexedDB: this.detectIndexedDB(),
      
      // Network features
      onlineStatus: this.detectOnlineStatus(),
      connectionAPI: this.detectConnectionAPI()
    };

    return features;
  }

  /**
   * Core API Detection
   */
  private detectServiceWorker(): boolean {
    return typeof window !== 'undefined' && 'serviceWorker' in navigator;
  }

  private detectPushManager(): boolean {
    return typeof window !== 'undefined' && 'PushManager' in window;
  }

  private detectNotificationAPI(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  /**
   * Push notification feature detection
   */
  private async detectVapidSupport(): Promise<boolean> {
    if (!this.detectServiceWorker() || !this.detectPushManager()) {
      return false;
    }

    try {
      // Try to register a service worker and check for VAPID support
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        return false;
      }

      // Check if pushManager supports applicationServerKey
      const pushManager = registration.pushManager;
      if (!pushManager || !pushManager.subscribe) {
        return false;
      }

      // VAPID is supported if we can pass applicationServerKey
      return 'applicationServerKey' in PushSubscriptionOptions.prototype ||
             'applicationServerKey' in Object.getPrototypeOf(pushManager.subscribe);
    } catch {
      return false;
    }
  }

  private detectPayloadEncryption(): boolean {
    // Check if the browser supports encrypted payloads
    return this.detectPushManager() && 
           typeof window !== 'undefined' && 
           'crypto' in window && 
           'subtle' in window.crypto;
  }

  private detectActionButtons(): boolean {
    if (!this.detectNotificationAPI()) {
      return false;
    }

    try {
      // Check if Notification constructor supports actions
      const notification = new Notification('Test', {
        actions: [{ action: 'test', title: 'Test' }],
        tag: 'feature-test'
      });
      notification.close();
      return true;
    } catch {
      return false;
    }
  }

  private detectCustomIcons(): boolean {
    if (!this.detectNotificationAPI()) {
      return false;
    }

    try {
      // Check if Notification constructor supports icon
      const notification = new Notification('Test', {
        icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        tag: 'feature-test'
      });
      notification.close();
      return true;
    } catch {
      return false;
    }
  }

  private detectBadgeSupport(): boolean {
    if (!this.detectNotificationAPI()) {
      return false;
    }

    try {
      // Check if Notification constructor supports badge
      const notification = new Notification('Test', {
        badge: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        tag: 'feature-test'
      });
      notification.close();
      return true;
    } catch {
      return false;
    }
  }

  private detectImageSupport(): boolean {
    if (!this.detectNotificationAPI()) {
      return false;
    }

    try {
      // Check if Notification constructor supports image
      const notification = new Notification('Test', {
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        tag: 'feature-test'
      });
      notification.close();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Advanced feature detection
   */
  private detectSilentNotifications(): boolean {
    if (!this.detectNotificationAPI()) {
      return false;
    }

    try {
      // Check if Notification constructor supports silent
      const notification = new Notification('Test', {
        silent: true,
        tag: 'feature-test'
      });
      notification.close();
      return true;
    } catch {
      return false;
    }
  }

  private detectPersistentNotifications(): boolean {
    return this.detectServiceWorker() && this.detectNotificationAPI();
  }

  private detectBackgroundSync(): boolean {
    return typeof window !== 'undefined' && 
           'serviceWorker' in navigator && 
           'sync' in window.ServiceWorkerRegistration.prototype;
  }

  private detectPeriodicBackgroundSync(): boolean {
    return typeof window !== 'undefined' && 
           'serviceWorker' in navigator && 
           'periodicSync' in window.ServiceWorkerRegistration.prototype;
  }

  /**
   * Permission feature detection
   */
  private detectPermissionAPI(): boolean {
    return typeof window !== 'undefined' && 'permissions' in navigator;
  }

  private async detectPermissionQuery(): Promise<boolean> {
    if (!this.detectPermissionAPI()) {
      return false;
    }

    try {
      await navigator.permissions.query({ name: 'notifications' as PermissionName });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Device feature detection
   */
  private detectVibrationAPI(): boolean {
    return typeof window !== 'undefined' && 
           ('vibrate' in navigator || 'mozVibrate' in navigator || 'webkitVibrate' in navigator);
  }

  private detectVisibilityAPI(): boolean {
    return typeof document !== 'undefined' && 
           ('visibilityState' in document || 'webkitVisibilityState' in document || 'mozVisibilityState' in document);
  }

  /**
   * Storage feature detection
   */
  private detectLocalStorage(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }
      
      const testKey = '__localStorage_test__';
      window.localStorage.setItem(testKey, 'test');
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  private detectIndexedDB(): boolean {
    return typeof window !== 'undefined' && 
           ('indexedDB' in window || 'mozIndexedDB' in window || 'webkitIndexedDB' in window);
  }

  /**
   * Network feature detection
   */
  private detectOnlineStatus(): boolean {
    return typeof navigator !== 'undefined' && 'onLine' in navigator;
  }

  private detectConnectionAPI(): boolean {
    return typeof navigator !== 'undefined' && 
           ('connection' in navigator || 'mozConnection' in navigator || 'webkitConnection' in navigator);
  }

  /**
   * Determine if push notifications are supported
   */
  private isPushNotificationSupported(features: DetectedFeatures): boolean {
    return features.serviceWorker && 
           features.pushManager && 
           features.notificationAPI;
  }

  /**
   * Identify limitations based on detected features
   */
  private identifyLimitations(features: DetectedFeatures): string[] {
    const limitations: string[] = [];

    if (!features.serviceWorker) {
      limitations.push('Service Worker not supported - push notifications unavailable');
    }

    if (!features.pushManager) {
      limitations.push('Push Manager API not supported');
    }

    if (!features.notificationAPI) {
      limitations.push('Notification API not supported');
    }

    if (!features.vapidSupport) {
      limitations.push('VAPID not supported - may have delivery issues');
    }

    if (!features.actionButtons) {
      limitations.push('Notification action buttons not supported');
    }

    if (!features.badgeSupport) {
      limitations.push('Notification badges not supported');
    }

    if (!features.backgroundSync) {
      limitations.push('Background sync not supported - offline actions may be lost');
    }

    if (!features.persistentNotifications) {
      limitations.push('Persistent notifications not supported');
    }

    if (!features.silentNotifications) {
      limitations.push('Silent notifications not supported');
    }

    if (!features.indexedDB) {
      limitations.push('IndexedDB not supported - limited offline storage');
    }

    return limitations;
  }

  /**
   * Generate recommendations based on features and limitations
   */
  private generateRecommendations(features: DetectedFeatures, limitations: string[]): string[] {
    const recommendations: string[] = [];

    if (!features.serviceWorker || !features.pushManager || !features.notificationAPI) {
      recommendations.push('Update to a modern browser (Chrome 50+, Firefox 44+, Edge 79+, Safari 16+)');
    }

    if (!features.vapidSupport) {
      recommendations.push('Update browser for better push notification reliability');
    }

    if (!features.actionButtons) {
      recommendations.push('Notification interactions will be limited to click-to-open');
    }

    if (!features.backgroundSync) {
      recommendations.push('Stay online for best notification experience');
    }

    if (!features.indexedDB && features.localStorage) {
      recommendations.push('Limited offline storage available - some features may be restricted');
    }

    if (!features.localStorage && !features.indexedDB) {
      recommendations.push('No offline storage available - notifications will not persist');
    }

    if (limitations.length === 0) {
      recommendations.push('Full push notification support available');
    }

    return recommendations;
  }

  /**
   * Identify available fallback options
   */
  private identifyFallbackOptions(features: DetectedFeatures): FallbackOption[] {
    const fallbacks: FallbackOption[] = [];

    // Server-Sent Events fallback
    if (typeof EventSource !== 'undefined') {
      fallbacks.push({
        type: 'sse',
        name: 'Server-Sent Events',
        description: 'Real-time updates using Server-Sent Events',
        isAvailable: true,
        implementation: () => {
          console.log('Implementing SSE fallback');
        }
      });
    }

    // WebSocket fallback
    if (typeof WebSocket !== 'undefined') {
      fallbacks.push({
        type: 'websocket',
        name: 'WebSocket',
        description: 'Real-time updates using WebSocket connection',
        isAvailable: true,
        implementation: () => {
          console.log('Implementing WebSocket fallback');
        }
      });
    }

    // Polling fallback
    fallbacks.push({
      type: 'polling',
      name: 'Polling',
      description: 'Periodic checks for new notifications',
      isAvailable: true,
      implementation: () => {
        console.log('Implementing polling fallback');
      }
    });

    // Local storage fallback
    if (features.localStorage) {
      fallbacks.push({
        type: 'local-storage',
        name: 'Local Storage',
        description: 'Store notifications locally for offline access',
        isAvailable: true,
        implementation: () => {
          console.log('Implementing local storage fallback');
        }
      });
    }

    // Manual refresh fallback
    fallbacks.push({
      type: 'manual-refresh',
      name: 'Manual Refresh',
      description: 'Manual page refresh to check for notifications',
      isAvailable: true,
      implementation: () => {
        console.log('Implementing manual refresh fallback');
      }
    });

    return fallbacks;
  }

  /**
   * Get feature detection result
   */
  getDetectionResult(): FeatureDetectionResult | null {
    return this.detectionResult;
  }

  /**
   * Check if a specific feature is supported
   */
  isFeatureSupported(feature: keyof DetectedFeatures): boolean {
    if (!this.detectionResult) {
      throw new Error('Feature detection not performed. Call detectFeatures() first.');
    }
    return this.detectionResult.features[feature];
  }

  /**
   * Get progressive enhancement strategy
   */
  getProgressiveEnhancementStrategy(): {
    baseline: string[];
    enhanced: string[];
    premium: string[];
  } {
    if (!this.detectionResult) {
      throw new Error('Feature detection not performed. Call detectFeatures() first.');
    }

    const features = this.detectionResult.features;

    return {
      baseline: [
        'Basic notification display',
        'Manual refresh for updates',
        'Local storage for preferences'
      ],
      enhanced: features.serviceWorker && features.notificationAPI ? [
        'Browser notifications',
        'Real-time updates via SSE/WebSocket',
        'Offline notification storage'
      ] : [],
      premium: features.serviceWorker && features.pushManager && features.vapidSupport ? [
        'Push notifications',
        'Background sync',
        'Action buttons',
        'Rich notification content'
      ] : []
    };
  }

  /**
   * Generate user-friendly capability report
   */
  generateCapabilityReport(): {
    summary: string;
    details: string[];
    actions: string[];
  } {
    if (!this.detectionResult) {
      throw new Error('Feature detection not performed. Call detectFeatures() first.');
    }

    const { isSupported, limitations, recommendations, fallbackOptions } = this.detectionResult;

    let summary: string;
    if (isSupported) {
      if (limitations.length === 0) {
        summary = 'Full push notification support available';
      } else {
        summary = `Push notifications supported with ${limitations.length} limitation(s)`;
      }
    } else {
      summary = 'Push notifications not supported - fallback methods available';
    }

    const details = [
      ...limitations,
      `${fallbackOptions.length} fallback option(s) available`
    ];

    const actions = recommendations;

    return {
      summary,
      details,
      actions
    };
  }
}

// Export singleton instance
export const featureDetection = FeatureDetectionManager.getInstance();