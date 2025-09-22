'use client';

import type { Notification, NotificationType, NotificationCategory } from '../../types/notifications';

interface FilterOptions {
  type?: NotificationType;
  category?: NotificationCategory;
  unreadOnly?: boolean;
  search?: string;
  priority?: 'high' | 'normal' | 'low';
  dateRange?: {
    start: Date;
    end: Date;
  };
}

interface SortOptions {
  field: 'createdAt' | 'priority' | 'type' | 'isRead';
  direction: 'asc' | 'desc';
}

// Efficient notification filtering and sorting
export class NotificationOptimizer {
  private static searchIndex = new Map<string, Set<string>>();
  private static lastIndexUpdate = 0;
  private static readonly INDEX_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

  // Build search index for fast text searching
  static buildSearchIndex(notifications: Notification[]): void {
    const now = Date.now();
    
    // Only rebuild index if it's stale
    if (now - this.lastIndexUpdate < this.INDEX_UPDATE_INTERVAL) {
      return;
    }

    this.searchIndex.clear();
    
    notifications.forEach(notification => {
      const searchableText = [
        notification.title,
        notification.body,
        notification.type,
        notification.category,
      ].join(' ').toLowerCase();
      
      // Create n-grams for better search
      const words = searchableText.split(/\s+/);
      words.forEach(word => {
        if (word.length >= 2) {
          for (let i = 0; i <= word.length - 2; i++) {
            const ngram = word.substring(i, i + 3);
            if (!this.searchIndex.has(ngram)) {
              this.searchIndex.set(ngram, new Set());
            }
            this.searchIndex.get(ngram)!.add(notification.id);
          }
        }
      });
    });
    
    this.lastIndexUpdate = now;
  }

  // Fast text search using index
  static searchNotifications(
    notifications: Notification[],
    query: string
  ): Notification[] {
    if (!query || query.length < 2) {
      return notifications;
    }

    const normalizedQuery = query.toLowerCase().trim();
    
    // Use index for fast search if available
    if (this.searchIndex.size > 0) {
      return this.searchWithIndex(notifications, normalizedQuery);
    }
    
    // Fallback to direct search
    return this.searchDirect(notifications, normalizedQuery);
  }

  // Search using pre-built index
  private static searchWithIndex(
    notifications: Notification[],
    query: string
  ): Notification[] {
    const matchingIds = new Set<string>();
    
    // Find all n-grams in the query
    for (let i = 0; i <= query.length - 2; i++) {
      const ngram = query.substring(i, i + 3);
      const ids = this.searchIndex.get(ngram);
      if (ids) {
        ids.forEach(id => matchingIds.add(id));
      }
    }
    
    // Filter notifications by matching IDs
    return notifications.filter(notification => 
      matchingIds.has(notification.id)
    );
  }

  // Direct search without index
  private static searchDirect(
    notifications: Notification[],
    query: string
  ): Notification[] {
    return notifications.filter(notification => {
      const searchableText = [
        notification.title,
        notification.body,
        notification.type,
        notification.category,
      ].join(' ').toLowerCase();
      
      return searchableText.includes(query);
    });
  }

