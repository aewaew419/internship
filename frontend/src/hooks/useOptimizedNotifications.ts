'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { notificationBatcher } from '../lib/notifications/NotificationBatcher';
import { notificationDebouncer, notificationUpdateDebouncer } from '../lib/notifications/NotificationDebouncer';
import { enhancedNotificationCache } from '../lib/notifications/EnhancedNotificationCache';
import { notificationGrouping } from '../lib/notifications/NotificationGrouping';
import { NotificationOptimizer } from '../lib/notifications/NotificationOptimizer';
import { useNotificationPerformance } from './useNotificationPerformance';
import type { Notification, NotificationType, NotificationCategory } from '../types/notifications';

interface OptimizedNotificationsConfig {
  enableBatching: boolean;
  enableDebouncing: boolean;
  enableCaching: boolean;
  enableGrouping: boolean;
  enableVirtualization: boolean;
  batchSize: number;
  debounceDelay: number;
  cacheSize: number;
  groupingStrategy: string[];
}

interface FilterOptions {
  type?: NotificationType;
  category?: NotificationCategory;
  unreadOnly?: boolean;
  search?: string;
  priority?: 'high' | 'normal' | 'low';
}

interface SortOptions {
  field: 'createdAt' | 'priority' | 'type' | 'isRead';
  direction: 'asc' | 'desc';
}

