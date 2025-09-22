'use client';

import type {
  NotificationEventData,
  Notification,
  validateNotification,
  NotificationEventDataSchema,
} from '../../types/notifications';
import type {
  NotificationEventHandler,
  NotificationUpdateHandler,
  ConnectionStatusHandler,
  ErrorHandler,
  ReconnectionConfig,
} from './real-time-manager';

export interface WebSocketManagerConfig {
  baseUrl: string;
  reconnection: ReconnectionConfig;
  heartbeatInterval: number;
  connectionTimeout: number;
  protocols?: string[];
}

export class NotificationWebSocketManager {
  private websocket: WebSocket | null = null;
  private reconnectAttempts: number = 0;
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private heartbeatIntervalId: NodeJS.Timeout | null = null;
  private isConnecting: boolean = false;
  private isDestroyed: boolean = false;
  private lastPingTime: number = 0;

  private config: WebSocketManagerConfig = {
    baseUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
    reconnection: {
      maxAttempts: 10,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 1.5,
    },
    heartbeatInterval: 30000, // 30 seconds
    connectionTimeout: 10000, // 10 seconds
    protocols: ['notification-protocol'],
  };

  // Event handlers
  private onNotificationReceived: NotificationEventHandler | null = null;
  private onNotificationUpdated: NotificationUpdateHandler | null = null;
  private onConnectionStatusChanged: ConnectionStatusHandler | null = null;
  private onError: ErrorHandler | null = null;

