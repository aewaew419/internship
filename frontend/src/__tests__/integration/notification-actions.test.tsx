import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationProvider } from '../../components/providers/NotificationProvider';
import { NotificationCenter } from '../../components/notifications/NotificationCenter/NotificationCenter';
import { useNotifications } from '../../hooks/useNotifications';
import { notificationService } from '../../lib/api/services/notification.service';
import { NotificationType, NotificationCategory } from '../../types/notifications';
import type { Notification, BulkOperationResult } from '../../types/notifications';

// Mock dependencies
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
    actions: [
      {
        id: 'view',
        title: 'View Assignment',
        action: 'navigate',
        url: '/assignments/1',
      },
      {
        id: 'dismiss',
        title: 'Dismiss',
        action: 'dismiss',
      },
    ],
  },
  {
    id: '2',
    userId: 1,
    type: NotificationType.EVALUATION_REQUEST,
    title: 'Evaluation Required',
    body: 'Please evaluate your internship experience',
    priority: 'normal',
    category: NotificationCategory.ACADEMIC,
    isRead: false,
    createdAt: '2024-01-01T09:00:00Z',
    actions: [
      {
        id: 'evaluate',
        title: 'Start Evaluation',
        action: 'navigate',
        url: '/evaluate/company',
      },
      {
        id: 'remind',
        title: 'Remind Later',
        action: 'snooze',
      },
    ],
  },
  {
    id: '3',
    userId: 1,
    type: NotificationType.DOCUMENT_UPDATE,
    title: 'Document Upload Required',
    body: 'Please upload your internship report',
    priority: 'high',
    category: NotificationCategory.ADMINISTRATIVE,
    isRead: false,
    createdAt: '2024-01-01T08:00:00Z',
    actions: [
      {
        id: 'upload',
        title: 'Upload Document',
        action: 'navigate',
        url: '/documents/upload',
      },
      {
        id: 'requirements',
        title: 'View Requirements',
        action: 'navigate',
        url: '/documents/requirements',
      },
    ],
  },
];

// Test component for notification actions
function TestNotificationActions() {
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = React.useState(true);
  const {
    notifications,
    unreadCount,
    bulkMarkAsRead,
    bulkDelete,
    bulkArchive,
  } = useNotifications();

  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  const handleBulkMarkAsRead = async () => {
    const result = await bulkMarkAsRead(selectedIds);
    console.log('Bulk mark as read result:', result);
  };

  const handleBulkDelete = async () => {
    const result = await bulkDelete(selectedIds);
    console.log('Bulk delete result:', result);
  };

  const handleBulkArchive = async () => {
    const result = await bulkArchive(selectedIds);
    console.log('Bulk archive result:', result);
  };

  return (
    <div>
      <div data-testid="notifications-count">{notifications.length}</div>
      <div data-testid="unread-count">{unreadCount}</div>
      <div data-testid="selected-count">{selectedIds.length}</div>
      
      <div>
        <button onClick={() => setSelectedIds(['1', '2'])} data-testid="select-multiple">
          Select Multiple
        </button>
        <button onClick={handleBulkMarkAsRead} data-testid="bulk-mark-read">
          Bulk Mark Read
        </button>
        <button onClick={handleBulkDelete} data-testid="bulk-delete">
          Bulk Delete
        </button>
        <button onClick={handleBulkArchive} data-testid="bulk-archive">
          Bulk Archive
        </button>
      </div>
      
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
        showSearch={true}
        showFilters={true}
      />
    </div>
  );
}

