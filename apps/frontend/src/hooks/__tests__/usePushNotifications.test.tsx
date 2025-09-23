import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePushNotifications, usePushPermission, usePushSubscriptionStatus } from '../usePushNotifications';
import { PushNotificationManager } from '../../lib/push-notifications';
import { notificationService } from '../../lib/api/services/notification.service';
import { useAuth } from '../useAuth';

// Mock dependencies
jest.mock('../../lib/push-notifications');
jest.mock('../../lib/api/services/notification.service');
jest.mock('../useAuth');

const mockPushManager = {
  getInstance: jest.fn(),
  isSupported: jest.fn(),
  initialize: jest.fn(),
  getPermissionStatus: jest.fn(),
  getSubscription: jest.fn(),
  isSubscribed: jest.fn(),
  requestPermission: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  createDeviceTokenRegistration: jest.fn(),
  handleError: jest.fn(),
  sendTestNotification: jest.fn(),
};

const mockNotificationService = notificationService as jest.Mocked<typeof notificationService>;
const mockUseAuth = useAuth as jest.Mock;

// Mock PushNotificationManager
(PushNotificationManager.getInstance as jest.Mock).mockReturnValue(mockPushManager);

const mockUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
};

const mockSubscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/test',
  keys: {
    p256dh: 'test-p256dh-key',
    auth: 'test-auth-key',
  },
} as PushSubscription;

// Test component for usePushNotifications hook
function TestPushNotifications() {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscription,
    isInitialized,
    initialize,
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
    clearError,
    checkSubscriptionStatus,
    resubscribe,
  } = usePushNotifications();

  return (
    <div>
      <div data-testid="is-supported">{isSupported ? 'supported' : 'not-supported'}</div>
      <div data-testid="permission">{permission}</div>
      <div data-testid="is-subscribed">{isSubscribed ? 'subscribed' : 'not-subscribed'}</div>
      <div data-testid="is-loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="is-initialized">{isInitialized ? 'initialized' : 'not-initialized'}</div>
      <div data-testid="subscription">{subscription ? 'has-subscription' : 'no-subscription'}</div>
      
      <button onClick={() => initialize()} data-testid="initialize">Initialize</button>
      <button onClick={() => requestPermission()} data-testid="request-permission">Request Permission</button>
      <button onClick={() => subscribe()} data-testid="subscribe">Subscribe</button>
      <button onClick={() => unsubscribe()} data-testid="unsubscribe">Unsubscribe</button>
      <button onClick={() => sendTestNotification()} data-testid="send-test">Send Test</button>
      <button onClick={() => clearError()} data-testid="clear-error">Clear Error</button>
      <button onClick={() => checkSubscriptionStatus()} data-testid="check-status">Check Status</button>
      <button onClick={() => resubscribe()} data-testid="resubscribe">Resubscribe</button>
    </div>
  );
}

// Test component for usePushPermission hook
function TestPushPermission() {
  const {
    permission,
    canRequestPermission,
    hasPermission,
    isBlocked,
    requestPermission,
    isSupported,
  } = usePushPermission();

  return (
    <div>
      <div data-testid="permission">{permission}</div>
      <div data-testid="can-request">{canRequestPermission ? 'can-request' : 'cannot-request'}</div>
      <div data-testid="has-permission">{hasPermission ? 'has-permission' : 'no-permission'}</div>
      <div data-testid="is-blocked">{isBlocked ? 'blocked' : 'not-blocked'}</div>
      <div data-testid="is-supported">{isSupported ? 'supported' : 'not-supported'}</div>
      
      <button onClick={() => requestPermission()} data-testid="request-permission">Request Permission</button>
    </div>
  );
}

// Test component for usePushSubscriptionStatus hook
function TestPushSubscriptionStatus() {
  const {
    isSubscribed,
    subscription,
    subscribe,
    unsubscribe,
    resubscribe,
    isLoading,
    error,
  } = usePushSubscriptionStatus();

  return (
    <div>
      <div data-testid="is-subscribed">{isSubscribed ? 'subscribed' : 'not-subscribed'}</div>
      <div data-testid="subscription">{subscription ? 'has-subscription' : 'no-subscription'}</div>
      <div data-testid="is-loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      
      <button onClick={() => subscribe()} data-testid="subscribe">Subscribe</button>
      <button onClick={() => unsubscribe()} data-testid="unsubscribe">Unsubscribe</button>
      <button onClick={() => resubscribe()} data-testid="resubscribe">Resubscribe</button>
    </div>
  );
}

