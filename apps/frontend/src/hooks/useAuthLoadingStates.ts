'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useLoadingStateManager } from './useLoadingStateManager';

interface AuthFieldState {
  isValidating: boolean;
  hasError: boolean;
  errorMessage?: string;
  isAvailable?: boolean; // For uniqueness checks
  lastValidated?: number;
}

interface AuthFormState {
  isSubmitting: boolean;
  submitProgress: number;
  hasSubmitError: boolean;
  submitErrorMessage?: string;
  submitAttempts: number;
  lastSubmitTime?: number;
}

/**
 * Specialized hook for authentication form loading states
 * Handles field validation, form submission, and timeout scenarios
 */
export function useAuthLoadingStates() {
  const loadingManager = useLoadingStateManager({
    timeout: 30000,
    retryAttempts: 3,
    persistAcrossRenders: true,
  });

  const [fieldStates, setFieldStates] = useState<Record<string, AuthFieldState>>({});
  const [formStates, setFormStates] = useState<Record<string, AuthFormState>>({});
  const validationTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(validationTimeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  // Field validation management
  const startFieldValidation = useCallback((fieldKey: string, timeout = 5000) => {
    // Clear existing timeout
    if (validationTimeoutsRef.current[fieldKey]) {
      clearTimeout(validationTimeoutsRef.current[fieldKey]);
    }

    setFieldStates(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        isValidating: true,
        hasError: false,
        errorMessage: undefined,
        lastValidated: Date.now(),
      },
    }));

    // Set validation timeout
    validationTimeoutsRef.current[fieldKey] = setTimeout(() => {
      setFieldStates(prev => ({
        ...prev,
        [fieldKey]: {
          ...prev[fieldKey],
          isValidating: false,
          hasError: true,
          errorMessage: 'การตรวจสอบใช้เวลานานเกินไป',
        },
      }));
      delete validationTimeoutsRef.current[fieldKey];
    }, timeout);
  }, []);

  const stopFieldValidation = useCallback((
    fieldKey: string,
    result: {
      isValid: boolean;
      errorMessage?: string;
      isAvailable?: boolean;
    }
  ) => {
    // Clear timeout
    if (validationTimeoutsRef.current[fieldKey]) {
      clearTimeout(validationTimeoutsRef.current[fieldKey]);
      delete validationTimeoutsRef.current[fieldKey];
    }

    setFieldStates(prev => ({
      ...prev,
      [fieldKey]: {
        ...prev[fieldKey],
        isValidating: false,
        hasError: !result.isValid,
        errorMessage: result.errorMessage,
        isAvailable: result.isAvailable,
        lastValidated: Date.now(),
      },
    }));
  }, []);

  const validateFieldWithTimeout = useCallback(async (
    fieldKey: string,
    validationFn: () => Promise<{ isValid: boolean; errorMessage?: string; isAvailable?: boolean }>,
    timeout = 5000
  ) => {
    startFieldValidation(fieldKey, timeout);

    try {
      const result = await validationFn();
      stopFieldValidation(fieldKey, result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการตรวจสอบ';
      stopFieldValidation(fieldKey, {
        isValid: false,
        errorMessage,
      });
      throw error;
    }
  }, [startFieldValidation, stopFieldValidation]);

  // Form submission management
  const startFormSubmission = useCallback((formKey: string) => {
    setFormStates(prev => ({
      ...prev,
      [formKey]: {
        ...prev[formKey],
        isSubmitting: true,
        submitProgress: 0,
        hasSubmitError: false,
        submitErrorMessage: undefined,
        submitAttempts: (prev[formKey]?.submitAttempts || 0) + 1,
        lastSubmitTime: Date.now(),
      },
    }));

    loadingManager.startLoading(formKey);
  }, [loadingManager]);

  const updateSubmitProgress = useCallback((formKey: string, progress: number) => {
    setFormStates(prev => ({
      ...prev,
      [formKey]: {
        ...prev[formKey],
        submitProgress: Math.min(100, Math.max(0, progress)),
      },
    }));
  }, []);

  const stopFormSubmission = useCallback((
    formKey: string,
    result: {
      success: boolean;
      errorMessage?: string;
    }
  ) => {
    setFormStates(prev => ({
      ...prev,
      [formKey]: {
        ...prev[formKey],
        isSubmitting: false,
        submitProgress: result.success ? 100 : 0,
        hasSubmitError: !result.success,
        submitErrorMessage: result.errorMessage,
      },
    }));

    loadingManager.stopLoading(formKey, result.success, result.errorMessage);
  }, [loadingManager]);

  const submitFormWithProgress = useCallback(async (
    formKey: string,
    submitFn: () => Promise<any>,
    options?: {
      showProgress?: boolean;
      progressSteps?: string[];
      onProgress?: (step: string, progress: number) => void;
      onSuccess?: (result: any) => void;
      onError?: (error: any) => void;
    }
  ) => {
    startFormSubmission(formKey);

    try {
      if (options?.showProgress && options?.progressSteps) {
        const steps = options.progressSteps;
        const stepProgress = 100 / steps.length;

        for (let i = 0; i < steps.length; i++) {
          const currentProgress = (i + 1) * stepProgress;
          updateSubmitProgress(formKey, currentProgress);
          options?.onProgress?.(steps[i], currentProgress);
          
          // Add small delay for visual feedback
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      const result = await submitFn();
      
      if (options?.showProgress) {
        updateSubmitProgress(formKey, 100);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      stopFormSubmission(formKey, { success: true });
      options?.onSuccess?.(result);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการส่งข้อมูล';
      stopFormSubmission(formKey, {
        success: false,
        errorMessage,
      });
      options?.onError?.(error);
      throw error;
    }
  }, [startFormSubmission, updateSubmitProgress, stopFormSubmission]);

  // Timeout handling
  const handleTimeout = useCallback((key: string, type: 'field' | 'form') => {
    if (type === 'field') {
      setFieldStates(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          isValidating: false,
          hasError: true,
          errorMessage: 'การตรวจสอบใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง',
        },
      }));
    } else {
      setFormStates(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          isSubmitting: false,
          hasSubmitError: true,
          submitErrorMessage: 'การส่งข้อมูลใช้เวลานานเกินไป กรุณาตรวจสอบการเชื่อมต่อและลองใหม่อีกครั้ง',
        },
      }));
    }
  }, []);

  // State getters
  const getFieldState = useCallback((fieldKey: string): AuthFieldState => {
    return fieldStates[fieldKey] || {
      isValidating: false,
      hasError: false,
    };
  }, [fieldStates]);

  const getFormState = useCallback((formKey: string): AuthFormState => {
    return formStates[formKey] || {
      isSubmitting: false,
      submitProgress: 0,
      hasSubmitError: false,
      submitAttempts: 0,
    };
  }, [formStates]);

  // Reset functions
  const resetFieldState = useCallback((fieldKey: string) => {
    if (validationTimeoutsRef.current[fieldKey]) {
      clearTimeout(validationTimeoutsRef.current[fieldKey]);
      delete validationTimeoutsRef.current[fieldKey];
    }

    setFieldStates(prev => {
      const newStates = { ...prev };
      delete newStates[fieldKey];
      return newStates;
    });
  }, []);

  const resetFormState = useCallback((formKey: string) => {
    setFormStates(prev => {
      const newStates = { ...prev };
      delete newStates[formKey];
      return newStates;
    });
    loadingManager.stopLoading(formKey);
  }, [loadingManager]);

  const resetAllStates = useCallback(() => {
    Object.values(validationTimeoutsRef.current).forEach(clearTimeout);
    validationTimeoutsRef.current = {};
    setFieldStates({});
    setFormStates({});
    loadingManager.stopAllLoading();
  }, [loadingManager]);

  return {
    // Loading manager methods
    ...loadingManager,

    // Field validation
    startFieldValidation,
    stopFieldValidation,
    validateFieldWithTimeout,
    getFieldState,
    resetFieldState,

    // Form submission
    startFormSubmission,
    updateSubmitProgress,
    stopFormSubmission,
    submitFormWithProgress,
    getFormState,
    resetFormState,

    // Timeout handling
    handleTimeout,

    // Utilities
    isAnyFieldValidating: Object.values(fieldStates).some(state => state.isValidating),
    isAnyFormSubmitting: Object.values(formStates).some(state => state.isSubmitting),
    hasAnyFieldError: Object.values(fieldStates).some(state => state.hasError),
    hasAnyFormError: Object.values(formStates).some(state => state.hasSubmitError),

    // Reset all
    resetAllStates,
  };
}

