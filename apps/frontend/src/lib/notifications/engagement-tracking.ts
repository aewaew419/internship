/**
 * Notification Engagement Tracking System
 * 
 * Tracks notification delivery, open rates, click-through rates, and user engagement
 * metrics for different notification types to optimize notification effectiveness.
 */

import { NotificationType, NotificationCategory, Notification } from '../../types/notifications';

// Engagement tracking interfaces
export interface NotificationEngagementEvent {
  id: string;
  notificationId: string;
  userId: number;
  eventType: EngagementEventType;
  timestamp: number;
  metadata?: Record<string, any>;
}

export enum EngagementEventType {
  DELIVERED = 'delivered',
  DISPLAYED = 'displayed',
  OPENED = 'opened',
  CLICKED = 'clicked',
  ACTION_CLICKED = 'action_clicked',
  DISMISSED = 'dismissed',
  EXPIRED = 'expired'
}

export interface NotificationEngagementMetrics {
  notificationId: string;
  type: NotificationType;
  category: NotificationCategory;
  deliveryRate: number;
  openRate: number;
  clickThroughRate: number;
  actionClickRate: number;
  dismissalRate: number;
  averageTimeToOpen: number;
  averageTimeToAction: number;
  engagementScore: number;
}

export interface UserEngagementProfile {
  userId: number;
  totalNotifications: number;
  openRate: number;
  clickThroughRate: number;
  preferredTypes: NotificationType[];
  optimalTiming: {
    hour: number;
    dayOfWeek: number;
  };
  engagementTrend: 'increasing' | 'decreasing' | 'stable';
  lastEngagement: number;
}

export interface EngagementAnalytics {
  overall: {
    totalNotifications: number;
    deliveryRate: number;
    openRate: number;
    clickThroughRate: number;
    averageEngagementTime: number;
  };
  byType: Record<NotificationType, NotificationEngagementMetrics>;
  byCategory: Record<NotificationCategory, NotificationEngagementMetrics>;
  byTimeOfDay: Record<number, NotificationEngagementMetrics>;
  byDayOfWeek: Record<number, NotificationEngagementMetrics>;
  trends: {
    period: 'daily' | 'weekly' | 'monthly';
    data: Array<{
      date: string;
      metrics: NotificationEngagementMetrics;
    }>;
  };
}

/**
 * Notification Engagement Tracker
 * Tracks and analyzes user engagement with notifications
 */
export class NotificationEngagementTracker {
  private static instance: NotificationEngagementTracker;
  private events: Map<string, NotificationEngagementEvent[]> = new Map();
  private metrics: Map<string, NotificationEngagementMetrics> = new Map();
  private userProfiles: Map<number, UserEngagementProfile> = new Map();
  private isTracking: boolean = false;
  private batchSize: number = 50;
  private flushInterval: number = 30000; // 30 seconds
  private flushTimer?: NodeJS.Timeout;

  private constructor() {
    this.loadStoredData();
  }

  static getInstance(): NotificationEngagementTracker {
    if (!NotificationEngagementTracker.instance) {
      NotificationEngagementTracker.instance = new NotificationEngagementTracker();
    }
    return NotificationEngagementTracker.instance;
  }

  /**
   * Start engagement tracking
   */
  startTracking(): void {
    if (this.isTracking) return;

    this.isTracking = true;
    this.setupEventListeners();
    this.startBatchFlush();
    
    console.log('Notification engagement tracking started');
  }

  /**
   * Stop engagement tracking
   */
  stopTracking(): void {
    if (!this.isTracking) return;

    this.isTracking = false;
    this.removeEventListeners();
    this.stopBatchFlush();
    this.flushEvents(); // Flush remaining events
    
    console.log('Notification engagement tracking stopped');
  }

  /**
   * Track notification delivery
   */
  trackDelivery(notification: Notification): void {
    this.trackEvent(notification.id, notification.userId, EngagementEventType.DELIVERED, {
      type: notification.type,
      category: notification.category,
      priority: notification.priority
    });
  }

  /**
   * Track notification display (shown to user)
   */
  trackDisplay(notification: Notification): void {
    this.trackEvent(notification.id, notification.userId, EngagementEventType.DISPLAYED, {
      type: notification.type,
      category: notification.category,
      isRead: notification.isRead
    });
  }