describe('usePushNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockUseAuth.mockReturnValue({ user: mockUser });
    mockPushManager.isSupported.mockReturnValue(true);
    mockPushManager.initialize.mockResolvedValue(true);
    mockPushManager.getPermissionStatus.mockReturnValue('default');
    mockPushManager.getSubscription.mockReturnValue(null);
    mockPushManager.isSubscribed.mockReturnValue(false);
    mockPushManager.requestPermission.mockResolvedValue('granted');
    mockPushManager.subscribe.mockResolvedValue(mockSubscription);
    mockPushManager.unsubscribe.mockResolvedValue(true);
    mockPushManager.createDeviceTokenRegistration.mockReturnValue({
      subscription: {
        endpoint: mockSubscription.endpoint,
        keys: mockSubscription.keys,
        userId: mockUser.id,
        deviceInfo: {
          userAgent: 'test-agent',
          platform: 'test-platform',
          isMobile: false,
        },
      },
    });
    mockPushManager.handleError.mockReturnValue('unknown_error');
    mockPushManager.sendTestNotification.mockResolvedValue(undefined);
    
    mockNotificationService.subscribeToPushWithRetry.mockResolvedValue(undefined);
    mockNotificationService.unsubscribeFromPush.mockResolvedValue(undefined);
    mockNotificationService.sendTestNotification.mockResolvedValue(undefined);
    
    // Mock environment variable
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'test-vapid-key';
  });

  it('initializes with default state', () => {
    render(<TestPushNotifications />);
    
    expect(screen.getByTestId('is-supported')).toHaveTextContent('not-supported');
    expect(screen.getByTestId('permission')).toHaveTextContent('default');
    expect(screen.getByTestId('is-subscribed')).toHaveTextContent('not-subscribed');
    expect(screen.getByTestId('is-loading')).toHaveTextContent('not-loading');
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    expect(screen.getByTestId('is-initialized')).toHaveTextContent('not-initialized');
    expect(screen.getByTestId('subscription')).toHaveTextContent('no-subscription');
  });

  it('initializes push notification manager on mount', async () => {
    render(<TestPushNotifications />);
    
    await waitFor(() => {
      expect(mockPushManager.initialize).toHaveBeenCalledWith('test-vapid-key');
    });
  });

  it('handles successful initialization', async () => {
    mockPushManager.getPermissionStatus.mockReturnValue('granted');
    mockPushManager.getSubscription.mockReturnValue(mockSubscription);
    mockPushManager.isSubscribed.mockReturnValue(true);
    
    render(<TestPushNotifications />);
    
    await waitFor(() => {
      expect(screen.getByTestId('is-supported')).toHaveTextContent('supported');
      expect(screen.getByTestId('permission')).toHaveTextContent('granted');
      expect(screen.getByTestId('is-subscribed')).toHaveTextContent('subscribed');
      expect(screen.getByTestId('is-initialized')).toHaveTextContent('initialized');
      expect(screen.getByTestId('subscription')).toHaveTextContent('has-subscription');
    });
  });

  it('handles initialization failure', async () => {
    mockPushManager.initialize.mockResolvedValue(false);
    
    render(<TestPushNotifications />);
    
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Failed to initialize push notification manager');
    });
  });

  it('handles unsupported browsers', async () => {
    mockPushManager.isSupported.mockReturnValue(false);
    
    render(<TestPushNotifications />);
    
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Push notifications are not supported in this browser');
    });
  });

  it('handles manual initialization', async () => {
    const user = userEvent.setup();
    
    render(<TestPushNotifications />);
    
    const initializeButton = screen.getByTestId('initialize');
    await user.click(initializeButton);
    
    await waitFor(() => {
      expect(mockPushManager.initialize).toHaveBeenCalled();
    });
  });

  it('handles permission request', async () => {
    const user = userEvent.setup();
    
    render(<TestPushNotifications />);
    
    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByTestId('is-initialized')).toHaveTextContent('initialized');
    });
    
    const requestPermissionButton = screen.getByTestId('request-permission');
    await user.click(requestPermissionButton);
    
    await waitFor(() => {
      expect(mockPushManager.requestPermission).toHaveBeenCalled();
      expect(screen.getByTestId('permission')).toHaveTextContent('granted');
    });
  });

  it('handles subscription', async () => {
    const user = userEvent.setup();
    mockPushManager.getPermissionStatus.mockReturnValue('granted');
    
    render(<TestPushNotifications />);
    
    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByTestId('is-initialized')).toHaveTextContent('initialized');
    });
    
    const subscribeButton = screen.getByTestId('subscribe');
    await user.click(subscribeButton);
    
    await waitFor(() => {
      expect(mockPushManager.subscribe).toHaveBeenCalled();
      expect(mockNotificationService.subscribeToPushWithRetry).toHaveBeenCalled();
      expect(screen.getByTestId('is-subscribed')).toHaveTextContent('subscribed');
    });
  });

  it('handles subscription without permission', async () => {
    const user = userEvent.setup();
    
    render(<TestPushNotifications />);
    
    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByTestId('is-initialized')).toHaveTextContent('initialized');
    });
    
    const subscribeButton = screen.getByTestId('subscribe');
    await user.click(subscribeButton);
    
    await waitFor(() => {
      expect(mockPushManager.requestPermission).toHaveBeenCalled();
      expect(mockPushManager.subscribe).toHaveBeenCalled();
    });
  });

  it('handles subscription failure', async () => {
    const user = userEvent.setup();
    mockPushManager.subscribe.mockResolvedValue(null);
    mockPushManager.handleError.mockReturnValue('subscription_failed');
    
    render(<TestPushNotifications />);
    
    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByTestId('is-initialized')).toHaveTextContent('initialized');
    });
    
    const subscribeButton = screen.getByTestId('subscribe');
    await user.click(subscribeButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Failed to subscribe to push notifications');
    });
  });

  it('handles unsubscription', async () => {
    const user = userEvent.setup();
    mockPushManager.getSubscription.mockReturnValue(mockSubscription);
    
    render(<TestPushNotifications />);
    
    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByTestId('is-initialized')).toHaveTextContent('initialized');
    });
    
    const unsubscribeButton = screen.getByTestId('unsubscribe');
    await user.click(unsubscribeButton);
    
    await waitFor(() => {
      expect(mockNotificationService.unsubscribeFromPush).toHaveBeenCalledWith(mockSubscription.endpoint);
      expect(mockPushManager.unsubscribe).toHaveBeenCalled();
      expect(screen.getByTestId('is-subscribed')).toHaveTextContent('not-subscribed');
    });
  });

  it('handles test notification', async () => {
    const user = userEvent.setup();
    mockPushManager.isSubscribed.mockReturnValue(true);
    
    render(<TestPushNotifications />);
    
    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByTestId('is-initialized')).toHaveTextContent('initialized');
    });
    
    const sendTestButton = screen.getByTestId('send-test');
    await user.click(sendTestButton);
    
    await waitFor(() => {
      expect(mockNotificationService.sendTestNotification).toHaveBeenCalled();
    });
  });

  it('handles test notification fallback', async () => {
    const user = userEvent.setup();
    mockPushManager.isSubscribed.mockReturnValue(true);
    mockNotificationService.sendTestNotification.mockRejectedValue(new Error('Backend error'));
    
    render(<TestPushNotifications />);
    
    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByTestId('is-initialized')).toHaveTextContent('initialized');
    });
    
    const sendTestButton = screen.getByTestId('send-test');
    await user.click(sendTestButton);
    
    await waitFor(() => {
      expect(mockPushManager.sendTestNotification).toHaveBeenCalled();
    });
  });

  it('handles resubscription', async () => {
    const user = userEvent.setup();
    mockPushManager.isSubscribed.mockReturnValue(true);
    
    render(<TestPushNotifications />);
    
    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByTestId('is-initialized')).toHaveTextContent('initialized');
    });
    
    const resubscribeButton = screen.getByTestId('resubscribe');
    await user.click(resubscribeButton);
    
    await waitFor(() => {
      expect(mockPushManager.unsubscribe).toHaveBeenCalled();
    });
    
    await waitFor(() => {
      expect(mockPushManager.subscribe).toHaveBeenCalled();
    });
  });

  it('handles error clearing', async () => {
    const user = userEvent.setup();
    mockPushManager.initialize.mockResolvedValue(false);
    
    render(<TestPushNotifications />);
    
    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByTestId('error')).not.toHaveTextContent('no-error');
    });
    
    const clearErrorButton = screen.getByTestId('clear-error');
    await user.click(clearErrorButton);
    
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
  });

  it('handles subscription status check', async () => {
    const user = userEvent.setup();
    
    render(<TestPushNotifications />);
    
    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByTestId('is-initialized')).toHaveTextContent('initialized');
    });
    
    const checkStatusButton = screen.getByTestId('check-status');
    await user.click(checkStatusButton);
    
    expect(mockPushManager.getSubscription).toHaveBeenCalled();
    expect(mockPushManager.isSubscribed).toHaveBeenCalled();
    expect(mockPushManager.getPermissionStatus).toHaveBeenCalled();
  });

  it('handles user authentication changes', async () => {
    const { rerender } = render(<TestPushNotifications />);
    
    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByTestId('is-initialized')).toHaveTextContent('initialized');
    });
    
    // Change user to null (logout)
    mockUseAuth.mockReturnValue({ user: null });
    
    rerender(<TestPushNotifications />);
    
    // Should check subscription status
    expect(mockPushManager.getSubscription).toHaveBeenCalled();
  });

  it('handles page visibility changes', async () => {
    render(<TestPushNotifications />);
    
    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByTestId('is-initialized')).toHaveTextContent('initialized');
    });
    
    // Mock document visibility change
    Object.defineProperty(document, 'visibilityState', {
      value: 'visible',
      writable: true,
    });
    
    // Simulate visibility change event
    act(() => {
      const event = new Event('visibilitychange');
      document.dispatchEvent(event);
    });
    
    expect(mockPushManager.getSubscription).toHaveBeenCalled();
  });

  it('handles online/offline status changes', async () => {
    render(<TestPushNotifications />);
    
    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByTestId('is-initialized')).toHaveTextContent('initialized');
    });
    
    // Simulate online event
    act(() => {
      const event = new Event('online');
      window.dispatchEvent(event);
    });
    
    expect(mockPushManager.getSubscription).toHaveBeenCalled();
  });
});

