"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { AuthErrorHandler, type AuthErrorContext, type ProcessedAuthError } from '@/lib/auth/error-handler';
import { AuthErrorReporter } from '@/lib/auth/error-reporter';

export interface AuthErrorState {
  currentError: ProcessedAuthError | null;
  isRetrying: boolean;
  retryCount: number;
  canRetry: boolean;
  retryAfter: number | null;
  showErrorDialog: boolean;
  errorHistory: ProcessedAuthError[];
}

export interface AuthErrorHandlerOptions {
  maxRetries?: number;
  autoRetry?: boolean;
  showErrorDialog?: boolean;
  reportErrors?: boolean;
  onError?: (error: ProcessedAuthError) => void;
  onRetry?: (error: ProcessedAuthError, attempt: number) => void;
  onRecovery?: (error: ProcessedAuthError, successful: boolean) => void;
}

/**
 * Hook for comprehensive authentication error handling
 * Provides error processing, retry logic, and user feedback
 */
export const useAuthErrorHandler = (
  context: Omit<AuthErrorContext, 'attemptCount' | 'lastAttemptTime'>,
  options: AuthErrorHandlerOptions = {}
) => {
  const {
    maxRetries = 3,
    autoRetry = false,
    showErrorDialog = true,
    reportErrors = true,
    onError,
    onRetry,
    onRecovery,
  } = options;

  const [errorState, setErrorState] = useState<AuthErrorState>({
    currentError: null,
    isRetrying: false,
    retryCount: 0,
    canRetry: false,
    retryAfter: null,
    showErrorDialog: false,
    errorHistory: [],
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const attemptCountRef = useRef<number>(0);
  const lastAttemptTimeRef = useRef<Date | null>(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Handle an authentication error
   */
  const handleError = useCallback(async (
    error: any,
    userFeedback?: string
  ): Promise<ProcessedAuthError> => {
    attemptCountRef.current++;
    lastAttemptTimeRef.current = new Date();

    // Create enhanced context with attempt information
    const enhancedContext: AuthErrorContext = {
      ...context,
      attemptCount: attemptCountRef.current,
      lastAttemptTime: lastAttemptTimeRef.current,
      userAgent: navigator.userAgent,
    };

    // Process the error
    const processedError = AuthErrorHandler.processError(error, enhancedContext);

    // Update error state
    setErrorState(prev => ({
      ...prev,
      currentError: processedError,
      canRetry: AuthErrorHandler.isRetryable(processedError) && prev.retryCount < maxRetries,
      retryAfter: processedError.recovery.retryAfter || null,
      showErrorDialog: showErrorDialog && processedError.severity !== 'low',
      errorHistory: [processedError, ...prev.errorHistory.slice(0, 9)], // Keep last 10 errors
    }));

    // Report error if enabled
    if (reportErrors) {
      try {
        await AuthErrorReporter.reportError(processedError, userFeedback);
      } catch (reportingError) {
        console.warn('Failed to report error:', reportingError);
      }
    }

    // Call error callback
    onError?.(processedError);

    // Auto-retry if enabled and possible
    if (autoRetry && AuthErrorHandler.isRetryable(processedError) && errorState.retryCount < maxRetries) {
      const retryDelay = AuthErrorHandler.getRetryDelay(processedError);
      scheduleRetry(processedError, retryDelay);
    }

    return processedError;
  }, [context, maxRetries, autoRetry, showErrorDialog, reportErrors, onError, errorState.retryCount]);

  /**
   * Manually retry the last failed operation
   */
  const retry = useCallback(async (
    retryFunction: () => Promise<any>
  ): Promise<boolean> => {
    if (!errorState.currentError || !errorState.canRetry) {
      return false;
    }

    setErrorState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1,
    }));

    try {
      // Call retry callback
      onRetry?.(errorState.currentError, errorState.retryCount + 1);

      // Execute retry function
      await retryFunction();

      // Success - record recovery and clear error
      AuthErrorReporter.recordRecoveryAttempt(errorState.currentError.code, true);
      onRecovery?.(errorState.currentError, true);

      setErrorState(prev => ({
        ...prev,
        currentError: null,
        isRetrying: false,
        canRetry: false,
        retryAfter: null,
        showErrorDialog: false,
      }));

      // Reset attempt counter on successful retry
      attemptCountRef.current = 0;
      lastAttemptTimeRef.current = null;

      return true;
    } catch (retryError) {
      // Retry failed - handle the new error
      const newProcessedError = await handleError(retryError);
      
      // Record failed recovery
      AuthErrorReporter.recordRecoveryAttempt(errorState.currentError.code, false);
      onRecovery?.(errorState.currentError, false);

      setErrorState(prev => ({
        ...prev,
        isRetrying: false,
        currentError: newProcessedError,
        canRetry: AuthErrorHandler.isRetryable(newProcessedError) && prev.retryCount < maxRetries,
      }));

      return false;
    }
  }, [errorState, maxRetries, onRetry, onRecovery, handleError]);

  /**
   * Schedule automatic retry
   */
  const scheduleRetry = useCallback((
    error: ProcessedAuthError,
    delay: number
  ) => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }

    setErrorState(prev => ({
      ...prev,
      retryAfter: delay / 1000, // Convert to seconds
    }));

    // Start countdown
    const countdownInterval = setInterval(() => {
      setErrorState(prev => {
        if (prev.retryAfter && prev.retryAfter > 1) {
          return { ...prev, retryAfter: prev.retryAfter - 1 };
        } else {
          clearInterval(countdownInterval);
          return { ...prev, retryAfter: null };
        }
      });
    }, 1000);

    retryTimeoutRef.current = setTimeout(() => {
      clearInterval(countdownInterval);
      setErrorState(prev => ({
        ...prev,
        retryAfter: null,
      }));
      
      // Auto-retry would be triggered here if a retry function was provided
      // For now, we just clear the retry timer
    }, delay);
  }, []);

  /**
   * Clear current error
   */
  const clearError = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    setErrorState(prev => ({
      ...prev,
      currentError: null,
      isRetrying: false,
      canRetry: false,
      retryAfter: null,
      showErrorDialog: false,
    }));
  }, []);

  /**
   * Dismiss error dialog
   */
  const dismissErrorDialog = useCallback(() => {
    setErrorState(prev => ({
      ...prev,
      showErrorDialog: false,
    }));
  }, []);

  /**
   * Get formatted error for UI display
   */
  const getFormattedError = useCallback(() => {
    if (!errorState.currentError) return null;
    return AuthErrorHandler.formatForUI(errorState.currentError);
  }, [errorState.currentError]);

  /**
   * Check if specific error type occurred recently
   */
  const hasRecentError = useCallback((errorCode: string, withinMinutes: number = 5): boolean => {
    const cutoff = new Date();
    cutoff.setMinutes(cutoff.getMinutes() - withinMinutes);

    return errorState.errorHistory.some(error => 
      error.code === errorCode && 
      new Date(error.metadata.timestamp) >= cutoff
    );
  }, [errorState.errorHistory]);

  /**
   * Get error statistics for current session
   */
  const getErrorStats = useCallback(() => {
    const { errorHistory } = errorState;
    
    const stats = {
      totalErrors: errorHistory.length,
      errorsByCategory: {} as Record<string, number>,
      errorsBySeverity: {} as Record<string, number>,
      mostCommonError: null as string | null,
    };

    errorHistory.forEach(error => {
      stats.errorsByCategory[error.category] = (stats.errorsByCategory[error.category] || 0) + 1;
      stats.errorsBySeverity[error.severity] = (stats.errorsBySeverity[error.severity] || 0) + 1;
    });

    // Find most common error
    const errorCounts = errorHistory.reduce((acc, error) => {
      acc[error.code] = (acc[error.code] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCommon = Object.entries(errorCounts).sort(([,a], [,b]) => b - a)[0];
    stats.mostCommonError = mostCommon ? mostCommon[0] : null;

    return stats;
  }, [errorState.errorHistory]);

  /**
   * Reset error handler state
   */
  const reset = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    setErrorState({
      currentError: null,
      isRetrying: false,
      retryCount: 0,
      canRetry: false,
      retryAfter: null,
      showErrorDialog: false,
      errorHistory: [],
    });

    attemptCountRef.current = 0;
    lastAttemptTimeRef.current = null;
  }, []);

  return {
    // Error state
    ...errorState,
    
    // Error handling functions
    handleError,
    retry,
    clearError,
    dismissErrorDialog,
    reset,
    
    // Utility functions
    getFormattedError,
    hasRecentError,
    getErrorStats,
    
    // Computed properties
    hasError: !!errorState.currentError,
    isRetryable: errorState.canRetry && !errorState.isRetrying,
    shouldShowDialog: errorState.showErrorDialog && !!errorState.currentError,
  };
};

/**
 * Simplified hook for basic error handling
 */
export const useSimpleAuthErrorHandler = (action: AuthErrorContext['action']) => {
  const errorHandler = useAuthErrorHandler(
    { action },
    {
      maxRetries: 1,
      autoRetry: false,
      showErrorDialog: true,
      reportErrors: true,
    }
  );

  return {
    handleError: errorHandler.handleError,
    currentError: errorHandler.currentError,
    clearError: errorHandler.clearError,
    hasError: errorHandler.hasError,
    formattedError: errorHandler.getFormattedError(),
  };
};