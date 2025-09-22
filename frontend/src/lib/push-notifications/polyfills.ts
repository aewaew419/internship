'use client';

/**
 * Polyfills and compatibility layers for push notifications
 * Provides consistent behavior across different browsers
 */

// Global type augmentations for polyfills
declare global {
  interface Window {
    webkitNotifications?: any;
    mozNotification?: any;
    msNotification?: any;
  }

  interface Navigator {
    mozVibrate?: (pattern: number | number[]) => boolean;
    webkitVibrate?: (pattern: number | number[]) => boolean;
    msVibrate?: (pattern: number | number[]) => boolean;
    
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
    msConnection?: NetworkInformation;
  }

  interface Document {
    webkitVisibilityState?: VisibilityState;
    mozVisibilityState?: VisibilityState;
    msVisibilityState?: VisibilityState;
    
    webkitHidden?: boolean;
    mozHidden?: boolean;
    msHidden?: boolean;
  }
}

export interface PolyfillConfig {
  enableNotificationPolyfill: boolean;
  enableVibrationPolyfill: boolean;
  enableVisibilityPolyfill: boolean;
  enableConnectionPolyfill: boolean;
  enablePromisePolyfill: boolean;
  enableFetchPolyfill: boolean;
}

export class PolyfillManager {
  private static instance: PolyfillManager;
  private isInitialized: boolean = false;
  private config: PolyfillConfig;

  private constructor() {
    this.config = {
      enableNotificationPolyfill: true,
      enableVibrationPolyfill: true,
      enableVisibilityPolyfill: true,
      enableConnectionPolyfill: true,
      enablePromisePolyfill: true,
      enableFetchPolyfill: true
    };
  }

  static getInstance(): PolyfillManager {
    if (!PolyfillManager.instance) {
      PolyfillManager.instance = new PolyfillManager();
    }
    return PolyfillManager.instance;
  }

  /**
   * Initialize all polyfills
   */
  initialize(config?: Partial<PolyfillConfig>): void {
    if (this.isInitialized) {
      return;
    }

    if (config) {
      this.config = { ...this.config, ...config };
    }

    if (typeof window === 'undefined') {
      return; // Skip polyfills on server side
    }

    this.initializePromisePolyfill();
    this.initializeFetchPolyfill();
    this.initializeNotificationPolyfill();
    this.initializeVibrationPolyfill();
    this.initializeVisibilityPolyfill();
    this.initializeConnectionPolyfill();

    this.isInitialized = true;
    console.log('Push notification polyfills initialized');
  }

  /**
   * Promise polyfill for older browsers
   */
  private initializePromisePolyfill(): void {
    if (!this.config.enablePromisePolyfill || typeof Promise !== 'undefined') {
      return;
    }

    // Simple Promise polyfill
    (window as any).Promise = class SimplePromise {
      private state: 'pending' | 'fulfilled' | 'rejected' = 'pending';
      private value: any;
      private handlers: Array<{
        onFulfilled?: (value: any) => any;
        onRejected?: (reason: any) => any;
        resolve: (value: any) => void;
        reject: (reason: any) => void;
      }> = [];

      constructor(executor: (resolve: (value: any) => void, reject: (reason: any) => void) => void) {
        try {
          executor(this.resolve.bind(this), this.reject.bind(this));
        } catch (error) {
          this.reject(error);
        }
      }

      private resolve(value: any): void {
        if (this.state === 'pending') {
          this.state = 'fulfilled';
          this.value = value;
          this.handlers.forEach(handler => this.handle(handler));
          this.handlers = [];
        }
      }

      private reject(reason: any): void {
        if (this.state === 'pending') {
          this.state = 'rejected';
          this.value = reason;
          this.handlers.forEach(handler => this.handle(handler));
          this.handlers = [];
        }
      }

      private handle(handler: any): void {
        if (this.state === 'pending') {
          this.handlers.push(handler);
        } else {
          if (this.state === 'fulfilled' && handler.onFulfilled) {
            handler.onFulfilled(this.value);
          }
          if (this.state === 'rejected' && handler.onRejected) {
            handler.onRejected(this.value);
          }
        }
      }

      then(onFulfilled?: (value: any) => any, onRejected?: (reason: any) => any): SimplePromise {
        return new SimplePromise((resolve, reject) => {
          this.handle({
            onFulfilled: onFulfilled ? (value: any) => {
              try {
                resolve(onFulfilled(value));
              } catch (error) {
                reject(error);
              }
            } : resolve,
            onRejected: onRejected ? (reason: any) => {
              try {
                resolve(onRejected(reason));
              } catch (error) {
                reject(error);
              }
            } : reject,
            resolve,
            reject
          });
        });
      }

      catch(onRejected: (reason: any) => any): SimplePromise {
        return this.then(undefined, onRejected);
      }

      static resolve(value: any): SimplePromise {
        return new SimplePromise(resolve => resolve(value));
      }

      static reject(reason: any): SimplePromise {
        return new SimplePromise((_, reject) => reject(reason));
      }
    };
  }

