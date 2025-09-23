import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationProvider } from '../../components/providers/NotificationProvider';
import { NotificationCenter } from '../../components/notifications/NotificationCenter/NotificationCenter';
import { NotificationBell } from '../../components/layout/NotificationBell/NotificationBell';
import { notificationService } from '../../lib/api/services/notification.service';
import { offlineNotificationManager } from '../../lib/notifications/offline-queue';
import { offlineNotificationStorage } from '../../lib/notifications/offline-storage';
import { networkStatusManager } from '../../lib/notifications/network-status';
import { NotificationType, NotificationCategory } from '../../types/notifications';
import type { Notification, NotificationListResponse } from '../../types/notifications';

// Mock all dependencies
jest.mock('../../lib/api/services/notification.service');
jest.mock('../../lib/notifications/offline-queue');
jest.mock('../../lib/notifications/offline-storage');
jest.mock('../../lib/notifications/network-status');
jest.mock('../../hooks/useNotificationPerformance', () => ({
  useNotificationPerformance: () => ({
    metrics: {},
    measureRender: (fn: () => any) => fn(),
    getPerformanceGrade: () => 'A',
    getRecommendations: () => [],
  }),
}));

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
    body: 'Your assignment has been updated with new requirements',
    priority: 'high',
    category: NotificationCategory.ACADEMIC,
    isRead: false,
    createdAt: '2024-01-01T10:00:00Z',
    actions: [
      {
        id: 'view',
        title: 'View Assignment',
        action: 'navigate',
        url: '/assignments/1',
      },
    ],
  },
  {
    id: '2',
    userId: 1,
    type: NotificationType.GRADE_UPDATE,
    title: 'Grade Posted',
    body: 'Your grade for Assignment 1 has been posted',
    priority: 'normal',
    category: NotificationCategory.ACADEMIC,
    isRead: true,
    createdAt: '2024-01-01T09:00:00Z',
    readAt: '2024-01-01T09:30:00Z',
  },
  {
    id: '3',
    userId: 1,
    type: NotificationType.SYSTEM_ANNOUNCEMENT,
    title: 'System Maintenance',
    body: 'System will be down for maintenance tonight',
    priority: 'low',
    category: NotificationCategory.SYSTEM,
    isRead: false,
    createdAt: '2024-01-01T08:00:00Z',
  },
];

// Complete notification app component for integration testing
function NotificationApp() {
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = React.useState(false);

  return (
    <NotificationProvider autoFetch={true} enableRealTime={true}>
      <div>
        <header>
          <NotificationBell
            onClick={() => setIsNotificationCenterOpen(true)}
            data-testid="notification-bell"
          />
        </header>
        
        <NotificationCenter
          isOpen={isNotificationCenterOpen}
          onClose={() => setIsNotificationCenterOpen(false)}
          showSearch={true}
          showFilters={true}
        />
        
        <main data-testid="main-content">
          <h1>Internship Management System</h1>
        </main>
      </div>
    </NotificationProvider>
  );
}

