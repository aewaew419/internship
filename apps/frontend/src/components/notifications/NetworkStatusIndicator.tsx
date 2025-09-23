'use client';

import React, { useState, useEffect } from 'react';
import { networkStatusManager, type NetworkStatus, type ConnectionQuality } from '../../lib/notifications/network-status';

interface NetworkStatusIndicatorProps {
  showDetails?: boolean;
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  autoHide?: boolean;
  hideDelay?: number;
}

export function NetworkStatusIndicator({
  showDetails = false,
  className = '',
  position = 'top-right',
  autoHide = true,
  hideDelay = 3000,
}: NetworkStatusIndicatorProps) {
  const [status, setStatus] = useState<NetworkStatus>(networkStatusManager.getStatus());
  const [quality, setQuality] = useState<ConnectionQuality>(networkStatusManager.getConnectionQuality());
  const [isVisible, setIsVisible] = useState(!status.isOnline);
  const [hideTimeout, setHideTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const unsubscribe = networkStatusManager.addListener((newStatus) => {
      setStatus(newStatus);
      setQuality(networkStatusManager.getConnectionQuality());
      
      // Show indicator when status changes
      setIsVisible(true);
      
      // Clear existing timeout
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
      
      // Auto-hide if online and autoHide is enabled
      if (newStatus.isOnline && autoHide) {
        const timeout = setTimeout(() => {
          setIsVisible(false);
        }, hideDelay);
        setHideTimeout(timeout);
      } else if (!newStatus.isOnline) {
        // Always show when offline
        setIsVisible(true);
      }
    });

    return () => {
      unsubscribe();
      if (hideTimeout) {
        clearTimeout(hideTimeout);
      }
    };
  }, [autoHide, hideDelay, hideTimeout]);

  if (!isVisible) {
    return null;
  }

  const getStatusColor = () => {
    if (!status.isOnline) return 'bg-red-500';
    
    switch (quality.level) {
      case 'excellent':
        return 'bg-green-500';
      case 'good':
        return 'bg-green-400';
      case 'fair':
        return 'bg-yellow-500';
      case 'poor':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = () => {
    if (!status.isOnline) {
      return (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
        </svg>
      );
    }

    // Signal strength icon based on quality
    const bars = quality.level === 'excellent' ? 4 : 
                 quality.level === 'good' ? 3 :
                 quality.level === 'fair' ? 2 : 1;

    return (
      <div className="flex items-end space-x-0.5">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`w-1 bg-current transition-opacity ${
              bar <= bars ? 'opacity-100' : 'opacity-30'
            }`}
            style={{ height: `${bar * 3 + 2}px` }}
          />
        ))}
      </div>
    );
  };

  const getStatusText = () => {
    if (!status.isOnline) {
      return 'Offline';
    }
    
    return showDetails ? quality.description : 'Online';
  };

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  return (
    <div
      className={`
        fixed z-50 flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg
        text-white text-sm font-medium transition-all duration-300
        ${getStatusColor()}
        ${positionClasses[position]}
        ${className}
      `}
      role="status"
      aria-live="polite"
    >
      {getStatusIcon()}
      <span>{getStatusText()}</span>
      
      {showDetails && status.isOnline && (
        <div className="text-xs opacity-90">
          {status.effectiveType.toUpperCase()} • {Math.round(status.rtt)}ms
        </div>
      )}
    </div>
  );
}

interface NetworkStatusBannerProps {
  className?: string;
  showRetryButton?: boolean;
  onRetry?: () => void;
}

export function NetworkStatusBanner({
  className = '',
  showRetryButton = false,
  onRetry,
}: NetworkStatusBannerProps) {
  const [status, setStatus] = useState<NetworkStatus>(networkStatusManager.getStatus());
  const [isVisible, setIsVisible] = useState(!status.isOnline);

  useEffect(() => {
    const unsubscribe = networkStatusManager.addListener((newStatus) => {
      setStatus(newStatus);
      setIsVisible(!newStatus.isOnline);
    });

    return unsubscribe;
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`
        bg-red-500 text-white px-4 py-3 text-center text-sm font-medium
        flex items-center justify-center space-x-4
        ${className}
      `}
      role="alert"
    >
      <div className="flex items-center space-x-2">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span>You're currently offline. Some features may not be available.</span>
      </div>
      
      {showRetryButton && onRetry && (
        <button
          onClick={onRetry}
          className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded text-sm font-medium transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}

interface NetworkStatusTooltipProps {
  children: React.ReactNode;
  className?: string;
}

export function NetworkStatusTooltip({ children, className = '' }: NetworkStatusTooltipProps) {
  const [status, setStatus] = useState<NetworkStatus>(networkStatusManager.getStatus());
  const [quality, setQuality] = useState<ConnectionQuality>(networkStatusManager.getConnectionQuality());
  const [stability, setStability] = useState(networkStatusManager.getConnectionStability());
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const unsubscribe = networkStatusManager.addListener((newStatus) => {
      setStatus(newStatus);
      setQuality(networkStatusManager.getConnectionQuality());
      setStability(networkStatusManager.getConnectionStability());
    });

    return unsubscribe;
  }, []);

  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-gray-900 text-white text-xs rounded-lg shadow-lg p-3 z-50">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className={status.isOnline ? 'text-green-400' : 'text-red-400'}>
                {status.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            
            {status.isOnline && (
              <>
                <div className="flex justify-between">
                  <span>Quality:</span>
                  <span className={
                    quality.level === 'excellent' ? 'text-green-400' :
                    quality.level === 'good' ? 'text-green-300' :
                    quality.level === 'fair' ? 'text-yellow-400' :
                    'text-orange-400'
                  }>
                    {quality.level} ({quality.score}/100)
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span>Connection:</span>
                  <span>{status.effectiveType.toUpperCase()}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Latency:</span>
                  <span>{status.rtt}ms</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Speed:</span>
                  <span>{status.downlink} Mbps</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Uptime:</span>
                  <span>{Math.round(stability.uptime)}%</span>
                </div>
                
                {status.saveData && (
                  <div className="text-yellow-400 text-center">
                    Data Saver Mode Active
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}