'use client';

import React, { useState, useCallback } from 'react';
import { usePushSubscriptionStatus, usePushNotificationTesting } from '../../hooks/usePushNotifications';

interface PushSubscriptionManagerProps {
  className?: string;
  showTestButton?: boolean;
  showStatus?: boolean;
  onSubscriptionChange?: (isSubscribed: boolean) => void;
}

export function PushSubscriptionManager({
  className = '',
  showTestButton = true,
  showStatus = true,
  onSubscriptionChange,
}: PushSubscriptionManagerProps) {
  const {
    isSubscribed,
    subscription,
    subscribe,
    unsubscribe,
    resubscribe,
    isLoading,
    error,
  } = usePushSubscriptionStatus();

  const {
    sendTestNotification,
    canSendTest,
    isLoading: isTestLoading,
    error: testError,
  } = usePushNotificationTesting();

  const [showDetails, setShowDetails] = useState(false);

  const handleSubscribe = useCallback(async () => {
    const success = await subscribe();
    if (success) {
      onSubscriptionChange?.(true);
    }
  }, [subscribe, onSubscriptionChange]);

  const handleUnsubscribe = useCallback(async () => {
    const success = await unsubscribe();
    if (success) {
      onSubscriptionChange?.(false);
    }
  }, [unsubscribe, onSubscriptionChange]);

  const handleResubscribe = useCallback(async () => {
    const success = await resubscribe();
    if (success) {
      onSubscriptionChange?.(true);
    }
  }, [resubscribe, onSubscriptionChange]);

  const handleTestNotification = useCallback(async () => {
    await sendTestNotification();
  }, [sendTestNotification]);

  const toggleDetails = useCallback(() => {
    setShowDetails(prev => !prev);
  }, []);

  return (
    <div className={`push-subscription-manager ${className}`}>
      {/* Status Section */}
      {showStatus && (
        <div className="push-status-section">
          <div className="push-status-header">
            <h3 className="push-status-title">Push Notifications</h3>
            <div className={`push-status-indicator ${isSubscribed ? 'active' : 'inactive'}`}>
              <div className="push-status-dot"></div>
              <span className="push-status-text">
                {isSubscribed ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          
          {error && (
            <div className="push-error-message">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {testError && (
            <div className="push-error-message">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Test notification failed: {testError}</span>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="push-actions">
        {!isSubscribed ? (
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="push-action-button primary"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Subscribing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h8v-2H4v2zM4 11h8V9H4v2zM4 7h8V5H4v2z" />
                </svg>
                Enable Push Notifications
              </>
            )}
          </button>
        ) : (
          <div className="push-subscribed-actions">
            <button
              onClick={handleUnsubscribe}
              disabled={isLoading}
              className="push-action-button secondary"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Unsubscribing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                  </svg>
                  Disable Notifications
                </>
              )}
            </button>

            {showTestButton && (
              <button
                onClick={handleTestNotification}
                disabled={!canSendTest || isTestLoading}
                className="push-action-button tertiary"
              >
                {isTestLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2" />
                    </svg>
                    Send Test
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleResubscribe}
              disabled={isLoading}
              className="push-action-button tertiary"
              title="Refresh subscription"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Subscription Details */}
      {isSubscribed && subscription && (
        <div className="push-details">
          <button
            onClick={toggleDetails}
            className="push-details-toggle"
          >
            <span>Subscription Details</span>
            <svg 
              className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDetails && (
            <div className="push-details-content">
              <div className="push-detail-item">
                <span className="push-detail-label">Endpoint:</span>
                <span className="push-detail-value">{subscription.endpoint.substring(0, 50)}...</span>
              </div>
              <div className="push-detail-item">
                <span className="push-detail-label">Status:</span>
                <span className="push-detail-value">Active</span>
              </div>
              <div className="push-detail-item">
                <span className="push-detail-label">Browser:</span>
                <span className="push-detail-value">{navigator.userAgent.split(' ')[0]}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Help Text */}
      <div className="push-help-text">
        <p className="text-sm text-gray-600">
          {isSubscribed 
            ? 'You will receive notifications about important updates and activities.'
            : 'Enable push notifications to stay updated on your internship activities.'
          }
        </p>
      </div>
    </div>
  );
}

// CSS classes (to be added to your CSS file)
const styles = `
.push-subscription-manager {
  @apply space-y-4;
}

.push-status-section {
  @apply space-y-2;
}

.push-status-header {
  @apply flex items-center justify-between;
}

.push-status-title {
  @apply text-lg font-medium text-gray-900;
}

.push-status-indicator {
  @apply flex items-center space-x-2;
}

.push-status-indicator.active .push-status-dot {
  @apply w-2 h-2 bg-green-500 rounded-full;
}

.push-status-indicator.inactive .push-status-dot {
  @apply w-2 h-2 bg-gray-400 rounded-full;
}

.push-status-text {
  @apply text-sm font-medium;
}

.push-status-indicator.active .push-status-text {
  @apply text-green-700;
}

.push-status-indicator.inactive .push-status-text {
  @apply text-gray-500;
}

.push-error-message {
  @apply flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm;
}

.push-actions {
  @apply space-y-2;
}

.push-subscribed-actions {
  @apply flex flex-wrap gap-2;
}

.push-action-button {
  @apply inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
}

.push-action-button.primary {
  @apply border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500;
}

.push-action-button.secondary {
  @apply border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500;
}

.push-action-button.tertiary {
  @apply border-gray-300 text-gray-500 bg-white hover:bg-gray-50 hover:text-gray-700 focus:ring-blue-500 px-3 py-2;
}

.push-details {
  @apply border-t border-gray-200 pt-4;
}

.push-details-toggle {
  @apply flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded p-2 -m-2;
}

.push-details-content {
  @apply mt-3 space-y-2;
}

.push-detail-item {
  @apply flex justify-between text-sm;
}

.push-detail-label {
  @apply font-medium text-gray-500;
}

.push-detail-value {
  @apply text-gray-900 font-mono text-xs;
}

.push-help-text {
  @apply border-t border-gray-200 pt-4;
}

@media (max-width: 640px) {
  .push-subscribed-actions {
    @apply flex-col;
  }
  
  .push-action-button {
    @apply w-full justify-center;
  }
}
`;

export { styles as pushSubscriptionManagerStyles };