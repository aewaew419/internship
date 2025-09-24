import { useState, useEffect, useCallback, useRef } from 'react';

interface OfflineDetectionConfig {
  pingEndpoint?: string;
  checkInterval?: number;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

interface OfflineDetectionState {
  isOnline: boolean;
  isChecking: boolean;
  lastChecked: Date | null;
  retryCount: number;
}

interface UseOfflineDetectionReturn extends OfflineDetectionState {
  checkConnection: () => Promise<boolean>;
  retry: () => void;
  resetRetryCount: () => void;
}

const DEFAULT_CONFIG: Required<OfflineDetectionConfig> = {
  pingEndpoint: '/api/health',
  checkInterval: 30000, // 30 seconds
  timeout: 5000, // 5 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
};

/**
 * Hook for detecting offline/online status with automatic retry mechanism
 * Uses navigator.onLine and ping endpoints for comprehensive detection
 */
export const useOfflineDetection = (
  config: OfflineDetectionConfig = {}
): UseOfflineDetectionReturn => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const { pingEndpoint, checkInterval, timeout, retryAttempts, retryDelay } = mergedConfig;

  const [state, setState] = useState<OfflineDetectionState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isChecking: false,
    lastChecked: null,
    retryCount: 0,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Ping the server to check actual connectivity
   */
  const pingServer = useCallback(async (): Promise<boolean> => {
    try {
      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      const timeoutId = setTimeout(() => {
        abortControllerRef.current?.abort();
      }, timeout);

      const response = await fetch(pingEndpoint, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: abortControllerRef.current.signal,
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      // Network error or timeout
      return false;
    }
  }, [pingEndpoint, timeout]);

  /**
   * Check connection status using both navigator.onLine and server ping
   */
  const checkConnection = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isChecking: true }));

    try {
      // First check navigator.onLine for quick offline detection
      const navigatorOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      
      if (!navigatorOnline) {
        setState(prev => ({
          ...prev,
          isOnline: false,
          isChecking: false,
          lastChecked: new Date(),
        }));
        return false;
      }

      // If navigator says we're online, verify with server ping
      const serverReachable = await pingServer();
      
      setState(prev => ({
        ...prev,
        isOnline: serverReachable,
        isChecking: false,
        lastChecked: new Date(),
        retryCount: serverReachable ? 0 : prev.retryCount,
      }));

      return serverReachable;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isOnline: false,
        isChecking: false,
        lastChecked: new Date(),
      }));
      return false;
    }
  }, [pingServer]);

  /**
   * Retry connection check with exponential backoff
   */
  const retry = useCallback(() => {
    if (state.retryCount >= retryAttempts) {
      return;
    }

    setState(prev => ({ ...prev, retryCount: prev.retryCount + 1 }));

    const delay = retryDelay * Math.pow(2, state.retryCount);
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    retryTimeoutRef.current = setTimeout(() => {
      checkConnection();
    }, delay);
  }, [state.retryCount, retryAttempts, retryDelay, checkConnection]);

  /**
   * Reset retry count
   */
  const resetRetryCount = useCallback(() => {
    setState(prev => ({ ...prev, retryCount: 0 }));
  }, []);

  /**
   * Handle online/offline events from navigator
   */
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true, retryCount: 0 }));
      // Verify with server when coming back online
      checkConnection();
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, [checkConnection]);

  /**
   * Set up periodic connection checking
   */
  useEffect(() => {
    // Initial check
    checkConnection();

    // Set up interval for periodic checks
    intervalRef.current = setInterval(() => {
      if (!state.isChecking) {
        checkConnection();
      }
    }, checkInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [checkConnection, checkInterval, state.isChecking]);

  /**
   * Automatic retry when offline
   */
  useEffect(() => {
    if (!state.isOnline && state.retryCount < retryAttempts) {
      const retryTimeout = setTimeout(() => {
        retry();
      }, retryDelay * Math.pow(2, state.retryCount));

      return () => clearTimeout(retryTimeout);
    }
  }, [state.isOnline, state.retryCount, retryAttempts, retryDelay, retry]);

  return {
    ...state,
    checkConnection,
    retry,
    resetRetryCount,
  };
};

export default useOfflineDetection;