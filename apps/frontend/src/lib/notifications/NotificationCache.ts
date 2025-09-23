'use client';

import type { Notification, NotificationType, NotificationCategory } from '../../types/notifications';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheConfig {
  maxSize: number;
  defaultTTL: number; // Time to live in milliseconds
  maxMemoryUsage: number; // Maximum memory usage in bytes
  compressionEnabled: boolean;
}

interface NotificationCacheStats {
  totalEntries: number;
  memoryUsage: number;
  hitRate: number;
  missRate: number;
  evictionCount: number;
}

export class NotificationCache {
  private cache = new Map<string, CacheEntry<any>>();
  private config: CacheConfig;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: config.maxSize || 1000,
      defaultTTL: config.defaultTTL || 5 * 60 * 1000, // 5 minutes
      maxMemoryUsage: config.maxMemoryUsage || 10 * 1024 * 1024, // 10MB
      compressionEnabled: config.compressionEnabled || true,
    };

    // Cleanup expired entries periodically
    setInterval(() => this.cleanup(), 60000); // Every minute
  }

  // Get item from cache
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;

    return this.decompress(entry.data);
  }

  // Set item in cache
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.config.defaultTTL);
    
    const entry: CacheEntry<T> = {
      data: this.compress(data),
      timestamp: now,
      expiresAt,
      accessCount: 0,
      lastAccessed: now,
    };

    // Check if we need to evict items
    if (this.cache.size >= this.config.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    // Check memory usage
    if (this.getMemoryUsage() > this.config.maxMemoryUsage) {
      this.evictByMemoryPressure();
    }

    this.cache.set(key, entry);
  }

  // Delete item from cache
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Check if key exists in cache
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  // Clear all cache entries
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0 };
  }

  // Get cache statistics
  getStats(): NotificationCacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    return {
      totalEntries: this.cache.size,
      memoryUsage: this.getMemoryUsage(),
      hitRate: totalRequests > 0 ? this.stats.hits / totalRequests : 0,
      missRate: totalRequests > 0 ? this.stats.misses / totalRequests : 0,
      evictionCount: this.stats.evictions,
    };
  }

  // Compress data if enabled
  private compress<T>(data: T): T | string {
    if (!this.config.compressionEnabled) return data;
    
    try {
      // Simple JSON compression - in production, use a proper compression library
      const jsonString = JSON.stringify(data);
      if (jsonString.length > 1000) {
        // Only compress larger objects
        return this.simpleCompress(jsonString);
      }
      return data;
    } catch {
      return data;
    }
  }

  // Decompress data if needed
  private decompress<T>(data: T | string): T {
    if (!this.config.compressionEnabled || typeof data !== 'string') {
      return data as T;
    }
    
    try {
      // Check if it's compressed
      if (data.startsWith('COMPRESSED:')) {
        const decompressed = this.simpleDecompress(data);
        return JSON.parse(decompressed);
      }
      return data as T;
    } catch {
      return data as T;
    }
  }

  // Simple compression (in production, use a proper library like pako)
  private simpleCompress(str: string): string {
    // This is a placeholder - use proper compression in production
    return 'COMPRESSED:' + btoa(str);
  }

  // Simple decompression
  private simpleDecompress(compressed: string): string {
    return atob(compressed.replace('COMPRESSED:', ''));
  }

  // Evict least recently used items
  private evictLeastRecentlyUsed(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  // Evict items based on memory pressure
  private evictByMemoryPressure(): void {
    // Sort by access frequency and recency
    const entries = Array.from(this.cache.entries()).sort((a, b) => {
      const scoreA = a[1].accessCount / (Date.now() - a[1].lastAccessed);
      const scoreB = b[1].accessCount / (Date.now() - b[1].lastAccessed);
      return scoreA - scoreB;
    });

    // Remove bottom 25% of entries
    const toRemove = Math.ceil(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
      this.stats.evictions++;
    }
  }

  // Estimate memory usage
  private getMemoryUsage(): number {
    let totalSize = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      // Rough estimation of memory usage
      totalSize += key.length * 2; // UTF-16 characters
      totalSize += JSON.stringify(entry).length * 2;
    }
    
    return totalSize;
  }

  // Cleanup expired entries
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// Specialized notification cache with intelligent caching strategies
export class IntelligentNotificationCache extends NotificationCache {
  private notificationCache = new Map<string, CacheEntry<Notification>>();
  private listCache = new Map<string, CacheEntry<Notification[]>>();
  private warmupQueue = new Set<string>();

