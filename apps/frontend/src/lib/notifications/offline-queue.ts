'use client';

import type { 
  Notification, 
  NotificationSettings, 
  BulkNotificationOperation 
} from '../../types/notifications';

// Offline notification queue interfaces
export interface OfflineNotificationAction {
  id: string;
  type: 'mark_read' | 'delete' | 'mark_all_read' | 'clear_all' | 'update_settings' | 'bulk_operation';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  userId?: number;
}

export interface OfflineQueueConfig {
  maxQueueSize: number;
  maxRetries: number;
  retryDelayMs: number;
  maxRetryDelayMs: number;
  backoffMultiplier: number;
  persistenceKey: string;
}

export interface OfflineQueueStats {
  totalActions: number;
  pendingActions: number;
  failedActions: number;
  lastProcessed: number | null;
  lastError: string | null;
}

// Default configuration
const DEFAULT_CONFIG: OfflineQueueConfig = {
  maxQueueSize: 100,
  maxRetries: 3,
  retryDelayMs: 1000,
  maxRetryDelayMs: 30000,
  backoffMultiplier: 2,
  persistenceKey: 'notification_offline_queue',
};

export class OfflineNotificationManager {
  private static instance: OfflineNotificationManager;
  private queue: OfflineNotificationAction[] = [];
  private config: OfflineQueueConfig;
  private isProcessing: boolean = false;
  private processingPromise: Promise<void> | null = null;
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private listeners: Set<(stats: OfflineQueueStats) => void> = new Set();

  private constructor(config?: Partial<OfflineQueueConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadQueue();
    this.setupNetworkListeners();
  }

  static getInstance(config?: Partial<OfflineQueueConfig>): OfflineNotificationManager {
    if (!OfflineNotificationManager.instance) {
      OfflineNotificationManager.instance = new OfflineNotificationManager(config);
    }
    return OfflineNotificationManager.instance;
  }

  /**
   * Queue an offline notification action
   */
  queueAction(
    type: OfflineNotificationAction['type'],
    data: any,
    userId?: number
  ): string {
    const action: OfflineNotificationAction = {
      id: this.generateActionId(),
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      userId,
    };

    // Check queue size limit
    if (this.queue.length >= this.config.maxQueueSize) {
      // Remove oldest action to make space
      const removed = this.queue.shift();
      if (removed) {
        this.clearRetryTimeout(removed.id);
        console.warn('Offline queue full, removed oldest action:', removed.id);
      }
    }

    this.queue.push(action);
    this.persistQueue();
    this.notifyListeners();

    console.log(`Queued offline action: ${type}`, action.id);
    return action.id;
  }

