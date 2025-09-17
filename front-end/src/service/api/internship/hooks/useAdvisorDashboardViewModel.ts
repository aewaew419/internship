import { useState, useEffect, useCallback, useRef } from 'react';
import { InternshipApprovalService } from '../InternshipApprovalService';
import { useRealTimeUpdates } from '../../../../utils/realTimeUpdates';
import type { AdvisorApplicationData } from '../type';

/**
 * Search and filter state for advisor dashboard
 * Based on requirements 2.1, 2.2, 2.3, 2.4
 */
export interface AdvisorDashboardFilters {
  search: string;
  major: string;
  company: string;
}

/**
 * Configuration for AdvisorDashboardViewModel
 */
export interface AdvisorDashboardViewModelConfig {
  // Real-time refresh interval in milliseconds (default: 60 seconds)
  refreshInterval?: number;
  // Enable automatic refresh
  enableAutoRefresh?: boolean;
  // Enable refresh on window focus
  refreshOnFocus?: boolean;
  // Maximum number of retry attempts on failure
  maxRetries?: number;
  // Page size for pagination
  pageSize?: number;
}

/**
 * AdvisorDashboardViewModel state interface
 */
export interface AdvisorDashboardViewModelState {
  // Core data
  applications: AdvisorApplicationData[];
  filteredApplications: AdvisorApplicationData[];
  
  // Loading and error states
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  
  // Filter and search states
  filters: AdvisorDashboardFilters;
  
  // Selection states
  selectedApplications: Set<number>;
  allSelected: boolean;
  someSelected: boolean;
  
  // Real-time update states
  isAutoRefreshing: boolean;
  lastRefreshTime: Date | null;
  
  // Retry mechanism states
  retryCount: number;
  canRetry: boolean;
}

/**
 * AdvisorDashboardViewModel methods interface
 */
export interface AdvisorDashboardViewModelMethods {
  // Data fetching methods
  fetchApplications: () => Promise<void>;
  refreshApplications: () => Promise<void>;
  
  // Filter and search methods
  updateFilters: (filters: Partial<AdvisorDashboardFilters>) => void;
  clearFilters: () => void;
  
  // Selection methods
  toggleSelection: (studentEnrollId: number) => void;
  toggleSelectAll: () => void;
  clearSelection: () => void;
  
  // Approval methods
  approveApplication: (studentEnrollId: number, remarks?: string) => Promise<void>;
  rejectApplication: (studentEnrollId: number, remarks?: string) => Promise<void>;
  bulkApprove: (remarks?: string) => Promise<void>;
  bulkReject: (remarks?: string) => Promise<void>;
  
  // Real-time update controls
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
  
  // Error handling
  clearError: () => void;
  retryFetch: () => Promise<void>;
}

/**
 * Complete AdvisorDashboardViewModel interface
 */
export interface AdvisorDashboardViewModel extends AdvisorDashboardViewModelState, AdvisorDashboardViewModelMethods {}

/**
 * Default configuration for AdvisorDashboardViewModel
 */
const DEFAULT_CONFIG: Required<AdvisorDashboardViewModelConfig> = {
  refreshInterval: 60000, // 60 seconds
  enableAutoRefresh: true,
  refreshOnFocus: true,
  maxRetries: 3,
  pageSize: 50
};

/**
 * Default filters
 */
const DEFAULT_FILTERS: AdvisorDashboardFilters = {
  search: '',
  major: '',
  company: ''
};

/**
 * Custom hook for managing advisor dashboard state and operations
 * Based on requirements 2.1, 2.2, 2.3, 2.4
 * 
 * @param config - Configuration options for the ViewModel
 * @returns AdvisorDashboardViewModel interface with state and methods
 */