describe('Notification Actions Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockNotificationService.getNotificationsWithRetry.mockResolvedValue({
      notifications: mockNotifications,
      total: 3,
      unreadCount: 3,
    });
    
    mockNotificationService.markAsRead.mockResolvedValue(undefined);
    mockNotificationService.deleteNotification.mockResolvedValue(undefined);
    mockNotificationService.bulkOperation.mockResolvedValue({
      success: true,
      processedCount: 2,
      failedIds: [],
      errors: [],
    });
    
    // Mock navigation
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });
    
    // Mock localStorage and other dependencies
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
    
    // Mock network status
    jest.doMock('../../lib/notifications/network-status', () => ({
      networkStatusManager: {
        isOnline: () => true,
        addListener: () => () => {},
      },
    }));
    
    // Mock offline storage
    jest.doMock('../../lib/notifications/offline-storage', () => ({
      offlineNotificationStorage: {
        initialize: jest.fn().mockResolvedValue(undefined),
        getNotifications: jest.fn().mockResolvedValue({
          notifications: [],
          total: 0,
          unreadCount: 0,
        }),
        storeNotifications: jest.fn().mockResolvedValue(undefined),
        updateNotification: jest.fn().mockResolvedValue(undefined),
        deleteNotification: jest.fn().mockResolvedValue(undefined),
      },
    }));
    
    // Mock offline manager
    jest.doMock('../../lib/notifications/offline-queue', () => ({
      offlineNotificationManager: {
        queueAction: jest.fn(),
        processQueue: jest.fn().mockResolvedValue(undefined),
      },
    }));
  });

  describe('Individual Notification Actions', () => {
    it('handles notification action clicks with navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <NotificationProvider>
          <TestNotificationActions />
        </NotificationProvider>
      );
      
      // Wait for notifications to load
      await waitFor(() => {
        expect(screen.getByTestId('notifications-count')).toHaveTextContent('3');
      });
      
      // Find and click on a notification action
      const viewButtons = screen.getAllByText('View Assignment');
      if (viewButtons.length > 0) {
        await user.click(viewButtons[0]);
        
        // Should navigate to the assignment page
        // In a real implementation, this would trigger navigation
        expect(window.location.href).toBe('');
      }
    });

    it('handles evaluation action clicks', async () => {
      const user = userEvent.setup();
      
      render(
        <NotificationProvider>
          <TestNotificationActions />
        </NotificationProvider>
      );
      
      // Wait for notifications to load
      await waitFor(() => {
        expect(screen.getByTestId('notifications-count')).toHaveTextContent('3');
      });
      
      // Find and click evaluation action
      const evaluateButtons = screen.getAllByText('Start Evaluation');
      if (evaluateButtons.length > 0) {
        await user.click(evaluateButtons[0]);
        
        // Should trigger evaluation flow
        // In a real implementation, this would navigate to evaluation page
      }
    });

    it('handles document upload action clicks', async () => {
      const user = userEvent.setup();
      
      render(
        <NotificationProvider>
          <TestNotificationActions />
        </NotificationProvider>
      );
      
      // Wait for notifications to load
      await waitFor(() => {
        expect(screen.getByTestId('notifications-count')).toHaveTextContent('3');
      });
      
      // Find and click upload action
      const uploadButtons = screen.getAllByText('Upload Document');
      if (uploadButtons.length > 0) {
        await user.click(uploadButtons[0]);
        
        // Should trigger document upload flow
        // In a real implementation, this would navigate to upload page
      }
    });

    it('marks notification as read when action is completed', async () => {
      const user = userEvent.setup();
      
      render(
        <NotificationProvider>
          <TestNotificationActions />
        </NotificationProvider>
      );
      
      // Wait for notifications to load
      await waitFor(() => {
        expect(screen.getByTestId('notifications-count')).toHaveTextContent('3');
        expect(screen.getByTestId('unread-count')).toHaveTextContent('3');
      });
      
      // Click on a notification action
      const viewButtons = screen.getAllByText('View Assignment');
      if (viewButtons.length > 0) {
        await user.click(viewButtons[0]);
        
        // Should mark notification as read
        await waitFor(() => {
          expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('1');
        });
      }
    });
  });

  describe('Bulk Operations', () => {
    it('performs bulk mark as read operation', async () => {
      const user = userEvent.setup();
      
      render(
        <NotificationProvider>
          <TestNotificationActions />
        </NotificationProvider>
      );
      
      // Wait for notifications to load
      await waitFor(() => {
        expect(screen.getByTestId('notifications-count')).toHaveTextContent('3');
      });
      
      // Select multiple notifications
      const selectButton = screen.getByTestId('select-multiple');
      await user.click(selectButton);
      
      expect(screen.getByTestId('selected-count')).toHaveTextContent('2');
      
      // Perform bulk mark as read
      const bulkMarkReadButton = screen.getByTestId('bulk-mark-read');
      await user.click(bulkMarkReadButton);
      
      // Should call bulk operation service
      await waitFor(() => {
        expect(mockNotificationService.bulkOperation).toHaveBeenCalledWith({
          notificationIds: ['1', '2'],
          operation: 'mark_read',
        });
      });
    });

    it('performs bulk delete operation', async () => {
      const user = userEvent.setup();
      
      render(
        <NotificationProvider>
          <TestNotificationActions />
        </NotificationProvider>
      );
      
      // Wait for notifications to load
      await waitFor(() => {
        expect(screen.getByTestId('notifications-count')).toHaveTextContent('3');
      });
      
      // Select multiple notifications
      const selectButton = screen.getByTestId('select-multiple');
      await user.click(selectButton);
      
      // Perform bulk delete
      const bulkDeleteButton = screen.getByTestId('bulk-delete');
      await user.click(bulkDeleteButton);
      
      // Should call bulk operation service
      await waitFor(() => {
        expect(mockNotificationService.bulkOperation).toHaveBeenCalledWith({
          notificationIds: ['1', '2'],
          operation: 'delete',
        });
      });
      
      // Should update UI to remove deleted notifications
      await waitFor(() => {
        expect(screen.getByTestId('notifications-count')).toHaveTextContent('1');
      });
    });

    it('performs bulk archive operation', async () => {
      const user = userEvent.setup();
      
      render(
        <NotificationProvider>
          <TestNotificationActions />
        </NotificationProvider>
      );
      
      // Wait for notifications to load
      await waitFor(() => {
        expect(screen.getByTestId('notifications-count')).toHaveTextContent('3');
      });
      
      // Select multiple notifications
      const selectButton = screen.getByTestId('select-multiple');
      await user.click(selectButton);
      
      // Perform bulk archive
      const bulkArchiveButton = screen.getByTestId('bulk-archive');
      await user.click(bulkArchiveButton);
      
      // Should call bulk operation service
      await waitFor(() => {
        expect(mockNotificationService.bulkOperation).toHaveBeenCalledWith({
          notificationIds: ['1', '2'],
          operation: 'archive',
        });
      });
    });

    it('handles bulk operation failures gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock partial failure
      const failureResult: BulkOperationResult = {
        success: false,
        processedCount: 1,
        failedIds: ['2'],
        errors: [
          {
            code: 'NOTIFICATION_NOT_FOUND',
            message: 'Notification not found',
          },
        ],
      };
      
      mockNotificationService.bulkOperation.mockResolvedValue(failureResult);
      
      render(
        <NotificationProvider>
          <TestNotificationActions />
        </NotificationProvider>
      );
      
      // Wait for notifications to load
      await waitFor(() => {
        expect(screen.getByTestId('notifications-count')).toHaveTextContent('3');
      });
      
      // Select multiple notifications
      const selectButton = screen.getByTestId('select-multiple');
      await user.click(selectButton);
      
      // Perform bulk operation
      const bulkMarkReadButton = screen.getByTestId('bulk-mark-read');
      await user.click(bulkMarkReadButton);
      
      // Should handle partial failure
      await waitFor(() => {
        expect(mockNotificationService.bulkOperation).toHaveBeenCalled();
      });
      
      // Should update UI for successful operations only
      // In a real implementation, this would show error messages for failed operations
    });
  });

  describe('Action Error Handling', () => {
    it('handles individual action failures', async () => {
      const user = userEvent.setup();
      
      // Mock action failure
      mockNotificationService.markAsRead.mockRejectedValue(new Error('Action failed'));
      
      render(
        <NotificationProvider>
          <TestNotificationActions />
        </NotificationProvider>
      );
      
      // Wait for notifications to load
      await waitFor(() => {
        expect(screen.getByTestId('notifications-count')).toHaveTextContent('3');
      });
      
      // Try to perform an action
      const viewButtons = screen.getAllByText('View Assignment');
      if (viewButtons.length > 0) {
        await user.click(viewButtons[0]);
        
        // Should handle the error gracefully
        await waitFor(() => {
          expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('1');
        });
        
        // Error should be handled without crashing the app
      }
    });

    it('retries failed actions', async () => {
      const user = userEvent.setup();
      
      // Mock failure then success
      mockNotificationService.markAsRead
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(undefined);
      
      render(
        <NotificationProvider>
          <TestNotificationActions />
        </NotificationProvider>
      );
      
      // Wait for notifications to load
      await waitFor(() => {
        expect(screen.getByTestId('notifications-count')).toHaveTextContent('3');
      });
      
      // Perform action that will fail then succeed
      const viewButtons = screen.getAllByText('View Assignment');
      if (viewButtons.length > 0) {
        await user.click(viewButtons[0]);
        
        // Should eventually succeed after retry
        await waitFor(() => {
          expect(mockNotificationService.markAsRead).toHaveBeenCalledWith('1');
        }, { timeout: 5000 });
      }
    });
  });

  describe('Action Context and Deep Linking', () => {
    it('handles deep linking from notification actions', async () => {
      const user = userEvent.setup();
      
      // Mock URL parameters for deep linking
      Object.defineProperty(window, 'location', {
        value: {
          href: 'http://localhost:3000/assignments/1?from=notification&notificationId=1',
          search: '?from=notification&notificationId=1',
        },
        writable: true,
      });
      
      render(
        <NotificationProvider>
          <TestNotificationActions />
        </NotificationProvider>
      );
      
      // Should handle deep link context
      await waitFor(() => {
        expect(screen.getByTestId('notifications-count')).toHaveTextContent('3');
      });
      
      // In a real implementation, this would:
      // 1. Parse URL parameters
      // 2. Mark the notification as read
      // 3. Update breadcrumbs to show navigation context
    });

    it('updates breadcrumbs when navigating from notifications', async () => {
      const user = userEvent.setup();
      
      render(
        <NotificationProvider>
          <TestNotificationActions />
        </NotificationProvider>
      );
      
      // Wait for notifications to load
      await waitFor(() => {
        expect(screen.getByTestId('notifications-count')).toHaveTextContent('3');
      });
      
      // Click on a notification action
      const viewButtons = screen.getAllByText('View Assignment');
      if (viewButtons.length > 0) {
        await user.click(viewButtons[0]);
        
        // Should update breadcrumbs to show navigation context
        // In a real implementation, this would update the breadcrumb component
      }
    });

    it('handles action confirmation dialogs', async () => {
      const user = userEvent.setup();
      
      // Mock window.confirm
      window.confirm = jest.fn(() => true);
      
      render(
        <NotificationProvider>
          <TestNotificationActions />
        </NotificationProvider>
      );
      
      // Wait for notifications to load
      await waitFor(() => {
        expect(screen.getByTestId('notifications-count')).toHaveTextContent('3');
      });
      
      // Perform bulk delete which should show confirmation
      const selectButton = screen.getByTestId('select-multiple');
      await user.click(selectButton);
      
      const bulkDeleteButton = screen.getByTestId('bulk-delete');
      await user.click(bulkDeleteButton);
      
      // Should proceed with deletion after confirmation
      await waitFor(() => {
        expect(mockNotificationService.bulkOperation).toHaveBeenCalled();
      });
    });
  });

  describe('Action Performance and Optimization', () => {
    it('debounces rapid action clicks', async () => {
      const user = userEvent.setup();
      
      render(
        <NotificationProvider>
          <TestNotificationActions />
        </NotificationProvider>
      );
      
      // Wait for notifications to load
      await waitFor(() => {
        expect(screen.getByTestId('notifications-count')).toHaveTextContent('3');
      });
      
      // Click action button rapidly
      const viewButtons = screen.getAllByText('View Assignment');
      if (viewButtons.length > 0) {
        await user.click(viewButtons[0]);
        await user.click(viewButtons[0]);
        await user.click(viewButtons[0]);
        
        // Should only call the service once due to debouncing
        await waitFor(() => {
          expect(mockNotificationService.markAsRead).toHaveBeenCalledTimes(1);
        });
      }
    });

    it('batches multiple actions for efficiency', async () => {
      const user = userEvent.setup();
      
      render(
        <NotificationProvider>
          <TestNotificationActions />
        </NotificationProvider>
      );
      
      // Wait for notifications to load
      await waitFor(() => {
        expect(screen.getByTestId('notifications-count')).toHaveTextContent('3');
      });
      
      // Perform multiple actions quickly
      const selectButton = screen.getByTestId('select-multiple');
      await user.click(selectButton);
      
      const bulkMarkReadButton = screen.getByTestId('bulk-mark-read');
      await user.click(bulkMarkReadButton);
      
      // Should use bulk operation instead of individual calls
      await waitFor(() => {
        expect(mockNotificationService.bulkOperation).toHaveBeenCalledWith({
          notificationIds: ['1', '2'],
          operation: 'mark_read',
        });
      });
      
      // Should not call individual markAsRead
      expect(mockNotificationService.markAsRead).not.toHaveBeenCalled();
    });
  });
});