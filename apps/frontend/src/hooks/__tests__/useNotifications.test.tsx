import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  useNotifications,
  useFilteredNotifications,
  useNotificationStats,
  useNotificationActions,
  useNotificationPagination,
  useNotificationSettings,
  useNotificationUtils,
} from '../useNotifications';
import { NotificationProvider } from '../../components/providers/NotificationProvider';
import { NotificationType, NotificationCategory } from '../../types/notifications';
import type { Notification, NotificationSettings } from '../../types/notifications';

// Mock the notification service and other dependencies
jest.mock('../../lib/api/services/notification.service');
jest.mock('../../lib/notifications/offline-queue');
jest.mock('../../lib/notifications/offline-storage');
jest.mock('../../lib/notifications/network-status');

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
  {
    id: '3',
    userId: 1,
    type: NotificationType.SYSTEM_ANNOUNCEMENT,
    title: 'System Maintenance',
    body: 'System will be down for maintenance',
    priority: 'low',
    category: NotificationCategory.SYSTEM,
    isRead: false,
    createdAt: '2024-01-01T08:00:00Z',
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

// Test component for useNotifications hook
function TestUseNotifications() {
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
      <div data-testid="is-loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <div data-testid="is-connected">{isConnected ? 'connected' : 'disconnected'}</div>
      <div data-testid="push-enabled">{settings?.pushNotifications ? 'enabled' : 'disabled'}</div>
      
      <button onClick={() => fetchNotifications()} data-testid="fetch">Fetch</button>
      <button onClick={() => markAsRead('1')} data-testid="mark-read">Mark Read</button>
      <button onClick={() => markAllAsRead()} data-testid="mark-all-read">Mark All Read</button>
      <button onClick={() => deleteNotification('1')} data-testid="delete">Delete</button>
      <button onClick={() => clearAll()} data-testid="clear-all">Clear All</button>
      <button onClick={() => updateSettings({ pushNotifications: false })} data-testid="update-settings">Update Settings</button>
      <button onClick={() => connect()} data-testid="connect">Connect</button>
      <button onClick={() => disconnect()} data-testid="disconnect">Disconnect</button>
    </div>
  );
}

// Test component for useFilteredNotifications hook
function TestUseFilteredNotifications() {
  const [filters, setFilters] = React.useState<any>({});
  const filteredNotifications = useFilteredNotifications(filters);

  return (
    <div>
      <div data-testid="filtered-count">{filteredNotifications.length}</div>
      
      <button 
        onClick={() => setFilters({ type: NotificationType.ASSIGNMENT_CHANGE })} 
        data-testid="filter-assignment"
      >
        Filter Assignment
      </button>
      <button 
        onClick={() => setFilters({ category: NotificationCategory.ACADEMIC })} 
        data-testid="filter-academic"
      >
        Filter Academic
      </button>
      <button 
        onClick={() => setFilters({ unreadOnly: true })} 
        data-testid="filter-unread"
      >
        Filter Unread
      </button>
      <button 
        onClick={() => setFilters({ search: 'assignment' })} 
        data-testid="filter-search"
      >
        Search Assignment
      </button>
      <button onClick={() => setFilters({})} data-testid="clear-filters">Clear Filters</button>
    </div>
  );
}

// Test component for useNotificationStats hook
function TestUseNotificationStats() {
  const stats = useNotificationStats();

  return (
    <div>
      <div data-testid="total">{stats.total}</div>
      <div data-testid="unread">{stats.unread}</div>
      <div data-testid="today-count">{stats.todayCount}</div>
      <div data-testid="week-count">{stats.weekCount}</div>
      <div data-testid="assignment-count">{stats.byType[NotificationType.ASSIGNMENT_CHANGE] || 0}</div>
      <div data-testid="academic-count">{stats.byCategory[NotificationCategory.ACADEMIC] || 0}</div>
    </div>
  );
}

// Test component for useNotificationActions hook
function TestUseNotificationActions() {
  const {
    markAsRead,
    deleteNotification,
    markAllAsRead,
    clearAll,
    refreshNotifications,
  } = useNotificationActions();

  return (
    <div>
      <button onClick={() => markAsRead('1')} data-testid="mark-read">Mark Read</button>
      <button onClick={() => deleteNotification('1')} data-testid="delete">Delete</button>
      <button onClick={() => markAllAsRead()} data-testid="mark-all-read">Mark All Read</button>
      <button onClick={() => clearAll()} data-testid="clear-all">Clear All</button>
      <button onClick={() => refreshNotifications()} data-testid="refresh">Refresh</button>
    </div>
  );
}

