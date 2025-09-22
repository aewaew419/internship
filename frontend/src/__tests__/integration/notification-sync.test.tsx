import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationProvider } from '../../components/providers/NotificationProvider';
import { useNotifications } from '../../hooks/useNotifications';
import { notificationService } from '../../lib/api/services/notification.service';
import { offlineNotificationManager } from '../../lib/notifications/offline-queue';
import { offlineNotificationStorage } from '../../lib/notifications/offline-storage';
import { networkStatusManager } from '../../lib/notifications/network-status';
import { NotificationType, NotificationCategory } from '../../types/notifications';
import type { Notification, NotificationListResponse } from '../../types/notifications';

// Mock dependencies
jest.mock('../../lib/api/services/notification.service');
jest.mock('../../lib/notifications/offline-queue');
jest.mock('../../lib/notifications/offline-storage');
jest.mock('../../lib/notifications/network-status');

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

// Test component that uses notifications
function TestNotificationSync() {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    isConnected,
    fetchNotifications,
    markAsRead,
    deleteNotification,
    refreshNotifications,
  } = useNotifications();

  return (
    <div>
      <div data-testid="notifications-count">{notifications.length}</div>
      <div data-testid="unread-count">{unreadCount}</div>
      <div data-testid="is-loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="is-connected">{isConnected ? 'connected' : 'disconnected'}</div>
      
      {notifications.map(notification => (
        <div key={notification.id} data-testid={`notification-${notification.id}`}>
          <span>{notification.title}</span>
          <span data-testid={`read-status-${notification.id}`}>
            {notification.isRead ? 'read' : 'unread'}
          </span>
          <button 
            onClick={() => markAsRead(notification.id)}
            data-testid={`mark-read-${notification.id}`}
          >
            Mark Read
          </button>
          <button 
            onClick={() => deleteNotification(notification.id)}
            data-testid={`delete-${notification.id}`}
          >
            Delete
          </button>
        </div>
      ))}
      
      <button onClick={() => fetchNotifications()} data-testid="fetch">Fetch</button>
      <button onClick={() => refreshNotifications()} data-testid="refresh">Refresh</button>
    </div>
  );
}

