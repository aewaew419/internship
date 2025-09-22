'use client';

import type {
  NotificationEventData,
  Notification,
  validateNotification,
  NotificationEventDataSchema,
} from '../../types/notifications';

export interface ReconnectionConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface NotificationRealTimeManagerConfig {
  baseUrl: string;
  reconnection: ReconnectionConfig;
  heartbeatInterval: number;
  connectionTimeout: number;
}

export type NotificationEventHandler = (notification: Notification) => void;
export type NotificationUpdateHandler = (notificationId: string, type: 'read' | 'deleted') => void;
export type ConnectionStatusHandler = (connected: boolean) => void;
export type ErrorHandler = (error: Error) => void;

export class NotificationRealTimeManager {
  private eventSource: EventSource | null = null;
  private reconnectAttempts: number = 0;
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private heartbeatIntervalId: NodeJS.Timeout | null = null;
  private isConnecting: boolean = false;
  private isDestroyed: boolean = false;
  private lastEventId: string | null = null;

  private config: NotificationRealTimeManagerConfig = {
    baseUrl: process.env.NEXT_PUBLIC_API_V1 + '/api/v1',
    reconnection: {
      maxAttempts: 10,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 1.5,
    },
    heartbeatInterval: 30000, // 30 seconds
    connectionTimeout: 10000, // 10 seconds
  };

  // Event handlers
  private onNotificationReceived: NotificationEventHandler | null = null;
  private onNotificationUpdated: NotificationUpdateHandler | null = null;
  private onConnectionStatusChanged: ConnectionStatusHandler | null = null;
  private onError: ErrorHandler | null = null;