  constructor(config?: Partial<CacheConfig>) {
    super(config);
  }

  // Cache individual notification
  cacheNotification(notification: Notification, ttl?: number): void {
    const key = `notification:${notification.id}`;
    this.set(key, notification, ttl);
    
    // Also cache in specialized notification cache
    const now = Date.now();
    this.notificationCache.set(notification.id, {
      data: notification,
      timestamp: now,
      expiresAt: now + (ttl || this.config.defaultTTL),
      accessCount: 0,
      lastAccessed: now,
    });
  }

  // Get cached notification
  getCachedNotification(id: string): Notification | null {
    // Try specialized cache first
    const entry = this.notificationCache.get(id);
    if (entry && Date.now() <= entry.expiresAt) {
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      return entry.data;
    }

    // Fallback to general cache
    return this.get<Notification>(`notification:${id}`);
  }

  // Cache notification list with filters
  cacheNotificationList(
    notifications: Notification[],
    filters: {
      type?: NotificationType;
      category?: NotificationCategory;
      unreadOnly?: boolean;
      search?: string;
    } = {},
    ttl?: number
  ): void {
    const key = this.generateListCacheKey(filters);
    this.set(key, notifications, ttl);
    
    // Cache individual notifications as well
    notifications.forEach(notification => {
      this.cacheNotification(notification, ttl);
    });
  }

  // Get cached notification list
  getCachedNotificationList(filters: {
    type?: NotificationType;
    category?: NotificationCategory;
    unreadOnly?: boolean;
    search?: string;
  } = {}): Notification[] | null {
    const key = this.generateListCacheKey(filters);
    return this.get<Notification[]>(key);
  }

  // Invalidate notification cache
  invalidateNotification(id: string): void {
    this.delete(`notification:${id}`);
    this.notificationCache.delete(id);
    
    // Invalidate related list caches
    this.invalidateListCaches();
  }

  // Invalidate all list caches
  invalidateListCaches(): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.startsWith('list:')) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
  }

  // Warm up cache with frequently accessed notifications
  async warmupCache(notificationIds: string[]): Promise<void> {
    const uncachedIds = notificationIds.filter(id => 
      !this.getCachedNotification(id) && !this.warmupQueue.has(id)
    );

    if (uncachedIds.length === 0) return;

    // Add to warmup queue to prevent duplicate requests
    uncachedIds.forEach(id => this.warmupQueue.add(id));

    try {
      // In a real implementation, you'd fetch these from the API
      // For now, we'll just mark them as warmed up
      await new Promise(resolve => setTimeout(resolve, 100));
      
      uncachedIds.forEach(id => this.warmupQueue.delete(id));
    } catch (error) {
      console.error('Cache warmup failed:', error);
      uncachedIds.forEach(id => this.warmupQueue.delete(id));
    }
  }

  // Generate cache key for notification lists
  private generateListCacheKey(filters: {
    type?: NotificationType;
    category?: NotificationCategory;
    unreadOnly?: boolean;
    search?: string;
  }): string {
    const parts = ['list'];
    
    if (filters.type) parts.push(`type:${filters.type}`);
    if (filters.category) parts.push(`category:${filters.category}`);
    if (filters.unreadOnly) parts.push('unread:true');
    if (filters.search) parts.push(`search:${filters.search}`);
    
    return parts.join(':');
  }

  // Get cache efficiency metrics
  getCacheEfficiency(): {
    notificationHitRate: number;
    listHitRate: number;
    memoryEfficiency: number;
  } {
    const stats = this.getStats();
    const memoryEfficiency = this.config.maxMemoryUsage > 0 
      ? 1 - (stats.memoryUsage / this.config.maxMemoryUsage)
      : 1;

    return {
      notificationHitRate: stats.hitRate,
      listHitRate: stats.hitRate, // Simplified for now
      memoryEfficiency,
    };
  }
}

// Global cache instance
export const notificationCache = new IntelligentNotificationCache({
  maxSize: 2000,
  defaultTTL: 10 * 60 * 1000, // 10 minutes
  maxMemoryUsage: 20 * 1024 * 1024, // 20MB
  compressionEnabled: true,
});