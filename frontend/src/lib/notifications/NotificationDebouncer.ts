'use client';

import type { Notification, NotificationType } from '../../types/notifications';

interface DebounceConfig {
  delay: number;
  maxWait: number;
  leading: boolean;
  trailing: boolean;
}

interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void;
  cancel(): void;
  flush(): void;
  pending(): boolean;
}

interface NotificationUpdateBatch {
  id: string;
  updates: Array<{
    type: 'read' | 'unread' | 'delete' | 'update';
    notification?: Notification;
    timestamp: number;
  }>;
  lastUpdate: number;
}

interface StateUpdateBatch {
  notifications: Notification[];
  unreadCount: number;
  timestamp: number;
  source: string;
}

export class NotificationDebouncer {
  private timers = new Map<string, NodeJS.Timeout>();
  private pendingUpdates = new Map<string, NotificationUpdateBatch>();
  private stateUpdateBatches = new Map<string, StateUpdateBatch>();
  private listeners = new Map<string, Set<(...args: any[]) => void>>();

  // Create a debounced function
  debounce<T extends (...args: any[]) => any>(
    func: T,
    config: Partial<DebounceConfig> = {}
  ): DebouncedFunction<T> {
    const {
      delay = 300,
      maxWait = 1000,
      leading = false,
      trailing = true,
    } = config;

    let timeoutId: NodeJS.Timeout | null = null;
    let maxTimeoutId: NodeJS.Timeout | null = null;
    let lastCallTime = 0;
    let lastInvokeTime = 0;
    let lastArgs: Parameters<T>;
    let result: ReturnType<T>;

    const invokeFunc = (time: number) => {
      const args = lastArgs;
      lastArgs = undefined as any;
      lastInvokeTime = time;
      result = func.apply(undefined, args);
      return result;
    };

    const leadingEdge = (time: number) => {
      lastInvokeTime = time;
      timeoutId = setTimeout(timerExpired, delay);
      return leading ? invokeFunc(time) : result;
    };

    const remainingWait = (time: number) => {
      const timeSinceLastCall = time - lastCallTime;
      const timeSinceLastInvoke = time - lastInvokeTime;
      const timeWaiting = delay - timeSinceLastCall;

      return maxWait !== undefined
        ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
        : timeWaiting;
    };

    const shouldInvoke = (time: number) => {
      const timeSinceLastCall = time - lastCallTime;
      const timeSinceLastInvoke = time - lastInvokeTime;

      return (
        lastCallTime === 0 ||
        timeSinceLastCall >= delay ||
        timeSinceLastCall < 0 ||
        (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
      );
    };

    const timerExpired = () => {
      const time = Date.now();
      if (shouldInvoke(time)) {
        return trailingEdge(time);
      }
      timeoutId = setTimeout(timerExpired, remainingWait(time));
    };

    const trailingEdge = (time: number) => {
      timeoutId = null;

      if (trailing && lastArgs) {
        return invokeFunc(time);
      }
      lastArgs = undefined as any;
      return result;
    };

    const cancel = () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      if (maxTimeoutId !== null) {
        clearTimeout(maxTimeoutId);
      }
      lastInvokeTime = 0;
      lastCallTime = 0;
      lastArgs = undefined as any;
      timeoutId = null;
      maxTimeoutId = null;
    };

    const flush = () => {
      return timeoutId === null ? result : trailingEdge(Date.now());
    };

    const pending = () => {
      return timeoutId !== null;
    };

    const debounced = (...args: Parameters<T>) => {
      const time = Date.now();
      const isInvoking = shouldInvoke(time);

      lastArgs = args;
      lastCallTime = time;

      if (isInvoking) {
        if (timeoutId === null) {
          return leadingEdge(lastCallTime);
        }
        if (maxWait !== undefined) {
          timeoutId = setTimeout(timerExpired, delay);
          return invokeFunc(lastCallTime);
        }
      }
      if (timeoutId === null) {
        timeoutId = setTimeout(timerExpired, delay);
      }
      return result;
    };

    debounced.cancel = cancel;
    debounced.flush = flush;
    debounced.pending = pending;

    return debounced;
  }

