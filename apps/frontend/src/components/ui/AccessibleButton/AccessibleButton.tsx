"use client";

import { forwardRef, ButtonHTMLAttributes, useEffect, useState, useId } from "react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useScreenReader, useHighContrast, useReducedMotion, useFocusVisible, useKeyboardNavigation } from "@/hooks/useAccessibility";
import { 
  getTouchOptimizedClasses, 
  getMobileButtonClasses,
  isMobileDevice,
  isTouchDevice 
} from "@/lib/responsive-utils";

export interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "gradient" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  isLoading?: boolean;
  fullWidth?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  enableHapticFeedback?: boolean;
  mobileOptimized?: boolean;
  touchOptimized?: boolean;
  // Accessibility specific props
  loadingAnnouncement?: boolean;
  describedBy?: string;
  expanded?: boolean;
  pressed?: boolean;
  controls?: string;
  hasPopup?: boolean | "menu" | "listbox" | "tree" | "grid" | "dialog";
}

const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({ 
    className, 
    variant = "primary", 
    size = "md", 
    isLoading = false,
    fullWidth = false,
    loadingText,
    icon,
    iconPosition = "left",
    disabled,
    children,
    enableHapticFeedback = true,
    mobileOptimized = true,
    touchOptimized = true,
    loadingAnnouncement = true,
    describedBy,
    expanded,
    pressed,
    controls,
    hasPopup,
    onClick,
    onKeyDown,
    ...props 
  }, ref) => {
    const [isMobile, setIsMobile] = useState(false);
    const [isTouch, setIsTouch] = useState(false);
    const [wasLoadingAnnounced, setWasLoadingAnnounced] = useState(false);

    const isMobileQuery = useMediaQuery("(max-width: 768px)");
    const isTabletQuery = useMediaQuery("(min-width: 769px) and (max-width: 1023px)");
    
    // Accessibility hooks
    const { announce } = useScreenReader();
    const isHighContrast = useHighContrast();
    const prefersReducedMotion = useReducedMotion();
    const { isFocusVisible, isKeyboardUser } = useFocusVisible();

    // Generate unique ID for accessibility
    const buttonId = useId();
    const loadingId = useId();

    useEffect(() => {
      setIsMobile(isMobileDevice());
      setIsTouch(isTouchDevice());
    }, []);

    // Announce loading state changes
    useEffect(() => {
      if (loadingAnnouncement && isLoading && !wasLoadingAnnounced) {
        announce(loadingText || 'กำลังดำเนินการ กรุณารอสักครู่', 'polite');
        setWasLoadingAnnounced(true);
      } else if (!isLoading && wasLoadingAnnounced) {
        setWasLoadingAnnounced(false);
      }
    }, [isLoading, loadingAnnouncement, loadingText, announce, wasLoadingAnnounced]);

    // Keyboard navigation
    const { handleKeyDown: handleKeyboardNav } = useKeyboardNavigation(
      () => {
        // Handle Enter key
        if (!disabled && !isLoading && onClick) {
          const syntheticEvent = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
          }) as any;
          onClick(syntheticEvent);
        }
      }
    );

    const baseClasses = [
      "inline-flex items-center justify-center rounded-lg font-medium",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "relative overflow-hidden",
      // Enhanced transitions with reduced motion support
      prefersReducedMotion ? "transition-none" : "transition-all duration-200",
      // Enhanced focus indicators for keyboard users
      isKeyboardUser && isFocusVisible && [
        "focus:ring-4 focus:ring-offset-2",
        "focus:outline-2 focus:outline-offset-2"
      ],
    ];

    // Enhanced mobile optimizations with accessibility
    const mobileOptimizations = mobileOptimized ? [
      ...getTouchOptimizedClasses(size),
      isMobile && "font-size-adjust-none",
      isTouch && "cursor-pointer",
      // Enhanced press feedback for mobile with accessibility considerations
      prefersReducedMotion ? "" : "active:scale-95 active:shadow-inner",
      prefersReducedMotion ? "" : "transition-all duration-150 ease-out",
      // Ensure minimum touch target size
      "min-w-[44px] min-h-[44px]",
    ] : [];

    const variants = {
      primary: cn(
        "bg-primary-600 text-white shadow-sm",
        "hover:bg-primary-700 hover:shadow-md",
        "active:bg-primary-800 active:shadow-sm",
        "focus-visible:ring-primary-500",
        // High contrast mode support
        isHighContrast && [
          "bg-blue-700 border-2 border-blue-800",
          "hover:bg-blue-800 focus:bg-blue-800",
          "focus:ring-4 focus:ring-blue-300 focus:border-blue-900",
          "text-white"
        ],
        isMobileQuery && "shadow-mobile hover:shadow-mobile-lg"
      ),
      secondary: cn(
        "bg-secondary-600 text-white shadow-sm",
        "hover:bg-secondary-700 hover:shadow-md",
        "active:bg-secondary-800 active:shadow-sm",
        "focus-visible:ring-secondary-500",
        isHighContrast && [
          "bg-gray-700 border-2 border-gray-800",
          "hover:bg-gray-800 focus:bg-gray-800",
          "focus:ring-4 focus:ring-gray-300 focus:border-gray-900"
        ],
        isMobileQuery && "shadow-mobile hover:shadow-mobile-lg"
      ),
      gradient: cn(
        "bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-sm",
        "hover:from-primary-700 hover:to-secondary-700 hover:shadow-md",
        "active:from-primary-800 active:to-secondary-800 active:shadow-sm",
        "focus-visible:ring-primary-500",
        isHighContrast && [
          "bg-blue-700 border-2 border-blue-800",
          "hover:bg-blue-800 focus:bg-blue-800",
          "focus:ring-4 focus:ring-blue-300"
        ],
        isMobileQuery && "shadow-mobile hover:shadow-mobile-lg"
      ),
      outline: cn(
        "border-2 border-primary-600 bg-white text-primary-600",
        "hover:bg-primary-50 active:bg-primary-100",
        "focus-visible:ring-primary-500",
        isHighContrast && [
          "border-3 border-blue-700 bg-white text-blue-800",
          "hover:bg-blue-50 focus:bg-blue-50",
          "focus:ring-4 focus:ring-blue-300 focus:border-blue-900"
        ],
        isMobileQuery && "border-2"
      ),
      ghost: cn(
        "text-primary-600",
        "hover:bg-primary-50 active:bg-primary-100",
        "focus-visible:ring-primary-500",
        isHighContrast && [
          "text-blue-800 border-2 border-transparent",
          "hover:bg-blue-50 hover:border-blue-300",
          "focus:bg-blue-50 focus:border-blue-700",
          "focus:ring-4 focus:ring-blue-300"
        ]
      ),
      danger: cn(
        "bg-red-600 text-white shadow-sm",
        "hover:bg-red-700 hover:shadow-md",
        "active:bg-red-800 active:shadow-sm",
        "focus-visible:ring-red-500",
        isHighContrast && [
          "bg-red-700 border-2 border-red-800",
          "hover:bg-red-800 focus:bg-red-800",
          "focus:ring-4 focus:ring-red-300 focus:border-red-900"
        ],
        isMobileQuery && "shadow-mobile hover:shadow-mobile-lg"
      ),
    };

    // Responsive sizes with accessibility considerations
    const sizes = {
      sm: cn(
        "h-9 px-3 text-sm min-h-[36px] gap-1.5",
        isMobileQuery && "h-10 px-4 text-base min-h-[44px] gap-2",
        isTabletQuery && "h-10 px-3.5 min-h-[42px]",
        "min-w-[44px]" // Ensure minimum touch target
      ),
      md: cn(
        "h-10 px-4 py-2 min-h-[44px] gap-2",
        isMobileQuery && "h-12 px-6 text-base min-h-[48px] gap-2.5",
        isTabletQuery && "h-11 px-5 min-h-[46px]",
        "min-w-[44px]"
      ),
      lg: cn(
        "h-12 px-6 text-lg min-h-[48px] gap-2.5",
        isMobileQuery && "h-14 px-8 text-lg min-h-[56px] gap-3",
        isTabletQuery && "h-13 px-7 min-h-[52px]",
        "min-w-[44px]"
      ),
      xl: cn(
        "h-14 px-8 text-xl min-h-[56px] gap-3",
        isMobileQuery && "h-16 px-10 text-xl min-h-[64px] gap-3.5",
        isTabletQuery && "h-15 px-9 min-h-[60px]",
        "min-w-[44px]"
      ),
    };

    const classes = cn(
      baseClasses,
      mobileOptimizations,
      variants[variant],
      sizes[size],
      fullWidth && "w-full",
      className
    );

    const renderIcon = (position: "left" | "right") => {
      if (!icon || iconPosition !== position) return null;
      
      const iconSize = cn(
        "flex-shrink-0",
        size === "sm" && (isMobileQuery ? "w-5 h-5" : "w-4 h-4"),
        size === "md" && (isMobileQuery ? "w-6 h-6" : "w-5 h-5"),
        size === "lg" && (isMobileQuery ? "w-7 h-7" : "w-6 h-6"),
        size === "xl" && (isMobileQuery ? "w-8 h-8" : "w-7 h-7")
      );
      
      return (
        <span className={iconSize} aria-hidden="true">
          {icon}
        </span>
      );
    };

    const renderLoadingSpinner = () => {
      const spinnerSize = cn(
        "flex-shrink-0",
        prefersReducedMotion ? "" : "animate-spin",
        size === "sm" && (isMobileQuery ? "w-5 h-5" : "w-4 h-4"),
        size === "md" && (isMobileQuery ? "w-6 h-6" : "w-5 h-5"),
        size === "lg" && (isMobileQuery ? "w-7 h-7" : "w-6 h-6"),
        size === "xl" && (isMobileQuery ? "w-8 h-8" : "w-7 h-7")
      );

      return (
        <svg
          className={spinnerSize}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      );
    };

    // Enhanced click handler with accessibility
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Haptic feedback on mobile devices
      if (enableHapticFeedback && isMobile && 'vibrate' in navigator && !disabled && !isLoading) {
        navigator.vibrate(20);
      }

      // Call original onClick handler
      if (!disabled && !isLoading) {
        onClick?.(e);
      }
    };

    // Enhanced keyboard handler
    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
      handleKeyboardNav(e as any);
      onKeyDown?.(e);
    };

    // Build aria-describedby
    const ariaDescribedBy = [
      isLoading ? loadingId : null,
      describedBy
    ].filter(Boolean).join(' ') || undefined;

    return (
      <>
        <button
          ref={ref}
          id={buttonId}
          className={classes}
          disabled={disabled || isLoading}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          aria-busy={isLoading}
          aria-disabled={disabled || isLoading}
          aria-describedby={ariaDescribedBy}
          aria-expanded={expanded}
          aria-pressed={pressed}
          aria-controls={controls}
          aria-haspopup={hasPopup}
          aria-label={props['aria-label'] || (typeof children === 'string' ? children : undefined)}
          {...props}
        >
          {isLoading ? (
            <>
              {renderLoadingSpinner()}
              <span className={cn(
                "ml-2",
                isMobileQuery && size === 'sm' && "text-base"
              )}>
                {loadingText || children}
              </span>
            </>
          ) : (
            <>
              {renderIcon("left")}
              <span className={cn(
                isMobileQuery && size === 'sm' && "text-base"
              )}>
                {children}
              </span>
              {renderIcon("right")}
            </>
          )}
        </button>

        {/* Hidden loading status for screen readers */}
        {isLoading && (
          <div
            id={loadingId}
            className="sr-only"
            aria-live="polite"
            aria-atomic="true"
          >
            {loadingText || 'กำลังดำเนินการ'}
          </div>
        )}
      </>
    );
  }
);

AccessibleButton.displayName = "AccessibleButton";

export { AccessibleButton };