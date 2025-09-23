'use client';

import React, { useState, useEffect } from 'react';
import { useProgressiveEnhancement } from './ProgressiveNotificationProvider';
import { browserCompatibility } from '../../../lib/push-notifications/browser-compatibility';

interface BrowserCapabilityBannerProps {
  showOnLimitations?: boolean;
  showOnUnsupported?: boolean;
  dismissible?: boolean;
  className?: string;
}

export function BrowserCapabilityBanner({
  showOnLimitations = true,
  showOnUnsupported = true,
  dismissible = true,
  className = ''
}: BrowserCapabilityBannerProps) {
  const {
    detectionResult,
    enhancementLevel,
    isLoading,
    getCapabilityReport,
    getSetupInstructions
  } = useProgressiveEnhancement();

  const [isDismissed, setIsDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Check if banner should be shown
  const shouldShow = !isDismissed && !isLoading && detectionResult && (
    (showOnUnsupported && !detectionResult.isSupported) ||
    (showOnLimitations && detectionResult.limitations.length > 0)
  );

  // Auto-dismiss after some time for minor limitations
  useEffect(() => {
    if (detectionResult?.limitations.length === 1 && enhancementLevel !== 'baseline') {
      const timer = setTimeout(() => {
        setIsDismissed(true);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [detectionResult, enhancementLevel]);

  if (!shouldShow) {
    return null;
  }

  const browserInfo = browserCompatibility.getBrowserInfo();
  const capabilityReport = getCapabilityReport();
  const setupInstructions = getSetupInstructions();

  const getBannerStyle = () => {
    if (!detectionResult?.isSupported) {
      return 'bg-red-50 border-red-200 text-red-800';
    }
    if (detectionResult.limitations.length > 2) {
      return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    }
    return 'bg-blue-50 border-blue-200 text-blue-800';
  };

  const getIcon = () => {
    if (!detectionResult?.isSupported) {
      return '⚠️';
    }
    if (detectionResult.limitations.length > 2) {
      return '⚡';
    }
    return 'ℹ️';
  };

  return (
    <div className={`border rounded-lg p-4 mb-4 ${getBannerStyle()} ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <span className="text-xl" role="img" aria-label="notification">
            {getIcon()}
          </span>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">
              {!detectionResult?.isSupported 
                ? 'Push Notifications Not Supported'
                : `Limited Notification Support (${browserInfo.name})`
              }
            </h3>
            
            <p className="text-sm mb-2">
              {capabilityReport?.summary}
            </p>

            {!detectionResult?.isSupported && (
              <div className="text-sm mb-3">
                <p className="mb-2">
                  Your browser doesn't support push notifications. You can still receive notifications through:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  {detectionResult.fallbackOptions.map((option, index) => (
                    <li key={index}>{option.description}</li>
                  ))}
                </ul>
              </div>
            )}

            {detectionResult?.isSupported && detectionResult.limitations.length > 0 && (
              <div className="text-sm mb-3">
                <p className="mb-2">Some features are limited in your browser:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  {detectionResult.limitations.slice(0, showDetails ? undefined : 3).map((limitation, index) => (
                    <li key={index}>{limitation}</li>
                  ))}
                  {!showDetails && detectionResult.limitations.length > 3 && (
                    <li>
                      <button
                        onClick={() => setShowDetails(true)}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        +{detectionResult.limitations.length - 3} more limitations
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {detectionResult?.recommendations.length > 0 && (
              <div className="text-sm mb-3">
                <p className="font-medium mb-1">Recommendations:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  {detectionResult.recommendations.map((recommendation, index) => (
                    <li key={index}>{recommendation}</li>
                  ))}
                </ul>
              </div>
            )}

            {showDetails && setupInstructions.length > 0 && (
              <div className="text-sm mb-3">
                <p className="font-medium mb-1">Setup Instructions:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  {setupInstructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
              </div>
            )}

            <div className="flex items-center space-x-3 text-sm">
              {!showDetails && (setupInstructions.length > 0 || detectionResult?.limitations.length > 3) && (
                <button
                  onClick={() => setShowDetails(true)}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Show details
                </button>
              )}
              
              {showDetails && (
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Hide details
                </button>
              )}

              <span className="text-xs opacity-75">
                Browser: {browserInfo.name} {browserInfo.version}
              </span>
            </div>
          </div>
        </div>

        {dismissible && (
          <button
            onClick={() => setIsDismissed(true)}
            className="ml-3 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}