/**
 * Hook for managing registration form loading states with multi-step support
 */
export function useRegistrationLoadingStates() {
  const authLoading = useAuthLoadingStates();
  const [currentStep, setCurrentStep] = useState(1);
  const [stepValidation, setStepValidation] = useState<Record<number, boolean>>({});

  const validateStep = useCallback(async (
    step: number,
    validationFn: () => Promise<boolean>
  ) => {
    const stepKey = `step-${step}`;
    
    try {
      authLoading.startLoading(stepKey);
      const isValid = await validationFn();
      
      setStepValidation(prev => ({
        ...prev,
        [step]: isValid,
      }));
      
      authLoading.stopLoading(stepKey, isValid);
      return isValid;
    } catch (error) {
      setStepValidation(prev => ({
        ...prev,
        [step]: false,
      }));
      authLoading.stopLoading(stepKey, false);
      throw error;
    }
  }, [authLoading]);

  const nextStep = useCallback(() => {
    if (stepValidation[currentStep]) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, stepValidation]);

  const previousStep = useCallback(() => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(step);
  }, []);

  const resetRegistration = useCallback(() => {
    setCurrentStep(1);
    setStepValidation({});
    authLoading.resetAllStates();
  }, [authLoading]);

  return {
    ...authLoading,
    
    // Step management
    currentStep,
    nextStep,
    previousStep,
    goToStep,
    
    // Step validation
    validateStep,
    isStepValid: (step: number) => stepValidation[step] || false,
    isStepValidating: (step: number) => authLoading.isLoading(`step-${step}`),
    
    // Utilities
    canProceedToNextStep: stepValidation[currentStep] || false,
    isFirstStep: currentStep === 1,
    
    // Reset
    resetRegistration,
  };
}