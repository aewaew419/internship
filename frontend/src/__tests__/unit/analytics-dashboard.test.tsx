/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AnalyticsDashboard } from '../../components/notifications/AnalyticsDashboard/AnalyticsDashboard';
import { engagementService } from '../../lib/api/services/engagement.service';
import * as engagementHooks from '../../hooks/useNotificationEngagement';

// Mock the engagement service
jest.mock('../../lib/api/services/engagement.service');
const mockEngagementService = engagementService as jest.Mocked<typeof engagementService>;

// Mock the hooks
jest.mock('../../hooks/useNotificationEngagement');
const mockEngagementHooks = engagementHooks as jest.Mocked<typeof engagementHooks>;

// Mock data
const mockAnalytics = {
  overall: {
    totalNotifications: 1250,
    deliveryRate: 0.98,
    openRate: 0.65,
    clickThroughRate: 0.32,
    averageEngagementTime: 45000
  },
  byType: {
    ASSIGNMENT_CHANGE: {
      notificationId: '',
      type: 'ASSIGNMENT_CHANGE' as const,
      category: 'ACADEMIC' as const,
      deliveryRate: 0.99,
      openRate: 0.72,
      clickThroughRate: 0.38,
      actionClickRate: 0.15,
      dismissalRate: 0.12,
      averageTimeToOpen: 30000,
      averageTimeToAction: 15000,
      engagementScore: 85
    }
  },
  byCategory: {
    ACADEMIC: {
      notificationId: '',
      type: 'ASSIGNMENT_CHANGE' as const,
      category: 'ACADEMIC' as const,
      deliveryRate: 0.98,
      openRate: 0.68,
      clickThroughRate: 0.35,
      actionClickRate: 0.18,
      dismissalRate: 0.15,
      averageTimeToOpen: 32000,
      averageTimeToAction: 18000,
      engagementScore: 82
    }
  },
  byTimeOfDay: {
    9: {
      notificationId: '',
      type: 'ASSIGNMENT_CHANGE' as const,
      category: 'ACADEMIC' as const,
      deliveryRate: 0.97,
      openRate: 0.75,
      clickThroughRate: 0.42,
      actionClickRate: 0.22,
      dismissalRate: 0.08,
      averageTimeToOpen: 25000,
      averageTimeToAction: 12000,
      engagementScore: 92
    }
  },
  byDayOfWeek: {
    1: {
      notificationId: '',
      type: 'ASSIGNMENT_CHANGE' as const,
      category: 'ACADEMIC' as const,
      deliveryRate: 0.96,
      openRate: 0.70,
      clickThroughRate: 0.36,
      actionClickRate: 0.19,
      dismissalRate: 0.12,
      averageTimeToOpen: 28000,
      averageTimeToAction: 16000,
      engagementScore: 88
    }
  },
  trends: {
    period: 'daily' as const,
    data: [
      {
        date: '2024-01-01',
        metrics: {
          notificationId: '',
          type: 'ASSIGNMENT_CHANGE' as const,
          category: 'ACADEMIC' as const,
          deliveryRate: 0.95,
          openRate: 0.62,
          clickThroughRate: 0.30,
          actionClickRate: 0.14,
          dismissalRate: 0.18,
          averageTimeToOpen: 35000,
          averageTimeToAction: 20000,
          engagementScore: 78
        }
      }
    ]
  }
};

const mockRealTimeMetrics = {
  activeUsers: 1250,
  notificationsDelivered: 3420,
  openRate: 0.68,
  clickRate: 0.34,
  lastUpdated: Date.now() - 30000
};

const mockRecommendations = [
  {
    type: 'timing' as const,
    title: 'Optimize Send Time',
    description: 'Send notifications at 9 AM for better engagement',
    impact: 'high' as const,
    implementation: 'Update notification scheduler to prefer 9 AM delivery',
    expectedImprovement: 15
  },
  {
    type: 'content' as const,
    title: 'Improve Content Length',
    description: 'Shorter notification bodies perform better',
    impact: 'medium' as const,
    implementation: 'Limit notification body to 100 characters',
    expectedImprovement: 8
  }
];