  /**
   * Fetch polyfill for older browsers
   */
  private initializeFetchPolyfill(): void {
    if (!this.config.enableFetchPolyfill || typeof fetch !== 'undefined') {
      return;
    }

    // Simple fetch polyfill using XMLHttpRequest
    (window as any).fetch = function(url: string, options: RequestInit = {}): Promise<Response> {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const method = options.method || 'GET';
        
        xhr.open(method, url);

        // Set headers
        if (options.headers) {
          const headers = options.headers as Record<string, string>;
          Object.keys(headers).forEach(key => {
            xhr.setRequestHeader(key, headers[key]);
          });
        }

        xhr.onload = () => {
          const response = {
            ok: xhr.status >= 200 && xhr.status < 300,
            status: xhr.status,
            statusText: xhr.statusText,
            json: () => Promise.resolve(JSON.parse(xhr.responseText)),
            text: () => Promise.resolve(xhr.responseText),
            blob: () => Promise.resolve(new Blob([xhr.response])),
            headers: new Map()
          };
          resolve(response as Response);
        };

        xhr.onerror = () => reject(new Error('Network error'));
        xhr.ontimeout = () => reject(new Error('Request timeout'));

        if (options.body) {
          xhr.send(options.body as string);
        } else {
          xhr.send();
        }
      });
    };
  }

  /**
   * Notification API polyfill
   */
  private initializeNotificationPolyfill(): void {
    if (!this.config.enableNotificationPolyfill) {
      return;
    }

    // Check if native Notification API exists
    if ('Notification' in window) {
      return;
    }

    // Polyfill for browsers with webkit/moz prefixed notifications
    let NotificationConstructor: any = null;

    if (window.webkitNotifications) {
      NotificationConstructor = window.webkitNotifications;
    } else if (window.mozNotification) {
      NotificationConstructor = window.mozNotification;
    } else if (window.msNotification) {
      NotificationConstructor = window.msNotification;
    }

    if (NotificationConstructor) {
      (window as any).Notification = class NotificationPolyfill {
        static permission: NotificationPermission = 'default';
        
        static requestPermission(): Promise<NotificationPermission> {
          return new Promise((resolve) => {
            if (NotificationConstructor.requestPermission) {
              NotificationConstructor.requestPermission((permission: NotificationPermission) => {
                NotificationPolyfill.permission = permission;
                resolve(permission);
              });
            } else {
              resolve('denied');
            }
          });
        }

        constructor(title: string, options: NotificationOptions = {}) {
          if (NotificationConstructor.createNotification) {
            const notification = NotificationConstructor.createNotification(
              options.icon || '',
              title,
              options.body || ''
            );
            
            if (options.onclick) {
              notification.onclick = options.onclick;
            }
            
            notification.show();
            
            // Auto-close after timeout
            if (options.tag !== 'persistent') {
              setTimeout(() => {
                if (notification.cancel) {
                  notification.cancel();
                }
              }, 5000);
            }
            
            return notification;
          }
          
          // Fallback: show alert
          alert(`${title}: ${options.body || ''}`);
        }
      };
    } else {
      // Ultimate fallback: console notifications
      (window as any).Notification = class NotificationFallback {
        static permission: NotificationPermission = 'granted';
        
        static requestPermission(): Promise<NotificationPermission> {
          return Promise.resolve('granted');
        }

        constructor(title: string, options: NotificationOptions = {}) {
          console.log(`📢 Notification: ${title}`, options.body || '');
          
          // Show in-page notification if possible
          this.showInPageNotification(title, options);
        }

        private showInPageNotification(title: string, options: NotificationOptions): void {
          const notification = document.createElement('div');
          notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 15px;
            border-radius: 5px;
            max-width: 300px;
            z-index: 10000;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          `;
          
          notification.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">${title}</div>
            <div style="font-size: 14px;">${options.body || ''}</div>
          `;
          
          document.body.appendChild(notification);
          
          // Auto-remove after 5 seconds
          setTimeout(() => {
            if (notification.parentNode) {
              notification.parentNode.removeChild(notification);
            }
          }, 5000);
          
          // Click to dismiss
          notification.addEventListener('click', () => {
            if (notification.parentNode) {
              notification.parentNode.removeChild(notification);
            }
            if (options.onclick) {
              options.onclick(new Event('click'));
            }
          });
        }
      };
    }
  }

  /**
   * Vibration API polyfill
   */
  private initializeVibrationPolyfill(): void {
    if (!this.config.enableVibrationPolyfill) {
      return;
    }

    if ('vibrate' in navigator) {
      return;
    }

    // Check for vendor-prefixed versions
    const vibrate = navigator.mozVibrate || 
                   navigator.webkitVibrate || 
                   navigator.msVibrate;

    if (vibrate) {
      (navigator as any).vibrate = vibrate.bind(navigator);
    } else {
      // Fallback: no-op function
      (navigator as any).vibrate = () => false;
    }
  }

  /**
   * Page Visibility API polyfill
   */
  private initializeVisibilityPolyfill(): void {
    if (!this.config.enableVisibilityPolyfill) {
      return;
    }

    if ('visibilityState' in document) {
      return;
    }

    // Check for vendor-prefixed versions
    let hidden: string;
    let visibilityChange: string;

    if (typeof document.webkitHidden !== 'undefined') {
      hidden = 'webkitHidden';
      visibilityChange = 'webkitvisibilitychange';
      Object.defineProperty(document, 'visibilityState', {
        get: () => document.webkitVisibilityState || (document.webkitHidden ? 'hidden' : 'visible')
      });
    } else if (typeof document.mozHidden !== 'undefined') {
      hidden = 'mozHidden';
      visibilityChange = 'mozvisibilitychange';
      Object.defineProperty(document, 'visibilityState', {
        get: () => document.mozVisibilityState || (document.mozHidden ? 'hidden' : 'visible')
      });
    } else if (typeof document.msHidden !== 'undefined') {
      hidden = 'msHidden';
      visibilityChange = 'msvisibilitychange';
      Object.defineProperty(document, 'visibilityState', {
        get: () => document.msHidden ? 'hidden' : 'visible'
      });
    } else {
      // Fallback using focus/blur events
      let isHidden = false;
      
      Object.defineProperty(document, 'hidden', {
        get: () => isHidden
      });
      
      Object.defineProperty(document, 'visibilityState', {
        get: () => isHidden ? 'hidden' : 'visible'
      });

      window.addEventListener('focus', () => {
        isHidden = false;
        document.dispatchEvent(new Event('visibilitychange'));
      });

      window.addEventListener('blur', () => {
        isHidden = true;
        document.dispatchEvent(new Event('visibilitychange'));
      });
    }
  }

  /**
   * Network Information API polyfill
   */
  private initializeConnectionPolyfill(): void {
    if (!this.config.enableConnectionPolyfill) {
      return;
    }

    if ('connection' in navigator) {
      return;
    }

    // Check for vendor-prefixed versions
    const connection = navigator.mozConnection || 
                      navigator.webkitConnection || 
                      navigator.msConnection;

    if (connection) {
      Object.defineProperty(navigator, 'connection', {
        value: connection,
        writable: false
      });
    } else {
      // Fallback: basic connection info
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '4g',
          downlink: 10,
          rtt: 100,
          saveData: false,
          addEventListener: () => {},
          removeEventListener: () => {}
        },
        writable: false
      });
    }
  }

  /**
   * Check if polyfills are needed
   */
  checkPolyfillNeeds(): {
    needed: string[];
    available: string[];
    unavailable: string[];
  } {
    const needed: string[] = [];
    const available: string[] = [];
    const unavailable: string[] = [];

    // Check Promise support
    if (typeof Promise === 'undefined') {
      needed.push('Promise');
      available.push('Promise');
    }

    // Check fetch support
    if (typeof fetch === 'undefined') {
      needed.push('fetch');
      available.push('fetch');
    }

    // Check Notification API
    if (!('Notification' in window)) {
      needed.push('Notification');
      if (window.webkitNotifications || window.mozNotification) {
        available.push('Notification (prefixed)');
      } else {
        unavailable.push('Notification (fallback only)');
      }
    }

    // Check Vibration API
    if (!('vibrate' in navigator)) {
      needed.push('vibrate');
      if (navigator.mozVibrate || navigator.webkitVibrate) {
        available.push('vibrate (prefixed)');
      } else {
        unavailable.push('vibrate');
      }
    }

    // Check Visibility API
    if (!('visibilityState' in document)) {
      needed.push('visibilityState');
      if (document.webkitVisibilityState !== undefined || 
          document.mozVisibilityState !== undefined) {
        available.push('visibilityState (prefixed)');
      } else {
        available.push('visibilityState (focus/blur fallback)');
      }
    }

    // Check Connection API
    if (!('connection' in navigator)) {
      needed.push('connection');
      if (navigator.mozConnection || navigator.webkitConnection) {
        available.push('connection (prefixed)');
      } else {
        available.push('connection (mock)');
      }
    }

    return { needed, available, unavailable };
  }

  /**
   * Get polyfill status
   */
  getPolyfillStatus(): {
    isInitialized: boolean;
    config: PolyfillConfig;
    needs: ReturnType<typeof this.checkPolyfillNeeds>;
  } {
    return {
      isInitialized: this.isInitialized,
      config: this.config,
      needs: this.checkPolyfillNeeds()
    };
  }

  /**
   * Update polyfill configuration
   */
  updateConfig(config: Partial<PolyfillConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (this.isInitialized) {
      console.warn('Polyfills already initialized. Configuration changes will take effect on next initialization.');
    }
  }
}

// Export singleton instance
export const polyfillManager = PolyfillManager.getInstance();

// Auto-initialize polyfills
if (typeof window !== 'undefined') {
  polyfillManager.initialize();
}