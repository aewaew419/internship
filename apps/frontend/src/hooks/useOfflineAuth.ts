import { useCallback, useEffect, useState } from 'react';
import { useOfflineDetection } from './useOfflineDetection';
import { useOfflineQueue } from './useOfflineQueue';
import { useFormPersistence } from './useFormPersistence';

interface OfflineAuthConfig {
  enableFormPersistence?: boolean;
  enableRequestQueue?: boolean;
  showOfflineMessages?: boolean;
  autoRetryOnReconnect?: boolean;
}

interface OfflineAuthState {
  isOnline: boolean;
  hasQueuedRequests: boolean;
  isProcessingQueue: boolean;
  offlineMessage: string | null;
}

interface UseOfflineAuthReturn extends OfflineAuthState {
  // Form persistence
  saveFormData: <T>(formId: string, data: T) => void;
  restoreFormData: <T>(formId: string) => T | null;
  clearFormData: (formId: string) => void;
  hasPersistedData: (formId: string) => boolean;
  
  // Request queue
  queueAuthRequest: (type: 'login' | 'register' | 'forgot-password' | 'reset-password', data: any) => string;
  clearAuthQueue: () => void;
  processAuthQueue: () => Promise<void>;
  
  // Offline handling
  handleOfflineSubmit: <T>(
    formId: string,
    requestType: 'login' | 'register' | 'forgot-password' | 'reset-password',
    formData: T,
    onlineSubmit: (data: T) => Promise<any>
  ) => Promise<{ success: boolean; queued?: boolean; error?: string }>;
  
  // Status and messages
  getOfflineMessage: () => string;
  dismissOfflineMessage: () => void;
}

const DEFAULT_CONFIG: Required<OfflineAuthConfig> = {
  enableFormPersistence: true,
  enableRequestQueue: true,
  showOfflineMessages: true,
  autoRetryOnReconnect: true,
};

const OFFLINE_MESSAGES = {
  offline: 'ไม่มีการเชื่อมต่ออินเทอร์เน็ต ข้อมูลของคุณจะถูกบันทึกไว้และส่งเมื่อเชื่อมต่อใหม่',
  queued: 'คำขอของคุณถูกเก็บไว้ในคิวแล้ว จะดำเนินการเมื่อเชื่อมต่ออินเทอร์เน็ตใหม่',
  processing: 'กำลังดำเนินการคำขอที่ค้างอยู่...',
  reconnected: 'เชื่อมต่ออินเทอร์เน็ตแล้ว กำลังดำเนินการคำขอที่ค้างอยู่',
  error: 'เกิดข้อผิดพลาดในการดำเนินการ กรุณาลองใหม่อีกครั้ง',
};

/**
 * Comprehensive hook for handling offline authentication scenarios
 */
