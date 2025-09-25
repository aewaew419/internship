'use client';

import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BellIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';
import { SystemHealthIssue } from '@/hooks/useSystemHealth';

export interface SystemHealthNotification {
  id: string;
  type: 'critical_issue' | 'issue_resolved' | 'system_maintenance' | 'performance_alert';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  autoClose?: boolean;
  autoCloseDelay?: number;
  actions?: Array<{
    label: string;
    action: () => void;
    primary?: boolean;
  }>;
}

export interface SystemHealthNotificationsProps {
  notifications: SystemHealthNotification[];
  onDismiss: (notificationId: string) => void;
  onAction?: (notificationId: string, actionIndex: number) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxNotifications?: number;
  className?: string;
}

const notificationStyles = {
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  success: 'bg-green-50 border-green-200 text-green-800'
};

const notificationIcons = {
  info: BellIcon,
  warning: ExclamationTriangleIcon,
  error: ExclamationTriangleIcon,
  success: CheckCircleIcon
};

const positionStyles = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4'
};

const NotificationItem: React.FC<{
  notification: SystemHealthNotification;
  onDismiss: () => void;
  onAction?: (actionIndex: number) => void;
}> = ({ notification, onDismiss, onAction }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const Icon = notificationIcons[notification.severity];

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (notification.autoClose && notification.autoCloseDelay) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, notification.autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [notification.autoClose, notification.autoCloseDelay]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  const handleAction = (actionIndex: number) => {
    if (onAction) {
      onAction(actionIndex);
    }
    handleDismiss();
  };

  return (
    <div
      className={`
        border rounded-lg p-4 shadow-lg transition-all duration-300 transform
        ${notificationStyles[notification.severity]}
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${isExiting ? 'translate-x-full opacity-0' : ''}
        max-w-sm w-full
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm mb-1">{notification.title}</h4>
            <p className="text-sm opacity-90 leading-relaxed">{notification.message}</p>
            <p className="text-xs opacity-75 mt-2">
              {notification.timestamp.toLocaleString('th-TH')}
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="ml-2 flex-shrink-0 p-1 rounded hover:bg-current hover:bg-opacity-20 transition-colors"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Actions */}
      {notification.actions && notification.actions.length > 0 && (
        <div className="mt-3 flex space-x-2">
          {notification.actions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleAction(index)}
              className={`
                text-xs px-3 py-1 rounded transition-colors
                ${action.primary 
                  ? 'bg-current bg-opacity-20 hover:bg-opacity-30 font-medium' 
                  : 'bg-current bg-opacity-10 hover:bg-opacity-20'
                }
              `}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const SystemHealthNotifications: React.FC<SystemHealthNotificationsProps> = ({
  notifications,
  onDismiss,
  onAction,
  position = 'top-right',
  maxNotifications = 5,
  className = ''
}) => {
  const visibleNotifications = notifications.slice(0, maxNotifications);

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div
      className={`
        fixed z-50 space-y-3
        ${positionStyles[position]}
        ${className}
      `}
    >
      {visibleNotifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={() => onDismiss(notification.id)}
          onAction={onAction ? (actionIndex) => onAction(notification.id, actionIndex) : undefined}
        />
      ))}
    </div>
  );
};

// Hook for managing system health notifications
export const useSystemHealthNotifications = () => {
  const [notifications, setNotifications] = useState<SystemHealthNotification[]>([]);

  const addNotification = (notification: Omit<SystemHealthNotification, 'id' | 'timestamp'>) => {
    const newNotification: SystemHealthNotification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    setNotifications(prev => [newNotification, ...prev]);
  };

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Create notifications from system health issues
  const createNotificationFromIssue = (issue: SystemHealthIssue) => {
    const severity = issue.severity === 'critical' ? 'error' : 
                    issue.severity === 'high' ? 'warning' : 'info';

    const actions = [];
    
    if (issue.quickFix?.available) {
      actions.push({
        label: issue.quickFix.action,
        action: issue.quickFix.handler,
        primary: true
      });
    }

    if (issue.detailsUrl) {
      actions.push({
        label: 'ดูรายละเอียด',
        action: () => window.location.href = issue.detailsUrl!
      });
    }

    addNotification({
      type: 'critical_issue',
      title: issue.title,
      message: issue.description,
      severity,
      autoClose: severity !== 'error',
      autoCloseDelay: severity === 'info' ? 5000 : 10000,
      actions
    });
  };

  const notifyIssueResolved = (issue: SystemHealthIssue) => {
    addNotification({
      type: 'issue_resolved',
      title: 'ปัญหาได้รับการแก้ไขแล้ว',
      message: `${issue.title} - ระบบกลับมาทำงานปกติ`,
      severity: 'success',
      autoClose: true,
      autoCloseDelay: 5000
    });
  };

  const notifySystemMaintenance = (message: string, startTime?: Date, endTime?: Date) => {
    let maintenanceMessage = message;
    if (startTime && endTime) {
      maintenanceMessage += ` (${startTime.toLocaleString('th-TH')} - ${endTime.toLocaleString('th-TH')})`;
    }

    addNotification({
      type: 'system_maintenance',
      title: 'การบำรุงรักษาระบบ',
      message: maintenanceMessage,
      severity: 'info',
      autoClose: false
    });
  };

  const notifyPerformanceAlert = (metric: string, value: number, threshold: number) => {
    addNotification({
      type: 'performance_alert',
      title: 'เตือนประสิทธิภาพระบบ',
      message: `${metric} อยู่ที่ ${value} ซึ่งเกินค่าที่กำหนด (${threshold})`,
      severity: 'warning',
      autoClose: true,
      autoCloseDelay: 8000
    });
  };

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearAllNotifications,
    createNotificationFromIssue,
    notifyIssueResolved,
    notifySystemMaintenance,
    notifyPerformanceAlert
  };
};

export default SystemHealthNotifications;