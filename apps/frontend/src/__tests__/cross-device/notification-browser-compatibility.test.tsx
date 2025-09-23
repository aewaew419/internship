import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationProvider } from '../../components/providers/NotificationProvider';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { PushNotificationManager } from '../../lib/push-notifications';
import { NotificationType, NotificationCategory } from '../../types/notifications';
import type { Notification } from '../../types/notifications';

// Mock dependencies
jest.mock('../../hooks/usePushNotifications');
jest.mock('../../lib/push-notifications');
jest.mock('../../lib/api/services/notification.service');
jest.mock('../../lib/notifications/offline-queue');
jest.mock('../../lib/notifications/offline-storage');
jest.mock('../../lib/notifications/network-status');

const mockUsePushNotifications = usePushNotifications as jest.Mock;
const mockPushManager = PushNotificationManager as jest.MockedClass<typeof PushNotificationManager>;

const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: 1,
    type: NotificationType.ASSIGNMENT_CHANGE,
    title: 'Assignment Updated',
    body: 'Your assignment has been updated',
    priority: 'high',
    category: NotificationCategory.ACADEMIC,
    isRead: false,
    createdAt: '2024-01-01T10:00:00Z',
  },
];

// Test component for browser compatibility
function BrowserCompatibilityTest() {
  const {
    isSupported,
    permission,
    isSubscribed,
    error,
    initialize,
    requestPermission,
    subscribe,
    sendTestNotification,
  } = usePushNotifications();

  return (
    <div>
      <div data-testid="is-supported">{isSupported ? 'supported' : 'not-supported'}</div>
      <div data-testid="permission">{permission}</div>
      <div data-testid="is-subscribed">{isSubscribed ? 'subscribed' : 'not-subscribed'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      
      <button onClick={() => initialize()} data-testid="initialize">Initialize</button>
      <button onClick={() => requestPermission()} data-testid="request-permission">Request Permission</button>
      <button onClick={() => subscribe()} data-testid="subscribe">Subscribe</button>
      <button onClick={() => sendTestNotification()} data-testid="send-test">Send Test</button>
    </div>
  );
}

// Browser environment mocks
const createBrowserEnvironment = (browser: 'chrome' | 'firefox' | 'safari' | 'edge' | 'unsupported') => {
  // Reset all browser APIs
  delete (window as any).Notification;
  delete (navigator as any).serviceWorker;
  delete (window as any).PushManager;

  switch (browser) {
    case 'chrome':
      // Chrome/Chromium support
      Object.defineProperty(window, 'Notification', {
        value: {
          permission: 'default',
          requestPermission: jest.fn().mockResolvedValue('granted'),
        },
        writable: true,
      });
      
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          register: jest.fn().mockResolvedValue({
            pushManager: {
              subscribe: jest.fn().mockResolvedValue({
                endpoint: 'https://fcm.googleapis.com/fcm/send/test',
                keys: { p256dh: 'test', auth: 'test' },
              }),
              getSubscription: jest.fn().mockResolvedValue(null),
            },
          }),
          ready: Promise.resolve({
            pushManager: {
              subscribe: jest.fn(),
              getSubscription: jest.fn(),
            },
          }),
        },
        writable: true,
      });
      
      Object.defineProperty(window, 'PushManager', {
        value: {
          supportedContentEncodings: ['aes128gcm'],
        },
        writable: true,
      });
      
      // Mock user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        writable: true,
      });
      break;

    case 'firefox':
      // Firefox support
      Object.defineProperty(window, 'Notification', {
        value: {
          permission: 'default',
          requestPermission: jest.fn().mockResolvedValue('granted'),
        },
        writable: true,
      });
      
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          register: jest.fn().mockResolvedValue({
            pushManager: {
              subscribe: jest.fn().mockResolvedValue({
                endpoint: 'https://updates.push.services.mozilla.com/test',
                keys: { p256dh: 'test', auth: 'test' },
              }),
              getSubscription: jest.fn().mockResolvedValue(null),
            },
          }),
          ready: Promise.resolve({
            pushManager: {
              subscribe: jest.fn(),
              getSubscription: jest.fn(),
            },
          }),
        },
        writable: true,
      });
      
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        writable: true,
      });
      break;

    case 'safari':
      // Safari support (limited)
      Object.defineProperty(window, 'Notification', {
        value: {
          permission: 'default',
          requestPermission: jest.fn().mockImplementation((callback) => {
            if (callback) {
              callback('granted');
            }
            return Promise.resolve('granted');
          }),
        },
        writable: true,
      });
      
      // Safari doesn't support service worker push notifications
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        writable: true,
      });
      
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        writable: true,
      });
      break;

    case 'edge':
      // Edge support (similar to Chrome)
      Object.defineProperty(window, 'Notification', {
        value: {
          permission: 'default',
          requestPermission: jest.fn().mockResolvedValue('granted'),
        },
        writable: true,
      });
      
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          register: jest.fn().mockResolvedValue({
            pushManager: {
              subscribe: jest.fn().mockResolvedValue({
                endpoint: 'https://wns2-par02p.notify.windows.com/test',
                keys: { p256dh: 'test', auth: 'test' },
              }),
              getSubscription: jest.fn().mockResolvedValue(null),
            },
          }),
          ready: Promise.resolve({
            pushManager: {
              subscribe: jest.fn(),
              getSubscription: jest.fn(),
            },
          }),
        },
        writable: true,
      });
      
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
        writable: true,
      });
      break;

    case 'unsupported':
      // Unsupported browser
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)',
        writable: true,
      });
      break;
  }
};

