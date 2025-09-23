'use client';

import React, { useCallback } from 'react';
import { X, Filter } from 'lucide-react';
import { NotificationType, NotificationCategory } from '../../../types/notifications';
import type { NotificationStats } from '../../../types/notifications';

interface NotificationFiltersProps {
  selectedType?: NotificationType;
  selectedCategory?: NotificationCategory;
  showUnreadOnly: boolean;
  onChange: (filters: {
    type?: NotificationType;
    category?: NotificationCategory;
    unreadOnly?: boolean;
  }) => void;
  onClear: () => void;
  stats: NotificationStats;
  className?: string;
}

// Notification type display names
const TYPE_LABELS: Record<NotificationType, string> = {
  [NotificationType.ASSIGNMENT_CHANGE]: 'Assignment Changes',
  [NotificationType.GRADE_UPDATE]: 'Grade Updates',
  [NotificationType.SCHEDULE_REMINDER]: 'Schedule Reminders',
  [NotificationType.DOCUMENT_UPDATE]: 'Document Updates',
  [NotificationType.DEADLINE_REMINDER]: 'Deadline Reminders',
  [NotificationType.SYSTEM_ANNOUNCEMENT]: 'System Announcements',
  [NotificationType.EVALUATION_REQUEST]: 'Evaluation Requests',
  [NotificationType.VISIT_SCHEDULED]: 'Visit Scheduled',
};

// Notification category display names
const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  [NotificationCategory.ACADEMIC]: 'Academic',
  [NotificationCategory.ADMINISTRATIVE]: 'Administrative',
  [NotificationCategory.SYSTEM]: 'System',
  [NotificationCategory.REMINDER]: 'Reminders',
};

export function NotificationFilters({
  selectedType,
  selectedCategory,
  showUnreadOnly,
  onChange,
  onClear,
  stats,
  className = '',
}: NotificationFiltersProps) {
  
  const handleTypeChange = useCallback((type: NotificationType | undefined) => {
    onChange({
      type,
      category: selectedCategory,
      unreadOnly: showUnreadOnly,
    });
  }, [onChange, selectedCategory, showUnreadOnly]);

  const handleCategoryChange = useCallback((category: NotificationCategory | undefined) => {
    onChange({
      type: selectedType,
      category,
      unreadOnly: showUnreadOnly,
    });
  }, [onChange, selectedType, showUnreadOnly]);

  const handleUnreadToggle = useCallback(() => {
    onChange({
      type: selectedType,
      category: selectedCategory,
      unreadOnly: !showUnreadOnly,
    });
  }, [onChange, selectedType, selectedCategory, showUnreadOnly]);

  const hasActiveFilters = selectedType || selectedCategory || showUnreadOnly;

  return (
    <div className={`notification-filters ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-900">Filters</h3>
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <X className="h-3 w-3" />
            <span>Clear all</span>
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Unread Only Toggle */}
        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showUnreadOnly}
              onChange={handleUnreadToggle}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Unread only</span>
          </label>
          <span className="text-xs text-gray-500">
            {stats.unread} unread
          </span>
        </div>

        {/* Notification Types */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Type
          </h4>
          <div className="space-y-1">
            <button
              onClick={() => handleTypeChange(undefined)}
              className={`w-full text-left px-2 py-1 text-sm rounded transition-colors ${
                !selectedType
                  ? 'bg-blue-100 text-blue-800'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              All types ({stats.total})
            </button>
            
            {Object.entries(TYPE_LABELS).map(([type, label]) => {
              const count = stats.byType[type as NotificationType] || 0;
              if (count === 0) return null;
              
              return (
                <button
                  key={type}
                  onClick={() => handleTypeChange(type as NotificationType)}
                  className={`w-full text-left px-2 py-1 text-sm rounded transition-colors flex items-center justify-between ${
                    selectedType === type
                      ? 'bg-blue-100 text-blue-800'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{label}</span>
                  <span className="text-xs text-gray-500">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Notification Categories */}
        <div>
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Category
          </h4>
          <div className="space-y-1">
            <button
              onClick={() => handleCategoryChange(undefined)}
              className={`w-full text-left px-2 py-1 text-sm rounded transition-colors ${
                !selectedCategory
                  ? 'bg-blue-100 text-blue-800'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              All categories ({stats.total})
            </button>
            
            {Object.entries(CATEGORY_LABELS).map(([category, label]) => {
              const count = stats.byCategory[category as NotificationCategory] || 0;
              if (count === 0) return null;
              
              return (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category as NotificationCategory)}
                  className={`w-full text-left px-2 py-1 text-sm rounded transition-colors flex items-center justify-between ${
                    selectedCategory === category
                      ? 'bg-blue-100 text-blue-800'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>{label}</span>
                  <span className="text-xs text-gray-500">{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="pt-2 border-t border-gray-200">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Quick Stats
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="font-medium text-gray-900">{stats.todayCount}</div>
              <div className="text-gray-500">Today</div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded">
              <div className="font-medium text-gray-900">{stats.weekCount}</div>
              <div className="text-gray-500">This week</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}