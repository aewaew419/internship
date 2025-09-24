"use client";

import { forwardRef, InputHTMLAttributes, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { 
  getTouchOptimizedClasses, 
  getOptimalInputType, 
  MOBILE_FIELD_CONFIGS,
  isMobileDevice,
  isTouchDevice 
} from "@/lib/responsive-utils";

export interface ResponsiveInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  variant?: "default" | "filled" | "outlined";
  size?: "sm" | "md" | "lg";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
  fieldType?: keyof typeof MOBILE_FIELD_CONFIGS;
  enableHapticFeedback?: boolean;
  mobileOptimized?: boolean;
}

const ResponsiveInput = forwardRef<HTMLInputElement, ResponsiveInputProps>(
  ({ 
    className, 
    type = "text", 
    label, 
    error, 
    helperText,
    fullWidth = false,
    variant = "default",
    size = "md",
    leftIcon,
    rightIcon,
    showPasswordToggle = false,
    fieldType,
    enableHapticFeedback = true,
    mobileOptimized = true,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isTouch, setIsTouch] = useState(false);

    const isMobileQuery = useMediaQuery("(max-width: 768px)");
    const isTabletQuery = useMediaQuery("(min-width: 769px) and (max-width: 1023px)");

    useEffect(() => {
      setIsMobile(isMobileDevice());
      setIsTouch(isTouchDevice());
    }, []);

    // Get optimal input configuration for mobile
    const optimalConfig = fieldType ? getOptimalInputType(fieldType) : {};
    
    const inputType = showPasswordToggle && type === "password" 
      ? (showPassword ? "text" : "password") 
      : optimalConfig.type || type;

    // Enhanced variants with mobile considerations
    const variants = {
      default: cn(
        "border border-gray-300 bg-white",
        "focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-1",
        isMobileQuery && "focus:ring-offset-0" // Reduce ring offset on mobile
      ),
      filled: cn(
        "border-0 bg-gray-100",
        "focus:bg-white focus:ring-2 focus:ring-primary-500",
        isMobileQuery && "focus:ring-offset-0"
      ),
      outlined: cn(
        "border-2 border-gray-300 bg-transparent",
        "focus:border-primary-500 focus:ring-2 focus:ring-primary-500",
        isMobileQuery && "focus:ring-offset-0"
      ),
    };

    // Responsive sizes with mobile-first approach
    const sizes = {
      sm: cn(
        "h-9 px-3 text-sm min-h-[36px]",
        isMobileQuery && "h-10 min-h-[40px] text-base", // Larger on mobile to prevent zoom
        isTabletQuery && "h-10 min-h-[42px]"
      ),
      md: cn(
        "h-10 px-3 py-2 text-base min-h-[44px]",
        isMobileQuery && "h-12 min-h-[48px] px-4 text-base", // Comfortable touch target
        isTabletQuery && "h-11 min-h-[46px]"
      ),
      lg: cn(
        "h-12 px-4 py-3 text-lg min-h-[48px]",
        isMobileQuery && "h-14 min-h-[56px] px-5 text-lg", // Large touch target
        isTabletQuery && "h-13 min-h-[52px]"
      ),
    };

    const inputClasses = cn(
      [
        "flex w-full rounded-lg transition-all duration-200",
        "ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "placeholder:text-gray-500 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
      ],
      // Mobile-specific optimizations
      mobileOptimized && [
        ...getTouchOptimizedClasses(size),
        isMobile && "font-size-adjust-none", // Prevent font size adjustment on iOS
        isTouch && "user-select-none", // Prevent text selection on touch devices
      ],
      variants[variant],
      sizes[size],
      leftIcon && (isMobileQuery ? "pl-12" : "pl-10"),
      (rightIcon || showPasswordToggle) && (isMobileQuery ? "pr-12" : "pr-10"),
      error && "border-red-500 focus:border-red-500 focus:ring-red-500",
      isFocused && !error && "ring-2 ring-primary-500",
      className
    );

    const containerClasses = cn(
      "space-y-1.5",
      isMobileQuery && "space-y-2", // More spacing on mobile
      fullWidth && "w-full"
    );

    // Responsive icon positioning
    const iconClasses = cn(
      "absolute top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none",
      isMobileQuery && "w-6 h-6", // Larger icons on mobile
      !isMobileQuery && "w-5 h-5"
    );
    
    const leftIconClasses = cn(
      iconClasses, 
      isMobileQuery ? "left-4" : "left-3"
    );
    
    const rightIconClasses = cn(
      iconClasses, 
      isMobileQuery ? "right-4" : "right-3"
    );

    // Handle haptic feedback on mobile
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      
      // Haptic feedback on mobile devices
      if (enableHapticFeedback && isMobile && 'vibrate' in navigator) {
        navigator.vibrate(10); // Very subtle vibration
      }
      
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    // Enhanced password toggle for mobile
    const handlePasswordToggle = () => {
      setShowPassword(!showPassword);
      
      // Haptic feedback for password toggle
      if (enableHapticFeedback && isMobile && 'vibrate' in navigator) {
        navigator.vibrate(15);
      }
    };

    return (
      <div className={containerClasses}>
        {label && (
          <label className={cn(
            "block font-medium leading-none",
            "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            // Responsive label sizing
            isMobileQuery ? "text-base" : "text-sm",
            error ? "text-red-600" : "text-gray-700"
          )}>
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className={leftIconClasses}>
              {leftIcon}
            </div>
          )}
          
          <input
            type={inputType}
            className={inputClasses}
            ref={ref}
            onFocus={handleFocus}
            onBlur={handleBlur}
            // Apply mobile optimizations
            {...(mobileOptimized && optimalConfig)}
            // Prevent zoom on iOS by ensuring font-size is at least 16px
            style={{
              fontSize: isMobile && size === 'sm' ? '16px' : undefined,
              ...props.style
            }}
            {...props}
          />
          
          {(rightIcon || showPasswordToggle) && (
            <div className={rightIconClasses}>
              {showPasswordToggle && type === "password" ? (
                <button
                  type="button"
                  className={cn(
                    "pointer-events-auto text-gray-400 hover:text-gray-600 focus:outline-none",
                    "transition-colors duration-200",
                    // Enhanced touch target for mobile
                    isMobileQuery && [
                      "p-2 -m-2", // Larger touch area
                      "min-w-[44px] min-h-[44px]",
                      "flex items-center justify-center"
                    ]
                  )}
                  onClick={handlePasswordToggle}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg 
                      className={isMobileQuery ? "w-6 h-6" : "w-5 h-5"} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg 
                      className={isMobileQuery ? "w-6 h-6" : "w-5 h-5"} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              ) : rightIcon}
            </div>
          )}
        </div>
        
        {(error || helperText) && (
          <div className={cn(
            "space-y-1",
            isMobileQuery && "space-y-1.5" // More spacing on mobile
          )}>
            {error && (
              <p className={cn(
                "text-red-600 flex items-center gap-1.5",
                isMobileQuery ? "text-base" : "text-sm"
              )}>
                <svg 
                  className={cn(
                    "flex-shrink-0",
                    isMobileQuery ? "w-5 h-5" : "w-4 h-4"
                  )} 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
            {helperText && !error && (
              <p className={cn(
                "text-gray-500",
                isMobileQuery ? "text-base" : "text-sm"
              )}>
                {helperText}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

ResponsiveInput.displayName = "ResponsiveInput";

export { ResponsiveInput };