  // Debounce notification updates by ID
  debounceNotificationUpdate(
    notificationId: string,
    updateType: 'read' | 'unread' | 'delete' | 'update',
    notification?: Notification,
    delay: number = 250
  ): void {
    const key = `notification-${notificationId}`;
    
    // Clear existing timer
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Add to pending updates
    if (!this.pendingUpdates.has(notificationId)) {
      this.pendingUpdates.set(notificationId, {
        id: notificationId,
        updates: [],
        lastUpdate: Date.now(),
      });
    }

    const batch = this.pendingUpdates.get(notificationId)!;
    batch.updates.push({
      type: updateType,
      notification,
      timestamp: Date.now(),
    });
    batch.lastUpdate = Date.now();

    // Set new timer
    const timer = setTimeout(() => {
      this.flushNotificationUpdates(notificationId);
      this.timers.delete(key);
    }, delay);

    this.timers.set(key, timer);
  }

  // Debounce state updates
  debounceStateUpdate(
    source: string,
    notifications: Notification[],
    unreadCount: number,
    delay: number = 100
  ): void {
    const key = `state-${source}`;
    
    // Clear existing timer
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Update batch
    this.stateUpdateBatches.set(source, {
      notifications,
      unreadCount,
      timestamp: Date.now(),
      source,
    });

    // Set new timer
    const timer = setTimeout(() => {
      this.flushStateUpdates(source);
      this.timers.delete(key);
    }, delay);

    this.timers.set(key, timer);
  }

  // Debounce search queries
  debounceSearch(
    query: string,
    callback: (query: string) => void,
    delay: number = 300
  ): void {
    const key = 'search';
    
    // Clear existing timer
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      callback(query);
      this.timers.delete(key);
    }, delay);

    this.timers.set(key, timer);
  }

  // Debounce filter changes
  debounceFilter(
    filters: any,
    callback: (filters: any) => void,
    delay: number = 200
  ): void {
    const key = 'filter';
    
    // Clear existing timer
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      callback(filters);
      this.timers.delete(key);
    }, delay);

    this.timers.set(key, timer);
  }

  // Smart debouncing based on notification type
  smartDebounceNotification(
    notification: Notification,
    updateType: 'read' | 'unread' | 'delete' | 'update',
    callback: (notification: Notification, updateType: string) => void
  ): void {
    // Different delays based on notification priority and type
    let delay = 300; // default

    if (notification.priority === 'high') {
      delay = 100; // High priority notifications get faster updates
    } else if (notification.type === NotificationType.SYSTEM_ANNOUNCEMENT) {
      delay = 500; // System announcements can wait longer
    } else if (updateType === 'read') {
      delay = 200; // Read status updates are frequent, use shorter delay
    }

    this.debounceNotificationUpdate(
      notification.id,
      updateType,
      notification,
      delay
    );

    // Also set up the callback
    this.addListener(`notification-${notification.id}`, callback);
  }

  // Batch multiple rapid updates
  batchRapidUpdates(
    updates: Array<{
      notificationId: string;
      type: 'read' | 'unread' | 'delete' | 'update';
      notification?: Notification;
    }>,
    callback: (batches: NotificationUpdateBatch[]) => void,
    delay: number = 500
  ): void {
    // Group updates by notification ID
    updates.forEach(update => {
      this.debounceNotificationUpdate(
        update.notificationId,
        update.type,
        update.notification,
        delay
      );
    });

    // Set up batch callback
    const key = 'batch-updates';
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      const batches = Array.from(this.pendingUpdates.values());
      callback(batches);
      this.timers.delete(key);
    }, delay);

    this.timers.set(key, timer);
  }

  // Throttle high-frequency operations
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle = false;
    let lastResult: ReturnType<T>;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        lastResult = func.apply(undefined, args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
      return lastResult;
    };
  }

  // Add listener for debounced events
  addListener(key: string, callback: (...args: any[]) => void): void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(callback);
  }

  // Remove listener
  removeListener(key: string, callback: (...args: any[]) => void): void {
    const listeners = this.listeners.get(key);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.listeners.delete(key);
      }
    }
  }

  // Flush specific notification updates
  private flushNotificationUpdates(notificationId: string): void {
    const batch = this.pendingUpdates.get(notificationId);
    if (!batch) return;

    // Get the latest update for each type
    const latestUpdates = new Map<string, any>();
    batch.updates.forEach(update => {
      latestUpdates.set(update.type, update);
    });

    // Notify listeners
    const listeners = this.listeners.get(`notification-${notificationId}`);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          Array.from(latestUpdates.values()).forEach(update => {
            callback(update.notification, update.type);
          });
        } catch (error) {
          console.error('Listener error:', error);
        }
      });
    }

    // Clear the batch
    this.pendingUpdates.delete(notificationId);
  }

  // Flush state updates
  private flushStateUpdates(source: string): void {
    const batch = this.stateUpdateBatches.get(source);
    if (!batch) return;

    // Notify listeners
    const listeners = this.listeners.get(`state-${source}`);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(batch.notifications, batch.unreadCount);
        } catch (error) {
          console.error('State update listener error:', error);
        }
      });
    }

    // Clear the batch
    this.stateUpdateBatches.delete(source);
  }

  // Flush all pending updates
  flushAll(): void {
    // Flush notification updates
    for (const notificationId of this.pendingUpdates.keys()) {
      this.flushNotificationUpdates(notificationId);
    }

    // Flush state updates
    for (const source of this.stateUpdateBatches.keys()) {
      this.flushStateUpdates(source);
    }

    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
  }

  // Cancel all pending operations
  cancelAll(): void {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();

    // Clear all pending updates
    this.pendingUpdates.clear();
    this.stateUpdateBatches.clear();
  }

  // Get pending update count
  getPendingCount(): number {
    return this.pendingUpdates.size + this.stateUpdateBatches.size;
  }

  // Check if there are pending updates for a notification
  hasPendingUpdates(notificationId: string): boolean {
    return this.pendingUpdates.has(notificationId);
  }

  // Get statistics
  getStats(): {
    pendingNotificationUpdates: number;
    pendingStateUpdates: number;
    activeTimers: number;
    listeners: number;
  } {
    return {
      pendingNotificationUpdates: this.pendingUpdates.size,
      pendingStateUpdates: this.stateUpdateBatches.size,
      activeTimers: this.timers.size,
      listeners: Array.from(this.listeners.values()).reduce(
        (total, set) => total + set.size,
        0
      ),
    };
  }
}

