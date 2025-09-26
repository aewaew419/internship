import { useState, useEffect, useCallback, useMemo } from 'react';
import { VisitorService } from '../../service/api/visitor';
import type { 
  VisitorInterface, 
  VisitorEvaluateStudentInterface,
  VisitorScheduleReportInterface 
} from '../../service/api/visitor/type';
import { 
  transformVisitorToReportData, 
  validateVisitorData, 
  sanitizeVisitorData,
  type ReportDisplayData,
  type EvaluationScore 
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

// Filter interface for search and filtering functionality
export interface ReportFilterState {
  search: string;
  position: string;
  major: string;
  appointmentStatus: string;
}

// Aggregated report data interface
export interface AggregatedReportData extends Omit<ReportDisplayData, 'evaluationScores'> {
  evaluationScores: EvaluationScore[];
  averageScore: number;
  totalVisits: number;
  completedVisits: number;
  pendingVisits: number;
  lastEvaluationDate?: string;
}

// Hook return type interface
export interface SuperviseReportViewModel {
  // State
  reportData: AggregatedReportData[];
  loading: boolean;
  error: string | null;
  enhancedError: EnhancedError | null;
  filters: ReportFilterState;
  retryCount: number;
  isRetrying: boolean;
  
  // Real-time update state
  realTimeUpdates: RealTimeUpdateHook;
  stalenessInfo: DataStalenessInfo;
  isAutoRefreshing: boolean;
  lastManualRefresh: Date | null;
  
  // Methods
  fetchReportData: () => Promise<void>;
  fetchVisitorEvaluations: (visitorId: number) => Promise<EvaluationScore[]>;
  applyFilters: (newFilters: Partial<ReportFilterState>) => void;
  refreshData: () => Promise<void>;
  clearError: () => void;
  retryFetch: () => Promise<void>;
  generateDetailedReport: (visitorId: number) => Promise<AggregatedReportData | null>;
  
  // Real-time update methods
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
  triggerManualRefresh: () => Promise<void>;
  toggleAutoRefresh: () => void;
  
  // Computed values
  filteredReportData: AggregatedReportData[];
  totalCount: number;
  hasData: boolean;
  summaryStats: {
    totalStudents: number;
    completedEvaluations: number;
    averageScore: number;
    pendingReports: number;
  };
  positionOptions: string[];
  majorOptions: string[];
}

const useSuperviseReportViewModel = (): SuperviseReportViewModel => {
  // State management
  const [rawVisitors, setRawVisitors] = useState<VisitorInterface[]>([]);
  const [evaluationData, setEvaluationData] = useState<Map<number, VisitorEvaluateStudentInterface[]>>(new Map());
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [enhancedError, setEnhancedError] = useState<EnhancedError | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const [filters, setFilters] = useState<ReportFilterState>({
    search: '',
    position: '',
    major: '',
    appointmentStatus: ''
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
  const concurrencyControl = useConcurrencyControl('supervise-report-data');

  // Enhanced error handling
  const handleError = useCallback((err: any, context: string = 'fetchReportData') => {
    const enhancedErr = classifyError(err);
    logError(enhancedErr, context);
    
    setError(enhancedErr.userMessage);
    setEnhancedError(enhancedErr);
  }, []);

  // Fetch visitor evaluation data
  const fetchVisitorEvaluations = useCallback(async (visitorId: number): Promise<EvaluationScore[]> => {
    try {
      const [studentEvaluations, companyEvaluations] = await Promise.all([
        retryApiCall(() => visitorService.reqGetVisitorEvaluateStudent(visitorId), retryConfig),
        retryApiCall(() => visitorService.reqGetVisitorEvaluateCompany(visitorId), retryConfig)
      ]);

      const evaluationScores: EvaluationScore[] = [
        ...studentEvaluations.map(evaluation => ({
          question: evaluation.questions,
          score: evaluation.score
        })),
        ...companyEvaluations.map(evaluation => ({
          question: evaluation.questions,
          score: evaluation.score
        }))
      ];

      // Update evaluation data cache
      setEvaluationData(prev => new Map(prev.set(visitorId, [...studentEvaluations, ...companyEvaluations])));

      return evaluationScores;
    } catch (err) {
      handleError(err, `fetchVisitorEvaluations-${visitorId}`);
      return [];
    }
  }, [visitorService, handleError, retryConfig]);

  // Calculate aggregated data for a visitor
  const aggregateVisitorData = useCallback(async (visitor: VisitorInterface): Promise<AggregatedReportData> => {
    const baseReportData = transformVisitorToReportData(visitor);
    
    // Fetch evaluation data if not already cached
    let evaluationScores: EvaluationScore[] = [];
    const cachedEvaluations = evaluationData.get(visitor.id);
    
    if (cachedEvaluations) {
      evaluationScores = cachedEvaluations.map(evaluation => ({
        question: evaluation.questions,
        score: evaluation.score
      }));
    } else {
      evaluationScores = await fetchVisitorEvaluations(visitor.id);
    }

    // Calculate statistics
    const averageScore = evaluationScores.length > 0 
      ? evaluationScores.reduce((sum, evaluation) => sum + evaluation.score, 0) / evaluationScores.length 
      : 0;

    const now = new Date();
    const completedVisits = visitor.schedules.filter((schedule: any) => 
      new Date(schedule.visitAt) <= now
    ).length;
    
    const pendingVisits = visitor.schedules.filter((schedule: any) => 
      new Date(schedule.visitAt) > now
    ).length;

    // Find last evaluation date
    const lastEvaluationDate = cachedEvaluations && cachedEvaluations.length > 0
      ? cachedEvaluations
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
          .updatedAt
      : undefined;

    return {
      ...baseReportData,
      evaluationScores,
      averageScore,
      totalVisits: visitor.schedules.length,
      completedVisits,
      pendingVisits,
      lastEvaluationDate
    };
  }, [evaluationData, fetchVisitorEvaluations]);

  // Transform raw visitor data to aggregated report format
  const reportData = useMemo(() => {
    const validVisitors = rawVisitors
      .filter(visitor => validateVisitorData(visitor))
      .map(visitor => sanitizeVisitorData(visitor))
      .filter((visitor): visitor is VisitorInterface => visitor !== null);

    // For now, return basic report data. The aggregation will happen asynchronously
    return validVisitors.map(visitor => {
      const baseReportData = transformVisitorToReportData(visitor);
      const cachedEvaluations = evaluationData.get(visitor.id) || [];
      
      const evaluationScores: EvaluationScore[] = cachedEvaluations.map(evaluation => ({
        question: evaluation.questions,
        score: evaluation.score
      }));

      const averageScore = evaluationScores.length > 0 
        ? evaluationScores.reduce((sum, evaluation) => sum + evaluation.score, 0) / evaluationScores.length 
        : 0;

      const now = new Date();
      const completedVisits = visitor.schedules.filter((schedule: any) => 
        new Date(schedule.visitAt) <= now
      ).length;
      
      const pendingVisits = visitor.schedules.filter((schedule: any) => 
        new Date(schedule.visitAt) > now
      ).length;

      return {
        ...baseReportData,
        evaluationScores,
        averageScore,
        totalVisits: visitor.schedules.length,
        completedVisits,
        pendingVisits,
        lastEvaluationDate: cachedEvaluations.length > 0
          ? cachedEvaluations
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
              .updatedAt
          : undefined
      } as AggregatedReportData;
    });
  }, [rawVisitors, evaluationData]);

  // Apply search and filter logic
  const filteredReportData = useMemo(() => {
    return reportData.filter(report => {
      // Search filter - matches name or student code
      const searchMatch = !filters.search || 
        report.studentName.toLowerCase().includes(filters.search.toLowerCase()) ||
        report.studentCode.toLowerCase().includes(filters.search.toLowerCase());

      // Position filter - match against job position from student training
      const positionMatch = !filters.position || report.jobPosition === filters.position;

      // Major filter - not available in current API structure
      const majorMatch = !filters.major || true;

      // Appointment status filter
      const statusMatch = !filters.appointmentStatus || 
        report.appointmentStatus === filters.appointmentStatus;

      return searchMatch && positionMatch && majorMatch && statusMatch;
    });
  }, [reportData, filters]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalStudents = reportData.length;
    const completedEvaluations = reportData.filter(report => 
      report.evaluationScores.length > 0
    ).length;
    
    const totalScores = reportData
      .filter(report => report.evaluationScores.length > 0)
      .map(report => report.averageScore);
    
    const averageScore = totalScores.length > 0 
      ? totalScores.reduce((sum, score) => sum + score, 0) / totalScores.length 
      : 0;
    
    const pendingReports = reportData.filter(report => 
      report.pendingVisits > 0 || report.evaluationScores.length === 0
    ).length;

    return {
      totalStudents,
      completedEvaluations,
      averageScore,
      pendingReports
    };
  }, [reportData]);

  // Enhanced fetch comprehensive report data with concurrency control
  const fetchReportData = useCallback(async () => {
    // Acquire lock to prevent concurrent data access
    const lockAcquired = await concurrencyControl.acquireLock('fetch-report-data');
    if (!lockAcquired) {
      console.log('Report data fetch already in progress, skipping...');
      return;
    }

    setLoading(true);
    setError(null);
    setEnhancedError(null);
    
    try {
      // Fetch all visitors first
      const visitors = await retryApiCall(
        () => visitorService.reqGetVisitor(),
        retryConfig
      );
      
      if (!Array.isArray(visitors)) {
        throw new Error('Invalid response format: expected array');
      }
      
      setRawVisitors(visitors);

      // Fetch evaluation data for all visitors in parallel (with limit to avoid overwhelming the server)
      const evaluationPromises = visitors.slice(0, 10).map(async (visitor) => {
        try {
          await fetchVisitorEvaluations(visitor.id);
        } catch (err) {
          // Log individual evaluation fetch errors but don't fail the entire operation
          console.warn(`Failed to fetch evaluations for visitor ${visitor.id}:`, err);
        }
      });

      await Promise.allSettled(evaluationPromises);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      handleError(err, 'fetchReportData');
      // Keep existing data on error to provide better UX
    } finally {
      setLoading(false);
      concurrencyControl.releaseLock('fetch-report-data');
    }
  }, [visitorService, handleError, retryConfig, fetchVisitorEvaluations, concurrencyControl]);

  // Create debounced refresh function to prevent spam
  const debouncedRefresh = useMemo(() => 
    createDebouncedRefresh(fetchReportData, 2000), 
    [fetchReportData]
  );

  // Real-time updates hook
  const realTimeUpdates = useRealTimeUpdates(debouncedRefresh, {
    refreshInterval: 45000, // 45 seconds (longer for reports as they're more expensive)
    maxFailures: 3,
    enableAutoRefresh: true,
    refreshOnFocus: true,
    refreshOnOnline: true,
    minRefreshInterval: 10000 // 10 seconds minimum between refreshes for reports
  });

  // Generate detailed report for a specific visitor
  const generateDetailedReport = useCallback(async (visitorId: number): Promise<AggregatedReportData | null> => {
    const visitor = rawVisitors.find(v => v.id === visitorId);
    if (!visitor) {
      return null;
    }

    try {
      return await aggregateVisitorData(visitor);
    } catch (err) {
      handleError(err, `generateDetailedReport-${visitorId}`);
      return null;
    }
  }, [rawVisitors, aggregateVisitorData, handleError]);

  // Apply filters
  const applyFilters = useCallback((newFilters: Partial<ReportFilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Refresh data (same as fetchReportData but with user feedback)
  const refreshData = useCallback(async () => {
    await fetchReportData();
  }, [fetchReportData]);

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
      await fetchReportData();
    } finally {
      setIsRetrying(false);
    }
  }, [fetchReportData]);

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
    } else {
      realTimeUpdates.startAutoRefresh();
    }
  }, [realTimeUpdates]);

  // Load data on component mount
  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  // Extract unique position and major options from data
  const positionOptions = useMemo(() => {
    const positions = new Set<string>();
    rawVisitors.forEach(visitor => {
      const position = visitor.studentEnroll.student_training?.position;
      if (position && position.trim()) {
        positions.add(position.trim());
      }
    });
    return Array.from(positions).sort();
  }, [rawVisitors]);

  const majorOptions = useMemo(() => {
    // For now, we don't have major information in the API
    // This would need to be added to the student model or derived from program/curriculum
    return [];
  }, []);

  // Computed values
  const totalCount = reportData.length;
  const hasData = reportData.length > 0;

  return {
    // State
    reportData,
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
    
    // Methods
    fetchReportData,
    fetchVisitorEvaluations,
    applyFilters,
    refreshData,
    clearError,
    retryFetch,
    generateDetailedReport,
    
    // Real-time update methods
    startAutoRefresh,
    stopAutoRefresh,
    triggerManualRefresh,
    toggleAutoRefresh,
    
    // Computed values
    filteredReportData,
    totalCount,
    hasData,
    summaryStats,
    positionOptions,
    majorOptions
  };
};

export default useSuperviseReportViewModel;