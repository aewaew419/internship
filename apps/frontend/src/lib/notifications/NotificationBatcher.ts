'use client';

import type { Notification, NotificationType } from '../../types/notifications';

interface BatchOperation {
  id: string;
  type: 'mark_read' | 'delete' | 'archive' | 'update_settings';
  notificationIds: string[];
  data?: any;
  timestamp: number;
  retryCount: number;
}

interface BatchConfig {
  maxBatchSize: number;
  batchTimeout: number; // milliseconds
  debounceDelay: number; // milliseconds
  maxRetries: number;
  retryDelay: number; // milliseconds
}

interface NotificationUpdate {
  id: string;
  type: 'new' | 'updated' | 'deleted';
  notification?: Notification;
  timestamp: number;
}

export class NotificationBatcher {
  private config: BatchConfig;
  private pendingOperations = new Map<string, BatchOperation>();
  private updateQueue: NotificationUpdate[] = [];
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private batchTimer: NodeJS.Timeout | null = null;
  private isProcessing = false;
  private listeners = new Set<(updates: NotificationUpdate[]) => void>();

  constructor(config: Partial<BatchConfig> = {}) {
    this.config = {
      maxBatchSize: config.maxBatchSize || 50,
      batchTimeout: config.batchTimeout || 2000, // 2 seconds
      debounceDelay: config.debounceDelay || 300, // 300ms
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000, // 1 second
    };

    // Start batch processing
    this.startBatchProcessing();
  }

  // Add operation to batch
  addOperation(
    type: BatchOperation['type'],
    notificationIds: string[],
    data?: any
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const operationId = `${type}_${Date.now()}_${Math.random()}`;
      
      const operation: BatchOperation = {
        id: operationId,
        type,
        notificationIds: [...notificationIds],
        data,
        timestamp: Date.now(),
        retryCount: 0,
      };

      // Add to pending operations
      this.pendingOperations.set(operationId, operation);

      // Store resolve/reject for later
      (operation as any).resolve = resolve;
      (operation as any).reject = reject;

      // Trigger batch processing if we have enough operations
      if (this.pendingOperations.size >= this.config.maxBatchSize) {
        this.processBatch();
      }
    });
  }

  // Add notification update with debouncing
  addNotificationUpdate(update: NotificationUpdate): void {
    const key = `${update.type}_${update.id}`;
    
    // Clear existing debounce timer
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new debounce timer
    const timer = setTimeout(() => {
      this.updateQueue.push(update);
      this.debounceTimers.delete(key);
      
      // Process updates if queue is getting large
      if (this.updateQueue.length >= this.config.maxBatchSize) {
        this.processUpdates();
      }
    }, this.config.debounceDelay);

    this.debounceTimers.set(key, timer);
  }

  // Subscribe to batched updates
  subscribe(listener: (updates: NotificationUpdate[]) => void): () => void {
    this.listeners.add(listener);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  // Start batch processing timer
  private startBatchProcessing(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }

    this.batchTimer = setInterval(() => {
      if (this.pendingOperations.size > 0) {
        this.processBatch();
      }
      if (this.updateQueue.length > 0) {
        this.processUpdates();
      }
    }, this.config.batchTimeout);
  }

  // Process pending operations in batch
  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.pendingOperations.size === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // Group operations by type
      const operationGroups = new Map<string, BatchOperation[]>();
      
      for (const operation of this.pendingOperations.values()) {
        const key = operation.type;
        if (!operationGroups.has(key)) {
          operationGroups.set(key, []);
        }
        operationGroups.get(key)!.push(operation);
      }

      // Process each group
      for (const [type, operations] of operationGroups.entries()) {
        await this.processOperationGroup(type, operations);
      }

      // Clear processed operations
      this.pendingOperations.clear();
    } catch (error) {
      console.error('Batch processing failed:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Process a group of operations of the same type
  private async processOperationGroup(
    type: string,
    operations: BatchOperation[]
  ): Promise<void> {
    try {
      // Combine all notification IDs
      const allNotificationIds = operations.reduce((acc, op) => {
        return acc.concat(op.notificationIds);
      }, [] as string[]);

      // Remove duplicates
      const uniqueIds = [...new Set(allNotificationIds)];

      // Execute batch operation based on type
      switch (type) {
        case 'mark_read':
          await this.executeBatchMarkAsRead(uniqueIds);
          break;
        case 'delete':
          await this.executeBatchDelete(uniqueIds);
          break;
        case 'archive':
          await this.executeBatchArchive(uniqueIds);
          break;
        case 'update_settings':
          await this.executeBatchUpdateSettings(operations);
          break;
        default:
          throw new Error(`Unknown operation type: ${type}`);
      }

      // Resolve all promises
      operations.forEach(op => {
        if ((op as any).resolve) {
          (op as any).resolve();
        }
      });
    } catch (error) {
      // Handle retries
      const retriableOperations = operations.filter(op => 
        op.retryCount < this.config.maxRetries
      );

      if (retriableOperations.length > 0) {
        // Increment retry count and re-queue
        setTimeout(() => {
          retriableOperations.forEach(op => {
            op.retryCount++;
            this.pendingOperations.set(op.id, op);
          });
        }, this.config.retryDelay * Math.pow(2, retriableOperations[0].retryCount));
      }

      // Reject operations that exceeded max retries
      operations
        .filter(op => op.retryCount >= this.config.maxRetries)
        .forEach(op => {
          if ((op as any).reject) {
            (op as any).reject(error);
          }
        });
    }
  }

  // Execute batch mark as read
  private async executeBatchMarkAsRead(notificationIds: string[]): Promise<void> {
    // In a real implementation, this would call the API
    console.log(`Batch marking ${notificationIds.length} notifications as read`);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Add updates to queue
    notificationIds.forEach(id => {
      this.addNotificationUpdate({
        id,
        type: 'updated',
        timestamp: Date.now(),
      });
    });
  }

  // Execute batch delete
  private async executeBatchDelete(notificationIds: string[]): Promise<void> {
    console.log(`Batch deleting ${notificationIds.length} notifications`);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Add updates to queue
    notificationIds.forEach(id => {
      this.addNotificationUpdate({
        id,
        type: 'deleted',
        timestamp: Date.now(),
      });
    });
  }

  // Execute batch archive
  private async executeBatchArchive(notificationIds: string[]): Promise<void> {
    console.log(`Batch archiving ${notificationIds.length} notifications`);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 120));
    
    // Add updates to queue
    notificationIds.forEach(id => {
      this.addNotificationUpdate({
        id,
        type: 'updated',
        timestamp: Date.now(),
      });
    });
  }

  // Execute batch settings update
  private async executeBatchUpdateSettings(operations: BatchOperation[]): Promise<void> {
    console.log(`Batch updating settings for ${operations.length} operations`);
    
    // Combine all settings updates
    const combinedSettings = operations.reduce((acc, op) => {
      return { ...acc, ...op.data };
    }, {});
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log('Settings updated:', combinedSettings);
  }

  // Process notification updates
  private processUpdates(): void {
    if (this.updateQueue.length === 0) return;

    // Group updates by type and remove duplicates
    const processedUpdates = this.deduplicateUpdates(this.updateQueue);
    
    // Notify all listeners
    this.listeners.forEach(listener => {
      try {
        listener(processedUpdates);
      } catch (error) {
        console.error('Update listener error:', error);
      }
    });

    // Clear the queue
    this.updateQueue = [];
  }

  // Remove duplicate updates, keeping the latest
  private deduplicateUpdates(updates: NotificationUpdate[]): NotificationUpdate[] {
    const updateMap = new Map<string, NotificationUpdate>();
    
    updates.forEach(update => {
      const key = `${update.type}_${update.id}`;
      const existing = updateMap.get(key);
      
      if (!existing || update.timestamp > existing.timestamp) {
        updateMap.set(key, update);
      }
    });
    
    return Array.from(updateMap.values());
  }

  // Clean up resources
  destroy(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }

    // Clear all debounce timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();

    // Clear all data
    this.pendingOperations.clear();
    this.updateQueue = [];
    this.listeners.clear();
  }
}