describe('usePushPermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: mockUser });
    mockPushManager.isSupported.mockReturnValue(true);
    mockPushManager.initialize.mockResolvedValue(true);
    mockPushManager.getPermissionStatus.mockReturnValue('default');
    mockPushManager.requestPermission.mockResolvedValue('granted');
  });

  it('provides permission status and utilities', async () => {
    render(<TestPushPermission />);
    
    await waitFor(() => {
      expect(screen.getByTestId('permission')).toHaveTextContent('default');
      expect(screen.getByTestId('can-request')).toHaveTextContent('can-request');
      expect(screen.getByTestId('has-permission')).toHaveTextContent('no-permission');
      expect(screen.getByTestId('is-blocked')).toHaveTextContent('not-blocked');
      expect(screen.getByTestId('is-supported')).toHaveTextContent('supported');
    });
  });

  it('handles granted permission', async () => {
    mockPushManager.getPermissionStatus.mockReturnValue('granted');
    
    render(<TestPushPermission />);
    
    await waitFor(() => {
      expect(screen.getByTestId('has-permission')).toHaveTextContent('has-permission');
      expect(screen.getByTestId('can-request')).toHaveTextContent('cannot-request');
    });
  });

  it('handles denied permission', async () => {
    mockPushManager.getPermissionStatus.mockReturnValue('denied');
    
    render(<TestPushPermission />);
    
    await waitFor(() => {
      expect(screen.getByTestId('is-blocked')).toHaveTextContent('blocked');
      expect(screen.getByTestId('can-request')).toHaveTextContent('cannot-request');
    });
  });
});

