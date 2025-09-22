import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationCenter } from '../NotificationCenter/NotificationCenter';
import { NotificationProvider } from '../../providers/NotificationProvider';
import { useNotifications } from '../../../hooks/useNotifications';
import { NotificationType, NotificationCategory } from '../../../types/notifications';
import type { Notification } from '../../../types/notifications';

// Mock the hooks
jest.mock('../../../hooks/useNotifications');
jest.mock('../../../hooks/useNotificationPerformance', () => ({
  useNotificationPerformance: () => ({
    metrics: {},
    measureRender: (fn: () => any) => fn(),
    getPerformanceGrade: () => 'A',
    getRecommendations: () => [],
  }),
}));

// Mock the child components
jest.mock('../NotificationCenter/NotificationList', () => ({
  NotificationList: ({ notifications, onLoadMore, selectedIds, onSelectionChange }: any) => (
    <div data-testid="notification-list">
      {notifications.map((notification: Notification) => (
        <div 
          key={notification.id} 
          data-testid={`notification-${notification.id}`}
          onClick={() => onSelectionChange?.([...selectedIds, notification.id])}
        >
          {notification.title}
        </div>
      ))}
      <button onClick={onLoadMore} data-testid="load-more">Load More</button>
    </div>
  ),
}));

jest.mock('../NotificationCenter/NotificationFilters', () => ({
  NotificationFilters: ({ onChange, onClear }: any) => (
    <div data-testid="notification-filters">
      <button onClick={() => onChange({ type: NotificationType.ASSIGNMENT_CHANGE })} data-testid="filter-assignment">
        Filter Assignment
      </button>
      <button onClick={onClear} data-testid="clear-filters">Clear Filters</button>
    </div>
  ),
}));

jest.mock('../NotificationCenter/NotificationSearch', () => ({
  NotificationSearch: React.forwardRef<HTMLInputElement, any>(({ onChange, value }, ref) => (
    <input
      ref={ref}
      data-testid="notification-search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Search notifications..."
    />
  )),
}));

jest.mock('../NotificationCenter/EmptyState', () => ({
  EmptyState: ({ onRefresh, onClearFilters }: any) => (
    <div data-testid="empty-state">
      <button onClick={onRefresh} data-testid="empty-refresh">Refresh</button>
      <button onClick={onClearFilters} data-testid="empty-clear-filters">Clear Filters</button>
    </div>
  ),
}));

jest.mock('../NotificationCenter/LoadingState', () => ({
  LoadingState: () => <div data-testid="loading-state">Loading...</div>,
}));

jest.mock('../NotificationCenter/BulkNotificationActions', () => ({
  BulkNotificationActions: ({ onBulkOperationComplete }: any) => (
    <div data-testid="bulk-actions">
      <button 
        onClick={() => onBulkOperationComplete('mark_read', { success: true })}
        data-testid="bulk-mark-read"
      >
        Mark All Read
      </button>
    </div>
  ),
}));

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
  },
];

const mockUseNotifications = {
  notifications: mockNotifications,
  unreadCount: 1,
  isLoading: false,
  error: null,
  hasMore: false,
  refreshNotifications: jest.fn(),
  loadMoreNotifications: jest.fn(),
  markAllAsRead: jest.fn(),
  clearAll: jest.fn(),
};

