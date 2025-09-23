'use client';

// Network status monitoring and handling for offline notifications
export interface NetworkStatus {
  isOnline: boolean;
  connectionType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export interface NetworkStatusListener {
  (status: NetworkStatus): void;
}

export interface NetworkRetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitterEnabled: boolean;
}

export interface ConnectionQuality {
  level: 'excellent' | 'good' | 'fair' | 'poor' | 'offline';
  score: number; // 0-100
  description: string;
}

// Default retry configuration
const DEFAULT_RETRY_CONFIG: NetworkRetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitterEnabled: true,
};

export class NetworkStatusManager {
  private static instance: NetworkStatusManager;
  private listeners: Set<NetworkStatusListener> = new Set();
  private currentStatus: NetworkStatus;
  private retryTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private connectionHistory: Array<{ timestamp: number; isOnline: boolean }> = [];
  private maxHistorySize = 100;

  private constructor() {
    this.currentStatus = this.getCurrentNetworkStatus();
    this.setupEventListeners();
    this.startConnectionMonitoring();
  }

  static getInstance(): NetworkStatusManager {
    if (!NetworkStatusManager.instance) {
      NetworkStatusManager.instance = new NetworkStatusManager();
    }
    return NetworkStatusManager.instance;
  }

  /**
   * Get current network status
   */
  getStatus(): NetworkStatus {
    return { ...this.currentStatus };
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return this.currentStatus.isOnline;
  }

  /**
   * Get connection quality assessment
   */
  getConnectionQuality(): ConnectionQuality {
    if (!this.currentStatus.isOnline) {
      return {
        level: 'offline',
        score: 0,
        description: 'No network connection',
      };
    }

    // Calculate quality score based on various factors
    let score = 100;
    
    // Factor in RTT (round-trip time)
    if (this.currentStatus.rtt > 1000) {
      score -= 40; // Very high latency
    } else if (this.currentStatus.rtt > 500) {
      score -= 25; // High latency
    } else if (this.currentStatus.rtt > 200) {
      score -= 10; // Moderate latency
    }

    // Factor in downlink speed
    if (this.currentStatus.downlink < 0.5) {
      score -= 30; // Very slow connection
    } else if (this.currentStatus.downlink < 1.5) {
      score -= 20; // Slow connection
    } else if (this.currentStatus.downlink < 5) {
      score -= 10; // Moderate connection
    }

    // Factor in effective connection type
    switch (this.currentStatus.effectiveType) {
      case 'slow-2g':
        score -= 50;
        break;
      case '2g':
        score -= 35;
        break;
      case '3g':
        score -= 15;
        break;
      case '4g':
        // No penalty
        break;
    }

    // Factor in save data mode
    if (this.currentStatus.saveData) {
      score -= 5;
    }

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    // Determine quality level
    let level: ConnectionQuality['level'];
    let description: string;

    if (score >= 80) {
      level = 'excellent';
      description = 'Excellent connection quality';
    } else if (score >= 60) {
      level = 'good';
      description = 'Good connection quality';
    } else if (score >= 40) {
      level = 'fair';
      description = 'Fair connection quality - some delays expected';
    } else {
      level = 'poor';
      description = 'Poor connection quality - significant delays expected';
    }

    return { level, score, description };
  }

