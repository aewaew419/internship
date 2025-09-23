'use client';

import { apiClient } from '../client';
import { PROTECTED_PATH } from '../../../constants/api-routes';
import type {
  NotificationEngagementEvent,
  NotificationEngagementMetrics,
  UserEngagementProfile,
  EngagementAnalytics
} from '../../notifications/engagement-tracking';
import type { NotificationType } from '../../../types/notifications';

export interface EngagementEventBatch {
  events: NotificationEngagementEvent[];
  timestamp: number;
  userId: number;
}

export interface EngagementReportRequest {
  timeRange?: {
    start: number;
    end: number;
  };
  userId?: number;
  notificationType?: NotificationType;
  includeUserProfiles?: boolean;
}

export interface EngagementReportResponse {
  analytics: EngagementAnalytics;
  userProfiles?: UserEngagementProfile[];
  generatedAt: number;
}

export interface OptimizationRecommendation {
  type: 'timing' | 'frequency' | 'content' | 'targeting';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  implementation: string;
  expectedImprovement: number; // percentage
}

export interface OptimizationReport {
  userId?: number;
  recommendations: OptimizationRecommendation[];
  currentScore: number;
  potentialScore: number;
  generatedAt: number;
}

/**
 * Service for managing notification engagement analytics
 */
export class EngagementService {
  /**
   * Send engagement events to backend in batches
   */
  async sendEngagementEvents(events: NotificationEngagementEvent[]): Promise<void> {
    try {
      const batch: EngagementEventBatch = {
        events,
        timestamp: Date.now(),
        userId: events[0]?.userId || 0
      };

      await apiClient.getAxiosInstance().post(
        `${PROTECTED_PATH.NOTIFICATIONS}/engagement/events`,
        batch
      );

      console.log(`Sent ${events.length} engagement events to backend`);
    } catch (error) {
      console.error('Failed to send engagement events:', error);
      throw this.handleApiError(error, 'Failed to send engagement events');
    }
  }

  /**
   * Get engagement analytics report
   */
  async getEngagementReport(request: EngagementReportRequest = {}): Promise<EngagementReportResponse> {
    try {
      const response = await apiClient.getAxiosInstance().post(
        `${PROTECTED_PATH.NOTIFICATIONS}/engagement/report`,
        request
      );

      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to get engagement report');
    }
  }

  /**
   * Get user engagement profile from backend
   */
  async getUserEngagementProfile(userId: number): Promise<UserEngagementProfile> {
    try {
      const response = await apiClient.getAxiosInstance().get(
        `${PROTECTED_PATH.NOTIFICATIONS}/engagement/users/${userId}`
      );

      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to get user engagement profile');
    }
  }

  /**
   * Get notification type performance metrics
   */
  async getTypeMetrics(
    type: NotificationType,
    timeRange?: { start: number; end: number }
  ): Promise<NotificationEngagementMetrics> {
    try {
      const params = timeRange ? {
        start: timeRange.start,
        end: timeRange.end
      } : {};

      const response = await apiClient.getAxiosInstance().get(
        `${PROTECTED_PATH.NOTIFICATIONS}/engagement/types/${type}`,
        { params }
      );

      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to get type metrics');
    }
  }

  /**
   * Get optimization recommendations for notifications
   */
  async getOptimizationRecommendations(userId?: number): Promise<OptimizationReport> {
    try {
      const params = userId ? { userId } : {};

      const response = await apiClient.getAxiosInstance().get(
        `${PROTECTED_PATH.NOTIFICATIONS}/engagement/optimize`,
        { params }
      );

      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to get optimization recommendations');
    }
  }

  /**
   * Update user notification preferences based on engagement data
   */
  async updatePreferencesFromEngagement(userId: number): Promise<void> {
    try {
      await apiClient.getAxiosInstance().post(
        `${PROTECTED_PATH.NOTIFICATIONS}/engagement/users/${userId}/optimize-preferences`
      );

      console.log('Updated user preferences based on engagement data');
    } catch (error) {
      throw this.handleApiError(error, 'Failed to update preferences from engagement');
    }
  }

  /**
   * Get A/B test results for notification variations
   */
  async getABTestResults(testId: string): Promise<{
    testId: string;
    variants: Array<{
      id: string;
      name: string;
      metrics: NotificationEngagementMetrics;
      sampleSize: number;
    }>;
    winner?: string;
    confidence: number;
    status: 'running' | 'completed' | 'paused';
  }> {
    try {
      const response = await apiClient.getAxiosInstance().get(
        `${PROTECTED_PATH.NOTIFICATIONS}/engagement/ab-tests/${testId}`
      );

      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to get A/B test results');
    }
  }

  /**
   * Create a new A/B test for notification optimization
   */
  async createABTest(test: {
    name: string;
    description: string;
    variants: Array<{
      name: string;
      config: Record<string, any>;
      trafficPercentage: number;
    }>;
    targetAudience?: {
      userIds?: number[];
      notificationTypes?: NotificationType[];
      criteria?: Record<string, any>;
    };
    duration: number; // in days
  }): Promise<{ testId: string }> {
    try {
      const response = await apiClient.getAxiosInstance().post(
        `${PROTECTED_PATH.NOTIFICATIONS}/engagement/ab-tests`,
        test
      );

      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to create A/B test');
    }
  }

