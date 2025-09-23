'use client';

import { useState, useCallback } from 'react';
import { APIErrorHandler } from '../lib/api/error-handler';
import type { APIError } from '../types/api';

interface UseApiMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: APIError, variables: TVariables) => void;
  onSettled?: (data: TData | null, error: APIError | null, variables: TVariables) => void;
}

interface UseApiMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  loading: boolean;
  error: APIError | null;
  data: TData | null;
  reset: () => void;
}

/**
 * Custom hook for API mutations with loading states optimized for mobile
 */
export function useApiMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseApiMutationOptions<TData, TVariables> = {}
): UseApiMutationResult<TData, TVariables> {
  const { onSuccess, onError, onSettled } = options;

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<APIError | null>(null);
  const [data, setData] = useState<TData | null>(null);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  const executeMutation = useCallback(async (variables: TVariables): Promise<TData> => {
    setLoading(true);
    setError(null);

    try {
      const result = await mutationFn(variables);
      setData(result);
      onSuccess?.(result, variables);
      onSettled?.(result, null, variables);
      return result;
    } catch (err: any) {
      const apiError = APIErrorHandler.handleError(err);
      setError(apiError);
      onError?.(apiError, variables);
      onSettled?.(null, apiError, variables);
      
      // Show user-friendly error message
      APIErrorHandler.showErrorToUser(apiError);
      
      throw apiError;
    } finally {
      setLoading(false);
    }
  }, [mutationFn, onSuccess, onError, onSettled]);

  const mutate = useCallback(async (variables: TVariables): Promise<TData> => {
    return executeMutation(variables);
  }, [executeMutation]);

  const mutateAsync = useCallback(async (variables: TVariables): Promise<TData> => {
    return executeMutation(variables);
  }, [executeMutation]);

  return {
    mutate,
    mutateAsync,
    loading,
    error,
    data,
    reset,
  };
}