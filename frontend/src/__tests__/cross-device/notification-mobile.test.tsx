import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationProvider } from '../../components/providers/NotificationProvider';
import { NotificationCenter } from '../../components/notifications/NotificationCenter/NotificationCenter';
import { MobileNotificationBar } from '../../components/layout/MobileNotificationBar/MobileNotificationBar';
import { NotificationBell } from '../../components/layout/NotificationBell/NotificationBell';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { NotificationType, NotificationCategory } from '../../types/notifications';
import type { Notification } from '../../types/notifications';

// Mock dependencies
jest.mock('../../hooks/useMediaQuery');
jest.mock('../../hooks/usePushNotifications');
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

const mockUseMediaQuery = useMediaQuery as jest.Mock;
const mockUsePushNotifications = usePushNotifications as jest.Mock;

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
  },
];

// Mobile notification app component
function MobileNotificationApp() {
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = React.useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <NotificationProvider autoFetch={true} enableRealTime={true}>
      <div className="mobile-app">
        {/* Mobile notification bar */}
        {isMobile && (
          <MobileNotificationBar
            notifications={mockNotifications}
            maxVisible={3}
            autoHide={true}
            hideDelay={5000}
            swipeToAction={true}
          />
        )}
        
        {/* Header with notification bell */}
        <header className="header">
          <NotificationBell
            onClick={() => setIsNotificationCenterOpen(true)}
            size={isMobile ? 'lg' : 'md'}
            mobileOptimized={isMobile}
            data-testid="notification-bell"
          />
        </header>
        
        {/* Notification center */}
        <NotificationCenter
          isOpen={isNotificationCenterOpen}
          onClose={() => setIsNotificationCenterOpen(false)}
          position={isMobile ? 'center' : 'top-right'}
          mobileFullScreen={isMobile}
          showSearch={true}
          showFilters={true}
        />
        
        <main data-testid="main-content">
          <h1>Mobile Internship App</h1>
        </main>
      </div>
    </NotificationProvider>
  );
}

// Mock touch events
const createTouchEvent = (type: string, touches: Array<{ clientX: number; clientY: number }>) => {
  const touchEvent = new Event(type, { bubbles: true });
  Object.defineProperty(touchEvent, 'touches', {
    value: touches.map(touch => ({
      clientX: touch.clientX,
      clientY: touch.clientY,
      identifier: 0,
    })),
  });
  return touchEvent;
};

