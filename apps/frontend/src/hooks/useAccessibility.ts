/**
 * React hooks for accessibility features
 * Provides comprehensive accessibility support for authentication components
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  FocusManager,
  ScreenReaderAnnouncer,
  HighContrastManager,
  MotionManager,
  KEYBOARD_KEYS,
  SCREEN_READER_MESSAGES,
} from '@/lib/accessibility';

// Hook for managing focus within a container (focus trap)
export const useFocusTrap = (isActive: boolean = true) => {
  const containerRef = useRef<HTMLElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Store the previously focused element
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    // Focus the first focusable element in the container
    const firstFocusable = FocusManager.getFirstFocusableElement(containerRef.current);
    if (firstFocusable) {
      firstFocusable.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (containerRef.current) {
        FocusManager.trapFocus(containerRef.current, event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restore focus to the previously focused element
      if (previousActiveElementRef.current) {
        FocusManager.restoreFocus(previousActiveElementRef.current);
      }
    };
  }, [isActive]);

  return containerRef;
};

// Hook for keyboard navigation
export const useKeyboardNavigation = (
  onEnter?: () => void,
  onEscape?: () => void,
  onArrowUp?: () => void,
  onArrowDown?: () => void,
  onArrowLeft?: () => void,
  onArrowRight?: () => void
) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    switch (event.key) {
      case KEYBOARD_KEYS.ENTER:
        if (onEnter) {
          event.preventDefault();
          onEnter();
        }
        break;
      case KEYBOARD_KEYS.ESCAPE:
        if (onEscape) {
          event.preventDefault();
          onEscape();
        }
        break;
      case KEYBOARD_KEYS.ARROW_UP:
        if (onArrowUp) {
          event.preventDefault();
          onArrowUp();
        }
        break;
      case KEYBOARD_KEYS.ARROW_DOWN:
        if (onArrowDown) {
          event.preventDefault();
          onArrowDown();
        }
        break;
      case KEYBOARD_KEYS.ARROW_LEFT:
        if (onArrowLeft) {
          event.preventDefault();
          onArrowLeft();
        }
        break;
      case KEYBOARD_KEYS.ARROW_RIGHT:
        if (onArrowRight) {
          event.preventDefault();
          onArrowRight();
        }
        break;
    }
  }, [onEnter, onEscape, onArrowUp, onArrowDown, onArrowLeft, onArrowRight]);

  return { handleKeyDown };
};

// Hook for screen reader announcements
export const useScreenReader = () => {
  const announcer = ScreenReaderAnnouncer.getInstance();

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    announcer.announce(message, priority);
  }, [announcer]);

  const announceError = useCallback((message: string) => {
    announcer.announceError(message);
  }, [announcer]);

  const announceFormValidation = useCallback((isValid: boolean, fieldName?: string) => {
    if (isValid) {
      announce(fieldName ? `${fieldName} ${SCREEN_READER_MESSAGES.LOGIN.FIELD_VALID}` : SCREEN_READER_MESSAGES.LOGIN.FIELD_VALID);
    } else {
      announceError(fieldName ? `${fieldName} ${SCREEN_READER_MESSAGES.LOGIN.FIELD_INVALID}` : SCREEN_READER_MESSAGES.LOGIN.FIELD_INVALID);
    }
  }, [announce, announceError]);

  const announceLoginStatus = useCallback((status: 'submitting' | 'success' | 'failed') => {
    switch (status) {
      case 'submitting':
        announce(SCREEN_READER_MESSAGES.LOGIN.SUBMITTING, 'assertive');
        break;
      case 'success':
        announce(SCREEN_READER_MESSAGES.LOGIN.SUCCESS, 'assertive');
        break;
      case 'failed':
        announceError(SCREEN_READER_MESSAGES.LOGIN.FAILED);
        break;
    }
  }, [announce, announceError]);

  const announceRegistrationStatus = useCallback((status: 'submitting' | 'success' | 'failed' | 'step-changed') => {
    switch (status) {
      case 'submitting':
        announce(SCREEN_READER_MESSAGES.REGISTRATION.SUBMITTING, 'assertive');
        break;
      case 'success':
        announce(SCREEN_READER_MESSAGES.REGISTRATION.SUCCESS, 'assertive');
        break;
      case 'failed':
        announceError(SCREEN_READER_MESSAGES.REGISTRATION.FAILED);
        break;
      case 'step-changed':
        announce(SCREEN_READER_MESSAGES.REGISTRATION.STEP_CHANGED);
        break;
    }
  }, [announce, announceError]);

  const announcePasswordVisibility = useCallback((isVisible: boolean) => {
    const message = isVisible 
      ? SCREEN_READER_MESSAGES.LOGIN.PASSWORD_SHOWN 
      : SCREEN_READER_MESSAGES.LOGIN.PASSWORD_HIDDEN;
    announce(message);
  }, [announce]);

  const announceAvailabilityCheck = useCallback((status: 'checking' | 'available' | 'unavailable', fieldName?: string) => {
    switch (status) {
      case 'checking':
        announce(fieldName ? `${fieldName} ${SCREEN_READER_MESSAGES.REGISTRATION.AVAILABILITY_CHECKING}` : SCREEN_READER_MESSAGES.REGISTRATION.AVAILABILITY_CHECKING);
        break;
      case 'available':
        announce(fieldName ? `${fieldName} ${SCREEN_READER_MESSAGES.REGISTRATION.AVAILABILITY_AVAILABLE}` : SCREEN_READER_MESSAGES.REGISTRATION.AVAILABILITY_AVAILABLE);
        break;
      case 'unavailable':
        announceError(fieldName ? `${fieldName} ${SCREEN_READER_MESSAGES.REGISTRATION.AVAILABILITY_UNAVAILABLE}` : SCREEN_READER_MESSAGES.REGISTRATION.AVAILABILITY_UNAVAILABLE);
        break;
    }
  }, [announce, announceError]);

  return {
    announce,
    announceError,
    announceFormValidation,
    announceLoginStatus,
    announceRegistrationStatus,
    announcePasswordVisibility,
    announceAvailabilityCheck,
  };
};

// Hook for high contrast mode detection
export const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const unsubscribe = HighContrastManager.subscribe(setIsHighContrast);
    return unsubscribe;
  }, []);

  return isHighContrast;
};

// Hook for reduced motion preference
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const unsubscribe = MotionManager.subscribe(setPrefersReducedMotion);
    return unsubscribe;
  }, []);

  return prefersReducedMotion;
};

// Hook for managing ARIA live regions
export const useAriaLiveRegion = (initialMessage: string = '') => {
  const [message, setMessage] = useState(initialMessage);
  const [priority, setPriority] = useState<'polite' | 'assertive'>('polite');
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const updateMessage = useCallback((newMessage: string, newPriority: 'polite' | 'assertive' = 'polite') => {
    setMessage(newMessage);
    setPriority(newPriority);
  }, []);

  const clearMessage = useCallback(() => {
    setMessage('');
  }, []);

  useEffect(() => {
    if (liveRegionRef.current && message) {
      // Clear and then set the message to ensure it's announced
      liveRegionRef.current.textContent = '';
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = message;
        }
      }, 10);
    }
  }, [message]);

  const LiveRegion = useCallback(() => (
    <div
      ref={liveRegionRef}
      aria-live={priority}
      aria-atomic="true"
      aria-relevant="text"
      className="sr-only"
    >
      {message}
    </div>
  ), [message, priority]);

  return {
    message,
    updateMessage,
    clearMessage,
    LiveRegion,
  };
};

// Hook for form accessibility
export const useFormAccessibility = (formId: string) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fieldDescriptions, setFieldDescriptions] = useState<Record<string, string>>({});
  const { announceFormValidation, announceError } = useScreenReader();

  const setFieldError = useCallback((fieldName: string, error: string) => {
    setErrors(prev => ({ ...prev, [fieldName]: error }));
    if (error) {
      announceFormValidation(false, fieldName);
    }
  }, [announceFormValidation]);

  const clearFieldError = useCallback((fieldName: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
    announceFormValidation(true, fieldName);
  }, [announceFormValidation]);

  const setFieldDescription = useCallback((fieldName: string, description: string) => {
    setFieldDescriptions(prev => ({ ...prev, [fieldName]: description }));
  }, []);

  const getFieldProps = useCallback((fieldName: string, isRequired: boolean = false) => {
    const hasError = !!errors[fieldName];
    const errorId = hasError ? `${formId}-${fieldName}-error` : undefined;
    const descriptionId = fieldDescriptions[fieldName] ? `${formId}-${fieldName}-description` : undefined;
    
    const describedBy = [errorId, descriptionId].filter(Boolean).join(' ') || undefined;

    return {
      id: `${formId}-${fieldName}`,
      'aria-invalid': hasError,
      'aria-required': isRequired,
      'aria-describedby': describedBy,
    };
  }, [formId, errors, fieldDescriptions]);

  const getErrorProps = useCallback((fieldName: string) => {
    const hasError = !!errors[fieldName];
    if (!hasError) return null;

    return {
      id: `${formId}-${fieldName}-error`,
      role: 'alert',
      'aria-live': 'polite' as const,
    };
  }, [formId, errors]);

  const getDescriptionProps = useCallback((fieldName: string) => {
    const hasDescription = !!fieldDescriptions[fieldName];
    if (!hasDescription) return null;

    return {
      id: `${formId}-${fieldName}-description`,
    };
  }, [formId, fieldDescriptions]);

  const announceFormErrors = useCallback(() => {
    const errorCount = Object.keys(errors).length;
    if (errorCount > 0) {
      announceError(`พบข้อผิดพลาด ${errorCount} รายการ กรุณาตรวจสอบและแก้ไข`);
    }
  }, [errors, announceError]);

  return {
    errors,
    fieldDescriptions,
    setFieldError,
    clearFieldError,
    setFieldDescription,
    getFieldProps,
    getErrorProps,
    getDescriptionProps,
    announceFormErrors,
  };
};

// Hook for skip links
export const useSkipLinks = () => {
  const skipToContent = useCallback(() => {
    const mainContent = document.getElementById('main-content') || document.querySelector('main');
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const skipToNavigation = useCallback(() => {
    const navigation = document.getElementById('main-navigation') || document.querySelector('nav');
    if (navigation) {
      navigation.focus();
      navigation.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  return {
    skipToContent,
    skipToNavigation,
  };
};

// Hook for managing focus indicators
export const useFocusVisible = () => {
  const [isFocusVisible, setIsFocusVisible] = useState(false);
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  useEffect(() => {
    let hadKeyboardEvent = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === KEYBOARD_KEYS.TAB) {
        hadKeyboardEvent = true;
        setIsKeyboardUser(true);
      }
    };

    const handleMouseDown = () => {
      hadKeyboardEvent = false;
      setIsKeyboardUser(false);
    };

    const handleFocus = () => {
      if (hadKeyboardEvent) {
        setIsFocusVisible(true);
      }
    };

    const handleBlur = () => {
      setIsFocusVisible(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, []);

  return {
    isFocusVisible,
    isKeyboardUser,
  };
};