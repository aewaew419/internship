"use client";

import { forwardRef, ButtonHTMLAttributes, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { 
  getTouchOptimizedClasses, 
  getMobileButtonClasses,
  isMobileDevice,
  isTouchDevice 
} from "@/lib/responsive-utils";

export interface ResponsiveButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
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
}

const ResponsiveButton = forwardRef<HTMLButtonElement, ResponsiveButtonProps>(
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
    onClick,
    ...props 
  }, ref) => {
    const [isMobile, setIsMobile] = useState(false);
    const [isTouch, setIsTouch] = useState(false);

    const isMobileQuery = useMediaQuery("(max-width: 768px)");
    const isTabletQuery = useMediaQuery("(min-width: 769px) and (max-width: 1023px)");

    useEffect(() => {
      setIsMobile(isMobileDevice());
      setIsTouch(isTouchDevice());
    }, []);

    const baseClasses = [
      "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "relative overflow-hidden", // For ripple effect
    ];

    // Enhanced mobile optimizations
    const mobileOptimizations = mobileOptimized ? [
      ...getTouchOptimizedClasses(size),
      isMobile && "font-size-adjust-none", // Prevent font size adjustment on iOS
      isTouch && "cursor-pointer", // Ensure pointer cursor on touch devices
      // Enhanced press feedback for mobile
      "active:scale-95 active:shadow-inner",
      "transition-all duration-150 ease-out",
    ] : [];

    const variants = {
      primary: cn(
        "bg-primary-600 text-white shadow-sm",
        "hover:bg-primary-700 hover:shadow-md",
        "active:bg-primary-800 active:shadow-sm",
        "focus-visible:ring-primary-500",
        // Mobile-specific enhancements
        isMobileQuery && "shadow-mobile hover:shadow-mobile-lg"
      ),
      secondary: cn(
        "bg-secondary-600 text-white shadow-sm",
        "hover:bg-secondary-700 hover:shadow-md",
        "active:bg-secondary-800 active:shadow-sm",
        "focus-visible:ring-secondary-500",
        isMobileQuery && "shadow-mobile hover:shadow-mobile-lg"
      ),
      gradient: cn(
        "bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-sm",
        "hover:from-primary-700 hover:to-secondary-700 hover:shadow-md",
        "active:from-primary-800 active:to-secondary-800 active:shadow-sm",
        "focus-visible:ring-primary-500",
        isMobileQuery && "shadow-mobile hover:shadow-mobile-lg"
      ),
      outline: cn(
        "border-2 border-primary-600 bg-white text-primary-600",
        "hover:bg-primary-50 active:bg-primary-100",
        "focus-visible:ring-primary-500",
        // Enhanced border for mobile
        isMobileQuery && "border-2"
      ),
      ghost: cn(
        "text-primary-600",
        "hover:bg-primary-50 active:bg-primary-100",
        "focus-visible:ring-primary-500"
      ),
      danger: cn(
        "bg-red-600 text-white shadow-sm",
        "hover:bg-red-700 hover:shadow-md",
        "active:bg-red-800 active:shadow-sm",
        "focus-visible:ring-red-500",
        isMobileQuery && "shadow-mobile hover:shadow-mobile-lg"
      ),
    };

    // Responsive sizes with mobile-first approach
    const sizes = {
      sm: cn(
        "h-9 px-3 text-sm min-h-[36px] gap-1.5",
        isMobileQuery && "h-10 px-4 text-base min-h-[40px] gap-2", // Larger on mobile
        isTabletQuery && "h-10 px-3.5 min-h-[38px]"
      ),
      md: cn(
        "h-10 px-4 py-2 min-h-[44px] gap-2",
        isMobileQuery && "h-12 px-6 text-base min-h-[48px] gap-2.5", // Comfortable touch target
        isTabletQuery && "h-11 px-5 min-h-[46px]"
      ),
      lg: cn(
        "h-12 px-6 text-lg min-h-[48px] gap-2.5",
        isMobileQuery && "h-14 px-8 text-lg min-h-[56px] gap-3", // Large touch target
        isTabletQuery && "h-13 px-7 min-h-[52px]"
      ),
      xl: cn(
        "h-14 px-8 text-xl min-h-[56px] gap-3",
        isMobileQuery && "h-16 px-10 text-xl min-h-[64px] gap-3.5", // Extra large for primary actions
        isTabletQuery && "h-15 px-9 min-h-[60px]"
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
      
      // Responsive icon sizing
      const iconSize = cn(
        "flex-shrink-0",
        size === "sm" && (isMobileQuery ? "w-5 h-5" : "w-4 h-4"),
        size === "md" && (isMobileQuery ? "w-6 h-6" : "w-5 h-5"),
        size === "lg" && (isMobileQuery ? "w-7 h-7" : "w-6 h-6"),
        size === "xl" && (isMobileQuery ? "w-8 h-8" : "w-7 h-7")
      );
      
      return (
        <span className={iconSize}>
          {icon}
        </span>
      );
    };

    const renderLoadingSpinner = () => {
      // Responsive spinner sizing
      const spinnerSize = cn(
        "animate-spin flex-shrink-0",
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

    // Enhanced click handler with haptic feedback
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Haptic feedback on mobile devices
      if (enableHapticFeedback && isMobile && 'vibrate' in navigator && !disabled && !isLoading) {
        navigator.vibrate(20); // Subtle vibration for button press
      }

      // Call original onClick handler
      onClick?.(e);
    };

    return (
      <button
        className={classes}
        ref={ref}
        disabled={disabled || isLoading}
        onClick={handleClick}
        // Enhanced accessibility for mobile
        aria-label={props['aria-label'] || (typeof children === 'string' ? children : undefined)}
        {...props}
      >
        {isLoading ? (
          <>
            {renderLoadingSpinner()}
            <span className={cn(
              "ml-2",
              // Responsive text sizing for loading state
              isMobileQuery && size === 'sm' && "text-base"
            )}>
              {loadingText || children}
            </span>
          </>
        ) : (
          <>
            {renderIcon("left")}
            <span className={cn(
              // Prevent text from being too small on mobile
              isMobileQuery && size === 'sm' && "text-base"
            )}>
              {children}
            </span>
            {renderIcon("right")}
          </>
        )}
      </button>
    );
  }
);

ResponsiveButton.displayName = "ResponsiveButton";

export { ResponsiveButton };