'use client';

import React, { useState, useCallback } from 'react';
import { Bell, Download, X, Check, AlertCircle } from 'lucide-react';
import { usePWANotifications, usePWAInstallPrompt } from '../../../hooks/usePWANotifications';

interface PWANotificationPromptProps {
  onClose?: () => void;
  showInstallPrompt?: boolean;
  className?: string;
}

export function PWANotificationPrompt({
  onClose,
  showInstallPrompt = true,
  className = '',
}: PWANotificationPromptProps) {
  const {
    isSupported,
    isInstalled,
    permission,
    isSubscribed,
    isInitializing,
    error,
    requestPermission,
    subscribe,
    clearError,
  } = usePWANotifications();

  const { isInstallable, promptInstall } = usePWAInstallPrompt();

  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'permission' | 'install' | 'subscribe' | 'complete'>('permission');

  // Handle permission request
  const handleRequestPermission = useCallback(async () => {
    setIsLoading(true);
    clearError();

    try {
      const newPermission = await requestPermission();
      
      if (newPermission === 'granted') {
        if (showInstallPrompt && isInstallable) {
          setStep('install');
        } else {
          setStep('subscribe');
        }
      }
    } catch (error) {
      console.error('Failed to request permission:', error);
    } finally {
      setIsLoading(false);
    }
  }, [requestPermission, clearError, showInstallPrompt, isInstallable]);

  // Handle PWA installation
  const handleInstallPWA = useCallback(async () => {
    setIsLoading(true);

    try {
      const installed = await promptInstall();
      if (installed || isInstalled) {
        setStep('subscribe');
      }
    } catch (error) {
      console.error('Failed to install PWA:', error);
    } finally {
      setIsLoading(false);
    }
  }, [promptInstall, isInstalled]);

  // Handle push notification subscription
  const handleSubscribe = useCallback(async () => {
    setIsLoading(true);
    clearError();

    try {
      const subscription = await subscribe();
      if (subscription) {
        setStep('complete');
      }
    } catch (error) {
      console.error('Failed to subscribe:', error);
    } finally {
      setIsLoading(false);
    }
  }, [subscribe, clearError]);

  // Skip installation step
  const handleSkipInstall = useCallback(() => {
    setStep('subscribe');
  }, []);

  // Don't render if not supported or already set up
  if (!isSupported || isInitializing || (permission === 'granted' && isSubscribed)) {
    return null;
  }

  // Don't render if permission is denied
  if (permission === 'denied') {
    return null;
  }

  const renderPermissionStep = () => (
    <div className="text-center">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Bell className="w-8 h-8 text-blue-600" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Enable Notifications
      </h3>
      
      <p className="text-gray-600 mb-6">
        Stay updated with important notifications about your internship activities, 
        assignments, and deadlines.
      </p>

      <div className="space-y-3">
        <button
          onClick={handleRequestPermission}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Requesting...' : 'Enable Notifications'}
        </button>
        
        <button
          onClick={onClose}
          className="w-full text-gray-500 py-2 px-4 rounded-lg hover:text-gray-700 transition-colors"
        >
          Maybe Later
        </button>
      </div>
    </div>
  );

  const renderInstallStep = () => (
    <div className="text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Download className="w-8 h-8 text-green-600" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Install App
      </h3>
      
      <p className="text-gray-600 mb-6">
        Install the app for a better experience with native notifications, 
        offline access, and faster loading.
      </p>

      <div className="space-y-3">
        <button
          onClick={handleInstallPWA}
          disabled={isLoading}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Installing...' : 'Install App'}
        </button>
        
        <button
          onClick={handleSkipInstall}
          className="w-full text-gray-500 py-2 px-4 rounded-lg hover:text-gray-700 transition-colors"
        >
          Skip for Now
        </button>
      </div>
    </div>
  );

  const renderSubscribeStep = () => (
    <div className="text-center">
      <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Bell className="w-8 h-8 text-purple-600" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Subscribe to Notifications
      </h3>
      
      <p className="text-gray-600 mb-6">
        Complete the setup to receive push notifications about important updates.
      </p>

      <div className="space-y-3">
        <button
          onClick={handleSubscribe}
          disabled={isLoading}
          className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Subscribing...' : 'Subscribe to Notifications'}
        </button>
        
        <button
          onClick={onClose}
          className="w-full text-gray-500 py-2 px-4 rounded-lg hover:text-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Check className="w-8 h-8 text-green-600" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        All Set!
      </h3>
      
      <p className="text-gray-600 mb-6">
        You'll now receive push notifications for important updates. 
        You can manage your notification preferences in settings.
      </p>

      <button
        onClick={onClose}
        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors"
      >
        Done
      </button>
    </div>
  );

  const renderError = () => (
    <div className="text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-8 h-8 text-red-600" />
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Setup Failed
      </h3>
      
      <p className="text-gray-600 mb-6">
        {error || 'Something went wrong while setting up notifications.'}
      </p>

      <div className="space-y-3">
        <button
          onClick={() => {
            clearError();
            setStep('permission');
          }}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
        
        <button
          onClick={onClose}
          className="w-full text-gray-500 py-2 px-4 rounded-lg hover:text-gray-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 p-6 max-w-md mx-auto ${className}`}>
      {/* Close button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content based on current step */}
      {error ? renderError() : (
        <>
          {step === 'permission' && renderPermissionStep()}
          {step === 'install' && renderInstallStep()}
          {step === 'subscribe' && renderSubscribeStep()}
          {step === 'complete' && renderCompleteStep()}
        </>
      )}

      {/* Progress indicator */}
      <div className="flex justify-center mt-6 space-x-2">
        {['permission', 'install', 'subscribe', 'complete'].map((stepName, index) => {
          const isActive = step === stepName;
          const isCompleted = ['permission', 'install', 'subscribe', 'complete'].indexOf(step) > index;
          
          return (
            <div
              key={stepName}
              className={`w-2 h-2 rounded-full transition-colors ${
                isActive ? 'bg-blue-600' : 
                isCompleted ? 'bg-green-600' : 'bg-gray-300'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

// Compact version for mobile
export function PWANotificationBanner({
  onClose,
  className = '',
}: {
  onClose?: () => void;
  className?: string;
}) {
  const {
    isSupported,
    permission,
    isSubscribed,
    requestPermission,
    subscribe,
  } = usePWANotifications();

  const [isLoading, setIsLoading] = useState(false);

  const handleEnable = useCallback(async () => {
    setIsLoading(true);

    try {
      if (permission !== 'granted') {
        await requestPermission();
      }
      
      if (!isSubscribed) {
        await subscribe();
      }
      
      onClose?.();
    } catch (error) {
      console.error('Failed to enable notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [permission, isSubscribed, requestPermission, subscribe, onClose]);

  if (!isSupported || permission === 'denied' || isSubscribed) {
    return null;
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bell className="w-5 h-5 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              Enable push notifications
            </p>
            <p className="text-xs text-blue-700">
              Stay updated with important alerts
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleEnable}
            disabled={isLoading}
            className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Enabling...' : 'Enable'}
          </button>
          
          <button
            onClick={onClose}
            className="text-blue-600 hover:text-blue-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}