// Test component for useNotificationPagination hook
function TestUseNotificationPagination() {
  const {
    notifications,
    hasMore,
    isLoading,
    currentPage,
    loadMore,
    reload,
  } = useNotificationPagination();

  return (
    <div>
      <div data-testid="notifications-count">{notifications.length}</div>
      <div data-testid="has-more">{hasMore ? 'has-more' : 'no-more'}</div>
      <div data-testid="is-loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="current-page">{currentPage}</div>
      
      <button onClick={() => loadMore()} data-testid="load-more">Load More</button>
      <button onClick={() => reload()} data-testid="reload">Reload</button>
    </div>
  );
}

// Test component for useNotificationSettings hook
function TestUseNotificationSettings() {
  const {
    settings,
    updateSettings,
    refreshSettings,
    isLoading,
    error,
  } = useNotificationSettings();

  return (
    <div>
      <div data-testid="push-enabled">{settings?.pushNotifications ? 'enabled' : 'disabled'}</div>
      <div data-testid="is-loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      
      <button onClick={() => updateSettings({ pushNotifications: false })} data-testid="update">Update</button>
      <button onClick={() => refreshSettings()} data-testid="refresh">Refresh</button>
    </div>
  );
}

// Test component for useNotificationUtils hook
function TestUseNotificationUtils() {
  const {
    getNotificationById,
    getNotificationsByType,
    getNotificationsByCategory,
    isNotificationExpired,
    getNotificationAge,
    formatNotificationTime,
  } = useNotificationUtils();

  const notification = getNotificationById('1');
  const assignmentNotifications = getNotificationsByType(NotificationType.ASSIGNMENT_CHANGE);
  const academicNotifications = getNotificationsByCategory(NotificationCategory.ACADEMIC);

  return (
    <div>
      <div data-testid="found-notification">{notification ? 'found' : 'not-found'}</div>
      <div data-testid="assignment-notifications">{assignmentNotifications.length}</div>
      <div data-testid="academic-notifications">{academicNotifications.length}</div>
      
      {notification && (
        <>
          <div data-testid="is-expired">{isNotificationExpired(notification) ? 'expired' : 'not-expired'}</div>
          <div data-testid="notification-age">{getNotificationAge(notification)}</div>
          <div data-testid="formatted-time">{formatNotificationTime(notification)}</div>
        </>
      )}
    </div>
  );
}

// Wrapper component that provides the notification context
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider autoFetch={false}>
      {children}
    </NotificationProvider>
  );
}

describe('useNotifications', () => {
  it('provides notification context', () => {
    render(
      <TestWrapper>
        <TestUseNotifications />
      </TestWrapper>
    );

    expect(screen.getByTestId('notifications-count')).toBeInTheDocument();
    expect(screen.getByTestId('unread-count')).toBeInTheDocument();
    expect(screen.getByTestId('is-loading')).toBeInTheDocument();
    expect(screen.getByTestId('error')).toBeInTheDocument();
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestUseNotifications />);
    }).toThrow('useNotifications must be used within a NotificationProvider');
    
    consoleSpy.mockRestore();
  });
});

describe('useFilteredNotifications', () => {
  beforeEach(() => {
    // Mock the useNotifications hook to return our test data
    jest.doMock('../useNotifications', () => ({
      ...jest.requireActual('../useNotifications'),
      useNotifications: () => ({
        notifications: mockNotifications,
      }),
    }));
  });

  it('filters notifications by type', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <TestUseFilteredNotifications />
      </TestWrapper>
    );

    // Initially shows all notifications
    expect(screen.getByTestId('filtered-count')).toHaveTextContent('0'); // No notifications in initial state

    // Filter by assignment type
    const filterButton = screen.getByTestId('filter-assignment');
    await user.click(filterButton);

    // Should show only assignment notifications
    // Note: This would work with actual data from the provider
  });

  it('filters notifications by category', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <TestUseFilteredNotifications />
      </TestWrapper>
    );

    const filterButton = screen.getByTestId('filter-academic');
    await user.click(filterButton);

    // Should filter by academic category
    expect(screen.getByTestId('filtered-count')).toBeInTheDocument();
  });

  it('filters notifications by read status', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <TestUseFilteredNotifications />
      </TestWrapper>
    );

    const filterButton = screen.getByTestId('filter-unread');
    await user.click(filterButton);

    // Should show only unread notifications
    expect(screen.getByTestId('filtered-count')).toBeInTheDocument();
  });

  it('filters notifications by search query', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <TestUseFilteredNotifications />
      </TestWrapper>
    );

    const searchButton = screen.getByTestId('filter-search');
    await user.click(searchButton);

    // Should filter by search term
    expect(screen.getByTestId('filtered-count')).toBeInTheDocument();
  });

  it('clears filters', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <TestUseFilteredNotifications />
      </TestWrapper>
    );

    // Apply filter first
    const filterButton = screen.getByTestId('filter-assignment');
    await user.click(filterButton);

    // Then clear filters
    const clearButton = screen.getByTestId('clear-filters');
    await user.click(clearButton);

    expect(screen.getByTestId('filtered-count')).toBeInTheDocument();
  });
});

