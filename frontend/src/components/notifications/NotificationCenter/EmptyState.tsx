'use client';

import React from 'react';
import { Bell, BellOff, Search, Filter, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  hasNotifications: boolean;
  hasActiveFilters: boolean;
  onClearFilters?: () => void;
  onRefresh?: () => void;
  className?: string;
}

export function EmptyState({
  hasNotifications,
  hasActiveFilters,
  onClearFilters,
  onRefresh,
  className = '',
}: EmptyStateProps) {
  
  // Different empty states based on context
  if (hasActiveFilters) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Search className="h-8 w-8 text-gray-400" />
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No matching notifications
        </h3>
        
        <p className="text-gray-500 mb-6 max-w-sm">
          No notifications match your current filters. Try adjusting your search criteria or clearing the filters.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          {onClearFilters && (
            <button
              onClick={onClearFilters}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear filters
            </button>
          )}
          
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!hasNotifications) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Bell className="h-8 w-8 text-blue-600" />
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No notifications yet
        </h3>
        
        <p className="text-gray-500 mb-6 max-w-sm">
          You're all caught up! When you receive new notifications, they'll appear here.
        </p>
        
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Check for notifications
          </button>
        )}
        
        <div className="mt-8 text-xs text-gray-400">
          <p>💡 Tip: Enable push notifications to get notified instantly</p>
        </div>
      </div>
    );
  }

  // All notifications are read/filtered out
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <BellOff className="h-8 w-8 text-green-600" />
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        All caught up!
      </h3>
      
      <p className="text-gray-500 mb-6 max-w-sm">
        You've read all your notifications. New ones will appear here when they arrive.
      </p>
      
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Check for new notifications
        </button>
      )}
    </div>
  );
}