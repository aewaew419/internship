'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  notificationEngagementTracker,
  NotificationEngagementMetrics,
  UserEngagementProfile,
  EngagementAnalytics,
  trackNotificationDelivery,
  trackNotificationDisplay,
  trackNotificationOpen,
  trackNotificationClick,
  trackNotificationActionClick,
  trackNotificationDismissal,
  getEngagementAnalytics,
  getUserEngagementProfile,
  getNotificationPreferences
} from '../lib/notifications/engagement-tracking';
import { Notification, NotificationType } from '../types/notifications';

export interface UseNotificationEngagementReturn {
  // Tracking functions
  trackDelivery: (notification: Notification) => void;
  trackDisplay: (notification: Notification) => void;
  trackOpen: (notification: Notification, timeToOpen?: number) => void;
  trackClick: (notification: Notification, clickSource?: string) => void;
  trackActionClick: (notification: Notification, actionId: string, actionTitle: string) => void;
  trackDismissal: (notification: Notification, dismissalMethod?: string) => void;
  
  // Analytics functions
  getAnalytics: (timeRange?: { start: number; end: number }) => EngagementAnalytics;
  getUserProfile: (userId: number) => UserEngagementProfile | null;
  getPreferences: (userId: number) => ReturnType<typeof getNotificationPreferences>;
  getTypeMetrics: (type: NotificationType, timeRange?: { start: number; end: number }) => NotificationEngagementMetrics;
  
  // State
  isTracking: boolean;
  
  // Control functions
  startTracking: () => void;
  stopTracking: () => void;
}

/**
 * Hook for notification engagement tracking
 */
export function useNotificationEngagement(): UseNotificationEngagementReturn {
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    // Auto-start tracking when hook is used
    notificationEngagementTracker.startTracking();
    setIsTracking(true);

    return () => {
      // Don't auto-stop tracking on unmount as other components might be using it
      // The tracker manages its own lifecycle
    };
  }, []);

  const startTracking = useCallback(() => {
    notificationEngagementTracker.startTracking();
    setIsTracking(true);
  }, []);

  const stopTracking = useCallback(() => {
    notificationEngagementTracker.stopTracking();
    setIsTracking(false);
  }, []);

  const trackDelivery = useCallback((notification: Notification) => {
    trackNotificationDelivery(notification);
  }, []);

  const trackDisplay = useCallback((notification: Notification) => {
    trackNotificationDisplay(notification);
  }, []);

  const trackOpen = useCallback((notification: Notification, timeToOpen?: number) => {
    trackNotificationOpen(notification, timeToOpen);
  }, []);

  const trackClick = useCallback((notification: Notification, clickSource?: string) => {
    trackNotificationClick(notification, clickSource);
  }, []);

  const trackActionClick = useCallback((notification: Notification, actionId: string, actionTitle: string) => {
    trackNotificationActionClick(notification, actionId, actionTitle);
  }, []);

  const trackDismissal = useCallback((notification: Notification, dismissalMethod?: string) => {
    trackNotificationDismissal(notification, dismissalMethod);
  }, []);

  const getAnalytics = useCallback((timeRange?: { start: number; end: number }) => {
    return getEngagementAnalytics(timeRange);
  }, []);

  const getUserProfile = useCallback((userId: number) => {
    return getUserEngagementProfile(userId);
  }, []);

  const getPreferences = useCallback((userId: number) => {
    return getNotificationPreferences(userId);
  }, []);

  const getTypeMetrics = useCallback((type: NotificationType, timeRange?: { start: number; end: number }) => {
    return notificationEngagementTracker.getTypeMetrics(type, timeRange);
  }, []);

  return {
    trackDelivery,
    trackDisplay,
    trackOpen,
    trackClick,
    trackActionClick,
    trackDismissal,
    getAnalytics,
    getUserProfile,
    getPreferences,
    getTypeMetrics,
    isTracking,
    startTracking,
    stopTracking
  };
}

/**
 * Hook for tracking a specific notification's engagement
 */
export function useNotificationTracker(notification: Notification) {
  const { trackDelivery, trackDisplay, trackOpen, trackClick, trackActionClick, trackDismissal } = useNotificationEngagement();
  const [deliveryTime] = useState(Date.now());

  const handleDisplay = useCallback(() => {
    trackDisplay(notification);
  }, [notification, trackDisplay]);

  const handleOpen = useCallback(() => {
    const timeToOpen = Date.now() - deliveryTime;
    trackOpen(notification, timeToOpen);
  }, [notification, trackOpen, deliveryTime]);

  const handleClick = useCallback((clickSource?: string) => {
    trackClick(notification, clickSource);
  }, [notification, trackClick]);

  const handleActionClick = useCallback((actionId: string, actionTitle: string) => {
    trackActionClick(notification, actionId, actionTitle);
  }, [notification, trackActionClick]);

  const handleDismissal = useCallback((dismissalMethod?: string) => {
    trackDismissal(notification, dismissalMethod);
  }, [notification, trackDismissal]);

  // Auto-track delivery when notification is first rendered
  useEffect(() => {
    trackDelivery(notification);
  }, [notification.id, trackDelivery]);

  return {
    handleDisplay,
    handleOpen,
    handleClick,
    handleActionClick,
    handleDismissal
  };
}

/**
 * Hook for engagement analytics with automatic updates
 */
export function useEngagementAnalytics(
  timeRange?: { start: number; end: number },
  refreshInterval: number = 60000 // 1 minute
) {
  const [analytics, setAnalytics] = useState<EngagementAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshAnalytics = useCallback(() => {
    try {
      setLoading(true);
      setError(null);
      const data = getEngagementAnalytics(timeRange);
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    refreshAnalytics();
  }, [refreshAnalytics]);

  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(refreshAnalytics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshAnalytics, refreshInterval]);

  return {
    analytics,
    loading,
    error,
    refresh: refreshAnalytics
  };
}

/**
 * Hook for user engagement profile with automatic updates
 */
export function useUserEngagementProfile(
  userId: number,
  refreshInterval: number = 300000 // 5 minutes
) {
  const [profile, setProfile] = useState<UserEngagementProfile | null>(null);
  const [preferences, setPreferences] = useState<ReturnType<typeof getNotificationPreferences> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = useCallback(() => {
    try {
      setLoading(true);
      setError(null);
      const userProfile = getUserEngagementProfile(userId);
      const userPreferences = getNotificationPreferences(userId);
      setProfile(userProfile);
      setPreferences(userPreferences);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(refreshProfile, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshProfile, refreshInterval]);

  return {
    profile,
    preferences,
    loading,
    error,
    refresh: refreshProfile
  };
}