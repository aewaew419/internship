'use client';

import React, { useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useNotifications } from '../../../hooks/useNotifications';
import { useBreadcrumbs } from '../../../hooks/useBreadcrumbs';
import type { Notification, NotificationType } from '../../../types/notifications';

interface NotificationRouterProps {
  children: React.ReactNode;
}

interface RouteMapping {
  pattern: string;
  title: string;
  breadcrumbPath?: string[];
}

export function NotificationRouter({ children }: NotificationRouterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { getNotificationById, markAsRead } = useNotifications();
  const { updateBreadcrumbs } = useBreadcrumbs();

  // Define route mappings for different notification types
  const routeMappings: Record<NotificationType, RouteMapping> = useMemo(() => ({
    [NotificationType.EVALUATION_REQUEST]: {
      pattern: '/evaluate/company',
      title: 'Company Evaluation',
      breadcrumbPath: ['Dashboard', 'Evaluations', 'Company Evaluation']
    },
    [NotificationType.ASSIGNMENT_CHANGE]: {
      pattern: '/instructor/assign-visitor',
      title: 'Visitor Assignment',
      breadcrumbPath: ['Dashboard', 'Instructor', 'Assign Visitor']
    },
    [NotificationType.DOCUMENT_UPDATE]: {
      pattern: '/documents',
      title: 'Documents',
      breadcrumbPath: ['Dashboard', 'Documents']
    },
    [NotificationType.SCHEDULE_REMINDER]: {
      pattern: '/visitor',
      title: 'Visit Schedule',
      breadcrumbPath: ['Dashboard', 'Visitor', 'Schedule']
    },
    [NotificationType.GRADE_UPDATE]: {
      pattern: '/instructor/assign-grade',
      title: 'Grade Assignment',
      breadcrumbPath: ['Dashboard', 'Instructor', 'Assign Grade']
    },
    [NotificationType.DEADLINE_REMINDER]: {
      pattern: '/dashboard',
      title: 'Dashboard',
      breadcrumbPath: ['Dashboard', 'Deadlines']
    },
    [NotificationType.VISIT_SCHEDULED]: {
      pattern: '/visitor',
      title: 'Visit Information',
      breadcrumbPath: ['Dashboard', 'Visitor', 'Visits']
    },
    [NotificationType.SYSTEM_ANNOUNCEMENT]: {
      pattern: '/notifications',
      title: 'Announcements',
      breadcrumbPath: ['Dashboard', 'Notifications', 'Announcements']
    }
  }), []);

  // Handle notification-based navigation
  const handleNotificationNavigation = useCallback((notification: Notification) => {
    const routeMapping = routeMappings[notification.type];
    if (!routeMapping) return null;

    // Build URL with notification context
    const url = new URL(routeMapping.pattern, window.location.origin);
    
    // Add notification ID as query parameter
    url.searchParams.set('notificationId', notification.id);
    
    // Add notification-specific parameters
    if (notification.data) {
      Object.entries(notification.data).forEach(([key, value]) => {
        if (typeof value === 'string' || typeof value === 'number') {
          url.searchParams.set(key, value.toString());
        }
      });
    }

    // Add tab parameter for dashboard-like pages
    switch (notification.type) {
      case NotificationType.ASSIGNMENT_CHANGE:
        url.searchParams.set('tab', 'assignments');
        break;
      case NotificationType.GRADE_UPDATE:
        url.searchParams.set('tab', 'grades');
        break;
      case NotificationType.DEADLINE_REMINDER:
        url.searchParams.set('tab', 'deadlines');
        break;
      case NotificationType.VISIT_SCHEDULED:
        url.searchParams.set('tab', 'visits');
        break;
      case NotificationType.SCHEDULE_REMINDER:
        url.searchParams.set('tab', 'schedule');
        break;
      case NotificationType.DOCUMENT_UPDATE:
        if (notification.data?.documentType) {
          url.searchParams.set('type', notification.data.documentType);
        }
        break;
    }

    return {
      url: url.pathname + url.search,
      title: routeMapping.title,
      breadcrumbPath: routeMapping.breadcrumbPath
    };
  }, [routeMappings]);

  // Navigate to notification target
  const navigateToNotification = useCallback(async (notificationId: string) => {
    const notification = getNotificationById(notificationId);
    if (!notification) {
      console.warn(`Notification with ID ${notificationId} not found`);
      return;
    }

    // Mark notification as read
    if (!notification.isRead) {
      await markAsRead(notificationId);
    }

    // Get navigation info
    const navigationInfo = handleNotificationNavigation(notification);
    if (!navigationInfo) {
      console.warn(`No route mapping found for notification type: ${notification.type}`);
      return;
    }

    // Update breadcrumbs if provided
    if (navigationInfo.breadcrumbPath) {
      updateBreadcrumbs(navigationInfo.breadcrumbPath);
    }

    // Navigate to the target URL
    router.push(navigationInfo.url);
  }, [getNotificationById, markAsRead, handleNotificationNavigation, updateBreadcrumbs, router]);

  // Handle deep linking from URL parameters
  useEffect(() => {
    const notificationId = searchParams.get('notificationId');
    if (notificationId) {
      // Small delay to ensure notification data is loaded
      const timer = setTimeout(() => {
        const notification = getNotificationById(notificationId);
        if (notification) {
          // Update breadcrumbs based on current notification context
          const navigationInfo = handleNotificationNavigation(notification);
          if (navigationInfo?.breadcrumbPath) {
            updateBreadcrumbs([
              ...navigationInfo.breadcrumbPath,
              `Notification: ${notification.title}`
            ]);
          }

          // Mark as read if not already
          if (!notification.isRead) {
            markAsRead(notificationId);
          }
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [searchParams, getNotificationById, handleNotificationNavigation, updateBreadcrumbs, markAsRead]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const notificationId = new URLSearchParams(window.location.search).get('notificationId');
      if (notificationId) {
        const notification = getNotificationById(notificationId);
        if (notification) {
          const navigationInfo = handleNotificationNavigation(notification);
          if (navigationInfo?.breadcrumbPath) {
            updateBreadcrumbs(navigationInfo.breadcrumbPath);
          }
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [getNotificationById, handleNotificationNavigation, updateBreadcrumbs]);

  // Provide navigation function to child components
  const contextValue = useMemo(() => ({
    navigateToNotification,
    handleNotificationNavigation,
    routeMappings,
  }), [navigateToNotification, handleNotificationNavigation, routeMappings]);

  return (
    <NotificationRouterContext.Provider value={contextValue}>
      {children}
    </NotificationRouterContext.Provider>
  );
}

// Context for notification routing
interface NotificationRouterContextType {
  navigateToNotification: (notificationId: string) => Promise<void>;
  handleNotificationNavigation: (notification: Notification) => {
    url: string;
    title: string;
    breadcrumbPath?: string[];
  } | null;
  routeMappings: Record<NotificationType, RouteMapping>;
}

const NotificationRouterContext = React.createContext<NotificationRouterContextType | undefined>(undefined);

// Hook to use notification router
export function useNotificationRouter() {
  const context = React.useContext(NotificationRouterContext);
  if (context === undefined) {
    throw new Error('useNotificationRouter must be used within a NotificationRouter');
  }
  return context;
}

// Utility component for notification links
interface NotificationLinkProps {
  notification: Notification;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function NotificationLink({ 
  notification, 
  children, 
  className = '', 
  onClick 
}: NotificationLinkProps) {
  const { navigateToNotification, handleNotificationNavigation } = useNotificationRouter();

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Call custom onClick if provided
    onClick?.();
    
    // Navigate to notification
    await navigateToNotification(notification.id);
  }, [navigateToNotification, notification.id, onClick]);

  const navigationInfo = handleNotificationNavigation(notification);
  
  if (!navigationInfo) {
    return <span className={className}>{children}</span>;
  }

  return (
    <a
      href={navigationInfo.url}
      onClick={handleClick}
      className={`cursor-pointer hover:underline ${className}`}
      title={`Go to ${navigationInfo.title}`}
    >
      {children}
    </a>
  );
}

// Utility function to build notification URL
export function buildNotificationUrl(notification: Notification): string | null {
  const routeMappings: Record<NotificationType, RouteMapping> = {
    [NotificationType.EVALUATION_REQUEST]: {
      pattern: '/evaluate/company',
      title: 'Company Evaluation'
    },
    [NotificationType.ASSIGNMENT_CHANGE]: {
      pattern: '/instructor/assign-visitor',
      title: 'Visitor Assignment'
    },
    [NotificationType.DOCUMENT_UPDATE]: {
      pattern: '/documents',
      title: 'Documents'
    },
    [NotificationType.SCHEDULE_REMINDER]: {
      pattern: '/visitor',
      title: 'Visit Schedule'
    },
    [NotificationType.GRADE_UPDATE]: {
      pattern: '/instructor/assign-grade',
      title: 'Grade Assignment'
    },
    [NotificationType.DEADLINE_REMINDER]: {
      pattern: '/dashboard',
      title: 'Dashboard'
    },
    [NotificationType.VISIT_SCHEDULED]: {
      pattern: '/visitor',
      title: 'Visit Information'
    },
    [NotificationType.SYSTEM_ANNOUNCEMENT]: {
      pattern: '/notifications',
      title: 'Announcements'
    }
  };

  const routeMapping = routeMappings[notification.type];
  if (!routeMapping) return null;

  const url = new URL(routeMapping.pattern, window.location.origin);
  url.searchParams.set('notificationId', notification.id);
  
  if (notification.data) {
    Object.entries(notification.data).forEach(([key, value]) => {
      if (typeof value === 'string' || typeof value === 'number') {
        url.searchParams.set(key, value.toString());
      }
    });
  }

  return url.pathname + url.search;
}

// Utility function to extract notification context from URL
export function extractNotificationContext(searchParams: URLSearchParams) {
  const notificationId = searchParams.get('notificationId');
  const context: Record<string, string> = {};

  // Extract common notification parameters
  const commonParams = ['tab', 'type', 'visitId', 'documentId', 'assignmentId', 'gradeId'];
  commonParams.forEach(param => {
    const value = searchParams.get(param);
    if (value) {
      context[param] = value;
    }
  });

  return {
    notificationId,
    context
  };
}