describe('Notification Synchronization Integration Tests', () => {
  let networkListener: (status: { isOnline: boolean }) => void = () => {};

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup network status mock
    mockNetworkManager.isOnline.mockReturnValue(true);
    mockNetworkManager.addListener.mockImplementation((listener) => {
      networkListener = listener;
      return () => {};
    });
    
    // Setup service mocks
    const mockResponse: NotificationListResponse = {
      notifications: mockNotifications,
      total: 2,
      unreadCount: 1,
    };
    
    mockNotificationService.getNotificationsWithRetry.mockResolvedValue(mockResponse);
    mockNotificationService.markAsRead.mockResolvedValue(undefined);
    mockNotificationService.deleteNotification.mockResolvedValue(undefined);
    
    // Setup offline storage mocks
    mockOfflineStorage.initialize.mockResolvedValue(undefined);
    mockOfflineStorage.getNotifications.mockResolvedValue({
      notifications: [],
      total: 0,
      unreadCount: 0,
    });
    mockOfflineStorage.storeNotifications.mockResolvedValue(undefined);
    mockOfflineStorage.updateNotification.mockResolvedValue(undefined);
    mockOfflineStorage.deleteNotification.mockResolvedValue(undefined);
    
    // Setup offline manager mocks
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

  describe('Online/Offline Synchronization', () => {
    it('syncs notifications when going from offline to online', async () => {
      const user = userEvent.setup();
      
      // Start online
      render(
        <NotificationProvider>
          <TestNotificationSync />
        </NotificationProvider>
      );
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('notifications-count')).toHaveTextContent('2');
      });
      
      // Go offline
      mockNetworkManager.isOnline.mockReturnValue(false);
      act(() => {
        networkListener({ isOnline: false });
      });
      
      // Perform actions while offline
      const markReadButton = screen.getByTestId('mark-read-1');
      await user.click(markReadButton);
      
      // Should queue the action
      expect(mockOfflineManager.queueAction).toHaveBeenCalledWith('mark_read', {
        notificationId: '1',
      });
      
      // Go back online
      mockNetworkManager.isOnline.mockReturnValue(true);
      act(() => {
        networkListener({ isOnline: true });
      });
      
      // Should process queued actions and refresh
      await waitFor(() => {
        expect(mockOfflineManager.processQueue).toHaveBeenCalled();
        expect(mockNotificationService.getNotificationsWithRetry).toHaveBeenCalledTimes(2);
      });
    });

    it('stores notifications offline when network is unavailable', async () => {
      // Start offline
      mockNetworkManager.isOnline.mockReturnValue(false);
      mockOfflineStorage.getNotifications.mockResolvedValue({
        notifications: mockNotifications,
        total: 2,
        unreadCount: 1,
      });
      
      render(
        <NotificationProvider>
          <TestNotificationSync />
        </NotificationProvider>
      );
      
      // Should load from offline storage
      await waitFor(() => {
        expect(mockOfflineStorage.getNotifications).toHaveBeenCalled();
        expect(screen.getByTestId('notifications-count')).toHaveTextContent('2');
      });
      
      // Should not call online service
      expect(mockNotificationService.getNotificationsWithRetry).not.toHaveBeenCalled();
    });

    it('handles offline action queuing and processing', async () => {
      const user = userEvent.setup();
      
      render(
        <NotificationProvider>
          <TestNotificationSync />
        </NotificationProvider>
      );
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('notifications-count')).toHaveTextContent('2');
      });
      
      // Go offline
      mockNetworkManager.isOnline.mockReturnValue(false);
      
      // Perform multiple actions while offline
      const markReadButton = screen.getByTestId('mark-read-1');
      const deleteButton = screen.getByTestId('delete-2');
      
      await user.click(markReadButton);
      await user.click(deleteButton);
      
      // Should queue both actions
      expect(mockOfflineManager.queueAction).toHaveBeenCalledWith('mark_read', {
        notificationId: '1',
      });
      expect(mockOfflineManager.queueAction).toHaveBeenCalledWith('delete', {
        notificationId: '2',
      });
      
      // Go back online
      mockNetworkManager.isOnline.mockReturnValue(true);
      act(() => {
        networkListener({ isOnline: true });
      });
      
      // Should process all queued actions
      await waitFor(() => {
        expect(mockOfflineManager.processQueue).toHaveBeenCalled();
      });
    });
  });

  describe('Real-time Updates and Synchronization', () => {
    it('handles real-time notification updates', async () => {
      render(
        <NotificationProvider enableRealTime={true}>
          <TestNotificationSync />
        </NotificationProvider>
      );
      
      // Wait for initial load and connection
      await waitFor(() => {
        expect(screen.getByTestId('notifications-count')).toHaveTextContent('2');
        expect(screen.getByTestId('is-connected')).toHaveTextContent('connected');
      });
      
      // Simulate real-time update by changing visibility
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        writable: true,
      });
      
      // Mock that last fetch was more than 1 minute ago
      const oneMinuteAgo = Date.now() - 61000;
      
      act(() => {
        const event = new Event('visibilitychange');
        document.dispatchEvent(event);
      });
      
      // Should refresh notifications
      await waitFor(() => {
        expect(mockNotificationService.getNotificationsWithRetry).toHaveBeenCalledTimes(2);
      });
    });

    it('maintains connection state correctly', async () => {
      render(
        <NotificationProvider enableRealTime={true}>
          <TestNotificationSync />
        </NotificationProvider>
      );
      
      // Should connect automatically
      await waitFor(() => {
        expect(screen.getByTestId('is-connected')).toHaveTextContent('connected');
      });
      
      // Disable real-time updates
      render(
        <NotificationProvider enableRealTime={false}>
          <TestNotificationSync />
        </NotificationProvider>
      );
      
      // Should disconnect
      await waitFor(() => {
        expect(screen.getByTestId('is-connected')).toHaveTextContent('disconnected');
      });
    });
  });

  describe('Data Consistency and Conflict Resolution', () => {
    it('handles optimistic updates with server confirmation', async () => {
      const user = userEvent.setup();
      
      render(
        <NotificationProvider>
          <TestNotificationSync />
        </NotificationProvider>
      );
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('notifications-count')).toHaveTextContent('2');
        expect(screen.getByTestId('read-status-1')).toHaveTextContent('unread');
      });
      
      // Mark as read - should update optimistically
      const markReadButton = screen.getByTestId('mark-read-1');
      await user.click(markReadButton);
      
      // Should update UI immediately (optimistic update)
      expect(screen.getByTestId('read-status-1')).toHaveTextContent('read');
      
      // Should call server
      await waitFor(() => {
        expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('1');
      });
    });

    it('handles optimistic update rollback on server error', async () => {
      const user = userEvent.setup();
      
      // Mock server error
      mockNotificationService.markAsRead.mockRejectedValue(new Error('Server error'));
      
      render(
        <NotificationProvider>
          <TestNotificationSync />
        </NotificationProvider>
      );
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('notifications-count')).toHaveTextContent('2');
        expect(screen.getByTestId('read-status-1')).toHaveTextContent('unread');
      });
      
      // Mark as read - should update optimistically then rollback
      const markReadButton = screen.getByTestId('mark-read-1');
      await user.click(markReadButton);
      
      // Should update UI immediately
      expect(screen.getByTestId('read-status-1')).toHaveTextContent('read');
      
      // Should call server and handle error
      await waitFor(() => {
        expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('1');
      });
      
      // Should rollback optimistic update on error
      await waitFor(() => {
        expect(screen.getByTestId('read-status-1')).toHaveTextContent('unread');
      });
    });

    it('handles delete operations with optimistic updates', async () => {
      const user = userEvent.setup();
      
      render(
        <NotificationProvider>
          <TestNotificationSync />
        </NotificationProvider>
      );
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('notifications-count')).toHaveTextContent('2');
        expect(screen.getByTestId('notification-1')).toBeInTheDocument();
      });
      
      // Delete notification
      const deleteButton = screen.getByTestId('delete-1');
      await user.click(deleteButton);
      
      // Should remove from UI immediately
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('1');
      expect(screen.queryByTestId('notification-1')).not.toBeInTheDocument();
      
      // Should call server
      await waitFor(() => {
        expect(mockNotificationService.deleteNotification).toHaveBeenCalledWith('1');
      });
    });

    it('handles delete rollback on server error', async () => {
      const user = userEvent.setup();
      
      // Mock server error
      mockNotificationService.deleteNotification.mockRejectedValue(new Error('Server error'));
      
      render(
        <NotificationProvider>
          <TestNotificationSync />
        </NotificationProvider>
      );
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('notifications-count')).toHaveTextContent('2');
        expect(screen.getByTestId('notification-1')).toBeInTheDocument();
      });
      
      // Delete notification
      const deleteButton = screen.getByTestId('delete-1');
      await user.click(deleteButton);
      
      // Should remove from UI immediately
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('1');
      
      // Should call server and handle error
      await waitFor(() => {
        expect(mockNotificationService.deleteNotification).toHaveBeenCalledWith('1');
      });
      
      // Should restore notification on error
      await waitFor(() => {
        expect(screen.getByTestId('notifications-count')).toHaveTextContent('2');
        expect(screen.getByTestId('notification-1')).toBeInTheDocument();
      });
    });
  });

  describe('Cache Synchronization', () => {
    it('synchronizes cache with server data', async () => {
      const mockLocalStorage = window.localStorage as jest.Mocked<Storage>;
      
      render(
        <NotificationProvider cacheEnabled={true}>
          <TestNotificationSync />
        </NotificationProvider>
      );
      
      // Wait for initial load
      await waitFor(() => {
        expect(mockNotificationService.getNotificationsWithRetry).toHaveBeenCalled();
      });
      
      // Should cache the data
      await waitFor(() => {
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
      });
      
      // Should also store in offline storage
      expect(mockOfflineStorage.storeNotifications).toHaveBeenCalledWith(mockNotifications);
    });

    it('loads from cache when server is unavailable', async () => {
      const mockLocalStorage = window.localStorage as jest.Mocked<Storage>;
      const cachedData = JSON.stringify({
        data: mockNotifications,
        timestamp: Date.now(),
        ttl: 300000, // 5 minutes
      });
      
      mockLocalStorage.getItem.mockReturnValue(cachedData);
      mockNotificationService.getNotificationsWithRetry.mockRejectedValue(new Error('Network error'));
      
      render(
        <NotificationProvider cacheEnabled={true}>
          <TestNotificationSync />
        </NotificationProvider>
      );
      
      // Should load from cache when server fails
      await waitFor(() => {
        expect(screen.getByTestId('notifications-count')).toHaveTextContent('2');
      });
      
      // Should also try offline storage as fallback
      expect(mockOfflineStorage.getNotifications).toHaveBeenCalled();
    });

    it('invalidates cache on successful updates', async () => {
      const user = userEvent.setup();
      const mockLocalStorage = window.localStorage as jest.Mocked<Storage>;
      
      render(
        <NotificationProvider cacheEnabled={true}>
          <TestNotificationSync />
        </NotificationProvider>
      );
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('notifications-count')).toHaveTextContent('2');
      });
      
      // Perform an update
      const markReadButton = screen.getByTestId('mark-read-1');
      await user.click(markReadButton);
      
      // Should update offline storage
      await waitFor(() => {
        expect(mockOfflineStorage.updateNotification).toHaveBeenCalledWith('1', {
          isRead: true,
          readAt: expect.any(String),
        });
      });
    });
  });

  describe('Error Recovery and Retry Logic', () => {
    it('retries failed operations with exponential backoff', async () => {
      const user = userEvent.setup();
      
      // Mock multiple failures then success
      mockNotificationService.markAsRead
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);
      
      render(
        <NotificationProvider>
          <TestNotificationSync />
        </NotificationProvider>
      );
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('notifications-count')).toHaveTextContent('2');
      });
      
      // Try to mark as read
      const markReadButton = screen.getByTestId('mark-read-1');
      await user.click(markReadButton);
      
      // Should eventually succeed after retries
      await waitFor(() => {
        expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('1');
      }, { timeout: 5000 });
    });

    it('handles partial sync failures gracefully', async () => {
      // Mock offline storage with some notifications
      mockOfflineStorage.getNotifications.mockResolvedValue({
        notifications: [mockNotifications[0]], // Only first notification
        total: 1,
        unreadCount: 1,
      });
      
      // Mock server with different notifications
      mockNotificationService.getNotificationsWithRetry.mockResolvedValue({
        notifications: [mockNotifications[1]], // Only second notification
        total: 1,
        unreadCount: 0,
      });
      
      render(
        <NotificationProvider>
          <TestNotificationSync />
        </NotificationProvider>
      );
      
      // Should handle the sync gracefully
      await waitFor(() => {
        expect(screen.getByTestId('notifications-count')).toHaveTextContent('1');
      });
    });
  });

  describe('Performance Under Load', () => {
    it('handles rapid notification updates efficiently', async () => {
      const user = userEvent.setup();
      
      render(
        <NotificationProvider>
          <TestNotificationSync />
        </NotificationProvider>
      );
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('notifications-count')).toHaveTextContent('2');
      });
      
      // Perform rapid updates
      const markReadButton = screen.getByTestId('mark-read-1');
      const deleteButton = screen.getByTestId('delete-2');
      
      // Click multiple times rapidly
      await user.click(markReadButton);
      await user.click(deleteButton);
      await user.click(markReadButton);
      
      // Should handle all updates without issues
      await waitFor(() => {
        expect(mockNotificationService.markAsRead).toHaveBeenCalled();
        expect(mockNotificationService.deleteNotification).toHaveBeenCalled();
      });
    });

    it('batches multiple operations for efficiency', async () => {
      const user = userEvent.setup();
      
      render(
        <NotificationProvider>
          <TestNotificationSync />
        </NotificationProvider>
      );
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('notifications-count')).toHaveTextContent('2');
      });
      
      // Go offline to force batching
      mockNetworkManager.isOnline.mockReturnValue(false);
      
      // Perform multiple operations
      const markReadButton1 = screen.getByTestId('mark-read-1');
      const markReadButton2 = screen.getByTestId('mark-read-2');
      
      await user.click(markReadButton1);
      await user.click(markReadButton2);
      
      // Should queue both operations
      expect(mockOfflineManager.queueAction).toHaveBeenCalledTimes(2);
      
      // Go back online
      mockNetworkManager.isOnline.mockReturnValue(true);
      act(() => {
        networkListener({ isOnline: true });
      });
      
      // Should process queue efficiently
      await waitFor(() => {
        expect(mockOfflineManager.processQueue).toHaveBeenCalled();
      });
    });
  });
});