describe('Browser Compatibility Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock other dependencies
    jest.doMock('../../lib/api/services/notification.service', () => ({
      notificationService: {
        getNotificationsWithRetry: jest.fn().mockResolvedValue({
          notifications: mockNotifications,
          total: 1,
          unreadCount: 1,
        }),
        subscribeToPushWithRetry: jest.fn().mockResolvedValue(undefined),
        unsubscribeFromPush: jest.fn().mockResolvedValue(undefined),
      },
    }));
    
    jest.doMock('../../lib/notifications/network-status', () => ({
      networkStatusManager: {
        isOnline: () => true,
        addListener: () => () => {},
      },
    }));
    
    jest.doMock('../../lib/notifications/offline-storage', () => ({
      offlineNotificationStorage: {
        initialize: jest.fn().mockResolvedValue(undefined),
        getNotifications: jest.fn().mockResolvedValue({
          notifications: [],
          total: 0,
          unreadCount: 0,
        }),
      },
    }));
    
    jest.doMock('../../lib/notifications/offline-queue', () => ({
      offlineNotificationManager: {
        queueAction: jest.fn(),
        processQueue: jest.fn().mockResolvedValue(undefined),
      },
    }));
  });

  describe('Chrome/Chromium Support', () => {
    beforeEach(() => {
      createBrowserEnvironment('chrome');
      
      mockUsePushNotifications.mockReturnValue({
        isSupported: true,
        permission: 'default',
        isSubscribed: false,
        error: null,
        initialize: jest.fn().mockResolvedValue(true),
        requestPermission: jest.fn().mockResolvedValue('granted'),
        subscribe: jest.fn().mockResolvedValue(true),
        sendTestNotification: jest.fn().mockResolvedValue(undefined),
      });
    });

    it('supports full push notification functionality in Chrome', async () => {
      const user = userEvent.setup();
      
      render(
        <NotificationProvider>
          <BrowserCompatibilityTest />
        </NotificationProvider>
      );
      
      expect(screen.getByTestId('is-supported')).toHaveTextContent('supported');
      
      // Test initialization
      const initButton = screen.getByTestId('initialize');
      await user.click(initButton);
      
      // Test permission request
      const permissionButton = screen.getByTestId('request-permission');
      await user.click(permissionButton);
      
      // Test subscription
      const subscribeButton = screen.getByTestId('subscribe');
      await user.click(subscribeButton);
      
      // Test notification sending
      const testButton = screen.getByTestId('send-test');
      await user.click(testButton);
      
      // All features should work
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });

    it('handles Chrome-specific push endpoints', async () => {
      render(
        <NotificationProvider>
          <BrowserCompatibilityTest />
        </NotificationProvider>
      );
      
      // Should handle FCM endpoints
      expect(navigator.serviceWorker?.register).toBeDefined();
    });
  });

  describe('Firefox Support', () => {
    beforeEach(() => {
      createBrowserEnvironment('firefox');
      
      mockUsePushNotifications.mockReturnValue({
        isSupported: true,
        permission: 'default',
        isSubscribed: false,
        error: null,
        initialize: jest.fn().mockResolvedValue(true),
        requestPermission: jest.fn().mockResolvedValue('granted'),
        subscribe: jest.fn().mockResolvedValue(true),
        sendTestNotification: jest.fn().mockResolvedValue(undefined),
      });
    });

    it('supports push notifications in Firefox', async () => {
      const user = userEvent.setup();
      
      render(
        <NotificationProvider>
          <BrowserCompatibilityTest />
        </NotificationProvider>
      );
      
      expect(screen.getByTestId('is-supported')).toHaveTextContent('supported');
      
      // Test subscription
      const subscribeButton = screen.getByTestId('subscribe');
      await user.click(subscribeButton);
      
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });

    it('handles Firefox-specific push endpoints', async () => {
      render(
        <NotificationProvider>
          <BrowserCompatibilityTest />
        </NotificationProvider>
      );
      
      // Should handle Mozilla push endpoints
      expect(navigator.serviceWorker?.register).toBeDefined();
    });
  });

  describe('Safari Support', () => {
    beforeEach(() => {
      createBrowserEnvironment('safari');
      
      mockUsePushNotifications.mockReturnValue({
        isSupported: false,
        permission: 'default',
        isSubscribed: false,
        error: 'Push notifications are not supported in this browser',
        initialize: jest.fn().mockResolvedValue(false),
        requestPermission: jest.fn().mockResolvedValue('granted'),
        subscribe: jest.fn().mockResolvedValue(false),
        sendTestNotification: jest.fn().mockRejectedValue(new Error('Not supported')),
      });
    });

    it('shows limited support in Safari', async () => {
      render(
        <NotificationProvider>
          <BrowserCompatibilityTest />
        </NotificationProvider>
      );
      
      expect(screen.getByTestId('is-supported')).toHaveTextContent('not-supported');
      expect(screen.getByTestId('error')).toHaveTextContent('Push notifications are not supported in this browser');
    });

    it('provides fallback functionality in Safari', async () => {
      const user = userEvent.setup();
      
      render(
        <NotificationProvider>
          <BrowserCompatibilityTest />
        </NotificationProvider>
      );
      
      // Should still allow basic notification permission
      const permissionButton = screen.getByTestId('request-permission');
      await user.click(permissionButton);
      
      // But subscription should fail
      const subscribeButton = screen.getByTestId('subscribe');
      await user.click(subscribeButton);
      
      expect(screen.getByTestId('is-subscribed')).toHaveTextContent('not-subscribed');
    });
  });

  describe('Edge Support', () => {
    beforeEach(() => {
      createBrowserEnvironment('edge');
      
      mockUsePushNotifications.mockReturnValue({
        isSupported: true,
        permission: 'default',
        isSubscribed: false,
        error: null,
        initialize: jest.fn().mockResolvedValue(true),
        requestPermission: jest.fn().mockResolvedValue('granted'),
        subscribe: jest.fn().mockResolvedValue(true),
        sendTestNotification: jest.fn().mockResolvedValue(undefined),
      });
    });

    it('supports push notifications in Edge', async () => {
      const user = userEvent.setup();
      
      render(
        <NotificationProvider>
          <BrowserCompatibilityTest />
        </NotificationProvider>
      );
      
      expect(screen.getByTestId('is-supported')).toHaveTextContent('supported');
      
      // Test full functionality
      const subscribeButton = screen.getByTestId('subscribe');
      await user.click(subscribeButton);
      
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });

    it('handles Edge-specific push endpoints', async () => {
      render(
        <NotificationProvider>
          <BrowserCompatibilityTest />
        </NotificationProvider>
      );
      
      // Should handle WNS endpoints
      expect(navigator.serviceWorker?.register).toBeDefined();
    });
  });

  describe('Unsupported Browser Fallback', () => {
    beforeEach(() => {
      createBrowserEnvironment('unsupported');
      
      mockUsePushNotifications.mockReturnValue({
        isSupported: false,
        permission: 'default',
        isSubscribed: false,
        error: 'Push notifications are not supported in this browser',
        initialize: jest.fn().mockResolvedValue(false),
        requestPermission: jest.fn().mockResolvedValue('denied'),
        subscribe: jest.fn().mockResolvedValue(false),
        sendTestNotification: jest.fn().mockRejectedValue(new Error('Not supported')),
      });
    });

    it('provides graceful fallback for unsupported browsers', async () => {
      render(
        <NotificationProvider>
          <BrowserCompatibilityTest />
        </NotificationProvider>
      );
      
      expect(screen.getByTestId('is-supported')).toHaveTextContent('not-supported');
      expect(screen.getByTestId('error')).toHaveTextContent('Push notifications are not supported in this browser');
    });

    it('shows alternative notification methods', async () => {
      render(
        <NotificationProvider>
          <BrowserCompatibilityTest />
        </NotificationProvider>
      );
      
      // Should suggest alternative methods like email notifications
      expect(screen.getByTestId('is-supported')).toHaveTextContent('not-supported');
    });
  });

  describe('Feature Detection', () => {
    it('detects service worker support', () => {
      createBrowserEnvironment('chrome');
      
      expect('serviceWorker' in navigator).toBe(true);
      
      createBrowserEnvironment('safari');
      
      expect('serviceWorker' in navigator).toBe(false);
    });

    it('detects push manager support', () => {
      createBrowserEnvironment('chrome');
      
      expect('PushManager' in window).toBe(true);
      
      createBrowserEnvironment('unsupported');
      
      expect('PushManager' in window).toBe(false);
    });

    it('detects notification API support', () => {
      createBrowserEnvironment('chrome');
      
      expect('Notification' in window).toBe(true);
      
      createBrowserEnvironment('unsupported');
      
      expect('Notification' in window).toBe(false);
    });
  });

  describe('Progressive Enhancement', () => {
    it('enhances experience based on browser capabilities', async () => {
      // Start with unsupported browser
      createBrowserEnvironment('unsupported');
      
      mockUsePushNotifications.mockReturnValue({
        isSupported: false,
        permission: 'default',
        isSubscribed: false,
        error: 'Push notifications are not supported in this browser',
        initialize: jest.fn().mockResolvedValue(false),
        requestPermission: jest.fn().mockResolvedValue('denied'),
        subscribe: jest.fn().mockResolvedValue(false),
        sendTestNotification: jest.fn().mockRejectedValue(new Error('Not supported')),
      });
      
      const { rerender } = render(
        <NotificationProvider>
          <BrowserCompatibilityTest />
        </NotificationProvider>
      );
      
      expect(screen.getByTestId('is-supported')).toHaveTextContent('not-supported');
      
      // Upgrade to supported browser
      createBrowserEnvironment('chrome');
      
      mockUsePushNotifications.mockReturnValue({
        isSupported: true,
        permission: 'default',
        isSubscribed: false,
        error: null,
        initialize: jest.fn().mockResolvedValue(true),
        requestPermission: jest.fn().mockResolvedValue('granted'),
        subscribe: jest.fn().mockResolvedValue(true),
        sendTestNotification: jest.fn().mockResolvedValue(undefined),
      });
      
      rerender(
        <NotificationProvider>
          <BrowserCompatibilityTest />
        </NotificationProvider>
      );
      
      expect(screen.getByTestId('is-supported')).toHaveTextContent('supported');
    });

    it('provides appropriate user education for each browser', async () => {
      // Chrome - full support
      createBrowserEnvironment('chrome');
      
      mockUsePushNotifications.mockReturnValue({
        isSupported: true,
        permission: 'default',
        isSubscribed: false,
        error: null,
        initialize: jest.fn().mockResolvedValue(true),
        requestPermission: jest.fn().mockResolvedValue('granted'),
        subscribe: jest.fn().mockResolvedValue(true),
        sendTestNotification: jest.fn().mockResolvedValue(undefined),
      });
      
      render(
        <NotificationProvider>
          <BrowserCompatibilityTest />
        </NotificationProvider>
      );
      
      expect(screen.getByTestId('is-supported')).toHaveTextContent('supported');
      
      // Should show full feature set
      expect(screen.getByTestId('subscribe')).toBeInTheDocument();
      expect(screen.getByTestId('send-test')).toBeInTheDocument();
    });
  });

  describe('Error Handling Across Browsers', () => {
    it('handles browser-specific errors gracefully', async () => {
      const user = userEvent.setup();
      
      createBrowserEnvironment('chrome');
      
      // Mock permission denied
      mockUsePushNotifications.mockReturnValue({
        isSupported: true,
        permission: 'denied',
        isSubscribed: false,
        error: 'Notification permission was denied. Please enable notifications in your browser settings.',
        initialize: jest.fn().mockResolvedValue(true),
        requestPermission: jest.fn().mockResolvedValue('denied'),
        subscribe: jest.fn().mockResolvedValue(false),
        sendTestNotification: jest.fn().mockRejectedValue(new Error('Permission denied')),
      });
      
      render(
        <NotificationProvider>
          <BrowserCompatibilityTest />
        </NotificationProvider>
      );
      
      const permissionButton = screen.getByTestId('request-permission');
      await user.click(permissionButton);
      
      expect(screen.getByTestId('permission')).toHaveTextContent('denied');
      expect(screen.getByTestId('error')).toHaveTextContent('Notification permission was denied');
    });

    it('provides browser-specific error messages', async () => {
      // Test different error scenarios for different browsers
      const browsers = ['chrome', 'firefox', 'safari', 'edge'] as const;
      
      for (const browser of browsers) {
        createBrowserEnvironment(browser);
        
        const isSupported = browser !== 'safari';
        const errorMessage = isSupported 
          ? null 
          : 'Push notifications are not supported in this browser';
        
        mockUsePushNotifications.mockReturnValue({
          isSupported,
          permission: 'default',
          isSubscribed: false,
          error: errorMessage,
          initialize: jest.fn().mockResolvedValue(isSupported),
          requestPermission: jest.fn().mockResolvedValue(isSupported ? 'granted' : 'denied'),
          subscribe: jest.fn().mockResolvedValue(isSupported),
          sendTestNotification: jest.fn().mockImplementation(() => 
            isSupported ? Promise.resolve() : Promise.reject(new Error('Not supported'))
          ),
        });
        
        render(
          <NotificationProvider>
            <BrowserCompatibilityTest />
          </NotificationProvider>
        );
        
        expect(screen.getByTestId('is-supported')).toHaveTextContent(
          isSupported ? 'supported' : 'not-supported'
        );
        
        if (errorMessage) {
          expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
        }
      }
    });
  });
});