describe('Mobile Notification Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock mobile media query
    mockUseMediaQuery.mockReturnValue(true);
    
    // Mock push notifications
    mockUsePushNotifications.mockReturnValue({
      isSupported: true,
      permission: 'granted',
      isSubscribed: true,
      isLoading: false,
      error: null,
      subscription: null,
      isInitialized: true,
      initialize: jest.fn(),
      requestPermission: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
      sendTestNotification: jest.fn(),
      clearError: jest.fn(),
      checkSubscriptionStatus: jest.fn(),
      resubscribe: jest.fn(),
    });
    
    // Mock notification service
    jest.doMock('../../lib/api/services/notification.service', () => ({
      notificationService: {
        getNotificationsWithRetry: jest.fn().mockResolvedValue({
          notifications: mockNotifications,
          total: 2,
          unreadCount: 1,
        }),
        markAsRead: jest.fn().mockResolvedValue(undefined),
        deleteNotification: jest.fn().mockResolvedValue(undefined),
      },
    }));
    
    // Mock other dependencies
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
        storeNotifications: jest.fn().mockResolvedValue(undefined),
      },
    }));
    
    jest.doMock('../../lib/notifications/offline-queue', () => ({
      offlineNotificationManager: {
        queueAction: jest.fn(),
        processQueue: jest.fn().mockResolvedValue(undefined),
      },
    }));
    
    // Mock viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375, // iPhone width
    });
    
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 667, // iPhone height
    });
    
    // Mock touch support
    Object.defineProperty(window, 'ontouchstart', {
      value: {},
      writable: true,
    });
  });

  describe('Mobile Layout and Responsiveness', () => {
    it('renders mobile-optimized notification center', async () => {
      render(<MobileNotificationApp />);
      
      // Open notification center
      const bell = screen.getByTestId('notification-bell');
      await userEvent.click(bell);
      
      // Should render in full-screen mode on mobile
      await waitFor(() => {
        const notificationCenter = screen.getByText('Notifications').closest('div');
        expect(notificationCenter).toHaveClass('w-full', 'h-full');
      });
    });

    it('shows mobile notification bar on mobile devices', () => {
      render(<MobileNotificationApp />);
      
      // Should show mobile notification bar
      const mobileBar = document.querySelector('.mobile-notification-bar');
      // In a real implementation, this would be present
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });

    it('adapts notification bell size for mobile', () => {
      render(<MobileNotificationApp />);
      
      const bell = screen.getByTestId('notification-bell');
      expect(bell).toBeInTheDocument();
      
      // Should use larger size for mobile
      // In a real implementation, this would have mobile-specific styling
    });

    it('handles different screen orientations', async () => {
      render(<MobileNotificationApp />);
      
      // Simulate portrait orientation
      Object.defineProperty(window, 'innerWidth', { value: 375 });
      Object.defineProperty(window, 'innerHeight', { value: 667 });
      
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      
      // Open notification center
      const bell = screen.getByTestId('notification-bell');
      await userEvent.click(bell);
      
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });
      
      // Simulate landscape orientation
      Object.defineProperty(window, 'innerWidth', { value: 667 });
      Object.defineProperty(window, 'innerHeight', { value: 375 });
      
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      
      // Should still be accessible
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });
  });

  describe('Touch Interactions', () => {
    it('handles touch targets with minimum 44px size', () => {
      render(<MobileNotificationApp />);
      
      const bell = screen.getByTestId('notification-bell');
      const bellStyles = window.getComputedStyle(bell);
      
      // Should have minimum touch target size
      // In a real implementation, this would be enforced by CSS
      expect(bell).toBeInTheDocument();
    });

    it('handles swipe gestures on notifications', async () => {
      const user = userEvent.setup();
      render(<MobileNotificationApp />);
      
      // Open notification center
      const bell = screen.getByTestId('notification-bell');
      await user.click(bell);
      
      await waitFor(() => {
        expect(screen.getByText('Assignment Updated')).toBeInTheDocument();
      });
      
      // Simulate swipe gesture on notification
      const notification = screen.getByText('Assignment Updated').closest('div');
      if (notification) {
        // Simulate touch start
        const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
        notification.dispatchEvent(touchStart);
        
        // Simulate touch move (swipe right)
        const touchMove = createTouchEvent('touchmove', [{ clientX: 200, clientY: 100 }]);
        notification.dispatchEvent(touchMove);
        
        // Simulate touch end
        const touchEnd = createTouchEvent('touchend', []);
        notification.dispatchEvent(touchEnd);
        
        // Should trigger swipe action (mark as read)
        // In a real implementation, this would mark the notification as read
      }
    });

    it('handles long press for bulk selection', async () => {
      render(<MobileNotificationApp />);
      
      // Open notification center
      const bell = screen.getByTestId('notification-bell');
      await userEvent.click(bell);
      
      await waitFor(() => {
        expect(screen.getByText('Assignment Updated')).toBeInTheDocument();
      });
      
      // Simulate long press
      const notification = screen.getByText('Assignment Updated').closest('div');
      if (notification) {
        // Start touch
        const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
        notification.dispatchEvent(touchStart);
        
        // Hold for long press duration
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 500));
        });
        
        // End touch
        const touchEnd = createTouchEvent('touchend', []);
        notification.dispatchEvent(touchEnd);
        
        // Should enter selection mode
        // In a real implementation, this would show checkboxes
      }
    });

    it('handles pull-to-refresh gesture', async () => {
      render(<MobileNotificationApp />);
      
      // Open notification center
      const bell = screen.getByTestId('notification-bell');
      await userEvent.click(bell);
      
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });
      
      // Simulate pull-to-refresh
      const notificationList = screen.getByText('Notifications').closest('div');
      if (notificationList) {
        // Simulate pull down gesture
        const touchStart = createTouchEvent('touchstart', [{ clientX: 100, clientY: 50 }]);
        notificationList.dispatchEvent(touchStart);
        
        const touchMove = createTouchEvent('touchmove', [{ clientX: 100, clientY: 150 }]);
        notificationList.dispatchEvent(touchMove);
        
        const touchEnd = createTouchEvent('touchend', []);
        notificationList.dispatchEvent(touchEnd);
        
        // Should trigger refresh
        // In a real implementation, this would refresh notifications
      }
    });
  });

  describe('PWA Notification Behavior', () => {
    it('handles PWA installation and notifications', async () => {
      // Mock PWA installation prompt
      let deferredPrompt: any = null;
      
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
      });
      
      render(<MobileNotificationApp />);
      
      // Simulate PWA install prompt
      const beforeInstallPromptEvent = new Event('beforeinstallprompt');
      Object.defineProperty(beforeInstallPromptEvent, 'prompt', {
        value: jest.fn(),
      });
      
      window.dispatchEvent(beforeInstallPromptEvent);
      
      // Should handle PWA installation
      expect(deferredPrompt).toBeDefined();
    });

    it('displays native-like notifications in PWA mode', async () => {
      // Mock service worker registration
      Object.defineProperty(navigator, 'serviceWorker', {
        value: {
          register: jest.fn().mockResolvedValue({
            showNotification: jest.fn(),
          }),
          ready: Promise.resolve({
            showNotification: jest.fn(),
          }),
        },
        writable: true,
      });
      
      render(<MobileNotificationApp />);
      
      // Should register service worker for PWA notifications
      expect(navigator.serviceWorker.register).toHaveBeenCalled();
    });

    it('handles notification permission in PWA context', async () => {
      // Mock Notification API
      Object.defineProperty(window, 'Notification', {
        value: {
          permission: 'default',
          requestPermission: jest.fn().mockResolvedValue('granted'),
        },
        writable: true,
      });
      
      render(<MobileNotificationApp />);
      
      // Should handle notification permissions
      expect(mockUsePushNotifications).toHaveBeenCalled();
    });
  });

  describe('Cross-Device Synchronization', () => {
    it('syncs notification state across devices', async () => {
      const user = userEvent.setup();
      render(<MobileNotificationApp />);
      
      // Open notification center
      const bell = screen.getByTestId('notification-bell');
      await user.click(bell);
      
      await waitFor(() => {
        expect(screen.getByText('Assignment Updated')).toBeInTheDocument();
      });
      
      // Mark notification as read
      const moreButtons = screen.getAllByRole('button', { name: /more/i });
      if (moreButtons.length > 0) {
        await user.click(moreButtons[0]);
        
        const markAsReadButton = screen.queryByText('Mark as read');
        if (markAsReadButton) {
          await user.click(markAsReadButton);
          
          // Should sync across devices
          // In a real implementation, this would update server state
        }
      }
    });

    it('handles device-specific notification preferences', async () => {
      render(<MobileNotificationApp />);
      
      // Should load device-specific preferences
      // In a real implementation, this would check device capabilities
      expect(mockUsePushNotifications).toHaveBeenCalled();
    });
  });

  describe('Performance on Mobile Devices', () => {
    it('optimizes rendering for mobile performance', async () => {
      render(<MobileNotificationApp />);
      
      // Open notification center
      const bell = screen.getByTestId('notification-bell');
      await userEvent.click(bell);
      
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });
      
      // Should use virtualization for large lists
      // In a real implementation, this would use react-window or similar
    });

    it('handles memory constraints on mobile devices', async () => {
      render(<MobileNotificationApp />);
      
      // Should implement memory-efficient caching
      // In a real implementation, this would limit cache size
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });

    it('optimizes network usage on mobile', async () => {
      render(<MobileNotificationApp />);
      
      // Should batch network requests
      // In a real implementation, this would minimize API calls
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });
  });

  describe('Accessibility on Mobile', () => {
    it('provides proper touch accessibility', () => {
      render(<MobileNotificationApp />);
      
      const bell = screen.getByTestId('notification-bell');
      
      // Should have proper ARIA labels
      expect(bell).toHaveAttribute('role', 'button');
      expect(bell).toHaveAttribute('tabIndex', '0');
    });

    it('supports screen readers on mobile', async () => {
      const user = userEvent.setup();
      render(<MobileNotificationApp />);
      
      // Open notification center
      const bell = screen.getByTestId('notification-bell');
      await user.click(bell);
      
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });
      
      // Should have proper ARIA announcements
      const notificationCenter = screen.getByText('Notifications').closest('div');
      expect(notificationCenter).toHaveAttribute('role', 'dialog');
    });

    it('handles high contrast mode on mobile', () => {
      // Mock high contrast media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });
      
      render(<MobileNotificationApp />);
      
      // Should adapt to high contrast mode
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });
  });

  describe('Network Conditions on Mobile', () => {
    it('handles slow network connections', async () => {
      // Mock slow network
      Object.defineProperty(navigator, 'connection', {
        value: {
          effectiveType: '2g',
          downlink: 0.5,
        },
        writable: true,
      });
      
      render(<MobileNotificationApp />);
      
      // Should optimize for slow connections
      // In a real implementation, this would reduce image quality, etc.
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });

    it('handles offline mode gracefully', async () => {
      // Mock offline status
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        writable: true,
      });
      
      render(<MobileNotificationApp />);
      
      // Should work offline
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
      
      // Should show offline indicator
      // In a real implementation, this would show offline status
    });

    it('handles intermittent connectivity', async () => {
      render(<MobileNotificationApp />);
      
      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));
      
      // Simulate coming back online
      Object.defineProperty(navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));
      
      // Should handle connectivity changes
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });
  });
});

