import { useEffect, useCallback } from 'react';

interface KeyboardNavigationOptions {
  containerRef: React.RefObject<HTMLElement>;
  focusableElements?: React.RefObject<HTMLElement>[];
  enableArrowKeys?: boolean;
  enableTabNavigation?: boolean;
  onEscape?: () => void;
  onEnter?: () => void;
}

export const useKeyboardNavigation = ({
  containerRef,
  focusableElements = [],
  enableArrowKeys = false,
  enableTabNavigation = true,
  onEscape,
  onEnter,
}: KeyboardNavigationOptions) => {
  
  const getCurrentFocusIndex = useCallback(() => {
    const activeElement = document.activeElement;
    return focusableElements.findIndex(ref => ref.current === activeElement);
  }, [focusableElements]);

  const focusElement = useCallback((index: number) => {
    if (index >= 0 && index < focusableElements.length) {
      focusableElements[index].current?.focus();
    }
  }, [focusableElements]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        if (onEscape) {
          e.preventDefault();
          onEscape();
        }
        break;

      case 'Enter':
        if (onEnter && document.activeElement?.tagName !== 'BUTTON') {
          e.preventDefault();
          onEnter();
        }
        break;

      case 'ArrowDown':
      case 'ArrowRight':
        if (enableArrowKeys && focusableElements.length > 0) {
          e.preventDefault();
          const currentIndex = getCurrentFocusIndex();
          const nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
          focusElement(nextIndex);
        }
        break;

      case 'ArrowUp':
      case 'ArrowLeft':
        if (enableArrowKeys && focusableElements.length > 0) {
          e.preventDefault();
          const currentIndex = getCurrentFocusIndex();
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
          focusElement(prevIndex);
        }
        break;

      case 'Home':
        if (enableArrowKeys && focusableElements.length > 0) {
          e.preventDefault();
          focusElement(0);
        }
        break;

      case 'End':
        if (enableArrowKeys && focusableElements.length > 0) {
          e.preventDefault();
          focusElement(focusableElements.length - 1);
        }
        break;

      case 'Tab':
        if (!enableTabNavigation) {
          e.preventDefault();
        }
        break;
    }
  }, [
    enableArrowKeys,
    enableTabNavigation,
    focusableElements,
    getCurrentFocusIndex,
    focusElement,
    onEscape,
    onEnter,
  ]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, handleKeyDown]);

  const focusFirst = useCallback(() => {
    focusElement(0);
  }, [focusElement]);

  const focusLast = useCallback(() => {
    focusElement(focusableElements.length - 1);
  }, [focusElement, focusableElements.length]);

  const focusNext = useCallback(() => {
    const currentIndex = getCurrentFocusIndex();
    const nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
    focusElement(nextIndex);
  }, [getCurrentFocusIndex, focusElement, focusableElements.length]);

  const focusPrevious = useCallback(() => {
    const currentIndex = getCurrentFocusIndex();
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
    focusElement(prevIndex);
  }, [getCurrentFocusIndex, focusElement, focusableElements.length]);

  return {
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
  };
};