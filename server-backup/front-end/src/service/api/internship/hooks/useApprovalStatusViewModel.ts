import { useState, useEffect, useCallback, useRef } from 'react';
import { InternshipApprovalService } from '../InternshipApprovalService';
import { getStatusDisplayConfig } from '../config';
import { useRealTimeUpdates } from '../../../../utils/realTimeUpdates';
import type { 
  ApprovalStatusData, 
  InternshipApprovalStatus,
  StatusDisplayConfig 
} from '../type';

/**
 * Configuration for ApprovalStatusViewModel
 * Based on requirements 5.3, 6.4
 */
export interface ApprovalStatusViewModelConfig {
  // Real-time refresh interval in milliseconds (default: 30 seconds)
  refreshInterval?: number;
  // Enable automatic refresh
  enableAutoRefresh?: boolean;
  // Enable refresh on window focus
  refreshOnFocus?: boolean;
  // Maximum number of retry attempts on failure
  maxRetries?: number;
}

/**
 * ApprovalStatusViewModel state interface
 * Based on requirements 1.1, 1.2, 1.3, 5.3
 */
export interface ApprovalStatusViewModelState {
  // Core status data
  approvalStatus: ApprovalStatusData | null;
  currentStatus: InternshipApprovalStatus | null;
  statusConfig: StatusDisplayConfig | null;
  
  // Loading and error states
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  
  // Real-time update states
  isAutoRefreshing: boolean;
  lastRefreshTime: Date | null;
  nextRefreshTime: Date | null;
  
  // Retry mechanism states
  retryCount: number;
  canRetry: boolean;
}

/**
 * ApprovalStatusViewModel methods interface
 * Based on requirements 1.1, 1.2, 5.3, 6.4
 */
export interface ApprovalStatusViewModelMethods {
  // Data fetching methods
  fetchApprovalStatus: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  
  // Real-time update controls
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
  
  // Error handling
  clearError: () => void;
  retryFetch: () => Promise<void>;
  
  // Status formatting utilities
  getFormattedStatusText: () => string;
  getStatusColor: () => string;
  getStatusIcon: () => string;
}

/**
 * Complete ApprovalStatusViewModel interface
 */
export interface ApprovalStatusViewModel extends ApprovalStatusViewModelState, ApprovalStatusViewModelMethods {}

/**
 * Default configuration for ApprovalStatusViewModel
 */
const DEFAULT_CONFIG: Required<ApprovalStatusViewModelConfig> = {
  refreshInterval: 30000, // 30 seconds
  enableAutoRefresh: true,
  refreshOnFocus: true,
  maxRetries: 3
};

/**
 * Custom hook for managing internship approval status display
 * Based on requirements 1.1, 1.2, 1.3, 5.3, 6.4
 * 
 * @param studentEnrollId - The student enrollment ID to track
 * @param config - Configuration options for the ViewModel
 * @returns ApprovalStatusViewModel interface with state and methods
 */
export const useApprovalStatusViewModel = (
  studentEnrollId: number,
  config: ApprovalStatusViewModelConfig = {}
): ApprovalStatusViewModel => {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Service instance
  const approvalService = useRef(new InternshipApprovalService());
  
  // Core state management
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  
  // Derived state
  const currentStatus = approvalStatus?.currentStatus || null;
  const statusConfig = currentStatus ? getStatusDisplayConfig(currentStatus) : null;
  const canRetry = retryCount < fullConfig.maxRetries;
  
  /**
   * Core fetch function for approval status
   * Based on requirements 1.1, 1.2, 6.4
   */
  const fetchApprovalStatus = useCallback(async (): Promise<void> => {
    if (!studentEnrollId || studentEnrollId <= 0) {
      setError('Invalid student enrollment ID');
      return;
    }
    
    try {
      setError(null);
      
      const statusData = await approvalService.current.getApprovalStatus(studentEnrollId);
      setApprovalStatus(statusData);
      setRetryCount(0); // Reset retry count on success
      setLastRefreshTime(new Date());
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch approval status';
      setError(errorMessage);
      setRetryCount(prev => prev + 1);
      
      // Log error for debugging
      console.error('ApprovalStatusViewModel: Failed to fetch status:', err);
      
      // Don't re-throw for initial load to prevent unhandled rejections
      // Real-time updates will handle errors internally
    }
  }, [studentEnrollId]);
  
  /**
   * Refresh function with loading state management
   * Based on requirements 5.3, 6.4
   */
  const refreshStatus = useCallback(async (): Promise<void> => {
    setIsRefreshing(true);
    try {
      await fetchApprovalStatus();
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchApprovalStatus]);
  
  /**
   * Initial load function with loading state
   */
  const initialLoad = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await fetchApprovalStatus();
    } finally {
      setIsLoading(false);
    }
  }, [fetchApprovalStatus]);
  
  // Real-time updates integration
  const realTimeUpdates = useRealTimeUpdates(refreshStatus, {
    refreshInterval: fullConfig.refreshInterval,
    enableAutoRefresh: fullConfig.enableAutoRefresh,
    refreshOnFocus: fullConfig.refreshOnFocus,
    maxFailures: fullConfig.maxRetries
  });
  
  /**
   * Retry mechanism for failed requests
   * Based on requirement 6.4
   */
  const retryFetch = useCallback(async (): Promise<void> => {
    if (!canRetry) {
      throw new Error('Maximum retry attempts exceeded');
    }
    
    await refreshStatus();
  }, [canRetry, refreshStatus]);
  
  /**
   * Clear error state
   */
  const clearError = useCallback((): void => {
    setError(null);
    setRetryCount(0);
  }, []);
  
  /**
   * Status formatting utilities
   * Based on requirements 1.1, 1.2, 1.3, 5.1, 5.2
   */
  const getFormattedStatusText = useCallback((): string => {
    if (!statusConfig) return 'ไม่พบข้อมูลสถานะ';
    return statusConfig.text;
  }, [statusConfig]);
  
  const getStatusColor = useCallback((): string => {
    if (!statusConfig) return '#9E9E9E'; // Default gray
    return statusConfig.color;
  }, [statusConfig]);
  
  const getStatusIcon = useCallback((): string => {
    if (!statusConfig) return 'unknown';
    return statusConfig.icon;
  }, [statusConfig]);
  
  // Initial data load on mount or studentEnrollId change
  useEffect(() => {
    if (studentEnrollId && studentEnrollId > 0) {
      initialLoad();
    } else if (studentEnrollId !== undefined) {
      // Set error for invalid studentEnrollId
      setError('Invalid student enrollment ID');
    }
  }, [studentEnrollId, initialLoad]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      realTimeUpdates.stopAutoRefresh();
    };
  }, [realTimeUpdates]);
  
  return {
    // State
    approvalStatus,
    currentStatus,
    statusConfig,
    isLoading,
    isRefreshing,
    error,
    isAutoRefreshing: realTimeUpdates.isAutoRefreshing,
    lastRefreshTime,
    nextRefreshTime: realTimeUpdates.stalenessInfo.nextRefreshTime,
    retryCount,
    canRetry,
    
    // Methods
    fetchApprovalStatus,
    refreshStatus,
    startAutoRefresh: realTimeUpdates.startAutoRefresh,
    stopAutoRefresh: realTimeUpdates.stopAutoRefresh,
    clearError,
    retryFetch,
    getFormattedStatusText,
    getStatusColor,
    getStatusIcon
  };
};

export default useApprovalStatusViewModel;