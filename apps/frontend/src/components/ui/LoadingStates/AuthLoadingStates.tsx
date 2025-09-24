'use client';

import React from 'react';

// Simple AuthLoadingStates component for demo
export const AuthLoadingStates: React.FC = () => {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-gray-600">กำลังโหลด...</span>
    </div>
  );
};

export const LoginLoadingState: React.FC = () => {
  return <AuthLoadingStates />;
};

export const RegisterLoadingState: React.FC = () => {
  return <AuthLoadingStates />;
};

export const ForgotPasswordLoadingState: React.FC = () => {
  return <AuthLoadingStates />;
};

export const SkeletonLoading: React.FC<{
  variant?: 'form' | 'input' | 'button' | 'card';
  count?: number;
  className?: string;
}> = ({ variant = 'form', count = 1, className = '' }) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`bg-gray-200 rounded ${
            variant === 'input' ? 'h-10 mb-2' :
            variant === 'button' ? 'h-10 w-24' :
            variant === 'card' ? 'h-32 mb-4' :
            'h-6 mb-2'
          }`}
        />
      ))}
    </div>
  );
};

// Additional exports for compatibility
export const FormSubmissionOverlay: React.FC<{
  isLoading?: boolean;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  className?: string;
}> = ({ isLoading = false, loadingText = 'กำลังดำเนินการ...', className = '' }) => {
  if (!isLoading) return null;
  
  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${className}`}>
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-700">{loadingText}</p>
        </div>
      </div>
    </div>
  );
};

export const FormLoadingState: React.FC<{
  isLoading?: boolean;
  loadingText?: string;
  variant?: string;
}> = ({ isLoading = false, loadingText = 'กำลังโหลด...', variant = 'inline' }) => {
  if (!isLoading) return null;
  
  return (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-gray-600">{loadingText}</span>
    </div>
  );
};

// Additional missing exports
export const InlineFieldLoading: React.FC<{
  isLoading?: boolean;
  isValidating?: boolean;
  hasError?: boolean;
  hasSuccess?: boolean;
  loadingText?: string;
  className?: string;
}> = ({ isLoading = false, loadingText = 'กำลังตรวจสอบ...', className = '' }) => {
  if (!isLoading) return null;
  
  return (
    <div className={`flex items-center space-x-2 mt-1 ${className}`}>
      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
      <span className="text-gray-500 text-xs">{loadingText}</span>
    </div>
  );
};

export const FormInitializationSkeleton: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded w-full mb-4"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
    </div>
  );
};

export const LoadingIndicator: React.FC<{
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  className?: string;
  message?: string;
}> = ({ size = 'md', variant = 'spinner', className = '', message }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      <div 
        className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`}
        role="status"
        aria-label="กำลังโหลด"
      />
      {message && (
        <p className="text-gray-600 text-center text-sm">
          {message}
        </p>
      )}
    </div>
  );
};

export default AuthLoadingStates;