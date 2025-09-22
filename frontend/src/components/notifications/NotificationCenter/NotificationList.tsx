'use client';

import React, { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { Loader2 } from 'lucide-react';
import { NotificationItem } from './NotificationItem';
import { useNotificationActions } from '../../../hooks/useNotifications';
import type { Notification } from '../../../types/notifications';

interface NotificationListProps {
  notifications: Notification[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => Promise<void>;
  maxHeight: number;
  itemHeight?: number;
  className?: string;
}

interface ListItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    notifications: Notification[];
    hasMore: boolean;
    isLoading: boolean;
    onNotificationClick: (notification: Notification) => void;
    onMarkAsRead: (notificationId: string) => void;
    onDelete: (notificationId: string) => void;
  };
}

// Individual list item component for virtualization
const ListItem: React.FC<ListItemProps> = ({ index, style, data }) => {
  const { notifications, hasMore, isLoading, onNotificationClick, onMarkAsRead, onDelete } = data;
  
  // Check if this is a loading item
  const isLoadingItem = index >= notifications.length;
  
  if (isLoadingItem) {
    return (
      <div style={style} className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Loading more notifications...</span>
      </div>
    );
  }

  const notification = notifications[index];
  
  if (!notification) {
    return <div style={style} />;
  }

  return (
    <div style={style}>
      <NotificationItem
        notification={notification}
        onClick={onNotificationClick}
        onMarkAsRead={onMarkAsRead}
        onDelete={onDelete}
        showActions={true}
        compact={false}
      />
    </div>
  );
};

export function NotificationList({
  notifications,
  hasMore,
  isLoading,
  onLoadMore,
  maxHeight,
  itemHeight = 120,
  className = '',
}: NotificationListProps) {
  const { markAsRead, deleteNotification } = useNotificationActions();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const listRef = useRef<List>(null);
  const infiniteLoaderRef = useRef<InfiniteLoader>(null);

  // Calculate total item count (notifications + loading item if needed)
  const itemCount = hasMore ? notifications.length + 1 : notifications.length;

  // Check if item is loaded
  const isItemLoaded = useCallback((index: number) => {
    return index < notifications.length;
  }, [notifications.length]);

  // Load more items
  const loadMoreItems = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    try {
      await onLoadMore();
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, onLoadMore]);

  // Handle notification click
  const handleNotificationClick = useCallback((notification: Notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      markAsRead(notification.id);
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
  }, [markAsRead]);

  // Handle mark as read
  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    await markAsRead(notificationId);
  }, [markAsRead]);

  // Handle delete
  const handleDelete = useCallback(async (notificationId: string) => {
    await deleteNotification(notificationId);
  }, [deleteNotification]);

  // Prepare data for virtualized list
  const listData = useMemo(() => ({
    notifications,
    hasMore,
    isLoading: isLoadingMore,
    onNotificationClick: handleNotificationClick,
    onMarkAsRead: handleMarkAsRead,
    onDelete: handleDelete,
  }), [
    notifications,
    hasMore,
    isLoadingMore,
    handleNotificationClick,
    handleMarkAsRead,
    handleDelete,
  ]);

  // Scroll to top when notifications change significantly
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToItem(0, 'start');
    }
  }, [notifications.length === 0]); // Only when going from some to none or vice versa

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!listRef.current) return;

      switch (event.key) {
        case 'Home':
          event.preventDefault();
          listRef.current.scrollToItem(0, 'start');
          break;
        case 'End':
          event.preventDefault();
          listRef.current.scrollToItem(notifications.length - 1, 'end');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [notifications.length]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={`notification-list ${className}`}>
      <InfiniteLoader
        ref={infiniteLoaderRef}
        isItemLoaded={isItemLoaded}
        itemCount={itemCount}
        loadMoreItems={loadMoreItems}
        threshold={5} // Start loading when 5 items from the end
      >
        {({ onItemsRendered, ref }) => (
          <List
            ref={(list) => {
              listRef.current = list;
              if (typeof ref === 'function') {
                ref(list);
              } else if (ref) {
                ref.current = list;
              }
            }}
            height={maxHeight}
            itemCount={itemCount}
            itemSize={itemHeight}
            itemData={listData}
            onItemsRendered={onItemsRendered}
            overscanCount={5} // Render 5 extra items for smooth scrolling
            className="notification-list-container"
          >
            {ListItem}
          </List>
        )}
      </InfiniteLoader>

      {/* Loading indicator at the bottom */}
      {isLoading && notifications.length > 0 && (
        <div className="flex items-center justify-center p-4 border-t border-gray-200">
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          <span className="ml-2 text-sm text-gray-500">Loading...</span>
        </div>
      )}
    </div>
  );
}

// Export additional components for flexibility
export { ListItem };