export function useOptimizedNotifications(
  initialNotifications: Notification[] = [],
  config: Partial<OptimizedNotificationsConfig> = {}
) {
  const {
    enableBatching = true,
    enableDebouncing = true,
    enableCaching = true,
    enableGrouping = false,
    enableVirtualization = true,
    batchSize = 25,
    debounceDelay = 300,
    cacheSize = 1000,
    groupingStrategy = ['smart', 'priority'],
  } = config;

  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [groupedNotifications, setGroupedNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({});
  const [sortOptions, setSortOptions] = useState<SortOptions[]>([
    { field: 'isRead', direction: 'asc' },
    { field: 'priority', direction: 'desc' },
    { field: 'createdAt', direction: 'desc' },
  ]);

  const { measureRender, measureFilter } = useNotificationPerformance();
  const updateCountRef = useRef(0);
  const lastUpdateRef = useRef(Date.now());

  // Memoized filter function
  const memoizedFilter = useMemo(() => 
    NotificationOptimizer.createMemoizedFilter(),
    []
  );

  // Debounced filter function
  const debouncedFilter = useMemo(() =>
    NotificationOptimizer.createDebouncedFilter(
      (filtered) => setFilteredNotifications(filtered),
      debounceDelay
    ),
    [debounceDelay]
  );

  // Process notifications with all optimizations
  const processNotifications = useCallback(async (
    rawNotifications: Notification[],
    currentFilters: FilterOptions,
    currentSort: SortOptions[]
  ) => {
    return measureRender(() => {
      let processed = rawNotifications;

      // Apply caching if enabled
      if (enableCaching) {
        // Try to get from cache first
        const cacheKey = JSON.stringify({ filters: currentFilters, sort: currentSort });
        // In a real implementation, you'd check cache here
      }

      // Apply filtering
      if (Object.keys(currentFilters).length > 0) {
        processed = measureFilter(() => 
          memoizedFilter(processed, currentFilters)
        );
      }

      // Apply sorting
      if (currentSort.length > 0) {
        processed = NotificationOptimizer.sortNotifications(processed, currentSort);
      }

      // Apply grouping if enabled
      if (enableGrouping && processed.length > 3) {
        const groups = notificationGrouping.groupNotifications(processed);
        setGroupedNotifications(groups);
        return groups.flatMap(group => group.notifications);
      }

      return processed;
    });
  }, [enableCaching, enableGrouping, measureRender, measureFilter, memoizedFilter]);

  // Update notifications with debouncing
  const updateNotifications = useCallback((newNotifications: Notification[]) => {
    updateCountRef.current++;
    
    if (enableDebouncing) {
      notificationDebouncer.debounceStateUpdate(
        'notifications',
        newNotifications,
        newNotifications.filter(n => !n.isRead).length,
        debounceDelay
      );
    } else {
      setNotifications(newNotifications);
    }
  }, [enableDebouncing, debounceDelay]);

  // Mark notifications as read with batching/debouncing
  const markAsRead = useCallback(async (notificationIds: string[]) => {
    if (enableBatching) {
      await notificationBatcher.addOperation('mark_read', notificationIds);
    } else if (enableDebouncing) {
      notificationUpdateDebouncer.debounceMarkAsRead(
        notificationIds,
        async (ids) => {
          // Actual API call would go here
          console.log('Marking as read:', ids);
          
          // Update local state optimistically
          setNotifications(prev => 
            prev.map(notification => 
              ids.includes(notification.id) 
                ? { ...notification, isRead: true }
                : notification
            )
          );
        }
      );
    } else {
      // Direct update
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id) 
            ? { ...notification, isRead: true }
            : notification
        )
      );
    }
  }, [enableBatching, enableDebouncing]);

  // Delete notifications with batching/debouncing
  const deleteNotifications = useCallback(async (notificationIds: string[]) => {
    if (enableBatching) {
      await notificationBatcher.addOperation('delete', notificationIds);
    } else if (enableDebouncing) {
      notificationUpdateDebouncer.debounceDelete(
        notificationIds,
        async (ids) => {
          // Actual API call would go here
          console.log('Deleting:', ids);
          
          // Update local state optimistically
          setNotifications(prev => 
            prev.filter(notification => !ids.includes(notification.id))
          );
        }
      );
    } else {
      // Direct update
      setNotifications(prev => 
        prev.filter(notification => !notificationIds.includes(notification.id))
      );
    }
  }, [enableBatching, enableDebouncing]);

  // Update filters with debouncing
  const updateFilters = useCallback((newFilters: FilterOptions) => {
    if (enableDebouncing) {
      notificationDebouncer.debounceFilter(
        newFilters,
        (filters) => setFilters(filters),
        debounceDelay
      );
    } else {
      setFilters(newFilters);
    }
  }, [enableDebouncing, debounceDelay]);

  // Search notifications with debouncing
  const searchNotifications = useCallback((query: string) => {
    if (enableDebouncing) {
      notificationDebouncer.debounceSearch(
        query,
        (searchQuery) => {
          updateFilters({ ...filters, search: searchQuery });
        },
        debounceDelay
      );
    } else {
      updateFilters({ ...filters, search: query });
    }
  }, [enableDebouncing, debounceDelay, filters, updateFilters]);

  // Bulk operations with batching
  const bulkMarkAsRead = useCallback(async (notificationIds: string[]) => {
    if (enableBatching) {
      // Split into batches
      const batches = [];
      for (let i = 0; i < notificationIds.length; i += batchSize) {
        batches.push(notificationIds.slice(i, i + batchSize));
      }

      // Process batches
      for (const batch of batches) {
        await markAsRead(batch);
        // Small delay between batches to prevent overwhelming
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } else {
      await markAsRead(notificationIds);
    }
  }, [enableBatching, batchSize, markAsRead]);

  const bulkDelete = useCallback(async (notificationIds: string[]) => {
    if (enableBatching) {
      const batches = [];
      for (let i = 0; i < notificationIds.length; i += batchSize) {
        batches.push(notificationIds.slice(i, i + batchSize));
      }

      for (const batch of batches) {
        await deleteNotifications(batch);
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } else {
      await deleteNotifications(notificationIds);
    }
  }, [enableBatching, batchSize, deleteNotifications]);

  // Cache management
  const warmupCache = useCallback(async (notificationIds: string[]) => {
    if (enableCaching) {
      await enhancedNotificationCache.warmupCache(notificationIds);
    }
  }, [enableCaching]);

  const clearCache = useCallback(async () => {
    if (enableCaching) {
      await enhancedNotificationCache.clearAll();
    }
  }, [enableCaching]);

  // Process notifications when dependencies change
  useEffect(() => {
    const process = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const processed = await processNotifications(notifications, filters, sortOptions);
        
        if (enableDebouncing) {
          debouncedFilter(notifications, filters);
        } else {
          setFilteredNotifications(processed);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Processing failed');
      } finally {
        setIsLoading(false);
      }
    };

    process();
  }, [notifications, filters, sortOptions, processNotifications, enableDebouncing, debouncedFilter]);

  // Subscribe to batch updates
  useEffect(() => {
    if (!enableBatching) return;

    const unsubscribe = notificationBatcher.subscribe((updates) => {
      // Handle batch updates
      updates.forEach(update => {
        if (update.type === 'deleted') {
          setNotifications(prev => 
            prev.filter(n => n.id !== update.id)
          );
        } else if (update.notification) {
          setNotifications(prev => 
            prev.map(n => 
              n.id === update.id ? update.notification! : n
            )
          );
        }
      });
    });

    return unsubscribe;
  }, [enableBatching]);

  // Subscribe to debounced state updates
  useEffect(() => {
    if (!enableDebouncing) return;

    notificationDebouncer.addListener('state-notifications', (newNotifications, unreadCount) => {
      setNotifications(newNotifications);
    });

    return () => {
      notificationDebouncer.removeListener('state-notifications', () => {});
    };
  }, [enableDebouncing]);

  // Performance metrics
  const performanceMetrics = useMemo(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;
    const updateFrequency = updateCountRef.current / (timeSinceLastUpdate / 1000);

    return {
      updateFrequency,
      notificationCount: notifications.length,
      filteredCount: filteredNotifications.length,
      groupCount: groupedNotifications.length,
      cacheEnabled: enableCaching,
      batchingEnabled: enableBatching,
      debouncingEnabled: enableDebouncing,
      virtualizationEnabled: enableVirtualization,
    };
  }, [
    notifications.length,
    filteredNotifications.length,
    groupedNotifications.length,
    enableCaching,
    enableBatching,
    enableDebouncing,
    enableVirtualization,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      notificationDebouncer.cancelAll();
      notificationUpdateDebouncer.clear();
    };
  }, []);

  return {
    // Data
    notifications: filteredNotifications,
    groupedNotifications,
    unreadCount: filteredNotifications.filter(n => !n.isRead).length,
    
    // State
    isLoading,
    error,
    filters,
    sortOptions,
    
    // Actions
    updateNotifications,
    markAsRead,
    deleteNotifications,
    bulkMarkAsRead,
    bulkDelete,
    updateFilters,
    searchNotifications,
    setSortOptions,
    
    // Cache management
    warmupCache,
    clearCache,
    
    // Performance
    performanceMetrics,
    
    // Configuration
    config: {
      enableBatching,
      enableDebouncing,
      enableCaching,
      enableGrouping,
      enableVirtualization,
      batchSize,
      debounceDelay,
    },
  };
}