  /**
   * Track notification open
   */
  trackOpen(notification: Notification, timeToOpen?: number): void {
    this.trackEvent(notification.id, notification.userId, EngagementEventType.OPENED, {
      type: notification.type,
      category: notification.category,
      timeToOpen,
      source: 'notification_center'
    });
  }

  /**
   * Track notification click
   */
  trackClick(notification: Notification, clickSource: string = 'notification'): void {
    this.trackEvent(notification.id, notification.userId, EngagementEventType.CLICKED, {
      type: notification.type,
      category: notification.category,
      clickSource,
      hasActions: notification.actions && notification.actions.length > 0
    });
  }

  /**
   * Track notification action click
   */
  trackActionClick(notification: Notification, actionId: string, actionTitle: string): void {
    this.trackEvent(notification.id, notification.userId, EngagementEventType.ACTION_CLICKED, {
      type: notification.type,
      category: notification.category,
      actionId,
      actionTitle
    });
  }

  /**
   * Track notification dismissal
   */
  trackDismissal(notification: Notification, dismissalMethod: string = 'manual'): void {
    this.trackEvent(notification.id, notification.userId, EngagementEventType.DISMISSED, {
      type: notification.type,
      category: notification.category,
      dismissalMethod,
      wasRead: notification.isRead
    });
  }

  /**
   * Track notification expiration
   */
  trackExpiration(notification: Notification): void {
    this.trackEvent(notification.id, notification.userId, EngagementEventType.EXPIRED, {
      type: notification.type,
      category: notification.category,
      wasRead: notification.isRead,
      wasClicked: this.hasEvent(notification.id, EngagementEventType.CLICKED)
    });
  }

  /**
   * Get engagement metrics for a specific notification
   */
  getNotificationMetrics(notificationId: string): NotificationEngagementMetrics | null {
    return this.metrics.get(notificationId) || null;
  }

  /**
   * Get user engagement profile
   */
  getUserProfile(userId: number): UserEngagementProfile | null {
    return this.userProfiles.get(userId) || null;
  }

  /**
   * Get overall engagement analytics
   */
  getEngagementAnalytics(timeRange?: { start: number; end: number }): EngagementAnalytics {
    const filteredEvents = this.getFilteredEvents(timeRange);
    
    return {
      overall: this.calculateOverallMetrics(filteredEvents),
      byType: this.calculateMetricsByType(filteredEvents),
      byCategory: this.calculateMetricsByCategory(filteredEvents),
      byTimeOfDay: this.calculateMetricsByTimeOfDay(filteredEvents),
      byDayOfWeek: this.calculateMetricsByDayOfWeek(filteredEvents),
      trends: this.calculateTrends(filteredEvents)
    };
  }

  /**
   * Get engagement metrics for specific notification type
   */
  getTypeMetrics(type: NotificationType, timeRange?: { start: number; end: number }): NotificationEngagementMetrics {
    const filteredEvents = this.getFilteredEvents(timeRange);
    const typeEvents = filteredEvents.filter(event => 
      event.metadata?.type === type
    );
    
    return this.calculateMetricsFromEvents(typeEvents);
  }

  /**
   * Get optimal notification timing for user
   */
  getOptimalTiming(userId: number): { hour: number; dayOfWeek: number } | null {
    const profile = this.getUserProfile(userId);
    return profile?.optimalTiming || null;
  }

