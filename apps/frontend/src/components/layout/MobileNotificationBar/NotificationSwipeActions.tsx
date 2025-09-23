'use client';

import React, { useCallback } from 'react';
import { useNotifications } from '../../../hooks/useNotifications';
import type { Notification } from '../../../types/notifications';

interface NotificationSwipeActionsProps {
  notification: Notification;
  onMarkAsRead?: () => void;
  onDelete?: () => void;
  onArchive?: () => void;
  onAction?: (actionId: string) => void;
}

export function NotificationSwipeActions({
  notification,
  onMarkAsRead,
  onDelete,
  onArchive,
  onAction,
}: NotificationSwipeActionsProps) {
  const { markAsRead, deleteNotification } = useNotifications();

  const handleMarkAsRead = useCallback(async () => {
    try {
      await markAsRead(notification.id);
      onMarkAsRead?.();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [markAsRead, notification.id, onMarkAsRead]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteNotification(notification.id);
      onDelete?.();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, [deleteNotification, notification.id, onDelete]);

  const handleArchive = useCallback(() => {
    // Archive functionality would be implemented when backend supports it
    onArchive?.();
  }, [onArchive]);

  const handleCustomAction = useCallback((actionId: string) => {
    onAction?.(actionId);
  }, [onAction]);

  return (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-b-lg border-t">
      {/* Left side actions */}
      <div className="flex gap-2">
        {!notification.isRead && (
          <button
            onClick={handleMarkAsRead}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Mark Read
          </button>
        )}
        
        <button
          onClick={handleArchive}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8l6 6 6-6" />
          </svg>
          Archive
        </button>
      </div>

      {/* Right side actions */}
      <div className="flex gap-2">
        {/* Custom notification actions */}
        {notification.actions?.slice(0, 2).map(action => (
          <button
            key={action.id}
            onClick={() => handleCustomAction(action.id)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200 transition-colors"
          >
            {action.icon && (
              <span className="w-3 h-3">{action.icon}</span>
            )}
            {action.title}
          </button>
        ))}
        
        <button
          onClick={handleDelete}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
}

// Swipe action indicators for visual feedback
export function SwipeActionIndicator({ 
  direction, 
  progress 
}: { 
  direction: 'left' | 'right'; 
  progress: number; 
}) {
  const isLeft = direction === 'left';
  const opacity = Math.min(progress / 80, 1);
  
  return (
    <div
      className={`absolute inset-y-0 ${isLeft ? 'right-0' : 'left-0'} w-20 flex items-center justify-center`}
      style={{ opacity }}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
        isLeft ? 'bg-green-500' : 'bg-red-500'
      }`}>
        {isLeft ? (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        )}
      </div>
    </div>
  );
}

// Hook for managing swipe actions
export function useNotificationSwipeActions(notification: Notification) {
  const { markAsRead, deleteNotification } = useNotifications();

  const actions = {
    markAsRead: useCallback(async () => {
      if (!notification.isRead) {
        await markAsRead(notification.id);
      }
    }, [markAsRead, notification.id, notification.isRead]),

    delete: useCallback(async () => {
      await deleteNotification(notification.id);
    }, [deleteNotification, notification.id]),

    archive: useCallback(() => {
      // Archive functionality - to be implemented when backend supports it
      console.log('Archive notification:', notification.id);
    }, [notification.id]),

    navigate: useCallback(() => {
      if (notification.actions && notification.actions.length > 0) {
        const primaryAction = notification.actions[0];
        if (primaryAction.url) {
          window.location.href = primaryAction.url;
        }
      }
    }, [notification.actions]),
  };

  return actions;
}