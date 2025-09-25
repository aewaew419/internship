"use client";

import { forwardRef, InputHTMLAttributes, useState, useEffect, useId } from "react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useScreenReader, useHighContrast, useReducedMotion, useFocusVisible } from "@/hooks/useAccessibility";
import { 
  getTouchOptimizedClasses, 
  getOptimalInputType, 
  MOBILE_FIELD_CONFIGS,
  isMobileDevice,
  isTouchDevice 
} from "@/lib/responsive-utils";
import { ARIA_PROPERTIES } from "@/lib/accessibility";

export interface AccessibleInputProps extends InputHTMLAttributes<HTMLInputElement> {
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
  // Accessibility specific props
  labelHidden?: boolean;
  errorAnnouncement?: boolean;
  validationIcon?: boolean;
  describedBy?: string;
  autoComplete?: string;
}

const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
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
    labelHidden = false,
    errorAnnouncement = true,
    validationIcon = true,
    describedBy,
    autoComplete,
    required,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isTouch, setIsTouch] = useState(false);

    const isMobileQuery = useMediaQuery("(max-width: 768px)");
    const isTabletQuery = useMediaQuery("(min-width: 769px) and (max-width: 1023px)");
    
    // Accessibility hooks
    const { announcePasswordVisibility, announceFormValidation } = useScreenReader();
    const isHighContrast = useHighContrast();
    const prefersReducedMotion = useReducedMotion();
    const { isFocusVisible, isKeyboardUser } = useFocusVisible();

    // Generate unique IDs for accessibility
    const inputId = useId();
    const errorId = useId();
    const helperId = useId();
    const labelId = useId();

    useEffect(() => {
      setIsMobile(isMobileDevice());
      setIsTouch(isTouchDevice());
    }, []);

    // Get optimal input configuration for mobile
    const optimalConfig = fieldType ? getOptimalInputType(fieldType) : {};
    
    const inputType = showPasswordToggle && type === "password" 
      ? (showPassword ? "text" : "password") 
      : optimalConfig.type || type;

    // Enhanced variants with accessibility considerations
    const variants = {
      default: cn(
        "border border-gray-300 bg-white",
        "focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-1",
        // High contrast mode support
        isHighContrast && [
          "border-2 border-black",
          "focus:border-blue-600 focus:ring-4 focus:ring-blue-200",
          "bg-white text-black"
        ],
        // Enhanced focus indicators for keyboard users
        isKeyboardUser && isFocusVisible && [
          "focus:ring-4 focus:ring-primary-300",
          "focus:border-primary-600"
        ],
        isMobileQuery && "focus:ring-offset-0"
      ),
      filled: cn(
        "border-0 bg-gray-100",
        "focus:bg-white focus:ring-2 focus:ring-primary-500",
        isHighContrast && [
          "bg-gray-200 border-2 border-gray-600",
          "focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-200"
        ],
        isKeyboardUser && isFocusVisible && "focus:ring-4 focus:ring-primary-300",
        isMobileQuery && "focus:ring-offset-0"
      ),
      outlined: cn(
        "border-2 border-gray-300 bg-transparent",
        "focus:border-primary-500 focus:ring-2 focus:ring-primary-500",
        isHighContrast && [
          "border-3 border-black",
          "focus:border-blue-600 focus:ring-4 focus:ring-blue-200"
        ],
        isKeyboardUser && isFocusVisible && "focus:ring-4 focus:ring-primary-300",
        isMobileQuery && "focus:ring-offset-0"
      ),
    };

    // Responsive sizes with accessibility considerations
    const sizes = {
      sm: cn(
        "h-9 px-3 text-sm min-h-[36px]",
        isMobileQuery && "h-10 min-h-[44px] text-base px-4", // Larger touch targets
        isTabletQuery && "h-10 min-h-[42px]",
        // Ensure minimum touch target size for accessibility
        "min-w-[44px]"
      ),
      md: cn(
        "h-10 px-3 py-2 text-base min-h-[44px]",
        isMobileQuery && "h-12 min-h-[48px] px-4 text-base",
        isTabletQuery && "h-11 min-h-[46px]",
        "min-w-[44px]"
      ),
      lg: cn(
        "h-12 px-4 py-3 text-lg min-h-[48px]",
        isMobileQuery && "h-14 min-h-[56px] px-5 text-lg",
        isTabletQuery && "h-13 min-h-[52px]",
        "min-w-[44px]"
      ),
    };

    const inputClasses = cn(
      [
        "flex w-full rounded-lg transition-all",
        prefersReducedMotion ? "transition-none" : "duration-200",
        "ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "placeholder:text-gray-500 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        // Enhanced accessibility styles
        "focus:outline-none focus:ring-2",
        // High contrast mode adjustments
        isHighContrast && "placeholder:text-gray-800",
      ],
      // Mobile-specific optimizations
      mobileOptimized && [
        ...getTouchOptimizedClasses(size),
        isMobile && "font-size-adjust-none",
        isTouch && "user-select-none",
      ],
      variants[variant],
      sizes[size],
      leftIcon && (isMobileQuery ? "pl-12" : "pl-10"),
      (rightIcon || showPasswordToggle) && (isMobileQuery ? "pr-12" : "pr-10"),
      error && [
        "border-red-500 focus:border-red-500 focus:ring-red-500",
        isHighContrast && "border-red-700 focus:border-red-700 focus:ring-red-300"
      ],
      isFocused && !error && "ring-2 ring-primary-500",
      className
    );

    const containerClasses = cn(
      "space-y-1.5",
      isMobileQuery && "space-y-2",
      fullWidth && "w-full"
    );

    // Enhanced icon positioning with accessibility
    const iconClasses = cn(
      "absolute top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none",
      isMobileQuery && "w-6 h-6",
      !isMobileQuery && "w-5 h-5",
      isHighContrast && "text-gray-700"
    );
    
    const leftIconClasses = cn(iconClasses, isMobileQuery ? "left-4" : "left-3");
    const rightIconClasses = cn(iconClasses, isMobileQuery ? "right-4" : "right-3");

    // Handle focus with accessibility announcements
    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      
      // Haptic feedback on mobile devices
      if (enableHapticFeedback && isMobile && 'vibrate' in navigator) {
        navigator.vibrate(10);
      }
      
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      props.onBlur?.(e);
    };

    // Enhanced password toggle with accessibility
    const handlePasswordToggle = () => {
      const newShowPassword = !showPassword;
      setShowPassword(newShowPassword);
      
      // Announce password visibility change
      announcePasswordVisibility(newShowPassword);
      
      // Haptic feedback for password toggle
      if (enableHapticFeedback && isMobile && 'vibrate' in navigator) {
        navigator.vibrate(15);
      }
    };

    // Handle validation announcements
    useEffect(() => {
      if (errorAnnouncement && error) {
        announceFormValidation(false, label);
      }
    }, [error, errorAnnouncement, announceFormValidation, label]);

    // Build aria-describedby
    const ariaDescribedBy = [
      error ? errorId : null,
      helperText ? helperId : null,
      describedBy
    ].filter(Boolean).join(' ') || undefined;

    // Validation icon component
    const ValidationIcon = () => {
      if (!validationIcon || !props.value) return null;

      if (error) {
        return (
          <svg 
            className={cn(
              "text-red-500",
              isMobileQuery ? "w-6 h-6" : "w-5 h-5",
              isHighContrast && "text-red-700"
            )} 
            fill="currentColor" 
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      }

      return (
        <svg 
          className={cn(
            "text-green-500",
            isMobileQuery ? "w-6 h-6" : "w-5 h-5",
            isHighContrast && "text-green-700"
          )} 
          fill="currentColor" 
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      );
    };

    return (
      <div className={containerClasses}>
        {label && (
          <label 
            htmlFor={inputId}
            id={labelId}
            className={cn(
              "block font-medium leading-none",
              "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              isMobileQuery ? "text-base" : "text-sm",
              error ? "text-red-600" : "text-gray-700",
              isHighContrast && (error ? "text-red-800" : "text-black"),
              labelHidden && "sr-only"
            )}
          >
            {label}
            {required && (
              <span 
                className={cn(
                  "ml-1 text-red-500",
                  isHighContrast && "text-red-800"
                )}
                aria-label="required"
              >
                *
              </span>
            )}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className={leftIconClasses} aria-hidden="true">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={inputClasses}
            onFocus={handleFocus}
            onBlur={handleBlur}
            aria-invalid={!!error}
            aria-required={required}
            aria-describedby={ariaDescribedBy}
            aria-labelledby={label ? labelId : undefined}
            autoComplete={autoComplete || optimalConfig.autoComplete}
            // Apply mobile optimizations
            {...(mobileOptimized && optimalConfig)}
            // Prevent zoom on iOS by ensuring font-size is at least 16px
            style={{
              fontSize: isMobile && size === 'sm' ? '16px' : undefined,
              ...props.style
            }}
            {...props}
          />
          
          {(rightIcon || showPasswordToggle || validationIcon) && (
            <div className={rightIconClasses}>
              {showPasswordToggle && type === "password" ? (
                <button
                  type="button"
                  className={cn(
                    "pointer-events-auto text-gray-400 hover:text-gray-600 focus:outline-none",
                    "transition-colors",
                    prefersReducedMotion ? "transition-none" : "duration-200",
                    "focus:ring-2 focus:ring-primary-500 rounded",
                    isHighContrast && "text-gray-700 hover:text-black focus:ring-blue-500",
                    isMobileQuery && [
                      "p-2 -m-2",
                      "min-w-[44px] min-h-[44px]",
                      "flex items-center justify-center"
                    ]
                  )}
                  onClick={handlePasswordToggle}
                  tabIndex={-1}
                  aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <svg 
                      className={isMobileQuery ? "w-6 h-6" : "w-5 h-5"} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg 
                      className={isMobileQuery ? "w-6 h-6" : "w-5 h-5"} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              ) : validationIcon ? (
                <ValidationIcon />
              ) : (
                rightIcon
              )}
            </div>
          )}
        </div>
        
        {/* Error message with proper ARIA attributes */}
        {error && (
          <div 
            id={errorId}
            role="alert"
            aria-live="polite"
            className={cn(
              "text-red-600 flex items-center gap-1.5",
              isMobileQuery ? "text-base" : "text-sm",
              isHighContrast && "text-red-800"
            )}
          >
            <svg 
              className={cn(
                "flex-shrink-0",
                isMobileQuery ? "w-5 h-5" : "w-4 h-4"
              )} 
              fill="currentColor" 
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Helper text */}
        {helperText && !error && (
          <div 
            id={helperId}
            className={cn(
              "text-gray-500",
              isMobileQuery ? "text-base" : "text-sm",
              isHighContrast && "text-gray-800"
            )}
          >
            {helperText}
          </div>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = "AccessibleInput";

export { AccessibleInput };