  /**
   * Add network status listener
   */
  addListener(listener: NetworkStatusListener): () => void {
    this.listeners.add(listener);
    
    // Immediately call with current status
    listener(this.currentStatus);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Wait for network connection to be restored
   */
  async waitForConnection(timeoutMs: number = 30000): Promise<boolean> {
    if (this.isOnline()) {
      return true;
    }

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeoutMs);

      const unsubscribe = this.addListener((status) => {
        if (status.isOnline) {
          clearTimeout(timeoutId);
          unsubscribe();
          resolve(true);
        }
      });
    });
  }

  /**
   * Execute function with automatic retry on network failure
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    config: Partial<NetworkRetryConfig> = {}
  ): Promise<T> {
    const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    let lastError: Error;

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        // Check if we're online before attempting
        if (!this.isOnline()) {
          // Wait for connection if offline
          const connected = await this.waitForConnection(10000);
          if (!connected) {
            throw new Error('Network connection not available');
          }
        }

        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Don't retry if this is the last attempt
        if (attempt === retryConfig.maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const baseDelay = retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt);
        let delay = Math.min(baseDelay, retryConfig.maxDelay);

        // Add jitter to prevent thundering herd
        if (retryConfig.jitterEnabled) {
          const jitter = Math.random() * 0.1 * delay;
          delay += jitter;
        }

        console.log(`Network request failed (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}), retrying in ${delay}ms:`, lastError.message);

        // Wait before retrying
        await this.delay(delay);
      }
    }

    throw lastError!;
  }

  /**
   * Schedule automatic retry when network is restored
   */
  scheduleRetryOnConnection(
    id: string,
    fn: () => Promise<void>,
    config: Partial<NetworkRetryConfig> = {}
  ): void {
    // Clear existing retry if any
    this.clearScheduledRetry(id);

    if (this.isOnline()) {
      // Execute immediately if online
      fn().catch(error => {
        console.error(`Scheduled retry ${id} failed:`, error);
      });
      return;
    }

    // Wait for connection and then execute
    const unsubscribe = this.addListener((status) => {
      if (status.isOnline) {
        unsubscribe();
        this.clearScheduledRetry(id);
        
        // Add small delay to ensure connection is stable
        const timeoutId = setTimeout(() => {
          fn().catch(error => {
            console.error(`Scheduled retry ${id} failed:`, error);
          });
        }, 1000);
        
        this.retryTimeouts.set(id, timeoutId);
      }
    });
  }

  /**
   * Clear scheduled retry
   */
  clearScheduledRetry(id: string): void {
    const timeoutId = this.retryTimeouts.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.retryTimeouts.delete(id);
    }
  }

  /**
   * Get connection stability metrics
   */
  getConnectionStability(): {
    uptime: number; // percentage
    averageUptime: number; // in minutes
    disconnectionCount: number;
    lastDisconnection: number | null;
  } {
    if (this.connectionHistory.length === 0) {
      return {
        uptime: this.isOnline() ? 100 : 0,
        averageUptime: 0,
        disconnectionCount: 0,
        lastDisconnection: null,
      };
    }

    const now = Date.now();
    const timeWindow = 60 * 60 * 1000; // 1 hour
    const recentHistory = this.connectionHistory.filter(
      entry => now - entry.timestamp < timeWindow
    );

    if (recentHistory.length === 0) {
      return {
        uptime: this.isOnline() ? 100 : 0,
        averageUptime: 0,
        disconnectionCount: 0,
        lastDisconnection: null,
      };
    }

    // Calculate uptime percentage
    const onlineEntries = recentHistory.filter(entry => entry.isOnline);
    const uptime = (onlineEntries.length / recentHistory.length) * 100;

    // Count disconnections
    let disconnectionCount = 0;
    let lastDisconnection: number | null = null;
    
    for (let i = 1; i < recentHistory.length; i++) {
      if (recentHistory[i - 1].isOnline && !recentHistory[i].isOnline) {
        disconnectionCount++;
        lastDisconnection = recentHistory[i].timestamp;
      }
    }

    // Calculate average uptime duration
    let totalUptime = 0;
    let uptimeSegments = 0;
    let currentUptimeStart: number | null = null;

    for (const entry of recentHistory) {
      if (entry.isOnline && currentUptimeStart === null) {
        currentUptimeStart = entry.timestamp;
      } else if (!entry.isOnline && currentUptimeStart !== null) {
        totalUptime += entry.timestamp - currentUptimeStart;
        uptimeSegments++;
        currentUptimeStart = null;
      }
    }

    // Include current uptime if still online
    if (currentUptimeStart !== null && this.isOnline()) {
      totalUptime += now - currentUptimeStart;
      uptimeSegments++;
    }

    const averageUptime = uptimeSegments > 0 ? totalUptime / uptimeSegments / (60 * 1000) : 0;

    return {
      uptime,
      averageUptime,
      disconnectionCount,
      lastDisconnection,
    };
  }

  /**
   * Test network connectivity with a ping-like request
   */
  async testConnectivity(url: string = '/api/health'): Promise<{
    success: boolean;
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      return {
        success: response.ok,
        responseTime,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Get current network status from browser APIs
   */
  private getCurrentNetworkStatus(): NetworkStatus {
    if (typeof window === 'undefined') {
      return {
        isOnline: true,
        connectionType: 'unknown',
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
        saveData: false,
      };
    }

    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    return {
      isOnline: navigator.onLine,
      connectionType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || '4g',
      downlink: connection?.downlink || 10,
      rtt: connection?.rtt || 100,
      saveData: connection?.saveData || false,
    };
  }

  /**
   * Setup event listeners for network changes
   */
  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    const updateStatus = () => {
      const newStatus = this.getCurrentNetworkStatus();
      const wasOnline = this.currentStatus.isOnline;
      const isOnline = newStatus.isOnline;
      
      this.currentStatus = newStatus;
      
      // Record connection change in history
      if (wasOnline !== isOnline) {
        this.recordConnectionChange(isOnline);
      }
      
      // Notify listeners
      this.notifyListeners();
      
      // Log connection changes
      if (wasOnline && !isOnline) {
        console.log('Network connection lost');
      } else if (!wasOnline && isOnline) {
        console.log('Network connection restored');
      }
    };

    // Listen for online/offline events
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    // Listen for connection changes (if supported)
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (connection) {
      connection.addEventListener('change', updateStatus);
    }
  }

  /**
   * Start periodic connection monitoring
   */
  private startConnectionMonitoring(): void {
    // Periodically update network status
    setInterval(() => {
      const newStatus = this.getCurrentNetworkStatus();
      
      // Only update if something changed
      if (JSON.stringify(newStatus) !== JSON.stringify(this.currentStatus)) {
        this.currentStatus = newStatus;
        this.notifyListeners();
      }
    }, 5000); // Check every 5 seconds

    // Periodically test actual connectivity
    setInterval(async () => {
      if (this.isOnline()) {
        try {
          const result = await this.testConnectivity();
          if (!result.success && this.currentStatus.isOnline) {
            // Browser thinks we're online but we can't reach the server
            console.warn('Browser reports online but connectivity test failed');
          }
        } catch (error) {
          // Ignore connectivity test errors
        }
      }
    }, 30000); // Test every 30 seconds
  }

  /**
   * Record connection change in history
   */
  private recordConnectionChange(isOnline: boolean): void {
    this.connectionHistory.push({
      timestamp: Date.now(),
      isOnline,
    });

    // Limit history size
    if (this.connectionHistory.length > this.maxHistorySize) {
      this.connectionHistory = this.connectionHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.currentStatus);
      } catch (error) {
        console.error('Error in network status listener:', error);
      }
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    // Clear all retry timeouts
    for (const [id, timeoutId] of this.retryTimeouts) {
      clearTimeout(timeoutId);
    }
    this.retryTimeouts.clear();

    // Clear listeners
    this.listeners.clear();

    // Remove event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.setupEventListeners);
      window.removeEventListener('offline', this.setupEventListeners);
    }
  }
}

