import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationItem } from '../NotificationCenter/NotificationItem';
import { NotificationType, NotificationCategory } from '../../../types/notifications';
import type { Notification } from '../../../types/notifications';

// Mock the hooks
jest.mock('../../../hooks/useSwipeGesture', () => ({
  useSwipeGesture: () => ({
    swipeOffset: 0,
    isSwipeActive: false,
    swipeDirection: null,
    resetSwipe: jest.fn(),
  }),
}));

jest.mock('../../../hooks/useNotifications', () => ({
  useNotificationUtils: () => ({
    formatNotificationTime: (notification: Notification) => '2 hours ago',
    isNotificationExpired: () => false,
  }),
}));

jest.mock('../NotificationRouter/NotificationRouter', () => ({
  useNotificationRouter: () => ({
    navigateToNotification: jest.fn(),
  }),
}));

// Mock the NotificationActions component
jest.mock('../NotificationCenter/NotificationActions', () => ({
  NotificationActions: ({ onActionComplete }: any) => (
    <div data-testid="notification-actions">
      <button onClick={() => onActionComplete('view', { success: true })} data-testid="action-view">
        View
      </button>
    </div>
  ),
}));

const mockNotification: Notification = {
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
};

const readNotification: Notification = {
  ...mockNotification,
  id: '2',
  isRead: true,
  readAt: '2024-01-01T11:00:00Z',
};