// Smart notification grouping
export class NotificationGrouper {
  // Group notifications by type and time
  static groupByTypeAndTime(
    notifications: Notification[],
    timeWindowMs: number = 5 * 60 * 1000 // 5 minutes
  ): Map<string, Notification[]> {
    const groups = new Map<string, Notification[]>();
    
    notifications.forEach(notification => {
      const timeWindow = Math.floor(
        new Date(notification.createdAt).getTime() / timeWindowMs
      );
      const key = `${notification.type}_${timeWindow}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(notification);
    });
    
    return groups;
  }

  // Group notifications by category
  static groupByCategory(notifications: Notification[]): Map<string, Notification[]> {
    const groups = new Map<string, Notification[]>();
    
    notifications.forEach(notification => {
      const key = notification.category;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(notification);
    });
    
    return groups;
  }

  // Group notifications by priority and recency
  static groupByPriorityAndRecency(
    notifications: Notification[]
  ): {
    urgent: Notification[];
    recent: Notification[];
    older: Notification[];
  } {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    
    const urgent: Notification[] = [];
    const recent: Notification[] = [];
    const older: Notification[] = [];
    
    notifications.forEach(notification => {
      const createdAt = new Date(notification.createdAt).getTime();
      
      if (notification.priority === 'high' || createdAt > oneHourAgo) {
        urgent.push(notification);
      } else if (createdAt > oneDayAgo) {
        recent.push(notification);
      } else {
        older.push(notification);
      }
    });
    
    return { urgent, recent, older };
  }

  // Create smart groups with metadata
  static createSmartGroups(notifications: Notification[]): Array<{
    id: string;
    title: string;
    notifications: Notification[];
    priority: 'high' | 'normal' | 'low';
    unreadCount: number;
  }> {
    const groups: Array<{
      id: string;
      title: string;
      notifications: Notification[];
      priority: 'high' | 'normal' | 'low';
      unreadCount: number;
    }> = [];

    // Group by priority and recency
    const { urgent, recent, older } = this.groupByPriorityAndRecency(notifications);
    
    if (urgent.length > 0) {
      groups.push({
        id: 'urgent',
        title: 'Urgent & Recent',
        notifications: urgent,
        priority: 'high',
        unreadCount: urgent.filter(n => !n.isRead).length,
      });
    }
    
    if (recent.length > 0) {
      groups.push({
        id: 'recent',
        title: 'Recent',
        notifications: recent,
        priority: 'normal',
        unreadCount: recent.filter(n => !n.isRead).length,
      });
    }
    
    if (older.length > 0) {
      groups.push({
        id: 'older',
        title: 'Older',
        notifications: older,
        priority: 'low',
        unreadCount: older.filter(n => !n.isRead).length,
      });
    }
    
    return groups;
  }
}

// Global batcher instance
export const notificationBatcher = new NotificationBatcher({
  maxBatchSize: 25,
  batchTimeout: 1500, // 1.5 seconds
  debounceDelay: 250, // 250ms
  maxRetries: 3,
  retryDelay: 1000,
});