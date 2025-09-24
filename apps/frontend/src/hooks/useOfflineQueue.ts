import { useState, useEffect, useCallback, useRef } from 'react';
import { useOfflineDetection } from './useOfflineDetection';

interface QueuedRequest {
  id: string;
  type: 'login' | 'register' | 'forgot-password' | 'reset-password';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface OfflineQueueConfig {
  maxQueueSize?: number;
  maxRetries?: number;
  retryDelay?: number;
  persistQueue?: boolean;
}

interface UseOfflineQueueReturn {
  queuedRequests: QueuedRequest[];
  queueRequest: (type: QueuedRequest['type'], data: any, maxRetries?: number) => string;
  removeRequest: (id: string) => void;
  clearQueue: () => void;
  processQueue: () => Promise<void>;
  isProcessing: boolean;
  queueSize: number;
}

const QUEUE_STORAGE_KEY = 'offline_auth_queue';
const DEFAULT_CONFIG: Required<OfflineQueueConfig> = {
  maxQueueSize: 10,
  maxRetries: 3,
  retryDelay: 2000,
  persistQueue: true,
};

/**
 * Hook for managing offline authentication requests queue
 */
export const useOfflineQueue = (
  config: OfflineQueueConfig = {}
): UseOfflineQueueReturn => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const { maxQueueSize, maxRetries, retryDelay, persistQueue } = mergedConfig;

  const [queuedRequests, setQueuedRequests] = useState<QueuedRequest[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { isOnline } = useOfflineDetection();
  const processingRef = useRef(false);

  /**
   * Generate unique ID for queued requests
   */
  const generateId = useCallback((): string => {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  /**
   * Load queue from localStorage
   */
  const loadQueue = useCallback((): QueuedRequest[] => {
    if (!persistQueue || typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (!stored) return [];

      const parsed: QueuedRequest[] = JSON.parse(stored);
      
      // Filter out expired requests (older than 24 hours)
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours
      
      return parsed.filter(request => (now - request.timestamp) < maxAge);
    } catch (error) {
      console.error('Error loading offline queue:', error);
      return [];
    }
  }, [persistQueue]);

  /**
   * Save queue to localStorage
   */
  const saveQueue = useCallback((queue: QueuedRequest[]) => {
    if (!persistQueue || typeof window === 'undefined') return;

    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Error saving offline queue:', error);
    }
  }, [persistQueue]);

  /**
   * Add request to queue
   */
  const queueRequest = useCallback((
    type: QueuedRequest['type'],
    data: any,
    requestMaxRetries: number = maxRetries
  ): string => {
    const id = generateId();
    
    const newRequest: QueuedRequest = {
      id,
      type,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: requestMaxRetries,
    };

    setQueuedRequests(prev => {
      const updated = [...prev, newRequest];
      
      // Enforce max queue size (remove oldest requests)
      if (updated.length > maxQueueSize) {
        updated.splice(0, updated.length - maxQueueSize);
      }
      
      saveQueue(updated);
      return updated;
    });

    return id;
  }, [generateId, maxRetries, maxQueueSize, saveQueue]);

  /**
   * Remove request from queue
   */
  const removeRequest = useCallback((id: string) => {
    setQueuedRequests(prev => {
      const updated = prev.filter(request => request.id !== id);
      saveQueue(updated);
      return updated;
    });
  }, [saveQueue]);

  /**
   * Clear entire queue
   */
  const clearQueue = useCallback(() => {
    setQueuedRequests([]);
    if (persistQueue && typeof window !== 'undefined') {
      localStorage.removeItem(QUEUE_STORAGE_KEY);
    }
  }, [persistQueue]);

  /**
   * Process a single queued request
   */
  const processRequest = useCallback(async (request: QueuedRequest): Promise<boolean> => {
    try {
      let endpoint = '';
      let method = 'POST';
      
      switch (request.type) {
        case 'login':
          endpoint = '/api/auth/login';
          break;
        case 'register':
          endpoint = '/api/auth/register';
          break;
        case 'forgot-password':
          endpoint = '/api/auth/forgot-password';
          break;
        case 'reset-password':
          endpoint = '/api/auth/reset-password';
          break;
        default:
          throw new Error(`Unknown request type: ${request.type}`);
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request.data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Request successful
      return true;
    } catch (error) {
      console.error(`Error processing queued ${request.type} request:`, error);
      return false;
    }
  }, []);

  /**
   * Process all queued requests
   */
  const processQueue = useCallback(async () => {
    if (!isOnline || processingRef.current || queuedRequests.length === 0) {
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);

    try {
      const requestsToProcess = [...queuedRequests];
      const failedRequests: QueuedRequest[] = [];

      for (const request of requestsToProcess) {
        const success = await processRequest(request);
        
        if (success) {
          // Remove successful request from queue
          removeRequest(request.id);
        } else {
          // Increment retry count
          const updatedRequest = {
            ...request,
            retryCount: request.retryCount + 1,
          };

          if (updatedRequest.retryCount < updatedRequest.maxRetries) {
            failedRequests.push(updatedRequest);
          } else {
            // Max retries reached, remove from queue
            removeRequest(request.id);
            console.warn(`Max retries reached for ${request.type} request, removing from queue`);
          }
        }

        // Add delay between requests to avoid overwhelming the server
        if (requestsToProcess.indexOf(request) < requestsToProcess.length - 1) {
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }

      // Update queue with failed requests that still have retries left
      if (failedRequests.length > 0) {
        setQueuedRequests(prev => {
          const updated = prev.map(request => {
            const failedRequest = failedRequests.find(fr => fr.id === request.id);
            return failedRequest || request;
          });
          saveQueue(updated);
          return updated;
        });
      }
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, [isOnline, queuedRequests, processRequest, removeRequest, retryDelay, saveQueue]);

  /**
   * Initialize queue from localStorage
   */
  useEffect(() => {
    const savedQueue = loadQueue();
    if (savedQueue.length > 0) {
      setQueuedRequests(savedQueue);
    }
  }, [loadQueue]);

  /**
   * Auto-process queue when coming back online
   */
  useEffect(() => {
    if (isOnline && queuedRequests.length > 0 && !processingRef.current) {
      // Add a small delay to ensure connection is stable
      const timer = setTimeout(() => {
        processQueue();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isOnline, queuedRequests.length, processQueue]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      processingRef.current = false;
    };
  }, []);

  return {
    queuedRequests,
    queueRequest,
    removeRequest,
    clearQueue,
    processQueue,
    isProcessing,
    queueSize: queuedRequests.length,
  };
};

export default useOfflineQueue;