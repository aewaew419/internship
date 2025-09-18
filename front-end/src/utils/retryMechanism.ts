// Retry configuration interface
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: any) => boolean;
}

// Default retry configuration
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
  retryCondition: (error: any) => {
    // Retry on network errors, timeouts, and 5xx server errors
    if (!error.response) return true; // Network error
    const status = error.response.status;
    return status >= 500 || status === 408; // Server errors or timeout
  }
};

// Sleep utility function
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

// Calculate delay with exponential backoff
const calculateDelay = (attempt: number, config: RetryConfig): number => {
  const delay = config.baseDelay * Math.pow(config.backoffFactor, attempt - 1);
  return Math.min(delay, config.maxDelay);
};

// Main retry function with exponential backoff
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // If this is the last attempt, throw the error
      if (attempt > config.maxRetries) {
        throw error;
      }
      
      // Check if we should retry this error
      if (config.retryCondition && !config.retryCondition(error)) {
        throw error;
      }
      
      // Calculate delay and wait
      const delay = calculateDelay(attempt, config);
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

// Specialized retry function for API calls
export async function retryApiCall<T>(
  apiCall: () => Promise<T>,
  customConfig?: Partial<RetryConfig>
): Promise<T> {
  const config = { ...DEFAULT_RETRY_CONFIG, ...customConfig };
  
  return retryWithBackoff(apiCall, {
    ...config,
    retryCondition: (error: any) => {
      // Don't retry on authentication errors (401, 403)
      if (error.response?.status === 401 || error.response?.status === 403) {
        return false;
      }
      
      // Don't retry on client errors (4xx) except timeout (408)
      if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 408) {
        return false;
      }
      
      // Retry on network errors and server errors
      return !error.response || error.response.status >= 500 || error.response.status === 408;
    }
  });
}

// Hook for managing retry state
export interface RetryState {
  isRetrying: boolean;
  retryCount: number;
  lastError: Error | null;
}

export const useRetryState = () => {
  const [retryState, setRetryState] = React.useState<RetryState>({
    isRetrying: false,
    retryCount: 0,
    lastError: null
  });

  const startRetry = (error: Error) => {
    setRetryState(prev => ({
      isRetrying: true,
      retryCount: prev.retryCount + 1,
      lastError: error
    }));
  };

  const endRetry = (success: boolean) => {
    setRetryState(prev => ({
      isRetrying: false,
      retryCount: success ? 0 : prev.retryCount,
      lastError: success ? null : prev.lastError
    }));
  };

  const resetRetry = () => {
    setRetryState({
      isRetrying: false,
      retryCount: 0,
      lastError: null
    });
  };

  return {
    retryState,
    startRetry,
    endRetry,
    resetRetry
  };
};

// React import for the hook
import React from 'react';