"use client";

import { memo } from 'react';

export const LoginFormSkeleton = memo(() => {
  return (
    <div className="max-w-md mx-auto p-6 rounded-lg shadow-lg bg-white">
      {/* Logo skeleton */}
      <div className="text-center mb-6">
        <div className="mx-auto mb-4 h-16 w-16 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded w-32 mx-auto mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-48 mx-auto animate-pulse"></div>
      </div>

      {/* Form skeleton */}
      <div className="space-y-4">
        {/* Student ID field skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
        </div>

        {/* Password field skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
        </div>

        {/* Submit button skeleton */}
        <div className="h-12 bg-gray-200 rounded w-full animate-pulse mt-6"></div>

        {/* Forgot password link skeleton */}
        <div className="text-center">
          <div className="h-4 bg-gray-200 rounded w-24 mx-auto animate-pulse"></div>
        </div>
      </div>
    </div>
  );
});

LoginFormSkeleton.displayName = 'LoginFormSkeleton';