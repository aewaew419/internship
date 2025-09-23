"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "gradient" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "xl";
  isLoading?: boolean;
  fullWidth?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
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
    ...props 
  }, ref) => {
    const baseClasses = [
      "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
      "disabled:pointer-events-none disabled:opacity-50",
      "touch-manipulation select-none", // Improves touch responsiveness on mobile
      "active:scale-95", // Subtle press feedback for mobile
      "relative overflow-hidden", // For ripple effect
    ];

    const variants = {
      primary: "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 focus-visible:ring-primary-500 shadow-sm hover:shadow-md",
      secondary: "bg-secondary-600 text-white hover:bg-secondary-700 active:bg-secondary-800 focus-visible:ring-secondary-500 shadow-sm hover:shadow-md",
      gradient: "bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:from-primary-700 hover:to-secondary-700 active:from-primary-800 active:to-secondary-800 shadow-sm hover:shadow-md",
      outline: "border-2 border-primary-600 bg-white text-primary-600 hover:bg-primary-50 active:bg-primary-100 focus-visible:ring-primary-500",
      ghost: "text-primary-600 hover:bg-primary-50 active:bg-primary-100 focus-visible:ring-primary-500",
      danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500 shadow-sm hover:shadow-md",
    };

    const sizes = {
      sm: "h-9 px-3 text-sm min-h-[36px] gap-1.5", // Minimum 36px for mobile touch targets
      md: "h-10 px-4 py-2 min-h-[44px] gap-2", // Minimum 44px for mobile touch targets  
      lg: "h-12 px-6 text-lg min-h-[48px] gap-2.5", // Larger for better mobile experience
      xl: "h-14 px-8 text-xl min-h-[56px] gap-3", // Extra large for primary actions on mobile
    };

    const classes = cn(
      baseClasses,
      variants[variant],
      sizes[size],
      fullWidth && "w-full",
      className
    );

    const renderIcon = (position: "left" | "right") => {
      if (!icon || iconPosition !== position) return null;
      return (
        <span className={cn(
          "flex-shrink-0",
          size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : size === "lg" ? "w-6 h-6" : "w-7 h-7"
        )}>
          {icon}
        </span>
      );
    };

    const renderLoadingSpinner = () => (
      <svg
        className={cn(
          "animate-spin flex-shrink-0",
          size === "sm" ? "w-4 h-4" : size === "md" ? "w-5 h-5" : size === "lg" ? "w-6 h-6" : "w-7 h-7"
        )}
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

    return (
      <button
        className={classes}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            {renderLoadingSpinner()}
            {loadingText || children}
          </>
        ) : (
          <>
            {renderIcon("left")}
            {children}
            {renderIcon("right")}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };