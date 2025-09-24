'use client';

import { useMediaQuery } from '@/hooks/useMediaQuery';
import { LoadingIndicator } from './AuthLoadingStates';

/**
 * Button loading state with text transitions
 */
export function ButtonLoadingState({
  isLoading,
  defaultText,
  loadingText = 'กำลังดำเนินการ...',
  successText,
  errorText,
  size = 'md',
}: {
  isLoading: boolean;
  defaultText: string;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const spinnerSizes = {
    sm: isMobile ? 'w-4 h-4' : 'w-3 h-3',
    md: isMobile ? 'w-5 h-5' : 'w-4 h-4',
    lg: isMobile ? 'w-6 h-6' : 'w-5 h-5',
    xl: isMobile ? 'w-7 h-7' : 'w-6 h-6',
  };

  if (isLoading) {
    return (
      <span className="inline-flex items-center space-x-2">
        <div 
          className={`animate-spin rounded-full border-2 border-white border-t-transparent ${spinnerSizes[size]}`}
          role="status"
          aria-label="กำลังโหลด"
        />
        <span>{loadingText}</span>
      </span>
    );
  }

  if (successText) {
    return (
      <span className="inline-flex items-center space-x-2">
        <svg className={spinnerSizes[size]} fill="currentColor" viewBox="0 0 20 20">
          <path 
            fillRule="evenodd" 
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
            clipRule="evenodd" 
          />
        </svg>
        <span>{successText}</span>
      </span>
    );
  }

  if (errorText) {
    return (
      <span className="inline-flex items-center space-x-2">
        <svg className={spinnerSizes[size]} fill="currentColor" viewBox="0 0 20 20">
          <path 
            fillRule="evenodd" 
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
            clipRule="evenodd" 
          />
        </svg>
        <span>{errorText}</span>
      </span>
    );
  }

  return <span>{defaultText}</span>;
}

/**
 * Full-screen loading overlay for authentication processes
 */
export function AuthLoadingOverlay({
  isVisible,
  message = 'กำลังเข้าสู่ระบบ...',
  progress,
}: {
  isVisible: boolean;
  message?: string;
  progress?: number;
}) {
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-white bg-opacity-95 flex items-center justify-center z-50">
      <div className="text-center space-y-6 max-w-sm mx-auto px-6">
        {/* Logo or Icon */}
        <div className={`bg-blue-100 rounded-full flex items-center justify-center mx-auto ${isMobile ? 'w-20 h-20' : 'w-16 h-16'}`}>
          <svg 
            className={`text-blue-600 ${isMobile ? 'w-10 h-10' : 'w-8 h-8'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
            />
          </svg>
        </div>

        {/* Loading indicator */}
        <LoadingIndicator size={isMobile ? 'lg' : 'md'} variant="spinner" />

        {/* Message */}
        <div className="space-y-2">
          <p className={`font-medium text-gray-900 ${isMobile ? 'text-lg' : 'text-base'}`}>
            {message}
          </p>
          
          {progress !== undefined && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}