  /**
   * Get notification preference analysis
   */
  getPreferenceAnalysis(userId: number): {
    preferredTypes: NotificationType[];
    avoidedTypes: NotificationType[];
    optimalFrequency: 'high' | 'medium' | 'low';
  } {
    const userEvents = this.getUserEvents(userId);
    
    const typeEngagement = new Map<NotificationType, number>();
    
    userEvents.forEach(event => {
      if (event.metadata?.type) {
        const type = event.metadata.type as NotificationType;
        const currentScore = typeEngagement.get(type) || 0;
        
        // Calculate engagement score based on event type
        let score = 0;
        switch (event.eventType) {
          case EngagementEventType.OPENED:
            score = 3;
            break;
          case EngagementEventType.CLICKED:
            score = 5;
            break;
          case EngagementEventType.ACTION_CLICKED:
            score = 7;
            break;
          case EngagementEventType.DISMISSED:
            score = -1;
            break;
          default:
            score = 1;
        }
        
        typeEngagement.set(type, currentScore + score);
      }
    });

    const sortedTypes = Array.from(typeEngagement.entries())
      .sort(([, a], [, b]) => b - a);

    const preferredTypes = sortedTypes
      .filter(([, score]) => score > 0)
      .slice(0, 3)
      .map(([type]) => type);

    const avoidedTypes = sortedTypes
      .filter(([, score]) => score < 0)
      .map(([type]) => type);

    // Calculate optimal frequency based on engagement patterns
    const totalEvents = userEvents.length;
    const engagementEvents = userEvents.filter(event => 
      [EngagementEventType.OPENED, EngagementEventType.CLICKED, EngagementEventType.ACTION_CLICKED]
        .includes(event.eventType)
    ).length;

    const engagementRate = totalEvents > 0 ? engagementEvents / totalEvents : 0;
    
    let optimalFrequency: 'high' | 'medium' | 'low';
    if (engagementRate > 0.7) {
      optimalFrequency = 'high';
    } else if (engagementRate > 0.3) {
      optimalFrequency = 'medium';
    } else {
      optimalFrequency = 'low';
    }

    return {
      preferredTypes,
      avoidedTypes,
      optimalFrequency
    };
  }

  // Private methods

  private trackEvent(
    notificationId: string,
    userId: number,
    eventType: EngagementEventType,
    metadata?: Record<string, any>
  ): void {
    const event: NotificationEngagementEvent = {
      id: this.generateEventId(),
      notificationId,
      userId,
      eventType,
      timestamp: Date.now(),
      metadata
    };

    const notificationEvents = this.events.get(notificationId) || [];
    notificationEvents.push(event);
    this.events.set(notificationId, notificationEvents);

    // Update metrics
    this.updateMetrics(notificationId);
    this.updateUserProfile(userId);

    // Store in localStorage for persistence
    this.storeEvent(event);
  }

  private hasEvent(notificationId: string, eventType: EngagementEventType): boolean {
    const events = this.events.get(notificationId) || [];
    return events.some(event => event.eventType === eventType);
  }

  private updateMetrics(notificationId: string): void {
    const events = this.events.get(notificationId) || [];
    if (events.length === 0) return;

    const firstEvent = events[0];
    const type = firstEvent.metadata?.type as NotificationType;
    const category = firstEvent.metadata?.category as NotificationCategory;

    const deliveredCount = events.filter(e => e.eventType === EngagementEventType.DELIVERED).length;
    const displayedCount = events.filter(e => e.eventType === EngagementEventType.DISPLAYED).length;
    const openedCount = events.filter(e => e.eventType === EngagementEventType.OPENED).length;
    const clickedCount = events.filter(e => e.eventType === EngagementEventType.CLICKED).length;
    const actionClickedCount = events.filter(e => e.eventType === EngagementEventType.ACTION_CLICKED).length;
    const dismissedCount = events.filter(e => e.eventType === EngagementEventType.DISMISSED).length;

    const deliveryRate = deliveredCount > 0 ? displayedCount / deliveredCount : 0;
    const openRate = displayedCount > 0 ? openedCount / displayedCount : 0;
    const clickThroughRate = openedCount > 0 ? clickedCount / openedCount : 0;
    const actionClickRate = clickedCount > 0 ? actionClickedCount / clickedCount : 0;
    const dismissalRate = displayedCount > 0 ? dismissedCount / displayedCount : 0;

    // Calculate time metrics
    const deliveredEvent = events.find(e => e.eventType === EngagementEventType.DELIVERED);
    const openedEvent = events.find(e => e.eventType === EngagementEventType.OPENED);
    const clickedEvent = events.find(e => e.eventType === EngagementEventType.CLICKED);

    const averageTimeToOpen = deliveredEvent && openedEvent 
      ? openedEvent.timestamp - deliveredEvent.timestamp 
      : 0;

    const averageTimeToAction = openedEvent && clickedEvent 
      ? clickedEvent.timestamp - openedEvent.timestamp 
      : 0;

    // Calculate engagement score (0-100)
    const engagementScore = Math.min(100, Math.round(
      (openRate * 30) + 
      (clickThroughRate * 40) + 
      (actionClickRate * 20) + 
      ((1 - dismissalRate) * 10)
    ));

    const metrics: NotificationEngagementMetrics = {
      notificationId,
      type,
      category,
      deliveryRate,
      openRate,
      clickThroughRate,
      actionClickRate,
      dismissalRate,
      averageTimeToOpen,
      averageTimeToAction,
      engagementScore
    };

    this.metrics.set(notificationId, metrics);
  }