  /**
   * Process the offline queue when network is available
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || !this.isOnline()) {
      return;
    }

    if (this.processingPromise) {
      return this.processingPromise;
    }

    this.isProcessing = true;
    this.processingPromise = this._processQueueInternal();

    try {
      await this.processingPromise;
    } finally {
      this.isProcessing = false;
      this.processingPromise = null;
    }
  }

  private async _processQueueInternal(): Promise<void> {
    const actionsToProcess = [...this.queue];
    
    for (const action of actionsToProcess) {
      if (!this.isOnline()) {
        console.log('Network unavailable, stopping queue processing');
        break;
      }

      try {
        await this.executeAction(action);
        this.removeActionFromQueue(action.id);
        console.log(`Successfully processed offline action: ${action.type}`, action.id);
      } catch (error) {
        await this.handleActionError(action, error);
      }
    }

    this.persistQueue();
    this.notifyListeners();
  }

  /**
   * Execute a specific offline action
   */
  private async executeAction(action: OfflineNotificationAction): Promise<void> {
    // Import notification service dynamically to avoid circular dependencies
    const { notificationService } = await import('../api/services/notification.service');

    switch (action.type) {
      case 'mark_read':
        await notificationService.markAsRead(action.data.notificationId);
        break;

      case 'delete':
        await notificationService.deleteNotification(action.data.notificationId);
        break;

      case 'mark_all_read':
        await notificationService.markAllAsRead();
        break;

      case 'clear_all':
        await notificationService.clearAll();
        break;

      case 'update_settings':
        await notificationService.updateSettings(action.data.settings);
        break;

      case 'bulk_operation':
        await notificationService.bulkOperation(action.data.operation);
        break;

      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Handle action execution error with retry logic
   */
  private async handleActionError(action: OfflineNotificationAction, error: any): Promise<void> {
    action.retryCount++;
    
    if (action.retryCount >= action.maxRetries) {
      console.error(`Action ${action.id} failed after ${action.maxRetries} retries:`, error);
      this.removeActionFromQueue(action.id);
      return;
    }

    // Calculate exponential backoff delay
    const baseDelay = this.config.retryDelayMs;
    const backoffDelay = baseDelay * Math.pow(this.config.backoffMultiplier, action.retryCount - 1);
    const delay = Math.min(backoffDelay, this.config.maxRetryDelayMs);
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    const finalDelay = delay + jitter;

    console.log(`Retrying action ${action.id} in ${finalDelay}ms (attempt ${action.retryCount}/${action.maxRetries})`);

    // Schedule retry
    const timeoutId = setTimeout(() => {
      this.retryTimeouts.delete(action.id);
      this.processQueue();
    }, finalDelay);

    this.retryTimeouts.set(action.id, timeoutId);
  }

  /**
   * Remove action from queue
   */
  private removeActionFromQueue(actionId: string): void {
    const index = this.queue.findIndex(action => action.id === actionId);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.clearRetryTimeout(actionId);
    }
  }

  /**
   * Clear retry timeout for an action
   */
  private clearRetryTimeout(actionId: string): void {
    const timeoutId = this.retryTimeouts.get(actionId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.retryTimeouts.delete(actionId);
    }
  }

  /**
   * Clear all actions from queue
   */
  clearQueue(): void {
    // Clear all retry timeouts
    for (const [actionId] of this.retryTimeouts) {
      this.clearRetryTimeout(actionId);
    }

    this.queue = [];
    this.persistQueue();
    this.notifyListeners();
    console.log('Offline queue cleared');
  }

  /**
   * Get queue statistics
   */
  getStats(): OfflineQueueStats {
    const failedActions = this.queue.filter(action => action.retryCount >= action.maxRetries).length;
    const lastProcessedAction = this.queue
      .filter(action => action.retryCount > 0)
      .sort((a, b) => b.timestamp - a.timestamp)[0];

    return {
      totalActions: this.queue.length,
      pendingActions: this.queue.length - failedActions,
      failedActions,
      lastProcessed: lastProcessedAction?.timestamp || null,
      lastError: null, // Could be enhanced to track last error
    };
  }

  /**
   * Get all queued actions (for debugging)
   */
  getQueuedActions(): OfflineNotificationAction[] {
    return [...this.queue];
  }

  /**
   * Check if network is online
   */
  private isOnline(): boolean {
    if (typeof window === 'undefined') return true;
    return navigator.onLine;
  }

  /**
   * Setup network event listeners
   */
  private setupNetworkListeners(): void {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      console.log('Network connection restored, processing offline queue');
      // Add small delay to ensure connection is stable
      setTimeout(() => {
        this.processQueue();
      }, 1000);
    };

    const handleOffline = () => {
      console.log('Network connection lost');
      this.notifyListeners();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup method (would need to be called on app unmount)
    this.cleanup = () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  private cleanup?: () => void;

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Clear all retry timeouts
    for (const [actionId] of this.retryTimeouts) {
      this.clearRetryTimeout(actionId);
    }

    // Remove network listeners
    if (this.cleanup) {
      this.cleanup();
    }

    // Clear listeners
    this.listeners.clear();
  }

  /**
   * Persist queue to localStorage
   */
  private persistQueue(): void {
    if (typeof window === 'undefined') return;

    try {
      const queueData = {
        queue: this.queue,
        timestamp: Date.now(),
      };
      localStorage.setItem(this.config.persistenceKey, JSON.stringify(queueData));
    } catch (error) {
      console.warn('Failed to persist offline queue:', error);
    }
  }

  /**
   * Load queue from localStorage
   */
  private loadQueue(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.config.persistenceKey);
      if (stored) {
        const { queue, timestamp } = JSON.parse(stored);
        
        // Only load if not too old (24 hours)
        const maxAge = 24 * 60 * 60 * 1000;
        if (Date.now() - timestamp < maxAge) {
          this.queue = queue || [];
          console.log(`Loaded ${this.queue.length} actions from offline queue`);
        } else {
          console.log('Offline queue expired, starting fresh');
          localStorage.removeItem(this.config.persistenceKey);
        }
      }
    } catch (error) {
      console.warn('Failed to load offline queue:', error);
      this.queue = [];
    }
  }

  /**
   * Generate unique action ID
   */
  private generateActionId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add listener for queue stats changes
   */
  addListener(listener: (stats: OfflineQueueStats) => void): () => void {
    this.listeners.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of stats changes
   */
  private notifyListeners(): void {
    const stats = this.getStats();
    for (const listener of this.listeners) {
      try {
        listener(stats);
      } catch (error) {
        console.error('Error in offline queue listener:', error);
      }
    }
  }

  /**
   * Force retry of failed actions
   */
  retryFailedActions(): void {
    const failedActions = this.queue.filter(action => action.retryCount >= action.maxRetries);
    
    for (const action of failedActions) {
      action.retryCount = 0; // Reset retry count
    }

    if (failedActions.length > 0) {
      console.log(`Retrying ${failedActions.length} failed actions`);
      this.processQueue();
    }
  }

  /**
   * Remove actions older than specified age
   */
  cleanupOldActions(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): void {
    const cutoffTime = Date.now() - maxAgeMs;
    const initialLength = this.queue.length;
    
    this.queue = this.queue.filter(action => action.timestamp > cutoffTime);
    
    const removedCount = initialLength - this.queue.length;
    if (removedCount > 0) {
      console.log(`Cleaned up ${removedCount} old offline actions`);
      this.persistQueue();
      this.notifyListeners();
    }
  }
}

// Export singleton instance
export const offlineNotificationManager = OfflineNotificationManager.getInstance();

// Convenience functions for common operations
export const queueMarkAsRead = (notificationId: string, userId?: number): string => {
  return offlineNotificationManager.queueAction('mark_read', { notificationId }, userId);
};

export const queueDeleteNotification = (notificationId: string, userId?: number): string => {
  return offlineNotificationManager.queueAction('delete', { notificationId }, userId);
};

export const queueMarkAllAsRead = (userId?: number): string => {
  return offlineNotificationManager.queueAction('mark_all_read', {}, userId);
};

export const queueClearAll = (userId?: number): string => {
  return offlineNotificationManager.queueAction('clear_all', {}, userId);
};

export const queueUpdateSettings = (settings: Partial<NotificationSettings>, userId?: number): string => {
  return offlineNotificationManager.queueAction('update_settings', { settings }, userId);
};

export const queueBulkOperation = (operation: BulkNotificationOperation, userId?: number): string => {
  return offlineNotificationManager.queueAction('bulk_operation', { operation }, userId);
};