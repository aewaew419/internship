'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { 
  Eye, 
  CheckCircle, 
  X, 
  Upload, 
  Calendar, 
  FileText, 
  User, 
  AlertTriangle,
  ExternalLink,
  Clock,
  MessageSquare,
  Settings
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import type { Notification, NotificationType } from '../../../types/notifications';

interface NotificationActionsProps {
  notification: Notification;
  onActionComplete?: (actionId: string, result: any) => void;
  compact?: boolean;
  showConfirmation?: boolean;
}

interface ActionConfig {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
  url?: string;
  action?: () => void | Promise<void>;
  roles?: string[];
}

export function NotificationActions({
  notification,
  onActionComplete,
  compact = false,
  showConfirmation = true,
}: NotificationActionsProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<string | null>(null);

  // Get user roles
  const userRoles = useMemo(() => {
    if (!user?.roles) return [];
    return user.roles.list || [];
  }, [user?.roles]);

  // Define role-based actions for different notification types
  const getActionsForNotification = useCallback((notification: Notification): ActionConfig[] => {
    const actions: ActionConfig[] = [];

    switch (notification.type) {
      case NotificationType.EVALUATION_REQUEST:
        if (userRoles.includes('instructor') || userRoles.includes('visitor')) {
          actions.push({
            id: 'evaluate',
            title: 'Evaluate',
            icon: CheckCircle,
            variant: 'primary',
            url: `/evaluate/company?notificationId=${notification.id}`,
            roles: ['instructor', 'visitor']
          });
        }
        actions.push({
          id: 'view_details',
          title: 'View Details',
          icon: Eye,
          variant: 'secondary',
          url: `/evaluate/company?notificationId=${notification.id}`
        });
        break;

      case NotificationType.ASSIGNMENT_CHANGE:
        if (userRoles.includes('instructor')) {
          actions.push({
            id: 'review_assignment',
            title: 'Review Assignment',
            icon: User,
            variant: 'primary',
            url: `/instructor/assign-visitor?notificationId=${notification.id}`,
            roles: ['instructor']
          });
        }
        if (userRoles.includes('student')) {
          actions.push({
            id: 'view_assignment',
            title: 'View Assignment',
            icon: Eye,
            variant: 'secondary',
            url: `/dashboard?tab=assignments&notificationId=${notification.id}`,
            roles: ['student']
          });
        }
        break;

      case NotificationType.DOCUMENT_UPDATE:
        if (userRoles.includes('student')) {
          actions.push({
            id: 'upload_document',
            title: 'Upload Document',
            icon: Upload,
            variant: 'primary',
            url: `/documents/upload?notificationId=${notification.id}`,
            roles: ['student']
          });
        }
        actions.push({
          id: 'view_documents',
          title: 'View Documents',
          icon: FileText,
          variant: 'secondary',
          url: `/documents?notificationId=${notification.id}`
        });
        break;

      case NotificationType.SCHEDULE_REMINDER:
        if (userRoles.includes('visitor')) {
          actions.push({
            id: 'confirm_visit',
            title: 'Confirm Visit',
            icon: CheckCircle,
            variant: 'success',
            requiresConfirmation: true,
            confirmationMessage: 'Are you sure you want to confirm this visit?',
            action: () => handleConfirmVisit(notification),
            roles: ['visitor']
          });
        }
        actions.push({
          id: 'view_schedule',
          title: 'View Schedule',
          icon: Calendar,
          variant: 'secondary',
          url: `/visitor?tab=schedule&notificationId=${notification.id}`
        });
        break;

      case NotificationType.GRADE_UPDATE:
        if (userRoles.includes('instructor')) {
          actions.push({
            id: 'review_grade',
            title: 'Review Grade',
            icon: CheckCircle,
            variant: 'primary',
            url: `/instructor/assign-grade?notificationId=${notification.id}`,
            roles: ['instructor']
          });
        }
        if (userRoles.includes('student')) {
          actions.push({
            id: 'view_grade',
            title: 'View Grade',
            icon: Eye,
            variant: 'secondary',
            url: `/dashboard?tab=grades&notificationId=${notification.id}`,
            roles: ['student']
          });
        }
        break;

      case NotificationType.DEADLINE_REMINDER:
        if (userRoles.includes('student')) {
          actions.push({
            id: 'complete_task',
            title: 'Complete Task',
            icon: Clock,
            variant: 'warning',
            url: getDeadlineTaskUrl(notification),
            roles: ['student']
          });
        }
        actions.push({
          id: 'view_deadline',
          title: 'View Details',
          icon: Eye,
          variant: 'secondary',
          url: `/dashboard?tab=deadlines&notificationId=${notification.id}`
        });
        break;

      case NotificationType.VISIT_SCHEDULED:
        if (userRoles.includes('visitor')) {
          actions.push({
            id: 'prepare_visit',
            title: 'Prepare Visit',
            icon: Calendar,
            variant: 'primary',
            url: `/visitor?tab=visits&notificationId=${notification.id}`,
            roles: ['visitor']
          });
        }
        if (userRoles.includes('student')) {
          actions.push({
            id: 'view_visit_info',
            title: 'View Visit Info',
            icon: Eye,
            variant: 'secondary',
            url: `/dashboard?tab=visits&notificationId=${notification.id}`,
            roles: ['student']
          });
        }
        break;

      case NotificationType.SYSTEM_ANNOUNCEMENT:
        actions.push({
          id: 'view_announcement',
          title: 'View Announcement',
          icon: MessageSquare,
          variant: 'secondary',
          url: `/notifications?id=${notification.id}`
        });
        if (userRoles.includes('admin')) {
          actions.push({
            id: 'manage_announcement',
            title: 'Manage',
            icon: Settings,
            variant: 'primary',
            url: `/admin/announcements?id=${notification.id}`,
            roles: ['admin']
          });
        }
        break;

      default:
        actions.push({
          id: 'view_details',
          title: 'View Details',
          icon: Eye,
          variant: 'secondary',
          url: `/notifications?id=${notification.id}`
        });
    }

    // Add custom actions from notification data
    if (notification.actions) {
      notification.actions.forEach(customAction => {
        actions.push({
          id: customAction.id,
          title: customAction.title,
          icon: getIconForAction(customAction.action),
          variant: 'secondary',
          url: customAction.url,
          action: customAction.url ? undefined : () => handleCustomAction(customAction)
        });
      });
    }

    // Filter actions based on user roles
    return actions.filter(action => 
      !action.roles || action.roles.some(role => userRoles.includes(role))
    );
  }, [userRoles]);

  // Helper function to get deadline task URL based on notification data
  const getDeadlineTaskUrl = useCallback((notification: Notification): string => {
    const taskType = notification.data?.taskType;
    switch (taskType) {
      case 'document_upload':
        return `/documents/upload?notificationId=${notification.id}`;
      case 'evaluation':
        return `/evaluate/company?notificationId=${notification.id}`;
      case 'intern_request':
        return `/intern-request?notificationId=${notification.id}`;
      default:
        return `/dashboard?notificationId=${notification.id}`;
    }
  }, []);

  // Helper function to get icon for custom actions
  const getIconForAction = useCallback((actionType: string): React.ComponentType<{ className?: string }> => {
    switch (actionType) {
      case 'view':
      case 'open':
        return Eye;
      case 'upload':
        return Upload;
      case 'confirm':
      case 'approve':
        return CheckCircle;
      case 'schedule':
        return Calendar;
      case 'document':
        return FileText;
      case 'user':
      case 'profile':
        return User;
      case 'warning':
        return AlertTriangle;
      case 'external':
        return ExternalLink;
      default:
        return Eye;
    }
  }, []);

  // Handle confirm visit action
  const handleConfirmVisit = useCallback(async (notification: Notification) => {
    try {
      setIsProcessing('confirm_visit');
      
      // Make API call to confirm visit
      const response = await fetch(`/api/visitor/visits/${notification.data?.visitId}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to confirm visit');
      }

      const result = await response.json();
      onActionComplete?.('confirm_visit', result);
      
      // Navigate to visit details
      router.push(`/visitor?tab=visits&visitId=${notification.data?.visitId}`);
    } catch (error) {
      console.error('Error confirming visit:', error);
      alert('Failed to confirm visit. Please try again.');
    } finally {
      setIsProcessing(null);
    }
  }, [user?.access_token, onActionComplete, router]);

  // Handle custom actions
  const handleCustomAction = useCallback(async (action: any) => {
    try {
      setIsProcessing(action.id);
      
      // Execute custom action logic here
      // This would typically involve API calls based on the action type
      
      onActionComplete?.(action.id, { success: true });
    } catch (error) {
      console.error('Error executing custom action:', error);
      alert('Failed to execute action. Please try again.');
    } finally {
      setIsProcessing(null);
    }
  }, [onActionComplete]);

  // Handle action click
  const handleActionClick = useCallback(async (action: ActionConfig, event: React.MouseEvent) => {
    event.stopPropagation();

    if (isProcessing) return;

    // Show confirmation dialog if required
    if (action.requiresConfirmation && showConfirmation) {
      setShowConfirmDialog(action.id);
      return;
    }

    // Execute action
    if (action.url) {
      // Navigate to URL
      if (action.url.startsWith('http')) {
        window.open(action.url, '_blank');
      } else {
        router.push(action.url);
      }
    } else if (action.action) {
      // Execute custom action
      await action.action();
    }

    onActionComplete?.(action.id, { url: action.url });
  }, [isProcessing, showConfirmation, router, onActionComplete]);

  // Handle confirmation dialog
  const handleConfirmAction = useCallback(async (actionId: string) => {
    const action = availableActions.find(a => a.id === actionId);
    if (!action) return;

    setShowConfirmDialog(null);

    if (action.action) {
      await action.action();
    } else if (action.url) {
      router.push(action.url);
    }

    onActionComplete?.(actionId, { confirmed: true });
  }, [router, onActionComplete]);

  // Get available actions for this notification
  const availableActions = useMemo(() => 
    getActionsForNotification(notification), 
    [notification, getActionsForNotification]
  );

  // Get variant classes
  const getVariantClasses = useCallback((variant: ActionConfig['variant']) => {
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

  if (availableActions.length === 0) {
    return null;
  }

  return (
    <>
      <div className={`flex items-center gap-2 ${compact ? 'flex-wrap' : 'flex-nowrap'}`}>
        {availableActions.slice(0, compact ? 2 : 3).map((action) => {
          const IconComponent = action.icon;
          const isLoading = isProcessing === action.id;
          
          return (
            <button
              key={action.id}
              onClick={(e) => handleActionClick(action, e)}
              disabled={isLoading || !!isProcessing}
              className={`
                inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md border
                transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                disabled:opacity-50 disabled:cursor-not-allowed
                ${getVariantClasses(action.variant)}
                ${compact ? 'text-xs px-2 py-1' : ''}
              `}
              title={action.title}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-1" />
              ) : (
                <IconComponent className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} ${compact ? '' : 'mr-1'}`} />
              )}
              {!compact && action.title}
            </button>
          );
        })}

        {availableActions.length > (compact ? 2 : 3) && (
          <button
            className="inline-flex items-center px-2 py-1.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
            title={`${availableActions.length - (compact ? 2 : 3)} more actions`}
          >
            +{availableActions.length - (compact ? 2 : 3)}
          </button>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-orange-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Action</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              {availableActions.find(a => a.id === showConfirmDialog)?.confirmationMessage || 
               'Are you sure you want to perform this action?'}
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmDialog(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleConfirmAction(showConfirmDialog)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
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