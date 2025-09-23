'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  className?: string;
  message?: string;
  showSpinner?: boolean;
  itemCount?: number;
}

// Individual skeleton item for loading state
function SkeletonItem() {
  return (
    <div className="p-4 border-b border-gray-200 animate-pulse">
      <div className="flex items-start space-x-3">
        {/* Avatar skeleton */}
        <div className="w-10 h-10 bg-gray-200 rounded-full flex-shrink-0"></div>
        
        <div className="flex-1 min-w-0">
          {/* Title skeleton */}
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          
          {/* Content skeleton */}
          <div className="space-y-1">
            <div className="h-3 bg-gray-200 rounded w-full"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
          
          {/* Meta info skeleton */}
          <div className="flex items-center justify-between mt-3">
            <div className="h-3 bg-gray-200 rounded w-20"></div>
            <div className="flex space-x-2">
              <div className="h-6 w-16 bg-gray-200 rounded"></div>
              <div className="h-6 w-16 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoadingState({
  className = '',
  message = 'Loading notifications...',
  showSpinner = true,
  itemCount = 5,
}: LoadingStateProps) {
  
  return (
    <div className={`notification-loading-state ${className}`}>
      {showSpinner && (
        <div className="flex items-center justify-center p-6 border-b border-gray-200">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600 mr-2" />
          <span className="text-sm text-gray-600">{message}</span>
        </div>
      )}
      
      {/* Skeleton items */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: itemCount }, (_, index) => (
          <SkeletonItem key={index} />
        ))}
      </div>
    </div>
  );
}

// Alternative compact loading state
export function CompactLoadingState({
  className = '',
  message = 'Loading...',
}: {
  className?: string;
  message?: string;
}) {
  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-3" />
      <span className="text-gray-600">{message}</span>
    </div>
  );
}

// Loading state for individual items
export function ItemLoadingState({ className = '' }: { className?: string }) {
  return (
    <div className={`p-4 border-b border-gray-200 ${className}`}>
      <div className="animate-pulse">
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0"></div>
          <div className="flex-1 min-w-0">
            <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    </div>
  );
}