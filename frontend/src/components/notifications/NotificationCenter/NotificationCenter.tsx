'use client';

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Search, Filter, X, RefreshCw, Settings, Bell, BellOff } from 'lucide-react';
import { useNotifications, useFilteredNotifications, useNotificationStats } from '../../../hooks/useNotifications';
import { NotificationList } from './NotificationList';
import { NotificationFilters } from './NotificationFilters';
import { NotificationSearch } from './NotificationSearch';
import { EmptyState } from './EmptyState';
import { LoadingState } from './LoadingState';
import type { NotificationType, NotificationCategory } from '../../../types/notifications';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  maxHeight?: number;
  showSearch?: boolean;
  showFilters?: boolean;
  className?: string;
  mobileFullScreen?: boolean;
}

export function NotificationCenter({
  isOpen,
  onClose,
  position = 'top-right',
  maxHeight = 600,
  showSearch = true,
  showFilters = true,
  className = '',
  mobileFullScreen = true,
}: NotificationCenterProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    hasMore,
    refreshNotifications,
    loadMoreNotifications,
    markAllAsRead,
    clearAll,
  } = useNotifications();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<NotificationType | undefined>();
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory | undefined>();
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter notifications based on current filters
  const filteredNotifications = useFilteredNotifications({
    type: selectedType,
    category: selectedCategory,
    unreadOnly: showUnreadOnly,
    search: searchQuery,
  });

  const stats = useNotificationStats();

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshNotifications();
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshNotifications]);

  // Handle mark all as read
  const handleMarkAllAsRead = useCallback(async () => {
    if (unreadCount > 0) {
      await markAllAsRead();
    }
  }, [markAllAsRead, unreadCount]);

  // Handle clear all
  const handleClearAll = useCallback(async () => {
    if (notifications.length > 0) {
      const confirmed = window.confirm('Are you sure you want to clear all notifications? This action cannot be undone.');
      if (confirmed) {
        await clearAll();
      }
    }
  }, [clearAll, notifications.length]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback((filters: {
    type?: NotificationType;
    category?: NotificationCategory;
    unreadOnly?: boolean;
  }) => {
    setSelectedType(filters.type);
    setSelectedCategory(filters.category);
    setShowUnreadOnly(filters.unreadOnly || false);
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedType(undefined);
    setSelectedCategory(undefined);
    setShowUnreadOnly(false);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case '/':
          if (showSearch && searchInputRef.current) {
            event.preventDefault();
            searchInputRef.current.focus();
          }
          break;
        case 'r':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleRefresh();
          }
          break;
        case 'a':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleMarkAllAsRead();
          }
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose, showSearch, handleRefresh, handleMarkAllAsRead]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Position classes
  const positionClasses = useMemo(() => {
    const baseClasses = 'fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200';
    
    switch (position) {
      case 'top-left':
        return `${baseClasses} top-16 left-4`;
      case 'top-right':
        return `${baseClasses} top-16 right-4`;
      case 'bottom-left':
        return `${baseClasses} bottom-4 left-4`;
      case 'bottom-right':
        return `${baseClasses} bottom-4 right-4`;
      case 'center':
        return `${baseClasses} top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2`;
      default:
        return `${baseClasses} top-16 right-4`;
    }
  }, [position]);

  // Mobile classes
  const mobileClasses = mobileFullScreen 
    ? 'md:w-96 md:max-h-[600px] w-full h-full md:h-auto inset-0 md:inset-auto md:relative md:rounded-lg rounded-none'
    : 'w-96 max-h-[600px]';

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedType) count++;
    if (selectedCategory) count++;
    if (showUnreadOnly) count++;
    if (searchQuery) count++;
    return count;
  }, [selectedType, selectedCategory, showUnreadOnly, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className={`${positionClasses} ${mobileClasses} ${className}`} ref={containerRef}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Notifications
          </h2>
          {unreadCount > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {unreadCount} new
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            title="Refresh notifications (Ctrl+R)"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Mark all as read button */}
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="Mark all as read (Ctrl+A)"
            >
              <BellOff className="h-4 w-4" />
            </button>
          )}

          {/* Filters toggle */}
          {showFilters && (
            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className={`p-1 transition-colors ${
                showFiltersPanel || activeFiltersCount > 0
                  ? 'text-blue-600 hover:text-blue-700'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              title="Toggle filters"
            >
              <Filter className="h-4 w-4" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-blue-600 rounded-full"></span>
              )}
            </button>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title="Close (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      {showSearch && (
        <div className="p-4 border-b border-gray-200">
          <NotificationSearch
            ref={searchInputRef}
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search notifications... (Press / to focus)"
          />
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && showFiltersPanel && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <NotificationFilters
            selectedType={selectedType}
            selectedCategory={selectedCategory}
            showUnreadOnly={showUnreadOnly}
            onChange={handleFilterChange}
            onClear={clearFilters}
            stats={stats}
          />
        </div>
      )}

      {/* Content */}
      <div 
        className="flex-1 overflow-hidden"
        style={{ maxHeight: maxHeight - 120 }} // Account for header and search
      >
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={handleRefresh}
                className="text-sm text-red-600 hover:text-red-700 underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {isLoading && notifications.length === 0 ? (
          <LoadingState />
        ) : filteredNotifications.length === 0 ? (
          <EmptyState
            hasNotifications={notifications.length > 0}
            hasActiveFilters={activeFiltersCount > 0}
            onClearFilters={clearFilters}
            onRefresh={handleRefresh}
          />
        ) : (
          <NotificationList
            notifications={filteredNotifications}
            hasMore={hasMore}
            isLoading={isLoading}
            onLoadMore={loadMoreNotifications}
            maxHeight={maxHeight - 120}
          />
        )}
      </div>

      {/* Footer Actions */}
      {notifications.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {filteredNotifications.length} of {notifications.length} notifications
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="ml-2 text-blue-600 hover:text-blue-700 underline"
                >
                  Clear filters
                </button>
              )}
            </div>
            
            <button
              onClick={handleClearAll}
              className="text-sm text-red-600 hover:text-red-700 underline"
            >
              Clear all
            </button>
          </div>
        </div>
      )}
    </div>
  );
}