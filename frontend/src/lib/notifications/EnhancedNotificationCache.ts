'use client';

import { NotificationCache, IntelligentNotificationCache } from './NotificationCache';
import { notificationStorage } from './NotificationStorage';
import type { Notification, NotificationType, NotificationCategory } from '../../types/notifications';

interface CacheLayer {
  name: string;
  priority: number;
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, data: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

interface CacheStrategy {
  name: string;
  shouldCache: (notification: Notification) => boolean;
  getTTL: (notification: Notification) => number;
  getPriority: (notification: Notification) => number;
}

// Memory cache layer
class MemoryCacheLayer implements CacheLayer {
  name = 'memory';
  priority = 1;
  private cache = new IntelligentNotificationCache();

  async get<T>(key: string): Promise<T | null> {
    return this.cache.get<T>(key);
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    this.cache.set(key, data, ttl);
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }
}

// IndexedDB cache layer
class StorageCacheLayer implements CacheLayer {
  name = 'storage';
  priority = 2;

  async get<T>(key: string): Promise<T | null> {
    if (key.startsWith('notification:')) {
      const id = key.replace('notification:', '');
      return await notificationStorage.getNotification(id) as T | null;
    } else if (key.startsWith('list:')) {
      return await notificationStorage.getCachedList(key) as T | null;
    }
    return null;
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    if (key.startsWith('notification:') && data) {
      await notificationStorage.storeNotification(data as Notification);
    } else if (key.startsWith('list:') && Array.isArray(data)) {
      await notificationStorage.cacheList(key, data as Notification[], ttl);
    }
  }

  async delete(key: string): Promise<void> {
    if (key.startsWith('notification:')) {
      const id = key.replace('notification:', '');
      await notificationStorage.deleteNotification(id);
    }
  }

  async clear(): Promise<void> {
    await notificationStorage.clearAll();
  }
}

// Cache strategies
const cacheStrategies: CacheStrategy[] = [
  {
    name: 'high-priority',
    shouldCache: (notification) => notification.priority === 'high',
    getTTL: () => 30 * 60 * 1000, // 30 minutes
    getPriority: () => 10,
  },
  {
    name: 'unread',
    shouldCache: (notification) => !notification.isRead,
    getTTL: () => 15 * 60 * 1000, // 15 minutes
    getPriority: () => 8,
  },
  {
    name: 'recent',
    shouldCache: (notification) => {
      const age = Date.now() - new Date(notification.createdAt).getTime();
      return age < 24 * 60 * 60 * 1000; // 24 hours
    },
    getTTL: () => 10 * 60 * 1000, // 10 minutes
    getPriority: () => 6,
  },
  {
    name: 'default',
    shouldCache: () => true,
    getTTL: () => 5 * 60 * 1000, // 5 minutes
    getPriority: () => 1,
  },
];

export class EnhancedNotificationCache {
  private layers: CacheLayer[] = [];
  private strategies = cacheStrategies;
  private stats = {
    hits: { memory: 0, storage: 0 },
    misses: { memory: 0, storage: 0 },
    sets: { memory: 0, storage: 0 },
  };

  constructor() {
    this.layers = [
      new MemoryCacheLayer(),
      new StorageCacheLayer(),
    ].sort((a, b) => a.priority - b.priority);
  }

  // Get notification with multi-layer caching
  async getNotification(id: string): Promise<Notification | null> {
    const key = `notification:${id}`;
    
    for (const layer of this.layers) {
      try {
        const result = await layer.get<Notification>(key);
        if (result) {
          this.stats.hits[layer.name as keyof typeof this.stats.hits]++;
          
          // Promote to higher priority layers
          await this.promoteToHigherLayers(key, result, layer);
          
          return result;
        }
      } catch (error) {
        console.warn(`Cache layer ${layer.name} failed:`, error);
      }
    }

    // Record miss for all layers
    this.layers.forEach(layer => {
      this.stats.misses[layer.name as keyof typeof this.stats.misses]++;
    });

    return null;
  }

