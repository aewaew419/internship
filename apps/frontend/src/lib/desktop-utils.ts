/**
 * Desktop and Tablet Enhancement Utilities
 * Enhanced features for larger screen devices
 */

// Desktop-specific keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  SUBMIT_FORM: ['Enter'],
  CANCEL_ACTION: ['Escape'],
  NEXT_FIELD: ['Tab'],
  PREVIOUS_FIELD: ['Shift+Tab'],
  TOGGLE_PASSWORD: ['Alt+KeyP'],
  FOCUS_SEARCH: ['Ctrl+KeyK', 'Cmd+KeyK'],
} as const;

// Desktop layout configurations
export const DESKTOP_LAYOUTS = {
  FORM_CONTAINER: {
    maxWidth: 'max-w-lg',
    padding: 'px-8 py-10',
    spacing: 'space-y-6',
    shadow: 'shadow-xl',
  },
  CARD_LAYOUT: {
    maxWidth: 'max-w-2xl',
    padding: 'px-12 py-16',
    spacing: 'space-y-8',
    shadow: 'shadow-2xl',
  },
} as const;

// Tablet-specific configurations
export const TABLET_LAYOUTS = {
  FORM_CONTAINER: {
    maxWidth: 'max-w-md',
    padding: 'px-6 py-8',
    spacing: 'space-y-5',
    shadow: 'shadow-lg',
  },
  TWO_COLUMN: {
    gridCols: 'grid-cols-2',
    gap: 'gap-6',
    spacing: 'space-y-5',
  },
} as const;

// Hover state configurations
export const HOVER_STATES = {
  BUTTON: {
    scale: 'hover:scale-105',
    shadow: 'hover:shadow-lg',
    brightness: 'hover:brightness-110',
    transition: 'transition-all duration-200',
  },
  INPUT: {
    borderColor: 'hover:border-primary-400',
    shadow: 'hover:shadow-sm',
    transition: 'transition-all duration-150',
  },
  CARD: {
    scale: 'hover:scale-102',
    shadow: 'hover:shadow-xl',
    transition: 'transition-all duration-300',
  },
} as const;

// Desktop form enhancements
export const getDesktopFormClasses = (variant: 'default' | 'card' = 'default') => {
  const layouts = {
    default: DESKTOP_LAYOUTS.FORM_CONTAINER,
    card: DESKTOP_LAYOUTS.CARD_LAYOUT,
  };
  
  const layout = layouts[variant];
  
  return [
    'w-full',
    layout.maxWidth,
    'mx-auto',
    layout.padding,
    layout.spacing,
    layout.shadow,
    'bg-white',
    'rounded-xl',
    'border border-gray-200',
    HOVER_STATES.CARD.transition,
  ].join(' ');
};

// Enhanced button classes for desktop
export const getDesktopButtonClasses = (
  variant: 'primary' | 'secondary' | 'outline' = 'primary',
  size: 'md' | 'lg' | 'xl' = 'lg'
) => {
  const baseClasses = [
    'inline-flex items-center justify-center',
    'font-medium rounded-lg',
    'transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    HOVER_STATES.BUTTON.transition,
  ];
  
  const variants = {
    primary: [
      'bg-gradient-to-r from-primary-600 to-secondary-600',
      'text-white shadow-sm',
      'hover:from-primary-700 hover:to-secondary-700',
      'hover:shadow-lg hover:scale-105',
      'active:scale-100',
      'focus-visible:ring-primary-500',
    ],
    secondary: [
      'bg-white text-gray-700 border border-gray-300',
      'hover:bg-gray-50 hover:border-gray-400',
      'hover:shadow-md hover:scale-105',
      'active:scale-100',
      'focus-visible:ring-gray-500',
    ],
    outline: [
      'border-2 border-primary-600 bg-transparent text-primary-600',
      'hover:bg-primary-50 hover:border-primary-700',
      'hover:shadow-md hover:scale-105',
      'active:scale-100',
      'focus-visible:ring-primary-500',
    ],
  };
  
  const sizes = {
    md: 'h-10 px-4 py-2 text-sm',
    lg: 'h-12 px-6 py-3 text-base',
    xl: 'h-14 px-8 py-4 text-lg',
  };
  
  return [
    ...baseClasses,
    ...variants[variant],
    sizes[size],
  ].join(' ');
};