  constructor(config?: Partial<WebSocketManagerConfig>) {
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
   * Connect to the WebSocket notification stream
   */
  connect(userId: number): void {
    if (this.isDestroyed) {
      console.warn('NotificationWebSocketManager has been destroyed');
      return;
    }

    if (this.websocket?.readyState === WebSocket.OPEN) {
      console.log('Already connected to WebSocket notification stream');
      return;
    }

    if (this.isConnecting) {
      console.log('WebSocket connection attempt already in progress');
      return;
    }

    this.isConnecting = true;
    this.clearReconnectTimeout();

    try {
      const url = this.buildWebSocketUrl(userId);
      console.log('Connecting to WebSocket notification stream:', url);

      this.websocket = new WebSocket(url, this.config.protocols);
      this.setupWebSocketListeners();
      this.startConnectionTimeout();
    } catch (error) {
      this.isConnecting = false;
      this.handleConnectionError(error as Error);
    }
  }

  /**
   * Disconnect from the WebSocket notification stream
   */
  disconnect(): void {
    console.log('Disconnecting from WebSocket notification stream');

    this.clearReconnectTimeout();
    this.clearHeartbeat();
    this.isConnecting = false;

    if (this.websocket) {
      this.websocket.close(1000, 'Client disconnect');
      this.websocket = null;
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
    return this.websocket?.readyState === WebSocket.OPEN;
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
   * Send a message through the WebSocket
   */
  send(message: any): void {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message');
    }
  }

  /**
   * Build the WebSocket URL with authentication
   */
  private buildWebSocketUrl(userId: number): string {
    const token = this.getAuthToken();
    const params = new URLSearchParams({
      userId: userId.toString(),
    });

    if (token) {
      params.append('token', token);
    }

    const baseUrl = this.config.baseUrl.replace(/^http/, 'ws');
    return `${baseUrl}/notifications/ws?${params.toString()}`;
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
   * Set up WebSocket event listeners
   */
  private setupWebSocketListeners(): void {
    if (!this.websocket) return;

    this.websocket.onopen = (event) => {
      console.log('Connected to WebSocket notification stream');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.notifyConnectionStatus(true);

      // Send authentication message
      this.send({
        type: 'auth',
        token: this.getAuthToken(),
      });
    };

    this.websocket.onmessage = (event) => {
      this.handleMessage(event);
    };

    this.websocket.onclose = (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
      this.handleConnectionClose(event);
    };

    this.websocket.onerror = (event) => {
      console.error('WebSocket error:', event);
      this.handleConnectionError(new Error('WebSocket connection error'));
    };
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      console.log('Received WebSocket notification event:', data);

      // Handle different message types
      switch (data.type) {
        case 'auth_success':
          console.log('WebSocket authentication successful');
          break;
        case 'auth_error':
          console.error('WebSocket authentication failed:', data.message);
          this.handleConnectionError(new Error('Authentication failed'));
          break;
        case 'ping':
          this.handlePing();
          break;
        case 'pong':
          this.handlePong();
          break;
        case 'notification':
        case 'notification_update':
          this.processNotificationEvent(data);
          break;
        default:
          console.warn('Unknown WebSocket message type:', data.type);
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
      this.notifyError(new Error('Failed to process WebSocket message'));
    }
  }

  /**
   * Handle WebSocket connection close
   */
  private handleConnectionClose(event: CloseEvent): void {
    this.isConnecting = false;
    this.notifyConnectionStatus(false);

    // Only attempt reconnection for unexpected closures
    if (event.code !== 1000 && !this.isDestroyed) {
      this.handleConnectionError(new Error(`WebSocket closed unexpectedly: ${event.code} ${event.reason}`));
    }
  }

  /**
   * Handle ping messages
   */
  private handlePing(): void {
    this.send({ type: 'pong' });
  }

  /**
   * Handle pong messages
   */
  private handlePong(): void {
    const now = Date.now();
    const latency = now - this.lastPingTime;
    console.log(`WebSocket latency: ${latency}ms`);
  }

  /**
   * Process validated notification event
   */
  private processNotificationEvent(data: any): void {
    // Validate the event data
    if (!this.validateEventData(data)) {
      console.warn('Invalid WebSocket notification event data:', data);
      return;
    }

    switch (data.eventType) {
      case 'new_notification':
        if (data.notification && validateNotification(data.notification)) {
          this.onNotificationReceived?.(data.notification);
        }
        break;
      case 'notification_read':
      case 'notification_deleted':
        if (data.notificationId) {
          const updateType = data.eventType === 'notification_read' ? 'read' : 'deleted';
          this.onNotificationUpdated?.(data.notificationId, updateType);
        }
        break;
      default:
        console.warn('Unknown notification event type:', data.eventType);
    }
  }

  /**
   * Validate notification event data
   */
  private validateEventData(data: any): boolean {
    return data && typeof data === 'object' && data.eventType && data.userId;
  }

  /**
   * Handle connection errors and implement reconnection logic
   */
  private handleConnectionError(error: Error): void {
    console.error('WebSocket connection error:', error);
    this.isConnecting = false;
    this.notifyConnectionStatus(false);
    this.notifyError(error);

    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    // Implement exponential backoff for reconnection
    if (this.reconnectAttempts < this.config.reconnection.maxAttempts && !this.isDestroyed) {
      const delay = Math.min(
        this.config.reconnection.baseDelay * Math.pow(this.config.reconnection.backoffMultiplier, this.reconnectAttempts),
        this.config.reconnection.maxDelay
      );

      console.log(`Reconnecting WebSocket in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.config.reconnection.maxAttempts})`);

      this.reconnectTimeoutId = setTimeout(() => {
        this.reconnectAttempts++;
        const userId = this.getUserIdFromStorage();
        if (userId) {
          this.connect(userId);
        }
      }, delay);
    } else {
      console.error('Max WebSocket reconnection attempts reached or manager destroyed');
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
      if (this.isConnecting && this.websocket?.readyState !== WebSocket.OPEN) {
        console.error('WebSocket connection timeout');
        this.handleConnectionError(new Error('Connection timeout'));
      }
    }, this.config.connectionTimeout);
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeat(): void {
    this.clearHeartbeat();
    
    this.heartbeatIntervalId = setInterval(() => {
      if (this.isConnected()) {
        this.lastPingTime = Date.now();
        this.send({ type: 'ping' });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Clear heartbeat timer
   */
  private clearHeartbeat(): void {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
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
export const notificationWebSocketManager = new NotificationWebSocketManager();