export const useAdvisorDashboardViewModel = (
  config: AdvisorDashboardViewModelConfig = {}
): AdvisorDashboardViewModel => {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Service instance
  const approvalService = useRef(new InternshipApprovalService());
  
  // Core state management
  const [applications, setApplications] = useState<AdvisorApplicationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  
  // Filter and search state
  const [filters, setFilters] = useState<AdvisorDashboardFilters>(DEFAULT_FILTERS);
  
  // Selection state
  const [selectedApplications, setSelectedApplications] = useState<Set<number>>(new Set());
  
  // Derived state
  const canRetry = retryCount < fullConfig.maxRetries;
  
  // Filter applications based on current filters
  const filteredApplications = applications.filter(app => {
    const matchesSearch = !filters.search || 
      app.studentName.toLowerCase().includes(filters.search.toLowerCase()) ||
      app.studentId.toLowerCase().includes(filters.search.toLowerCase()) ||
      app.companyName.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesMajor = !filters.major || app.major === filters.major;
    const matchesCompany = !filters.company || app.companyName === filters.company;
    
    return matchesSearch && matchesMajor && matchesCompany;
  });
  
  // Selection derived state
  const allSelected = filteredApplications.length > 0 && 
    filteredApplications.every(app => selectedApplications.has(app.studentEnrollId));
  const someSelected = selectedApplications.size > 0 && !allSelected;
  
  /**
   * Core fetch function for advisor applications
   * Based on requirements 2.1, 2.2
   */
  const fetchApplications = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      
      const applicationsData = await approvalService.current.getAdvisorPendingApplications({
        search: filters.search || undefined,
        major: filters.major || undefined,
        company: filters.company || undefined,
        limit: fullConfig.pageSize
      });
      
      setApplications(applicationsData);
      setRetryCount(0); // Reset retry count on success
      setLastRefreshTime(new Date());
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch advisor applications';
      setError(errorMessage);
      setRetryCount(prev => prev + 1);
      
      // Log error for debugging
      console.error('AdvisorDashboardViewModel: Failed to fetch applications:', err);
    }
  }, [filters, fullConfig.pageSize]);
  
  /**
   * Refresh function with loading state management
   */
  const refreshApplications = useCallback(async (): Promise<void> => {
    setIsRefreshing(true);
    try {
      await fetchApplications();
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchApplications]);
  
  /**
   * Initial load function with loading state
   */
  const initialLoad = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await fetchApplications();
    } finally {
      setIsLoading(false);
    }
  }, [fetchApplications]);
  
  // Real-time updates integration
  const realTimeUpdates = useRealTimeUpdates(refreshApplications, {
    refreshInterval: fullConfig.refreshInterval,
    enableAutoRefresh: fullConfig.enableAutoRefresh,
    refreshOnFocus: fullConfig.refreshOnFocus,
    maxFailures: fullConfig.maxRetries
  });
  
  /**
   * Update filters and trigger refresh
   */
  const updateFilters = useCallback((newFilters: Partial<AdvisorDashboardFilters>): void => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    // Clear selection when filters change
    setSelectedApplications(new Set());
  }, []);
  
  /**
   * Clear all filters
   */
  const clearFilters = useCallback((): void => {
    setFilters(DEFAULT_FILTERS);
    setSelectedApplications(new Set());
  }, []);
  
  /**
   * Toggle selection for a single application
   */
  const toggleSelection = useCallback((studentEnrollId: number): void => {
    setSelectedApplications(prev => {
      const next = new Set(prev);
      if (next.has(studentEnrollId)) {
        next.delete(studentEnrollId);
      } else {
        next.add(studentEnrollId);
      }
      return next;
    });
  }, []);
  
  /**
   * Toggle select all applications
   */
  const toggleSelectAll = useCallback((): void => {
    if (allSelected) {
      setSelectedApplications(new Set());
    } else {
      setSelectedApplications(new Set(filteredApplications.map(app => app.studentEnrollId)));
    }
  }, [allSelected, filteredApplications]);
  
  /**
   * Clear all selections
   */
  const clearSelection = useCallback((): void => {
    setSelectedApplications(new Set());
  }, []);
  
  /**
   * Approve a single application
   * Based on requirements 2.2, 2.3
   */
  const approveApplication = useCallback(async (studentEnrollId: number, remarks?: string): Promise<void> => {
    try {
      await approvalService.current.submitAdvisorApproval(studentEnrollId, true, remarks);
      await refreshApplications();
      // Remove from selection after successful approval
      setSelectedApplications(prev => {
        const next = new Set(prev);
        next.delete(studentEnrollId);
        return next;
      });
    } catch (err: any) {
      throw new Error(`Failed to approve application: ${err.message}`);
    }
  }, [refreshApplications]);
  
  /**
   * Reject a single application
   * Based on requirements 2.2, 2.3
   */
  const rejectApplication = useCallback(async (studentEnrollId: number, remarks?: string): Promise<void> => {
    try {
      await approvalService.current.submitAdvisorApproval(studentEnrollId, false, remarks);
      await refreshApplications();
      // Remove from selection after successful rejection
      setSelectedApplications(prev => {
        const next = new Set(prev);
        next.delete(studentEnrollId);
        return next;
      });
    } catch (err: any) {
      throw new Error(`Failed to reject application: ${err.message}`);
    }
  }, [refreshApplications]);
  
  /**
   * Bulk approve selected applications
   * Based on requirements 2.2, 2.3
   */
  const bulkApprove = useCallback(async (remarks?: string): Promise<void> => {
    if (selectedApplications.size === 0) return;
    
    const promises = Array.from(selectedApplications).map(studentEnrollId =>
      approvalService.current.submitAdvisorApproval(studentEnrollId, true, remarks)
    );
    
    try {
      await Promise.all(promises);
      await refreshApplications();
      setSelectedApplications(new Set());
    } catch (err: any) {
      throw new Error(`Failed to bulk approve applications: ${err.message}`);
    }
  }, [selectedApplications, refreshApplications]);
  
  /**
   * Bulk reject selected applications
   * Based on requirements 2.2, 2.3
   */
  const bulkReject = useCallback(async (remarks?: string): Promise<void> => {
    if (selectedApplications.size === 0) return;
    
    const promises = Array.from(selectedApplications).map(studentEnrollId =>
      approvalService.current.submitAdvisorApproval(studentEnrollId, false, remarks)
    );
    
    try {
      await Promise.all(promises);
      await refreshApplications();
      setSelectedApplications(new Set());
    } catch (err: any) {
      throw new Error(`Failed to bulk reject applications: ${err.message}`);
    }
  }, [selectedApplications, refreshApplications]);
  
  /**
   * Retry mechanism for failed requests
   */
  const retryFetch = useCallback(async (): Promise<void> => {
    if (!canRetry) {
      throw new Error('Maximum retry attempts exceeded');
    }
    
    await refreshApplications();
  }, [canRetry, refreshApplications]);
  
  /**
   * Clear error state
   */
  const clearError = useCallback((): void => {
    setError(null);
    setRetryCount(0);
  }, []);
  
  // Initial data load on mount
  useEffect(() => {
    initialLoad();
  }, [initialLoad]);
  
  // Refetch when filters change
  useEffect(() => {
    if (applications.length > 0) {
      // Only refetch if we have data and filters changed
      fetchApplications();
    }
  }, [filters.search, filters.major, filters.company]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      realTimeUpdates.stopAutoRefresh();
    };
  }, [realTimeUpdates]);
  
  return {
    // State
    applications,
    filteredApplications,
    isLoading,
    isRefreshing,
    error,
    filters,
    selectedApplications,
    allSelected,
    someSelected,
    isAutoRefreshing: realTimeUpdates.isAutoRefreshing,
    lastRefreshTime,
    retryCount,
    canRetry,
    
    // Methods
    fetchApplications,
    refreshApplications,
    updateFilters,
    clearFilters,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    approveApplication,
    rejectApplication,
    bulkApprove,
    bulkReject,
    startAutoRefresh: realTimeUpdates.startAutoRefresh,
    stopAutoRefresh: realTimeUpdates.stopAutoRefresh,
    clearError,
    retryFetch
  };
};

export default useAdvisorDashboardViewModel;