describe('NotificationItem', () => {
  const defaultProps = {
    notification: mockNotification,
    onClick: jest.fn(),
    onMarkAsRead: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders notification item correctly', () => {
    render(<NotificationItem {...defaultProps} />);
    
    expect(screen.getByText('Assignment Updated')).toBeInTheDocument();
    expect(screen.getByText('Your assignment has been updated with new requirements')).toBeInTheDocument();
    expect(screen.getByText('2 hours ago')).toBeInTheDocument();
  });

  it('shows unread indicator for unread notifications', () => {
    render(<NotificationItem {...defaultProps} />);
    
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(document.querySelector('.bg-blue-50')).toBeInTheDocument();
  });

  it('does not show unread indicator for read notifications', () => {
    render(<NotificationItem {...defaultProps} notification={readNotification} />);
    
    expect(screen.queryByText('New')).not.toBeInTheDocument();
    expect(document.querySelector('.bg-white')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    
    render(<NotificationItem {...defaultProps} onClick={onClick} />);
    
    const notificationItem = screen.getByRole('button');
    await user.click(notificationItem);
    
    expect(onClick).toHaveBeenCalledWith(mockNotification);
  });

  it('handles keyboard navigation', async () => {
    const onClick = jest.fn();
    
    render(<NotificationItem {...defaultProps} onClick={onClick} />);
    
    const notificationItem = screen.getByRole('button');
    fireEvent.keyDown(notificationItem, { key: 'Enter' });
    
    expect(onClick).toHaveBeenCalledWith(mockNotification);
  });

  it('shows actions menu when actions button is clicked', async () => {
    const user = userEvent.setup();
    
    render(<NotificationItem {...defaultProps} showActions={true} />);
    
    const actionsButton = screen.getByRole('button', { name: /more/i });
    await user.click(actionsButton);
    
    expect(screen.getByText('Mark as read')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('handles mark as read action', async () => {
    const user = userEvent.setup();
    const onMarkAsRead = jest.fn();
    
    render(<NotificationItem {...defaultProps} onMarkAsRead={onMarkAsRead} />);
    
    // Open actions menu
    const actionsButton = screen.getByRole('button', { name: /more/i });
    await user.click(actionsButton);
    
    // Click mark as read
    const markAsReadButton = screen.getByText('Mark as read');
    await user.click(markAsReadButton);
    
    expect(onMarkAsRead).toHaveBeenCalledWith('1');
  });

  it('handles delete action', async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();
    
    render(<NotificationItem {...defaultProps} onDelete={onDelete} />);
    
    // Open actions menu
    const actionsButton = screen.getByRole('button', { name: /more/i });
    await user.click(actionsButton);
    
    // Click delete
    const deleteButton = screen.getByText('Delete');
    await user.click(deleteButton);
    
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('does not show mark as read option for already read notifications', async () => {
    const user = userEvent.setup();
    
    render(<NotificationItem {...defaultProps} notification={readNotification} />);
    
    // Open actions menu
    const actionsButton = screen.getByRole('button', { name: /more/i });
    await user.click(actionsButton);
    
    expect(screen.queryByText('Mark as read')).not.toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('shows priority indicator for high priority notifications', () => {
    render(<NotificationItem {...defaultProps} />);
    
    expect(screen.getByText('High priority')).toBeInTheDocument();
  });

  it('does not show priority indicator for normal priority notifications', () => {
    const normalPriorityNotification = { ...mockNotification, priority: 'normal' as const };
    
    render(<NotificationItem {...defaultProps} notification={normalPriorityNotification} />);
    
    expect(screen.queryByText('High priority')).not.toBeInTheDocument();
  });

  it('applies correct category styling', () => {
    render(<NotificationItem {...defaultProps} />);
    
    // Academic category should have blue styling
    const iconContainer = document.querySelector('.text-blue-600.bg-blue-100');
    expect(iconContainer).toBeInTheDocument();
  });

  it('applies correct priority border styling', () => {
    render(<NotificationItem {...defaultProps} />);
    
    // High priority should have red border
    const item = document.querySelector('.border-l-red-500');
    expect(item).toBeInTheDocument();
  });

  it('renders in compact mode', () => {
    render(<NotificationItem {...defaultProps} compact={true} />);
    
    // In compact mode, body should not be shown
    expect(screen.queryByText('Your assignment has been updated with new requirements')).not.toBeInTheDocument();
    expect(screen.getByText('Assignment Updated')).toBeInTheDocument();
  });

  it('shows selection checkbox in selection mode', () => {
    render(<NotificationItem {...defaultProps} selectionMode={true} isSelected={false} />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('shows checked checkbox when selected', () => {
    render(<NotificationItem {...defaultProps} selectionMode={true} isSelected={true} />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('handles checkbox selection', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    
    render(<NotificationItem {...defaultProps} selectionMode={true} onClick={onClick} />);
    
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    
    expect(onClick).toHaveBeenCalledWith(mockNotification);
  });

  it('sanitizes notification content', () => {
    const maliciousNotification = {
      ...mockNotification,
      title: '<script>alert("xss")</script>Safe Title',
      body: '<img src="x" onerror="alert(\'xss\')" />Safe Body',
    };
    
    render(<NotificationItem {...defaultProps} notification={maliciousNotification} />);
    
    expect(screen.getByText('Safe Title')).toBeInTheDocument();
    expect(screen.getByText('Safe Body')).toBeInTheDocument();
    expect(screen.queryByText('<script>')).not.toBeInTheDocument();
  });

  it('shows loading state when marking as read', async () => {
    const user = userEvent.setup();
    const onMarkAsRead = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<NotificationItem {...defaultProps} onMarkAsRead={onMarkAsRead} />);
    
    // Open actions menu
    const actionsButton = screen.getByRole('button', { name: /more/i });
    await user.click(actionsButton);
    
    // Click mark as read
    const markAsReadButton = screen.getByText('Mark as read');
    await user.click(markAsReadButton);
    
    expect(screen.getByText('Marking as read...')).toBeInTheDocument();
  });

  it('shows loading state when deleting', async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));
    
    render(<NotificationItem {...defaultProps} onDelete={onDelete} />);
    
    // Open actions menu
    const actionsButton = screen.getByRole('button', { name: /more/i });
    await user.click(actionsButton);
    
    // Click delete
    const deleteButton = screen.getByText('Delete');
    await user.click(deleteButton);
    
    expect(screen.getByText('Deleting...')).toBeInTheDocument();
  });

  it('closes menu when clicking outside', async () => {
    const user = userEvent.setup();
    
    render(
      <div>
        <NotificationItem {...defaultProps} />
        <div data-testid="outside">Outside</div>
      </div>
    );
    
    // Open actions menu
    const actionsButton = screen.getByRole('button', { name: /more/i });
    await user.click(actionsButton);
    
    expect(screen.getByText('Mark as read')).toBeInTheDocument();
    
    // Click outside
    const outside = screen.getByTestId('outside');
    await user.click(outside);
    
    await waitFor(() => {
      expect(screen.queryByText('Mark as read')).not.toBeInTheDocument();
    });
  });

  it('handles notification actions completion', async () => {
    const user = userEvent.setup();
    const onMarkAsRead = jest.fn();
    
    render(<NotificationItem {...defaultProps} onMarkAsRead={onMarkAsRead} />);
    
    // Trigger action completion
    const actionButton = screen.getByTestId('action-view');
    await user.click(actionButton);
    
    // Should mark as read when action is completed
    expect(onMarkAsRead).toHaveBeenCalledWith('1');
  });

  it('prevents click propagation on action buttons', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    
    render(<NotificationItem {...defaultProps} onClick={onClick} />);
    
    // Click on actions menu button should not trigger notification click
    const actionsButton = screen.getByRole('button', { name: /more/i });
    await user.click(actionsButton);
    
    expect(onClick).not.toHaveBeenCalled();
  });

  it('shows correct icon for notification type', () => {
    render(<NotificationItem {...defaultProps} />);
    
    // Should show User icon for ASSIGNMENT_CHANGE type
    const iconContainer = document.querySelector('.text-blue-600.bg-blue-100');
    expect(iconContainer).toBeInTheDocument();
  });

  it('handles expired notifications', () => {
    // Mock the expired notification check
    jest.doMock('../../../hooks/useNotifications', () => ({
      useNotificationUtils: () => ({
        formatNotificationTime: () => '2 hours ago',
        isNotificationExpired: () => true,
      }),
    }));
    
    render(<NotificationItem {...defaultProps} />);
    
    expect(screen.getByText('Expired')).toBeInTheDocument();
  });
});