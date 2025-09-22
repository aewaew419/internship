'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface SwipeGestureOptions {
  element: HTMLElement | null;
  enabled?: boolean;
  threshold?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  resetOnComplete?: boolean;
}

interface SwipeGestureState {
  swipeOffset: number;
  isSwipeActive: boolean;
  swipeDirection: 'left' | 'right' | 'up' | 'down' | null;
  resetSwipe: () => void;
}

export function useSwipeGesture({
  element,
  enabled = true,
  threshold = 50,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  resetOnComplete = true,
}: SwipeGestureOptions): SwipeGestureState {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'up' | 'down' | null>(null);
  
  const startPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const hasTriggered = useRef(false);

  const resetSwipe = useCallback(() => {
    setSwipeOffset(0);
    setIsSwipeActive(false);
    setSwipeDirection(null);
    isDragging.current = false;
    hasTriggered.current = false;
  }, []);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (!enabled || !element) return;
    
    startPos.current = { x: clientX, y: clientY };
    currentPos.current = { x: clientX, y: clientY };
    isDragging.current = true;
    hasTriggered.current = false;
    setIsSwipeActive(true);
  }, [enabled, element]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging.current || !enabled || !element) return;

    currentPos.current = { x: clientX, y: clientY };
    
    const deltaX = clientX - startPos.current.x;
    const deltaY = clientY - startPos.current.y;
    
    // Determine primary direction
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      setSwipeDirection(deltaX > 0 ? 'right' : 'left');
      setSwipeOffset(deltaX);
      
      // Trigger callback if threshold is met and not already triggered
      if (!hasTriggered.current && absDeltaX >= threshold) {
        hasTriggered.current = true;
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      }
    } else {
      // Vertical swipe
      setSwipeDirection(deltaY > 0 ? 'down' : 'up');
      setSwipeOffset(deltaY);
      
      // Trigger callback if threshold is met and not already triggered
      if (!hasTriggered.current && absDeltaY >= threshold) {
        hasTriggered.current = true;
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
    }
  }, [enabled, element, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  const handleEnd = useCallback(() => {
    if (!isDragging.current) return;
    
    if (resetOnComplete || !hasTriggered.current) {
      // Reset if no action was triggered or resetOnComplete is true
      setTimeout(resetSwipe, 200);
    }
    
    isDragging.current = false;
  }, [resetOnComplete, resetSwipe]);

  // Mouse events
  const handleMouseDown = useCallback((event: MouseEvent) => {
    handleStart(event.clientX, event.clientY);
  }, [handleStart]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    handleMove(event.clientX, event.clientY);
  }, [handleMove]);

  const handleMouseUp = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // Touch events
  const handleTouchStart = useCallback((event: TouchEvent) => {
    const touch = event.touches[0];
    if (touch) {
      handleStart(touch.clientX, touch.clientY);
    }
  }, [handleStart]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    const touch = event.touches[0];
    if (touch) {
      handleMove(touch.clientX, touch.clientY);
    }
  }, [handleMove]);

  const handleTouchEnd = useCallback(() => {
    handleEnd();
  }, [handleEnd]);

  // Set up event listeners
  useEffect(() => {
    if (!element || !enabled) return;

    // Add event listeners
    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('touchstart', handleTouchStart, { passive: true });

    // Global listeners for move and end events
    const addGlobalListeners = () => {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      document.addEventListener('touchend', handleTouchEnd);
    };

    const removeGlobalListeners = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    // Add global listeners when dragging starts
    const originalMouseDown = handleMouseDown;
    const originalTouchStart = handleTouchStart;

    const enhancedMouseDown = (event: MouseEvent) => {
      originalMouseDown(event);
      addGlobalListeners();
    };

    const enhancedTouchStart = (event: TouchEvent) => {
      originalTouchStart(event);
      addGlobalListeners();
    };

    // Replace event listeners with enhanced versions
    element.removeEventListener('mousedown', handleMouseDown);
    element.removeEventListener('touchstart', handleTouchStart);
    element.addEventListener('mousedown', enhancedMouseDown);
    element.addEventListener('touchstart', enhancedTouchStart, { passive: true });

    // Cleanup function
    return () => {
      element.removeEventListener('mousedown', enhancedMouseDown);
      element.removeEventListener('touchstart', enhancedTouchStart);
      removeGlobalListeners();
    };
  }, [
    element,
    enabled,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  ]);

  // Reset on element change or disable
  useEffect(() => {
    if (!enabled) {
      resetSwipe();
    }
  }, [enabled, resetSwipe]);

  return {
    swipeOffset,
    isSwipeActive,
    swipeDirection,
    resetSwipe,
  };
}

// Hook for simple swipe detection without offset tracking
export function useSimpleSwipe({
  element,
  enabled = true,
  threshold = 50,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
}: Omit<SwipeGestureOptions, 'resetOnComplete'>) {
  const { swipeDirection, resetSwipe } = useSwipeGesture({
    element,
    enabled,
    threshold,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    resetOnComplete: true,
  });

  return {
    swipeDirection,
    resetSwipe,
  };
}