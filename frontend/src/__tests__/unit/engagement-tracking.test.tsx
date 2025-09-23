/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { 
  NotificationEngagementTracker,
  EngagementEventType,
  notificationEngagementTracker
} from '../../lib/notifications/engagement-tracking';
import { useNotificationEngagement, useNotificationTracker } from '../../hooks/useNotificationEngagement';
import { NotificationType, NotificationCategory, Notification } from '../../types/notifications';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock notification data
const mockNotification: Notification = {
  id: 'test-notification-1',
  userId: 123,
  type: NotificationType.ASSIGNMENT_CHANGE,
  title: 'Test Notification',
  body: 'This is a test notification',
  priority: 'normal',
  category: NotificationCategory.ACADEMIC,
  isRead: false,
  createdAt: new Date().toISOString(),
  actions: [
    {
      id: 'action-1',
      title: 'View Details',
      action: 'view',
      url: '/details'
    }
  ]
};

describe('NotificationEngagementTracker', () => {
  let tracker: NotificationEngagementTracker;

  beforeEach(() => {
    tracker = NotificationEngagementTracker.getInstance();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
  });

  afterEach(() => {
    tracker.stopTracking();
    jest.clearAllMocks();
  });

  describe('Basic Tracking', () => {
    test('should track notification delivery', () => {
      tracker.startTracking();
      
      act(() => {
        tracker.trackDelivery(mockNotification);
      });

      const metrics = tracker.getNotificationMetrics(mockNotification.id);
      expect(metrics).toBeTruthy();
      expect(metrics?.notificationId).toBe(mockNotification.id);
    });

    test('should track notification display', () => {
      tracker.startTracking();
      
      act(() => {
        tracker.trackDelivery(mockNotification);
        tracker.trackDisplay(mockNotification);
      });

      const metrics = tracker.getNotificationMetrics(mockNotification.id);
      expect(metrics?.deliveryRate).toBeGreaterThan(0);
    });

    test('should track notification open', () => {
      tracker.startTracking();
      
      act(() => {
        tracker.trackDelivery(mockNotification);
        tracker.trackDisplay(mockNotification);
        tracker.trackOpen(mockNotification, 5000);
      });

      const metrics = tracker.getNotificationMetrics(mockNotification.id);
      expect(metrics?.openRate).toBeGreaterThan(0);
      expect(metrics?.averageTimeToOpen).toBe(5000);
    });

    test('should track notification click', () => {
      tracker.startTracking();
      
      act(() => {
        tracker.trackDelivery(mockNotification);
        tracker.trackDisplay(mockNotification);
        tracker.trackOpen(mockNotification);
        tracker.trackClick(mockNotification, 'notification_center');
      });

      const metrics = tracker.getNotificationMetrics(mockNotification.id);
      expect(metrics?.clickThroughRate).toBeGreaterThan(0);
    });

    test('should track action clicks', () => {
      tracker.startTracking();
      
      act(() => {
        tracker.trackDelivery(mockNotification);
        tracker.trackDisplay(mockNotification);
        tracker.trackOpen(mockNotification);
        tracker.trackClick(mockNotification);
        tracker.trackActionClick(mockNotification, 'action-1', 'View Details');
      });

      const metrics = tracker.getNotificationMetrics(mockNotification.id);
      expect(metrics?.actionClickRate).toBeGreaterThan(0);
    });

    test('should track notification dismissal', () => {
      tracker.startTracking();
      
      act(() => {
        tracker.trackDelivery(mockNotification);
        tracker.trackDisplay(mockNotification);
        tracker.trackDismissal(mockNotification, 'swipe');
      });

      const metrics = tracker.getNotificationMetrics(mockNotification.id);
      expect(metrics?.dismissalRate).toBeGreaterThan(0);
    });
  });

  describe('Metrics Calculation', () => {
    test('should calculate engagement score correctly', () => {
      tracker.startTracking();
      
      act(() => {
        tracker.trackDelivery(mockNotification);
        tracker.trackDisplay(mockNotification);
        tracker.trackOpen(mockNotification);
        tracker.trackClick(mockNotification);
        tracker.trackActionClick(mockNotification, 'action-1', 'View Details');
      });

      const metrics = tracker.getNotificationMetrics(mockNotification.id);
      expect(metrics?.engagementScore).toBeGreaterThan(0);
      expect(metrics?.engagementScore).toBeLessThanOrEqual(100);
    });

    test('should calculate rates correctly', () => {
      tracker.startTracking();
      
      act(() => {
        // Perfect engagement scenario
        tracker.trackDelivery(mockNotification);
        tracker.trackDisplay(mockNotification);
        tracker.trackOpen(mockNotification);
        tracker.trackClick(mockNotification);
      });

      const metrics = tracker.getNotificationMetrics(mockNotification.id);
      expect(metrics?.deliveryRate).toBe(1); // 100% delivery
      expect(metrics?.openRate).toBe(1); // 100% open
      expect(metrics?.clickThroughRate).toBe(1); // 100% click
    });
  });

  describe('User Profile', () => {
    test('should create user engagement profile', () => {
      tracker.startTracking();
      
      act(() => {
        tracker.trackDelivery(mockNotification);
        tracker.trackDisplay(mockNotification);
        tracker.trackOpen(mockNotification);
      });

      const profile = tracker.getUserProfile(mockNotification.userId);
      expect(profile).toBeTruthy();
      expect(profile?.userId).toBe(mockNotification.userId);
      expect(profile?.totalNotifications).toBe(1);
      expect(profile?.openRate).toBe(1);
    });

    test('should calculate preferred notification types', () => {
      tracker.startTracking();
      
      act(() => {
        // Track multiple notifications of same type with high engagement
        for (let i = 0; i < 3; i++) {
          const notification = { ...mockNotification, id: `test-${i}` };
          tracker.trackDelivery(notification);
          tracker.trackDisplay(notification);
          tracker.trackOpen(notification);
        }
      });

      const preferences = tracker.getPreferenceAnalysis(mockNotification.userId);
      expect(preferences.preferredTypes).toContain(NotificationType.ASSIGNMENT_CHANGE);
    });

    test('should calculate optimal timing', () => {
      tracker.startTracking();
      
      act(() => {
        tracker.trackDelivery(mockNotification);
        tracker.trackDisplay(mockNotification);
        tracker.trackOpen(mockNotification);
      });

      const profile = tracker.getUserProfile(mockNotification.userId);
      expect(profile?.optimalTiming).toBeTruthy();
      expect(typeof profile?.optimalTiming.hour).toBe('number');
      expect(typeof profile?.optimalTiming.dayOfWeek).toBe('number');
    });
  });

  describe('Analytics', () => {
    test('should generate overall analytics', () => {
      tracker.startTracking();
      
      act(() => {
        tracker.trackDelivery(mockNotification);
        tracker.trackDisplay(mockNotification);
        tracker.trackOpen(mockNotification);
      });

      const analytics = tracker.getEngagementAnalytics();
      expect(analytics.overall).toBeTruthy();
      expect(analytics.overall.totalNotifications).toBe(1);
      expect(analytics.byType).toBeTruthy();
      expect(analytics.byCategory).toBeTruthy();
    });

    test('should filter analytics by time range', () => {
      tracker.startTracking();
      
      const now = Date.now();
      const timeRange = { start: now - 86400000, end: now }; // Last 24 hours
      
      act(() => {
        tracker.trackDelivery(mockNotification);
        tracker.trackDisplay(mockNotification);
      });

      const analytics = tracker.getEngagementAnalytics(timeRange);
      expect(analytics.overall.totalNotifications).toBe(1);
    });

    test('should calculate metrics by notification type', () => {
      tracker.startTracking();
      
      act(() => {
        tracker.trackDelivery(mockNotification);
        tracker.trackDisplay(mockNotification);
        tracker.trackOpen(mockNotification);
      });

      const typeMetrics = tracker.getTypeMetrics(NotificationType.ASSIGNMENT_CHANGE);
      expect(typeMetrics.type).toBe(NotificationType.ASSIGNMENT_CHANGE);
      expect(typeMetrics.openRate).toBeGreaterThan(0);
    });
  });

  describe('Data Persistence', () => {
    test('should store events in localStorage', () => {
      tracker.startTracking();
      
      act(() => {
        tracker.trackDelivery(mockNotification);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'notification_engagement_events',
        expect.any(String)
      );
    });

    test('should load stored events on initialization', () => {
      const storedEvents = JSON.stringify([
        {
          id: 'event-1',
          notificationId: mockNotification.id,
          userId: mockNotification.userId,
          eventType: EngagementEventType.DELIVERED,
          timestamp: Date.now(),
          metadata: {
            type: mockNotification.type,
            category: mockNotification.category
          }
        }
      ]);

      localStorageMock.getItem.mockReturnValue(storedEvents);
      
      const newTracker = new (NotificationEngagementTracker as any)();
      const metrics = newTracker.getNotificationMetrics(mockNotification.id);
      
      expect(metrics).toBeTruthy();
    });
  });
});

describe('useNotificationEngagement hook', () => {
  test('should provide tracking functions', () => {
    const { result } = renderHook(() => useNotificationEngagement());

    expect(result.current.trackDelivery).toBeDefined();
    expect(result.current.trackDisplay).toBeDefined();
    expect(result.current.trackOpen).toBeDefined();
    expect(result.current.trackClick).toBeDefined();
    expect(result.current.trackActionClick).toBeDefined();
    expect(result.current.trackDismissal).toBeDefined();
  });

  test('should provide analytics functions', () => {
    const { result } = renderHook(() => useNotificationEngagement());

    expect(result.current.getAnalytics).toBeDefined();
    expect(result.current.getUserProfile).toBeDefined();
    expect(result.current.getPreferences).toBeDefined();
    expect(result.current.getTypeMetrics).toBeDefined();
  });

  test('should start tracking automatically', () => {
    const { result } = renderHook(() => useNotificationEngagement());

    expect(result.current.isTracking).toBe(true);
  });
});

describe('useNotificationTracker hook', () => {
  test('should auto-track delivery on mount', () => {
    const trackDeliverySpy = jest.spyOn(notificationEngagementTracker, 'trackDelivery');
    
    renderHook(() => useNotificationTracker(mockNotification));

    expect(trackDeliverySpy).toHaveBeenCalledWith(mockNotification);
    
    trackDeliverySpy.mockRestore();
  });

  test('should provide event handlers', () => {
    const { result } = renderHook(() => useNotificationTracker(mockNotification));

    expect(result.current.handleDisplay).toBeDefined();
    expect(result.current.handleOpen).toBeDefined();
    expect(result.current.handleClick).toBeDefined();
    expect(result.current.handleActionClick).toBeDefined();
    expect(result.current.handleDismissal).toBeDefined();
  });

  test('should calculate time to open correctly', () => {
    const trackOpenSpy = jest.spyOn(notificationEngagementTracker, 'trackOpen');
    
    const { result } = renderHook(() => useNotificationTracker(mockNotification));

    act(() => {
      result.current.handleOpen();
    });

    expect(trackOpenSpy).toHaveBeenCalledWith(
      mockNotification,
      expect.any(Number)
    );
    
    trackOpenSpy.mockRestore();
  });
});