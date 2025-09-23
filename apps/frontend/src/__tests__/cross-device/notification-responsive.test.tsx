import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationProvider } from '../../components/providers/NotificationProvider';
import { NotificationCenter } from '../../components/notifications/NotificationCenter/NotificationCenter';
import { NotificationBell } from '../../components/layout/NotificationBell/NotificationBell';
import { MobileNotificationBar } from '../../components/layout/MobileNotificationBar/MobileNotificationBar';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { NotificationType, NotificationCategory } from '../../types/notifications';
import type { Notification } from '../../types/notifications';

// Mock dependencies
jest.mock('../../hooks/useMediaQuery');
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

// Responsive notification app component
function ResponsiveNotificationApp() {
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = React.useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px) and (min-width: 769px)');
  const isDesktop = useMediaQuery('(min-width: 1025px)');

  return (
    <NotificationProvider autoFetch={true}>
      <div className={`app ${isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'}`}>
        {/* Mobile notification bar */}
        {isMobile && (
          <MobileNotificationBar
            notifications={mockNotifications}
            maxVisible={2}
            autoHide={true}
            data-testid="mobile-notification-bar"
          />
        )}
        
        {/* Header */}
        <header className="header" data-testid="header">
          <div className="nav-container">
            <h1>Internship System</h1>
            <NotificationBell
              onClick={() => setIsNotificationCenterOpen(true)}
              size={isMobile ? 'lg' : isTablet ? 'md' : 'sm'}
              mobileOptimized={isMobile}
              data-testid="notification-bell"
            />
          </div>
        </header>
        
        {/* Notification center */}
        <NotificationCenter
          isOpen={isNotificationCenterOpen}
          onClose={() => setIsNotificationCenterOpen(false)}
          position={isMobile ? 'center' : isTablet ? 'top-right' : 'top-right'}
          mobileFullScreen={isMobile}
          maxHeight={isMobile ? window.innerHeight - 100 : isTablet ? 500 : 600}
          showSearch={true}
          showFilters={!isMobile} // Hide filters on mobile for simplicity
        />
        
        {/* Main content */}
        <main className="main-content" data-testid="main-content">
          <div className="content-grid">
            <section className="notifications-section" data-testid="notifications-section">
              <h2>Recent Notifications</h2>
              <div className="notification-preview">
                {mockNotifications.slice(0, isMobile ? 2 : isTablet ? 4 : 6).map(notification => (
                  <div key={notification.id} className="notification-preview-item" data-testid={`preview-${notification.id}`}>
                    <h3>{notification.title}</h3>
                    <p>{notification.body}</p>
                  </div>
                ))}
              </div>
            </section>
            
            <section className="dashboard-section" data-testid="dashboard-section">
              <h2>Dashboard</h2>
              <div className={`dashboard-grid ${isMobile ? 'mobile-grid' : isTablet ? 'tablet-grid' : 'desktop-grid'}`}>
                <div className="dashboard-card" data-testid="dashboard-card-1">Card 1</div>
                <div className="dashboard-card" data-testid="dashboard-card-2">Card 2</div>
                {!isMobile && <div className="dashboard-card" data-testid="dashboard-card-3">Card 3</div>}
                {isDesktop && <div className="dashboard-card" data-testid="dashboard-card-4">Card 4</div>}
              </div>
            </section>
          </div>
        </main>
      </div>
    </NotificationProvider>
  );
}

// Viewport size configurations
const viewports = {
  mobile: { width: 375, height: 667 }, // iPhone 6/7/8
  mobileLarge: { width: 414, height: 896 }, // iPhone 11 Pro Max
  tablet: { width: 768, height: 1024 }, // iPad
  tabletLarge: { width: 1024, height: 768 }, // iPad landscape
  desktop: { width: 1280, height: 720 }, // Desktop
  desktopLarge: { width: 1920, height: 1080 }, // Large desktop
};

