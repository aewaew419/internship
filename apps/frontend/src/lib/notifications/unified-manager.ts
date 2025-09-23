'use client';

import { NotificationRealTimeManager } from './real-time-manager';
import { NotificationWebSocketManager } from './websocket-manager';
import type {
  NotificationEventHandler,
  NotificationUpdateHandler,
  ConnectionStatusHandler,
  ErrorHandler,
  ReconnectionConfig,
} from './real-time-manager';

export type ConnectionType = 'sse' | 'websocket' | 'auto';

export interface UnifiedManagerConfig {
  preferredConnection: ConnectionType;
  fallbackEnabled: boolean;
  sseConfig?: {
    baseUrl: string;
    reconnection: ReconnectionConfig;
    heartbeatInterval: number;
    connectionTimeout: number;
  };
  wsConfig?: {
    baseUrl: string;
    reconnection: ReconnectionConfig;
    heartbeatInterval: number;
    connectionTimeout: number;
    protocols?: string[];
  };
}

export class UnifiedNotificationManager {
  private sseManager: NotificationRealTimeManager;
  private wsManager: NotificationWebSocketManager;
  private activeManager: NotificationRealTimeManager | NotificationWebSocketManager | null = null;
  private activeConnectionType: ConnectionType | null = null;
  private config: UnifiedManagerConfig;
  private isDestroyed: boolean = false;

  // Event handlers
  private onNotificationReceived: NotificationEventHandler | null = null;
  private onNotificationUpdated: NotificationUpdateHandler | null = null;
  private onConnectionStatusChanged: ConnectionStatusHandler | null = null;
  private onError: ErrorHandler | null = null;

  constructor(config?: Partial<UnifiedManagerConfig>) {
    this.config = {
      preferredConnection: 'auto',
      fallbackEnabled: true,
      ...config,
    };

    // Initialize managers
    this.sseManager = new NotificationRealTimeManager(this.config.sseConfig);
    this.wsManager = new NotificationWebSocketManager(this.config.wsConfig);

    this.setupManagerHandlers();
  }

  /**
   * Connect using the best available method
   */
  connect(userId: number): void {
    if (this.isDestroyed) {
      console.warn('UnifiedNotificationManager has been destroyed');
      return;
    }

    const connectionType = this.determineConnectionType();
    this.connectWithType(userId, connectionType);
  }

  /**
   * Disconnect from the current connection
   */
  disconnect(): void {
    if (this.activeManager) {
      this.activeManager.disconnect();
      this.activeManager = null;
      this.activeConnectionType = null;
    }
  }

  /**
   * Destroy the manager and clean up all resources
   */
  destroy(): void {
    this.isDestroyed = true;
    this.sseManager.destroy();
    this.wsManager.destroy();
    this.activeManager = null;
    this.activeConnectionType = null;

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
    return this.activeManager?.isConnected() ?? false;
  }