export const useOfflineAuth = (
  config: OfflineAuthConfig = {}
): UseOfflineAuthReturn => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const {
    enableFormPersistence,
    enableRequestQueue,
    showOfflineMessages,
    autoRetryOnReconnect,
  } = mergedConfig;

  const { isOnline, isChecking } = useOfflineDetection();
  const {
    queuedRequests,
    queueRequest,
    clearQueue,
    processQueue,
    isProcessing,
    removeRequest,
  } = useOfflineQueue();

  const [offlineMessage, setOfflineMessage] = useState<string | null>(null);
  const [formPersistenceHooks] = useState<Map<string, any>>(new Map());

  /**
   * Get or create form persistence hook for a specific form
   */
  const getFormPersistenceHook = useCallback(<T>(formId: string) => {
    if (!enableFormPersistence) return null;

    if (!formPersistenceHooks.has(formId)) {
      // This is a simplified approach - in a real implementation,
      // you might want to use a different pattern for dynamic hook creation
      const hook = {
        saveFormData: (data: T) => {
          if (typeof window !== 'undefined') {
            localStorage.setItem(`form_${formId}`, JSON.stringify({
              data,
              timestamp: Date.now(),
            }));
          }
        },
        restoreFormData: (): T | null => {
          if (typeof window === 'undefined') return null;
          try {
            const stored = localStorage.getItem(`form_${formId}`);
            if (!stored) return null;
            const parsed = JSON.parse(stored);
            // Check if data is not too old (24 hours)
            if (Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
              localStorage.removeItem(`form_${formId}`);
              return null;
            }
            return parsed.data;
          } catch {
            return null;
          }
        },
        clearFormData: () => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(`form_${formId}`);
          }
        },
        hasPersistedData: (): boolean => {
          if (typeof window === 'undefined') return false;
          return localStorage.getItem(`form_${formId}`) !== null;
        },
      };
      formPersistenceHooks.set(formId, hook);
    }

    return formPersistenceHooks.get(formId);
  }, [enableFormPersistence, formPersistenceHooks]);

  /**
   * Save form data for persistence
   */
  const saveFormData = useCallback(<T>(formId: string, data: T) => {
    const hook = getFormPersistenceHook<T>(formId);
    hook?.saveFormData(data);
  }, [getFormPersistenceHook]);

  /**
   * Restore form data from persistence
   */
  const restoreFormData = useCallback(<T>(formId: string): T | null => {
    const hook = getFormPersistenceHook<T>(formId);
    return hook?.restoreFormData() || null;
  }, [getFormPersistenceHook]);

  /**
   * Clear persisted form data
   */
  const clearFormData = useCallback((formId: string) => {
    const hook = getFormPersistenceHook(formId);
    hook?.clearFormData();
  }, [getFormPersistenceHook]);

  /**
   * Check if form has persisted data
   */
  const hasPersistedData = useCallback((formId: string): boolean => {
    const hook = getFormPersistenceHook(formId);
    return hook?.hasPersistedData() || false;
  }, [getFormPersistenceHook]);

  /**
   * Queue authentication request
   */
  const queueAuthRequest = useCallback((
    type: 'login' | 'register' | 'forgot-password' | 'reset-password',
    data: any
  ): string => {
    if (!enableRequestQueue) {
      throw new Error('Request queue is disabled');
    }
    return queueRequest(type, data);
  }, [enableRequestQueue, queueRequest]);

  /**
   * Clear authentication queue
   */
  const clearAuthQueue = useCallback(() => {
    if (enableRequestQueue) {
      clearQueue();
    }
  }, [enableRequestQueue, clearQueue]);

  /**
   * Process authentication queue
   */
  const processAuthQueue = useCallback(async () => {
    if (enableRequestQueue) {
      await processQueue();
    }
  }, [enableRequestQueue, processQueue]);

  /**
   * Handle form submission with offline support
   */
  const handleOfflineSubmit = useCallback(async <T>(
    formId: string,
    requestType: 'login' | 'register' | 'forgot-password' | 'reset-password',
    formData: T,
    onlineSubmit: (data: T) => Promise<any>
  ): Promise<{ success: boolean; queued?: boolean; error?: string }> => {
    // Save form data for persistence
    if (enableFormPersistence) {
      saveFormData(formId, formData);
    }

    if (isOnline) {
      try {
        const result = await onlineSubmit(formData);
        
        // Clear persisted data on successful submission
        if (enableFormPersistence) {
          clearFormData(formId);
        }
        
        return { success: true };
      } catch (error) {
        // If online but request failed, queue it for retry
        if (enableRequestQueue) {
          const queueId = queueAuthRequest(requestType, formData);
          setOfflineMessage(OFFLINE_MESSAGES.queued);
          return { success: false, queued: true, error: 'Request queued for retry' };
        }
        
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    } else {
      // Offline - queue the request
      if (enableRequestQueue) {
        const queueId = queueAuthRequest(requestType, formData);
        setOfflineMessage(OFFLINE_MESSAGES.queued);
        return { success: false, queued: true };
      }
      
      setOfflineMessage(OFFLINE_MESSAGES.offline);
      return { success: false, error: 'No internet connection' };
    }
  }, [
    isOnline,
    enableFormPersistence,
    enableRequestQueue,
    saveFormData,
    clearFormData,
    queueAuthRequest,
  ]);

  /**
   * Get current offline message
   */
  const getOfflineMessage = useCallback((): string => {
    if (!showOfflineMessages) return '';
    
    if (isProcessing) {
      return OFFLINE_MESSAGES.processing;
    }
    
    if (!isOnline) {
      return OFFLINE_MESSAGES.offline;
    }
    
    return offlineMessage || '';
  }, [showOfflineMessages, isProcessing, isOnline, offlineMessage]);

  /**
   * Dismiss offline message
   */
  const dismissOfflineMessage = useCallback(() => {
    setOfflineMessage(null);
  }, []);

  /**
   * Handle reconnection
   */
  useEffect(() => {
    if (isOnline && queuedRequests.length > 0 && autoRetryOnReconnect) {
      setOfflineMessage(OFFLINE_MESSAGES.reconnected);
      processAuthQueue();
    }
  }, [isOnline, queuedRequests.length, autoRetryOnReconnect, processAuthQueue]);

  /**
   * Update offline message based on connection status
   */
  useEffect(() => {
    if (!showOfflineMessages) return;

    if (!isOnline && !offlineMessage) {
      setOfflineMessage(OFFLINE_MESSAGES.offline);
    } else if (isOnline && offlineMessage === OFFLINE_MESSAGES.offline) {
      setOfflineMessage(null);
    }
  }, [isOnline, offlineMessage, showOfflineMessages]);

  return {
    // State
    isOnline,
    hasQueuedRequests: queuedRequests.length > 0,
    isProcessingQueue: isProcessing,
    offlineMessage,
    
    // Form persistence
    saveFormData,
    restoreFormData,
    clearFormData,
    hasPersistedData,
    
    // Request queue
    queueAuthRequest,
    clearAuthQueue,
    processAuthQueue,
    
    // Offline handling
    handleOfflineSubmit,
    
    // Status and messages
    getOfflineMessage,
    dismissOfflineMessage,
  };
};

export default useOfflineAuth;