/**
 * Responsive Design Utilities
 * Mobile-first responsive design utilities for authentication forms
 */

// Touch target constants (following iOS and Android guidelines)
export const TOUCH_TARGETS = {
  MIN_SIZE: 44, // Minimum touch target size in pixels
  COMFORTABLE_SIZE: 48, // Comfortable touch target size
  LARGE_SIZE: 56, // Large touch target for primary actions
  SPACING: 8, // Minimum spacing between touch targets
} as const;

// Responsive breakpoints (matching Tailwind config)
export const BREAKPOINTS = {
  xs: 320,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// Mobile-specific input modes for better UX
export const INPUT_MODES = {
  NUMERIC: 'numeric' as const,
  EMAIL: 'email' as const,
  TEL: 'tel' as const,
  URL: 'url' as const,
  SEARCH: 'search' as const,
  TEXT: 'text' as const,
} as const;

// Keyboard types for mobile devices
export const KEYBOARD_TYPES = {
  DEFAULT: 'default' as const,
  NUMERIC: 'numeric' as const,
  EMAIL: 'email-address' as const,
  PHONE: 'phone-pad' as const,
  URL: 'url' as const,
} as const;

// Autocomplete values for better mobile experience
export const AUTOCOMPLETE_VALUES = {
  // Authentication
  USERNAME: 'username',
  EMAIL: 'email',
  CURRENT_PASSWORD: 'current-password',
  NEW_PASSWORD: 'new-password',
  
  // Personal information
  GIVEN_NAME: 'given-name',
  FAMILY_NAME: 'family-name',
  NAME: 'name',
  
  // Contact information
  TEL: 'tel',
  
  // Common
  OFF: 'off',
  ON: 'on',
} as const;

// Mobile-optimized form field configurations
export const MOBILE_FIELD_CONFIGS = {
  STUDENT_ID: {
    inputMode: INPUT_MODES.NUMERIC,
    autoComplete: AUTOCOMPLETE_VALUES.USERNAME,
    pattern: '[0-9]*',
    maxLength: 10,
  },
  EMAIL: {
    inputMode: INPUT_MODES.EMAIL,
    autoComplete: AUTOCOMPLETE_VALUES.EMAIL,
    type: 'email',
  },
  PASSWORD: {
    autoComplete: AUTOCOMPLETE_VALUES.CURRENT_PASSWORD,
    type: 'password',
  },
  NEW_PASSWORD: {
    autoComplete: AUTOCOMPLETE_VALUES.NEW_PASSWORD,
    type: 'password',
  },
  FIRST_NAME: {
    autoComplete: AUTOCOMPLETE_VALUES.GIVEN_NAME,
    type: 'text',
  },
  LAST_NAME: {
    autoComplete: AUTOCOMPLETE_VALUES.FAMILY_NAME,
    type: 'text',
  },
} as const;

// Responsive spacing utilities
export const RESPONSIVE_SPACING = {
  FORM_PADDING: {
    mobile: 'p-4',
    tablet: 'p-6',
    desktop: 'p-8',
  },
  FORM_GAP: {
    mobile: 'space-y-4',
    tablet: 'space-y-5',
    desktop: 'space-y-6',
  },
  BUTTON_SPACING: {
    mobile: 'gap-3',
    tablet: 'gap-4',
    desktop: 'gap-4',
  },
} as const;

// Mobile-optimized form layouts
export const FORM_LAYOUTS = {
  MOBILE: {
    maxWidth: 'max-w-sm',
    padding: 'px-4 py-6',
    spacing: 'space-y-4',
  },
  TABLET: {
    maxWidth: 'max-w-md',
    padding: 'px-6 py-8',
    spacing: 'space-y-5',
  },
  DESKTOP: {
    maxWidth: 'max-w-lg',
    padding: 'px-8 py-10',
    spacing: 'space-y-6',
  },
} as const;

// Touch optimization utilities
export const getTouchOptimizedClasses = (size: 'sm' | 'md' | 'lg' = 'md') => {
  const baseClasses = [
    'touch-manipulation', // Improves touch responsiveness
    'select-none', // Prevents text selection on touch
    'active:scale-95', // Subtle press feedback
    'transition-transform duration-150', // Smooth animations
  ];

  const sizeClasses = {
    sm: ['min-h-[36px]', 'min-w-[36px]'],
    md: ['min-h-[44px]', 'min-w-[44px]'], // iOS/Android recommended minimum
    lg: ['min-h-[48px]', 'min-w-[48px]'],
  };

  return [...baseClasses, ...sizeClasses[size]];
};

// Responsive text sizes
export const getResponsiveTextSize = (element: 'heading' | 'body' | 'caption' | 'button') => {
  const textSizes = {
    heading: 'text-xl sm:text-2xl lg:text-3xl',
    body: 'text-base sm:text-lg',
    caption: 'text-sm sm:text-base',
    button: 'text-base sm:text-lg',
  };

  return textSizes[element];
};

// Mobile-specific validation feedback
export const MOBILE_VALIDATION = {
  DEBOUNCE_DELAY: 300, // Milliseconds to wait before validating
  SHOW_SUCCESS_DELAY: 100, // Delay before showing success state
  HAPTIC_FEEDBACK: true, // Enable haptic feedback on mobile
} as const;

// Responsive modal sizes
export const MODAL_SIZES = {
  MOBILE: 'w-full max-w-sm mx-4',
  TABLET: 'w-full max-w-md mx-6',
  DESKTOP: 'w-full max-w-lg mx-8',
} as const;

// Utility function to detect mobile device
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// Utility function to detect touch device
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// Utility function to get optimal input type for mobile
export const getOptimalInputType = (fieldType: keyof typeof MOBILE_FIELD_CONFIGS) => {
  const config = MOBILE_FIELD_CONFIGS[fieldType];
  return {
    type: config.type || 'text',
    inputMode: config.inputMode || INPUT_MODES.TEXT,
    autoComplete: config.autoComplete || AUTOCOMPLETE_VALUES.OFF,
    ...(config.pattern && { pattern: config.pattern }),
    ...(config.maxLength && { maxLength: config.maxLength }),
  };
};

// Responsive form container classes
export const getResponsiveFormClasses = () => {
  return [
    'w-full',
    'max-w-sm sm:max-w-md lg:max-w-lg',
    'mx-auto',
    'px-4 sm:px-6 lg:px-8',
    'py-6 sm:py-8 lg:py-10',
  ].join(' ');
};

// Mobile-optimized button classes
export const getMobileButtonClasses = (variant: 'primary' | 'secondary' = 'primary') => {
  const baseClasses = [
    'w-full',
    'min-h-[48px]', // Comfortable touch target
    'px-6 py-3',
    'text-base font-medium',
    'rounded-lg',
    'transition-all duration-200',
    'touch-manipulation',
    'active:scale-95',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
  ];

  const variantClasses = {
    primary: [
      'bg-gradient-to-r from-primary-600 to-secondary-600',
      'text-white',
      'hover:from-primary-700 hover:to-secondary-700',
      'active:from-primary-800 active:to-secondary-800',
      'focus:ring-primary-500',
      'shadow-sm hover:shadow-md',
    ],
    secondary: [
      'border-2 border-primary-600',
      'bg-white text-primary-600',
      'hover:bg-primary-50',
      'active:bg-primary-100',
      'focus:ring-primary-500',
    ],
  };

  return [...baseClasses, ...variantClasses[variant]].join(' ');
};