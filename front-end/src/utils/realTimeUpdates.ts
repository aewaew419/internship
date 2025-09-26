import { useEffect, useRef, useCallback, useState } from 'react';

// Configuration for real-time updates
export interface RealTimeUpdateConfig {
  // Automatic refresh interval in milliseconds
  refreshInterval: number;
  // Maximum number of consecutive failures before stopping auto-refresh
  maxFailures: number;
  // Whether to enable automatic refresh
  enableAutoRefresh: boolean;
  // Whether to refresh when window regains focus
  refreshOnFocus: boolean;
  // Whether to refresh when network comes back online
  refreshOnOnline: boolean;
  // Minimum time between refreshes to prevent spam
  minRefreshInterval: number;
}

// Default configuration
export const DEFAULT_REALTIME_CONFIG: RealTimeUpdateConfig = {
  refreshInterval: 30000, // 30 seconds
  maxFailures: 3,
  enableAutoRefresh: true,
  refreshOnFocus: true,
  refreshOnOnline: true,
  minRefreshInterval: 5000 // 5 seconds
};

// Data staleness indicator
export interface DataStalenessInfo {
  isStale: boolean;
  lastUpdateTime: Date | null;
  staleDuration: number; // in milliseconds
  failureCount: number;
  nextRefreshTime: Date | null;
}

// Real-time update hook return type
export interface RealTimeUpdateHook {
  // State
  isAutoRefreshing: boolean;
  stalenessInfo: DataStalenessInfo;
  lastManualRefresh: Date | null;
  
  // Methods
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
  triggerManualRefresh: () => Promise<void>;
  resetStaleness: () => void;
  
  // Configuration
  updateConfig: (newConfig: Partial<RealTimeUpdateConfig>) => void;
}

/**
 * Custom hook for managing real-time data updates and synchronization
 * @param refreshFunction Function to call for data refresh
 * @param config Configuration for real-time updates
 * @returns Real-time update management interface
 */
