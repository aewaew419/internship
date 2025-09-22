'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Check, 
  Trash2, 
  ExternalLink, 
  Clock, 
  AlertCircle, 
  Info, 
  CheckCircle,
  Calendar,
  FileText,
  User,
  Settings,
  MoreHorizontal
} from 'lucide-react';
import { useSwipeGesture } from '../../../hooks/useSwipeGesture';
import { useNotificationUtils } from '../../../hooks/useNotifications';
import { NotificationActions } from './NotificationActions';
import { useNotificationRouter } from '../NotificationRouter/NotificationRouter';
import type { Notification, NotificationType, NotificationCategory } from '../../../types/notifications';

interface NotificationItemProps {
  notification: Notification;
  onClick: (notification: Notification) => void;
  onMarkAsRead: (notificationId: string) => void;
  onDelete: (notificationId: string) => void;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
  enableSwipe?: boolean;
  isSelected?: boolean;
  selectionMode?: boolean;
}

// Icon mapping for notification types
const TYPE_ICONS: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  [NotificationType.ASSIGNMENT_CHANGE]: User,
  [NotificationType.GRADE_UPDATE]: CheckCircle,
  [NotificationType.SCHEDULE_REMINDER]: Calendar,
  [NotificationType.DOCUMENT_UPDATE]: FileText,
  [NotificationType.DEADLINE_REMINDER]: Clock,
  [NotificationType.SYSTEM_ANNOUNCEMENT]: Info,
  [NotificationType.EVALUATION_REQUEST]: AlertCircle,
  [NotificationType.VISIT_SCHEDULED]: Calendar,
};

// Color mapping for notification categories
const CATEGORY_COLORS: Record<NotificationCategory, string> = {
  [NotificationCategory.ACADEMIC]: 'text-blue-600 bg-blue-100',
  [NotificationCategory.ADMINISTRATIVE]: 'text-green-600 bg-green-100',
  [NotificationCategory.SYSTEM]: 'text-gray-600 bg-gray-100',
  [NotificationCategory.REMINDER]: 'text-orange-600 bg-orange-100',
};

// Priority colors
const PRIORITY_COLORS = {
  high: 'border-l-red-500',
  normal: 'border-l-blue-500',
  low: 'border-l-gray-300',
};

