'use client';

import { useState, useCallback } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

interface UseLoadingStateResult {
  loading: LoadingState;
  isLoading: (key?: string) => boolean;
  setLoading: (key: string, value: boolean) => void;
  startLoading: (key: string) => void;
  stopLoading: (key: string) => void;
  isAnyLoading: () => boolean;
  resetLoading: () => void;
}

/**
 * Hook for managing multiple loading states - optimized for mobile UX
 * Useful for forms with multiple submit buttons or pages with multiple async operations
 */
export function useLoadingState(initialState: LoadingState = {}): UseLoadingStateResult {
  const [loading, setLoadingState] = useState<LoadingState>(initialState);

  const isLoading = useCallback((key?: string): boolean => {
    if (!key) return Object.values(loading).some(Boolean);
    return loading[key] || false;
  }, [loading]);

  const setLoading = useCallback((key: string, value: boolean) => {
    setLoadingState(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const startLoading = useCallback((key: string) => {
    setLoading(key, true);
  }, [setLoading]);

  const stopLoading = useCallback((key: string) => {
    setLoading(key, false);
  }, [setLoading]);

  const isAnyLoading = useCallback((): boolean => {
    return Object.values(loading).some(Boolean);
  }, [loading]);

  const resetLoading = useCallback(() => {
    setLoadingState({});
  }, []);

  return {
    loading,
    isLoading,
    setLoading,
    startLoading,
    stopLoading,
    isAnyLoading,
    resetLoading,
  };
}