export const useRealTimeUpdates = (
  refreshFunction: () => Promise<void>,
  config: Partial<RealTimeUpdateConfig> = {}
): RealTimeUpdateHook => {
  const fullConfig = { ...DEFAULT_REALTIME_CONFIG, ...config };
  
  // State management
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(fullConfig.enableAutoRefresh);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [failureCount, setFailureCount] = useState(0);
  const [lastManualRefresh, setLastManualRefresh] = useState<Date | null>(null);
  const [currentConfig, setCurrentConfig] = useState(fullConfig);
  
  // Refs for managing intervals and preventing memory leaks
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastRefreshTimeRef = useRef<Date | null>(null);
  const isRefreshingRef = useRef(false);
  
  // Calculate staleness information
  const stalenessInfo: DataStalenessInfo = {
    isStale: lastUpdateTime ? 
      (Date.now() - lastUpdateTime.getTime()) > (currentConfig.refreshInterval * 1.5) : 
      true,
    lastUpdateTime,
    staleDuration: lastUpdateTime ? Date.now() - lastUpdateTime.getTime() : 0,
    failureCount,
    nextRefreshTime: isAutoRefreshing && intervalRef.current ? 
      new Date(Date.now() + currentConfig.refreshInterval) : 
      null
  };

  // Enhanced refresh function with failure tracking and concurrency control
  const performRefresh = useCallback(async (isManual: boolean = false) => {
    // Prevent concurrent refreshes
    if (isRefreshingRef.current) {
      return;
    }

    // Respect minimum refresh interval
    const now = new Date();
    if (lastRefreshTimeRef.current && 
        (now.getTime() - lastRefreshTimeRef.current.getTime()) < currentConfig.minRefreshInterval) {
      return;
    }

    isRefreshingRef.current = true;
    lastRefreshTimeRef.current = now;

    try {
      await refreshFunction();
      
      // Success - reset failure count and update timestamps
      setFailureCount(0);
      setLastUpdateTime(now);
      
      if (isManual) {
        setLastManualRefresh(now);
      }
    } catch (error) {
      // Failure - increment failure count
      setFailureCount(prev => prev + 1);
      
      // Stop auto-refresh if too many failures
      if (failureCount >= currentConfig.maxFailures - 1) {
        setIsAutoRefreshing(false);
      }
      
      console.warn('Real-time refresh failed:', error);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [refreshFunction, currentConfig, failureCount]);

  // Start automatic refresh
  const startAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    setIsAutoRefreshing(true);
    setFailureCount(0); // Reset failure count when manually starting
    
    intervalRef.current = setInterval(() => {
      performRefresh(false);
    }, currentConfig.refreshInterval);
  }, [performRefresh, currentConfig.refreshInterval]);

  // Stop automatic refresh
  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsAutoRefreshing(false);
  }, []);

  // Trigger manual refresh
  const triggerManualRefresh = useCallback(async () => {
    await performRefresh(true);
  }, [performRefresh]);

  // Reset staleness indicators
  const resetStaleness = useCallback(() => {
    setLastUpdateTime(new Date());
    setFailureCount(0);
  }, []);

  // Update configuration
  const updateConfig = useCallback((newConfig: Partial<RealTimeUpdateConfig>) => {
    setCurrentConfig(prev => ({ ...prev, ...newConfig }));
    
    // Restart auto-refresh if interval changed and currently running
    if (newConfig.refreshInterval && isAutoRefreshing) {
      stopAutoRefresh();
      setTimeout(() => startAutoRefresh(), 100);
    }
  }, [isAutoRefreshing, startAutoRefresh, stopAutoRefresh]);

  // Handle window focus events
  useEffect(() => {
    if (!currentConfig.refreshOnFocus) return;

    const handleFocus = () => {
      // Only refresh if data is stale
      if (stalenessInfo.isStale) {
        performRefresh(false);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [currentConfig.refreshOnFocus, performRefresh, stalenessInfo.isStale]);

  // Handle online/offline events
  useEffect(() => {
    if (!currentConfig.refreshOnOnline) return;

    const handleOnline = () => {
      // Refresh when coming back online
      performRefresh(false);
      
      // Restart auto-refresh if it was stopped due to failures
      if (!isAutoRefreshing && currentConfig.enableAutoRefresh) {
        startAutoRefresh();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [currentConfig.refreshOnOnline, currentConfig.enableAutoRefresh, performRefresh, isAutoRefreshing, startAutoRefresh]);

  // Initialize auto-refresh on mount
  useEffect(() => {
    if (currentConfig.enableAutoRefresh) {
      startAutoRefresh();
    }

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentConfig.enableAutoRefresh, startAutoRefresh]);

  return {
    // State
    isAutoRefreshing,
    stalenessInfo,
    lastManualRefresh,
    
    // Methods
    startAutoRefresh,
    stopAutoRefresh,
    triggerManualRefresh,
    resetStaleness,
    
    // Configuration
    updateConfig
  };
};

/**
 * Hook for managing concurrent data access and preventing data corruption
 * @param dataKey Unique key for the data being managed
 * @returns Concurrency control interface
 */
export const useConcurrencyControl = (dataKey: string) => {
  const lockRef = useRef<Set<string>>(new Set());
  
  const acquireLock = useCallback(async (operationId: string): Promise<boolean> => {
    if (lockRef.current.has(dataKey)) {
      return false; // Lock already held
    }
    
    lockRef.current.add(dataKey);
    return true;
  }, [dataKey]);
  
  const releaseLock = useCallback((operationId: string) => {
    lockRef.current.delete(dataKey);
  }, [dataKey]);
  
  const isLocked = useCallback((): boolean => {
    return lockRef.current.has(dataKey);
  }, [dataKey]);
  
  return {
    acquireLock,
    releaseLock,
    isLocked
  };
};

/**
 * Utility function to create a debounced refresh function
 * @param refreshFunction Original refresh function
 * @param delay Debounce delay in milliseconds
 * @returns Debounced refresh function
 */
export const createDebouncedRefresh = (
  refreshFunction: () => Promise<void>,
  delay: number = 1000
) => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return async () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    return new Promise<void>((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          await refreshFunction();
          resolve();
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  };
};