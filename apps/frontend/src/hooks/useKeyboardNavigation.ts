"use client";

import { useEffect, useCallback } from "react";
import { useMediaQuery } from "./useMediaQuery";

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description?: string;
}

interface UseKeyboardNavigationOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

export const useKeyboardNavigation = (
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardNavigationOptions = {}
) => {
  const {
    enabled = true,
    preventDefault = true,
    stopPropagation = false,
  } = options;

  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Only enable keyboard shortcuts on desktop
      if (!enabled || !isDesktop) return;

      const matchingShortcut = shortcuts.find((shortcut) => {
        return (
          shortcut.key.toLowerCase() === event.key.toLowerCase() &&
          !!shortcut.ctrlKey === event.ctrlKey &&
          !!shortcut.altKey === event.altKey &&
          !!shortcut.shiftKey === event.shiftKey &&
          !!shortcut.metaKey === event.metaKey
        );
      });

      if (matchingShortcut) {
        if (preventDefault) {
          event.preventDefault();
        }
        if (stopPropagation) {
          event.stopPropagation();
        }
        matchingShortcut.action();
      }
    },
    [shortcuts, enabled, isDesktop, preventDefault, stopPropagation]
  );

  useEffect(() => {
    if (enabled && isDesktop) {
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [handleKeyDown, enabled, isDesktop]);

  return {
    isDesktop,
    shortcuts: isDesktop ? shortcuts : [],
  };
};

// Common keyboard shortcuts for authentication forms
export const useAuthFormKeyboardShortcuts = (callbacks: {
  onSubmit?: () => void;
  onCancel?: () => void;
  onTogglePassword?: () => void;
  onFocusNextField?: () => void;
  onFocusPreviousField?: () => void;
}) => {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: "Enter",
      action: callbacks.onSubmit || (() => {}),
      description: "Submit form",
    },
    {
      key: "Escape",
      action: callbacks.onCancel || (() => {}),
      description: "Cancel/Close",
    },
    {
      key: "p",
      altKey: true,
      action: callbacks.onTogglePassword || (() => {}),
      description: "Toggle password visibility",
    },
    {
      key: "Tab",
      action: callbacks.onFocusNextField || (() => {}),
      description: "Focus next field",
    },
    {
      key: "Tab",
      shiftKey: true,
      action: callbacks.onFocusPreviousField || (() => {}),
      description: "Focus previous field",
    },
  ];

  return useKeyboardNavigation(shortcuts);
};

// Hook for managing focus within forms
export const useFocusManagement = () => {
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  const focusFirstInput = useCallback(() => {
    if (!isDesktop) return;
    
    const firstInput = document.querySelector(
      'input:not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly]), select:not([disabled])'
    ) as HTMLElement;
    
    if (firstInput) {
      firstInput.focus();
    }
  }, [isDesktop]);

  const focusLastInput = useCallback(() => {
    if (!isDesktop) return;
    
    const inputs = document.querySelectorAll(
      'input:not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly]), select:not([disabled])'
    );
    
    const lastInput = inputs[inputs.length - 1] as HTMLElement;
    if (lastInput) {
      lastInput.focus();
    }
  }, [isDesktop]);

  const focusNextInput = useCallback((currentElement: HTMLElement) => {
    if (!isDesktop) return;
    
    const inputs = Array.from(
      document.querySelectorAll(
        'input:not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly]), select:not([disabled]), button:not([disabled])'
      )
    ) as HTMLElement[];
    
    const currentIndex = inputs.indexOf(currentElement);
    const nextInput = inputs[currentIndex + 1];
    
    if (nextInput) {
      nextInput.focus();
    }
  }, [isDesktop]);

  const focusPreviousInput = useCallback((currentElement: HTMLElement) => {
    if (!isDesktop) return;
    
    const inputs = Array.from(
      document.querySelectorAll(
        'input:not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly]), select:not([disabled]), button:not([disabled])'
      )
    ) as HTMLElement[];
    
    const currentIndex = inputs.indexOf(currentElement);
    const previousInput = inputs[currentIndex - 1];
    
    if (previousInput) {
      previousInput.focus();
    }
  }, [isDesktop]);

  const trapFocus = useCallback((containerElement: HTMLElement) => {
    if (!isDesktop) return () => {};
    
    const focusableElements = containerElement.querySelectorAll(
      'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    containerElement.addEventListener('keydown', handleTabKey);
    
    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    return () => {
      containerElement.removeEventListener('keydown', handleTabKey);
    };
  }, [isDesktop]);

  return {
    isDesktop,
    focusFirstInput,
    focusLastInput,
    focusNextInput,
    focusPreviousInput,
    trapFocus,
  };
};