  /**
   * Get the current connection type
   */
  getConnectionType(): ConnectionType | null {
    return this.activeConnectionType;
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
   * Force connection with a specific type
   */
  connectWithType(userId: number, connectionType: ConnectionType): void {
    if (this.isDestroyed) return;

    // Disconnect current connection
    this.disconnect();

    let targetType = connectionType;
    if (connectionType === 'auto') {
      targetType = this.determineConnectionType();
    }

    console.log(`Connecting with ${targetType} connection`);

    try {
      switch (targetType) {
        case 'sse':
          this.activeManager = this.sseManager;
          this.activeConnectionType = 'sse';
          this.sseManager.connect(userId);
          break;
        case 'websocket':
          this.activeManager = this.wsManager;
          this.activeConnectionType = 'websocket';
          this.wsManager.connect(userId);
          break;
        default:
          throw new Error(`Unsupported connection type: ${targetType}`);
      }
    } catch (error) {
      console.error(`Failed to connect with ${targetType}:`, error);
      
      // Try fallback if enabled
      if (this.config.fallbackEnabled && connectionType !== 'auto') {
        const fallbackType = targetType === 'sse' ? 'websocket' : 'sse';
        console.log(`Attempting fallback to ${fallbackType}`);
        this.connectWithType(userId, fallbackType);
      } else {
        this.notifyError(error as Error);
      }
    }
  }

  /**
   * Determine the best connection type based on browser support
   */
  private determineConnectionType(): ConnectionType {
    if (typeof window === 'undefined') {
      return 'sse'; // Default for SSR
    }

    // Check for EventSource support (SSE)
    const hasEventSource = typeof EventSource !== 'undefined';
    
    // Check for WebSocket support
    const hasWebSocket = typeof WebSocket !== 'undefined';

    // Prefer SSE for better mobile compatibility and simpler implementation
    if (hasEventSource) {
      return 'sse';
    } else if (hasWebSocket) {
      return 'websocket';
    } else {
      throw new Error('Neither EventSource nor WebSocket is supported');
    }
  }

  /**
   * Setup event handlers for both managers
   */
  private setupManagerHandlers(): void {
    // SSE Manager handlers
    this.sseManager.setNotificationHandler((notification) => {
      if (this.activeConnectionType === 'sse') {
        this.onNotificationReceived?.(notification);
      }
    });

    this.sseManager.setUpdateHandler((notificationId, type) => {
      if (this.activeConnectionType === 'sse') {
        this.onNotificationUpdated?.(notificationId, type);
      }
    });

    this.sseManager.setConnectionStatusHandler((connected) => {
      if (this.activeConnectionType === 'sse') {
        this.onConnectionStatusChanged?.(connected);
        
        // If SSE fails and fallback is enabled, try WebSocket
        if (!connected && this.config.fallbackEnabled) {
          this.handleConnectionFailure('sse');
        }
      }
    });

    this.sseManager.setErrorHandler((error) => {
      if (this.activeConnectionType === 'sse') {
        console.error('SSE Manager error:', error);
        
        // Try fallback if enabled
        if (this.config.fallbackEnabled) {
          this.handleConnectionFailure('sse');
        } else {
          this.onError?.(error);
        }
      }
    });

    // WebSocket Manager handlers
    this.wsManager.setNotificationHandler((notification) => {
      if (this.activeConnectionType === 'websocket') {
        this.onNotificationReceived?.(notification);
      }
    });

    this.wsManager.setUpdateHandler((notificationId, type) => {
      if (this.activeConnectionType === 'websocket') {
        this.onNotificationUpdated?.(notificationId, type);
      }
    });

    this.wsManager.setConnectionStatusHandler((connected) => {
      if (this.activeConnectionType === 'websocket') {
        this.onConnectionStatusChanged?.(connected);
        
        // If WebSocket fails and fallback is enabled, try SSE
        if (!connected && this.config.fallbackEnabled) {
          this.handleConnectionFailure('websocket');
        }
      }
    });

    this.wsManager.setErrorHandler((error) => {
      if (this.activeConnectionType === 'websocket') {
        console.error('WebSocket Manager error:', error);
        
        // Try fallback if enabled
        if (this.config.fallbackEnabled) {
          this.handleConnectionFailure('websocket');
        } else {
          this.onError?.(error);
        }
      }
    });
  }

  /**
   * Handle connection failure and attempt fallback
   */
  private handleConnectionFailure(failedType: ConnectionType): void {
    if (!this.config.fallbackEnabled || this.isDestroyed) {
      return;
    }

    const fallbackType = failedType === 'sse' ? 'websocket' : 'sse';
    console.log(`Connection failed with ${failedType}, attempting fallback to ${fallbackType}`);

    // Get user ID for reconnection
    const userId = this.getUserIdFromStorage();
    if (userId) {
      // Add a small delay before attempting fallback
      setTimeout(() => {
        if (!this.isDestroyed && !this.isConnected()) {
          this.connectWithType(userId, fallbackType);
        }
      }, 1000);
    }
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
   * Notify error
   */
  private notifyError(error: Error): void {
    this.onError?.(error);
  }
}

// Export singleton instance
export const unifiedNotificationManager = new UnifiedNotificationManager();