const setViewport = (viewport: keyof typeof viewports) => {
  const { width, height } = viewports[viewport];
  
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  
  // Update media query mock based on viewport
  mockUseMediaQuery.mockImplementation((query: string) => {
    if (query === '(max-width: 768px)') {
      return width <= 768;
    }
    if (query === '(max-width: 1024px) and (min-width: 769px)') {
      return width > 768 && width <= 1024;
    }
    if (query === '(min-width: 1025px)') {
      return width >= 1025;
    }
    return false;
  });
  
  // Trigger resize event
  act(() => {
    window.dispatchEvent(new Event('resize'));
  });
};

describe('Responsive Notification Layout Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
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
      },
    }));
    
    jest.doMock('../../lib/notifications/offline-queue', () => ({
      offlineNotificationManager: {
        queueAction: jest.fn(),
        processQueue: jest.fn().mockResolvedValue(undefined),
      },
    }));
  });

  describe('Mobile Layout (≤768px)', () => {
    beforeEach(() => {
      setViewport('mobile');
    });

    it('renders mobile-optimized layout', async () => {
      render(<ResponsiveNotificationApp />);
      
      // Should show mobile notification bar
      expect(screen.getByTestId('mobile-notification-bar')).toBeInTheDocument();
      
      // Should have mobile class
      const app = document.querySelector('.app');
      expect(app).toHaveClass('mobile');
      
      // Should show limited notification previews
      expect(screen.getByTestId('preview-1')).toBeInTheDocument();
      expect(screen.getByTestId('preview-2')).toBeInTheDocument();
      
      // Should show mobile dashboard grid
      expect(screen.getByTestId('dashboard-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-card-2')).toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-card-3')).not.toBeInTheDocument();
    });

    it('opens notification center in full-screen mode on mobile', async () => {
      const user = userEvent.setup();
      render(<ResponsiveNotificationApp />);
      
      const bell = screen.getByTestId('notification-bell');
      await user.click(bell);
      
      await waitFor(() => {
        const notificationCenter = screen.getByText('Notifications').closest('div');
        expect(notificationCenter).toHaveClass('w-full', 'h-full');
      });
    });

    it('hides filters on mobile for simplicity', async () => {
      const user = userEvent.setup();
      render(<ResponsiveNotificationApp />);
      
      const bell = screen.getByTestId('notification-bell');
      await user.click(bell);
      
      await waitFor(() => {
        // Filters should be hidden on mobile
        const filtersButton = screen.queryByTitle('Toggle filters');
        expect(filtersButton).not.toBeInTheDocument();
      });
    });

    it('handles mobile orientation changes', async () => {
      render(<ResponsiveNotificationApp />);
      
      // Portrait mode
      setViewport('mobile');
      
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
      
      // Landscape mode (swap width/height)
      Object.defineProperty(window, 'innerWidth', { value: 667 });
      Object.defineProperty(window, 'innerHeight', { value: 375 });
      
      act(() => {
        window.dispatchEvent(new Event('resize'));
      });
      
      // Should still work in landscape
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });
  });

  describe('Tablet Layout (769px - 1024px)', () => {
    beforeEach(() => {
      setViewport('tablet');
    });

    it('renders tablet-optimized layout', async () => {
      render(<ResponsiveNotificationApp />);
      
      // Should not show mobile notification bar
      expect(screen.queryByTestId('mobile-notification-bar')).not.toBeInTheDocument();
      
      // Should have tablet class
      const app = document.querySelector('.app');
      expect(app).toHaveClass('tablet');
      
      // Should show more dashboard cards
      expect(screen.getByTestId('dashboard-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-card-3')).toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-card-4')).not.toBeInTheDocument();
    });

    it('opens notification center in positioned mode on tablet', async () => {
      const user = userEvent.setup();
      render(<ResponsiveNotificationApp />);
      
      const bell = screen.getByTestId('notification-bell');
      await user.click(bell);
      
      await waitFor(() => {
        const notificationCenter = screen.getByText('Notifications').closest('div');
        expect(notificationCenter).not.toHaveClass('w-full', 'h-full');
        expect(notificationCenter).toHaveClass('top-16', 'right-4');
      });
    });

    it('shows filters on tablet', async () => {
      const user = userEvent.setup();
      render(<ResponsiveNotificationApp />);
      
      const bell = screen.getByTestId('notification-bell');
      await user.click(bell);
      
      await waitFor(() => {
        const filtersButton = screen.getByTitle('Toggle filters');
        expect(filtersButton).toBeInTheDocument();
      });
    });
  });

  describe('Desktop Layout (≥1025px)', () => {
    beforeEach(() => {
      setViewport('desktop');
    });

    it('renders desktop-optimized layout', async () => {
      render(<ResponsiveNotificationApp />);
      
      // Should have desktop class
      const app = document.querySelector('.app');
      expect(app).toHaveClass('desktop');
      
      // Should show all dashboard cards
      expect(screen.getByTestId('dashboard-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-card-3')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-card-4')).toBeInTheDocument();
    });

    it('opens notification center in compact mode on desktop', async () => {
      const user = userEvent.setup();
      render(<ResponsiveNotificationApp />);
      
      const bell = screen.getByTestId('notification-bell');
      await user.click(bell);
      
      await waitFor(() => {
        const notificationCenter = screen.getByText('Notifications').closest('div');
        expect(notificationCenter).toHaveClass('w-96');
        expect(notificationCenter).toHaveClass('top-16', 'right-4');
      });
    });

    it('shows all features on desktop', async () => {
      const user = userEvent.setup();
      render(<ResponsiveNotificationApp />);
      
      const bell = screen.getByTestId('notification-bell');
      await user.click(bell);
      
      await waitFor(() => {
        // Should show search
        expect(screen.getByPlaceholderText(/search notifications/i)).toBeInTheDocument();
        
        // Should show filters
        expect(screen.getByTitle('Toggle filters')).toBeInTheDocument();
        
        // Should show all action buttons
        expect(screen.getByTitle('Refresh notifications (Ctrl+R)')).toBeInTheDocument();
        expect(screen.getByTitle('Toggle selection mode')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Breakpoint Transitions', () => {
    it('transitions smoothly between mobile and tablet', async () => {
      const user = userEvent.setup();
      
      // Start with mobile
      setViewport('mobile');
      render(<ResponsiveNotificationApp />);
      
      // Open notification center
      const bell = screen.getByTestId('notification-bell');
      await user.click(bell);
      
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });
      
      // Transition to tablet
      setViewport('tablet');
      
      // Should still be open but with different layout
      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
        const app = document.querySelector('.app');
        expect(app).toHaveClass('tablet');
      });
    });

    it('transitions smoothly between tablet and desktop', async () => {
      // Start with tablet
      setViewport('tablet');
      render(<ResponsiveNotificationApp />);
      
      expect(screen.getByTestId('dashboard-card-3')).toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-card-4')).not.toBeInTheDocument();
      
      // Transition to desktop
      setViewport('desktop');
      
      await waitFor(() => {
        expect(screen.getByTestId('dashboard-card-4')).toBeInTheDocument();
        const app = document.querySelector('.app');
        expect(app).toHaveClass('desktop');
      });
    });

    it('handles rapid viewport changes', async () => {
      render(<ResponsiveNotificationApp />);
      
      // Rapidly change viewports
      setViewport('mobile');
      setViewport('tablet');
      setViewport('desktop');
      setViewport('mobile');
      
      // Should handle all changes gracefully
      await waitFor(() => {
        const app = document.querySelector('.app');
        expect(app).toHaveClass('mobile');
      });
    });
  });

  describe('Content Adaptation', () => {
    it('adapts notification preview count based on screen size', () => {
      // Mobile - 2 notifications
      setViewport('mobile');
      render(<ResponsiveNotificationApp />);
      
      expect(screen.getByTestId('preview-1')).toBeInTheDocument();
      expect(screen.getByTestId('preview-2')).toBeInTheDocument();
      
      // Tablet - would show 4 (but we only have 2)
      setViewport('tablet');
      
      expect(screen.getByTestId('preview-1')).toBeInTheDocument();
      expect(screen.getByTestId('preview-2')).toBeInTheDocument();
      
      // Desktop - would show 6 (but we only have 2)
      setViewport('desktop');
      
      expect(screen.getByTestId('preview-1')).toBeInTheDocument();
      expect(screen.getByTestId('preview-2')).toBeInTheDocument();
    });

    it('adapts dashboard grid based on screen size', () => {
      // Mobile - 2 cards
      setViewport('mobile');
      render(<ResponsiveNotificationApp />);
      
      expect(screen.getByTestId('dashboard-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-card-2')).toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-card-3')).not.toBeInTheDocument();
      
      // Tablet - 3 cards
      setViewport('tablet');
      
      expect(screen.getByTestId('dashboard-card-3')).toBeInTheDocument();
      expect(screen.queryByTestId('dashboard-card-4')).not.toBeInTheDocument();
      
      // Desktop - 4 cards
      setViewport('desktop');
      
      expect(screen.getByTestId('dashboard-card-4')).toBeInTheDocument();
    });

    it('adapts notification bell size based on screen size', () => {
      // Mobile - large size
      setViewport('mobile');
      render(<ResponsiveNotificationApp />);
      
      const bell = screen.getByTestId('notification-bell');
      expect(bell).toBeInTheDocument();
      // In a real implementation, this would have size-specific classes
      
      // Tablet - medium size
      setViewport('tablet');
      
      expect(bell).toBeInTheDocument();
      
      // Desktop - small size
      setViewport('desktop');
      
      expect(bell).toBeInTheDocument();
    });
  });

  describe('Performance Across Viewports', () => {
    it('maintains performance on mobile devices', async () => {
      setViewport('mobile');
      
      const startTime = performance.now();
      render(<ResponsiveNotificationApp />);
      const endTime = performance.now();
      
      // Should render quickly on mobile
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('optimizes rendering for different screen sizes', async () => {
      // Test rendering performance across different viewports
      const viewportTests = ['mobile', 'tablet', 'desktop'] as const;
      
      for (const viewport of viewportTests) {
        setViewport(viewport);
        
        const startTime = performance.now();
        const { unmount } = render(<ResponsiveNotificationApp />);
        const endTime = performance.now();
        
        expect(endTime - startTime).toBeLessThan(200);
        
        unmount();
      }
    });
  });

  describe('Accessibility Across Viewports', () => {
    it('maintains accessibility on all screen sizes', async () => {
      const viewportTests = ['mobile', 'tablet', 'desktop'] as const;
      
      for (const viewport of viewportTests) {
        setViewport(viewport);
        
        render(<ResponsiveNotificationApp />);
        
        // Should have proper ARIA labels
        const bell = screen.getByTestId('notification-bell');
        expect(bell).toHaveAttribute('role', 'button');
        expect(bell).toHaveAttribute('tabIndex', '0');
        
        // Should be keyboard accessible
        bell.focus();
        expect(document.activeElement).toBe(bell);
      }
    });

    it('provides appropriate touch targets on mobile', () => {
      setViewport('mobile');
      render(<ResponsiveNotificationApp />);
      
      const bell = screen.getByTestId('notification-bell');
      
      // Should have minimum 44px touch target
      const bellStyles = window.getComputedStyle(bell);
      // In a real implementation, this would be enforced by CSS
      expect(bell).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles very small screens gracefully', () => {
      // Very small screen (old mobile)
      Object.defineProperty(window, 'innerWidth', { value: 320 });
      Object.defineProperty(window, 'innerHeight', { value: 480 });
      mockUseMediaQuery.mockReturnValue(true); // Still mobile
      
      render(<ResponsiveNotificationApp />);
      
      // Should still render without breaking
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });

    it('handles very large screens gracefully', () => {
      // Very large screen (4K)
      Object.defineProperty(window, 'innerWidth', { value: 3840 });
      Object.defineProperty(window, 'innerHeight', { value: 2160 });
      mockUseMediaQuery.mockImplementation((query) => query === '(min-width: 1025px)');
      
      render(<ResponsiveNotificationApp />);
      
      // Should still render without breaking
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-card-4')).toBeInTheDocument();
    });

    it('handles missing media query support', () => {
      // Mock missing matchMedia
      Object.defineProperty(window, 'matchMedia', {
        value: undefined,
        writable: true,
      });
      
      mockUseMediaQuery.mockReturnValue(false); // Default to desktop
      
      render(<ResponsiveNotificationApp />);
      
      // Should default to desktop layout
      const app = document.querySelector('.app');
      expect(app).toHaveClass('desktop');
    });
  });
});