'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface LoadingStateConfig {
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  persistAcrossRenders?: boolean;
}

interface LoadingStateData {
  isLoading: boolean;
  startTime?: number;
  attempts?: number;
  lastError?: string;
  hasTimedOut?: boolean;
}

interface UseLoadingStateManagerResult {
  // Basic loading state
  isLoading: (key?: string) => boolean;
  startLoading: (key: string, config?: LoadingStateConfig) => void;
  stopLoading: (key: string, success?: boolean, error?: string) => void;
  
  // Advanced state queries
  getLoadingDuration: (key: string) => number;
  getAttemptCount: (key: string) => number;
  hasTimedOut: (key: string) => boolean;
  getLastError: (key: string) => string | undefined;
  
  // Bulk operations
  isAnyLoading: () => boolean;
  stopAllLoading: () => void;
  getLoadingKeys: () => string[];
  
  // State persistence
  persistState: () => void;
  restoreState: () => void;
  clearPersistedState: () => void;
}

/**
 * Enhanced loading state manager with timeout handling, retry logic, and persistence
 * Designed specifically for authentication forms and multi-step processes
 */
export function useLoadingStateManager(
  defaultConfig: LoadingStateConfig = {}
): UseLoadingStateManagerResult {
  const [loadingStates, setLoadingStates] = useState<Record<string, LoadingStateData>>({});
  const timeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const configRef = useRef<Record<string, LoadingStateConfig>>({});

  const defaultSettings = {
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000,
    persistAcrossRenders: false,
    ...defaultConfig,
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  const isLoading = useCallback((key?: string): boolean => {
    if (!key) {
      return Object.values(loadingStates).some(state => state.isLoading);
    }
    return loadingStates[key]?.isLoading || false;
  }, [loadingStates]);

  const startLoading = useCallback((key: string, config?: LoadingStateConfig) => {
    const mergedConfig = { ...defaultSettings, ...config };
    configRef.current[key] = mergedConfig;

    // Clear existing timeout if any
    if (timeoutsRef.current[key]) {
      clearTimeout(timeoutsRef.current[key]);
    }

    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        isLoading: true,
        startTime: Date.now(),
        attempts: (prev[key]?.attempts || 0) + 1,
        hasTimedOut: false,
        lastError: undefined,
      },
    }));

    // Set timeout if configured
    if (mergedConfig.timeout && mergedConfig.timeout > 0) {
      timeoutsRef.current[key] = setTimeout(() => {
        setLoadingStates(prev => ({
          ...prev,
          [key]: {
            ...prev[key],
            isLoading: false,
            hasTimedOut: true,
          },
        }));
        delete timeoutsRef.current[key];
      }, mergedConfig.timeout);
    }
  }, [defaultSettings]);

  const stopLoading = useCallback((key: string, success = true, error?: string) => {
    // Clear timeout
    if (timeoutsRef.current[key]) {
      clearTimeout(timeoutsRef.current[key]);
      delete timeoutsRef.current[key];
    }

    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        isLoading: false,
        lastError: error,
        hasTimedOut: false,
      },
    }));

    // Clean up config
    delete configRef.current[key];
  }, []);

  const getLoadingDuration = useCallback((key: string): number => {
    const state = loadingStates[key];
    if (!state?.isLoading || !state.startTime) return 0;
    return Date.now() - state.startTime;
  }, [loadingStates]);

  const getAttemptCount = useCallback((key: string): number => {
    return loadingStates[key]?.attempts || 0;
  }, [loadingStates]);

  const hasTimedOut = useCallback((key: string): boolean => {
    return loadingStates[key]?.hasTimedOut || false;
  }, [loadingStates]);

  const getLastError = useCallback((key: string): string | undefined => {
    return loadingStates[key]?.lastError;
  }, [loadingStates]);

  const isAnyLoading = useCallback((): boolean => {
    return Object.values(loadingStates).some(state => state.isLoading);
  }, [loadingStates]);

  const stopAllLoading = useCallback(() => {
    // Clear all timeouts
    Object.values(timeoutsRef.current).forEach(clearTimeout);
    timeoutsRef.current = {};
    configRef.current = {};

    setLoadingStates(prev => {
      const newStates: Record<string, LoadingStateData> = {};
      Object.keys(prev).forEach(key => {
        newStates[key] = {
          ...prev[key],
          isLoading: false,
        };
      });
      return newStates;
    });
  }, []);

  const getLoadingKeys = useCallback((): string[] => {
    return Object.keys(loadingStates).filter(key => loadingStates[key].isLoading);
  }, [loadingStates]);

  const persistState = useCallback(() => {
    try {
      const persistableStates = Object.entries(loadingStates)
        .filter(([key]) => configRef.current[key]?.persistAcrossRenders)
        .reduce((acc, [key, state]) => {
          acc[key] = state;
          return acc;
        }, {} as Record<string, LoadingStateData>);

      if (Object.keys(persistableStates).length > 0) {
        sessionStorage.setItem('kiro-loading-states', JSON.stringify(persistableStates));
      }
    } catch (error) {
      console.warn('Failed to persist loading states:', error);
    }
  }, [loadingStates]);

  const restoreState = useCallback(() => {
    try {
      const stored = sessionStorage.getItem('kiro-loading-states');
      if (stored) {
        const persistedStates = JSON.parse(stored);
        setLoadingStates(prev => ({
          ...prev,
          ...persistedStates,
        }));
      }
    } catch (error) {
      console.warn('Failed to restore loading states:', error);
    }
  }, []);

  const clearPersistedState = useCallback(() => {
    try {
      sessionStorage.removeItem('kiro-loading-states');
    } catch (error) {
      console.warn('Failed to clear persisted loading states:', error);
    }
  }, []);

  // Auto-persist on state changes if any states are configured for persistence
  useEffect(() => {
    const shouldPersist = Object.keys(loadingStates).some(
      key => configRef.current[key]?.persistAcrossRenders
    );
    if (shouldPersist) {
      persistState();
    }
  }, [loadingStates, persistState]);

  return {
    isLoading,
    startLoading,
    stopLoading,
    getLoadingDuration,
    getAttemptCount,
    hasTimedOut,
    getLastError,
    isAnyLoading,
    stopAllLoading,
    getLoadingKeys,
    persistState,
    restoreState,
    clearPersistedState,
  };
}

/**
 * Specialized hook for form submission loading states
 */
export function useFormLoadingState() {
  const loadingManager = useLoadingStateManager({
    timeout: 30000,
    retryAttempts: 3,
    persistAcrossRenders: true,
  });

  const submitForm = useCallback(async (
    formKey: string,
    submitFn: () => Promise<any>,
    options?: {
      timeout?: number;
      onTimeout?: () => void;
      onSuccess?: (result: any) => void;
      onError?: (error: any) => void;
    }
  ) => {
    try {
      loadingManager.startLoading(formKey, { timeout: options?.timeout });
      
      const result = await submitFn();
      
      loadingManager.stopLoading(formKey, true);
      options?.onSuccess?.(result);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      loadingManager.stopLoading(formKey, false, errorMessage);
      options?.onError?.(error);
      throw error;
    }
  }, [loadingManager]);

  return {
    ...loadingManager,
    submitForm,
  };
}

/**
 * Enhanced authentication loading state manager with specialized features
 */
export function useAuthLoadingState() {
  const loadingManager = useLoadingStateManager({
    timeout: 30000,
    retryAttempts: 3,
    persistAcrossRenders: true,
  });

  // Specialized loading states for authentication flows
  const [authStates, setAuthStates] = useState<{
    isValidating: Record<string, boolean>;
    validationErrors: Record<string, string>;
    submitProgress: Record<string, number>;
  }>({
    isValidating: {},
    validationErrors: {},
    submitProgress: {},
  });

  const startFieldValidation = useCallback((fieldKey: string) => {
    setAuthStates(prev => ({
      ...prev,
      isValidating: { ...prev.isValidating, [fieldKey]: true },
      validationErrors: { ...prev.validationErrors, [fieldKey]: '' },
    }));
  }, []);

  const stopFieldValidation = useCallback((fieldKey: string, error?: string) => {
    setAuthStates(prev => ({
      ...prev,
      isValidating: { ...prev.isValidating, [fieldKey]: false },
      validationErrors: { ...prev.validationErrors, [fieldKey]: error || '' },
    }));
  }, []);

  const updateSubmitProgress = useCallback((formKey: string, progress: number) => {
    setAuthStates(prev => ({
      ...prev,
      submitProgress: { ...prev.submitProgress, [formKey]: Math.min(100, Math.max(0, progress)) },
    }));
  }, []);

  const submitAuthForm = useCallback(async (
    formKey: string,
    submitFn: () => Promise<any>,
    options?: {
      timeout?: number;
      showProgress?: boolean;
      onProgress?: (progress: number) => void;
      onTimeout?: () => void;
      onSuccess?: (result: any) => void;
      onError?: (error: any) => void;
    }
  ) => {
    try {
      loadingManager.startLoading(formKey, { timeout: options?.timeout });
      
      if (options?.showProgress) {
        updateSubmitProgress(formKey, 0);
        
        // Simulate progress updates
        const progressInterval = setInterval(() => {
          setAuthStates(prev => {
            const currentProgress = prev.submitProgress[formKey] || 0;
            const newProgress = Math.min(90, currentProgress + Math.random() * 20);
            options?.onProgress?.(newProgress);
            return {
              ...prev,
              submitProgress: { ...prev.submitProgress, [formKey]: newProgress },
            };
          });
        }, 200);

        try {
          const result = await submitFn();
          clearInterval(progressInterval);
          updateSubmitProgress(formKey, 100);
          
          // Show completion for a moment
          setTimeout(() => {
            loadingManager.stopLoading(formKey, true);
            options?.onSuccess?.(result);
          }, 500);
          
          return result;
        } catch (error) {
          clearInterval(progressInterval);
          throw error;
        }
      } else {
        const result = await submitFn();
        loadingManager.stopLoading(formKey, true);
        options?.onSuccess?.(result);
        return result;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      loadingManager.stopLoading(formKey, false, errorMessage);
      updateSubmitProgress(formKey, 0);
      options?.onError?.(error);
      throw error;
    }
  }, [loadingManager, updateSubmitProgress]);

  const resetAuthStates = useCallback(() => {
    setAuthStates({
      isValidating: {},
      validationErrors: {},
      submitProgress: {},
    });
  }, []);

  return {
    ...loadingManager,
    // Field validation states
    isValidating: (fieldKey: string) => authStates.isValidating[fieldKey] || false,
    getValidationError: (fieldKey: string) => authStates.validationErrors[fieldKey],
    startFieldValidation,
    stopFieldValidation,
    
    // Submit progress
    getSubmitProgress: (formKey: string) => authStates.submitProgress[formKey] || 0,
    updateSubmitProgress,
    
    // Enhanced submit function
    submitAuthForm,
    
    // Reset functions
    resetAuthStates,
  };
}

/**
 * Multi-step form loading state manager
 */
export function useMultiStepLoadingState(totalSteps: number) {
  const loadingManager = useLoadingStateManager({
    timeout: 45000, // Longer timeout for multi-step forms
    retryAttempts: 2,
    persistAcrossRenders: true,
  });

  const [stepStates, setStepStates] = useState<{
    currentStep: number;
    completedSteps: Set<number>;
    stepErrors: Record<number, string>;
    stepProgress: Record<number, number>;
  }>({
    currentStep: 1,
    completedSteps: new Set(),
    stepErrors: {},
    stepProgress: {},
  });

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setStepStates(prev => ({
        ...prev,
        currentStep: step,
      }));
    }
  }, [totalSteps]);

  const completeStep = useCallback((step: number) => {
    setStepStates(prev => ({
      ...prev,
      completedSteps: new Set([...prev.completedSteps, step]),
      stepErrors: { ...prev.stepErrors, [step]: '' },
    }));
  }, []);

  const setStepError = useCallback((step: number, error: string) => {
    setStepStates(prev => ({
      ...prev,
      stepErrors: { ...prev.stepErrors, [step]: error },
    }));
  }, []);

  const updateStepProgress = useCallback((step: number, progress: number) => {
    setStepStates(prev => ({
      ...prev,
      stepProgress: { ...prev.stepProgress, [step]: Math.min(100, Math.max(0, progress)) },
    }));
  }, []);

  const nextStep = useCallback(() => {
    if (stepStates.currentStep < totalSteps) {
      completeStep(stepStates.currentStep);
      goToStep(stepStates.currentStep + 1);
    }
  }, [stepStates.currentStep, totalSteps, completeStep, goToStep]);

  const previousStep = useCallback(() => {
    if (stepStates.currentStep > 1) {
      goToStep(stepStates.currentStep - 1);
    }
  }, [stepStates.currentStep, goToStep]);

  const submitStep = useCallback(async (
    step: number,
    submitFn: () => Promise<any>,
    options?: {
      autoAdvance?: boolean;
      showProgress?: boolean;
      onSuccess?: (result: any) => void;
      onError?: (error: any) => void;
    }
  ) => {
    const stepKey = `step-${step}`;
    
    try {
      loadingManager.startLoading(stepKey);
      
      if (options?.showProgress) {
        updateStepProgress(step, 0);
        
        const progressInterval = setInterval(() => {
          setStepStates(prev => {
            const currentProgress = prev.stepProgress[step] || 0;
            const newProgress = Math.min(90, currentProgress + Math.random() * 15);
            return {
              ...prev,
              stepProgress: { ...prev.stepProgress, [step]: newProgress },
            };
          });
        }, 150);

        try {
          const result = await submitFn();
          clearInterval(progressInterval);
          updateStepProgress(step, 100);
          
          setTimeout(() => {
            loadingManager.stopLoading(stepKey, true);
            completeStep(step);
            
            if (options?.autoAdvance && step < totalSteps) {
              goToStep(step + 1);
            }
            
            options?.onSuccess?.(result);
          }, 300);
          
          return result;
        } catch (error) {
          clearInterval(progressInterval);
          throw error;
        }
      } else {
        const result = await submitFn();
        loadingManager.stopLoading(stepKey, true);
        completeStep(step);
        
        if (options?.autoAdvance && step < totalSteps) {
          goToStep(step + 1);
        }
        
        options?.onSuccess?.(result);
        return result;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      loadingManager.stopLoading(stepKey, false, errorMessage);
      setStepError(step, errorMessage);
      updateStepProgress(step, 0);
      options?.onError?.(error);
      throw error;
    }
  }, [loadingManager, completeStep, goToStep, totalSteps, updateStepProgress, setStepError]);

  const resetSteps = useCallback(() => {
    setStepStates({
      currentStep: 1,
      completedSteps: new Set(),
      stepErrors: {},
      stepProgress: {},
    });
    loadingManager.stopAllLoading();
  }, [loadingManager]);

  return {
    ...loadingManager,
    // Step navigation
    currentStep: stepStates.currentStep,
    totalSteps,
    goToStep,
    nextStep,
    previousStep,
    
    // Step states
    isStepCompleted: (step: number) => stepStates.completedSteps.has(step),
    getStepError: (step: number) => stepStates.stepErrors[step] || '',
    getStepProgress: (step: number) => stepStates.stepProgress[step] || 0,
    hasStepError: (step: number) => Boolean(stepStates.stepErrors[step]),
    
    // Step operations
    completeStep,
    setStepError,
    updateStepProgress,
    submitStep,
    
    // Utilities
    isFirstStep: stepStates.currentStep === 1,
    isLastStep: stepStates.currentStep === totalSteps,
    completedStepsCount: stepStates.completedSteps.size,
    overallProgress: (stepStates.completedSteps.size / totalSteps) * 100,
    
    // Reset
    resetSteps,
  };
}