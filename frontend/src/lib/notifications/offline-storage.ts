'use client';

import type { 
  Notification, 
  NotificationSettings,
  NotificationQueryParams,
  NotificationListResponse 
} from '../../types/notifications';

// IndexedDB configuration
export interface OfflineStorageConfig {
  dbName: string;
  dbVersion: number;
  maxNotifications: number;
  maxCacheAge: number; // in milliseconds
  compressionEnabled: boolean;
}

// Storage statistics
export interface StorageStats {
  totalNotifications: number;
  unreadNotifications: number;
  cacheSize: number; // in bytes (approximate)
  oldestNotification: string | null;
  newestNotification: string | null;
  lastSync: number | null;
}

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  compressed?: boolean;
  checksum?: string;
}

// Default configuration
const DEFAULT_CONFIG: OfflineStorageConfig = {
  dbName: 'NotificationOfflineDB',
  dbVersion: 1,
  maxNotifications: 1000,
  maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  compressionEnabled: true,
};

// Object store names
const STORES = {
  NOTIFICATIONS: 'notifications',
  SETTINGS: 'settings',
  METADATA: 'metadata',
  CACHE: 'cache',
} as const;

export class OfflineNotificationStorage {
  private static instance: OfflineNotificationStorage;
  private config: OfflineStorageConfig;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  private constructor(config?: Partial<OfflineStorageConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  static getInstance(config?: Partial<OfflineStorageConfig>): OfflineNotificationStorage {
    if (!OfflineNotificationStorage.instance) {
      OfflineNotificationStorage.instance = new OfflineNotificationStorage(config);
    }
    return OfflineNotificationStorage.instance;
  }

  /**
   * Initialize IndexedDB database
   */
  async initialize(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._initializeDB();
    return this.initPromise;
  }

  private async _initializeDB(): Promise<void> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      throw new Error('IndexedDB not supported');
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.dbVersion);

