'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Check, 
  Trash2, 
  Archive, 
  X, 
  AlertTriangle,
  CheckSquare,
  Square,
  Loader2
} from 'lucide-react';
import { useNotifications } from '../../../hooks/useNotifications';
import type { Notification, BulkNotificationOperation, BulkOperationResult } from '../../../types/notifications';

interface BulkNotificationActionsProps {
  notifications: Notification[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onBulkOperationComplete?: (operation: string, result: BulkOperationResult) => void;
  className?: string;
}

interface BulkAction {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  requiresConfirmation: boolean;
  confirmationTitle: string;
  confirmationMessage: string;
  operation: BulkNotificationOperation['operation'];
}

export function BulkNotificationActions({
  notifications,
  selectedIds,
  onSelectionChange,
  onBulkOperationComplete,
  className = '',
}: BulkNotificationActionsProps) {
  const { bulkMarkAsRead, bulkDelete, bulkArchive } = useNotifications();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<string | null>(null);

  // Define bulk actions
  const bulkActions: BulkAction[] = useMemo(() => [
    {
      id: 'mark_read',
      title: 'Mark as Read',
      icon: Check,
      variant: 'success',
      requiresConfirmation: false,
      confirmationTitle: 'Mark as Read',
      confirmationMessage: '',
      operation: 'mark_read'
    },
    {
      id: 'archive',
      title: 'Archive',
      icon: Archive,
      variant: 'secondary',
      requiresConfirmation: true,
      confirmationTitle: 'Archive Notifications',
      confirmationMessage: 'Are you sure you want to archive the selected notifications? Archived notifications can be restored later.',
      operation: 'archive'
    },
    {
      id: 'delete',
      title: 'Delete',
      icon: Trash2,
      variant: 'danger',
      requiresConfirmation: true,
      confirmationTitle: 'Delete Notifications',
      confirmationMessage: 'Are you sure you want to permanently delete the selected notifications? This action cannot be undone.',
      operation: 'delete'
    }
  ], []);

  // Get selected notifications
  const selectedNotifications = useMemo(() => 
    notifications.filter(n => selectedIds.includes(n.id)),
    [notifications, selectedIds]
  );

  // Get unread selected notifications
  const unreadSelectedNotifications = useMemo(() => 
    selectedNotifications.filter(n => !n.isRead),
    [selectedNotifications]
  );

  // Check if all notifications are selected
  const isAllSelected = useMemo(() => 
    notifications.length > 0 && selectedIds.length === notifications.length,
    [notifications.length, selectedIds.length]
  );

  // Check if some notifications are selected
  const isSomeSelected = useMemo(() => 
    selectedIds.length > 0 && selectedIds.length < notifications.length,
    [selectedIds.length, notifications.length]
  );

  // Handle select all toggle
  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(notifications.map(n => n.id));
    }
  }, [isAllSelected, notifications, onSelectionChange]);

  // Handle bulk action execution
  const handleBulkAction = useCallback(async (action: BulkAction) => {
    if (selectedIds.length === 0) return;

    if (action.requiresConfirmation) {
      setShowConfirmDialog(action.id);
      return;
    }

    await executeBulkAction(action);
  }, [selectedIds.length]);

  // Execute bulk action
  const executeBulkAction = useCallback(async (action: BulkAction) => {
    try {
      setIsProcessing(action.id);
      setShowConfirmDialog(null);

      let result: BulkOperationResult;

      switch (action.operation) {
        case 'mark_read':
          result = await bulkMarkAsRead(selectedIds);
          break;
        case 'archive':
          result = await bulkArchive(selectedIds);
          break;
        case 'delete':
          result = await bulkDelete(selectedIds);
          break;
        default:
          throw new Error(`Unknown operation: ${action.operation}`);
      }

      // Clear selection after successful operation
      if (result.success) {
        onSelectionChange([]);
      }

      onBulkOperationComplete?.(action.operation, result);

      // Show success message
      if (result.success) {
        const message = `Successfully ${action.operation === 'mark_read' ? 'marked as read' : action.operation + 'd'} ${result.processedCount} notification${result.processedCount !== 1 ? 's' : ''}`;
        // You could show a toast notification here
        console.log(message);
      } else if (result.failedIds && result.failedIds.length > 0) {
        const message = `Failed to process ${result.failedIds.length} notification${result.failedIds.length !== 1 ? 's' : ''}`;
        console.warn(message);
      }

    } catch (error) {
      console.error(`Error executing bulk ${action.operation}:`, error);
      // You could show an error toast here
    } finally {
      setIsProcessing(null);
    }
  }, [selectedIds, bulkMarkAsRead, bulkArchive, bulkDelete, onSelectionChange, onBulkOperationComplete]);

  // Handle confirmation
  const handleConfirmAction = useCallback(async (actionId: string) => {
    const action = bulkActions.find(a => a.id === actionId);
    if (action) {
      await executeBulkAction(action);
    }
  }, [bulkActions, executeBulkAction]);

  // Get variant classes
  const getVariantClasses = useCallback((variant: BulkAction['variant']) => {
    switch (variant) {
      case 'primary':
        return 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600';
      case 'success':
        return 'bg-green-600 hover:bg-green-700 text-white border-green-600';
      case 'warning':
        return 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white border-red-600';
      case 'secondary':
      default:
        return 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300';
    }
  }, []);

  // Filter available actions based on selection
  const availableActions = useMemo(() => {
    return bulkActions.filter(action => {
      switch (action.operation) {
        case 'mark_read':
          // Only show mark as read if there are unread notifications selected
          return unreadSelectedNotifications.length > 0;
        case 'archive':
        case 'delete':
          // Always available when notifications are selected
          return selectedIds.length > 0;
        default:
          return true;
      }
    });
  }, [bulkActions, unreadSelectedNotifications.length, selectedIds.length]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <>
      <div className={`flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200 ${className}`}>
        {/* Selection controls */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleSelectAll}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
          >
            {isAllSelected ? (
              <CheckSquare className="h-4 w-4" />
            ) : isSomeSelected ? (
              <div className="h-4 w-4 border-2 border-gray-400 bg-gray-400 rounded-sm flex items-center justify-center">
                <div className="h-2 w-2 bg-white rounded-sm" />
              </div>
            ) : (
              <Square className="h-4 w-4" />
            )}
            <span>
              {selectedIds.length === 0 
                ? 'Select all' 
                : `${selectedIds.length} selected`
              }
            </span>
          </button>

          {selectedIds.length > 0 && (
            <button
              onClick={() => onSelectionChange([])}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear selection
            </button>
          )}
        </div>

        {/* Bulk actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center space-x-2">
            {availableActions.map((action) => {
              const IconComponent = action.icon;
              const isLoading = isProcessing === action.id;
              
              return (
                <button
                  key={action.id}
                  onClick={() => handleBulkAction(action)}
                  disabled={isLoading || !!isProcessing}
                  className={`
                    inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md border
                    transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${getVariantClasses(action.variant)}
                  `}
                  title={action.title}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <IconComponent className="h-4 w-4 mr-1" />
                  )}
                  {action.title}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-orange-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">
                {bulkActions.find(a => a.id === showConfirmDialog)?.confirmationTitle}
              </h3>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                {bulkActions.find(a => a.id === showConfirmDialog)?.confirmationMessage}
              </p>
              <p className="text-sm text-gray-500">
                This will affect {selectedIds.length} notification{selectedIds.length !== 1 ? 's' : ''}.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmDialog(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmAction(showConfirmDialog)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}