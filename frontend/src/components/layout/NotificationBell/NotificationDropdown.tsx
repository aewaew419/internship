'use client';

import React, { forwardRef, useCallback } from 'react';
import { Bell, ExternalLink, MoreHorizontal, Eye } from 'lucide-react';
import { useNotificationActions, useNotificationUtils } from '../../../hooks/useNotifications';
import type { Notification } from '../../../types/notifications';

interface NotificationDropdownProps {
  notifications: Notification[];
  position?: 'left' | 'right' | 'center';
  onClose: () => void;
  className?: string;
  maxWidth?: number;
  showViewAll?: boolean;
  onViewAll?: () => void;
}

export const NotificationDropdown = forwardRef<HTMLDivElement, NotificationDropdownProps>(
  ({
    notifications,
    position = 'right',
    onClose,
    className = '',
    maxWidth = 384,
    showViewAll = true,
    onViewAll,
  }, ref) => {
    const { markAsRead } = useNotificationActions();
    const { formatNotificationTime, getNotificationAge } = useNotificationUtils();

    // Position classes
    const positionClasses = {
      left: 'left-0',
      right: 'right-0',
      center: 'left-1/2 transform -translate-x-1/2',
    };

    // Handle notification click
    const handleNotificationClick = useCallback(async (notification: Notification) => {
      // Mark as read if not already read
      if (!notification.isRead) {
        await markAsRead(notification.id);
      }

      // Navigate to notification URL
      if (notification.data?.url) {
        window.location.href = notification.data.url;
      } else if (notification.actions && notification.actions.length > 0) {
        const primaryAction = notification.actions[0];
        if (primaryAction.url) {
          window.location.href = primaryAction.url;
        }
      }

      onClose();
    }, [markAsRead, onClose]);

    // Handle view all click
    const handleViewAll = useCallback(() => {
      if (onViewAll) {
        onViewAll();
      }
      onClose();
    }, [onViewAll, onClose]);

    // Sanitize content
    const sanitizeContent = useCallback((content: string) => {
      return content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '');
    }, []);

    return (
      <div
        ref={ref}
        className={`
          ${positionClasses[position]}
          bg-white rounded-lg shadow-lg border border-gray-200
          overflow-hidden z-50
          ${className}
        `}
        style={{ width: maxWidth }}
        role="menu"
        aria-label="Recent notifications"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 flex items-center">
              <Bell className="h-4 w-4 mr-2" />
              Recent Notifications
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded"
              aria-label="Close notifications"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No recent notifications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors
                    ${!notification.isRead ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}
                  `}
                  onClick={() => handleNotificationClick(notification)}
                  role="menuitem"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNotificationClick(notification);
                    }
                  }}
                >
                  <div className="flex items-start space-x-3">
                    {/* Notification Icon/Avatar */}
                    <div className={`
                      flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs
                      ${notification.category === 'academic' ? 'bg-blue-100 text-blue-600' :
                        notification.category === 'administrative' ? 'bg-green-100 text-green-600' :
                        notification.category === 'system' ? 'bg-gray-100 text-gray-600' :
                        'bg-orange-100 text-orange-600'}
                    `}>
                      {notification.type === 'assignment_change' ? '📝' :
                       notification.type === 'grade_update' ? '📊' :
                       notification.type === 'schedule_reminder' ? '📅' :
                       notification.type === 'document_update' ? '📄' :
                       notification.type === 'deadline_reminder' ? '⏰' :
                       notification.type === 'evaluation_request' ? '⭐' :
                       notification.type === 'visit_scheduled' ? '🏢' :
                       '🔔'}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className={`
                            text-sm truncate
                            ${!notification.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}
                          `}>
                            {sanitizeContent(notification.title)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {sanitizeContent(notification.body)}
                          </p>
                        </div>

                        {/* Unread indicator */}
                        {!notification.isRead && (
                          <div className="flex-shrink-0 ml-2">
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          </div>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">
                          {getNotificationAge(notification)}
                        </span>

                        {/* Priority indicator */}
                        {notification.priority === 'high' && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            High
                          </span>
                        )}

                        {/* External link indicator */}
                        {(notification.data?.url || (notification.actions && notification.actions.length > 0)) && (
                          <ExternalLink className="h-3 w-3 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {showViewAll && notifications.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleViewAll}
              className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center"
            >
              <Eye className="h-4 w-4 mr-1" />
              View all notifications
            </button>
          </div>
        )}
      </div>
    );
  }
);

NotificationDropdown.displayName = 'NotificationDropdown';