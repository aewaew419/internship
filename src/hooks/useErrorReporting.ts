import { useCallback, useContext, useEffect } from 'react';
import { errorReportingService, AuthError, ErrorReport } from '../services/errorReporting';

/**
 * Hook for error reporting and analytics in authentication components
 */
export const useErrorReporting = () => {
  /**
   * Log an authentication error
   */
  const logError = useCallback((error: Partial<AuthError>): string => {
    return errorReportingService.logError(error);
  }, []);

  /**
   * Log validation error
   */
  const logValidationError = useCallback((field: string, message: string, value?: string): string => {
    return logError({
      type: 'validation',
      code: `VALIDATION_${field.toUpperCase()}_ERROR`,
      message: `Validation failed for ${field}: ${message}`,
      context: { field, value }
    });
  }, [logError]);

  /**
   * Log authentication failure
   */
  const logAuthError = useCallback((code: string, message: string, userId?: string): string => {
    return logError({
      type: 'authentication',
      code,
      message,
      userId,
      context: { loginAttempt: true }
    });
  }, [logError]);

  /**
   * Log network error
   */
  const logNetworkError = useCallback((error: Error, endpoint?: string): string => {
    return logError({
      type: 'network',
      code: 'NETWORK_ERROR',
      message: error.message,
      stackTrace: error.stack,
      context: { endpoint }
    });
  }, [logError]);

  /**
   * Log system error
   */
  const logSystemError = useCallback((error: Error, component?: string): string => {
    return logError({
      type: 'system',
      code: 'SYSTEM_ERROR',
      message: error.message,
      stackTrace: error.stack,
      context: { component }
    });
  }, [logError]);

  /**
   * Report error with user feedback
   */
  const reportError = useCallback(async (
    errorId: string,
    userFeedback?: string,
    reproductionSteps?: string,
    severity: ErrorReport['severity'] = 'medium'
  ): Promise<void> => {
    try {
      await errorReportingService.reportError(errorId, userFeedback, reproductionSteps, severity);
    } catch (err) {
      console.error('Failed to report error:', err);
    }
  }, []);

  /**
   * Get analytics data
   */
  const getAnalytics = useCallback((timeRange: 'day' | 'week' | 'month' = 'week') => {
    return errorReportingService.getAnalytics(timeRange);
  }, []);

  /**
   * Get user-specific errors
   */
  const getUserErrors = useCallback((userId: string) => {
    return errorReportingService.getUserErrors(userId);
  }, []);

  /**
   * Mark error as resolved
   */
  const resolveError = useCallback((errorId: string) => {
    errorReportingService.resolveError(errorId);
  }, []);

  /**
   * Handle form errors with automatic logging
   */
  const handleFormError = useCallback((error: any, formType: 'login' | 'registration' | 'forgot-password') => {
    let errorId: string;

    if (error.response?.status === 401) {
      errorId = logAuthError('INVALID_CREDENTIALS', 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    } else if (error.response?.status === 403) {
      errorId = logAuthError('ACCESS_DENIED', 'ไม่มีสิทธิ์เข้าถึงระบบ');
    } else if (error.response?.status === 429) {
      errorId = logAuthError('RATE_LIMITED', 'พยายามเข้าสู่ระบบบ่อยเกินไป');
    } else if (error.code === 'NETWORK_ERROR') {
      errorId = logNetworkError(error, `/api/auth/${formType}`);
    } else {
      errorId = logSystemError(error, `${formType}-form`);
    }

    return errorId;
  }, [logAuthError, logNetworkError, logSystemError]);

  /**
   * Handle validation errors with automatic logging
   */
  const handleValidationError = useCallback((field: string, message: string, value?: string) => {
    return logValidationError(field, message, value);
  }, [logValidationError]);

  return {
    logError,
    logValidationError,
    logAuthError,
    logNetworkError,
    logSystemError,
    reportError,
    getAnalytics,
    getUserErrors,
    resolveError,
    handleFormError,
    handleValidationError
  };
};