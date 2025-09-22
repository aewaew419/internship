'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNotifications } from '../../../hooks/useNotifications';
import { useSwipeGesture } from '../../../hooks/useSwipeGesture';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { NotificationSwipeActions } from './NotificationSwipeActions';
import type { Notification } from '../../../types/notifications';

interface MobileNotificationBarProps {
  notifications?: Notification[];
  maxVisible?: number;
  autoHide?: boolean;
  hideDelay?: number;
  swipeToAction?: boolean;
  className?: string;
}

export function MobileNotificationBar({
  notifications: propNotifications,
  maxVisible = 3,
  autoHide = true,
  hideDelay = 5000,
  swipeToAction = true,
  className = '',
}: MobileNotificationBarProps) {
  const { notifications: contextNotifications } = useNotifications();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Use prop notifications if provided, otherwise use context
  const notifications = propNotifications || contextNotifications;
  
  // Get recent unread notifications
  const recentNotifications = notifications
    .filter(n => !n.isRead)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, maxVisible);

  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([]);
  const [hiddenNotificationIds, setHiddenNotificationIds] = useState<Set<string>>(new Set());
  const hideTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Update visible notifications when recent notifications change
  useEffect(() => {
    const newVisible = recentNotifications.filter(n => !hiddenNotificationIds.has(n.id));
    setVisibleNotifications(newVisible);
  }, [recentNotifications, hiddenNotificationIds]);

  // Auto-hide functionality
  useEffect(() => {
    if (!autoHide) return;

    visibleNotifications.forEach(notification => {
      // Clear existing timeout
      const existingTimeout = hideTimeouts.current.get(notification.id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new timeout
      const timeout = setTimeout(() => {
        hideNotification(notification.id);
      }, hideDelay);

      hideTimeouts.current.set(notification.id, timeout);
    });

    // Cleanup function
    return () => {
      hideTimeouts.current.forEach(timeout => clearTimeout(timeout));
      hideTimeouts.current.clear();
    };
  }, [visibleNotifications, autoHide, hideDelay]);

  const hideNotification = useCallback((notificationId: string) => {
    setHiddenNotificationIds(prev => new Set(prev).add(notificationId));
    
    // Clear timeout
    const timeout = hideTimeouts.current.get(notificationId);
    if (timeout) {
      clearTimeout(timeout);
      hideTimeouts.current.delete(notificationId);
    }
  }, []);

  const showNotification = useCallback((notificationId: string) => {
    setHiddenNotificationIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(notificationId);
      return newSet;
    });
  }, []);

  // Don't render on desktop or if no notifications
  if (!isMobile || visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 pointer-events-none ${className}`}>
      <div className="flex flex-col gap-2 p-4 pt-safe-top">
        {visibleNotifications.map((notification, index) => (
          <MobileNotificationItem
            key={notification.id}
            notification={notification}
            index={index}
            onHide={() => hideNotification(notification.id)}
            swipeToAction={swipeToAction}
          />
        ))}
      </div>
    </div>
  );
}

interface MobileNotificationItemProps {
  notification: Notification;
  index: number;
  onHide: () => void;
  swipeToAction: boolean;
}

function MobileNotificationItem({
  notification,
  index,
  onHide,
  swipeToAction,
}: MobileNotificationItemProps) {
  const { markAsRead, deleteNotification } = useNotifications();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  // Animate in
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  const handleSwipeLeft = useCallback(() => {
    if (!swipeToAction) return;
    
    setIsExiting(true);
    setTimeout(() => {
      markAsRead(notification.id);
      onHide();
    }, 200);
  }, [swipeToAction, markAsRead, notification.id, onHide]);

  const handleSwipeRight = useCallback(() => {
    if (!swipeToAction) return;
    
    setIsExiting(true);
    setTimeout(() => {
      deleteNotification(notification.id);
      onHide();
    }, 200);
  }, [swipeToAction, deleteNotification, notification.id, onHide]);

  const handleTap = useCallback(() => {
    // Navigate to notification or mark as read
    markAsRead(notification.id);
    
    // Handle navigation if notification has actions or data
    if (notification.actions && notification.actions.length > 0) {
      const primaryAction = notification.actions[0];
      if (primaryAction.url) {
        window.location.href = primaryAction.url;
      }
    }
    
    onHide();
  }, [markAsRead, notification, onHide]);

  const { swipeOffset, isSwipeActive, swipeDirection } = useSwipeGesture({
    element: elementRef.current,
    enabled: swipeToAction,
    threshold: 80,
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500';
      case 'normal':
        return 'bg-blue-500';
      case 'low':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getSwipeIndicator = () => {
    if (!isSwipeActive || Math.abs(swipeOffset) < 20) return null;

    const isLeftSwipe = swipeDirection === 'left';
    const opacity = Math.min(Math.abs(swipeOffset) / 80, 1);

    return (
      <div
        className={`absolute inset-y-0 ${
          isLeftSwipe ? 'right-0' : 'left-0'
        } w-16 flex items-center justify-center transition-opacity`}
        style={{ opacity }}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isLeftSwipe ? 'bg-green-500' : 'bg-red-500'
        }`}>
          {isLeftSwipe ? (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={elementRef}
      className={`
        relative bg-white rounded-lg shadow-lg border-l-4 ${getPriorityColor(notification.priority)}
        transform transition-all duration-300 ease-out pointer-events-auto
        ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
        ${isExiting ? 'translate-x-full opacity-0' : ''}
        ${isSwipeActive ? 'transition-none' : ''}
      `}
      style={{
        transform: isSwipeActive 
          ? `translateX(${swipeOffset}px) ${isVisible ? 'translateY(0)' : 'translateY(-100%)'}`
          : undefined,
      }}
      onClick={handleTap}
    >
      {getSwipeIndicator()}
      
      <div className="p-4 pr-12">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 truncate">
              {notification.title}
            </h4>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {notification.body}
            </p>
            
            {notification.actions && notification.actions.length > 0 && (
              <div className="flex gap-2 mt-2">
                {notification.actions.slice(0, 2).map(action => (
                  <button
                    key={action.id}
                    className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (action.url) {
                        window.location.href = action.url;
                      }
                      onHide();
                    }}
                  >
                    {action.title}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <button
            className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onHide();
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      {swipeToAction && (
        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
          <div className="flex gap-1">
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
          </div>
        </div>
      )}
    </div>
  );
}