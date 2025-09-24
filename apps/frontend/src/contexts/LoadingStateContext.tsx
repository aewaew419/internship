'use client';

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { useLoadingStateManager } from '@/hooks/useLoadingStateManager';

interface LoadingStateContextValue {
  // Global loading states
  isGlobalLoading: boolean;
  globalLoadingMessage: string;
  setGlobalLoading: (loading: boolean, message?: string) => void;
  
  // Form loading states
  isFormLoading: (formKey: string) => boolean;
  startFormLoading: (formKey: string, message?: string) => void;
  stopFormLoading: (formKey: string) => void;
  
  // Field validation states
  isFieldValidating: (fieldKey: string) => boolean;
  startFieldValidation: (fieldKey: string) => void;
  stopFieldValidation: (fieldKey: string, hasError?: boolean) => void;
  
  // Timeout handling
  hasTimedOut: (key: string) => boolean;
  getLoadingDuration: (key: string) => number;
  
  // Persistence
  persistLoadingStates: () => void;
  restoreLoadingStates: () => void;
  
  // Utilities
  isAnyLoading: () => boolean;
  resetAllLoading: () => void;
}

const LoadingStateContext = createContext<LoadingStateContextValue | undefined>(undefined);

interface LoadingStateProviderProps {
  children: React.ReactNode;
  enablePersistence?: boolean;
  defaultTimeout?: number;
}

export function LoadingStateProvider({
  children,
  enablePersistence = true,
  defaultTimeout = 30000,
}: LoadingStateProviderProps) {
  const loadingManager = useLoadingStateManager({
    timeout: defaultTimeout,
    persistAcrossRenders: enablePersistence,
  });

  const [globalState, setGlobalState] = useState({
    isLoading: false,
    message: '',
  });

  const [fieldValidationStates, setFieldValidationStates] = useState<Record<string, boolean>>({});

  // Auto-restore states on mount if persistence is enabled
  useEffect(() => {
    if (enablePersistence) {
      loadingManager.restoreState();
    }
  }, [enablePersistence, loadingManager]);

  // Global loading management
  const setGlobalLoading = useCallback((loading: boolean, message = '') => {
    setGlobalState({ isLoading: loading, message });
    
    if (loading) {
      loadingManager.startLoading('global', { timeout: defaultTimeout });
    } else {
      loadingManager.stopLoading('global');
    }
  }, [loadingManager, defaultTimeout]);

  // Form loading management
  const startFormLoading = useCallback((formKey: string, message?: string) => {
    loadingManager.startLoading(formKey, { timeout: defaultTimeout });
    
    if (message) {
      setGlobalState(prev => ({
        ...prev,
        message: prev.isLoading ? prev.message : message,
      }));
    }
  }, [loadingManager, defaultTimeout]);

  const stopFormLoading = useCallback((formKey: string) => {
    loadingManager.stopLoading(formKey);
  }, [loadingManager]);

  const isFormLoading = useCallback((formKey: string) => {
    return loadingManager.isLoading(formKey);
  }, [loadingManager]);

  // Field validation management
  const startFieldValidation = useCallback((fieldKey: string) => {
    setFieldValidationStates(prev => ({
      ...prev,
      [fieldKey]: true,
    }));
    
    loadingManager.startLoading(`field-${fieldKey}`, { timeout: 10000 });
  }, [loadingManager]);

  const stopFieldValidation = useCallback((fieldKey: string, hasError = false) => {
    setFieldValidationStates(prev => ({
      ...prev,
      [fieldKey]: false,
    }));
    
    loadingManager.stopLoading(`field-${fieldKey}`, !hasError);
  }, [loadingManager]);

  const isFieldValidating = useCallback((fieldKey: string) => {
    return fieldValidationStates[fieldKey] || false;
  }, [fieldValidationStates]);

  // Timeout and duration utilities
  const hasTimedOut = useCallback((key: string) => {
    return loadingManager.hasTimedOut(key);
  }, [loadingManager]);

  const getLoadingDuration = useCallback((key: string) => {
    return loadingManager.getLoadingDuration(key);
  }, [loadingManager]);

  // Persistence utilities
  const persistLoadingStates = useCallback(() => {
    if (enablePersistence) {
      loadingManager.persistState();
    }
  }, [enablePersistence, loadingManager]);

  const restoreLoadingStates = useCallback(() => {
    if (enablePersistence) {
      loadingManager.restoreState();
    }
  }, [enablePersistence, loadingManager]);

  // General utilities
  const isAnyLoading = useCallback(() => {
    return globalState.isLoading || loadingManager.isAnyLoading();
  }, [globalState.isLoading, loadingManager]);

  const resetAllLoading = useCallback(() => {
    setGlobalState({ isLoading: false, message: '' });
    setFieldValidationStates({});
    loadingManager.stopAllLoading();
  }, [loadingManager]);

  const contextValue: LoadingStateContextValue = {
    // Global loading
    isGlobalLoading: globalState.isLoading,
    globalLoadingMessage: globalState.message,
    setGlobalLoading,
    
    // Form loading
    isFormLoading,
    startFormLoading,
    stopFormLoading,
    
    // Field validation
    isFieldValidating,
    startFieldValidation,
    stopFieldValidation,
    
    // Timeout handling
    hasTimedOut,
    getLoadingDuration,
    
    // Persistence
    persistLoadingStates,
    restoreLoadingStates,
    
    // Utilities
    isAnyLoading,
    resetAllLoading,
  };

  return (
    <LoadingStateContext.Provider value={contextValue}>
      {children}
    </LoadingStateContext.Provider>
  );
}

export function useLoadingStateContext() {
  const context = useContext(LoadingStateContext);
  if (context === undefined) {
    throw new Error('useLoadingStateContext must be used within a LoadingStateProvider');
  }
  return context;
}

/**
 * Hook for authentication-specific loading states using the context
 */
export function useAuthLoadingContext() {
  const context = useLoadingStateContext();

  const submitAuthForm = useCallback(async (
    formType: 'login' | 'register' | 'admin',
    submitFn: () => Promise<any>,
    options?: {
      onSuccess?: (result: any) => void;
      onError?: (error: any) => void;
    }
  ) => {
    const formKey = `auth-${formType}`;
    const loadingMessages = {
      login: 'กำลังเข้าสู่ระบบ...',
      register: 'กำลังสมัครสมาชิก...',
      admin: 'กำลังเข้าสู่ระบบผู้ดูแล...',
    };

    try {
      context.startFormLoading(formKey, loadingMessages[formType]);
      const result = await submitFn();
      context.stopFormLoading(formKey);
      options?.onSuccess?.(result);
      return result;
    } catch (error) {
      context.stopFormLoading(formKey);
      options?.onError?.(error);
      throw error;
    }
  }, [context]);

  const validateAuthField = useCallback(async (
    fieldKey: string,
    validationFn: () => Promise<boolean>
  ) => {
    try {
      context.startFieldValidation(fieldKey);
      const isValid = await validationFn();
      context.stopFieldValidation(fieldKey, !isValid);
      return isValid;
    } catch (error) {
      context.stopFieldValidation(fieldKey, true);
      throw error;
    }
  }, [context]);

  return {
    ...context,
    submitAuthForm,
    validateAuthField,
    
    // Auth-specific getters
    isLoginLoading: () => context.isFormLoading('auth-login'),
    isRegisterLoading: () => context.isFormLoading('auth-register'),
    isAdminLoginLoading: () => context.isFormLoading('auth-admin'),
  };
}