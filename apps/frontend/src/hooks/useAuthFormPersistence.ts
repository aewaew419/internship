import { useCallback, useEffect, useState } from 'react';
import { useFormPersistence } from './useFormPersistence';
import { useOfflineDetection } from './useOfflineDetection';

interface AuthFormPersistenceConfig {
  formType: 'student-login' | 'admin-login' | 'registration';
  clearOnSubmit?: boolean;
  maxAge?: number;
  enableOfflinePersistence?: boolean;
}

interface AuthFormPersistenceReturn<T> {
  persistedData: T | null;
  saveFormData: (data: T) => void;
  clearPersistedData: () => void;
  hasPersistedData: boolean;
  isDataExpired: boolean;
  restoreFormData: () => T | null;
  showRestorationPrompt: boolean;
  acceptRestoration: () => void;
  rejectRestoration: () => void;
  isOfflinePersistenceEnabled: boolean;
}

/**
 * Specialized hook for authentication form persistence with enhanced UX features
 */
export const useAuthFormPersistence = <T extends Record<string, any>>(
  config: AuthFormPersistenceConfig
): AuthFormPersistenceReturn<T> => {
  const {
    formType,
    clearOnSubmit = true,
    maxAge = 30 * 60 * 1000, // 30 minutes for auth forms
    enableOfflinePersistence = true,
  } = config;

  const [showRestorationPrompt, setShowRestorationPrompt] = useState(false);
  const [restorationData, setRestorationData] = useState<T | null>(null);

  const { isOffline } = useOfflineDetection();

  // Use the base form persistence hook
  const formPersistence = useFormPersistence<T>({
    key: `auth_${formType}`,
    debounceDelay: 300, // Faster debounce for auth forms
    maxAge,
    clearOnSubmit,
    encryptData: true, // Always encrypt auth form data
  });

  /**
   * Enhanced save function that considers offline state
   */
  const saveFormData = useCallback((data: T) => {
    // Only save if offline persistence is enabled or we're offline
    if (enableOfflinePersistence || isOffline) {
      // Filter out sensitive data for certain form types
      const filteredData = filterSensitiveData(data, formType);
      formPersistence.saveFormData(filteredData);
    }
  }, [formPersistence, enableOfflinePersistence, isOffline, formType]);

  /**
   * Enhanced restore function with user confirmation
   */
  const restoreFormData = useCallback((): T | null => {
    const data = formPersistence.restoreFormData();
    
    if (data && !formPersistence.isDataExpired) {
      // Show restoration prompt for user confirmation
      setRestorationData(data);
      setShowRestorationPrompt(true);
      return null; // Don't auto-restore, wait for user confirmation
    }
    
    return data;
  }, [formPersistence]);

  /**
   * Accept restoration - apply the persisted data
   */
  const acceptRestoration = useCallback(() => {
    setShowRestorationPrompt(false);
    // Return the restoration data through a callback or state
    // The component will handle applying this data
  }, []);

  /**
   * Reject restoration - clear the persisted data
   */
  const rejectRestoration = useCallback(() => {
    setShowRestorationPrompt(false);
    setRestorationData(null);
    formPersistence.clearPersistedData();
  }, [formPersistence]);

  /**
   * Filter sensitive data based on form type
   */
  const filterSensitiveData = (data: T, formType: string): T => {
    const filtered = { ...data };
    
    // Never persist passwords
    if ('password' in filtered) {
      delete (filtered as any).password;
    }
    if ('confirmPassword' in filtered) {
      delete (filtered as any).confirmPassword;
    }
    
    // For login forms, be more restrictive
    if (formType.includes('login')) {
      // Only persist non-sensitive identifiers
      const allowedFields = ['email', 'studentId', 'student_id'];
      const loginFiltered = {} as T;
      
      allowedFields.forEach(field => {
        if (field in filtered) {
          (loginFiltered as any)[field] = (filtered as any)[field];
        }
      });
      
      return loginFiltered;
    }
    
    return filtered;
  };

  /**
   * Initialize restoration check on mount
   */
  useEffect(() => {
    // Check for persisted data on component mount
    const data = formPersistence.persistedData;
    if (data && !formPersistence.isDataExpired) {
      setRestorationData(data);
      setShowRestorationPrompt(true);
    }
  }, [formPersistence.persistedData, formPersistence.isDataExpired]);

  return {
    persistedData: restorationData,
    saveFormData,
    clearPersistedData: formPersistence.clearPersistedData,
    hasPersistedData: formPersistence.hasPersistedData,
    isDataExpired: formPersistence.isDataExpired,
    restoreFormData,
    showRestorationPrompt,
    acceptRestoration,
    rejectRestoration,
    isOfflinePersistenceEnabled: enableOfflinePersistence,
  };
};

export default useAuthFormPersistence;