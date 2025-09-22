"use client";

import { forwardRef, InputHTMLAttributes, useState } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  variant?: "default" | "filled" | "outlined";
  size?: "sm" | "md" | "lg";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
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
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const inputType = showPasswordToggle && type === "password" 
      ? (showPassword ? "text" : "password") 
      : type;

    const variants = {
      default: "border border-gray-300 bg-white focus:border-primary-500",
      filled: "border-0 bg-gray-100 focus:bg-white focus:ring-2 focus:ring-primary-500",
      outlined: "border-2 border-gray-300 bg-transparent focus:border-primary-500",
    };

    const sizes = {
      sm: "h-9 px-3 text-sm min-h-[36px]",
      md: "h-10 px-3 py-2 text-base min-h-[44px]", // Prevents zoom on iOS with text-base
      lg: "h-12 px-4 py-3 text-lg min-h-[48px]",
    };

    const inputClasses = cn(
      [
        "flex w-full rounded-lg transition-all duration-200",
        "ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "placeholder:text-gray-500 focus-visible:outline-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "touch-manipulation", // Improves touch responsiveness
      ],
      variants[variant],
      sizes[size],
      leftIcon && "pl-10",
      (rightIcon || showPasswordToggle) && "pr-10",
      error && "border-red-500 focus:border-red-500 focus:ring-red-500",
      isFocused && !error && "ring-2 ring-primary-500 ring-offset-2",
      className
    );

    const containerClasses = cn(
      "space-y-1.5",
      fullWidth && "w-full"
    );

    const iconClasses = "absolute top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none";
    const leftIconClasses = cn(iconClasses, "left-3");
    const rightIconClasses = cn(iconClasses, "right-3");

    return (
      <div className={containerClasses}>
        {label && (
          <label className={cn(
            "block text-sm font-medium leading-none",
            "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
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
            <div className={rightIconClasses}>
              {showPasswordToggle && type === "password" ? (
                <button
                  type="button"
                  className="pointer-events-auto text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="space-y-1">
            {error && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
            {helperText && !error && (
              <p className="text-sm text-gray-500">{helperText}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };