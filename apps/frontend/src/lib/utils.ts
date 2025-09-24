import { VALIDATION_MESSAGES } from './validation-messages';

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Student ID validation utility
export function validateStudentId(studentId: string): { isValid: boolean; message?: string } {
  if (!studentId) {
    return { isValid: false, message: VALIDATION_MESSAGES.STUDENT_ID.REQUIRED };
  }
  
  // Remove any non-numeric characters for validation
  const numericOnly = studentId.replace(/\D/g, '');
  
  if (numericOnly.length < 8) {
    return { isValid: false, message: VALIDATION_MESSAGES.STUDENT_ID.TOO_SHORT };
  }
  
  if (numericOnly.length > 10) {
    return { isValid: false, message: VALIDATION_MESSAGES.STUDENT_ID.TOO_LONG };
  }
  
  if (!/^\d{8,10}$/.test(numericOnly)) {
    return { isValid: false, message: VALIDATION_MESSAGES.STUDENT_ID.NUMERIC_ONLY };
  }
  
  return { isValid: true };
}

// Password validation utility
export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (!password) {
    return { isValid: false, message: VALIDATION_MESSAGES.PASSWORD.REQUIRED };
  }
  
  if (password.length < 6) {
    return { isValid: false, message: VALIDATION_MESSAGES.PASSWORD.TOO_SHORT };
  }
  
  if (password.length > 128) {
    return { isValid: false, message: VALIDATION_MESSAGES.PASSWORD.TOO_LONG };
  }
  
  return { isValid: true };
}

// Email validation utility
export function validateEmail(email: string): { isValid: boolean; message?: string } {
  if (!email) {
    return { isValid: false, message: VALIDATION_MESSAGES.EMAIL.REQUIRED };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: VALIDATION_MESSAGES.EMAIL.INVALID_FORMAT };
  }
  
  return { isValid: true };
}

// Name validation utility
export function validateName(name: string, fieldName: 'firstName' | 'lastName'): { isValid: boolean; message?: string } {
  if (!name.trim()) {
    return { 
      isValid: false, 
      message: fieldName === 'firstName' 
        ? VALIDATION_MESSAGES.NAME.FIRST_NAME_REQUIRED 
        : VALIDATION_MESSAGES.NAME.LAST_NAME_REQUIRED 
    };
  }
  
  if (name.trim().length < 2) {
    return { isValid: false, message: VALIDATION_MESSAGES.NAME.TOO_SHORT };
  }
  
  if (name.trim().length > 50) {
    return { isValid: false, message: VALIDATION_MESSAGES.NAME.TOO_LONG };
  }
  
  // Allow Thai and English characters, spaces, and common name characters
  if (!/^[a-zA-Zก-๙\s\-\.]+$/.test(name.trim())) {
    return { isValid: false, message: VALIDATION_MESSAGES.NAME.INVALID_CHARACTERS };
  }
  
  return { isValid: true };
}

// Confirm password validation utility
export function validateConfirmPassword(password: string, confirmPassword: string): { isValid: boolean; message?: string } {
  if (!confirmPassword) {
    return { isValid: false, message: VALIDATION_MESSAGES.PASSWORD.REQUIRED };
  }
  
  if (password !== confirmPassword) {
    return { isValid: false, message: VALIDATION_MESSAGES.PASSWORD.MISMATCH };
  }
  
  return { isValid: true };
}

// Enhanced password validation with strength checking
export function validatePasswordStrength(password: string): { 
  isValid: boolean; 
  message?: string; 
  strength: 'weak' | 'medium' | 'strong' 
} {
  const basicValidation = validatePassword(password);
  if (!basicValidation.isValid) {
    return { ...basicValidation, strength: 'weak' };
  }
  
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  let score = 0;
  
  // Check for different character types
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  // Check length
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  
  if (score >= 4) strength = 'strong';
  else if (score >= 2) strength = 'medium';
  
  return { isValid: true, strength };
}

// Debounce utility for real-time validation
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}