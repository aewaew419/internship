'use client';

import { useState, useRef, useCallback, ReactNode } from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  threshold?: number;
  disabled?: boolean;
}

export const PullToRefresh = ({ 
  onRefresh, 
  children, 
  threshold = 80,
  disabled = false 
}: PullToRefreshProps) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);
  
  const startY = useRef(0);
  const currentY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    // Only trigger if at the top of the page
    if (window.scrollY > 0) return;
    
    startY.current = e.touches[0].clientY;
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing || startY.current === 0) return;
    
    currentY.current = e.touches[0].clientY;
    const distance = currentY.current - startY.current;
    
    // Only pull down
    if (distance > 0 && window.scrollY === 0) {
      e.preventDefault();
      
      // Apply resistance to the pull
      const resistance = Math.min(distance * 0.5, threshold * 1.5);
      setPullDistance(resistance);
      setCanRefresh(resistance >= threshold);
    }
  }, [disabled, isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || isRefreshing) return;
    
    if (canRefresh && pullDistance >= threshold) {
      setIsRefreshing(true);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
    
    // Reset state
    setPullDistance(0);
    setCanRefresh(false);
    startY.current = 0;
    currentY.current = 0;
  }, [disabled, isRefreshing, canRefresh, pullDistance, threshold, onRefresh]);

  const getRefreshText = () => {
    if (isRefreshing) return 'กำลังรีเฟรช...';
    if (canRefresh) return 'ปล่อยเพื่อรีเฟรช';
    return 'ดึงลงเพื่อรีเฟรช';
  };

  const getIconRotation = () => {
    if (isRefreshing) return 'animate-spin';
    if (canRefresh) return 'rotate-180';
    return '';
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      <div
        className={`absolute top-0 left-0 right-0 flex items-center justify-center bg-blue-50 border-b border-blue-100 transition-all duration-300 ${
          pullDistance > 0 ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          height: Math.min(pullDistance, threshold),
          transform: `translateY(${Math.min(pullDistance - threshold, 0)}px)`,
        }}
      >
        <div className="flex items-center gap-2 text-blue-600">
          <ArrowPathIcon className={`w-5 h-5 transition-transform duration-300 ${getIconRotation()}`} />
          <span className="text-sm font-medium">{getRefreshText()}</span>
        </div>
      </div>

      {/* Content */}
      <div
        className="transition-transform duration-300"
        style={{
          transform: `translateY(${isRefreshing ? threshold : Math.min(pullDistance, threshold)}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};