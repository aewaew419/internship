"use client";

import { forwardRef, ButtonHTMLAttributes, useState } from "react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export interface DesktopButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "gradient" | "outline" | "ghost" | "danger";
  size?: "md" | "lg" | "xl";
  isLoading?: boolean;
  fullWidth?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  enableHoverEffects?: boolean;
  showTooltip?: boolean;
  tooltipText?: string;
}

const DesktopButton = forwardRef<HTMLButtonElement, DesktopButtonProps>(
  ({ 
    className, 
    variant = "primary", 
    size = "lg", 
    isLoading = false,
    fullWidth = false,
    loadingText,
    icon,
    iconPosition = "left",
    disabled,
    children,
    enableHoverEffects = true,
    showTooltip = false,
    tooltipText,
    ...props 
  }, ref) => {
    const [showTooltipState, setShowTooltipState] = useState(false);

    const isDesktop = useMediaQuery("(min-width: 1024px)");
    const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");

    const baseClasses = [
      "inline-flex items-center justify-center rounded-lg font-medium",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "relative overflow-hidden group",
      "transition-all duration-200",
    ];

    // Enhanced hover effects for desktop
    const hoverEffects = enableHoverEffects && isDesktop ? [
      "hover:scale-105 hover:shadow-lg",
      "active:scale-100",
      "transform-gpu", // Use GPU acceleration
    ] : [];

    const variants = {
      primary: cn(
        "bg-primary-600 text-white shadow-sm",
        "hover:bg-primary-700 focus-visible:ring-primary-500",
        enableHoverEffects && isDesktop && "hover:shadow-lg"
      ),
      secondary: cn(
        "bg-secondary-600 text-white shadow-sm",
        "hover:bg-secondary-700 focus-visible:ring-secondary-500",
        enableHoverEffects && isDesktop && "hover:shadow-lg"
      ),
      gradient: cn(
        "bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-sm",
        "hover:from-primary-700 hover:to-secondary-700 focus-visible:ring-primary-500",
        enableHoverEffects && isDesktop && "hover:shadow-lg"
      ),
      outline: cn(
        "border-2 border-primary-600 bg-white text-primary-600",
        "hover:bg-primary-50 active:bg-primary-100 focus-visible:ring-primary-500",
        enableHoverEffects && isDesktop && "hover:border-primary-700 hover:shadow-md"
      ),
      ghost: cn(
        "text-primary-600",
        "hover:bg-primary-50 active:bg-primary-100 focus-visible:ring-primary-500",
        enableHoverEffects && isDesktop && "hover:shadow-sm"
      ),
      danger: cn(
        "bg-red-600 text-white shadow-sm",
        "hover:bg-red-700 focus-visible:ring-red-500",
        enableHoverEffects && isDesktop && "hover:shadow-lg"
      ),
    };

    // Enhanced sizes for desktop/tablet
    const sizes = {
      md: cn(
        "h-10 px-4 py-2 text-sm gap-2",
        isTablet && "h-11 px-5 text-base",
        isDesktop && "h-12 px-6 text-base gap-3"
      ),
      lg: cn(
        "h-12 px-6 text-base gap-2",
        isTablet && "h-13 px-7 text-lg",
        isDesktop && "h-14 px-8 text-lg gap-3"
      ),
      xl: cn(
        "h-14 px-8 text-lg gap-3",
        isTablet && "h-15 px-9 text-xl",
        isDesktop && "h-16 px-10 text-xl gap-4"
      ),
    };

    const classes = cn(
      baseClasses,
      hoverEffects,
      variants[variant],
      sizes[size],
      fullWidth && "w-full",
      className
    );

    const renderIcon = (position: "left" | "right") => {
      if (!icon || iconPosition !== position) return null;
      
      const iconSize = cn(
        "flex-shrink-0",
        size === "md" && (isDesktop ? "w-5 h-5" : "w-4 h-4"),
        size === "lg" && (isDesktop ? "w-6 h-6" : "w-5 h-5"),
        size === "xl" && (isDesktop ? "w-7 h-7" : "w-6 h-6")
      );
      
      return (
        <span className={iconSize}>
          {icon}
        </span>
      );
    };

    const renderLoadingSpinner = () => {
      const spinnerSize = cn(
        "animate-spin flex-shrink-0",
        size === "md" && (isDesktop ? "w-5 h-5" : "w-4 h-4"),
        size === "lg" && (isDesktop ? "w-6 h-6" : "w-5 h-5"),
        size === "xl" && (isDesktop ? "w-7 h-7" : "w-6 h-6")
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

    // Tooltip handlers
    const handleMouseEnter = () => {
      if (showTooltip && tooltipText && isDesktop) {
        setShowTooltipState(true);
      }
    };

    const handleMouseLeave = () => {
      setShowTooltipState(false);
    };

    return (
      <div className="relative inline-block">
        <button
          className={classes}
          ref={ref}
          disabled={disabled || isLoading}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          aria-label={props['aria-label'] || (typeof children === 'string' ? children : undefined)}
          {...props}
        >
          {/* Ripple effect for desktop */}
          {enableHoverEffects && isDesktop && (
            <span className="absolute inset-0 overflow-hidden rounded-lg">
              <span className="absolute inset-0 bg-white opacity-0 group-active:opacity-20 transition-opacity duration-150 rounded-lg"></span>
            </span>
          )}
          
          {isLoading ? (
            <>
              {renderLoadingSpinner()}
              <span className="ml-2">
                {loadingText || children}
              </span>
            </>
          ) : (
            <>
              {renderIcon("left")}
              <span>
                {children}
              </span>
              {renderIcon("right")}
            </>
          )}
        </button>

        {/* Tooltip */}
        {showTooltip && tooltipText && showTooltipState && isDesktop && (
          <div className={cn(
            "absolute z-50 px-3 py-2 text-sm text-white",
            "bg-gray-900 rounded-lg shadow-lg",
            "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
            "opacity-100 visible",
            "transition-all duration-200",
            "pointer-events-none whitespace-nowrap"
          )}>
            {tooltipText}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

DesktopButton.displayName = "DesktopButton";

export { DesktopButton };