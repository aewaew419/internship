import { useCallback, useEffect, useRef, useState } from 'react';
import { useDebouncedCallback } from './useDebounce';

export interface AutoSaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  saveError: string | null;
}

export interface UseAutoSaveOptions {
  enabled: boolean;
  debounceMs: number;
  onSave: () => Promise<void>;
  onError?: (error: Error) => void;
}

/**
 * Custom hook for auto-save functionality with debouncing
 */
export function useAutoSave({
  enabled,
  debounceMs,
  onSave,
  onError
}: UseAutoSaveOptions) {
  const [state, setState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false,
    saveError: null
  });

  const saveInProgress = useRef(false);
  const pendingSave = useRef(false);

  // Debounced save function
  const debouncedSave = useDebouncedCallback(async () => {
    if (!enabled || saveInProgress.current) {
      pendingSave.current = true;
      return;
    }

    saveInProgress.current = true;
    setState(prev => ({ ...prev, isSaving: true, saveError: null }));

    try {
      await onSave();
      setState(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
        hasUnsavedChanges: false,
        saveError: null
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Save failed';
      setState(prev => ({
        ...prev,
        isSaving: false,
        saveError: errorMessage
      }));
      
      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }
    } finally {
      saveInProgress.current = false;
      
      // If there was a pending save request, trigger it
      if (pendingSave.current) {
        pendingSave.current = false;
        setTimeout(() => debouncedSave(), 100);
      }
    }
  }, debounceMs);

  // Trigger save when changes are detected
  const triggerSave = useCallback(() => {
    if (!enabled) return;
    
    setState(prev => ({ ...prev, hasUnsavedChanges: true }));
    debouncedSave();
  }, [enabled, debouncedSave]);

  // Manual save function
  const saveNow = useCallback(async () => {
    if (saveInProgress.current) return;

    saveInProgress.current = true;
    setState(prev => ({ ...prev, isSaving: true, saveError: null }));

    try {
      await onSave();
      setState(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
        hasUnsavedChanges: false,
        saveError: null
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Save failed';
      setState(prev => ({
        ...prev,
        isSaving: false,
        saveError: errorMessage
      }));
      
      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }
      throw error;
    } finally {
      saveInProgress.current = false;
    }
  }, [onSave, onError]);

  // Reset unsaved changes flag
  const markAsSaved = useCallback(() => {
    setState(prev => ({
      ...prev,
      hasUnsavedChanges: false,
      lastSaved: new Date(),
      saveError: null
    }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, saveError: null }));
  }, []);

  return {
    ...state,
    triggerSave,
    saveNow,
    markAsSaved,
    clearError
  };
}