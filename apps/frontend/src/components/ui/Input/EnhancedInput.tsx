"use client";

import { forwardRef, InputHTMLAttributes, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Input, InputProps } from "./Input";

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => boolean;
  message: string;
}

export interface EnhancedInputProps extends Omit<InputProps, 'error'> {
  // Real-time validation props
  realTimeValidation?: boolean;
  validationDelay?: number;
  validationRules?: ValidationRule[];
  showValidationIcon?: boolean;
  
  // Mobile optimization props
  inputMode?: 'text' | 'email' | 'numeric' | 'tel' | 'url' | 'search';
  autoComplete?: string;
  
  // Validation state callbacks
  onValidationChange?: (isValid: boolean, error?: string) => void;
  
  // Override error to be controlled by validation
  error?: string;
  externalError?: string; // For server-side errors
}

interface ValidationState {
  isValid: boolean;
  isValidating: boolean;
  validationMessage?: string;
  touched: boolean;
}

const EnhancedInput = forwardRef<HTMLInputElement, EnhancedInputProps>(
  ({ 
    realTimeValidation = false,
    validationDelay = 300,
    validationRules = [],
    showValidationIcon = true,
    inputMode,
    autoComplete,
    onValidationChange,
    error,
    externalError,
    onBlur,
    onChange,
    value,
    ...props 
  }, ref) => {
    const [validationState, setValidationState] = useState<ValidationState>({
      isValid: true,
      isValidating: false,
      validationMessage: undefined,
      touched: false,
    });

    const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

    // Validation function
    const validateValue = useCallback((inputValue: string): { isValid: boolean; message?: string } => {
      if (!validationRules.length) return { isValid: true };

      for (const rule of validationRules) {
        // Required validation
        if (rule.required && (!inputValue || inputValue.trim() === '')) {
          return { isValid: false, message: rule.message };
        }

        // Skip other validations if value is empty and not required
        if (!inputValue || inputValue.trim() === '') {
          continue;
        }

        // Min length validation
        if (rule.minLength && inputValue.length < rule.minLength) {
          return { isValid: false, message: rule.message };
        }

        // Max length validation
        if (rule.maxLength && inputValue.length > rule.maxLength) {
          return { isValid: false, message: rule.message };
        }

        // Pattern validation
        if (rule.pattern && !rule.pattern.test(inputValue)) {
          return { isValid: false, message: rule.message };
        }

        // Custom validation
        if (rule.custom && !rule.custom(inputValue)) {
          return { isValid: false, message: rule.message };
        }
      }

      return { isValid: true };
    }, [validationRules]);

    // Debounced validation
    const performValidation = useCallback((inputValue: string) => {
      if (!realTimeValidation || !validationState.touched) return;

      setValidationState(prev => ({ ...prev, isValidating: true }));

      const validation = validateValue(inputValue);
      
      setValidationState(prev => ({
        ...prev,
        isValid: validation.isValid,
        validationMessage: validation.message,
        isValidating: false,
      }));

      onValidationChange?.(validation.isValid, validation.message);
    }, [realTimeValidation, validationState.touched, validateValue, onValidationChange]);

    // Handle input change with debounced validation
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      onChange?.(e);

      if (realTimeValidation && validationState.touched) {
        // Clear previous timer
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }

        // Set new timer for debounced validation
        const timer = setTimeout(() => {
          performValidation(inputValue);
        }, validationDelay);

        setDebounceTimer(timer);
      }
    }, [onChange, realTimeValidation, validationState.touched, debounceTimer, performValidation, validationDelay]);

    // Handle blur event
    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      setValidationState(prev => ({ ...prev, touched: true }));
      
      // Perform immediate validation on blur
      if (realTimeValidation) {
        const validation = validateValue(inputValue);
        setValidationState(prev => ({
          ...prev,
          isValid: validation.isValid,
          validationMessage: validation.message,
          isValidating: false,
          touched: true,
        }));
        onValidationChange?.(validation.isValid, validation.message);
      }

      onBlur?.(e);
    }, [onBlur, realTimeValidation, validateValue, onValidationChange]);

    // Cleanup timer on unmount
    useEffect(() => {
      return () => {
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
      };
    }, [debounceTimer]);

    // Determine the error message to display
    const displayError = externalError || (validationState.touched && validationState.validationMessage) || error;

    // Determine validation icon
    const getValidationIcon = () => {
      if (!showValidationIcon || !validationState.touched) return null;
      
      if (validationState.isValidating) {
        return (
          <div className="animate-spin">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
        );
      }
      
      if (validationState.isValid && value && String(value).trim() !== '') {
        return (
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      }
      
      if (!validationState.isValid) {
        return (
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      }
      
      return null;
    };

    const validationIcon = getValidationIcon();

    return (
      <Input
        ref={ref}
        inputMode={inputMode}
        autoComplete={autoComplete}
        error={displayError}
        rightIcon={validationIcon || props.rightIcon}
        onChange={handleChange}
        onBlur={handleBlur}
        value={value}
        {...props}
      />
    );
  }
);

EnhancedInput.displayName = "EnhancedInput";

export { EnhancedInput };