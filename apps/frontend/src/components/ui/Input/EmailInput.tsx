"use client";

import { forwardRef, useState, useCallback, useMemo } from "react";
import { EnhancedInput, EnhancedInputProps, ValidationRule } from "./EnhancedInput";

export interface EmailSuggestion {
  domain: string;
  suggestion: string;
}

export interface EmailInputProps extends Omit<EnhancedInputProps, 'type' | 'inputMode'> {
  // Email specific props
  showSuggestions?: boolean;
  commonDomains?: string[];
  allowInternational?: boolean; // Allow international domain names
  
  // Additional validation rules
  additionalValidationRules?: ValidationRule[];
  
  // Callbacks
  onSuggestionSelect?: (suggestion: string) => void;
}

const EmailInput = forwardRef<HTMLInputElement, EmailInputProps>(
  ({ 
    showSuggestions = true,
    commonDomains = [
      'gmail.com',
      'hotmail.com',
      'yahoo.com',
      'outlook.com',
      'live.com',
      'icloud.com',
      'student.chula.ac.th',
      'cp.su.ac.th',
      'kmitl.ac.th',
      'ku.ac.th',
      'tu.ac.th'
    ],
    allowInternational = true,
    additionalValidationRules = [],
    placeholder = "อีเมล",
    label = "อีเมล",
    autoComplete = "email",
    onChange,
    onSuggestionSelect,
    value,
    ...props 
  }, ref) => {
    const [showSuggestionDropdown, setShowSuggestionDropdown] = useState(false);
    const [inputValue, setInputValue] = useState("");

    // Email validation pattern
    const emailPattern = allowInternational 
      ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/ // Basic international email pattern
      : /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; // ASCII only

    // Built-in validation rules for email
    const emailValidationRules: ValidationRule[] = [
      {
        required: true,
        message: "กรุณากรอกอีเมล"
      },
      {
        pattern: emailPattern,
        message: "รูปแบบอีเมลไม่ถูกต้อง"
      },
      {
        custom: (email: string) => {
          // Additional email validation
          if (!email) return true;
          
          // Check for consecutive dots
          if (email.includes('..')) return false;
          
          // Check for valid domain structure
          const parts = email.split('@');
          if (parts.length !== 2) return false;
          
          const [localPart, domain] = parts;
          
          // Local part validation
          if (localPart.length === 0 || localPart.length > 64) return false;
          if (localPart.startsWith('.') || localPart.endsWith('.')) return false;
          
          // Domain validation
          if (domain.length === 0 || domain.length > 253) return false;
          if (domain.startsWith('.') || domain.endsWith('.')) return false;
          if (domain.startsWith('-') || domain.endsWith('-')) return false;
          
          return true;
        },
        message: "รูปแบบอีเมลไม่ถูกต้อง"
      },
      ...additionalValidationRules
    ];

    // Generate email suggestions
    const emailSuggestions = useMemo((): EmailSuggestion[] => {
      if (!showSuggestions || !inputValue || !inputValue.includes('@')) {
        return [];
      }

      const [localPart, domainPart = ''] = inputValue.split('@');
      
      if (!localPart || domainPart.length === 0) {
        return [];
      }

      const suggestions: EmailSuggestion[] = [];

      // Find matching domains
      const matchingDomains = commonDomains.filter(domain => 
        domain.toLowerCase().startsWith(domainPart.toLowerCase())
      );

      // Add exact matches first
      matchingDomains.forEach(domain => {
        if (domain !== domainPart) {
          suggestions.push({
            domain,
            suggestion: `${localPart}@${domain}`
          });
        }
      });

      // If no exact matches and domain part is short, suggest all common domains
      if (suggestions.length === 0 && domainPart.length <= 3) {
        commonDomains.slice(0, 5).forEach(domain => {
          suggestions.push({
            domain,
            suggestion: `${localPart}@${domain}`
          });
        });
      }

      return suggestions.slice(0, 5); // Limit to 5 suggestions
    }, [inputValue, showSuggestions, commonDomains]);

    // Handle input change
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      setShowSuggestionDropdown(emailSuggestions.length > 0 && newValue.includes('@'));
      onChange?.(e);
    }, [onChange, emailSuggestions.length]);

    // Handle suggestion selection
    const handleSuggestionSelect = useCallback((suggestion: string) => {
      setInputValue(suggestion);
      setShowSuggestionDropdown(false);
      
      // Create synthetic event for form handling
      const syntheticEvent = {
        target: { value: suggestion }
      } as React.ChangeEvent<HTMLInputElement>;
      
      onChange?.(syntheticEvent);
      onSuggestionSelect?.(suggestion);
    }, [onChange, onSuggestionSelect]);

    // Handle input blur
    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      // Delay hiding suggestions to allow for clicks
      setTimeout(() => {
        setShowSuggestionDropdown(false);
      }, 150);
      
      props.onBlur?.(e);
    }, [props]);

    // Handle input focus
    const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      if (emailSuggestions.length > 0 && inputValue.includes('@')) {
        setShowSuggestionDropdown(true);
      }
      
      props.onFocus?.(e);
    }, [emailSuggestions.length, inputValue, props]);

    // Sync with external value changes
    React.useEffect(() => {
      if (value !== undefined) {
        setInputValue(String(value));
      }
    }, [value]);

    // Email icon
    const emailIcon = (
      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
      </svg>
    );

    return (
      <div className="relative">
        <EnhancedInput
          ref={ref}
          type="email"
          inputMode="email"
          autoComplete={autoComplete}
          placeholder={placeholder}
          label={label}
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          validationRules={emailValidationRules}
          realTimeValidation={true}
          showValidationIcon={true}
          leftIcon={emailIcon}
          {...props}
        />
        
        {/* Email suggestions dropdown */}
        {showSuggestionDropdown && emailSuggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {emailSuggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                className="w-full px-4 py-2 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none first:rounded-t-lg last:rounded-b-lg transition-colors"
                onClick={() => handleSuggestionSelect(suggestion.suggestion)}
                onMouseDown={(e) => e.preventDefault()} // Prevent blur
              >
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                  <span className="text-sm text-gray-900">{suggestion.suggestion}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

EmailInput.displayName = "EmailInput";

export { EmailInput };