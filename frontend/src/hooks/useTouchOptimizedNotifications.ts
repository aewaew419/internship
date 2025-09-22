'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useNotifications } from './useNotifications';
import type { Notification } from '../types/notifications';

interface TouchOptimizedOptions {
  enableHapticFeedback?: boolean;
  longPressDelay?: number;
  pullToRefreshThreshold?: number;
  minTouchTargetSize?: number;
}

interface TouchOptimizedState {
  selectedNotifications: Set<string>;
  isSelectionMode: boolean;
  isPullToRefresh: boolean;
  pullOffset: number;
  longPressTarget: string | null;
}

export function useTouchOptimizedNotifications(options: TouchOptimizedOptions = {}) {
  const {
    enableHapticFeedback = true,
    longPressDelay = 500,
    pullToRefreshThreshold = 80,
    minTouchTargetSize = 44,
  } = options;

  const { 
    notifications, 
    markAsRead, 
    deleteNotification, 
    markAllAsRead,
    refreshNotifications 
  } = useNotifications();

  const [state, setState] = useState<TouchOptimizedState>({
    selectedNotifications: new Set(),
    isSelectionMode: false,
    isPullToRefresh: false,
    pullOffset: 0,
    longPressTarget: null,
  });

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const pullStartY = useRef<number>(0);
  const isPulling = useRef<boolean>(false);

  // Haptic feedback helper
  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!enableHapticFeedback || !navigator.vibrate) return;
    
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
    };
    
    navigator.vibrate(patterns[type]);
  }, [enableHapticFeedback]);

  // Long press handling
  const startLongPress = useCallback((notificationId: string) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }

    setState(prev => ({ ...prev, longPressTarget: notificationId }));

    longPressTimer.current = setTimeout(() => {
      triggerHapticFeedback('medium');
      setState(prev => ({
        ...prev,
        isSelectionMode: true,
        selectedNotifications: new Set([notificationId]),
        longPressTarget: null,
      }));
    }, longPressDelay);
  }, [longPressDelay, triggerHapticFeedback]);

  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setState(prev => ({ ...prev, longPressTarget: null }));
  }, []);

  // Selection handling
  const toggleSelection = useCallback((notificationId: string) => {
    setState(prev => {
      const newSelected = new Set(prev.selectedNotifications);
      if (newSelected.has(notificationId)) {
        newSelected.delete(notificationId);
      } else {
        newSelected.add(notificationId);
      }

      return {
        ...prev,
        selectedNotifications: newSelected,
        isSelectionMode: newSelected.size > 0,
      };
    });
    
    triggerHapticFeedback('light');
  }, [triggerHapticFeedback]);

  const selectAll = useCallback(() => {
    const allIds = new Set(notifications.map(n => n.id));
    setState(prev => ({
      ...prev,
      selectedNotifications: allIds,
      isSelectionMode: true,
    }));
    triggerHapticFeedback('medium');
  }, [notifications, triggerHapticFeedback]);

  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedNotifications: new Set(),
      isSelectionMode: false,
    }));
  }, []);

  // Bulk operations
  const markSelectedAsRead = useCallback(async () => {
    const selectedIds = Array.from(state.selectedNotifications);
    
    try {
      await Promise.all(
        selectedIds.map(id => markAsRead(id))
      );
      triggerHapticFeedback('heavy');
      clearSelection();
    } catch (error) {
      console.error('Failed to mark selected notifications as read:', error);
    }
  }, [state.selectedNotifications, markAsRead, triggerHapticFeedback, clearSelection]);

  const deleteSelected = useCallback(async () => {
    const selectedIds = Array.from(state.selectedNotifications);
    
    try {
      await Promise.all(
        selectedIds.map(id => deleteNotification(id))
      );
      triggerHapticFeedback('heavy');
      clearSelection();
    } catch (error) {
      console.error('Failed to delete selected notifications:', error);
    }
  }, [state.selectedNotifications, deleteNotification, triggerHapticFeedback, clearSelection]);

  // Pull to refresh handling
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (event.touches.length !== 1) return;
    
    const touch = event.touches[0];
    pullStartY.current = touch.clientY;
    
    // Only start pull to refresh if at the top of the list
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    if (scrollTop === 0) {
      isPulling.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!isPulling.current || event.touches.length !== 1) return;
    
    const touch = event.touches[0];
    const deltaY = touch.clientY - pullStartY.current;
    
    if (deltaY > 0) {
      const offset = Math.min(deltaY * 0.5, pullToRefreshThreshold * 1.5);
      setState(prev => ({
        ...prev,
        pullOffset: offset,
        isPullToRefresh: offset >= pullToRefreshThreshold,
      }));
      
      // Haptic feedback when threshold is reached
      if (offset >= pullToRefreshThreshold && !state.isPullToRefresh) {
        triggerHapticFeedback('medium');
      }
    }
  }, [pullToRefreshThreshold, triggerHapticFeedback, state.isPullToRefresh]);

  const handleTouchEnd = useCallback(async () => {
    if (isPulling.current && state.pullOffset >= pullToRefreshThreshold) {
      setState(prev => ({ ...prev, isPullToRefresh: true }));
      
      try {
        await refreshNotifications();
        triggerHapticFeedback('heavy');
      } catch (error) {
        console.error('Failed to refresh notifications:', error);
      }
    }
    
    // Reset pull state
    setState(prev => ({
      ...prev,
      pullOffset: 0,
      isPullToRefresh: false,
    }));
    
    isPulling.current = false;
  }, [state.pullOffset, pullToRefreshThreshold, refreshNotifications, triggerHapticFeedback]);

  // Touch target size validation
  const validateTouchTarget = useCallback((element: HTMLElement): boolean => {
    const rect = element.getBoundingClientRect();
    return rect.width >= minTouchTargetSize && rect.height >= minTouchTargetSize;
  }, [minTouchTargetSize]);

  // Enhanced touch handlers for notification items
  const createTouchHandlers = useCallback((notificationId: string) => {
    return {
      onTouchStart: (event: React.TouchEvent) => {
        event.preventDefault();
        startLongPress(notificationId);
      },
      
      onTouchEnd: (event: React.TouchEvent) => {
        event.preventDefault();
        cancelLongPress();
        
        if (state.isSelectionMode) {
          toggleSelection(notificationId);
        }
      },
      
      onTouchMove: (event: React.TouchEvent) => {
        // Cancel long press if user moves finger
        cancelLongPress();
      },
      
      onTouchCancel: (event: React.TouchEvent) => {
        cancelLongPress();
      },
    };
  }, [startLongPress, cancelLongPress, state.isSelectionMode, toggleSelection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  // Global touch event listeners for pull to refresh
  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    // State
    selectedNotifications: state.selectedNotifications,
    isSelectionMode: state.isSelectionMode,
    isPullToRefresh: state.isPullToRefresh,
    pullOffset: state.pullOffset,
    longPressTarget: state.longPressTarget,
    
    // Selection actions
    toggleSelection,
    selectAll,
    clearSelection,
    
    // Bulk operations
    markSelectedAsRead,
    deleteSelected,
    
    // Touch handlers
    createTouchHandlers,
    triggerHapticFeedback,
    validateTouchTarget,
    
    // Utilities
    selectedCount: state.selectedNotifications.size,
    hasSelection: state.selectedNotifications.size > 0,
    isAllSelected: state.selectedNotifications.size === notifications.length,
  };
}

