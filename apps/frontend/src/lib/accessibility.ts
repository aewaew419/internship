/**
 * Accessibility utilities for authentication components
 * Provides comprehensive a11y support including keyboard navigation,
 * screen reader compatibility, and visual accessibility features
 */

// ARIA role definitions for authentication components
export const ARIA_ROLES = {
  FORM: 'form',
  ALERT: 'alert',
  ALERTDIALOG: 'alertdialog',
  BUTTON: 'button',
  TEXTBOX: 'textbox',
  DIALOG: 'dialog',
  PROGRESSBAR: 'progressbar',
  STATUS: 'status',
  REGION: 'region',
  BANNER: 'banner',
  MAIN: 'main',
  NAVIGATION: 'navigation',
  COMPLEMENTARY: 'complementary',
} as const;

// ARIA properties for enhanced accessibility
export const ARIA_PROPERTIES = {
  DESCRIBEDBY: 'aria-describedby',
  LABELLEDBY: 'aria-labelledby',
  LABEL: 'aria-label',
  EXPANDED: 'aria-expanded',
  HIDDEN: 'aria-hidden',
  LIVE: 'aria-live',
  ATOMIC: 'aria-atomic',
  RELEVANT: 'aria-relevant',
  BUSY: 'aria-busy',
  INVALID: 'aria-invalid',
  REQUIRED: 'aria-required',
  AUTOCOMPLETE: 'aria-autocomplete',
  CURRENT: 'aria-current',
  PRESSED: 'aria-pressed',
  SELECTED: 'aria-selected',
  DISABLED: 'aria-disabled',
  READONLY: 'aria-readonly',
  MULTILINE: 'aria-multiline',
  PLACEHOLDER: 'aria-placeholder',
  VALUEMIN: 'aria-valuemin',
  VALUEMAX: 'aria-valuemax',
  VALUENOW: 'aria-valuenow',
  VALUETEXT: 'aria-valuetext',
  ORIENTATION: 'aria-orientation',
  SORT: 'aria-sort',
  LEVEL: 'aria-level',
  SETSIZE: 'aria-setsize',
  POSINSET: 'aria-posinset',
} as const;

// Screen reader announcements for authentication flows
export const SCREEN_READER_MESSAGES = {
  LOGIN: {
    FORM_LOADED: 'เข้าสู่ระบบ ฟอร์มพร้อมใช้งาน',
    VALIDATION_ERROR: 'พบข้อผิดพลาดในการกรอกข้อมูล',
    SUBMITTING: 'กำลังเข้าสู่ระบบ กรุณารอสักครู่',
    SUCCESS: 'เข้าสู่ระบบสำเร็จ กำลังนำทางไปหน้าหลัก',
    FAILED: 'เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบข้อมูลและลองใหม่',
    FIELD_VALID: 'ข้อมูลถูกต้อง',
    FIELD_INVALID: 'ข้อมูลไม่ถูกต้อง',
    PASSWORD_SHOWN: 'รหัสผ่านแสดงให้เห็น',
    PASSWORD_HIDDEN: 'รหัสผ่านถูกซ่อน',
  },
  REGISTRATION: {
    FORM_LOADED: 'สมัครสมาชิก ฟอร์มพร้อมใช้งาน',
    STEP_CHANGED: 'เปลี่ยนขั้นตอนการสมัครสมาชิก',
    VALIDATION_ERROR: 'พบข้อผิดพลาดในการกรอกข้อมูล',
    SUBMITTING: 'กำลังสมัครสมาชิก กรุณารอสักครู่',
    SUCCESS: 'สมัครสมาชิกสำเร็จ กำลังนำทางไปหน้าหลัก',
    FAILED: 'สมัครสมาชิกไม่สำเร็จ กรุณาตรวจสอบข้อมูลและลองใหม่',
    AVAILABILITY_CHECKING: 'กำลังตรวจสอบความพร้อมใช้งาน',
    AVAILABILITY_AVAILABLE: 'ข้อมูลพร้อมใช้งาน',
    AVAILABILITY_UNAVAILABLE: 'ข้อมูลไม่พร้อมใช้งาน',
  },
  NAVIGATION: {
    SKIP_TO_CONTENT: 'ข้ามไปยังเนื้อหาหลัก',
    SKIP_TO_NAVIGATION: 'ข้ามไปยังเมนูนำทาง',
    BACK_TO_TOP: 'กลับไปด้านบน',
    PREVIOUS_STEP: 'ขั้นตอนก่อนหน้า',
    NEXT_STEP: 'ขั้นตอนถัดไป',
  },
  MODAL: {
    OPENED: 'หน้าต่างป๊อปอัพเปิดขึ้น',
    CLOSED: 'หน้าต่างป๊อปอัพปิดลง',
    CLOSE_INSTRUCTION: 'กด Escape เพื่อปิดหน้าต่าง',
  },
} as const;

