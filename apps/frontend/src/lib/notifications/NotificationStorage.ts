'use client';

import type { Notification, NotificationType, NotificationCategory } from '../../types/notifications';

interface StorageConfig {
  dbName: string;
  version: number;
  maxStorageSize: number; // in bytes
  compressionThreshold: number; // compress items larger than this
  retentionDays: number;
}

interface StoredNotification extends Notification {
  _stored: {
    timestamp: number;
    compressed: boolean;
    size: number;
  };
}

interface StorageStats {
  totalNotifications: number;
  totalSize: number;
  compressionRatio: number;
  oldestNotification: Date | null;
  newestNotification: Date | null;
}

export class NotificationStorage {
  private db: IDBDatabase | null = null;
  private config: StorageConfig;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor(config: Partial<StorageConfig> = {}) {
    this.config = {
      dbName: config.dbName || 'NotificationDB',
      version: config.version || 1,
      maxStorageSize: config.maxStorageSize || 100 * 1024 * 1024, // 100MB
      compressionThreshold: config.compressionThreshold || 1024, // 1KB
      retentionDays: config.retentionDays || 30,
    };
  }

  // Initialize IndexedDB
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.initializeDB();
    await this.initPromise;
  }

  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(this.config.dbName, this.config.version);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create notifications store
        if (!db.objectStoreNames.contains('notifications')) {
          const notificationStore = db.createObjectStore('notifications', { keyPath: 'id' });
          notificationStore.createIndex('type', 'type', { unique: false });
          notificationStore.createIndex('category', 'category', { unique: false });
          notificationStore.createIndex('isRead', 'isRead', { unique: false });
          notificationStore.createIndex('createdAt', 'createdAt', { unique: false });
          notificationStore.createIndex('priority', 'priority', { unique: false });
        }

        // Create metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }

        // Create cache store for lists
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  // Store notification
  async storeNotification(notification: Notification): Promise<void> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['notifications'], 'readwrite');
    const store = transaction.objectStore('notifications');

    // Prepare notification for storage
    const storedNotification = await this.prepareForStorage(notification);

    return new Promise((resolve, reject) => {
      const request = store.put(storedNotification);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to store notification'));
    });
  }

  // Store multiple notifications
  async storeNotifications(notifications: Notification[]): Promise<void> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['notifications'], 'readwrite');
    const store = transaction.objectStore('notifications');

    const promises = notifications.map(async (notification) => {
      const storedNotification = await this.prepareForStorage(notification);
      return new Promise<void>((resolve, reject) => {
        const request = store.put(storedNotification);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error(`Failed to store notification ${notification.id}`));
      });
    });

    await Promise.all(promises);
  }

  // Get notification by ID
  async getNotification(id: string): Promise<Notification | null> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['notifications'], 'readonly');
    const store = transaction.objectStore('notifications');

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      
      request.onsuccess = () => {
        const result = request.result as StoredNotification | undefined;
        if (result) {
          resolve(this.prepareFromStorage(result));
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(new Error('Failed to get notification'));
    });
  }

  // Get notifications with filters
  async getNotifications(filters: {
    type?: NotificationType;
    category?: NotificationCategory;
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
    sortBy?: 'createdAt' | 'priority';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<Notification[]> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['notifications'], 'readonly');
    const store = transaction.objectStore('notifications');

    // Use appropriate index based on filters
    let source: IDBObjectStore | IDBIndex = store;
    let keyRange: IDBKeyRange | undefined;

    if (filters.type) {
      source = store.index('type');
      keyRange = IDBKeyRange.only(filters.type);
    } else if (filters.category) {
      source = store.index('category');
      keyRange = IDBKeyRange.only(filters.category);
    } else if (filters.unreadOnly) {
      source = store.index('isRead');
      keyRange = IDBKeyRange.only(false);
    } else if (filters.sortBy === 'createdAt') {
      source = store.index('createdAt');
    } else if (filters.sortBy === 'priority') {
      source = store.index('priority');
    }

    return new Promise((resolve, reject) => {
      const notifications: Notification[] = [];
      const direction = filters.sortOrder === 'asc' ? 'next' : 'prev';
      const request = source.openCursor(keyRange, direction);
      
      let count = 0;
      const offset = filters.offset || 0;
      const limit = filters.limit || Infinity;

      request.onsuccess = () => {
        const cursor = request.result;
        
        if (cursor && count < offset + limit) {
          const storedNotification = cursor.value as StoredNotification;
          
          // Apply additional filters
          let include = true;
          
          if (filters.unreadOnly && storedNotification.isRead) {
            include = false;
          }
          
          if (filters.type && storedNotification.type !== filters.type) {
            include = false;
          }
          
          if (filters.category && storedNotification.category !== filters.category) {
            include = false;
          }

          if (include && count >= offset) {
            notifications.push(this.prepareFromStorage(storedNotification));
          }
          
          if (include) count++;
          cursor.continue();
        } else {
          resolve(notifications);
        }
      };
      
      request.onerror = () => reject(new Error('Failed to get notifications'));
    });
  }

  // Delete notification
  async deleteNotification(id: string): Promise<void> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['notifications'], 'readwrite');
    const store = transaction.objectStore('notifications');

    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete notification'));
    });
  }

  // Clear all notifications
  async clearAll(): Promise<void> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['notifications', 'cache'], 'readwrite');
    
    const promises = [
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('notifications').clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to clear notifications'));
      }),
      new Promise<void>((resolve, reject) => {
        const request = transaction.objectStore('cache').clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to clear cache'));
      })
    ];

    await Promise.all(promises);
  }

  // Get storage statistics
  async getStats(): Promise<StorageStats> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['notifications'], 'readonly');
    const store = transaction.objectStore('notifications');

    return new Promise((resolve, reject) => {
      const stats: StorageStats = {
        totalNotifications: 0,
        totalSize: 0,
        compressionRatio: 0,
        oldestNotification: null,
        newestNotification: null,
      };

      let totalOriginalSize = 0;
      let totalCompressedSize = 0;

      const request = store.openCursor();
      
      request.onsuccess = () => {
        const cursor = request.result;
        
        if (cursor) {
          const notification = cursor.value as StoredNotification;
          stats.totalNotifications++;
          stats.totalSize += notification._stored.size;
          
          // Track compression stats
          if (notification._stored.compressed) {
            totalCompressedSize += notification._stored.size;
            // Estimate original size (this is simplified)
            totalOriginalSize += notification._stored.size * 2;
          } else {
            totalOriginalSize += notification._stored.size;
          }

          // Track date range
          const createdAt = new Date(notification.createdAt);
          if (!stats.oldestNotification || createdAt < stats.oldestNotification) {
            stats.oldestNotification = createdAt;
          }
          if (!stats.newestNotification || createdAt > stats.newestNotification) {
            stats.newestNotification = createdAt;
          }

          cursor.continue();
        } else {
          // Calculate compression ratio
          if (totalOriginalSize > 0) {
            stats.compressionRatio = 1 - (totalCompressedSize / totalOriginalSize);
          }
          
          resolve(stats);
        }
      };
      
      request.onerror = () => reject(new Error('Failed to get storage stats'));
    });
  }

  // Cleanup old notifications
  async cleanup(): Promise<number> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    const transaction = this.db.transaction(['notifications'], 'readwrite');
    const store = transaction.objectStore('notifications');
    const index = store.index('createdAt');

    return new Promise((resolve, reject) => {
      let deletedCount = 0;
      const range = IDBKeyRange.upperBound(cutoffDate.toISOString());
      const request = index.openCursor(range);
      
      request.onsuccess = () => {
        const cursor = request.result;
        
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };
      
      request.onerror = () => reject(new Error('Failed to cleanup notifications'));
    });
  }

  // Prepare notification for storage (compression, etc.)
  private async prepareForStorage(notification: Notification): Promise<StoredNotification> {
    const serialized = JSON.stringify(notification);
    const originalSize = new Blob([serialized]).size;
    
    let data = notification;
    let compressed = false;

    // Compress if larger than threshold
    if (originalSize > this.config.compressionThreshold) {
      try {
        // Simple compression - in production, use a proper compression library
        const compressedData = this.compress(serialized);
        if (compressedData.length < serialized.length) {
          data = { ...notification, _compressed: compressedData } as any;
          compressed = true;
        }
      } catch (error) {
        console.warn('Compression failed:', error);
      }
    }

    return {
      ...data,
      _stored: {
        timestamp: Date.now(),
        compressed,
        size: new Blob([JSON.stringify(data)]).size,
      },
    };
  }

  // Prepare notification from storage (decompression, etc.)
  private prepareFromStorage(storedNotification: StoredNotification): Notification {
    const { _stored, ...notification } = storedNotification;
    
    // Decompress if needed
    if (_stored.compressed && (notification as any)._compressed) {
      try {
        const decompressed = this.decompress((notification as any)._compressed);
        return JSON.parse(decompressed);
      } catch (error) {
        console.warn('Decompression failed:', error);
      }
    }

    return notification;
  }

  // Simple compression (use a proper library in production)
  private compress(data: string): string {
    return btoa(data);
  }

  // Simple decompression
  private decompress(data: string): string {
    return atob(data);
  }

  // Cache list results
  async cacheList(key: string, notifications: Notification[], ttl: number = 5 * 60 * 1000): Promise<void> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');

    const cacheEntry = {
      key,
      data: notifications,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    };

    return new Promise((resolve, reject) => {
      const request = store.put(cacheEntry);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to cache list'));
    });
  }

  // Get cached list
  async getCachedList(key: string): Promise<Notification[] | null> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['cache'], 'readonly');
    const store = transaction.objectStore('cache');

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        
        if (result && result.expiresAt > Date.now()) {
          resolve(result.data);
        } else {
          // Clean up expired entry
          if (result) {
            const deleteTransaction = this.db!.transaction(['cache'], 'readwrite');
            deleteTransaction.objectStore('cache').delete(key);
          }
          resolve(null);
        }
      };
      
      request.onerror = () => reject(new Error('Failed to get cached list'));
    });
  }

  // Clear expired cache entries
  async clearExpiredCache(): Promise<number> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    const transaction = this.db.transaction(['cache'], 'readwrite');
    const store = transaction.objectStore('cache');
    const index = store.index('timestamp');

    return new Promise((resolve, reject) => {
      let deletedCount = 0;
      const now = Date.now();
      const request = index.openCursor();
      
      request.onsuccess = () => {
        const cursor = request.result;
        
        if (cursor) {
          const entry = cursor.value;
          if (entry.expiresAt <= now) {
            cursor.delete();
            deletedCount++;
          }
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };
      
      request.onerror = () => reject(new Error('Failed to clear expired cache'));
    });
  }
}

// Global storage instance
export const notificationStorage = new NotificationStorage({
  dbName: 'InternshipNotificationDB',
  version: 1,
  maxStorageSize: 50 * 1024 * 1024, // 50MB
  compressionThreshold: 512, // 512 bytes
  retentionDays: 30,
});