// Hook for managing touch-optimized notification list
export function useTouchOptimizedNotificationList() {
  const touchOptimized = useTouchOptimizedNotifications();
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimer = useRef<NodeJS.Timeout | null>(null);

  const handleScroll = useCallback((event: React.UIEvent<HTMLElement>) => {
    const target = event.currentTarget;
    setScrollPosition(target.scrollTop);
    setIsScrolling(true);

    // Clear existing timer
    if (scrollTimer.current) {
      clearTimeout(scrollTimer.current);
    }

    // Set new timer to detect scroll end
    scrollTimer.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scrollTimer.current) {
        clearTimeout(scrollTimer.current);
      }
    };
  }, []);

  return {
    ...touchOptimized,
    scrollPosition,
    isScrolling,
    handleScroll,
  };
}

// Hook for touch-optimized notification actions
export function useTouchOptimizedActions() {
  const { markAsRead, deleteNotification } = useNotifications();
  
  const createActionButton = useCallback((
    action: () => void,
    label: string,
    variant: 'primary' | 'secondary' | 'danger' = 'primary'
  ) => {
    const baseClasses = `
      min-h-[44px] min-w-[44px] px-4 py-2 rounded-lg font-medium text-sm
      transition-all duration-200 active:scale-95
      focus:outline-none focus:ring-2 focus:ring-offset-2
    `;
    
    const variantClasses = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    };

    return {
      onClick: action,
      className: `${baseClasses} ${variantClasses[variant]}`,
      'aria-label': label,
    };
  }, []);

  const createSwipeAction = useCallback((
    notificationId: string,
    type: 'markAsRead' | 'delete'
  ) => {
    const actions = {
      markAsRead: () => markAsRead(notificationId),
      delete: () => deleteNotification(notificationId),
    };

    return actions[type];
  }, [markAsRead, deleteNotification]);

  return {
    createActionButton,
    createSwipeAction,
  };
}