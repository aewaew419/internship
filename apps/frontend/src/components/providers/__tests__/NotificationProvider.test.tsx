import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationProvider } from '../NotificationProvider';
import { useNotifications } from '../../../hooks/useNotifications';
import { notificationService } from '../../../lib/api/services/notification.service';
import { offlineNotificationManager } from '../../../lib/notifications/offline-queue';
import { offlineNotificationStorage } from '../../../lib/notifications/offline-storage';
import { networkStatusManager } from '../../../lib/notifications/network-status';
import { NotificationType, NotificationCategory } from '../../../types/notifications';
import type { Notification, NotificationSettings } from '../../../types/notifications';

// Mock dependencies
jest.mock('../../../lib/api/services/notification.service');
jest.mock('../../../lib/notifications/offline-queue');
jest.mock('../../../lib/notifications/offline-storage');
jest.mock('../../../lib/notifications/network-status');

const mockNotificationService = notificationService as jest.Mocked<typeof notificationService>;
const mockOfflineManager = offlineNotificationManager as jest.Mocked<typeof offlineNotificationManager>;
const mockOfflineStorage = offlineNotificationStorage as jest.Mocked<typeof offlineNotificationStorage>;
const mockNetworkManager = networkStatusManager as jest.Mocked<typeof networkStatusManager>;

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
  {
    id: '2',
    userId: 1,
    type: NotificationType.GRADE_UPDATE,
    title: 'Grade Posted',
    body: 'Your grade has been posted',
    priority: 'normal',
    category: NotificationCategory.ACADEMIC,
    isRead: true,
    createdAt: '2024-01-01T09:00:00Z',
    readAt: '2024-01-01T09:30:00Z',
  },
];

const mockSettings: NotificationSettings = {
  pushNotifications: true,
  emailNotifications: true,
  types: {
    [NotificationType.ASSIGNMENT_CHANGE]: true,
    [NotificationType.GRADE_UPDATE]: true,
    [NotificationType.SCHEDULE_REMINDER]: true,
    [NotificationType.DOCUMENT_UPDATE]: true,
    [NotificationType.DEADLINE_REMINDER]: true,
    [NotificationType.SYSTEM_ANNOUNCEMENT]: true,
    [NotificationType.EVALUATION_REQUEST]: true,
    [NotificationType.VISIT_SCHEDULED]: true,
  },
  frequency: 'immediate',
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
  },
  sound: true,
  vibration: true,
};

// Test component that uses the notification context
function TestComponent() {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    settings,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    updateSettings,
    isConnected,
    connect,
    disconnect,
  } = useNotifications();

  return (
    <div>
      <div data-testid="notifications-count">{notifications.length}</div>
      <div data-testid="unread-count">{unreadCount}</div>
      <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="connected">{isConnected ? 'connected' : 'disconnected'}</div>
      <div data-testid="push-enabled">{settings?.pushNotifications ? 'enabled' : 'disabled'}</div>
      
      {notifications.map(notification => (
        <div key={notification.id} data-testid={`notification-${notification.id}`}>
          <span>{notification.title}</span>
          <span data-testid={`read-status-${notification.id}`}>
            {notification.isRead ? 'read' : 'unread'}
          </span>
        </div>
      ))}
      
      <button onClick={() => fetchNotifications()} data-testid="fetch-notifications">
        Fetch Notifications
      </button>
      <button onClick={() => markAsRead('1')} data-testid="mark-as-read">
        Mark as Read
      </button>
      <button onClick={() => markAllAsRead()} data-testid="mark-all-as-read">
        Mark All as Read
      </button>
      <button onClick={() => deleteNotification('1')} data-testid="delete-notification">
        Delete Notification
      </button>
      <button onClick={() => clearAll()} data-testid="clear-all">
        Clear All
      </button>
      <button onClick={() => updateSettings({ pushNotifications: false })} data-testid="update-settings">
        Update Settings
      </button>
      <button onClick={() => connect()} data-testid="connect">
        Connect
      </button>
      <button onClick={() => disconnect()} data-testid="disconnect">
        Disconnect
      </button>
    </div>
  );
}

