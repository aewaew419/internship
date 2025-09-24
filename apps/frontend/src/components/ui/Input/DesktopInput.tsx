"use client";

import { forwardRef, InputHTMLAttributes, useState } from "react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/useMediaQuery";

export interface DesktopInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  variant?: "default" | "filled" | "outlined";
  size?: "md" | "lg";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
  enableHoverEffects?: boolean;
}

const DesktopInput = forwardRef<HTMLInputElement, DesktopInputProps>(
  ({ 
    className, 
    type = "text", 
    label, 
    error, 
    helperText,
    fullWidth = false,
    variant = "default",
    size = "lg",
    leftIcon,
    rightIcon,
    showPasswordToggle = false,
    enableHoverEffects = true,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const isDesktop = useMediaQuery("(min-width: 1024px)");
    const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");

    const inputType = showPasswordToggle && type === "password" 
      ? (showPassword ? "text" : "password") 
      : type;

    // Enhanced variants with desktop hover effects
    const variants = {
      default: cn(
        "border border-gray-300 bg-white",
        "focus:border-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-1",
        enableHoverEffects && isDesktop && "hover:border-gray-400 hover:shadow-sm"
      ),
      filled: cn(
        "border-0 bg-gray-100",
        "focus:bg-white focus:ring-2 focus:ring-primary-500",
        enableHoverEffects && isDesktop && "hover:bg-gray-200"
      ),
      outlined: cn(
        "border-2 border-gray-300 bg-transparent",
        "focus:border-primary-500 focus:ring-2 focus:ring-primary-500",
        enableHoverEffects && isDesktop && "hover:border-gray-400"
      ),
    };

    // Responsive sizes optimized for desktop/tablet
    const sizes = {
      md: cn(
        "h-10 px-3 py-2 text-sm",
        isTablet && "h-11 px-4 text-base",
        isDesktop && "h-12 px-4 text-base"
      ),
      lg: cn(
        "h-12 px-4 py-3 text-base",
        isTablet && "h-13 px-5 text-base",
        isDesktop && "h-14 px-6 text-lg"
      ),
    };

    const inputClasses = cn(
      [
        "flex w-full rounded-lg transition-all duration-200",
        "ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "placeholder:text-gray-500 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
      ],
      variants[variant],
      sizes[size],
      leftIcon && (isDesktop ? "pl-12" : "pl-10"),
      (rightIcon || showPasswordToggle) && (isDesktop ? "pr-12" : "pr-10"),
      error && "border-red-500 focus:border-red-500 focus:ring-red-500",
      isFocused && !error && "ring-2 ring-primary-500",
      className
    );

    return (
      <div className={cn("space-y-2", isDesktop && "space-y-3", fullWidth && "w-full")}>
        {label && (
          <label className={cn(
            "block font-medium leading-none",
            isDesktop ? "text-base" : "text-sm",
            error ? "text-red-600" : "text-gray-700"
          )}>
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className={cn(
              "absolute top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none",
              isDesktop ? "left-4 w-6 h-6" : "left-3 w-5 h-5"
            )}>
              {leftIcon}
            </div>
          )}
          
          <input
            type={inputType}
            className={inputClasses}
            ref={ref}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />
          
          {(rightIcon || showPasswordToggle) && (
            <div className={cn(
              "absolute top-1/2 transform -translate-y-1/2 text-gray-400",
              isDesktop ? "right-4 w-6 h-6" : "right-3 w-5 h-5"
            )}>
              {showPasswordToggle && type === "password" ? (
                <button
                  type="button"
                  className={cn(
                    "pointer-events-auto text-gray-400 transition-colors duration-200",
                    "hover:text-gray-600 focus:outline-none",
                    isDesktop && "p-2 -m-2 rounded-md hover:bg-gray-100"
                  )}
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className={isDesktop ? "w-6 h-6" : "w-5 h-5"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className={isDesktop ? "w-6 h-6" : "w-5 h-5"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className={cn("space-y-1", isDesktop && "space-y-2")}>
            {error && (
              <p className={cn(
                "text-red-600 flex items-center gap-2",
                isDesktop ? "text-base" : "text-sm"
              )}>
                <svg className={isDesktop ? "w-5 h-5" : "w-4 h-4"} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
            {helperText && !error && (
              <p className={cn("text-gray-500", isDesktop ? "text-base" : "text-sm")}>
                {helperText}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

DesktopInput.displayName = "DesktopInput";

export { DesktopInput };