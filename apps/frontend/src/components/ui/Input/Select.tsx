"use client";

import { forwardRef, SelectHTMLAttributes, useState } from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  size?: "sm" | "md" | "lg";
  options: SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText,
    fullWidth = false,
    size = "md",
    options,
    placeholder,
    ...props 
  }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const sizes = {
      sm: "h-9 px-3 text-sm min-h-[36px]",
      md: "h-10 px-3 py-2 text-base min-h-[44px]",
      lg: "h-12 px-4 py-3 text-lg min-h-[48px]",
    };

    const selectClasses = cn(
      [
        "flex w-full rounded-lg border border-gray-300 bg-white transition-all duration-200",
        "focus-visible:outline-none focus:border-primary-500",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "touch-manipulation appearance-none cursor-pointer",
        "bg-no-repeat bg-right bg-[length:16px_16px] pr-10",
        // Custom dropdown arrow
        "bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTYgOUwxMiAxNUwxOCA5IiBzdHJva2U9IiM2QjcyODAiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=')]",
      ],
      sizes[size],
      error && "border-red-500 focus:border-red-500 focus:ring-red-500",
      isFocused && !error && "ring-2 ring-primary-500 ring-offset-2",
      className
    );

    const containerClasses = cn(
      "space-y-1.5",
      fullWidth && "w-full"
    );

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
        
        <select
          className={selectClasses}
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
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        
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

Select.displayName = "Select";

export { Select };