  constructor(config?: Partial<NotificationRealTimeManagerConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline.bind(this));
      window.addEventListener('offline', this.handleOffline.bind(this));
      window.addEventListener('beforeunload', this.disconnect.bind(this));
    }
  }

  /**
   * Connect to the real-time notification stream
   */
  connect(userId: number): void {
    if (this.isDestroyed) {
      console.warn('NotificationRealTimeManager has been destroyed');
      return;
    }

    if (this.eventSource?.readyState === EventSource.OPEN) {
      console.log('Already connected to notification stream');
      return;
    }

    if (this.isConnecting) {
      console.log('Connection attempt already in progress');
      return;
    }

    this.isConnecting = true;
    this.clearReconnectTimeout();

    try {
      const url = this.buildEventSourceUrl(userId);
      console.log('Connecting to notification stream:', url);

      this.eventSource = new EventSource(url);
      this.setupEventListeners();
      this.startConnectionTimeout();
    } catch (error) {
      this.isConnecting = false;
      this.handleConnectionError(error as Error);
    }
  }

  /**
   * Disconnect from the real-time notification stream
   */
  disconnect(): void {
    console.log('Disconnecting from notification stream');

    this.clearReconnectTimeout();
    this.clearHeartbeat();
    this.isConnecting = false;

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.notifyConnectionStatus(false);
  }

  /**
   * Destroy the manager and clean up all resources
   */
  destroy(): void {
    this.isDestroyed = true;
    this.disconnect();

    // Remove event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline.bind(this));
      window.removeEventListener('offline', this.handleOffline.bind(this));
      window.removeEventListener('beforeunload', this.disconnect.bind(this));
    }

    // Clear all handlers
    this.onNotificationReceived = null;
    this.onNotificationUpdated = null;
    this.onConnectionStatusChanged = null;
    this.onError = null;
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }

  /**
   * Set handler for new notifications
   */
  setNotificationHandler(handler: NotificationEventHandler): void {
    this.onNotificationReceived = handler;
  }

  /**
   * Set handler for notification updates (read/deleted)
   */
  setUpdateHandler(handler: NotificationUpdateHandler): void {
    this.onNotificationUpdated = handler;
  }

  /**
   * Set handler for connection status changes
   */
  setConnectionStatusHandler(handler: ConnectionStatusHandler): void {
    this.onConnectionStatusChanged = handler;
  }

  /**
   * Set handler for errors
   */
  setErrorHandler(handler: ErrorHandler): void {
    this.onError = handler;
  }

  /**
   * Build the EventSource URL with authentication
   */
  private buildEventSourceUrl(userId: number): string {
    const token = this.getAuthToken();
    const params = new URLSearchParams({
      userId: userId.toString(),
    });

    if (token) {
      params.append('token', token);
    }

    if (this.lastEventId) {
      params.append('lastEventId', this.lastEventId);
    }

    return `${this.config.baseUrl}/notifications/stream?${params.toString()}`;
  }

  /**
   * Get authentication token from storage
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;

    try {
      const userAccount = localStorage.getItem('user_account');
      if (!userAccount || userAccount === 'undefined') return null;
      
      const user = JSON.parse(userAccount);
      return user?.access_token ?? null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Set up EventSource event listeners
   */
  private setupEventListeners(): void {
    if (!this.eventSource) return;

    this.eventSource.onopen = (event) => {
      console.log('Connected to notification stream');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.notifyConnectionStatus(true);
    };

    this.eventSource.onmessage = (event) => {
      this.handleMessage(event);
    };

    this.eventSource.onerror = (event) => {
      console.error('EventSource error:', event);
      this.handleConnectionError(new Error('EventSource connection error'));
    };

    // Handle specific event types
    this.eventSource.addEventListener('notification', (event) => {
      this.handleNotificationEvent(event as MessageEvent);
    });

    this.eventSource.addEventListener('notification_update', (event) => {
      this.handleNotificationUpdateEvent(event as MessageEvent);
    });

    this.eventSource.addEventListener('heartbeat', (event) => {
      this.handleHeartbeat(event as MessageEvent);
    });
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(event: MessageEvent): void {
    try {
      if (event.lastEventId) {
        this.lastEventId = event.lastEventId;
      }

      const data = JSON.parse(event.data);
      console.log('Received notification event:', data);

      // Validate the event data
      if (!this.validateEventData(data)) {
        console.warn('Invalid notification event data:', data);
        return;
      }

      this.processNotificationEvent(data);
    } catch (error) {
      console.error('Error processing notification message:', error);
      this.notifyError(new Error('Failed to process notification message'));
    }
  }

  /**
   * Handle notification events
   */
  private handleNotificationEvent(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      if (data.notification && validateNotification(data.notification)) {
        this.onNotificationReceived?.(data.notification);
      }
    } catch (error) {
      console.error('Error handling notification event:', error);
    }
  }

  /**
   * Handle notification update events
   */
  private handleNotificationUpdateEvent(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      
      if (data.notificationId && data.type) {
        this.onNotificationUpdated?.(data.notificationId, data.type);
      }
    } catch (error) {
      console.error('Error handling notification update event:', error);
    }
  }

  /**
   * Handle heartbeat events
   */
  private handleHeartbeat(event: MessageEvent): void {
    console.log('Received heartbeat');
    // Reset heartbeat timer
    this.startHeartbeat();
  }

  /**
   * Validate notification event data
   */
  private validateEventData(data: any): data is NotificationEventData {
    try {
      NotificationEventDataSchema.validateSync(data);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Process validated notification event
   */
  private processNotificationEvent(data: NotificationEventData): void {
    switch (data.type) {
      case 'new_notification':
        if (data.notification && validateNotification(data.notification)) {
          this.onNotificationReceived?.(data.notification);
        }
        break;
      case 'notification_read':
      case 'notification_deleted':
        if (data.notificationId) {
          const updateType = data.type === 'notification_read' ? 'read' : 'deleted';
          this.onNotificationUpdated?.(data.notificationId, updateType);
        }
        break;
      default:
        console.warn('Unknown notification event type:', data.type);
    }
  }

  /**
   * Handle connection errors and implement reconnection logic
   */
  private handleConnectionError(error: Error): void {
    console.error('Connection error:', error);
    this.isConnecting = false;
    this.notifyConnectionStatus(false);
    this.notifyError(error);

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    // Implement exponential backoff for reconnection
    if (this.reconnectAttempts < this.config.reconnection.maxAttempts && !this.isDestroyed) {
      const delay = Math.min(
        this.config.reconnection.baseDelay * Math.pow(this.config.reconnection.backoffMultiplier, this.reconnectAttempts),
        this.config.reconnection.maxDelay
      );

      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.config.reconnection.maxAttempts})`);

      this.reconnectTimeoutId = setTimeout(() => {
        this.reconnectAttempts++;
        const userId = this.getUserIdFromStorage();
        if (userId) {
          this.connect(userId);
        }
      }, delay);
    } else {
      console.error('Max reconnection attempts reached or manager destroyed');
    }
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    console.log('Network connection restored');
    if (!this.isConnected() && !this.isConnecting) {
      const userId = this.getUserIdFromStorage();
      if (userId) {
        this.reconnectAttempts = 0; // Reset attempts on network restore
        this.connect(userId);
      }
    }
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    console.log('Network connection lost');
    this.disconnect();
  }

  /**
   * Get user ID from storage
   */
  private getUserIdFromStorage(): number | null {
    if (typeof window === 'undefined') return null;

    try {
      const userAccount = localStorage.getItem('user_account');
      if (!userAccount || userAccount === 'undefined') return null;
      
      const user = JSON.parse(userAccount);
      return user?.id ?? null;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  }

  /**
   * Start connection timeout
   */
  private startConnectionTimeout(): void {
    setTimeout(() => {
      if (this.isConnecting && this.eventSource?.readyState !== EventSource.OPEN) {
        console.error('Connection timeout');
        this.handleConnectionError(new Error('Connection timeout'));
      }
    }, this.config.connectionTimeout);
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    this.clearHeartbeat();
    
    this.heartbeatIntervalId = setTimeout(() => {
      if (this.isConnected()) {
        console.warn('Heartbeat timeout - connection may be stale');
        this.handleConnectionError(new Error('Heartbeat timeout'));
      }
    }, this.config.heartbeatInterval * 2); // Allow 2x heartbeat interval before timeout
  }

  /**
   * Clear heartbeat timer
   */
  private clearHeartbeat(): void {
    if (this.heartbeatIntervalId) {
      clearTimeout(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
  }

  /**
   * Clear reconnect timeout
   */
  private clearReconnectTimeout(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
  }

  /**
   * Notify connection status change
   */
  private notifyConnectionStatus(connected: boolean): void {
    this.onConnectionStatusChanged?.(connected);
  }

  /**
   * Notify error
   */
  private notifyError(error: Error): void {
    this.onError?.(error);
  }
}

// Export singleton instance
export const notificationRealTimeManager = new NotificationRealTimeManager();