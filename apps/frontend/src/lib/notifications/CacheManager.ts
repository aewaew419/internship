'use client';

import { enhancedNotificationCache } from './EnhancedNotificationCache';
import { notificationStorage } from './NotificationStorage';
import type { Notification } from '../../types/notifications';

interface CacheManagerConfig {
  maxMemoryUsage: number; // bytes
  maxStorageUsage: number; // bytes
  cleanupInterval: number; // milliseconds
  compressionThreshold: number; // bytes
  retentionPolicy: {
    highPriority: number; // days
    normal: number; // days
    low: number; // days
  };
}

interface CacheHealth {
  memoryUsage: number;
  storageUsage: number;
  hitRate: number;
  fragmentationLevel: number;
  compressionRatio: number;
  status: 'healthy' | 'warning' | 'critical';
}

export class CacheManager {
  private config: CacheManagerConfig;
  private cleanupTimer: NodeJS.Timeout | null = null;
  private isCleanupRunning = false;
  private lastCleanup = 0;

  constructor(config: Partial<CacheManagerConfig> = {}) {
    this.config = {
      maxMemoryUsage: config.maxMemoryUsage || 50 * 1024 * 1024, // 50MB
      maxStorageUsage: config.maxStorageUsage || 200 * 1024 * 1024, // 200MB
      cleanupInterval: config.cleanupInterval || 5 * 60 * 1000, // 5 minutes
      compressionThreshold: config.compressionThreshold || 1024, // 1KB
      retentionPolicy: config.retentionPolicy || {
        highPriority: 7, // 7 days
        normal: 3, // 3 days
        low: 1, // 1 day
      },
    };

    this.startCleanupScheduler();
  }