// Keyboard navigation constants
export const KEYBOARD_KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  TAB: 'Tab',
  ESCAPE: 'Escape',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const;

// Focus management utilities
export class FocusManager {
  private static focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
  ].join(', ');

  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll(this.focusableSelectors));
  }

  static getFirstFocusableElement(container: HTMLElement): HTMLElement | null {
    const focusableElements = this.getFocusableElements(container);
    return focusableElements[0] || null;
  }

  static getLastFocusableElement(container: HTMLElement): HTMLElement | null {
    const focusableElements = this.getFocusableElements(container);
    return focusableElements[focusableElements.length - 1] || null;
  }

  static trapFocus(container: HTMLElement, event: KeyboardEvent): void {
    if (event.key !== KEYBOARD_KEYS.TAB) return;

    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  }

  static restoreFocus(previousActiveElement: HTMLElement | null): void {
    if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
      previousActiveElement.focus();
    }
  }
}

// Screen reader announcement utility
export class ScreenReaderAnnouncer {
  private static instance: ScreenReaderAnnouncer;
  private announceElement: HTMLElement | null = null;

  static getInstance(): ScreenReaderAnnouncer {
    if (!this.instance) {
      this.instance = new ScreenReaderAnnouncer();
    }
    return this.instance;
  }

  private constructor() {
    this.createAnnounceElement();
  }

  private createAnnounceElement(): void {
    if (typeof document === 'undefined') return;

    this.announceElement = document.createElement('div');
    this.announceElement.setAttribute('aria-live', 'polite');
    this.announceElement.setAttribute('aria-atomic', 'true');
    this.announceElement.setAttribute('aria-relevant', 'text');
    this.announceElement.style.position = 'absolute';
    this.announceElement.style.left = '-10000px';
    this.announceElement.style.width = '1px';
    this.announceElement.style.height = '1px';
    this.announceElement.style.overflow = 'hidden';
    document.body.appendChild(this.announceElement);
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.announceElement) return;

    this.announceElement.setAttribute('aria-live', priority);
    this.announceElement.textContent = message;

    // Clear the message after announcement
    setTimeout(() => {
      if (this.announceElement) {
        this.announceElement.textContent = '';
      }
    }, 1000);
  }

  announceError(message: string): void {
    this.announce(message, 'assertive');
  }
}

// High contrast mode detection and utilities
export class HighContrastManager {
  private static mediaQuery: MediaQueryList | null = null;
  private static callbacks: Set<(isHighContrast: boolean) => void> = new Set();

  static init(): void {
    if (typeof window === 'undefined') return;

    // Check for Windows high contrast mode
    this.mediaQuery = window.matchMedia('(prefers-contrast: high), (-ms-high-contrast: active)');
    this.mediaQuery.addEventListener('change', this.handleChange);
    
    // Initial check
    this.handleChange();
  }