// Export singleton instance
export const networkStatusManager = NetworkStatusManager.getInstance();

// React hook for using network status
export function useNetworkStatus() {
  if (typeof window === 'undefined') {
    return {
      status: {
        isOnline: true,
        connectionType: 'unknown',
        effectiveType: '4g',
        downlink: 10,
        rtt: 100,
        saveData: false,
      } as NetworkStatus,
      isOnline: true,
      quality: {
        level: 'excellent' as const,
        score: 100,
        description: 'Excellent connection quality',
      },
      stability: {
        uptime: 100,
        averageUptime: 0,
        disconnectionCount: 0,
        lastDisconnection: null,
      },
      waitForConnection: async () => true,
      executeWithRetry: async <T>(fn: () => Promise<T>) => fn(),
      testConnectivity: async () => ({ success: true, responseTime: 0 }),
    };
  }

  const manager = NetworkStatusManager.getInstance();
  
  return {
    status: manager.getStatus(),
    isOnline: manager.isOnline(),
    quality: manager.getConnectionQuality(),
    stability: manager.getConnectionStability(),
    waitForConnection: (timeout?: number) => manager.waitForConnection(timeout),
    executeWithRetry: <T>(fn: () => Promise<T>, config?: Partial<NetworkRetryConfig>) => 
      manager.executeWithRetry(fn, config),
    testConnectivity: (url?: string) => manager.testConnectivity(url),
  };
}

// Convenience functions
export const isOnline = (): boolean => networkStatusManager.isOnline();

export const waitForConnection = (timeout?: number): Promise<boolean> => 
  networkStatusManager.waitForConnection(timeout);

export const executeWithRetry = <T>(
  fn: () => Promise<T>, 
  config?: Partial<NetworkRetryConfig>
): Promise<T> => networkStatusManager.executeWithRetry(fn, config);

export const getConnectionQuality = (): ConnectionQuality => 
  networkStatusManager.getConnectionQuality();