  // Start automatic cleanup scheduler
  private startCleanupScheduler(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.performMaintenance();
    }, this.config.cleanupInterval);
  }

  // Perform cache maintenance
  async performMaintenance(): Promise<void> {
    if (this.isCleanupRunning) return;

    this.isCleanupRunning = true;
    const startTime = Date.now();

    try {
      console.log('Starting cache maintenance...');

      // Check cache health
      const health = await this.getCacheHealth();
      
      if (health.status === 'critical') {
        await this.emergencyCleanup();
      } else if (health.status === 'warning') {
        await this.routineCleanup();
      }

      // Optimize storage
      await this.optimizeStorage();

      // Update last cleanup time
      this.lastCleanup = Date.now();
      
      console.log(`Cache maintenance completed in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error('Cache maintenance failed:', error);
    } finally {
      this.isCleanupRunning = false;
    }
  }

  // Get cache health status
  async getCacheHealth(): Promise<CacheHealth> {
    const stats = enhancedNotificationCache.getStats();
    const storageStats = await notificationStorage.getStats();

    const memoryUsage = this.estimateMemoryUsage();
    const storageUsage = storageStats.totalSize;
    const hitRate = stats.hitRate.overall;
    const compressionRatio = storageStats.compressionRatio;

    // Calculate fragmentation (simplified)
    const fragmentationLevel = this.calculateFragmentation(storageStats);

    // Determine status
    let status: CacheHealth['status'] = 'healthy';
    
    if (
      memoryUsage > this.config.maxMemoryUsage * 0.9 ||
      storageUsage > this.config.maxStorageUsage * 0.9 ||
      hitRate < 0.3
    ) {
      status = 'critical';
    } else if (
      memoryUsage > this.config.maxMemoryUsage * 0.7 ||
      storageUsage > this.config.maxStorageUsage * 0.7 ||
      hitRate < 0.5
    ) {
      status = 'warning';
    }

    return {
      memoryUsage,
      storageUsage,
      hitRate,
      fragmentationLevel,
      compressionRatio,
      status,
    };
  }

  // Emergency cleanup when cache is critical
  private async emergencyCleanup(): Promise<void> {
    console.log('Performing emergency cache cleanup...');

    // Clear expired cache entries
    await notificationStorage.clearExpiredCache();

    // Remove old low-priority notifications
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 6); // Last 6 hours only

    const notifications = await notificationStorage.getNotifications({
      limit: 1000,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    const toDelete = notifications.filter(notification => {
      const createdAt = new Date(notification.createdAt);
      return createdAt < cutoffDate && notification.priority === 'low';
    });

    await Promise.all(
      toDelete.map(notification => 
        notificationStorage.deleteNotification(notification.id)
      )
    );

    console.log(`Emergency cleanup removed ${toDelete.length} notifications`);
  }

  // Routine cleanup for warning status
  private async routineCleanup(): Promise<void> {
    console.log('Performing routine cache cleanup...');

    // Clean up expired entries
    const expiredCount = await notificationStorage.clearExpiredCache();
    
    // Clean up old notifications based on retention policy
    const cleanupCount = await this.cleanupByRetentionPolicy();

    console.log(`Routine cleanup: ${expiredCount} expired, ${cleanupCount} old notifications removed`);
  }

  // Cleanup based on retention policy
  private async cleanupByRetentionPolicy(): Promise<number> {
    let totalDeleted = 0;

    for (const [priority, days] of Object.entries(this.config.retentionPolicy)) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const notifications = await notificationStorage.getNotifications({
        limit: 1000,
        sortBy: 'createdAt',
        sortOrder: 'asc',
      });

      const toDelete = notifications.filter(notification => {
        const createdAt = new Date(notification.createdAt);
        return createdAt < cutoffDate && notification.priority === priority;
      });

      await Promise.all(
        toDelete.map(notification => 
          notificationStorage.deleteNotification(notification.id)
        )
      );

      totalDeleted += toDelete.length;
    }

    return totalDeleted;
  }

  // Optimize storage
  private async optimizeStorage(): Promise<void> {
    // This would typically involve:
    // 1. Defragmenting IndexedDB (not directly possible, but we can rebuild)
    // 2. Compressing large notifications
    // 3. Reorganizing data for better access patterns

    const stats = await notificationStorage.getStats();
    
    // If fragmentation is high, consider rebuilding storage
    if (this.calculateFragmentation(stats) > 0.3) {
      console.log('High fragmentation detected, consider storage rebuild');
      // In a real implementation, you might rebuild the database
    }

    // Compress large notifications
    await this.compressLargeNotifications();
  }

  // Compress large notifications
  private async compressLargeNotifications(): Promise<void> {
    const notifications = await notificationStorage.getNotifications({
      limit: 100,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    const largeNotifications = notifications.filter(notification => {
      const size = JSON.stringify(notification).length;
      return size > this.config.compressionThreshold;
    });

    // Re-store large notifications to trigger compression
    await Promise.all(
      largeNotifications.map(notification => 
        notificationStorage.storeNotification(notification)
      )
    );

    if (largeNotifications.length > 0) {
      console.log(`Compressed ${largeNotifications.length} large notifications`);
    }
  }

  // Estimate memory usage (simplified)
  private estimateMemoryUsage(): number {
    // This is a rough estimation
    // In a real implementation, you'd use more sophisticated memory tracking
    const stats = enhancedNotificationCache.getStats();
    const baseUsage = 10 * 1024 * 1024; // 10MB base
    const variableUsage = (stats.distribution.memory || 0) * 1024; // 1KB per cached item
    
    return baseUsage + variableUsage;
  }

  // Calculate fragmentation level
  private calculateFragmentation(stats: any): number {
    // Simplified fragmentation calculation
    // In a real implementation, this would be more sophisticated
    if (stats.totalNotifications === 0) return 0;
    
    const averageSize = stats.totalSize / stats.totalNotifications;
    const expectedSize = stats.totalNotifications * averageSize;
    
    return Math.abs(stats.totalSize - expectedSize) / expectedSize;
  }

  // Preload frequently accessed notifications
  async preloadFrequentNotifications(): Promise<void> {
    // This would analyze usage patterns and preload likely-to-be-accessed notifications
    console.log('Preloading frequent notifications...');

    // Simple heuristic: preload recent high-priority unread notifications
    const notifications = await notificationStorage.getNotifications({
      unreadOnly: true,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    const highPriorityNotifications = notifications.filter(
      notification => notification.priority === 'high'
    );

    // Cache these in memory for fast access
    await Promise.all(
      highPriorityNotifications.map(notification =>
        enhancedNotificationCache.cacheNotification(notification)
      )
    );

    console.log(`Preloaded ${highPriorityNotifications.length} high-priority notifications`);
  }

  // Get cache recommendations
  getCacheRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // This would analyze cache performance and provide recommendations
    const memoryUsage = this.estimateMemoryUsage();
    const memoryUsagePercent = memoryUsage / this.config.maxMemoryUsage;
    
    if (memoryUsagePercent > 0.8) {
      recommendations.push('Consider increasing memory cache size or reducing retention time');
    }
    
    if (Date.now() - this.lastCleanup > this.config.cleanupInterval * 2) {
      recommendations.push('Cache cleanup is overdue, consider running maintenance');
    }

    const stats = enhancedNotificationCache.getStats();
    if (stats.hitRate.overall < 0.6) {
      recommendations.push('Cache hit rate is low, consider adjusting caching strategy');
    }

    return recommendations;
  }

  // Force cache cleanup
  async forceCleanup(): Promise<void> {
    await this.performMaintenance();
  }

  // Get cache size information
  async getCacheSizeInfo(): Promise<{
    memory: { used: number; max: number; percentage: number };
    storage: { used: number; max: number; percentage: number };
    recommendations: string[];
  }> {
    const memoryUsed = this.estimateMemoryUsage();
    const storageStats = await notificationStorage.getStats();
    
    return {
      memory: {
        used: memoryUsed,
        max: this.config.maxMemoryUsage,
        percentage: (memoryUsed / this.config.maxMemoryUsage) * 100,
      },
      storage: {
        used: storageStats.totalSize,
        max: this.config.maxStorageUsage,
        percentage: (storageStats.totalSize / this.config.maxStorageUsage) * 100,
      },
      recommendations: this.getCacheRecommendations(),
    };
  }

  // Destroy cache manager
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

// Global cache manager instance
export const cacheManager = new CacheManager({
  maxMemoryUsage: 30 * 1024 * 1024, // 30MB
  maxStorageUsage: 100 * 1024 * 1024, // 100MB
  cleanupInterval: 3 * 60 * 1000, // 3 minutes
  compressionThreshold: 512, // 512 bytes
  retentionPolicy: {
    highPriority: 7, // 7 days
    normal: 3, // 3 days
    low: 1, // 1 day
  },
});