describe('NotificationProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockNetworkManager.isOnline.mockReturnValue(true);
    mockNetworkManager.addListener.mockReturnValue(() => {});
    
    mockNotificationService.getNotificationsWithRetry.mockResolvedValue({
      notifications: mockNotifications,
      total: 2,
      unreadCount: 1,
    });
    
    mockNotificationService.getSettings.mockResolvedValue(mockSettings);
    mockNotificationService.markAsRead.mockResolvedValue(undefined);
    mockNotificationService.markAllAsRead.mockResolvedValue(undefined);
    mockNotificationService.deleteNotification.mockResolvedValue(undefined);
    mockNotificationService.clearAll.mockResolvedValue(undefined);
    mockNotificationService.updateSettingsWithRetry.mockResolvedValue(mockSettings);
    
    mockOfflineStorage.initialize.mockResolvedValue(undefined);
    mockOfflineStorage.getNotifications.mockResolvedValue({
      notifications: [],
      total: 0,
      unreadCount: 0,
    });
    mockOfflineStorage.storeNotifications.mockResolvedValue(undefined);
    mockOfflineStorage.updateNotification.mockResolvedValue(undefined);
    mockOfflineStorage.deleteNotification.mockResolvedValue(undefined);
    mockOfflineStorage.clearNotifications.mockResolvedValue(undefined);
    mockOfflineStorage.storeSettings.mockResolvedValue(undefined);
    
    mockOfflineManager.queueAction.mockReturnValue(undefined);
    mockOfflineManager.processQueue.mockResolvedValue(undefined);
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  it('provides notification context to children', async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('2');
      expect(screen.getByTestId('unread-count')).toHaveTextContent('1');
    });
  });

  it('fetches notifications on mount when autoFetch is enabled', async () => {
    render(
      <NotificationProvider autoFetch={true}>
        <TestComponent />
      </NotificationProvider>
    );

    await waitFor(() => {
      expect(mockNotificationService.getNotificationsWithRetry).toHaveBeenCalled();
    });
  });

  it('does not fetch notifications on mount when autoFetch is disabled', async () => {
    render(
      <NotificationProvider autoFetch={false}>
        <TestComponent />
      </NotificationProvider>
    );

    // Wait a bit to ensure no fetch happens
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(mockNotificationService.getNotificationsWithRetry).not.toHaveBeenCalled();
  });

  it('handles fetch notifications', async () => {
    const user = userEvent.setup();
    
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    const fetchButton = screen.getByTestId('fetch-notifications');
    await user.click(fetchButton);

    await waitFor(() => {
      expect(mockNotificationService.getNotificationsWithRetry).toHaveBeenCalled();
    });
  });

  it('handles mark as read', async () => {
    const user = userEvent.setup();
    
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('notification-1')).toBeInTheDocument();
    });

    const markAsReadButton = screen.getByTestId('mark-as-read');
    await user.click(markAsReadButton);

    await waitFor(() => {
      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('1');
    });

    // Check optimistic update
    expect(screen.getByTestId('read-status-1')).toHaveTextContent('read');
  });

  it('handles mark all as read', async () => {
    const user = userEvent.setup();
    
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('unread-count')).toHaveTextContent('1');
    });

    const markAllAsReadButton = screen.getByTestId('mark-all-as-read');
    await user.click(markAllAsReadButton);

    await waitFor(() => {
      expect(mockNotificationService.markAllAsRead).toHaveBeenCalled();
    });

    // Check optimistic update
    expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
  });

  it('handles delete notification', async () => {
    const user = userEvent.setup();
    
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('2');
    });

    const deleteButton = screen.getByTestId('delete-notification');
    await user.click(deleteButton);

    await waitFor(() => {
      expect(mockNotificationService.deleteNotification).toHaveBeenCalledWith('1');
    });

    // Check optimistic update
    expect(screen.getByTestId('notifications-count')).toHaveTextContent('1');
  });

  it('handles clear all notifications', async () => {
    const user = userEvent.setup();
    
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('2');
    });

    const clearAllButton = screen.getByTestId('clear-all');
    await user.click(clearAllButton);

    await waitFor(() => {
      expect(mockNotificationService.clearAll).toHaveBeenCalled();
    });

    // Check optimistic update
    expect(screen.getByTestId('notifications-count')).toHaveTextContent('0');
  });

  it('handles update settings', async () => {
    const user = userEvent.setup();
    
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('push-enabled')).toHaveTextContent('enabled');
    });

    const updateSettingsButton = screen.getByTestId('update-settings');
    await user.click(updateSettingsButton);

    await waitFor(() => {
      expect(mockNotificationService.updateSettingsWithRetry).toHaveBeenCalledWith({
        pushNotifications: false,
      });
    });
  });

  it('handles offline mode', async () => {
    const user = userEvent.setup();
    mockNetworkManager.isOnline.mockReturnValue(false);
    
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    const markAsReadButton = screen.getByTestId('mark-as-read');
    await user.click(markAsReadButton);

    // Should queue action for offline processing
    expect(mockOfflineManager.queueAction).toHaveBeenCalledWith('mark_read', { notificationId: '1' });
  });

  it('handles network status changes', async () => {
    let networkListener: (status: { isOnline: boolean }) => void = () => {};
    
    mockNetworkManager.addListener.mockImplementation((listener) => {
      networkListener = listener;
      return () => {};
    });

    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Simulate network coming back online
    act(() => {
      networkListener({ isOnline: true });
    });

    await waitFor(() => {
      expect(mockOfflineManager.processQueue).toHaveBeenCalled();
    });
  });

  it('handles errors gracefully', async () => {
    const user = userEvent.setup();
    mockNotificationService.getNotificationsWithRetry.mockRejectedValue(new Error('Network error'));
    
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    const fetchButton = screen.getByTestId('fetch-notifications');
    await user.click(fetchButton);

    await waitFor(() => {
      expect(screen.getByTestId('error')).toHaveTextContent('Network error');
    });
  });

  it('shows loading state during operations', async () => {
    const user = userEvent.setup();
    
    // Make the service call hang
    mockNotificationService.getNotificationsWithRetry.mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 1000))
    );
    
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    const fetchButton = screen.getByTestId('fetch-notifications');
    await user.click(fetchButton);

    expect(screen.getByTestId('loading')).toHaveTextContent('loading');
  });

  it('handles real-time connection', async () => {
    const user = userEvent.setup();
    
    render(
      <NotificationProvider enableRealTime={true}>
        <TestComponent />
      </NotificationProvider>
    );

    // Should connect automatically
    await waitFor(() => {
      expect(screen.getByTestId('connected')).toHaveTextContent('connected');
    });

    // Test manual disconnect
    const disconnectButton = screen.getByTestId('disconnect');
    await user.click(disconnectButton);

    expect(screen.getByTestId('connected')).toHaveTextContent('disconnected');

    // Test manual connect
    const connectButton = screen.getByTestId('connect');
    await user.click(connectButton);

    expect(screen.getByTestId('connected')).toHaveTextContent('connected');
  });

  it('caches notifications when caching is enabled', async () => {
    const mockLocalStorage = window.localStorage as jest.Mocked<Storage>;
    
    render(
      <NotificationProvider cacheEnabled={true}>
        <TestComponent />
      </NotificationProvider>
    );

    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
    });
  });

  it('loads from cache when available', async () => {
    const mockLocalStorage = window.localStorage as jest.Mocked<Storage>;
    const cachedData = JSON.stringify({
      data: mockNotifications,
      timestamp: Date.now(),
      ttl: 300000, // 5 minutes
    });
    
    mockLocalStorage.getItem.mockReturnValue(cachedData);
    
    render(
      <NotificationProvider cacheEnabled={true}>
        <TestComponent />
      </NotificationProvider>
    );

    // Should load from cache immediately
    expect(screen.getByTestId('notifications-count')).toHaveTextContent('2');
  });

  it('handles visibility change for efficient polling', async () => {
    render(
      <NotificationProvider enableRealTime={true}>
        <TestComponent />
      </NotificationProvider>
    );

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

    // Should refresh notifications when becoming visible
    await waitFor(() => {
      expect(mockNotificationService.getNotificationsWithRetry).toHaveBeenCalled();
    });
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useNotifications must be used within a NotificationProvider');
    
    consoleSpy.mockRestore();
  });

  it('handles bulk operations', async () => {
    const user = userEvent.setup();
    
    // Mock bulk operation service
    mockNotificationService.bulkOperation = jest.fn().mockResolvedValue({
      success: true,
      processedCount: 2,
      failedIds: [],
      errors: [],
    });
    
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('2');
    });

    // Test bulk mark as read through context
    const { bulkMarkAsRead } = useNotifications();
    
    act(() => {
      bulkMarkAsRead(['1', '2']);
    });

    await waitFor(() => {
      expect(mockNotificationService.bulkOperation).toHaveBeenCalledWith({
        notificationIds: ['1', '2'],
        operation: 'mark_read',
      });
    });
  });
});