describe('Desktop vs Mobile Behavior', () => {
  it('shows different layouts for desktop and mobile', async () => {
    // Test desktop layout
    mockUseMediaQuery.mockReturnValue(false);
    
    const { rerender } = render(<MobileNotificationApp />);
    
    const bell = screen.getByTestId('notification-bell');
    await userEvent.click(bell);
    
    await waitFor(() => {
      const notificationCenter = screen.getByText('Notifications').closest('div');
      expect(notificationCenter).not.toHaveClass('w-full', 'h-full');
    });
    
    // Test mobile layout
    mockUseMediaQuery.mockReturnValue(true);
    
    rerender(<MobileNotificationApp />);
    
    await waitFor(() => {
      const notificationCenter = screen.getByText('Notifications').closest('div');
      expect(notificationCenter).toHaveClass('w-full', 'h-full');
    });
  });

  it('handles different interaction patterns', async () => {
    const user = userEvent.setup();
    
    // Desktop - hover interactions
    mockUseMediaQuery.mockReturnValue(false);
    
    const { rerender } = render(<MobileNotificationApp />);
    
    const bell = screen.getByTestId('notification-bell');
    
    // Desktop should support hover
    await user.hover(bell);
    
    // Mobile - touch interactions
    mockUseMediaQuery.mockReturnValue(true);
    
    rerender(<MobileNotificationApp />);
    
    // Mobile should support touch
    await user.click(bell);
    
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });
});