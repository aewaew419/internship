'use client';

import React, { useCallback, useRef, useEffect, useState, useMemo, memo } from 'react';
import { VirtualizedNotificationList, type VirtualizedNotificationListRef } from './VirtualizedNotificationList';
import { NotificationOptimizer, NotificationPerformanceMonitor } from '../../../lib/notifications/NotificationOptimizer';
import { notificationCache } from '../../../lib/notifications/NotificationCache';
import { notificationBatcher } from '../../../lib/notifications/NotificationBatcher';
import { useNotificationActions } from '../../../hooks/useNotifications';
import type { Notification, NotificationType, NotificationCategory } from '../../../types/notifications';

interface NotificationListProps {
  notifications: Notification[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => Promise<void>;
  maxHeight: number;
  itemHeight?: number;
  className?: string;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  selectionMode?: boolean;
  filters?: {
    type?: NotificationType;
    category?: NotificationCategory;
    unreadOnly?: boolean;
    search?: string;
  };
  sortOptions?: Array<{
    field: 'createdAt' | 'priority' | 'type' | 'isRead';
    direction: 'asc' | 'desc';
  }>;
  enableVirtualization?: boolean;
  enableCaching?: boolean;
  enableBatching?: boolean;
}

// Memoized filter function for performance
const memoizedFilter = NotificationOptimizer.createMemoizedFilter();

export const NotificationList = memo<NotificationListProps>(({
  notifications,
  hasMore,
  isLoading,
  onLoadMore,
  maxHeight,
  itemHeight = 120,
  className = '',
  selectedIds = [],
  onSelectionChange,
  selectionMode = false,
  filters = {},
  sortOptions = NotificationOptimizer.getSmartSort(),
  enableVirtualization = true,
  enableCaching = true,
  enableBatching = true,
}) => {
  const { markAsRead, deleteNotification } = useNotificationActions();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [processedNotifications, setProcessedNotifications] = useState<Notification[]>([]);
  const listRef = useRef<VirtualizedNotificationListRef>(null);

  // Process notifications with filtering, sorting, and caching
  useEffect(() => {
    const processNotifications = () => {
      return NotificationPerformanceMonitor.measure('notification-processing', () => {
        // Check cache first if enabled
        if (enableCaching) {
          const cached = notificationCache.getCachedNotificationList(filters);
          if (cached) {
            return cached;
          }
        }

        // Filter notifications
        let filtered = notifications;
        if (Object.keys(filters).length > 0) {
          filtered = memoizedFilter(notifications, filters);
        }

        // Sort notifications
        if (sortOptions.length > 0) {
          filtered = NotificationOptimizer.sortNotifications(filtered, sortOptions);
        }

        // Cache the result if enabled
        if (enableCaching) {
          notificationCache.cacheNotificationList(filtered, filters);
        }

        return filtered;
      });
    };

    const processed = processNotifications();
    setProcessedNotifications(processed);

    // Build search index for better performance
    NotificationOptimizer.buildSearchIndex(notifications);
  }, [notifications, filters, sortOptions, enableCaching]);

  // Load more items with performance monitoring
  const loadMoreItems = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    try {
      await NotificationPerformanceMonitor.measureAsync('load-more-notifications', async () => {
        await onLoadMore();
      });
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, onLoadMore]);

  // Handle notification click with caching
  const handleNotificationClick = useCallback((notification: Notification) => {
    NotificationPerformanceMonitor.measure('notification-click', () => {
      // Mark as read if not already read
      if (!notification.isRead) {
        if (enableBatching) {
          notificationBatcher.addOperation('mark_read', [notification.id]);
        } else {
          markAsRead(notification.id);
        }
      }

      // Update cache
      if (enableCaching) {
        const updatedNotification = { ...notification, isRead: true };
        notificationCache.cacheNotification(updatedNotification);
      }

      // Handle navigation based on notification data
      if (notification.data?.url) {
        window.location.href = notification.data.url;
      } else if (notification.actions && notification.actions.length > 0) {
        const primaryAction = notification.actions[0];
        if (primaryAction.url) {
          window.location.href = primaryAction.url;
        }
      }
    });
  }, [markAsRead, enableBatching, enableCaching]);

  // Handle mark as read with batching
  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    if (enableBatching) {
      await notificationBatcher.addOperation('mark_read', [notificationId]);
    } else {
      await markAsRead(notificationId);
    }

    // Invalidate cache
    if (enableCaching) {
      notificationCache.invalidateNotification(notificationId);
    }
  }, [markAsRead, enableBatching, enableCaching]);

  // Handle delete with batching
  const handleDelete = useCallback(async (notificationId: string) => {
    if (enableBatching) {
      await notificationBatcher.addOperation('delete', [notificationId]);
    } else {
      await deleteNotification(notificationId);
    }

    // Invalidate cache
    if (enableCaching) {
      notificationCache.invalidateNotification(notificationId);
    }
  }, [deleteNotification, enableBatching, enableCaching]);

  // Subscribe to batch updates
  useEffect(() => {
    if (!enableBatching) return;

    const unsubscribe = notificationBatcher.subscribe((updates) => {
      // Handle batch updates
      updates.forEach(update => {
        if (enableCaching) {
          if (update.type === 'deleted') {
            notificationCache.invalidateNotification(update.id);
          } else if (update.notification) {
            notificationCache.cacheNotification(update.notification);
          }
        }
      });

      // Invalidate list caches to force refresh
      if (enableCaching) {
        notificationCache.invalidateListCaches();
      }
    });

    return unsubscribe;
  }, [enableBatching, enableCaching]);

  // Scroll to top when notifications change significantly
  useEffect(() => {
    if (listRef.current && processedNotifications.length === 0) {
      listRef.current.scrollToTop();
    }
  }, [processedNotifications.length === 0]);

  if (processedNotifications.length === 0) {
    return null;
  }

  // Use virtualized list if enabled, otherwise use simple rendering
  if (enableVirtualization) {
    return (
      <div className={`notification-list ${className}`}>
        <VirtualizedNotificationList
          ref={listRef}
          notifications={processedNotifications}
          hasMore={hasMore}
          isLoading={isLoading}
          onLoadMore={loadMoreItems}
          maxHeight={maxHeight}
          selectedIds={selectedIds}
          onSelectionChange={onSelectionChange}
          selectionMode={selectionMode}
          estimatedItemSize={itemHeight}
          className="virtualized-notification-list"
        />
      </div>
    );
  }

  // Fallback to simple rendering for smaller lists
  return (
    <div className={`notification-list simple ${className}`} style={{ maxHeight }}>
      <div className="overflow-y-auto">
        {processedNotifications.map((notification) => (
          <div key={notification.id} className="notification-item-wrapper">
            <NotificationItem
              notification={notification}
              onClick={selectionMode 
                ? () => {
                    if (onSelectionChange) {
                      const isSelected = selectedIds.includes(notification.id);
                      if (isSelected) {
                        onSelectionChange(selectedIds.filter(id => id !== notification.id));
                      } else {
                        onSelectionChange([...selectedIds, notification.id]);
                      }
                    }
                  }
                : handleNotificationClick
              }
              onMarkAsRead={handleMarkAsRead}
              onDelete={handleDelete}
              showActions={!selectionMode}
              compact={false}
              isSelected={selectedIds.includes(notification.id)}
              selectionMode={selectionMode}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

NotificationList.displayName = 'NotificationList';