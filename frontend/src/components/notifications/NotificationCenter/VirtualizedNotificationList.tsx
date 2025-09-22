'use client';

import React, { 
  useCallback, 
  useRef, 
  useEffect, 
  useState, 
  useMemo,
  memo,
  forwardRef,
  useImperativeHandle
} from 'react';
import { VariableSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { Loader2, Wifi, WifiOff } from 'lucide-react';
import { NotificationItem } from './NotificationItem';
import { useNotificationActions } from '../../../hooks/useNotifications';
import { usePerformanceMonitor } from '../../../lib/performance';
import type { Notification } from '../../../types/notifications';

interface VirtualizedNotificationListProps {
  notifications: Notification[];
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => Promise<void>;
  maxHeight: number;
  className?: string;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  selectionMode?: boolean;
  enableLazyLoading?: boolean;
  overscanCount?: number;
  estimatedItemSize?: number;
}

interface ListItemData {
  notifications: Notification[];
  hasMore: boolean;
  isLoading: boolean;
  onNotificationClick: (notification: Notification) => void;
  onMarkAsRead: (notificationId: string) => void;
  onDelete: (notificationId: string) => void;
  selectedIds: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  selectionMode: boolean;
  enableLazyLoading: boolean;
  getItemHeight: (index: number) => number;
  setItemHeight: (index: number, height: number) => void;
}

interface ListItemProps {
  index: number;
  style: React.CSSProperties;
  data: ListItemData;
}

// Memoized list item component for better performance
const VirtualizedListItem = memo<ListItemProps>(({ index, style, data }) => {
  const { 
    notifications, 
    hasMore, 
    isLoading, 
    onNotificationClick, 
    onMarkAsRead, 
    onDelete,
    selectedIds,
    onSelectionChange,
    selectionMode,
    enableLazyLoading,
    setItemHeight
  } = data;
  
  const itemRef = useRef<HTMLDivElement>(null);
  
  // Check if this is a loading item
  const isLoadingItem = index >= notifications.length;
  
  // Measure item height for dynamic sizing
  useEffect(() => {
    if (itemRef.current) {
      const height = itemRef.current.getBoundingClientRect().height;
      setItemHeight(index, height);
    }
  }, [index, setItemHeight]);
  
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

  // Handle selection toggle
  const handleSelectionToggle = useCallback((notificationId: string) => {
    if (!onSelectionChange) return;
    
    const isSelected = selectedIds.includes(notificationId);
    if (isSelected) {
      onSelectionChange(selectedIds.filter(id => id !== notificationId));
    } else {
      onSelectionChange([...selectedIds, notificationId]);
    }
  }, [selectedIds, onSelectionChange]);

  const isSelected = selectedIds.includes(notification.id);

  return (
    <div style={style} ref={itemRef}>
      <NotificationItem
        notification={notification}
        onClick={selectionMode ? () => handleSelectionToggle(notification.id) : onNotificationClick}
        onMarkAsRead={onMarkAsRead}
        onDelete={onDelete}
        showActions={!selectionMode}
        compact={false}
        isSelected={isSelected}
        selectionMode={selectionMode}
        enableSwipe={!selectionMode}
      />
    </div>
  );
});

VirtualizedListItem.displayName = 'VirtualizedListItem';

export interface VirtualizedNotificationListRef {
  scrollToTop: () => void;
  scrollToItem: (index: number, align?: 'auto' | 'smart' | 'center' | 'end' | 'start') => void;
  scrollToOffset: (offset: number) => void;
}

export const VirtualizedNotificationList = memo(forwardRef<
  VirtualizedNotificationListRef,
  VirtualizedNotificationListProps
>(({
  notifications,
  hasMore,
  isLoading,
  onLoadMore,
  maxHeight,
  className = '',
  selectedIds = [],
  onSelectionChange,
  selectionMode = false,
  enableLazyLoading = true,
  overscanCount = 5,
  estimatedItemSize = 120,
}, ref) => {
  const { markAsRead, deleteNotification } = useNotificationActions();
  const { mark, measure } = usePerformanceMonitor();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const listRef = useRef<List>(null);
  const infiniteLoaderRef = useRef<InfiniteLoader>(null);
  
  // Dynamic item heights for variable-size list
  const itemHeights = useRef<Map<number, number>>(new Map());
  const [, forceUpdate] = useState({});

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    scrollToTop: () => {
      listRef.current?.scrollToItem(0, 'start');
    },
    scrollToItem: (index: number, align = 'auto') => {
      listRef.current?.scrollToItem(index, align);
    },
    scrollToOffset: (offset: number) => {
      listRef.current?.scrollTo(offset);
    },
  }), []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Calculate total item count (notifications + loading item if needed)
  const itemCount = hasMore ? notifications.length + 1 : notifications.length;

  // Check if item is loaded
  const isItemLoaded = useCallback((index: number) => {
    return index < notifications.length;
  }, [notifications.length]);

  // Load more items with performance monitoring
  const loadMoreItems = useCallback(async () => {
    if (isLoadingMore || !hasMore || !isOnline) return;
    
    mark('notification-load-start');
    setIsLoadingMore(true);
    
    try {
      await onLoadMore();
      measure('notification-load-time', 'notification-load-start');
    } catch (error) {
      console.error('Failed to load more notifications:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, isOnline, onLoadMore, mark, measure]);

  // Handle notification click with performance tracking
  const handleNotificationClick = useCallback((notification: Notification) => {
    mark('notification-click-start');
    
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
    
    measure('notification-click-time', 'notification-click-start');
  }, [markAsRead, mark, measure]);

  // Handle mark as read with batching
  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    await markAsRead(notificationId);
  }, [markAsRead]);

  // Handle delete with optimistic updates
  const handleDelete = useCallback(async (notificationId: string) => {
    await deleteNotification(notificationId);
  }, [deleteNotification]);

  // Get item height for variable sizing
  const getItemHeight = useCallback((index: number) => {
    return itemHeights.current.get(index) || estimatedItemSize;
  }, [estimatedItemSize]);

  // Set item height and trigger re-render if needed
  const setItemHeight = useCallback((index: number, height: number) => {
    const currentHeight = itemHeights.current.get(index);
    if (currentHeight !== height) {
      itemHeights.current.set(index, height);
      // Force update to recalculate list dimensions
      forceUpdate({});
    }
  }, []);

  // Prepare data for virtualized list
  const listData = useMemo<ListItemData>(() => ({
    notifications,
    hasMore,
    isLoading: isLoadingMore,
    onNotificationClick: handleNotificationClick,
    onMarkAsRead: handleMarkAsRead,
    onDelete: handleDelete,
    selectedIds,
    onSelectionChange,
    selectionMode,
    enableLazyLoading,
    getItemHeight,
    setItemHeight,
  }), [
    notifications,
    hasMore,
    isLoadingMore,
    handleNotificationClick,
    handleMarkAsRead,
    handleDelete,
    selectedIds,
    onSelectionChange,
    selectionMode,
    enableLazyLoading,
    getItemHeight,
    setItemHeight,
  ]);

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
        case 'PageUp':
          event.preventDefault();
          // Scroll up by visible height
          const currentOffset = listRef.current.state?.scrollOffset || 0;
          listRef.current.scrollTo(Math.max(0, currentOffset - maxHeight));
          break;
        case 'PageDown':
          event.preventDefault();
          // Scroll down by visible height
          const currentOffset2 = listRef.current.state?.scrollOffset || 0;
          listRef.current.scrollTo(currentOffset2 + maxHeight);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [notifications.length, maxHeight]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={`virtualized-notification-list ${className}`}>
      {/* Offline indicator */}
      {!isOnline && (
        <div className="flex items-center justify-center p-2 bg-orange-50 border-b border-orange-200">
          <WifiOff className="h-4 w-4 text-orange-600 mr-2" />
          <span className="text-sm text-orange-600">You're offline. Some features may be limited.</span>
        </div>
      )}

      <InfiniteLoader
        ref={infiniteLoaderRef}
        isItemLoaded={isItemLoaded}
        itemCount={itemCount}
        loadMoreItems={loadMoreItems}
        threshold={3} // Start loading when 3 items from the end
        minimumBatchSize={10} // Load at least 10 items at a time
      >
        {({ onItemsRendered, ref: infiniteRef }) => (
          <List
            ref={(list) => {
              listRef.current = list;
              if (typeof infiniteRef === 'function') {
                infiniteRef(list);
              } else if (infiniteRef) {
                infiniteRef.current = list;
              }
            }}
            height={maxHeight}
            itemCount={itemCount}
            itemSize={getItemHeight}
            itemData={listData}
            onItemsRendered={onItemsRendered}
            overscanCount={overscanCount}
            className="virtualized-list-container"
            estimatedItemSize={estimatedItemSize}
          >
            {VirtualizedListItem}
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

      {/* Network status indicator */}
      <div className="absolute bottom-2 right-2">
        {isOnline ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
      </div>
    </div>
  );
}));

VirtualizedNotificationList.displayName = 'VirtualizedNotificationList';