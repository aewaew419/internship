'use client';

import { useState, useEffect, useCallback } from 'react';
import { APIErrorHandler } from '../lib/api/error-handler';
import type { APIError } from '../types/api';

interface UseApiQueryOptions<T> {
  enabled?: boolean;
  refetchOnMount?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: APIError) => void;
}

interface UseApiQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: APIError | null;
  refetch: () => Promise<void>;
  isRefetching: boolean;
}

/**
 * Custom hook for API queries with loading states optimized for mobile
 */
export function useApiQuery<T>(
  queryFn: () => Promise<T>,
  options: UseApiQueryOptions<T> = {}
): UseApiQueryResult<T> {
  const {
    enabled = true,
    refetchOnMount = true,
    refetchInterval,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<APIError | null>(null);
  const [isRefetching, setIsRefetching] = useState<boolean>(false);

  const executeQuery = useCallback(async (isRefetch = false) => {
    if (!enabled) return;

    try {
      if (isRefetch) {
        setIsRefetching(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const result = await queryFn();
      setData(result);
      onSuccess?.(result);
    } catch (err: any) {
      const apiError = APIErrorHandler.handleError(err);
      setError(apiError);
      onError?.(apiError);
      
      // Show user-friendly error message
      APIErrorHandler.showErrorToUser(apiError);
    } finally {
      setLoading(false);
      setIsRefetching(false);
    }
  }, [queryFn, enabled, onSuccess, onError]);

  const refetch = useCallback(async () => {
    await executeQuery(true);
  }, [executeQuery]);

  // Initial fetch
  useEffect(() => {
    if (enabled && refetchOnMount) {
      executeQuery();
    }
  }, [enabled, refetchOnMount, executeQuery]);

  // Interval refetch
  useEffect(() => {
    if (!refetchInterval || !enabled) return;

    const interval = setInterval(() => {
      executeQuery(true);
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [refetchInterval, enabled, executeQuery]);

  return {
    data,
    loading,
    error,
    refetch,
    isRefetching,
  };
}