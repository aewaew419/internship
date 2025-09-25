import { useCallback, useEffect, useState } from 'react';
import { useAuthFormPersistence } from './useAuthFormPersistence';

interface FormDraftConfig {
  formType: 'student-login' | 'admin-login' | 'registration';
  autoSaveInterval?: number;
  draftExpiration?: number;
  enableNotifications?: boolean;
}

interface FormDraftReturn<T> {
  isDraftAvailable: boolean;
  draftData: T | null;
  saveDraft: (data: T, isComplete?: boolean) => void;
  loadDraft: () => T | null;
  clearDraft: () => void;
  showDraftNotification: boolean;
  acceptDraft: () => void;
  rejectDraft: () => void;
  draftAge: number;
  isAutoSaving: boolean;
}

/**
 * Hook for managing form drafts with auto-save and user notifications
 */
export const useFormDraftManager = <T extends Record<string, any>>(
  config: FormDraftConfig
): FormDraftReturn<T> => {
  const {
    formType,
    autoSaveInterval = 10000, // 10 seconds
    draftExpiration = 24 * 60 * 60 * 1000, // 24 hours
    enableNotifications = true,
  } = config;

  const [showDraftNotification, setShowDraftNotification] = useState(false);
  const [draftAge, setDraftAge] = useState(0);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<number>(0);

  // Use auth form persistence for draft storage
  const formPersistence = useAuthFormPersistence<T>({
    formType: `${formType}_draft` as any,
    clearOnSubmit: false, // Don't clear drafts on submit
    maxAge: draftExpiration,
    enableOfflinePersistence: true,
  });

  /**
   * Save draft with auto-save indication
   */
  const saveDraft = useCallback((data: T, isComplete = false) => {
    setIsAutoSaving(true);
    
    // Add metadata to draft
    const draftData = {
      ...data,
      _draftMetadata: {
        savedAt: Date.now(),
        isComplete,
        formType,
        version: '1.0.0',
      },
    };

    formPersistence.saveFormData(draftData);
    setLastSaveTime(Date.now());
    
    // Show auto-save feedback briefly
    setTimeout(() => {
      setIsAutoSaving(false);
    }, 1000);
  }, [formPersistence, formType]);

  /**
   * Load draft data
   */
  const loadDraft = useCallback((): T | null => {
    const data = formPersistence.restoreFormData();
    if (data && '_draftMetadata' in data) {
      const { _draftMetadata, ...formData } = data as any;
      setDraftAge(Date.now() - _draftMetadata.savedAt);
      return formData as T;
    }
    return data;
  }, [formPersistence]);

  /**
   * Clear draft data
   */
  const clearDraft = useCallback(() => {
    formPersistence.clearPersistedData();
    setShowDraftNotification(false);
    setDraftAge(0);
  }, [formPersistence]);

  /**
   * Accept draft - load and apply the draft data
   */
  const acceptDraft = useCallback(() => {
    setShowDraftNotification(false);
    // The component will handle loading the draft data
  }, []);

  /**
   * Reject draft - clear the draft
   */
  const rejectDraft = useCallback(() => {
    clearDraft();
  }, [clearDraft]);

  /**
   * Check for available drafts on mount
   */
  useEffect(() => {
    if (enableNotifications && formPersistence.hasPersistedData && !formPersistence.isDataExpired) {
      const data = loadDraft();
      if (data) {
        setShowDraftNotification(true);
      }
    }
  }, [formPersistence.hasPersistedData, formPersistence.isDataExpired, loadDraft, enableNotifications]);

  /**
   * Update draft age periodically
   */
  useEffect(() => {
    if (lastSaveTime > 0) {
      const interval = setInterval(() => {
        setDraftAge(Date.now() - lastSaveTime);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [lastSaveTime]);

  return {
    isDraftAvailable: formPersistence.hasPersistedData && !formPersistence.isDataExpired,
    draftData: formPersistence.persistedData,
    saveDraft,
    loadDraft,
    clearDraft,
    showDraftNotification,
    acceptDraft,
    rejectDraft,
    draftAge,
    isAutoSaving,
  };
};

export default useFormDraftManager;