'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPullDistance?: number;
  refreshingText?: string;
  pullText?: string;
  releaseText?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

export function PullToRefresh({
  onRefresh,
  threshold = 80,
  maxPullDistance = 120,
  refreshingText = 'Refreshing...',
  pullText = 'Pull to refresh',
  releaseText = 'Release to refresh',
  disabled = false,
  children,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canPull, setCanPull] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isPulling = useRef<boolean>(false);

  // Check if we can start pulling (at top of scroll)
  const checkCanPull = useCallback(() => {
    if (!containerRef.current) return false;
    
    const scrollTop = containerRef.current.scrollTop;
    return scrollTop === 0;
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    const touch = event.touches[0];
    if (!touch) return;
    
    startY.current = touch.clientY;
    currentY.current = touch.clientY;
    setCanPull(checkCanPull());
  }, [disabled, isRefreshing, checkCanPull]);

  // Handle touch move
  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (disabled || isRefreshing || !canPull) return;
    
    const touch = event.touches[0];
    if (!touch) return;
    
    currentY.current = touch.clientY;
    const deltaY = currentY.current - startY.current;
    
    if (deltaY > 0) {
      isPulling.current = true;
      
      // Calculate pull distance with resistance
      const resistance = 0.5;
      const distance = Math.min(deltaY * resistance, maxPullDistance);
      setPullDistance(distance);
      
      // Prevent default scrolling when pulling
      event.preventDefault();
    } else {
      isPulling.current = false;
      setPullDistance(0);
    }
  }, [disabled, isRefreshing, canPull, maxPullDistance]);

  // Handle touch end
  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing || !isPulling.current) return;
    
    const shouldRefresh = pullDistance >= threshold;
    
    if (shouldRefresh) {
      setIsRefreshing(true);
      setPullDistance(threshold); // Keep at threshold during refresh
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
    
    isPulling.current = false;
    setCanPull(false);
  }, [disabled, isRefreshing, pullDistance, threshold, onRefresh]);

  // Set up event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Calculate progress and state
  const progress = Math.min(pullDistance / threshold, 1);
  const isOverThreshold = pullDistance >= threshold;
  const rotation = progress * 180;

  // Get status text
  const getStatusText = () => {
    if (isRefreshing) return refreshingText;
    if (isOverThreshold) return releaseText;
    return pullText;
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto h-full"
      style={{
        transform: `translateY(${pullDistance}px)`,
        transition: isPulling.current ? 'none' : 'transform 0.3s ease-out',
      }}
    >
      {/* Pull to refresh indicator */}
      <div
        className={`
          absolute top-0 left-0 right-0 flex flex-col items-center justify-center
          bg-gray-50 border-b border-gray-200 transition-all duration-300
          ${pullDistance > 0 ? 'opacity-100' : 'opacity-0'}
        `}
        style={{
          height: `${Math.max(pullDistance, 0)}px`,
          transform: `translateY(-${Math.max(pullDistance, 0)}px)`,
        }}
      >
        <div className="flex flex-col items-center justify-center space-y-2 py-4">
          {/* Refresh icon */}
          <div
            className={`
              transition-all duration-300
              ${isRefreshing ? 'animate-spin' : ''}
              ${isOverThreshold ? 'text-blue-600' : 'text-gray-400'}
            `}
            style={{
              transform: isRefreshing ? 'none' : `rotate(${rotation}deg)`,
            }}
          >
            <RefreshCw className="h-6 w-6" />
          </div>
          
          {/* Status text */}
          <p className={`
            text-sm font-medium transition-colors duration-300
            ${isOverThreshold ? 'text-blue-600' : 'text-gray-500'}
          `}>
            {getStatusText()}
          </p>
          
          {/* Progress indicator */}
          <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`
                h-full transition-all duration-300 rounded-full
                ${isOverThreshold ? 'bg-blue-600' : 'bg-gray-400'}
              `}
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

// Hook for pull to refresh functionality
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const refresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh, isRefreshing]);

  return {
    isRefreshing,
    refresh,
  };
}