describe('usePushSubscriptionStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: mockUser });
    mockPushManager.isSupported.mockReturnValue(true);
    mockPushManager.initialize.mockResolvedValue(true);
    mockPushManager.getPermissionStatus.mockReturnValue('granted');
    mockPushManager.isSubscribed.mockReturnValue(false);
    mockPushManager.subscribe.mockResolvedValue(mockSubscription);
    mockPushManager.unsubscribe.mockResolvedValue(true);
  });

  it('provides subscription status and actions', async () => {
    render(<TestPushSubscriptionStatus />);
    
    await waitFor(() => {
      expect(screen.getByTestId('is-subscribed')).toHaveTextContent('not-subscribed');
      expect(screen.getByTestId('subscription')).toHaveTextContent('no-subscription');
      expect(screen.getByTestId('is-loading')).toHaveTextContent('not-loading');
      expect(screen.getByTestId('error')).toHaveTextContent('no-error');
    });
  });

  it('handles subscription through status hook', async () => {
    const user = userEvent.setup();
    
    render(<TestPushSubscriptionStatus />);
    
    // Wait for initialization
    await waitFor(() => {
      expect(screen.getByTestId('is-subscribed')).toHaveTextContent('not-subscribed');
    });
    
    const subscribeButton = screen.getByTestId('subscribe');
    await user.click(subscribeButton);
    
    await waitFor(() => {
      expect(mockPushManager.subscribe).toHaveBeenCalled();
    });
  });
});