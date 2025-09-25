"use client";

import { ReactNode, useState, useCallback } from 'react';
import { useAuthErrorHandler } from '@/hooks/useAuthErrorHandler';
import { AuthErrorAlert } from '@/components/ui/AuthErrorAlert';
import { AuthErrorDialog } from '@/components/ui/AuthErrorDialog';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { AuthErrorContext } from '@/lib/auth/error-handler';

export interface EnhancedAuthFormProps {
  children: ReactNode;
  action: AuthErrorContext['action'];
  userType?: AuthErrorContext['userType'];
  onSubmit: (data: any) => Promise<any>;
  onSuccess?: (result: any) => void;
  onError?: (error: any) => void;
  showInlineErrors?: boolean;
  showErrorDialog?: boolean;
  maxRetries?: number;
  autoRetry?: boolean;
  className?: string;
}

/**
 * Enhanced authentication form wrapper with comprehensive error handling
 * Provides automatic error processing, retry logic, and user feedback
 */
export const EnhancedAuthForm = ({
  children,
  action,
  userType,
  onSubmit,
  onSuccess,
  onError,
  showInlineErrors = true,
  showErrorDialog = true,
  maxRetries = 3,
  autoRetry = false,
  className = '',
}: EnhancedAuthFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitData, setSubmitData] = useState<any>(null);

  const isMobile = useMediaQuery('(max-width: 768px)');

  const errorHandler = useAuthErrorHandler(
    { action, userType },
    {
      maxRetries,
      autoRetry,
      showErrorDialog,
      reportErrors: true,
      onError: (processedError) => {
        onError?.(processedError);
      },
      onRetry: (error, attempt) => {
        console.log(`Retrying ${action} (attempt ${attempt}):`, error.code);
      },
      onRecovery: (error, successful) => {
        console.log(`Recovery ${successful ? 'successful' : 'failed'} for:`, error.code);
      },
    }
  );

  /**
   * Handle form submission with error handling
   */
  const handleSubmit = useCallback(async (data: any) => {
    setIsSubmitting(true);
    setSubmitData(data);
    
    try {
      const result = await onSubmit(data);
      onSuccess?.(result);
      errorHandler.clearError();
      return result;
    } catch (error) {
      const processedError = await errorHandler.handleError(error);
      throw processedError;
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, onSuccess, errorHandler]);

  /**
   * Handle retry with the last submitted data
   */
  const handleRetry = useCallback(async () => {
    if (!submitData) return;
    
    return errorHandler.retry(async () => {
      const result = await onSubmit(submitData);
      onSuccess?.(result);
      return result;
    });
  }, [submitData, onSubmit, onSuccess, errorHandler]);

  /**
   * Handle user feedback submission
   */
  const handleFeedback = useCallback((feedback: string) => {
    if (errorHandler.currentError) {
      // Re-report the error with user feedback
      errorHandler.handleError(errorHandler.currentError.originalError, feedback);
    }
  }, [errorHandler]);

  return (
    <div className={className}>
      {/* Inline Error Alert */}
      {showInlineErrors && errorHandler.hasError && (
        <div className="mb-4">
          <AuthErrorAlert
            error={errorHandler.currentError}
            onRetry={errorHandler.canRetry ? handleRetry : undefined}
            onDismiss={errorHandler.clearError}
            onFeedback={handleFeedback}
            showRecoverySteps={!isMobile}
            compact={isMobile}
          />
        </div>
      )}

      {/* Form Content */}
      <div className="space-y-4">
        {typeof children === 'function' 
          ? (children as any)({
              handleSubmit,
              isSubmitting: isSubmitting || errorHandler.isRetrying,
              hasError: errorHandler.hasError,
              currentError: errorHandler.currentError,
              canRetry: errorHandler.canRetry,
              clearError: errorHandler.clearError,
            })
          : children
        }
      </div>

      {/* Error Dialog */}
      <AuthErrorDialog
        isOpen={errorHandler.shouldShowDialog}
        error={errorHandler.currentError}
        onClose={errorHandler.dismissErrorDialog}
        onRetry={errorHandler.canRetry ? handleRetry : undefined}
        onFeedback={handleFeedback}
      />

      {/* Loading Overlay for Retries */}
      {errorHandler.isRetrying && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm mx-4">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <div>
                <p className="font-medium text-gray-900">กำลังลองใหม่...</p>
                <p className="text-sm text-gray-600">
                  ครั้งที่ {errorHandler.retryCount + 1} จาก {maxRetries}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Retry Countdown */}
      {errorHandler.retryAfter && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border p-4 max-w-sm z-30">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-gray-900">
                สามารถลองใหม่ได้ในอีก
              </p>
              <p className="text-lg font-bold text-yellow-600">
                {Math.ceil(errorHandler.retryAfter)} วินาที
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Higher-order component for wrapping existing forms with error handling
 */
export function withAuthErrorHandling<T extends Record<string, any>>(
  WrappedComponent: React.ComponentType<T>,
  action: AuthErrorContext['action'],
  userType?: AuthErrorContext['userType']
) {
  return function EnhancedComponent(props: T & {
    onSubmit: (data: any) => Promise<any>;
    onSuccess?: (result: any) => void;
    onError?: (error: any) => void;
  }) {
    const { onSubmit, onSuccess, onError, ...restProps } = props;

    return (
      <EnhancedAuthForm
        action={action}
        userType={userType}
        onSubmit={onSubmit}
        onSuccess={onSuccess}
        onError={onError}
      >
        {({ handleSubmit, isSubmitting, hasError, currentError, clearError }) => (
          <WrappedComponent
            {...(restProps as T)}
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
            hasError={hasError}
            currentError={currentError}
            clearError={clearError}
          />
        )}
      </EnhancedAuthForm>
    );
  };
}

/**
 * Hook for form components to access error handling context
 */
export const useAuthFormContext = () => {
  // This would be provided by a context if needed
  // For now, components can use useAuthErrorHandler directly
  return {
    // Placeholder for future context implementation
  };
};