  // Efficient filtering with multiple criteria
  static filterNotifications(
    notifications: Notification[],
    filters: FilterOptions
  ): Notification[] {
    let filtered = notifications;

    // Apply filters in order of selectivity (most selective first)
    
    // Date range filter (often most selective)
    if (filters.dateRange) {
      filtered = filtered.filter(notification => {
        const createdAt = new Date(notification.createdAt);
        return createdAt >= filters.dateRange!.start && 
               createdAt <= filters.dateRange!.end;
      });
    }

    // Type filter
    if (filters.type) {
      filtered = filtered.filter(notification => 
        notification.type === filters.type
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(notification => 
        notification.category === filters.category
      );
    }

    // Priority filter
    if (filters.priority) {
      filtered = filtered.filter(notification => 
        notification.priority === filters.priority
      );
    }

    // Unread filter
    if (filters.unreadOnly) {
      filtered = filtered.filter(notification => !notification.isRead);
    }

    // Search filter (most expensive, do last)
    if (filters.search) {
      filtered = this.searchNotifications(filtered, filters.search);
    }

    return filtered;
  }

  // Efficient sorting with multiple criteria
  static sortNotifications(
    notifications: Notification[],
    sortOptions: SortOptions[]
  ): Notification[] {
    if (sortOptions.length === 0) {
      return notifications;
    }

    return [...notifications].sort((a, b) => {
      for (const sort of sortOptions) {
        const result = this.compareNotifications(a, b, sort);
        if (result !== 0) {
          return result;
        }
      }
      return 0;
    });
  }

  // Compare two notifications for sorting
  private static compareNotifications(
    a: Notification,
    b: Notification,
    sort: SortOptions
  ): number {
    let result = 0;

    switch (sort.field) {
      case 'createdAt':
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        result = dateA - dateB;
        break;
        
      case 'priority':
        const priorityOrder = { high: 3, normal: 2, low: 1 };
        result = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
        
      case 'type':
        result = a.type.localeCompare(b.type);
        break;
        
      case 'isRead':
        result = (a.isRead ? 1 : 0) - (b.isRead ? 1 : 0);
        break;
        
      default:
        result = 0;
    }

    return sort.direction === 'desc' ? -result : result;
  }

  // Get smart default sorting
  static getSmartSort(): SortOptions[] {
    return [
      { field: 'isRead', direction: 'asc' }, // Unread first
      { field: 'priority', direction: 'desc' }, // High priority first
      { field: 'createdAt', direction: 'desc' }, // Newest first
    ];
  }

  // Paginate notifications efficiently
  static paginateNotifications(
    notifications: Notification[],
    page: number,
    pageSize: number
  ): {
    notifications: Notification[];
    totalPages: number;
    currentPage: number;
    hasMore: boolean;
  } {
    const totalPages = Math.ceil(notifications.length / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return {
      notifications: notifications.slice(startIndex, endIndex),
      totalPages,
      currentPage: page,
      hasMore: page < totalPages,
    };
  }

  // Get notification statistics for UI
  static getNotificationStats(notifications: Notification[]): {
    total: number;
    unread: number;
    byType: Record<NotificationType, number>;
    byCategory: Record<NotificationCategory, number>;
    byPriority: Record<'high' | 'normal' | 'low', number>;
  } {
    const stats = {
      total: notifications.length,
      unread: 0,
      byType: {} as Record<NotificationType, number>,
      byCategory: {} as Record<NotificationCategory, number>,
      byPriority: { high: 0, normal: 0, low: 0 },
    };

    notifications.forEach(notification => {
      if (!notification.isRead) {
        stats.unread++;
      }

      // Count by type
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;

      // Count by category
      stats.byCategory[notification.category] = 
        (stats.byCategory[notification.category] || 0) + 1;

      // Count by priority
      stats.byPriority[notification.priority]++;
    });

    return stats;
  }

  // Optimize notification list for rendering
  static optimizeForRendering(
    notifications: Notification[],
    visibleRange: { start: number; end: number }
  ): {
    visibleNotifications: Notification[];
    preloadNotifications: Notification[];
    totalCount: number;
  } {
    const { start, end } = visibleRange;
    const preloadBuffer = 10; // Preload 10 items before and after visible range
    
    const preloadStart = Math.max(0, start - preloadBuffer);
    const preloadEnd = Math.min(notifications.length, end + preloadBuffer);
    
    return {
      visibleNotifications: notifications.slice(start, end),
      preloadNotifications: notifications.slice(preloadStart, preloadEnd),
      totalCount: notifications.length,
    };
  }

  // Debounced filter function
  static createDebouncedFilter(
    callback: (notifications: Notification[]) => void,
    delay: number = 300
  ): (notifications: Notification[], filters: FilterOptions) => void {
    let timeoutId: NodeJS.Timeout;
    
    return (notifications: Notification[], filters: FilterOptions) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const filtered = this.filterNotifications(notifications, filters);
        callback(filtered);
      }, delay);
    };
  }

  // Memoized filter function
  static createMemoizedFilter(): (
    notifications: Notification[],
    filters: FilterOptions
  ) => Notification[] {
    const cache = new Map<string, Notification[]>();
    const maxCacheSize = 50;
    
    return (notifications: Notification[], filters: FilterOptions) => {
      // Create cache key from filters and notification count
      const cacheKey = JSON.stringify({
        filters,
        count: notifications.length,
        lastModified: Math.max(...notifications.map(n => 
          new Date(n.createdAt).getTime()
        )),
      });
      
      // Check cache
      if (cache.has(cacheKey)) {
        return cache.get(cacheKey)!;
      }
      
      // Filter notifications
      const filtered = this.filterNotifications(notifications, filters);
      
      // Store in cache (with size limit)
      if (cache.size >= maxCacheSize) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      cache.set(cacheKey, filtered);
      
      return filtered;
    };
  }
}

// Performance monitoring for notification operations
export class NotificationPerformanceMonitor {
  private static metrics = new Map<string, number[]>();

  // Record operation timing
  static recordTiming(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    const timings = this.metrics.get(operation)!;
    timings.push(duration);
    
    // Keep only last 100 measurements
    if (timings.length > 100) {
      timings.shift();
    }
  }

  // Get performance statistics
  static getStats(operation: string): {
    average: number;
    min: number;
    max: number;
    p95: number;
    count: number;
  } | null {
    const timings = this.metrics.get(operation);
    if (!timings || timings.length === 0) {
      return null;
    }

    const sorted = [...timings].sort((a, b) => a - b);
    const sum = timings.reduce((acc, val) => acc + val, 0);
    
    return {
      average: sum / timings.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      count: timings.length,
    };
  }

  // Measure function execution time
  static measure<T>(
    operation: string,
    fn: () => T
  ): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    this.recordTiming(operation, duration);
    
    return result;
  }

  // Measure async function execution time
  static async measureAsync<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    
    this.recordTiming(operation, duration);
    
    return result;
  }

  // Get all performance metrics
  static getAllStats(): Record<string, ReturnType<typeof NotificationPerformanceMonitor.getStats>> {
    const stats: Record<string, any> = {};
    
    for (const operation of this.metrics.keys()) {
      stats[operation] = this.getStats(operation);
    }
    
    return stats;
  }

  // Clear all metrics
  static clearMetrics(): void {
    this.metrics.clear();
  }
}