  private updateUserProfile(userId: number): void {
    const userEvents = this.getUserEvents(userId);
    
    if (userEvents.length === 0) return;

    const totalNotifications = new Set(userEvents.map(e => e.notificationId)).size;
    const openedNotifications = new Set(
      userEvents
        .filter(e => e.eventType === EngagementEventType.OPENED)
        .map(e => e.notificationId)
    ).size;
    const clickedNotifications = new Set(
      userEvents
        .filter(e => e.eventType === EngagementEventType.CLICKED)
        .map(e => e.notificationId)
    ).size;

    const openRate = totalNotifications > 0 ? openedNotifications / totalNotifications : 0;
    const clickThroughRate = openedNotifications > 0 ? clickedNotifications / openedNotifications : 0;

    // Calculate preferred types
    const typeEngagement = new Map<NotificationType, number>();
    userEvents.forEach(event => {
      if (event.metadata?.type && event.eventType === EngagementEventType.OPENED) {
        const type = event.metadata.type as NotificationType;
        typeEngagement.set(type, (typeEngagement.get(type) || 0) + 1);
      }
    });

    const preferredTypes = Array.from(typeEngagement.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);

    // Calculate optimal timing
    const hourEngagement = new Map<number, number>();
    const dayEngagement = new Map<number, number>();

    userEvents
      .filter(e => e.eventType === EngagementEventType.OPENED)
      .forEach(event => {
        const date = new Date(event.timestamp);
        const hour = date.getHours();
        const dayOfWeek = date.getDay();

        hourEngagement.set(hour, (hourEngagement.get(hour) || 0) + 1);
        dayEngagement.set(dayOfWeek, (dayEngagement.get(dayOfWeek) || 0) + 1);
      });

    const optimalHour = Array.from(hourEngagement.entries())
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 9;

    const optimalDay = Array.from(dayEngagement.entries())
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 1;

    // Calculate engagement trend
    const recentEvents = userEvents
      .filter(e => e.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
      .filter(e => e.eventType === EngagementEventType.OPENED);

    const olderEvents = userEvents
      .filter(e => e.timestamp <= Date.now() - 7 * 24 * 60 * 60 * 1000)
      .filter(e => e.timestamp > Date.now() - 14 * 24 * 60 * 60 * 1000) // 7-14 days ago
      .filter(e => e.eventType === EngagementEventType.OPENED);

    let engagementTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (recentEvents.length > olderEvents.length * 1.2) {
      engagementTrend = 'increasing';
    } else if (recentEvents.length < olderEvents.length * 0.8) {
      engagementTrend = 'decreasing';
    }

    const lastEngagement = Math.max(...userEvents.map(e => e.timestamp));

    const profile: UserEngagementProfile = {
      userId,
      totalNotifications,
      openRate,
      clickThroughRate,
      preferredTypes,
      optimalTiming: {
        hour: optimalHour,
        dayOfWeek: optimalDay
      },
      engagementTrend,
      lastEngagement
    };

    this.userProfiles.set(userId, profile);
  }

  private getUserEvents(userId: number): NotificationEngagementEvent[] {
    const allEvents: NotificationEngagementEvent[] = [];
    
    this.events.forEach(events => {
      allEvents.push(...events.filter(event => event.userId === userId));
    });

    return allEvents.sort((a, b) => a.timestamp - b.timestamp);
  }

  private getFilteredEvents(timeRange?: { start: number; end: number }): NotificationEngagementEvent[] {
    const allEvents: NotificationEngagementEvent[] = [];
    
    this.events.forEach(events => {
      allEvents.push(...events);
    });

    if (timeRange) {
      return allEvents.filter(event => 
        event.timestamp >= timeRange.start && event.timestamp <= timeRange.end
      );
    }

    return allEvents;
  }

  private calculateOverallMetrics(events: NotificationEngagementEvent[]): EngagementAnalytics['overall'] {
    const notificationIds = new Set(events.map(e => e.notificationId));
    const totalNotifications = notificationIds.size;

    const deliveredCount = events.filter(e => e.eventType === EngagementEventType.DELIVERED).length;
    const displayedCount = events.filter(e => e.eventType === EngagementEventType.DISPLAYED).length;
    const openedCount = events.filter(e => e.eventType === EngagementEventType.OPENED).length;
    const clickedCount = events.filter(e => e.eventType === EngagementEventType.CLICKED).length;

    const deliveryRate = deliveredCount > 0 ? displayedCount / deliveredCount : 0;
    const openRate = displayedCount > 0 ? openedCount / displayedCount : 0;
    const clickThroughRate = openedCount > 0 ? clickedCount / openedCount : 0;

    // Calculate average engagement time
    const engagementTimes: number[] = [];
    notificationIds.forEach(notificationId => {
      const notificationEvents = events.filter(e => e.notificationId === notificationId);
      const deliveredEvent = notificationEvents.find(e => e.eventType === EngagementEventType.DELIVERED);
      const openedEvent = notificationEvents.find(e => e.eventType === EngagementEventType.OPENED);
      
      if (deliveredEvent && openedEvent) {
        engagementTimes.push(openedEvent.timestamp - deliveredEvent.timestamp);
      }
    });

    const averageEngagementTime = engagementTimes.length > 0 
      ? engagementTimes.reduce((sum, time) => sum + time, 0) / engagementTimes.length 
      : 0;

    return {
      totalNotifications,
      deliveryRate,
      openRate,
      clickThroughRate,
      averageEngagementTime
    };
  }

  private calculateMetricsByType(events: NotificationEngagementEvent[]): Record<NotificationType, NotificationEngagementMetrics> {
    const result: Record<NotificationType, NotificationEngagementMetrics> = {} as any;

    Object.values(NotificationType).forEach(type => {
      const typeEvents = events.filter(e => e.metadata?.type === type);
      if (typeEvents.length > 0) {
        result[type] = this.calculateMetricsFromEvents(typeEvents);
      }
    });

    return result;
  }

  private calculateMetricsByCategory(events: NotificationEngagementEvent[]): Record<NotificationCategory, NotificationEngagementMetrics> {
    const result: Record<NotificationCategory, NotificationEngagementMetrics> = {} as any;

    Object.values(NotificationCategory).forEach(category => {
      const categoryEvents = events.filter(e => e.metadata?.category === category);
      if (categoryEvents.length > 0) {
        result[category] = this.calculateMetricsFromEvents(categoryEvents);
      }
    });

    return result;
  }

  private calculateMetricsByTimeOfDay(events: NotificationEngagementEvent[]): Record<number, NotificationEngagementMetrics> {
    const result: Record<number, NotificationEngagementMetrics> = {};

    for (let hour = 0; hour < 24; hour++) {
      const hourEvents = events.filter(e => {
        const eventHour = new Date(e.timestamp).getHours();
        return eventHour === hour;
      });

      if (hourEvents.length > 0) {
        result[hour] = this.calculateMetricsFromEvents(hourEvents);
      }
    }

    return result;
  }

  private calculateMetricsByDayOfWeek(events: NotificationEngagementEvent[]): Record<number, NotificationEngagementMetrics> {
    const result: Record<number, NotificationEngagementMetrics> = {};

    for (let day = 0; day < 7; day++) {
      const dayEvents = events.filter(e => {
        const eventDay = new Date(e.timestamp).getDay();
        return eventDay === day;
      });

      if (dayEvents.length > 0) {
        result[day] = this.calculateMetricsFromEvents(dayEvents);
      }
    }

    return result;
  }

  private calculateTrends(events: NotificationEngagementEvent[]): EngagementAnalytics['trends'] {
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    const dailyData: Array<{ date: string; metrics: NotificationEngagementMetrics }> = [];

    for (let i = 0; i < 30; i++) {
      const date = new Date(thirtyDaysAgo + (i * 24 * 60 * 60 * 1000));
      const dateString = date.toISOString().split('T')[0];
      
      const dayEvents = events.filter(e => {
        const eventDate = new Date(e.timestamp).toISOString().split('T')[0];
        return eventDate === dateString;
      });

      if (dayEvents.length > 0) {
        dailyData.push({
          date: dateString,
          metrics: this.calculateMetricsFromEvents(dayEvents)
        });
      }
    }

    return {
      period: 'daily',
      data: dailyData
    };
  }

  private calculateMetricsFromEvents(events: NotificationEngagementEvent[]): NotificationEngagementMetrics {
    if (events.length === 0) {
      return {
        notificationId: '',
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        category: NotificationCategory.SYSTEM,
        deliveryRate: 0,
        openRate: 0,
        clickThroughRate: 0,
        actionClickRate: 0,
        dismissalRate: 0,
        averageTimeToOpen: 0,
        averageTimeToAction: 0,
        engagementScore: 0
      };
    }

    const firstEvent = events[0];
    const type = firstEvent.metadata?.type as NotificationType || NotificationType.SYSTEM_ANNOUNCEMENT;
    const category = firstEvent.metadata?.category as NotificationCategory || NotificationCategory.SYSTEM;

    const deliveredCount = events.filter(e => e.eventType === EngagementEventType.DELIVERED).length;
    const displayedCount = events.filter(e => e.eventType === EngagementEventType.DISPLAYED).length;
    const openedCount = events.filter(e => e.eventType === EngagementEventType.OPENED).length;
    const clickedCount = events.filter(e => e.eventType === EngagementEventType.CLICKED).length;
    const actionClickedCount = events.filter(e => e.eventType === EngagementEventType.ACTION_CLICKED).length;
    const dismissedCount = events.filter(e => e.eventType === EngagementEventType.DISMISSED).length;

    const deliveryRate = deliveredCount > 0 ? displayedCount / deliveredCount : 0;
    const openRate = displayedCount > 0 ? openedCount / displayedCount : 0;
    const clickThroughRate = openedCount > 0 ? clickedCount / openedCount : 0;
    const actionClickRate = clickedCount > 0 ? actionClickedCount / clickedCount : 0;
    const dismissalRate = displayedCount > 0 ? dismissedCount / displayedCount : 0;

    // Calculate average times
    const timeToOpenValues: number[] = [];
    const timeToActionValues: number[] = [];

    const notificationIds = new Set(events.map(e => e.notificationId));
    notificationIds.forEach(notificationId => {
      const notificationEvents = events.filter(e => e.notificationId === notificationId);
      const deliveredEvent = notificationEvents.find(e => e.eventType === EngagementEventType.DELIVERED);
      const openedEvent = notificationEvents.find(e => e.eventType === EngagementEventType.OPENED);
      const clickedEvent = notificationEvents.find(e => e.eventType === EngagementEventType.CLICKED);

      if (deliveredEvent && openedEvent) {
        timeToOpenValues.push(openedEvent.timestamp - deliveredEvent.timestamp);
      }

      if (openedEvent && clickedEvent) {
        timeToActionValues.push(clickedEvent.timestamp - openedEvent.timestamp);
      }
    });

    const averageTimeToOpen = timeToOpenValues.length > 0 
      ? timeToOpenValues.reduce((sum, time) => sum + time, 0) / timeToOpenValues.length 
      : 0;

    const averageTimeToAction = timeToActionValues.length > 0 
      ? timeToActionValues.reduce((sum, time) => sum + time, 0) / timeToActionValues.length 
      : 0;

    // Calculate engagement score
    const engagementScore = Math.min(100, Math.round(
      (openRate * 30) + 
      (clickThroughRate * 40) + 
      (actionClickRate * 20) + 
      ((1 - dismissalRate) * 10)
    ));

    return {
      notificationId: firstEvent.notificationId,
      type,
      category,
      deliveryRate,
      openRate,
      clickThroughRate,
      actionClickRate,
      dismissalRate,
      averageTimeToOpen,
      averageTimeToAction,
      engagementScore
    };
  }

  private setupEventListeners(): void {
    // Listen for visibility changes to track when notifications are displayed
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }

    // Listen for beforeunload to flush events
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.flushEvents.bind(this));
    }
  }

  private removeEventListeners(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }

    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.flushEvents.bind(this));
    }
  }

  private handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      // User returned to the page, potentially to check notifications
      this.flushEvents();
    }
  }

  private startBatchFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flushEvents();
    }, this.flushInterval);
  }

  private stopBatchFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  private flushEvents(): void {
    // In a real implementation, this would send events to analytics service
    // For now, we'll just store them in localStorage
    try {
      const allEvents: NotificationEngagementEvent[] = [];
      this.events.forEach(events => {
        allEvents.push(...events);
      });

      if (allEvents.length > 0) {
        localStorage.setItem('notification_engagement_events', JSON.stringify(allEvents));
        console.log(`Flushed ${allEvents.length} engagement events`);
      }
    } catch (error) {
      console.error('Failed to flush engagement events:', error);
    }
  }

  private storeEvent(event: NotificationEngagementEvent): void {
    try {
      const storedEvents = localStorage.getItem('notification_engagement_events');
      const events: NotificationEngagementEvent[] = storedEvents ? JSON.parse(storedEvents) : [];
      events.push(event);
      
      // Keep only recent events (last 30 days)
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const recentEvents = events.filter(e => e.timestamp > thirtyDaysAgo);
      
      localStorage.setItem('notification_engagement_events', JSON.stringify(recentEvents));
    } catch (error) {
      console.error('Failed to store engagement event:', error);
    }
  }

  private loadStoredData(): void {
    try {
      const storedEvents = localStorage.getItem('notification_engagement_events');
      if (storedEvents) {
        const events: NotificationEngagementEvent[] = JSON.parse(storedEvents);
        
        // Rebuild events map
        events.forEach(event => {
          const notificationEvents = this.events.get(event.notificationId) || [];
          notificationEvents.push(event);
          this.events.set(event.notificationId, notificationEvents);
        });

        // Rebuild metrics and user profiles
        const notificationIds = new Set(events.map(e => e.notificationId));
        notificationIds.forEach(notificationId => {
          this.updateMetrics(notificationId);
        });

        const userIds = new Set(events.map(e => e.userId));
        userIds.forEach(userId => {
          this.updateUserProfile(userId);
        });

        console.log(`Loaded ${events.length} stored engagement events`);
      }
    } catch (error) {
      console.error('Failed to load stored engagement data:', error);
    }
  }

  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const notificationEngagementTracker = NotificationEngagementTracker.getInstance();