      request.onerror = () => {
        reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create notifications store
        if (!db.objectStoreNames.contains(STORES.NOTIFICATIONS)) {
          const notificationStore = db.createObjectStore(STORES.NOTIFICATIONS, { keyPath: 'id' });
          notificationStore.createIndex('userId', 'userId', { unique: false });
          notificationStore.createIndex('type', 'type', { unique: false });
          notificationStore.createIndex('category', 'category', { unique: false });
          notificationStore.createIndex('isRead', 'isRead', { unique: false });
          notificationStore.createIndex('createdAt', 'createdAt', { unique: false });
          notificationStore.createIndex('priority', 'priority', { unique: false });
        }

        // Create settings store
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'userId' });
        }

        // Create metadata store
        if (!db.objectStoreNames.contains(STORES.METADATA)) {
          db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
        }

        // Create cache store for API responses
        if (!db.objectStoreNames.contains(STORES.CACHE)) {
          const cacheStore = db.createObjectStore(STORES.CACHE, { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Store notifications in IndexedDB
   */
  async storeNotifications(notifications: Notification[], userId?: number): Promise<void> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.NOTIFICATIONS], 'readwrite');
      const store = transaction.objectStore(STORES.NOTIFICATIONS);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      // Store each notification
      for (const notification of notifications) {
        const compressedNotification = this.config.compressionEnabled 
          ? this.compressData(notification)
          : notification;
        
        store.put(compressedNotification);
      }

      // Update metadata
      this.updateMetadata('lastSync', Date.now());
    });
  }

  /**
   * Get notifications from IndexedDB with filtering and pagination
   */
  async getNotifications(params?: NotificationQueryParams & { userId?: number }): Promise<NotificationListResponse> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.NOTIFICATIONS], 'readonly');
      const store = transaction.objectStore(STORES.NOTIFICATIONS);
      
      let request: IDBRequest;
      
      // Use appropriate index based on filters
      if (params?.userId) {
        const index = store.index('userId');
        request = index.getAll(params.userId);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        let notifications: Notification[] = request.result.map((n: any) => 
          this.config.compressionEnabled ? this.decompressData(n) : n
        );

        // Apply filters
        notifications = this.applyFilters(notifications, params);

        // Apply sorting
        notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Apply pagination
        const page = params?.page || 1;
        const limit = params?.limit || 20;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedNotifications = notifications.slice(startIndex, endIndex);

        const unreadCount = notifications.filter(n => !n.isRead).length;

        resolve({
          notifications: paginatedNotifications,
          total: notifications.length,
          unreadCount,
          page,
          limit,
        });
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a specific notification by ID
   */
  async getNotificationById(id: string): Promise<Notification | null> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.NOTIFICATIONS], 'readonly');
      const store = transaction.objectStore(STORES.NOTIFICATIONS);
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          const notification = this.config.compressionEnabled 
            ? this.decompressData(result) 
            : result;
          resolve(notification);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update a notification in storage
   */
  async updateNotification(id: string, updates: Partial<Notification>): Promise<void> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.NOTIFICATIONS], 'readwrite');
      const store = transaction.objectStore(STORES.NOTIFICATIONS);
      
      // First get the existing notification
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        if (existing) {
          const decompressed = this.config.compressionEnabled 
            ? this.decompressData(existing) 
            : existing;
          
          const updated = { ...decompressed, ...updates };
          const compressed = this.config.compressionEnabled 
            ? this.compressData(updated) 
            : updated;
          
          const putRequest = store.put(compressed);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error(`Notification ${id} not found`));
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Delete a notification from storage
   */
  async deleteNotification(id: string): Promise<void> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.NOTIFICATIONS], 'readwrite');
      const store = transaction.objectStore(STORES.NOTIFICATIONS);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all notifications for a user
   */
  async clearNotifications(userId?: number): Promise<void> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.NOTIFICATIONS], 'readwrite');
      const store = transaction.objectStore(STORES.NOTIFICATIONS);

      if (userId) {
        // Clear notifications for specific user
        const index = store.index('userId');
        const request = index.openCursor(userId);
        
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };
        
        request.onerror = () => reject(request.error);
      } else {
        // Clear all notifications
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }
    });
  }

  /**
   * Clear all data for a specific user (notifications and settings)
   */
  async clearUserData(userId: number): Promise<void> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.NOTIFICATIONS, STORES.SETTINGS], 'readwrite');
      const notificationStore = transaction.objectStore(STORES.NOTIFICATIONS);
      const settingsStore = transaction.objectStore(STORES.SETTINGS);

      transaction.oncomplete = () => {
        console.log(`Cleared all data for user ${userId}`);
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);

      // Clear notifications for the user
      const notificationIndex = notificationStore.index('userId');
      const notificationRequest = notificationIndex.openCursor(userId);
      
      notificationRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      // Clear settings for the user
      settingsStore.delete(userId);
    });
  }

  /**
   * Store notification settings
   */
  async storeSettings(settings: NotificationSettings, userId: number): Promise<void> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.SETTINGS], 'readwrite');
      const store = transaction.objectStore(STORES.SETTINGS);
      
      const settingsWithId = { ...settings, userId };
      const compressed = this.config.compressionEnabled 
        ? this.compressData(settingsWithId) 
        : settingsWithId;
      
      const request = store.put(compressed);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get notification settings
   */
  async getSettings(userId: number): Promise<NotificationSettings | null> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.SETTINGS], 'readonly');
      const store = transaction.objectStore(STORES.SETTINGS);
      const request = store.get(userId);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          const settings = this.config.compressionEnabled 
            ? this.decompressData(result) 
            : result;
          // Remove userId from settings object
          const { userId: _, ...settingsWithoutId } = settings;
          resolve(settingsWithoutId as NotificationSettings);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Cache API response data
   */
  async cacheResponse(key: string, data: any, ttl?: number): Promise<void> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    const cacheEntry: CacheEntry<any> = {
      data: this.config.compressionEnabled ? this.compressData(data) : data,
      timestamp: Date.now(),
      compressed: this.config.compressionEnabled,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.CACHE], 'readwrite');
      const store = transaction.objectStore(STORES.CACHE);
      
      const request = store.put({ key, ...cacheEntry });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get cached response data
   */
  async getCachedResponse<T>(key: string): Promise<T | null> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.CACHE], 'readonly');
      const store = transaction.objectStore(STORES.CACHE);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Check if cache entry is still valid
          const age = Date.now() - result.timestamp;
          if (age < this.config.maxCacheAge) {
            const data = result.compressed 
              ? this.decompressData(result.data) 
              : result.data;
            resolve(data);
          } else {
            // Cache expired, delete it
            this.deleteCachedResponse(key);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete cached response
   */
  async deleteCachedResponse(key: string): Promise<void> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.CACHE], 'readwrite');
      const store = transaction.objectStore(STORES.CACHE);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<StorageStats> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.NOTIFICATIONS, STORES.METADATA], 'readonly');
      const notificationStore = transaction.objectStore(STORES.NOTIFICATIONS);
      const metadataStore = transaction.objectStore(STORES.METADATA);

      let totalNotifications = 0;
      let unreadNotifications = 0;
      let oldestNotification: string | null = null;
      let newestNotification: string | null = null;
      let cacheSize = 0;
      let lastSync: number | null = null;

      // Count notifications and calculate stats
      const notificationRequest = notificationStore.openCursor();
      const notifications: Notification[] = [];

      notificationRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          const notification = this.config.compressionEnabled 
            ? this.decompressData(cursor.value) 
            : cursor.value;
          
          notifications.push(notification);
          totalNotifications++;
          
          if (!notification.isRead) {
            unreadNotifications++;
          }

          // Estimate cache size (rough approximation)
          cacheSize += JSON.stringify(cursor.value).length;

          cursor.continue();
        } else {
          // Sort notifications by date to find oldest and newest
          if (notifications.length > 0) {
            notifications.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            oldestNotification = notifications[0].createdAt;
            newestNotification = notifications[notifications.length - 1].createdAt;
          }

          // Get last sync time
          const syncRequest = metadataStore.get('lastSync');
          syncRequest.onsuccess = () => {
            lastSync = syncRequest.result?.value || null;
            
            resolve({
              totalNotifications,
              unreadNotifications,
              cacheSize,
              oldestNotification,
              newestNotification,
              lastSync,
            });
          };
          
          syncRequest.onerror = () => reject(syncRequest.error);
        }
      };

      notificationRequest.onerror = () => reject(notificationRequest.error);
    });
  }

  /**
   * Cleanup old notifications and cache entries
   */
  async cleanup(): Promise<{ deletedNotifications: number; deletedCacheEntries: number }> {
    await this.initialize();
    if (!this.db) throw new Error('Database not initialized');

    const cutoffTime = Date.now() - this.config.maxCacheAge;
    let deletedNotifications = 0;
    let deletedCacheEntries = 0;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.NOTIFICATIONS, STORES.CACHE], 'readwrite');
      const notificationStore = transaction.objectStore(STORES.NOTIFICATIONS);
      const cacheStore = transaction.objectStore(STORES.CACHE);

      // Clean up old notifications
      const notificationIndex = notificationStore.index('createdAt');
      const notificationRange = IDBKeyRange.upperBound(new Date(cutoffTime).toISOString());
      const notificationRequest = notificationIndex.openCursor(notificationRange);

      notificationRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          deletedNotifications++;
          cursor.continue();
        } else {
          // Clean up old cache entries
          const cacheIndex = cacheStore.index('timestamp');
          const cacheRange = IDBKeyRange.upperBound(cutoffTime);
          const cacheRequest = cacheIndex.openCursor(cacheRange);

          cacheRequest.onsuccess = (event) => {
            const cursor = (event.target as IDBRequest).result;
            if (cursor) {
              cursor.delete();
              deletedCacheEntries++;
              cursor.continue();
            } else {
              resolve({ deletedNotifications, deletedCacheEntries });
            }
          };

          cacheRequest.onerror = () => reject(cacheRequest.error);
        }
      };

      notificationRequest.onerror = () => reject(notificationRequest.error);
    });
  }

  /**
   * Apply filters to notifications array
   */
  private applyFilters(notifications: Notification[], params?: NotificationQueryParams): Notification[] {
    let filtered = [...notifications];

    if (params?.type) {
      filtered = filtered.filter(n => n.type === params.type);
    }

    if (params?.category) {
      filtered = filtered.filter(n => n.category === params.category);
    }

    if (params?.unreadOnly) {
      filtered = filtered.filter(n => !n.isRead);
    }

    if (params?.startDate) {
      const startDate = new Date(params.startDate);
      filtered = filtered.filter(n => new Date(n.createdAt) >= startDate);
    }

    if (params?.endDate) {
      const endDate = new Date(params.endDate);
      filtered = filtered.filter(n => new Date(n.createdAt) <= endDate);
    }

    return filtered;
  }

  /**
   * Compress data for storage efficiency
   */
  private compressData<T>(data: T): T {
    // Simple compression: remove undefined values and compress strings
    // In a real implementation, you might use a compression library like pako
    return JSON.parse(JSON.stringify(data));
  }

  /**
   * Decompress data from storage
   */
  private decompressData<T>(data: T): T {
    // Simple decompression: just return the data as-is
    // In a real implementation, you would decompress using the same library
    return data;
  }

  /**
   * Update metadata
   */
  private async updateMetadata(key: string, value: any): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORES.METADATA], 'readwrite');
      const store = transaction.objectStore(STORES.METADATA);
      
      const request = store.put({ key, value, timestamp: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Delete the entire database
   */
  static async deleteDatabase(dbName: string = DEFAULT_CONFIG.dbName): Promise<void> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return;
    }

    return new Promise((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(dbName);
      
      deleteRequest.onsuccess = () => {
        console.log('Database deleted successfully');
        resolve();
      };
      
      deleteRequest.onerror = () => {
        reject(new Error(`Failed to delete database: ${deleteRequest.error?.message}`));
      };
      
      deleteRequest.onblocked = () => {
        console.warn('Database deletion blocked - close all tabs using this database');
      };
    });
  }
}

// Export singleton instance
export const offlineNotificationStorage = OfflineNotificationStorage.getInstance();

// Convenience functions
export const storeNotificationsOffline = (notifications: Notification[], userId?: number): Promise<void> => {
  return offlineNotificationStorage.storeNotifications(notifications, userId);
};

export const getNotificationsOffline = (params?: NotificationQueryParams & { userId?: number }): Promise<NotificationListResponse> => {
  return offlineNotificationStorage.getNotifications(params);
};

export const storeSettingsOffline = (settings: NotificationSettings, userId: number): Promise<void> => {
  return offlineNotificationStorage.storeSettings(settings, userId);
};

export const getSettingsOffline = (userId: number): Promise<NotificationSettings | null> => {
  return offlineNotificationStorage.getSettings(userId);
};