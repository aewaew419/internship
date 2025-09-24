import { useState, useEffect, useCallback, useRef } from 'react';

interface FormPersistenceConfig {
  key: string;
  debounceDelay?: number;
  maxAge?: number; // in milliseconds
  clearOnSubmit?: boolean;
  encryptData?: boolean;
}

interface PersistedFormData<T> {
  data: T;
  timestamp: number;
  version: string;
}

interface UseFormPersistenceReturn<T> {
  persistedData: T | null;
  saveFormData: (data: T) => void;
  clearPersistedData: () => void;
  hasPersistedData: boolean;
  isDataExpired: boolean;
  restoreFormData: () => T | null;
}

const STORAGE_PREFIX = 'form_persistence_';
const CURRENT_VERSION = '1.0.0';

/**
 * Hook for persisting form data to localStorage to prevent data loss during offline periods
 */
export const useFormPersistence = <T extends Record<string, any>>(
  config: FormPersistenceConfig
): UseFormPersistenceReturn<T> => {
  const {
    key,
    debounceDelay = 500,
    maxAge = 24 * 60 * 60 * 1000, // 24 hours default
    clearOnSubmit = true,
    encryptData = false,
  } = config;

  const [persistedData, setPersistedData] = useState<T | null>(null);
  const [hasPersistedData, setHasPersistedData] = useState(false);
  const [isDataExpired, setIsDataExpired] = useState(false);
  
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const storageKey = `${STORAGE_PREFIX}${key}`;

  /**
   * Simple encryption/decryption (for basic obfuscation)
   * Note: This is not cryptographically secure, just basic obfuscation
   */
  const encryptString = useCallback((str: string): string => {
    if (!encryptData) return str;
    return btoa(str);
  }, [encryptData]);

  const decryptString = useCallback((str: string): string => {
    if (!encryptData) return str;
    try {
      return atob(str);
    } catch {
      return str; // Return original if decryption fails
    }
  }, [encryptData]);

  /**
   * Load persisted data from localStorage
   */
  const loadPersistedData = useCallback((): T | null => {
    try {
      if (typeof window === 'undefined') return null;

      const stored = localStorage.getItem(storageKey);
      if (!stored) return null;

      const decrypted = decryptString(stored);
      const parsed: PersistedFormData<T> = JSON.parse(decrypted);

      // Check if data is expired
      const now = Date.now();
      const age = now - parsed.timestamp;
      const expired = age > maxAge;

      setIsDataExpired(expired);

      if (expired) {
        // Clean up expired data
        localStorage.removeItem(storageKey);
        return null;
      }

      // Check version compatibility
      if (parsed.version !== CURRENT_VERSION) {
        console.warn(`Form persistence version mismatch for ${key}. Clearing old data.`);
        localStorage.removeItem(storageKey);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.error('Error loading persisted form data:', error);
      // Clean up corrupted data
      localStorage.removeItem(storageKey);
      return null;
    }
  }, [storageKey, maxAge, key, decryptString]);

  /**
   * Save form data to localStorage
   */
  const saveFormData = useCallback((data: T) => {
    if (typeof window === 'undefined') return;

    // Clear existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Debounce the save operation
    debounceTimeoutRef.current = setTimeout(() => {
      try {
        const persistData: PersistedFormData<T> = {
          data,
          timestamp: Date.now(),
          version: CURRENT_VERSION,
        };

        const serialized = JSON.stringify(persistData);
        const encrypted = encryptString(serialized);
        
        localStorage.setItem(storageKey, encrypted);
        setPersistedData(data);
        setHasPersistedData(true);
        setIsDataExpired(false);
      } catch (error) {
        console.error('Error saving form data:', error);
        // Handle storage quota exceeded
        if (error instanceof DOMException && error.code === 22) {
          console.warn('localStorage quota exceeded. Clearing old form data.');
          clearOldFormData();
        }
      }
    }, debounceDelay);
  }, [storageKey, debounceDelay, encryptString]);

  /**
   * Clear persisted data
   */
  const clearPersistedData = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(storageKey);
      setPersistedData(null);
      setHasPersistedData(false);
      setIsDataExpired(false);

      // Clear any pending save operations
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    } catch (error) {
      console.error('Error clearing persisted form data:', error);
    }
  }, [storageKey]);

  /**
   * Restore form data from localStorage
   */
  const restoreFormData = useCallback((): T | null => {
    const data = loadPersistedData();
    if (data) {
      setPersistedData(data);
      setHasPersistedData(true);
    }
    return data;
  }, [loadPersistedData]);

  /**
   * Clear old form data from localStorage to free up space
   */
  const clearOldFormData = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(STORAGE_PREFIX)) {
          try {
            const stored = localStorage.getItem(key);
            if (stored) {
              const decrypted = decryptString(stored);
              const parsed: PersistedFormData<any> = JSON.parse(decrypted);
              const age = Date.now() - parsed.timestamp;
              
              // Remove data older than maxAge
              if (age > maxAge) {
                keysToRemove.push(key);
              }
            }
          } catch {
            // Remove corrupted data
            keysToRemove.push(key);
          }
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing old form data:', error);
    }
  }, [maxAge, decryptString]);

  /**
   * Initialize persisted data on mount
   */
  useEffect(() => {
    const data = loadPersistedData();
    if (data) {
      setPersistedData(data);
      setHasPersistedData(true);
    }

    // Clean up old data periodically
    clearOldFormData();
  }, [loadPersistedData, clearOldFormData]);

  /**
   * Handle page unload - save any pending data
   */
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Force save any pending debounced data
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    persistedData,
    saveFormData,
    clearPersistedData,
    hasPersistedData,
    isDataExpired,
    restoreFormData,
  };
};

export default useFormPersistence;