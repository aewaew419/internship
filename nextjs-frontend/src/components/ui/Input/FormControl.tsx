"use client";

import { forwardRef, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface FormControlProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  fullWidth?: boolean;
  orientation?: "vertical" | "horizontal";
  labelPosition?: "top" | "left" | "floating";
}

const FormControl = forwardRef<HTMLDivElement, FormControlProps>(
  ({ 
    children,
    label,
    error,
    helperText,
    required = false,
    fullWidth = false,
    orientation = "vertical",
    labelPosition = "top",
    className,
    ...props 
  }, ref) => {
    const containerClasses = cn(
      "form-control",
      orientation === "horizontal" ? "flex items-center gap-4" : "space-y-2",
      fullWidth && "w-full",
      className
    );

    const labelClasses = cn(
      "block text-sm font-medium leading-none",
      "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      error ? "text-red-600" : "text-gray-700",
      orientation === "horizontal" && labelPosition === "left" && "min-w-[120px] text-right",
      labelPosition === "floating" && "absolute top-2 left-3 bg-white px-1 text-xs transition-all duration-200"
    );

    const contentClasses = cn(
      orientation === "horizontal" && "flex-1"
    );

    const renderLabel = () => {
      if (!label) return null;
      
      return (
        <label className={labelClasses}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      );
    };

    const renderHelperText = () => {
      if (!helperText && !error) return null;
      
      return (
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
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              {helperText}
            </p>
          )}
        </div>
      );
    };

    if (orientation === "horizontal") {
      return (
        <div ref={ref} className={containerClasses} {...props}>
          {renderLabel()}
          <div className={contentClasses}>
            {children}
            {renderHelperText()}
          </div>
        </div>
      );
    }

    return (
      <div ref={ref} className={containerClasses} {...props}>
        {labelPosition === "top" && renderLabel()}
        <div className={cn("relative", labelPosition === "floating" && "pt-2")}>
          {labelPosition === "floating" && renderLabel()}
          {children}
        </div>
        {renderHelperText()}
      </div>
    );
  }
);

FormControl.displayName = "FormControl";

export { FormControl };