  private static handleChange = (): void => {
    const isHighContrast = this.mediaQuery?.matches || false;
    this.callbacks.forEach(callback => callback(isHighContrast));
    
    // Apply high contrast class to document
    if (isHighContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  };

  static subscribe(callback: (isHighContrast: boolean) => void): () => void {
    this.callbacks.add(callback);
    
    // Call immediately with current state
    callback(this.isHighContrast());
    
    return () => {
      this.callbacks.delete(callback);
    };
  }

  static isHighContrast(): boolean {
    return this.mediaQuery?.matches || false;
  }

  static cleanup(): void {
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', this.handleChange);
    }
    this.callbacks.clear();
  }
}

// Reduced motion detection
export class MotionManager {
  private static mediaQuery: MediaQueryList | null = null;
  private static callbacks: Set<(prefersReducedMotion: boolean) => void> = new Set();

  static init(): void {
    if (typeof window === 'undefined') return;

    this.mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.mediaQuery.addEventListener('change', this.handleChange);
    
    // Initial check
    this.handleChange();
  }

  private static handleChange = (): void => {
    const prefersReducedMotion = this.mediaQuery?.matches || false;
    this.callbacks.forEach(callback => callback(prefersReducedMotion));
    
    // Apply reduced motion class to document
    if (prefersReducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  };

  static subscribe(callback: (prefersReducedMotion: boolean) => void): () => void {
    this.callbacks.add(callback);
    
    // Call immediately with current state
    callback(this.prefersReducedMotion());
    
    return () => {
      this.callbacks.delete(callback);
    };
  }

  static prefersReducedMotion(): boolean {
    return this.mediaQuery?.matches || false;
  }

  static cleanup(): void {
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', this.handleChange);
    }
    this.callbacks.clear();
  }
}

// Accessibility validation utilities
export const AccessibilityValidator = {
  validateAriaLabel(element: HTMLElement): boolean {
    return !!(
      element.getAttribute('aria-label') ||
      element.getAttribute('aria-labelledby') ||
      element.textContent?.trim()
    );
  },

  validateFormField(field: HTMLInputElement): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check for label association
    if (!field.labels?.length && !field.getAttribute('aria-label') && !field.getAttribute('aria-labelledby')) {
      issues.push('Field lacks proper labeling');
    }

    // Check for error description
    if (field.getAttribute('aria-invalid') === 'true' && !field.getAttribute('aria-describedby')) {
      issues.push('Invalid field lacks error description');
    }

    // Check for required field indication
    if (field.required && !field.getAttribute('aria-required')) {
      issues.push('Required field lacks aria-required attribute');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  },

  validateButton(button: HTMLButtonElement): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check for accessible name
    if (!this.validateAriaLabel(button)) {
      issues.push('Button lacks accessible name');
    }

    // Check for loading state accessibility
    if (button.getAttribute('aria-busy') === 'true' && !button.getAttribute('aria-describedby')) {
      issues.push('Loading button lacks status description');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  },
};

// Color contrast utilities
export const ColorContrastUtils = {
  // Calculate relative luminance
  getRelativeLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  // Calculate contrast ratio between two colors
  getContrastRatio(color1: [number, number, number], color2: [number, number, number]): number {
    const l1 = this.getRelativeLuminance(...color1);
    const l2 = this.getRelativeLuminance(...color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  },

  // Check if contrast ratio meets WCAG standards
  meetsWCAGStandards(ratio: number, level: 'AA' | 'AAA' = 'AA', size: 'normal' | 'large' = 'normal'): boolean {
    if (level === 'AAA') {
      return size === 'large' ? ratio >= 4.5 : ratio >= 7;
    }
    return size === 'large' ? ratio >= 3 : ratio >= 4.5;
  },
};

// Initialize accessibility managers
export const initializeAccessibility = (): void => {
  if (typeof window !== 'undefined') {
    HighContrastManager.init();
    MotionManager.init();
    ScreenReaderAnnouncer.getInstance();
  }
};

// Cleanup accessibility managers
export const cleanupAccessibility = (): void => {
  HighContrastManager.cleanup();
  MotionManager.cleanup();
};