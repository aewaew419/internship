'use client';

import React, { useState, useCallback } from 'react';
import { usePushPermission } from '../../hooks/usePushNotifications';

interface PushPermissionRequestProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
  className?: string;
  showIcon?: boolean;
  variant?: 'banner' | 'modal' | 'inline';
  autoShow?: boolean;
}

export function PushPermissionRequest({
  onPermissionGranted,
  onPermissionDenied,
  className = '',
  showIcon = true,
  variant = 'banner',
  autoShow = true,
}: PushPermissionRequestProps) {
  const {
    permission,
    canRequestPermission,
    hasPermission,
    isBlocked,
    requestPermission,
    isSupported,
  } = usePushPermission();

  const [isRequesting, setIsRequesting] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleRequestPermission = useCallback(async () => {
    setIsRequesting(true);
    
    try {
      const result = await requestPermission();
      
      if (result === 'granted') {
        onPermissionGranted?.();
      } else {
        onPermissionDenied?.();
      }
    } catch (error) {
      console.error('Failed to request permission:', error);
      onPermissionDenied?.();
    } finally {
      setIsRequesting(false);
    }
  }, [requestPermission, onPermissionGranted, onPermissionDenied]);

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
  }, []);

  // Don't show if not supported, already has permission, or dismissed
  if (!isSupported || hasPermission || isDismissed || (!autoShow && !canRequestPermission)) {
    return null;
  }

  // Show different content based on permission status
  if (isBlocked) {
    return (
      <div className={`push-permission-blocked ${variant} ${className}`}>
        <div className="push-permission-content">
          {showIcon && (
            <div className="push-permission-icon">
              <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          )}
          <div className="push-permission-text">
            <h3 className="push-permission-title">Notifications Blocked</h3>
            <p className="push-permission-description">
              Notifications are currently blocked. To receive important updates about your internship activities, 
              please enable notifications in your browser settings.
            </p>
            <div className="push-permission-instructions">
              <p className="text-sm text-gray-600">
                <strong>To enable notifications:</strong>
              </p>
              <ol className="text-sm text-gray-600 list-decimal list-inside mt-1">
                <li>Click the lock icon in your browser's address bar</li>
                <li>Select "Allow" for notifications</li>
                <li>Refresh this page</li>
              </ol>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="push-permission-dismiss"
            aria-label="Dismiss notification"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  if (canRequestPermission) {
    return (
      <div className={`push-permission-request ${variant} ${className}`}>
        <div className="push-permission-content">
          {showIcon && (
            <div className="push-permission-icon">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h8v-2H4v2zM4 11h8V9H4v2zM4 7h8V5H4v2z" />
              </svg>
            </div>
          )}
          <div className="push-permission-text">
            <h3 className="push-permission-title">Stay Updated</h3>
            <p className="push-permission-description">
              Get instant notifications about assignment updates, evaluation deadlines, 
              and important announcements for your internship program.
            </p>
            <div className="push-permission-benefits">
              <ul className="text-sm text-gray-600 list-disc list-inside">
                <li>Assignment and grade updates</li>
                <li>Evaluation reminders</li>
                <li>Schedule changes</li>
                <li>Document requests</li>
              </ul>
            </div>
          </div>
          <div className="push-permission-actions">
            <button
              onClick={handleRequestPermission}
              disabled={isRequesting}
              className="push-permission-allow"
            >
              {isRequesting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Requesting...
                </>
              ) : (
                'Allow Notifications'
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="push-permission-dismiss-text"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Styled variants
export function PushPermissionBanner(props: Omit<PushPermissionRequestProps, 'variant'>) {
  return <PushPermissionRequest {...props} variant="banner" />;
}

export function PushPermissionModal(props: Omit<PushPermissionRequestProps, 'variant'>) {
  return <PushPermissionRequest {...props} variant="modal" />;
}

export function PushPermissionInline(props: Omit<PushPermissionRequestProps, 'variant'>) {
  return <PushPermissionRequest {...props} variant="inline" />;
}

// CSS classes (to be added to your CSS file)
const styles = `
.push-permission-request,
.push-permission-blocked {
  @apply bg-white border border-gray-200 rounded-lg shadow-sm;
}

.push-permission-request.banner,
.push-permission-blocked.banner {
  @apply fixed top-4 left-4 right-4 z-50 max-w-md mx-auto;
}

.push-permission-request.modal,
.push-permission-blocked.modal {
  @apply fixed inset-0 z-50 flex items-center justify-center p-4;
  background: rgba(0, 0, 0, 0.5);
}

.push-permission-request.modal .push-permission-content,
.push-permission-blocked.modal .push-permission-content {
  @apply bg-white rounded-lg max-w-md w-full;
}

.push-permission-request.inline,
.push-permission-blocked.inline {
  @apply w-full;
}

.push-permission-content {
  @apply p-4 relative;
}

.push-permission-icon {
  @apply flex-shrink-0 mb-3;
}

.push-permission-title {
  @apply text-lg font-semibold text-gray-900 mb-2;
}

.push-permission-description {
  @apply text-gray-600 mb-3;
}

.push-permission-benefits {
  @apply mb-4;
}

.push-permission-instructions {
  @apply mt-3 p-3 bg-gray-50 rounded;
}

.push-permission-actions {
  @apply flex flex-col sm:flex-row gap-2;
}

.push-permission-allow {
  @apply inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed;
}

.push-permission-dismiss-text {
  @apply inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
}

.push-permission-dismiss {
  @apply absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded;
}

@media (max-width: 640px) {
  .push-permission-request.banner,
  .push-permission-blocked.banner {
    @apply top-2 left-2 right-2;
  }
  
  .push-permission-actions {
    @apply flex-col;
  }
}
`;

export { styles as pushPermissionStyles };