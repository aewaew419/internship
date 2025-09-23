"use client";

import { forwardRef, TextareaHTMLAttributes, useState } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  resize?: "none" | "vertical" | "horizontal" | "both";
  autoResize?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText,
    fullWidth = false,
    resize = "vertical",
    autoResize = false,
    rows = 3,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const resizeClasses = {
      none: "resize-none",
      vertical: "resize-y",
      horizontal: "resize-x",
      both: "resize",
    };

    const textareaClasses = cn(
      [
        "flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2",
        "text-base ring-offset-white transition-all duration-200",
        "placeholder:text-gray-500 focus-visible:outline-none focus:border-primary-500",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "touch-manipulation min-h-[88px]", // Larger minimum height for mobile
      ],
      resizeClasses[resize],
      error && "border-red-500 focus:border-red-500 focus:ring-red-500",
      isFocused && !error && "ring-2 ring-primary-500 ring-offset-2",
      autoResize && "overflow-hidden",
      className
    );

    const containerClasses = cn(
      "space-y-1.5",
      fullWidth && "w-full"
    );

    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
      if (autoResize) {
        const target = e.target as HTMLTextAreaElement;
        target.style.height = 'auto';
        target.style.height = `${target.scrollHeight}px`;
      }
      props.onInput?.(e);
    };

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
        
        <textarea
          className={textareaClasses}
          ref={ref}
          rows={rows}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          onInput={handleInput}
          {...props}
        />
        
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

Textarea.displayName = "Textarea";

export { Textarea };