"use client";

import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "card";
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText,
    size = "md",
    variant = "default",
    ...props 
  }, ref) => {
    const sizes = {
      sm: "w-4 h-4",
      md: "w-5 h-5",
      lg: "w-6 h-6",
    };

    const checkboxClasses = cn(
      [
        "rounded border-2 border-gray-300 text-primary-600 transition-colors duration-200",
        "focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "touch-manipulation cursor-pointer",
        "checked:bg-primary-600 checked:border-primary-600",
      ],
      sizes[size],
      error && "border-red-500 focus:ring-red-500",
      className
    );

    const containerClasses = cn(
      "space-y-1.5",
      variant === "card" && [
        "p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors",
        "cursor-pointer select-none",
        error && "border-red-500",
      ]
    );

    const labelClasses = cn(
      "flex items-start gap-3 cursor-pointer select-none",
      size === "sm" && "text-sm",
      size === "md" && "text-base",
      size === "lg" && "text-lg",
      error ? "text-red-600" : "text-gray-700"
    );

    const content = (
      <>
        <input
          type="checkbox"
          className={checkboxClasses}
          ref={ref}
          {...props}
        />
        {label && (
          <div className="flex-1 min-w-0">
            <span className="block leading-tight">{label}</span>
            {helperText && !error && (
              <span className="text-sm text-gray-500 mt-1 block">{helperText}</span>
            )}
          </div>
        )}
      </>
    );

    return (
      <div className={containerClasses}>
        {variant === "card" ? (
          <label className={labelClasses}>
            {content}
          </label>
        ) : (
          <div className="space-y-1.5">
            <label className={labelClasses}>
              {content}
            </label>
          </div>
        )}
        
        {error && (
          <p className="text-sm text-red-600 flex items-center gap-1 ml-8">
            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox };