"use client";

import { forwardRef } from "react";
import { Input, InputProps } from "./Input";
import { cn } from "@/lib/utils";

export interface FieldProps extends Omit<InputProps, 'error'> {
  name: string;
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: string) => string | null;
  };
  errors?: Record<string, string>;
  touched?: Record<string, boolean>;
  showValidation?: boolean;
}

const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ 
    name,
    validation,
    errors = {},
    touched = {},
    showValidation = true,
    className,
    ...props 
  }, ref) => {
    const hasError = showValidation && touched[name] && errors[name];
    const errorMessage = hasError ? errors[name] : undefined;

    // Add required indicator to label if validation requires it
    const enhancedLabel = validation?.required && props.label 
      ? `${props.label} *` 
      : props.label;

    return (
      <Input
        ref={ref}
        name={name}
        label={enhancedLabel}
        error={errorMessage}
        className={cn(
          hasError && "animate-pulse",
          className
        )}
        {...props}
      />
    );
  }
);

Field.displayName = "Field";

export { Field };