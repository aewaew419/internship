/**
 * Utility functions for integrating error reporting with authentication forms
 */

import { useErrorReporting } from '../hooks/useErrorReporting';
import { useState, useCallback } from 'react';

export interface AuthFormError {
  field?: string;
  message: string;
  code: string;
  errorId?: string;
}

export interface AuthFormErrorState {
  errors: AuthFormError[];
  hasErrors: boolean;
  showReportModal: boolean;
  reportableErrorId: string | null;
}

/**
 * Hook for managing authentication form errors with reporting integration
 */
export const useAuthFormErrors = () => {
  const [errorState, setErrorState] = useState<AuthFormErrorState>({
    errors: [],
    hasErrors: false,
    showReportModal: false,
    reportableErrorId: null
  });

  const { 
    handleFormError, 
    handleValidationError, 
    logAuthError,
    reportError 
  } = useErrorReporting();

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setErrorState({
      errors: [],
      hasErrors: false,
      showReportModal: false,
      reportableErrorId: null
    });
  }, []);

  /**
   * Clear error for specific field
   */
  const clearFieldError = useCallback((field: string) => {
    setErrorState(prev => ({
      ...prev,
      errors: prev.errors.filter(error => error.field !== field),
      hasErrors: prev.errors.filter(error => error.field !== field).length > 0
    }));
  }, []);

  /**
   * Add validation error
   */
  const addValidationError = useCallback((field: string, message: string, value?: string) => {
    const errorId = handleValidationError(field, message, value);
    const error: AuthFormError = {
      field,
      message,
      code: `VALIDATION_${field.toUpperCase()}_ERROR`,
      errorId
    };

    setErrorState(prev => ({
      ...prev,
      errors: [...prev.errors.filter(e => e.field !== field), error],
      hasErrors: true
    }));

    return errorId;
  }, [handleValidationError]);

  /**
   * Add authentication error
   */
  const addAuthError = useCallback((error: any, formType: 'login' | 'registration' | 'forgot-password') => {
    const errorId = handleFormError(error, formType);
    
    let message = 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
    let code = 'AUTH_ERROR';

    if (error.response?.status === 401) {
      message = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง';
      code = 'INVALID_CREDENTIALS';
    } else if (error.response?.status === 403) {
      message = 'ไม่มีสิทธิ์เข้าถึงระบบ';
      code = 'ACCESS_DENIED';
    } else if (error.response?.status === 429) {
      message = 'พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่';
      code = 'RATE_LIMITED';
    } else if (error.code === 'NETWORK_ERROR') {
      message = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
      code = 'NETWORK_ERROR';
    }

    const authError: AuthFormError = {
      message,
      code,
      errorId
    };

    setErrorState(prev => ({
      ...prev,
      errors: [authError],
      hasErrors: true,
      reportableErrorId: errorId
    }));

    return errorId;
  }, [handleFormError]);

  /**
   * Add system error
   */
  const addSystemError = useCallback((error: Error, component?: string) => {
    const errorId = logAuthError('SYSTEM_ERROR', error.message);
    
    const systemError: AuthFormError = {
      message: 'เกิดข้อผิดพลาดของระบบ กรุณาลองใหม่อีกครั้ง',
      code: 'SYSTEM_ERROR',
      errorId
    };

    setErrorState(prev => ({
      ...prev,
      errors: [systemError],
      hasErrors: true,
      reportableErrorId: errorId
    }));

    return errorId;
  }, [logAuthError]);

  /**
   * Show error report modal
   */
  const showReportModal = useCallback(() => {
    setErrorState(prev => ({
      ...prev,
      showReportModal: true
    }));
  }, []);

  /**
   * Hide error report modal
   */
  const hideReportModal = useCallback(() => {
    setErrorState(prev => ({
      ...prev,
      showReportModal: false
    }));
  }, []);

  /**
   * Submit error report
   */
  const submitErrorReport = useCallback(async (
    userFeedback?: string,
    reproductionSteps?: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ) => {
    if (!errorState.reportableErrorId) {
      throw new Error('No reportable error found');
    }

    await reportError(errorState.reportableErrorId, userFeedback, reproductionSteps, severity);
    hideReportModal();
  }, [errorState.reportableErrorId, reportError, hideReportModal]);

  /**
   * Get error for specific field
   */
  const getFieldError = useCallback((field: string): AuthFormError | undefined => {
    return errorState.errors.find(error => error.field === field);
  }, [errorState.errors]);

  /**
   * Get general (non-field) errors
   */
  const getGeneralErrors = useCallback((): AuthFormError[] => {
    return errorState.errors.filter(error => !error.field);
  }, [errorState.errors]);

  /**
   * Check if field has error
   */
  const hasFieldError = useCallback((field: string): boolean => {
    return errorState.errors.some(error => error.field === field);
  }, [errorState.errors]);

  return {
    errorState,
    clearErrors,
    clearFieldError,
    addValidationError,
    addAuthError,
    addSystemError,
    showReportModal,
    hideReportModal,
    submitErrorReport,
    getFieldError,
    getGeneralErrors,
    hasFieldError
  };
};

/**
 * Validation error messages in Thai
 */
export const validationMessages = {
  required: 'กรุณากรอกข้อมูลในช่องนี้',
  email: 'กรุณากรอกอีเมลที่ถูกต้อง',
  studentId: 'รหัสนักศึกษาต้องเป็นตัวเลข 8-10 หลัก',
  password: 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
  passwordConfirm: 'รหัสผ่านไม่ตรงกัน',
  minLength: (min: number) => `ต้องมีอย่างน้อย ${min} ตัวอักษร`,
  maxLength: (max: number) => `ต้องมีไม่เกิน ${max} ตัวอักษร`,
  pattern: 'รูปแบบข้อมูลไม่ถูกต้อง'
};

/**
 * Common validation functions with error reporting
 */
export const createValidators = (addValidationError: (field: string, message: string, value?: string) => string) => ({
  validateRequired: (field: string, value: string) => {
    if (!value || value.trim() === '') {
      addValidationError(field, validationMessages.required, value);
      return false;
    }
    return true;
  },

  validateEmail: (field: string, value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      addValidationError(field, validationMessages.email, value);
      return false;
    }
    return true;
  },

  validateStudentId: (field: string, value: string) => {
    const studentIdRegex = /^[0-9]{8,10}$/;
    if (!studentIdRegex.test(value)) {
      addValidationError(field, validationMessages.studentId, value);
      return false;
    }
    return true;
  },

  validatePassword: (field: string, value: string) => {
    if (value.length < 6) {
      addValidationError(field, validationMessages.password, value);
      return false;
    }
    return true;
  },

  validatePasswordConfirm: (field: string, password: string, confirmPassword: string) => {
    if (password !== confirmPassword) {
      addValidationError(field, validationMessages.passwordConfirm, confirmPassword);
      return false;
    }
    return true;
  }
});