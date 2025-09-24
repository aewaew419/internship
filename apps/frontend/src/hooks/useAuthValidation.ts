"use client";

import { useState, useCallback, useMemo } from "react";
import type { StudentLoginDTO, AdminLoginDTO, RegistrationDTO } from "@/types/auth";

interface ValidationError {
  field: string;
  message: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

interface FormValidationState {
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValidating: boolean;
}

/**
 * Authentication form validation hook
 * Provides comprehensive validation for authentication forms
 */
export const useAuthValidation = () => {
  const [validationState, setValidationState] = useState<FormValidationState>({
    errors: {},
    touched: {},
    isValidating: false,
  });

  // Thai error messages
  const errorMessages = {
    required: "กรุณากรอกข้อมูลในช่องนี้",
    invalidEmail: "รูปแบบอีเมลไม่ถูกต้อง",
    invalidStudentId: "รหัสนักศึกษาต้องเป็นตัวเลข 8-10 หลัก",
    passwordTooShort: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
    passwordMismatch: "รหัสผ่านไม่ตรงกัน",
    invalidName: "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร",
    emailExists: "อีเมลนี้ถูกใช้งานแล้ว",
    studentIdExists: "รหัสนักศึกษานี้ถูกใช้งานแล้ว",
    weakPassword: "รหัสผ่านควรมีตัวอักษรใหญ่ เล็ก ตัวเลข และอักขระพิเศษ",
  };

  // Validation patterns
  const patterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    studentId: /^[0-9]{8,10}$/,
    strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  };

  // Validate email
  const validateEmail = useCallback((email: string): ValidationError | null => {
    if (!email.trim()) {
      return { field: 'email', message: errorMessages.required };
    }
    if (!patterns.email.test(email)) {
      return { field: 'email', message: errorMessages.invalidEmail };
    }
    return null;
  }, []);

  // Validate student ID
  const validateStudentId = useCallback((studentId: string): ValidationError | null => {
    if (!studentId.trim()) {
      return { field: 'student_id', message: errorMessages.required };
    }
    if (!patterns.studentId.test(studentId)) {
      return { field: 'student_id', message: errorMessages.invalidStudentId };
    }
    return null;
  }, []);

  // Validate password
  const validatePassword = useCallback((password: string, checkStrength = false): ValidationError | null => {
    if (!password) {
      return { field: 'password', message: errorMessages.required };
    }
    if (password.length < 6) {
      return { field: 'password', message: errorMessages.passwordTooShort };
    }
    if (checkStrength && !patterns.strongPassword.test(password)) {
      return { field: 'password', message: errorMessages.weakPassword };
    }
    return null;
  }, []);

  // Validate password confirmation
  const validatePasswordConfirmation = useCallback((
    password: string, 
    confirmPassword: string
  ): ValidationError | null => {
    if (!confirmPassword) {
      return { field: 'confirmPassword', message: errorMessages.required };
    }
    if (password !== confirmPassword) {
      return { field: 'confirmPassword', message: errorMessages.passwordMismatch };
    }
    return null;
  }, []);

  // Validate name
  const validateName = useCallback((name: string, fieldName: string): ValidationError | null => {
    if (!name.trim()) {
      return { field: fieldName, message: errorMessages.required };
    }
    if (name.trim().length < 2) {
      return { field: fieldName, message: errorMessages.invalidName };
    }
    return null;
  }, []);

  // Validate student login form
  const validateStudentLogin = useCallback((data: StudentLoginDTO): ValidationResult => {
    const errors: ValidationError[] = [];

    const studentIdError = validateStudentId(data.student_id);
    if (studentIdError) errors.push(studentIdError);

    const passwordError = validatePassword(data.password);
    if (passwordError) errors.push(passwordError);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [validateStudentId, validatePassword]);

  // Validate admin login form
  const validateAdminLogin = useCallback((data: AdminLoginDTO): ValidationResult => {
    const errors: ValidationError[] = [];

    const emailError = validateEmail(data.email);
    if (emailError) errors.push(emailError);

    const passwordError = validatePassword(data.password);
    if (passwordError) errors.push(passwordError);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [validateEmail, validatePassword]);

  // Validate registration form
  const validateRegistration = useCallback((data: RegistrationDTO): ValidationResult => {
    const errors: ValidationError[] = [];

    const studentIdError = validateStudentId(data.student_id);
    if (studentIdError) errors.push(studentIdError);

    const emailError = validateEmail(data.email);
    if (emailError) errors.push(emailError);

    const passwordError = validatePassword(data.password, true);
    if (passwordError) errors.push(passwordError);

    const confirmPasswordError = validatePasswordConfirmation(data.password, data.confirmPassword);
    if (confirmPasswordError) errors.push(confirmPasswordError);

    const firstNameError = validateName(data.firstName, 'firstName');
    if (firstNameError) errors.push(firstNameError);

    const lastNameError = validateName(data.lastName, 'lastName');
    if (lastNameError) errors.push(lastNameError);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [validateStudentId, validateEmail, validatePassword, validatePasswordConfirmation, validateName]);

  // Real-time field validation
  const validateField = useCallback(async (
    fieldName: string, 
    value: string, 
    formType: 'studentLogin' | 'adminLogin' | 'registration',
    additionalData?: any
  ): Promise<string | null> => {
    setValidationState(prev => ({ ...prev, isValidating: true }));

    try {
      let error: ValidationError | null = null;

      switch (fieldName) {
        case 'email':
          error = validateEmail(value);
          break;
        case 'student_id':
          error = validateStudentId(value);
          break;
        case 'password':
          error = validatePassword(value, formType === 'registration');
          break;
        case 'confirmPassword':
          error = validatePasswordConfirmation(additionalData?.password || '', value);
          break;
        case 'firstName':
        case 'lastName':
          error = validateName(value, fieldName);
          break;
      }

      const errorMessage = error?.message || null;

      setValidationState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          [fieldName]: errorMessage || '',
        },
        touched: {
          ...prev.touched,
          [fieldName]: true,
        },
        isValidating: false,
      }));

      return errorMessage;
    } catch (err) {
      setValidationState(prev => ({ ...prev, isValidating: false }));
      return 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล';
    }
  }, [validateEmail, validateStudentId, validatePassword, validatePasswordConfirmation, validateName]);

  // Check if field has error
  const hasFieldError = useCallback((fieldName: string): boolean => {
    return !!(validationState.touched[fieldName] && validationState.errors[fieldName]);
  }, [validationState]);

  // Get field error message
  const getFieldError = useCallback((fieldName: string): string | null => {
    return hasFieldError(fieldName) ? validationState.errors[fieldName] : null;
  }, [hasFieldError, validationState.errors]);

  // Clear field error
  const clearFieldError = useCallback((fieldName: string) => {
    setValidationState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [fieldName]: '',
      },
    }));
  }, []);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setValidationState({
      errors: {},
      touched: {},
      isValidating: false,
    });
  }, []);

  // Mark field as touched
  const markFieldTouched = useCallback((fieldName: string) => {
    setValidationState(prev => ({
      ...prev,
      touched: {
        ...prev.touched,
        [fieldName]: true,
      },
    }));
  }, []);

  // Get password strength
  const getPasswordStrength = useCallback((password: string): {
    score: number;
    label: string;
    color: string;
  } => {
    if (!password) return { score: 0, label: '', color: '' };

    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@$!%*?&]/.test(password)) score++;

    const strengthLevels = [
      { label: '', color: '' },
      { label: 'อ่อนมาก', color: 'red' },
      { label: 'อ่อน', color: 'orange' },
      { label: 'ปานกลาง', color: 'yellow' },
      { label: 'แข็งแรง', color: 'green' },
      { label: 'แข็งแรงมาก', color: 'green' },
      { label: 'แข็งแรงที่สุด', color: 'green' },
    ];

    return {
      score,
      ...strengthLevels[Math.min(score, strengthLevels.length - 1)],
    };
  }, []);

  // Check if form is valid
  const isFormValid = useMemo(() => {
    const hasErrors = Object.values(validationState.errors).some(error => error);
    return !hasErrors && !validationState.isValidating;
  }, [validationState]);

  return {
    // Validation state
    validationState,
    isFormValid,
    isValidating: validationState.isValidating,

    // Validation methods
    validateStudentLogin,
    validateAdminLogin,
    validateRegistration,
    validateField,

    // Field validation utilities
    hasFieldError,
    getFieldError,
    clearFieldError,
    clearAllErrors,
    markFieldTouched,

    // Individual field validators
    validateEmail,
    validateStudentId,
    validatePassword,
    validatePasswordConfirmation,
    validateName,

    // Utility methods
    getPasswordStrength,
    
    // Error messages
    errorMessages,
  };
};