// Specialized notification update debouncer
export class NotificationUpdateDebouncer {
  private debouncer = new NotificationDebouncer();
  private updateQueue = new Map<string, Array<{
    type: 'mark_read' | 'mark_unread' | 'delete' | 'update_settings';
    data?: any;
    timestamp: number;
  }>>();

  // Debounce mark as read operations
  debounceMarkAsRead(
    notificationIds: string[],
    callback: (ids: string[]) => void,
    delay: number = 300
  ): void {
    const key = 'mark-read-batch';
    
    // Add to queue
    notificationIds.forEach(id => {
      if (!this.updateQueue.has(id)) {
        this.updateQueue.set(id, []);
      }
      this.updateQueue.get(id)!.push({
        type: 'mark_read',
        timestamp: Date.now(),
      });
    });

    // Debounce the callback
    const debouncedCallback = this.debouncer.debounce(() => {
      const idsToUpdate = Array.from(this.updateQueue.keys()).filter(id => {
        const updates = this.updateQueue.get(id) || [];
        return updates.some(update => update.type === 'mark_read');
      });

      if (idsToUpdate.length > 0) {
        callback(idsToUpdate);
        // Clear processed updates
        idsToUpdate.forEach(id => this.updateQueue.delete(id));
      }
    }, { delay, trailing: true });

    debouncedCallback();
  }

  // Debounce delete operations
  debounceDelete(
    notificationIds: string[],
    callback: (ids: string[]) => void,
    delay: number = 500
  ): void {
    const key = 'delete-batch';
    
    // Add to queue
    notificationIds.forEach(id => {
      if (!this.updateQueue.has(id)) {
        this.updateQueue.set(id, []);
      }
      this.updateQueue.get(id)!.push({
        type: 'delete',
        timestamp: Date.now(),
      });
    });

    // Debounce the callback
    const debouncedCallback = this.debouncer.debounce(() => {
      const idsToDelete = Array.from(this.updateQueue.keys()).filter(id => {
        const updates = this.updateQueue.get(id) || [];
        return updates.some(update => update.type === 'delete');
      });

      if (idsToDelete.length > 0) {
        callback(idsToDelete);
        // Clear processed updates
        idsToDelete.forEach(id => this.updateQueue.delete(id));
      }
    }, { delay, trailing: true });

    debouncedCallback();
  }

  // Debounce settings updates
  debounceSettingsUpdate(
    settings: any,
    callback: (settings: any) => void,
    delay: number = 1000
  ): void {
    const debouncedCallback = this.debouncer.debounce(callback, {
      delay,
      trailing: true,
      maxWait: 2000,
    });

    debouncedCallback(settings);
  }

  // Clear all pending updates
  clear(): void {
    this.debouncer.cancelAll();
    this.updateQueue.clear();
  }
}

// Global instances
export const notificationDebouncer = new NotificationDebouncer();
export const notificationUpdateDebouncer = new NotificationUpdateDebouncer();