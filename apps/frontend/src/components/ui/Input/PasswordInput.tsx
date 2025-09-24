"use client";

import { forwardRef, useState, useCallback, useMemo } from "react";
import { EnhancedInput, EnhancedInputProps, ValidationRule } from "./EnhancedInput";
import { cn } from "@/lib/utils";

export interface PasswordStrength {
  score: number; // 0-4 (0: very weak, 4: very strong)
  feedback: string[];
  color: 'red' | 'orange' | 'yellow' | 'green';
  label: string;
}

export interface PasswordInputProps extends Omit<EnhancedInputProps, 'type' | 'showPasswordToggle'> {
  // Password specific props
  showStrengthIndicator?: boolean;
  showPasswordToggle?: boolean;
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
  
  // Strength calculation customization
  customStrengthCalculator?: (password: string) => PasswordStrength;
  
  // Additional validation rules
  additionalValidationRules?: ValidationRule[];
  
  // Callbacks
  onStrengthChange?: (strength: PasswordStrength) => void;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ 
    showStrengthIndicator = true,
    showPasswordToggle = true,
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = false,
    customStrengthCalculator,
    additionalValidationRules = [],
    placeholder = "รหัสผ่าน",
    label = "รหัสผ่าน",
    autoComplete = "current-password",
    onChange,
    onStrengthChange,
    value,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    // Calculate password strength
    const calculateStrength = useCallback((password: string): PasswordStrength => {
      if (customStrengthCalculator) {
        return customStrengthCalculator(password);
      }

      if (!password) {
        return {
          score: 0,
          feedback: [],
          color: 'red',
          label: ''
        };
      }

      let score = 0;
      const feedback: string[] = [];

      // Length check
      if (password.length >= minLength) {
        score += 1;
      } else {
        feedback.push(`ต้องมีอย่างน้อย ${minLength} ตัวอักษร`);
      }

      // Uppercase check
      if (requireUppercase) {
        if (/[A-Z]/.test(password)) {
          score += 1;
        } else {
          feedback.push('ต้องมีตัวอักษรพิมพ์ใหญ่');
        }
      }

      // Lowercase check
      if (requireLowercase) {
        if (/[a-z]/.test(password)) {
          score += 1;
        } else {
          feedback.push('ต้องมีตัวอักษรพิมพ์เล็ก');
        }
      }

      // Numbers check
      if (requireNumbers) {
        if (/[0-9]/.test(password)) {
          score += 1;
        } else {
          feedback.push('ต้องมีตัวเลข');
        }
      }

      // Special characters check
      if (requireSpecialChars) {
        if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
          score += 1;
        } else {
          feedback.push('ต้องมีอักขระพิเศษ');
        }
      }

      // Determine color and label based on score
      let color: 'red' | 'orange' | 'yellow' | 'green' = 'red';
      let label = '';

      const maxScore = 1 + 
        (requireUppercase ? 1 : 0) + 
        (requireLowercase ? 1 : 0) + 
        (requireNumbers ? 1 : 0) + 
        (requireSpecialChars ? 1 : 0);

      const percentage = (score / maxScore) * 100;

      if (percentage >= 80) {
        color = 'green';
        label = 'แข็งแรงมาก';
      } else if (percentage >= 60) {
        color = 'yellow';
        label = 'แข็งแรง';
      } else if (percentage >= 40) {
        color = 'orange';
        label = 'ปานกลาง';
      } else if (percentage > 0) {
        color = 'red';
        label = 'อ่อนแอ';
      }

      return {
        score: Math.round((score / maxScore) * 4),
        feedback,
        color,
        label
      };
    }, [minLength, requireUppercase, requireLowercase, requireNumbers, requireSpecialChars, customStrengthCalculator]);

    // Memoized strength calculation
    const passwordStrength = useMemo(() => {
      const strength = calculateStrength(String(value || ''));
      return strength;
    }, [value, calculateStrength]);

    // Notify parent of strength changes
    React.useEffect(() => {
      onStrengthChange?.(passwordStrength);
    }, [passwordStrength, onStrengthChange]);

    // Built-in validation rules for password
    const passwordValidationRules: ValidationRule[] = [
      {
        required: true,
        message: "กรุณากรอกรหัสผ่าน"
      },
      {
        minLength: minLength,
        message: `รหัสผ่านต้องมีอย่างน้อย ${minLength} ตัวอักษร`
      },
      ...(requireUppercase ? [{
        pattern: /[A-Z]/,
        message: "รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่"
      }] : []),
      ...(requireLowercase ? [{
        pattern: /[a-z]/,
        message: "รหัสผ่านต้องมีตัวอักษรพิมพ์เล็ก"
      }] : []),
      ...(requireNumbers ? [{
        pattern: /[0-9]/,
        message: "รหัสผ่านต้องมีตัวเลข"
      }] : []),
      ...(requireSpecialChars ? [{
        pattern: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
        message: "รหัสผ่านต้องมีอักขระพิเศษ"
      }] : []),
      ...additionalValidationRules
    ];

    // Password toggle icon
    const passwordToggleIcon = showPasswordToggle ? (
      <button
        type="button"
        className="pointer-events-auto text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
        onClick={() => setShowPassword(!showPassword)}
        tabIndex={-1}
        aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
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
    ) : undefined;

    // Strength indicator colors
    const strengthColors = {
      red: 'bg-red-500',
      orange: 'bg-orange-500',
      yellow: 'bg-yellow-500',
      green: 'bg-green-500'
    };

    return (
      <div className="space-y-2">
        <EnhancedInput
          ref={ref}
          type={showPassword ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          label={label}
          value={value}
          onChange={onChange}
          validationRules={passwordValidationRules}
          realTimeValidation={true}
          showValidationIcon={false} // We'll show strength indicator instead
          rightIcon={passwordToggleIcon}
          {...props}
        />
        
        {showStrengthIndicator && value && String(value).length > 0 && (
          <div className="space-y-2">
            {/* Strength bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    strengthColors[passwordStrength.color]
                  )}
                  style={{ 
                    width: `${(passwordStrength.score / 4) * 100}%` 
                  }}
                />
              </div>
              {passwordStrength.label && (
                <span className={cn(
                  "text-sm font-medium",
                  passwordStrength.color === 'green' && "text-green-600",
                  passwordStrength.color === 'yellow' && "text-yellow-600",
                  passwordStrength.color === 'orange' && "text-orange-600",
                  passwordStrength.color === 'red' && "text-red-600"
                )}>
                  {passwordStrength.label}
                </span>
              )}
            </div>
            
            {/* Feedback messages */}
            {passwordStrength.feedback.length > 0 && (
              <div className="space-y-1">
                {passwordStrength.feedback.map((message, index) => (
                  <p key={index} className="text-xs text-gray-600 flex items-center gap-1">
                    <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {message}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };