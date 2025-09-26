import { useState, useEffect, useCallback, useMemo } from 'react';
import { VisitorService, type VisitorFilterParams } from '../../service/api/visitor';
import type { VisitorInterface } from '../../service/api/visitor/type';
import { 
  transformVisitorToScheduleData, 
  validateVisitorData, 
  sanitizeVisitorData,
  type ScheduleDisplayData 
} from '../../utils/dataTransformation';
import { retryApiCall, type RetryConfig } from '../../utils/retryMechanism';
import { classifyError, logError, type EnhancedError } from '../../utils/errorHandling';
import { 
  useRealTimeUpdates, 
  useConcurrencyControl,
  createDebouncedRefresh,
  type RealTimeUpdateHook,
  type DataStalenessInfo 
} from '../../utils/realTimeUpdates';
import { 
  useRealTimeSynchronization,
  useDataSynchronization,
  type RealTimeSynchronizationHook 
} from '../../utils/realTimeSynchronization';
import { 
  useFilterState, 
  useDebouncedFilter,
  useFilterPresets,
  type FilterState as BaseFilterState,
  type FilterValidation,
  type FilterPreset
} from '../../utils/filterStateManager';

// Enhanced filter interface for search and filtering functionality
interface FilterState {
  search: string;
  position: string;
  major: string;
}

// Hook return type interface
interface SuperviseScheduleViewModel {
  // State
  visitors: ScheduleDisplayData[];
  loading: boolean;
  error: string | null;
  enhancedError: EnhancedError | null;
  filters: FilterState;
  retryCount: number;
  isRetrying: boolean;
  
  // Real-time update state
  realTimeUpdates: RealTimeUpdateHook;
  stalenessInfo: DataStalenessInfo;
  isAutoRefreshing: boolean;
  lastManualRefresh: Date | null;
  
  // Enhanced synchronization state
  synchronization: RealTimeSynchronizationHook;
  isSyncing: boolean;
  syncStatus: 'idle' | 'syncing' | 'error' | 'conflict';
  connectionStatus: 'online' | 'offline' | 'unstable';
  lastSyncTime: Date | null;
  
  // Methods
  fetchVisitors: () => Promise<void>;
  applyFilters: (newFilters: Partial<FilterState>) => void;
  refreshData: () => Promise<void>;
  clearError: () => void;
  retryFetch: () => Promise<void>;
  
  // Real-time update methods
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
  triggerManualRefresh: () => Promise<void>;
  toggleAutoRefresh: () => void;
  
  // Enhanced synchronization methods
  forceSynchronization: () => Promise<void>;
  updateRefreshInterval: (interval: number) => void;
  enableCrossTabSync: () => void;
  disableCrossTabSync: () => void;
  
  // Computed values
  filteredVisitors: ScheduleDisplayData[];
  totalCount: number;
  hasData: boolean;
}

const useSuperviseScheduleViewModel = (): SuperviseScheduleViewModel => {
  // State management
  const [rawVisitors, setRawVisitors] = useState<VisitorInterface[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [enhancedError, setEnhancedError] = useState<EnhancedError | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    position: '',
    major: ''
  });

  // Service instance
  const visitorService = useMemo(() => new VisitorService(), []);

  // Retry configuration
  const retryConfig: RetryConfig = useMemo(() => ({
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 8000,
    backoffFactor: 2
  }), []);

  // Concurrency control for data access
  const concurrencyControl = useConcurrencyControl('supervise-schedule-data');

  // Transform raw visitor data to display format
  const visitors = useMemo(() => {
    return rawVisitors
      .filter(visitor => validateVisitorData(visitor))
      .map(visitor => {
        const sanitized = sanitizeVisitorData(visitor);
        return sanitized ? transformVisitorToScheduleData(sanitized) : null;
      })
      .filter((item): item is ScheduleDisplayData => item !== null);
  }, [rawVisitors]);

  // Apply search and filter logic
  const filteredVisitors = useMemo(() => {
    return visitors.filter(visitor => {
      // Search filter - matches name or student code
      const searchMatch = !filters.search || 
        visitor.studentName.toLowerCase().includes(filters.search.toLowerCase()) ||
        visitor.studentCode.toLowerCase().includes(filters.search.toLowerCase());

      // Position filter (placeholder - would need additional data from API)
      const positionMatch = !filters.position || true; // TODO: Implement when position data is available

      // Major filter (placeholder - would need additional data from API)
      const majorMatch = !filters.major || true; // TODO: Implement when major data is available

      return searchMatch && positionMatch && majorMatch;
    });
  }, [visitors, filters]);

  // Enhanced error handling
  const handleError = useCallback((err: any, context: string = 'fetchVisitors') => {
    const enhancedErr = classifyError(err);
    logError(enhancedErr, context);
    
    setError(enhancedErr.userMessage);
    setEnhancedError(enhancedErr);
  }, []);

  // Enhanced fetch visitors data with concurrency control
  const fetchVisitors = useCallback(async () => {
    // Acquire lock to prevent concurrent data access
    const lockAcquired = await concurrencyControl.acquireLock('fetch-visitors');
    if (!lockAcquired) {
      console.log('Fetch already in progress, skipping...');
      return;
    }

    setLoading(true);
    setError(null);
    setEnhancedError(null);
    
    try {
      const response = await retryApiCall(
        () => visitorService.reqGetVisitor(),
        retryConfig
      );
      
      if (!Array.isArray(response)) {
        throw new Error('Invalid response format: expected array');
      }
      
      setRawVisitors(response);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      handleError(err, 'fetchVisitors');
      // Keep existing data on error to provide better UX
    } finally {
      setLoading(false);
      concurrencyControl.releaseLock('fetch-visitors');
    }
  }, [visitorService, handleError, retryConfig, concurrencyControl]);

  // Create debounced refresh function to prevent spam
  const debouncedRefresh = useMemo(() => 
    createDebouncedRefresh(fetchVisitors, 2000), 
    [fetchVisitors]
  );

  // Real-time updates hook
  const realTimeUpdates = useRealTimeUpdates(debouncedRefresh, {
    refreshInterval: 30000, // 30 seconds
    maxFailures: 3,
    enableAutoRefresh: true,
    refreshOnFocus: true,
    refreshOnOnline: true,
    minRefreshInterval: 5000 // 5 seconds minimum between refreshes
  });

  // Enhanced synchronization hook
  const synchronization = useRealTimeSynchronization(debouncedRefresh, 'supervise-schedule-data', {
    refreshInterval: 30000,
    maxFailures: 3,
    enableAutoRefresh: true,
    refreshOnFocus: true,
    refreshOnOnline: true,
    minRefreshInterval: 5000,
    enableCrossTabSync: true,
    enableWebSocketSync: false,
    enableBackgroundSync: true,
    conflictResolution: 'server-wins'
  });

  // Data synchronization for cross-component updates
  const dataSynchronization = useDataSynchronization('supervise-schedule-data');

  // Apply filters
  const applyFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Refresh data (same as fetchVisitors but with user feedback)
  const refreshData = useCallback(async () => {
    await fetchVisitors();
  }, [fetchVisitors]);

  // Clear error state
  const clearError = useCallback(() => {
    setError(null);
    setEnhancedError(null);
  }, []);

  // Retry fetch with exponential backoff
  const retryFetch = useCallback(async () => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    
    try {
      await fetchVisitors();
    } finally {
      setIsRetrying(false);
    }
  }, [fetchVisitors]);

  // Real-time update methods
  const startAutoRefresh = useCallback(() => {
    realTimeUpdates.startAutoRefresh();
  }, [realTimeUpdates]);

  const stopAutoRefresh = useCallback(() => {
    realTimeUpdates.stopAutoRefresh();
  }, [realTimeUpdates]);

  const triggerManualRefresh = useCallback(async () => {
    await realTimeUpdates.triggerManualRefresh();
  }, [realTimeUpdates]);

  const toggleAutoRefresh = useCallback(() => {
    if (realTimeUpdates.isAutoRefreshing) {
      realTimeUpdates.stopAutoRefresh();
      synchronization.stopAutoRefresh();
    } else {
      realTimeUpdates.startAutoRefresh();
      synchronization.startAutoRefresh();
    }
  }, [realTimeUpdates, synchronization]);

  // Enhanced synchronization methods
  const forceSynchronization = useCallback(async () => {
    await synchronization.forceSynchronization();
    dataSynchronization.broadcastUpdate();
  }, [synchronization, dataSynchronization]);

  const updateRefreshInterval = useCallback((interval: number) => {
    realTimeUpdates.updateConfig({ refreshInterval: interval });
    synchronization.updateConfig({ refreshInterval: interval });
  }, [realTimeUpdates, synchronization]);

  const enableCrossTabSync = useCallback(() => {
    synchronization.enableCrossTabSync();
  }, [synchronization]);

  const disableCrossTabSync = useCallback(() => {
    synchronization.disableCrossTabSync();
  }, [synchronization]);

  // Load data on component mount
  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  // Computed values
  const totalCount = visitors.length;
  const hasData = visitors.length > 0;

  return {
    // State
    visitors,
    loading,
    error,
    enhancedError,
    filters,
    retryCount,
    isRetrying,
    
    // Real-time update state
    realTimeUpdates,
    stalenessInfo: realTimeUpdates.stalenessInfo,
    isAutoRefreshing: realTimeUpdates.isAutoRefreshing,
    lastManualRefresh: realTimeUpdates.lastManualRefresh,
    
    // Enhanced synchronization state
    synchronization,
    isSyncing: synchronization.isSyncing,
    syncStatus: synchronization.syncStatus,
    connectionStatus: synchronization.connectionStatus,
    lastSyncTime: synchronization.lastSyncTime,
    
    // Methods
    fetchVisitors,
    applyFilters,
    refreshData,
    clearError,
    retryFetch,
    
    // Real-time update methods
    startAutoRefresh,
    stopAutoRefresh,
    triggerManualRefresh,
    toggleAutoRefresh,
    
    // Enhanced synchronization methods
    forceSynchronization,
    updateRefreshInterval,
    enableCrossTabSync,
    disableCrossTabSync,
    
    // Computed values
    filteredVisitors,
    totalCount,
    hasData
  };
};

export default useSuperviseScheduleViewModel;