describe('AnalyticsDashboard', () => {
  beforeEach(() => {
    // Mock the useEngagementAnalytics hook
    mockEngagementHooks.useEngagementAnalytics.mockReturnValue({
      analytics: mockAnalytics,
      loading: false,
      error: null,
      refresh: jest.fn()
    });

    // Mock service methods
    mockEngagementService.getRealTimeMetrics.mockResolvedValue(mockRealTimeMetrics);
    mockEngagementService.getOptimizationRecommendations.mockResolvedValue({
      userId: undefined,
      recommendations: mockRecommendations,
      currentScore: 75,
      potentialScore: 88,
      generatedAt: Date.now()
    });
    mockEngagementService.exportEngagementData.mockResolvedValue(new Blob(['test data'], { type: 'text/csv' }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders dashboard header', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Notification Analytics Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Monitor and optimize your notification performance')).toBeInTheDocument();
      });
    });

    test('renders time range selector', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        const selector = screen.getByDisplayValue('Last 7 Days');
        expect(selector).toBeInTheDocument();
      });
    });

    test('renders export dropdown', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        const exportSelect = screen.getByDisplayValue('Export Data');
        expect(exportSelect).toBeInTheDocument();
      });
    });
  });

  describe('Real-Time Metrics', () => {
    test('displays real-time metrics card', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Real-Time Metrics')).toBeInTheDocument();
        expect(screen.getByText('1,250')).toBeInTheDocument(); // Active Users
        expect(screen.getByText('3,420')).toBeInTheDocument(); // Notifications Delivered
        expect(screen.getByText('68.0%')).toBeInTheDocument(); // Open Rate
        expect(screen.getByText('34.0%')).toBeInTheDocument(); // Click Rate
      });
    });

    test('shows last updated time', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/ago/)).toBeInTheDocument();
      });
    });
  });

  describe('System Health', () => {
    test('displays system health monitor', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('System Health')).toBeInTheDocument();
        expect(screen.getByText('HEALTHY')).toBeInTheDocument();
      });
    });
  });

  describe('Optimization Recommendations', () => {
    test('displays recommendations', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Optimization Recommendations')).toBeInTheDocument();
        expect(screen.getByText('Optimize Send Time')).toBeInTheDocument();
        expect(screen.getByText('Improve Content Length')).toBeInTheDocument();
      });
    });

    test('shows impact levels and expected improvements', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('high impact')).toBeInTheDocument();
        expect(screen.getByText('medium impact')).toBeInTheDocument();
        expect(screen.getByText('+15%')).toBeInTheDocument();
        expect(screen.getByText('+8%')).toBeInTheDocument();
      });
    });
  });

  describe('A/B Test Results', () => {
    test('displays A/B test section', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('A/B Test Results')).toBeInTheDocument();
      });
    });

    test('shows message when no tests are running', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('No A/B tests running. Create a test to optimize your notifications.')).toBeInTheDocument();
      });
    });
  });

  describe('Key Insights', () => {
    test('displays key insights section', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Key Insights')).toBeInTheDocument();
      });
    });

    test('shows best performing type', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/Best Performing Type:/)).toBeInTheDocument();
        expect(screen.getByText(/Assignment Change/)).toBeInTheDocument();
      });
    });

    test('shows peak engagement time', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/Peak Engagement Time:/)).toBeInTheDocument();
        expect(screen.getByText(/9:00/)).toBeInTheDocument();
      });
    });

    test('shows overall performance assessment', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/Overall Performance:/)).toBeInTheDocument();
        expect(screen.getByText(/Excellent/)).toBeInTheDocument();
      });
    });
  });

  describe('Interactions', () => {
    test('changes time range when selector is used', async () => {
      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        const selector = screen.getByDisplayValue('Last 7 Days');
        fireEvent.change(selector, { target: { value: '30d' } });
        expect(selector).toHaveValue('30d');
      });
    });

    test('triggers export when export option is selected', async () => {
      // Mock URL.createObjectURL and related functions
      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      global.URL.revokeObjectURL = jest.fn();
      
      const mockAppendChild = jest.fn();
      const mockRemoveChild = jest.fn();
      const mockClick = jest.fn();
      
      document.body.appendChild = mockAppendChild;
      document.body.removeChild = mockRemoveChild;
      
      // Mock createElement to return an element with click method
      const originalCreateElement = document.createElement;
      document.createElement = jest.fn((tagName) => {
        if (tagName === 'a') {
          return {
            href: '',
            download: '',
            click: mockClick
          } as any;
        }
        return originalCreateElement.call(document, tagName);
      });

      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        const exportSelect = screen.getByDisplayValue('Export Data');
        fireEvent.change(exportSelect, { target: { value: 'csv' } });
      });

      await waitFor(() => {
        expect(mockEngagementService.exportEngagementData).toHaveBeenCalledWith(
          'csv',
          expect.any(Object)
        );
      });

      // Restore original functions
      document.createElement = originalCreateElement;
    });

    test('refreshes data when refresh button is clicked', async () => {
      const mockRefresh = jest.fn();
      mockEngagementHooks.useEngagementAnalytics.mockReturnValue({
        analytics: mockAnalytics,
        loading: false,
        error: null,
        refresh: mockRefresh
      });

      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        const refreshButton = screen.getByText('Refresh Data');
        fireEvent.click(refreshButton);
        expect(mockRefresh).toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    test('shows loading state', () => {
      mockEngagementHooks.useEngagementAnalytics.mockReturnValue({
        analytics: null,
        loading: true,
        error: null,
        refresh: jest.fn()
      });

      render(<AnalyticsDashboard />);
      
      expect(screen.getByTestId('loading-skeleton') || document.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    test('shows error state', async () => {
      mockEngagementHooks.useEngagementAnalytics.mockReturnValue({
        analytics: null,
        loading: false,
        error: 'Failed to load analytics',
        refresh: jest.fn()
      });

      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Error Loading Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Failed to load analytics')).toBeInTheDocument();
      });
    });

    test('shows retry button in error state', async () => {
      const mockRefresh = jest.fn();
      mockEngagementHooks.useEngagementAnalytics.mockReturnValue({
        analytics: null,
        loading: false,
        error: 'Failed to load analytics',
        refresh: mockRefresh
      });

      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        const retryButton = screen.getByText('Retry');
        fireEvent.click(retryButton);
        expect(mockRefresh).toHaveBeenCalled();
      });
    });
  });

  describe('Empty States', () => {
    test('shows empty state when no analytics data', async () => {
      mockEngagementHooks.useEngagementAnalytics.mockReturnValue({
        analytics: null,
        loading: false,
        error: null,
        refresh: jest.fn()
      });

      render(<AnalyticsDashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('No analytics data available')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    test('applies responsive classes', async () => {
      render(<AnalyticsDashboard className="custom-class" />);
      
      await waitFor(() => {
        const dashboard = screen.getByText('Notification Analytics Dashboard').closest('div');
        expect(dashboard).toHaveClass('custom-class');
      });
    });
  });
});