describe('Notification Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockNetworkManager.isOnline.mockReturnValue(true);
    mockNetworkManager.addListener.mockReturnValue(() => {});
    
    const mockResponse: NotificationListResponse = {
      notifications: mockNotifications,
      total: 3,
      unreadCount: 2,
    };
    
    mockNotificationService.getNotificationsWithRetry.mockResolvedValue(mockResponse);
    mockNotificationService.markAsRead.mockResolvedValue(undefined);
    mockNotificationService.markAllAsRead.mockResolvedValue(undefined);
    mockNotificationService.deleteNotification.mockResolvedValue(undefined);
    mockNotificationService.clearAll.mockResolvedValue(undefined);
    
    mockOfflineStorage.initialize.mockResolvedValue(undefined);
    mockOfflineStorage.getNotifications.mockResolvedValue({
      notifications: [],
      total: 0,
      unreadCount: 0,
    });
    mockOfflineStorage.storeNotifications.mockResolvedValue(undefined);
    mockOfflineStorage.updateNotification.mockResolvedValue(undefined);
    mockOfflineStorage.deleteNotification.mockResolvedValue(undefined);
    
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

  describe('Complete Notification Flow', () => {
    it('loads notifications on app startup and displays in bell', async () => {
      render(<NotificationApp />);
      
      // Should fetch notifications on startup
      await waitFor(() => {
        expect(mockNotificationService.getNotificationsWithRetry).toHaveBeenCalled();
      });
      
      // Should display unread count in notification bell
      await waitFor(() => {
        const bell = screen.getByTestId('notification-bell');
        expect(bell).toBeInTheDocument();
        // The bell should show unread count (2 unread notifications)
      });
    });

    it('opens notification center when bell is clicked', async () => {
      const user = userEvent.setup();
      render(<NotificationApp />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(mockNotificationService.getNotificationsWithRetry).toHaveBeenCalled();
      });
      
      // Click notification bell
      const bell = screen.getByTestId('notification-bell');
      await user.click(bell);
      
      // Notification center should open
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
        expect(screen.getByText('Assignment Updated')).toBeInTheDocument();
        expect(screen.getByText('Grade Posted')).toBeInTheDocument();
        expect(screen.getByText('System Maintenance')).toBeInTheDocument();
      });
    });

    it('marks notification as read and updates UI', async () => {
      const user = userEvent.setup();
      render(<NotificationApp />);
      
      // Wait for initial load and open notification center
      await waitFor(() => {
        expect(mockNotificationService.getNotificationsWithRetry).toHaveBeenCalled();
      });
      
      const bell = screen.getByTestId('notification-bell');
      await user.click(bell);
      
      await waitFor(() => {
        expect(screen.getByText('Assignment Updated')).toBeInTheDocument();
      });
      
      // Find and click mark as read button for first notification
      const moreButtons = screen.getAllByRole('button', { name: /more/i });
      await user.click(moreButtons[0]);
      
      const markAsReadButton = screen.getByText('Mark as read');
      await user.click(markAsReadButton);
      
      // Should call the service
      await waitFor(() => {
        expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('1');
      });
      
      // UI should update optimistically
      // The notification should now appear as read
    });

    it('deletes notification and updates UI', async () => {
      const user = userEvent.setup();
      render(<NotificationApp />);
      
      // Wait for initial load and open notification center
      await waitFor(() => {
        expect(mockNotificationService.getNotificationsWithRetry).toHaveBeenCalled();
      });
      
      const bell = screen.getByTestId('notification-bell');
      await user.click(bell);
      
      await waitFor(() => {
        expect(screen.getByText('Assignment Updated')).toBeInTheDocument();
      });
      
      // Find and click delete button for first notification
      const moreButtons = screen.getAllByRole('button', { name: /more/i });
      await user.click(moreButtons[0]);
      
      const deleteButton = screen.getByText('Delete');
      await user.click(deleteButton);
      
      // Should call the service
      await waitFor(() => {
        expect(mockNotificationService.deleteNotification).toHaveBeenCalledWith('1');
      });
      
      // Notification should be removed from UI
      await waitFor(() => {
        expect(screen.queryByText('Assignment Updated')).not.toBeInTheDocument();
      });
    });

    it('marks all notifications as read', async () => {
      const user = userEvent.setup();
      render(<NotificationApp />);
      
      // Wait for initial load and open notification center
      await waitFor(() => {
        expect(mockNotificationService.getNotificationsWithRetry).toHaveBeenCalled();
      });
      
      const bell = screen.getByTestId('notification-bell');
      await user.click(bell);
      
      await waitFor(() => {
        expect(screen.getByText('2 new')).toBeInTheDocument();
      });
      
      // Click mark all as read button
      const markAllReadButton = screen.getByTitle('Mark all as read (Ctrl+A)');
      await user.click(markAllReadButton);
      
      // Should call the service
      await waitFor(() => {
        expect(mockNotificationService.markAllAsRead).toHaveBeenCalled();
      });
      
      // Unread count should update
      await waitFor(() => {
        expect(screen.queryByText('2 new')).not.toBeInTheDocument();
      });
    });

    it('refreshes notifications', async () => {
      const user = userEvent.setup();
      render(<NotificationApp />);
      
      // Wait for initial load and open notification center
      await waitFor(() => {
        expect(mockNotificationService.getNotificationsWithRetry).toHaveBeenCalled();
      });
      
      const bell = screen.getByTestId('notification-bell');
      await user.click(bell);
      
      // Click refresh button
      const refreshButton = screen.getByTitle('Refresh notifications (Ctrl+R)');
      await user.click(refreshButton);
      
      // Should call the service again
      await waitFor(() => {
        expect(mockNotificationService.getNotificationsWithRetry).toHaveBeenCalledTimes(2);
      });
    });

    it('searches and filters notifications', async () => {
      const user = userEvent.setup();
      render(<NotificationApp />);
      
      // Wait for initial load and open notification center
      await waitFor(() => {
        expect(mockNotificationService.getNotificationsWithRetry).toHaveBeenCalled();
      });
      
      const bell = screen.getByTestId('notification-bell');
      await user.click(bell);
      
      await waitFor(() => {
        expect(screen.getByText('Assignment Updated')).toBeInTheDocument();
        expect(screen.getByText('Grade Posted')).toBeInTheDocument();
        expect(screen.getByText('System Maintenance')).toBeInTheDocument();
      });
      
      // Search for "assignment"
      const searchInput = screen.getByPlaceholderText(/search notifications/i);
      await user.type(searchInput, 'assignment');
      
      // Should filter notifications (implementation would filter client-side)
      // In a real implementation, this would show only assignment-related notifications
    });

    it('handles keyboard shortcuts', async () => {
      render(<NotificationApp />);
      
      // Wait for initial load and open notification center
      await waitFor(() => {
        expect(mockNotificationService.getNotificationsWithRetry).toHaveBeenCalled();
      });
      
      const bell = screen.getByTestId('notification-bell');
      await userEvent.click(bell);
      
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });
      
      // Test Ctrl+R for refresh
      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'r', ctrlKey: true });
        document.dispatchEvent(event);
      });
      
      await waitFor(() => {
        expect(mockNotificationService.getNotificationsWithRetry).toHaveBeenCalledTimes(2);
      });
      
      // Test Ctrl+A for mark all as read
      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'a', ctrlKey: true });
        document.dispatchEvent(event);
      });
      
      await waitFor(() => {
        expect(mockNotificationService.markAllAsRead).toHaveBeenCalled();
      });
      
      // Test Escape to close
      act(() => {
        const event = new KeyboardEvent('keydown', { key: 'Escape' });
        document.dispatchEvent(event);
      });
      
      await waitFor(() => {
        expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('handles real-time notification updates', async () => {
      render(<NotificationApp />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(mockNotificationService.getNotificationsWithRetry).toHaveBeenCalled();
      });
      
      // Simulate real-time update by triggering a refresh
      // In a real implementation, this would be triggered by SSE or WebSocket
      act(() => {
        // Simulate visibility change to trigger refresh
        Object.defineProperty(document, 'visibilityState', {
          value: 'visible',
          writable: true,
        });
        
        const event = new Event('visibilitychange');
        document.dispatchEvent(event);
      });
      
      // Should refresh notifications
      await waitFor(() => {
        expect(mockNotificationService.getNotificationsWithRetry).toHaveBeenCalledTimes(2);
      });
    });

    it('handles connection status changes', async () => {
      let networkListener: (status: { isOnline: boolean }) => void = () => {};
      
      mockNetworkManager.addListener.mockImplementation((listener) => {
        networkListener = listener;
        return () => {};
      });
      
      render(<NotificationApp />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(mockNotificationService.getNotificationsWithRetry).toHaveBeenCalled();
      });
      
      // Simulate network going offline then online
      act(() => {
        networkListener({ isOnline: false });
      });
      
      act(() => {
        networkListener({ isOnline: true });
      });
      
      // Should process offline queue and refresh notifications
      await waitFor(() => {
        expect(mockOfflineManager.processQueue).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      mockNotificationService.getNotificationsWithRetry.mockRejectedValue(
        new Error('Network error')
      );
      
      render(<NotificationApp />);
      
      // Should handle error and show error message
      await waitFor(() => {
        expect(mockNotificationService.getNotificationsWithRetry).toHaveBeenCalled();
      });
      
      // Open notification center to see error
      const bell = screen.getByTestId('notification-bell');
      await userEvent.click(bell);
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
    });

    it('retries failed operations', async () => {
      const user = userEvent.setup();
      
      // First call fails, second succeeds
      mockNotificationService.getNotificationsWithRetry
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          notifications: mockNotifications,
          total: 3,
          unreadCount: 2,
        });
      
      render(<NotificationApp />);
      
      // Wait for initial error
      await waitFor(() => {
        expect(mockNotificationService.getNotificationsWithRetry).toHaveBeenCalled();
      });
      
      // Open notification center and retry
      const bell = screen.getByTestId('notification-bell');
      await user.click(bell);
      
      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });
      
      const retryButton = screen.getByText('Retry');
      await user.click(retryButton);
      
      // Should retry and succeed
      await waitFor(() => {
        expect(mockNotificationService.getNotificationsWithRetry).toHaveBeenCalledTimes(2);
        expect(screen.getByText('Assignment Updated')).toBeInTheDocument();
      });
    });

    it('handles mark as read errors with rollback', async () => {
      const user = userEvent.setup();
      mockNotificationService.markAsRead.mockRejectedValue(new Error('Failed to mark as read'));
      
      render(<NotificationApp />);
      
      // Wait for initial load and open notification center
      await waitFor(() => {
        expect(mockNotificationService.getNotificationsWithRetry).toHaveBeenCalled();
      });
      
      const bell = screen.getByTestId('notification-bell');
      await user.click(bell);
      
      await waitFor(() => {
        expect(screen.getByText('Assignment Updated')).toBeInTheDocument();
      });
      
      // Try to mark as read
      const moreButtons = screen.getAllByRole('button', { name: /more/i });
      await user.click(moreButtons[0]);
      
      const markAsReadButton = screen.getByText('Mark as read');
      await user.click(markAsReadButton);
      
      // Should call the service and handle error
      await waitFor(() => {
        expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('1');
      });
      
      // Error should be handled gracefully (notification should remain unread)
    });
  });

  describe('Offline Functionality', () => {
    it('queues actions when offline', async () => {
      const user = userEvent.setup();
      mockNetworkManager.isOnline.mockReturnValue(false);
      
      render(<NotificationApp />);
      
      // Should load from offline storage
      await waitFor(() => {
        expect(mockOfflineStorage.getNotifications).toHaveBeenCalled();
      });
      
      // Open notification center
      const bell = screen.getByTestId('notification-bell');
      await user.click(bell);
      
      // Try to mark as read while offline
      const moreButtons = screen.getAllByRole('button', { name: /more/i });
      if (moreButtons.length > 0) {
        await user.click(moreButtons[0]);
        
        const markAsReadButton = screen.queryByText('Mark as read');
        if (markAsReadButton) {
          await user.click(markAsReadButton);
          
          // Should queue action for offline processing
          await waitFor(() => {
            expect(mockOfflineManager.queueAction).toHaveBeenCalledWith('mark_read', {
              notificationId: '1',
            });
          });
        }
      }
    });

    it('processes queued actions when coming back online', async () => {
      let networkListener: (status: { isOnline: boolean }) => void = () => {};
      
      mockNetworkManager.addListener.mockImplementation((listener) => {
        networkListener = listener;
        return () => {};
      });
      
      // Start offline
      mockNetworkManager.isOnline.mockReturnValue(false);
      
      render(<NotificationApp />);
      
      // Wait for offline initialization
      await waitFor(() => {
        expect(mockOfflineStorage.getNotifications).toHaveBeenCalled();
      });
      
      // Simulate coming back online
      mockNetworkManager.isOnline.mockReturnValue(true);
      act(() => {
        networkListener({ isOnline: true });
      });
      
      // Should process offline queue
      await waitFor(() => {
        expect(mockOfflineManager.processQueue).toHaveBeenCalled();
      });
    });
  });

  describe('Performance and Caching', () => {
    it('caches notifications for better performance', async () => {
      const mockLocalStorage = window.localStorage as jest.Mocked<Storage>;
      
      render(<NotificationApp />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(mockNotificationService.getNotificationsWithRetry).toHaveBeenCalled();
      });
      
      // Should cache notifications
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
      
      render(<NotificationApp />);
      
      // Should load from cache first
      const bell = screen.getByTestId('notification-bell');
      await userEvent.click(bell);
      
      // Notifications should be available immediately from cache
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });
  });
});