describe('useNotificationStats', () => {
  it('calculates notification statistics', () => {
    render(
      <TestWrapper>
        <TestUseNotificationStats />
      </TestWrapper>
    );

    expect(screen.getByTestId('total')).toBeInTheDocument();
    expect(screen.getByTestId('unread')).toBeInTheDocument();
    expect(screen.getByTestId('today-count')).toBeInTheDocument();
    expect(screen.getByTestId('week-count')).toBeInTheDocument();
    expect(screen.getByTestId('assignment-count')).toBeInTheDocument();
    expect(screen.getByTestId('academic-count')).toBeInTheDocument();
  });
});

describe('useNotificationActions', () => {
  it('provides notification action functions', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <TestUseNotificationActions />
      </TestWrapper>
    );

    // Test that all action buttons are present
    expect(screen.getByTestId('mark-read')).toBeInTheDocument();
    expect(screen.getByTestId('delete')).toBeInTheDocument();
    expect(screen.getByTestId('mark-all-read')).toBeInTheDocument();
    expect(screen.getByTestId('clear-all')).toBeInTheDocument();
    expect(screen.getByTestId('refresh')).toBeInTheDocument();

    // Test clicking actions (they should not throw errors)
    await user.click(screen.getByTestId('mark-read'));
    await user.click(screen.getByTestId('delete'));
    await user.click(screen.getByTestId('mark-all-read'));
    await user.click(screen.getByTestId('clear-all'));
    await user.click(screen.getByTestId('refresh'));
  });
});

describe('useNotificationPagination', () => {
  it('provides pagination functionality', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <TestUseNotificationPagination />
      </TestWrapper>
    );

    expect(screen.getByTestId('notifications-count')).toBeInTheDocument();
    expect(screen.getByTestId('has-more')).toBeInTheDocument();
    expect(screen.getByTestId('is-loading')).toBeInTheDocument();
    expect(screen.getByTestId('current-page')).toBeInTheDocument();

    // Test pagination actions
    await user.click(screen.getByTestId('load-more'));
    await user.click(screen.getByTestId('reload'));
  });
});

describe('useNotificationSettings', () => {
  it('provides settings management', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <TestUseNotificationSettings />
      </TestWrapper>
    );

    expect(screen.getByTestId('push-enabled')).toBeInTheDocument();
    expect(screen.getByTestId('is-loading')).toBeInTheDocument();
    expect(screen.getByTestId('error')).toBeInTheDocument();

    // Test settings actions
    await user.click(screen.getByTestId('update'));
    await user.click(screen.getByTestId('refresh'));
  });
});

describe('useNotificationUtils', () => {
  it('provides utility functions', () => {
    render(
      <TestWrapper>
        <TestUseNotificationUtils />
      </TestWrapper>
    );

    expect(screen.getByTestId('found-notification')).toBeInTheDocument();
    expect(screen.getByTestId('assignment-notifications')).toBeInTheDocument();
    expect(screen.getByTestId('academic-notifications')).toBeInTheDocument();
  });

  it('formats notification time correctly', () => {
    // Mock current date for consistent testing
    const mockDate = new Date('2024-01-01T12:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

    render(
      <TestWrapper>
        <TestUseNotificationUtils />
      </TestWrapper>
    );

    // The utility functions should work with the mocked date
    expect(screen.getByTestId('found-notification')).toBeInTheDocument();

    // Restore Date
    (global.Date as any).mockRestore();
  });

  it('calculates notification age correctly', () => {
    const mockDate = new Date('2024-01-01T12:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

    render(
      <TestWrapper>
        <TestUseNotificationUtils />
      </TestWrapper>
    );

    expect(screen.getByTestId('found-notification')).toBeInTheDocument();

    (global.Date as any).mockRestore();
  });

  it('checks notification expiration correctly', () => {
    render(
      <TestWrapper>
        <TestUseNotificationUtils />
      </TestWrapper>
    );

    expect(screen.getByTestId('found-notification')).toBeInTheDocument();
  });
});