  // Cache notification with intelligent strategy selection
  async cacheNotification(notification: Notification): Promise<void> {
    const key = `notification:${notification.id}`;
    const strategy = this.selectStrategy(notification);
    const ttl = strategy.getTTL(notification);

    // Cache in all appropriate layers
    for (const layer of this.layers) {
      try {
        await layer.set(key, notification, ttl);
        this.stats.sets[layer.name as keyof typeof this.stats.sets]++;
      } catch (error) {
        console.warn(`Failed to cache in layer ${layer.name}:`, error);
      }
    }
  }

  // Get notification list with caching
  async getNotificationList(filters: {
    type?: NotificationType;
    category?: NotificationCategory;
    unreadOnly?: boolean;
    search?: string;
  } = {}): Promise<Notification[] | null> {
    const key = this.generateListCacheKey(filters);
    
    for (const layer of this.layers) {
      try {
        const result = await layer.get<Notification[]>(key);
        if (result) {
          this.stats.hits[layer.name as keyof typeof this.stats.hits]++;
          
          // Promote to higher priority layers
          await this.promoteToHigherLayers(key, result, layer);
          
          return result;
        }
      } catch (error) {
        console.warn(`Cache layer ${layer.name} failed:`, error);
      }
    }

    this.layers.forEach(layer => {
      this.stats.misses[layer.name as keyof typeof this.stats.misses]++;
    });

    return null;
  }

  // Cache notification list
  async cacheNotificationList(
    notifications: Notification[],
    filters: {
      type?: NotificationType;
      category?: NotificationCategory;
      unreadOnly?: boolean;
      search?: string;
    } = {},
    ttl: number = 5 * 60 * 1000
  ): Promise<void> {
    const key = this.generateListCacheKey(filters);

    // Cache the list
    for (const layer of this.layers) {
      try {
        await layer.set(key, notifications, ttl);
        this.stats.sets[layer.name as keyof typeof this.stats.sets]++;
      } catch (error) {
        console.warn(`Failed to cache list in layer ${layer.name}:`, error);
      }
    }

    // Also cache individual notifications
    await Promise.all(
      notifications.map(notification => this.cacheNotification(notification))
    );
  }

  // Invalidate notification
  async invalidateNotification(id: string): Promise<void> {
    const key = `notification:${id}`;
    
    await Promise.all(
      this.layers.map(async (layer) => {
        try {
          await layer.delete(key);
        } catch (error) {
          console.warn(`Failed to invalidate in layer ${layer.name}:`, error);
        }
      })
    );

    // Also invalidate related list caches
    await this.invalidateListCaches();
  }

  // Invalidate all list caches
  async invalidateListCaches(): Promise<void> {
    // This is a simplified implementation
    // In a real system, you'd track which lists contain which notifications
    for (const layer of this.layers) {
      if (layer.name === 'memory') {
        // Clear memory cache list entries
        const memoryLayer = layer as MemoryCacheLayer;
        // Implementation would depend on the memory cache structure
      }
    }
  }