export function NotificationItem({
  notification,
  onClick,
  onMarkAsRead,
  onDelete,
  showActions = true,
  compact = false,
  className = '',
  enableSwipe = true,
  isSelected = false,
  selectionMode = false,
}: NotificationItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const { formatNotificationTime, isNotificationExpired } = useNotificationUtils();
  const { navigateToNotification } = useNotificationRouter();

  // Handle swipe gestures for mobile
  const { 
    swipeOffset, 
    isSwipeActive, 
    swipeDirection,
    resetSwipe 
  } = useSwipeGesture({
    element: itemRef.current,
    enabled: enableSwipe,
    threshold: 80,
    onSwipeLeft: () => handleDelete(),
    onSwipeRight: () => handleMarkAsRead(),
  });

  // Get appropriate icon for notification type
  const IconComponent = TYPE_ICONS[notification.type] || Info;
  
  // Get category colors
  const categoryColor = CATEGORY_COLORS[notification.category] || CATEGORY_COLORS[NotificationCategory.SYSTEM];
  
  // Get priority border color
  const priorityBorder = PRIORITY_COLORS[notification.priority];

  // Check if notification is expired
  const isExpired = isNotificationExpired(notification);

  // Handle click
  const handleClick = useCallback(async (event: React.MouseEvent) => {
    // Don't trigger click if clicking on action buttons
    if ((event.target as HTMLElement).closest('.notification-actions')) {
      return;
    }
    
    // If in selection mode, use the onClick prop
    if (selectionMode) {
      onClick(notification);
      return;
    }
    
    // Otherwise, navigate to the notification
    try {
      await navigateToNotification(notification.id);
    } catch (error) {
      console.error('Failed to navigate to notification:', error);
      // Fallback to the original onClick
      onClick(notification);
    }
  }, [onClick, notification, selectionMode, navigateToNotification]);

  // Handle mark as read
  const handleMarkAsRead = useCallback(async (event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    if (notification.isRead || isMarkingRead) return;
    
    setIsMarkingRead(true);
    try {
      await onMarkAsRead(notification.id);
    } finally {
      setIsMarkingRead(false);
      resetSwipe();
    }
  }, [notification.id, notification.isRead, onMarkAsRead, isMarkingRead, resetSwipe]);

  // Handle delete
  const handleDelete = useCallback(async (event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      await onDelete(notification.id);
    } finally {
      setIsDeleting(false);
      resetSwipe();
    }
  }, [notification.id, onDelete, isDeleting, resetSwipe]);

  // Handle action completion
  const handleActionComplete = useCallback((actionId: string, result: any) => {
    // Mark as read when action is completed
    if (!notification.isRead) {
      handleMarkAsRead();
    }
  }, [notification.isRead, handleMarkAsRead]);

  // Toggle menu
  const toggleMenu = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setShowMenu(!showMenu);
  }, [showMenu]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  // Sanitize notification content
  const sanitizeContent = useCallback((content: string) => {
    // Basic HTML sanitization - in production, use a proper sanitization library
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '');
  }, []);

  const baseClasses = `
    notification-item relative transition-all duration-200 cursor-pointer
    ${notification.isRead ? 'bg-white' : 'bg-blue-50'}
    ${compact ? 'p-3' : 'p-4'}
    ${priorityBorder ? `border-l-4 ${priorityBorder}` : ''}
    ${isExpired ? 'opacity-60' : ''}
    ${isSwipeActive ? 'transform transition-transform duration-200' : ''}
    ${isSelected ? 'bg-blue-100 border-blue-500' : 'hover:bg-gray-50'}
    ${selectionMode ? 'border-2' : ''}
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset
    ${className}
  `;

  const swipeStyle = isSwipeActive ? {
    transform: `translateX(${swipeOffset}px)`,
  } : {};

  return (
    <div className="relative">
      {/* Swipe action backgrounds */}
      {enableSwipe && (
        <>
          {/* Mark as read background (swipe right) */}
          <div className={`
            absolute inset-y-0 left-0 flex items-center justify-start pl-4 bg-green-500 text-white
            transition-opacity duration-200
            ${swipeDirection === 'right' && swipeOffset > 40 ? 'opacity-100' : 'opacity-0'}
          `}>
            <Check className="h-5 w-5" />
            <span className="ml-2 text-sm font-medium">Mark as read</span>
          </div>
          
          {/* Delete background (swipe left) */}
          <div className={`
            absolute inset-y-0 right-0 flex items-center justify-end pr-4 bg-red-500 text-white
            transition-opacity duration-200
            ${swipeDirection === 'left' && Math.abs(swipeOffset) > 40 ? 'opacity-100' : 'opacity-0'}
          `}>
            <span className="mr-2 text-sm font-medium">Delete</span>
            <Trash2 className="h-5 w-5" />
          </div>
        </>
      )}

      {/* Main notification item */}
      <div
        ref={itemRef}
        className={baseClasses}
        onClick={handleClick}
        style={swipeStyle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick(e as any);
          }
        }}
      >
        <div className="flex items-start space-x-3">
          {/* Selection checkbox or notification icon */}
          {selectionMode ? (
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onClick(notification)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ) : (
            <div className={`
              flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
              ${categoryColor}
            `}>
              <IconComponent className="h-5 w-5" />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className={`
                  text-sm font-medium truncate
                  ${notification.isRead ? 'text-gray-900' : 'text-gray-900 font-semibold'}
                `}>
                  {sanitizeContent(notification.title)}
                </h4>
                
                {/* Unread indicator */}
                {!notification.isRead && (
                  <div className="inline-flex items-center mt-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                    <span className="text-xs text-blue-600 font-medium">New</span>
                  </div>
                )}
              </div>

              {/* Actions menu */}
              {showActions && (
                <div className="notification-actions relative ml-2" ref={menuRef}>
                  <button
                    onClick={toggleMenu}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>

                  {/* Dropdown menu */}
                  {showMenu && (
                    <div className="absolute right-0 top-8 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
                      {!notification.isRead && (
                        <button
                          onClick={handleMarkAsRead}
                          disabled={isMarkingRead}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center disabled:opacity-50"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          {isMarkingRead ? 'Marking as read...' : 'Mark as read'}
                        </button>
                      )}
                      
                      <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {isDeleting ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Body */}
            {!compact && (
              <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                {sanitizeContent(notification.body)}
              </p>
            )}

            {/* Footer */}
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                <span>{formatNotificationTime(notification)}</span>
                
                {notification.priority === 'high' && (
                  <>
                    <span>•</span>
                    <span className="text-red-600 font-medium">High priority</span>
                  </>
                )}
                
                {isExpired && (
                  <>
                    <span>•</span>
                    <span className="text-orange-600">Expired</span>
                  </>
                )}
              </div>

              {/* Action buttons */}
              <div className="notification-actions">
                <NotificationActions
                  notification={notification}
                  onActionComplete={handleActionComplete}
                  compact={compact}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Loading overlays */}
        {(isDeleting || isMarkingRead) && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>{isDeleting ? 'Deleting...' : 'Marking as read...'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}