  /**
   * Get engagement heatmap data for timing optimization
   */
  async getEngagementHeatmap(userId?: number): Promise<{
    hourly: Record<number, number>; // hour -> engagement score
    daily: Record<number, number>; // day of week -> engagement score
    monthly: Record<number, number>; // day of month -> engagement score
  }> {
    try {
      const params = userId ? { userId } : {};

      const response = await apiClient.getAxiosInstance().get(
        `${PROTECTED_PATH.NOTIFICATIONS}/engagement/heatmap`,
        { params }
      );

      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to get engagement heatmap');
    }
  }

  /**
   * Get notification fatigue analysis
   */
  async getFatigueAnalysis(userId: number): Promise<{
    fatigueScore: number; // 0-100, higher = more fatigued
    optimalFrequency: 'high' | 'medium' | 'low';
    recommendedPause: number; // hours
    burnoutRisk: 'low' | 'medium' | 'high';
    suggestions: string[];
  }> {
    try {
      const response = await apiClient.getAxiosInstance().get(
        `${PROTECTED_PATH.NOTIFICATIONS}/engagement/users/${userId}/fatigue`
      );

      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to get fatigue analysis');
    }
  }

  /**
   * Export engagement data for external analysis
   */
  async exportEngagementData(
    format: 'csv' | 'json' | 'xlsx',
    timeRange?: { start: number; end: number },
    filters?: {
      userId?: number;
      notificationTypes?: NotificationType[];
      includePersonalData?: boolean;
    }
  ): Promise<Blob> {
    try {
      const params = {
        format,
        ...timeRange,
        ...filters
      };

      const response = await apiClient.getAxiosInstance().get(
        `${PROTECTED_PATH.NOTIFICATIONS}/engagement/export`,
        {
          params,
          responseType: 'blob'
        }
      );

      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to export engagement data');
    }
  }

  /**
   * Get real-time engagement metrics
   */
  async getRealTimeMetrics(): Promise<{
    activeUsers: number;
    notificationsDelivered: number;
    openRate: number;
    clickRate: number;
    lastUpdated: number;
  }> {
    try {
      const response = await apiClient.getAxiosInstance().get(
        `${PROTECTED_PATH.NOTIFICATIONS}/engagement/realtime`
      );

      return response.data;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to get real-time metrics');
    }
  }

  /**
   * Send engagement events with retry mechanism
   */
  async sendEngagementEventsWithRetry(events: NotificationEngagementEvent[]): Promise<void> {
    return apiClient.retryRequest(() => this.sendEngagementEvents(events));
  }

  /**
   * Batch multiple engagement operations for efficiency
   */
  async batchEngagementOperations(operations: Array<() => Promise<any>>): Promise<any[]> {
    try {
      const batchSize = 3; // Smaller batch size for analytics operations
      const results: any[] = [];

      for (let i = 0; i < operations.length; i += batchSize) {
        const batch = operations.slice(i, i + batchSize);
        const batchResults = await Promise.allSettled(batch.map(op => op()));
        results.push(...batchResults);
      }

      return results;
    } catch (error) {
      throw this.handleApiError(error, 'Failed to execute batch engagement operations');
    }
  }

  /**
   * Handle API errors and provide meaningful error messages
   */
  private handleApiError(error: any, defaultMessage: string): Error {
    if (error?.response?.data?.message) {
      return new Error(error.response.data.message);
    }

    if (error?.message) {
      return new Error(error.message);
    }

    return new Error(defaultMessage);
  }
}

// Export singleton instance
export const engagementService = new EngagementService();

/**
 * Enhanced engagement tracker that syncs with backend
 */
export class BackendSyncedEngagementTracker {
  private pendingEvents: NotificationEngagementEvent[] = [];
  private syncInterval: number = 60000; // 1 minute
  private syncTimer?: NodeJS.Timeout;
  private maxBatchSize: number = 100;

  constructor(private service: EngagementService = engagementService) {}

  /**
   * Start syncing engagement events with backend
   */
  startSync(): void {
    this.syncTimer = setInterval(() => {
      this.syncPendingEvents();
    }, this.syncInterval);

    // Also sync on page visibility change
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.syncPendingEvents();
        }
      });
    }

    // Sync before page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.syncPendingEvents();
      });
    }
  }

  /**
   * Stop syncing
   */
  stopSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }

    // Final sync
    this.syncPendingEvents();
  }

  /**
   * Add event to pending queue
   */
  queueEvent(event: NotificationEngagementEvent): void {
    this.pendingEvents.push(event);

    // Auto-sync if batch is full
    if (this.pendingEvents.length >= this.maxBatchSize) {
      this.syncPendingEvents();
    }
  }

  /**
   * Sync pending events with backend
   */
  private async syncPendingEvents(): Promise<void> {
    if (this.pendingEvents.length === 0) return;

    try {
      const eventsToSync = [...this.pendingEvents];
      this.pendingEvents = [];

      await this.service.sendEngagementEventsWithRetry(eventsToSync);
      console.log(`Synced ${eventsToSync.length} engagement events with backend`);
    } catch (error) {
      console.error('Failed to sync engagement events:', error);
      // Re-queue events for retry
      this.pendingEvents.unshift(...this.pendingEvents);
    }
  }
}

// Export backend-synced tracker instance
export const backendSyncedTracker = new BackendSyncedEngagementTracker();