  // Warm up cache with frequently accessed notifications
  async warmupCache(notificationIds: string[]): Promise<void> {
    const batchSize = 10;
    
    for (let i = 0; i < notificationIds.length; i += batchSize) {
      const batch = notificationIds.slice(i, i + batchSize);
      
      await Promise.all(
        batch.map(async (id) => {
          // Check if already cached
          const cached = await this.getNotification(id);
          if (!cached) {
            // In a real implementation, you'd fetch from API here
            console.log(`Would fetch notification ${id} for warmup`);
          }
        })
      );

      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  // Preload notifications based on usage patterns
  async preloadNotifications(patterns: {
    userRole: string;
    timeOfDay: number;
    dayOfWeek: number;
  }): Promise<void> {
    // This would use machine learning or heuristics to predict
    // which notifications the user is likely to need
    
    const predictedTypes: NotificationType[] = [];
    
    // Simple heuristics based on patterns
    if (patterns.userRole === 'student') {
      predictedTypes.push(
        NotificationType.ASSIGNMENT_CHANGE,
        NotificationType.GRADE_UPDATE,
        NotificationType.DEADLINE_REMINDER
      );
    } else if (patterns.userRole === 'instructor') {
      predictedTypes.push(
        NotificationType.EVALUATION_REQUEST,
        NotificationType.VISIT_SCHEDULED
      );
    }

    // Preload notifications of predicted types
    for (const type of predictedTypes) {
      const cached = await this.getNotificationList({ type });
      if (!cached) {
        console.log(`Would preload notifications of type ${type}`);
      }
    }
  }

  // Get cache statistics
  getStats(): {
    hitRate: { memory: number; storage: number; overall: number };
    distribution: { memory: number; storage: number };
    efficiency: number;
  } {
    const memoryTotal = this.stats.hits.memory + this.stats.misses.memory;
    const storageTotal = this.stats.hits.storage + this.stats.misses.storage;
    const overallTotal = memoryTotal + storageTotal;

    return {
      hitRate: {
        memory: memoryTotal > 0 ? this.stats.hits.memory / memoryTotal : 0,
        storage: storageTotal > 0 ? this.stats.hits.storage / storageTotal : 0,
        overall: overallTotal > 0 ? (this.stats.hits.memory + this.stats.hits.storage) / overallTotal : 0,
      },
      distribution: {
        memory: this.stats.sets.memory,
        storage: this.stats.sets.storage,
      },
      efficiency: this.calculateEfficiency(),
    };
  }

  // Clear all caches
  async clearAll(): Promise<void> {
    await Promise.all(
      this.layers.map(layer => layer.clear())
    );
    
    // Reset stats
    this.stats = {
      hits: { memory: 0, storage: 0 },
      misses: { memory: 0, storage: 0 },
      sets: { memory: 0, storage: 0 },
    };
  }

  // Optimize cache based on usage patterns
  async optimize(): Promise<void> {
    // Clean up expired entries
    await notificationStorage.clearExpiredCache();
    
    // Clean up old notifications
    const deletedCount = await notificationStorage.cleanup();
    console.log(`Cleaned up ${deletedCount} old notifications`);

    // Analyze cache performance and adjust strategies
    const stats = this.getStats();
    
    if (stats.hitRate.memory < 0.7) {
      console.log('Memory cache hit rate is low, consider increasing cache size');
    }
    
    if (stats.hitRate.storage < 0.5) {
      console.log('Storage cache hit rate is low, consider adjusting TTL');
    }
  }

  // Select appropriate caching strategy for notification
  private selectStrategy(notification: Notification): CacheStrategy {
    // Find the first strategy that matches
    return this.strategies.find(strategy => 
      strategy.shouldCache(notification)
    ) || this.strategies[this.strategies.length - 1]; // fallback to default
  }

  // Promote data to higher priority cache layers
  private async promoteToHigherLayers<T>(
    key: string,
    data: T,
    sourceLayer: CacheLayer
  ): Promise<void> {
    const higherLayers = this.layers.filter(layer => 
      layer.priority < sourceLayer.priority
    );

    await Promise.all(
      higherLayers.map(async (layer) => {
        try {
          await layer.set(key, data);
        } catch (error) {
          console.warn(`Failed to promote to layer ${layer.name}:`, error);
        }
      })
    );
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

  // Calculate cache efficiency score
  private calculateEfficiency(): number {
    const totalHits = this.stats.hits.memory + this.stats.hits.storage;
    const totalMisses = this.stats.misses.memory + this.stats.misses.storage;
    const totalRequests = totalHits + totalMisses;
    
    if (totalRequests === 0) return 1;
    
    // Weight memory hits higher than storage hits
    const weightedHits = this.stats.hits.memory * 1.0 + this.stats.hits.storage * 0.7;
    
    return Math.min(1, weightedHits / totalRequests);
  }
}

// Global enhanced cache instance
export const enhancedNotificationCache = new EnhancedNotificationCache();