"use client";

import { forwardRef, useState, useCallback } from "react";
import { EnhancedInput, EnhancedInputProps, ValidationRule } from "./EnhancedInput";

export interface StudentIdInputProps extends Omit<EnhancedInputProps, 'type' | 'inputMode' | 'validationRules'> {
  // Student ID specific props
  minDigits?: number;
  maxDigits?: number;
  allowFormatting?: boolean; // Whether to show formatted display (e.g., 12345-678)
  formatPattern?: string; // Custom format pattern
  
  // Additional validation rules (will be combined with built-in student ID validation)
  additionalValidationRules?: ValidationRule[];
}

const StudentIdInput = forwardRef<HTMLInputElement, StudentIdInputProps>(
  ({ 
    minDigits = 8,
    maxDigits = 10,
    allowFormatting = false,
    formatPattern,
    additionalValidationRules = [],
    placeholder = "รหัสนักศึกษา (8-10 หลัก)",
    label = "รหัสนักศึกษา",
    autoComplete = "username",
    onChange,
    value,
    ...props 
  }, ref) => {
    const [rawValue, setRawValue] = useState("");

    // Built-in validation rules for student ID
    const studentIdValidationRules: ValidationRule[] = [
      {
        required: true,
        message: "กรุณากรอกรหัสนักศึกษา"
      },
      {
        pattern: new RegExp(`^[0-9]{${minDigits},${maxDigits}}$`),
        message: `รหัสนักศึกษาต้องเป็นตัวเลข ${minDigits}-${maxDigits} หลัก`
      },
      ...additionalValidationRules
    ];

    // Format student ID for display
    const formatStudentId = useCallback((id: string): string => {
      if (!allowFormatting || !id) return id;
      
      // Remove any non-digit characters
      const digits = id.replace(/\D/g, '');
      
      if (formatPattern) {
        // Apply custom format pattern
        let formatted = formatPattern;
        for (let i = 0; i < digits.length; i++) {
          formatted = formatted.replace('#', digits[i]);
        }
        return formatted.replace(/#/g, ''); // Remove remaining placeholders
      }
      
      // Default formatting: XXXXX-XXX for 8+ digits
      if (digits.length >= 5) {
        return `${digits.slice(0, 5)}-${digits.slice(5)}`;
      }
      
      return digits;
    }, [allowFormatting, formatPattern]);

    // Handle input change with numeric filtering and formatting
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Remove any non-digit characters for raw value
      const digitsOnly = inputValue.replace(/\D/g, '');
      
      // Limit to max digits
      const limitedDigits = digitsOnly.slice(0, maxDigits);
      
      setRawValue(limitedDigits);
      
      // Create a new event with the raw numeric value for form handling
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: limitedDigits
        }
      };
      
      onChange?.(syntheticEvent);
    }, [maxDigits, onChange]);

    // Get display value (formatted or raw)
    const displayValue = allowFormatting ? formatStudentId(rawValue) : rawValue;

    // Sync with external value changes
    React.useEffect(() => {
      if (value !== undefined) {
        const stringValue = String(value);
        const digitsOnly = stringValue.replace(/\D/g, '');
        setRawValue(digitsOnly);
      }
    }, [value]);

    return (
      <EnhancedInput
        ref={ref}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete={autoComplete}
        placeholder={placeholder}
        label={label}
        value={displayValue}
        onChange={handleChange}
        validationRules={studentIdValidationRules}
        realTimeValidation={true}
        showValidationIcon={true}
        {...props}
      />
    );
  }
);

StudentIdInput.displayName = "StudentIdInput";

export { StudentIdInput };