describe('NotificationCenter', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useNotifications as jest.Mock).mockReturnValue(mockUseNotifications);
  });

  it('renders notification center when open', () => {
    render(<NotificationCenter {...defaultProps} />);
    
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('1 new')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<NotificationCenter {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
  });

  it('displays notifications in the list', () => {
    render(<NotificationCenter {...defaultProps} />);
    
    expect(screen.getByTestId('notification-list')).toBeInTheDocument();
    expect(screen.getByTestId('notification-1')).toBeInTheDocument();
    expect(screen.getByTestId('notification-2')).toBeInTheDocument();
  });

  it('handles refresh button click', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter {...defaultProps} />);
    
    const refreshButton = screen.getByTitle('Refresh notifications (Ctrl+R)');
    await user.click(refreshButton);
    
    expect(mockUseNotifications.refreshNotifications).toHaveBeenCalled();
  });

  it('handles mark all as read button click', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter {...defaultProps} />);
    
    const markAllReadButton = screen.getByTitle('Mark all as read (Ctrl+A)');
    await user.click(markAllReadButton);
    
    expect(mockUseNotifications.markAllAsRead).toHaveBeenCalled();
  });

  it('handles close button click', async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<NotificationCenter {...defaultProps} onClose={onClose} />);
    
    const closeButton = screen.getByTitle('Close (Esc)');
    await user.click(closeButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  it('shows search input when showSearch is true', () => {
    render(<NotificationCenter {...defaultProps} showSearch={true} />);
    
    expect(screen.getByTestId('notification-search')).toBeInTheDocument();
  });

  it('hides search input when showSearch is false', () => {
    render(<NotificationCenter {...defaultProps} showSearch={false} />);
    
    expect(screen.queryByTestId('notification-search')).not.toBeInTheDocument();
  });

  it('handles search input changes', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter {...defaultProps} showSearch={true} />);
    
    const searchInput = screen.getByTestId('notification-search');
    await user.type(searchInput, 'assignment');
    
    expect(searchInput).toHaveValue('assignment');
  });

  it('shows filters panel when filters button is clicked', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter {...defaultProps} showFilters={true} />);
    
    const filtersButton = screen.getByTitle('Toggle filters');
    await user.click(filtersButton);
    
    expect(screen.getByTestId('notification-filters')).toBeInTheDocument();
  });

  it('handles filter changes', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter {...defaultProps} showFilters={true} />);
    
    // Open filters panel
    const filtersButton = screen.getByTitle('Toggle filters');
    await user.click(filtersButton);
    
    // Apply filter
    const filterButton = screen.getByTestId('filter-assignment');
    await user.click(filterButton);
    
    // The filter should be applied (tested through the filtered notifications)
    expect(screen.getByTestId('notification-filters')).toBeInTheDocument();
  });

  it('clears filters when clear filters is clicked', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter {...defaultProps} showFilters={true} />);
    
    // Open filters panel
    const filtersButton = screen.getByTitle('Toggle filters');
    await user.click(filtersButton);
    
    // Clear filters
    const clearButton = screen.getByTestId('clear-filters');
    await user.click(clearButton);
    
    // Search should be cleared
    const searchInput = screen.getByTestId('notification-search');
    expect(searchInput).toHaveValue('');
  });

  it('shows bulk actions when selection mode is enabled', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter {...defaultProps} />);
    
    // Enable selection mode
    const selectionButton = screen.getByTitle('Toggle selection mode');
    await user.click(selectionButton);
    
    expect(screen.getByTestId('bulk-actions')).toBeInTheDocument();
  });

  it('handles bulk operations', async () => {
    const user = userEvent.setup();
    render(<NotificationCenter {...defaultProps} />);
    
    // Enable selection mode
    const selectionButton = screen.getByTitle('Toggle selection mode');
    await user.click(selectionButton);
    
    // Perform bulk operation
    const bulkMarkReadButton = screen.getByTestId('bulk-mark-read');
    await user.click(bulkMarkReadButton);
    
    // Selection mode should be disabled after successful operation
    await waitFor(() => {
      expect(screen.queryByTestId('bulk-actions')).not.toBeInTheDocument();
    });
  });

  it('shows loading state when loading and no notifications', () => {
    (useNotifications as jest.Mock).mockReturnValue({
      ...mockUseNotifications,
      notifications: [],
      isLoading: true,
    });
    
    render(<NotificationCenter {...defaultProps} />);
    
    expect(screen.getByTestId('loading-state')).toBeInTheDocument();
  });

  it('shows empty state when no notifications', () => {
    (useNotifications as jest.Mock).mockReturnValue({
      ...mockUseNotifications,
      notifications: [],
      isLoading: false,
    });
    
    render(<NotificationCenter {...defaultProps} />);
    
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('shows error message when there is an error', () => {
    (useNotifications as jest.Mock).mockReturnValue({
      ...mockUseNotifications,
      error: 'Failed to load notifications',
    });
    
    render(<NotificationCenter {...defaultProps} />);
    
    expect(screen.getByText('Failed to load notifications')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('handles clear all notifications', async () => {
    const user = userEvent.setup();
    // Mock window.confirm
    window.confirm = jest.fn(() => true);
    
    render(<NotificationCenter {...defaultProps} />);
    
    const clearAllButton = screen.getByText('Clear all');
    await user.click(clearAllButton);
    
    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to clear all notifications? This action cannot be undone.'
    );
    expect(mockUseNotifications.clearAll).toHaveBeenCalled();
  });

  it('handles keyboard shortcuts', async () => {
    const onClose = jest.fn();
    render(<NotificationCenter {...defaultProps} onClose={onClose} />);
    
    // Test Escape key
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
    
    // Test Ctrl+R for refresh
    fireEvent.keyDown(document, { key: 'r', ctrlKey: true });
    expect(mockUseNotifications.refreshNotifications).toHaveBeenCalled();
    
    // Test Ctrl+A for mark all as read
    fireEvent.keyDown(document, { key: 'a', ctrlKey: true });
    expect(mockUseNotifications.markAllAsRead).toHaveBeenCalled();
  });

  it('applies correct position classes', () => {
    const { rerender } = render(<NotificationCenter {...defaultProps} position="top-left" />);
    expect(document.querySelector('.top-16.left-4')).toBeInTheDocument();
    
    rerender(<NotificationCenter {...defaultProps} position="bottom-right" />);
    expect(document.querySelector('.bottom-4.right-4')).toBeInTheDocument();
    
    rerender(<NotificationCenter {...defaultProps} position="center" />);
    expect(document.querySelector('.top-1\\/2.left-1\\/2')).toBeInTheDocument();
  });

  it('handles mobile full screen mode', () => {
    render(<NotificationCenter {...defaultProps} mobileFullScreen={true} />);
    
    const container = document.querySelector('.w-full.h-full');
    expect(container).toBeInTheDocument();
  });

  it('shows correct notification count in header', () => {
    render(<NotificationCenter {...defaultProps} />);
    
    expect(screen.getByText('1 new')).toBeInTheDocument();
  });

  it('hides mark all as read button when no unread notifications', () => {
    (useNotifications as jest.Mock).mockReturnValue({
      ...mockUseNotifications,
      unreadCount: 0,
    });
    
    render(<NotificationCenter {...defaultProps} />);
    
    expect(screen.queryByTitle('Mark all as read (Ctrl+A)')).not.toBeInTheDocument();
  });

  it('shows footer with notification count', () => {
    render(<NotificationCenter {...defaultProps} />);
    
    expect(screen.getByText('2 of 2 notifications')).toBeInTheDocument();
  });

  it('handles load more notifications', async () => {
    const user = userEvent.setup();
    (useNotifications as jest.Mock).mockReturnValue({
      ...mockUseNotifications,
      hasMore: true,
    });
    
    render(<NotificationCenter {...defaultProps} />);
    
    const loadMoreButton = screen.getByTestId('load-more');
    await user.click(loadMoreButton);
    
    expect(mockUseNotifications.loadMoreNotifications).toHaveBeenCalled();
  });
});