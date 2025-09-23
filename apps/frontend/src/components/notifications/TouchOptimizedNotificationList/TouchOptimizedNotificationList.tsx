'use client';

import React, { useCallback, useState } from 'react';
import { Check, Trash2, MoreHorizontal, X } from 'lucide-react';
import { NotificationItem } from '../NotificationCenter/NotificationItem';
import { PullToRefresh } from '../PullToRefresh';
import { useTouchOptimizedNotificationList } from '../../../hooks/useTouchOptimizedNotifications';
import { useNotifications } from '../../../hooks/useNotifications';
import type { Notification } from '../../../types/notifications';

interface TouchOptimizedNotificationListProps {
  notifications?: Notification[];
  onNotificationClick?: (notification: Notification) => void;
  enablePullToRefresh?: boolean;
  enableBulkSelection?: boolean;
  className?: string;
}

export function TouchOptimizedNotificationList({
  notifications: propNotifications,
  onNotificationClick,
  enablePullToRefresh = true,
  enableBulkSelection = true,
  className = '',
}: TouchOptimizedNotificationListProps) {
  const { 
    notifications: contextNotifications,
    refreshNotifications,
    markAsRead,
    deleteNotification,
  } = useNotifications();

  const {
    selectedNotifications,
    isSelectionMode,
    isPullToRefresh,
    pullOffset,
    toggleSelection,
    selectAll,
    clearSelection,
    markSelectedAsRead,
    deleteSelected,
    createTouchHandlers,
    triggerHapticFeedback,
    selectedCount,
    hasSelection,
    isAllSelected,
    handleScroll,
  } = useTouchOptimizedNotificationList();

  const notifications = propNotifications || contextNotifications;
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Handle notification click
  const handleNotificationClick = useCallback((notification: Notification) => {
    if (isSelectionMode) {
      toggleSelection(notification.id);
      return;
    }

    onNotificationClick?.(notification);
    
    // Mark as read if not already read
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
  }, [isSelectionMode, toggleSelection, onNotificationClick, markAsRead]);

  // Handle long press to enter selection mode
  const handleLongPress = useCallback((notificationId: string) => {
    if (!enableBulkSelection) return;
    
    triggerHapticFeedback('medium');
    toggleSelection(notificationId);
  }, [enableBulkSelection, triggerHapticFeedback, toggleSelection]);

  // Toggle bulk actions menu
  const toggleBulkActions = useCallback(() => {
    setShowBulkActions(!showBulkActions);
  }, [showBulkActions]);

  // Handle bulk action
  const handleBulkAction = useCallback(async (action: 'markRead' | 'delete') => {
    triggerHapticFeedback('heavy');
    
    if (action === 'markRead') {
      await markSelectedAsRead();
    } else if (action === 'delete') {
      await deleteSelected();
    }
    
    setShowBulkActions(false);
  }, [triggerHapticFeedback, markSelectedAsRead, deleteSelected]);

  // Render selection header
  const renderSelectionHeader = () => {
    if (!isSelectionMode) return null;

    return (
      <div className="sticky top-0 z-20 bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={clearSelection}
            className="p-1 hover:bg-blue-700 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <span className="font-medium">
            {selectedCount} selected
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={selectAll}
            className="px-3 py-1.5 text-sm font-medium bg-blue-700 hover:bg-blue-800 rounded-md transition-colors"
            disabled={isAllSelected}
          >
            {isAllSelected ? 'All selected' : 'Select all'}
          </button>
          
          <button
            onClick={toggleBulkActions}
            className="p-2 hover:bg-blue-700 rounded-full transition-colors"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>

        {/* Bulk actions dropdown */}
        {showBulkActions && (
          <div className="absolute right-4 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-30">
            <button
              onClick={() => handleBulkAction('markRead')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
            >
              <Check className="h-4 w-4 mr-3" />
              Mark as read
            </button>
            <button
              onClick={() => handleBulkAction('delete')}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
            >
              <Trash2 className="h-4 w-4 mr-3" />
              Delete
            </button>
          </div>
        )}
      </div>
    );
  };

  // Render notification item with touch optimization
  const renderNotificationItem = (notification: Notification) => {
    const isSelected = selectedNotifications.has(notification.id);
    const touchHandlers = createTouchHandlers(notification.id);

    return (
      <div
        key={notification.id}
        className={`
          relative transition-all duration-200
          ${isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}
          ${isSelectionMode ? 'cursor-pointer' : ''}
        `}
        {...touchHandlers}
        onContextMenu={(e) => {
          e.preventDefault();
          handleLongPress(notification.id);
        }}
      >
        {/* Selection indicator */}
        {isSelectionMode && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
            <div className={`
              w-6 h-6 rounded-full border-2 flex items-center justify-center
              ${isSelected 
                ? 'bg-blue-600 border-blue-600' 
                : 'border-gray-300 bg-white'
              }
            `}>
              {isSelected && (
                <Check className="h-4 w-4 text-white" />
              )}
            </div>
          </div>
        )}

        {/* Notification item */}
        <div className={isSelectionMode ? 'ml-10' : ''}>
          <NotificationItem
            notification={notification}
            onClick={handleNotificationClick}
            onMarkAsRead={markAsRead}
            onDelete={deleteNotification}
            enableSwipe={!isSelectionMode}
            showActions={!isSelectionMode}
          />
        </div>
      </div>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7H4l5-5v5z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
      <p className="text-gray-500 max-w-sm">
        You're all caught up! New notifications will appear here when they arrive.
      </p>
    </div>
  );

  // Main content
  const content = (
    <div className={`touch-optimized-notification-list ${className}`}>
      {renderSelectionHeader()}
      
      <div 
        className="overflow-auto"
        onScroll={handleScroll}
      >
        {notifications.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="divide-y divide-gray-200">
            {notifications.map(renderNotificationItem)}
          </div>
        )}
      </div>
    </div>
  );

  // Wrap with pull to refresh if enabled
  if (enablePullToRefresh) {
    return (
      <PullToRefresh
        onRefresh={refreshNotifications}
        disabled={isSelectionMode}
      >
        {content}
      </PullToRefresh>
    );
  }

  return content;
}

// Touch-optimized notification list with virtual scrolling for large lists
export function VirtualizedTouchOptimizedNotificationList({
  notifications: propNotifications,
  onNotificationClick,
  itemHeight = 120,
  overscan = 5,
  ...props
}: TouchOptimizedNotificationListProps & {
  itemHeight?: number;
  overscan?: number;
}) {
  const { notifications: contextNotifications } = useNotifications();
  const notifications = propNotifications || contextNotifications;
  
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    notifications.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleNotifications = notifications.slice(startIndex, endIndex + 1);
  const totalHeight = notifications.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  const handleResize = useCallback((entries: ResizeObserverEntry[]) => {
    const entry = entries[0];
    if (entry) {
      setContainerHeight(entry.contentRect.height);
    }
  }, []);

  // Set up resize observer
  React.useEffect(() => {
    const resizeObserver = new ResizeObserver(handleResize);
    const container = document.querySelector('.virtualized-container');
    
    if (container) {
      resizeObserver.observe(container);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [handleResize]);

  return (
    <div 
      className="virtualized-container h-full overflow-auto"
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          <TouchOptimizedNotificationList
            notifications={visibleNotifications}
            onNotificationClick={onNotificationClick}
            enablePullToRefresh={false} // Disable for virtualized list
            {...props}
          />
        </div>
      </div>
    </div>
  );
}