// Convenience functions
export const trackNotificationDelivery = (notification: Notification): void => {
  notificationEngagementTracker.trackDelivery(notification);
};

export const trackNotificationDisplay = (notification: Notification): void => {
  notificationEngagementTracker.trackDisplay(notification);
};

export const trackNotificationOpen = (notification: Notification, timeToOpen?: number): void => {
  notificationEngagementTracker.trackOpen(notification, timeToOpen);
};

export const trackNotificationClick = (notification: Notification, clickSource?: string): void => {
  notificationEngagementTracker.trackClick(notification, clickSource);
};

export const trackNotificationActionClick = (notification: Notification, actionId: string, actionTitle: string): void => {
  notificationEngagementTracker.trackActionClick(notification, actionId, actionTitle);
};

export const trackNotificationDismissal = (notification: Notification, dismissalMethod?: string): void => {
  notificationEngagementTracker.trackDismissal(notification, dismissalMethod);
};

export const startEngagementTracking = (): void => {
  notificationEngagementTracker.startTracking();
};

export const stopEngagementTracking = (): void => {
  notificationEngagementTracker.stopTracking();
};

export const getEngagementAnalytics = (timeRange?: { start: number; end: number }): EngagementAnalytics => {
  return notificationEngagementTracker.getEngagementAnalytics(timeRange);
};

export const getUserEngagementProfile = (userId: number): UserEngagementProfile | null => {
  return notificationEngagementTracker.getUserProfile(userId);
};

export const getNotificationPreferences = (userId: number) => {
  return notificationEngagementTracker.getPreferenceAnalysis(userId);
};