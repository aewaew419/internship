/**
 * Audit Hooks
 * React hooks for audit logging functionality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  AuditEvent, 
  AuditAction, 
  AuditEntityType, 
  AuditChange, 
  AuditFilter, 
  AuditSummary,
  AuditContext
} from '../types/audit';
import { auditService, auditHelpers } from '../services/auditService';

/**
 * Hook for basic audit logging functionality
 */
export function useAudit() {
  const [isLogging, setIsLogging] = useState(false);

  const logAction = useCallback(async (
    action: AuditAction,
    entityType: AuditEntityType,
    entityId: string,
    changes: AuditChange[],
    metadata?: Record<string, any>
  ) => {
    setIsLogging(true);
    try {
      await auditService.logAction(action, entityType, entityId, changes, metadata);
    } catch (error) {
      console.error('Failed to log audit action:', error);
    } finally {
      setIsLogging(false);
    }
  }, []);

  const logError = useCallback(async (
    action: AuditAction,
    entityType: AuditEntityType,
    entityId: string,
    error: Error,
    metadata?: Record<string, any>
  ) => {
    setIsLogging(true);
    try {
      await auditService.logError(action, entityType, entityId, error, metadata);
    } catch (err) {
      console.error('Failed to log audit error:', err);
    } finally {
      setIsLogging(false);
    }
  }, []);

  const setContext = useCallback((context: AuditContext) => {
    auditService.setContext(context);
  }, []);

  const clearContext = useCallback(() => {
    auditService.clearContext();
  }, []);

  return {
    logAction,
    logError,
    setContext,
    clearContext,
    isLogging
  };
}

/**
 * Hook for fetching and managing audit events
 */
export function useAuditEvents(initialFilter?: AuditFilter) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<AuditFilter>(initialFilter || {});
  const [totalCount, setTotalCount] = useState(0);

  const fetchEvents = useCallback(async (newFilter?: AuditFilter) => {
    setLoading(true);
    setError(null);
    
    try {
      const filterToUse = newFilter || filter;
      const fetchedEvents = await auditService.getEvents(filterToUse);
      setEvents(fetchedEvents);
      setTotalCount(fetchedEvents.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const updateFilter = useCallback((newFilter: Partial<AuditFilter>) => {
    const updatedFilter = { ...filter, ...newFilter };
    setFilter(updatedFilter);
    fetchEvents(updatedFilter);
  }, [filter, fetchEvents]);

  const refreshEvents = useCallback(() => {
    fetchEvents();
  }, [fetchEvents]);

  const exportEvents = useCallback(async (format: 'json' | 'csv' | 'excel') => {
    try {
      const blob = await auditService.exportEvents(filter, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-events-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export audit events');
    }
  }, [filter]);

  useEffect(() => {
    fetchEvents();
  }, []);

  return {
    events,
    loading,
    error,
    filter,
    totalCount,
    updateFilter,
    refreshEvents,
    exportEvents
  };
}

/**
 * Hook for audit summary and statistics
 */
export function useAuditSummary(filter?: Partial<AuditFilter>) {
  const [summary, setSummary] = useState<AuditSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async (newFilter?: Partial<AuditFilter>) => {
    setLoading(true);
    setError(null);
    
    try {
      const filterToUse = newFilter || filter;
      const fetchedSummary = await auditService.getSummary(filterToUse);
      setSummary(fetchedSummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch audit summary');
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const refreshSummary = useCallback(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchSummary();
  }, []);

  return {
    summary,
    loading,
    error,
    refreshSummary,
    fetchSummary
  };
}

/**
 * Hook for tracking changes to objects for audit logging
 */
export function useAuditTracker<T extends Record<string, any>>(
  initialValue: T,
  entityType: AuditEntityType,
  entityId: string,
  fieldDisplayNames?: Record<string, string>
) {
  const [currentValue, setCurrentValue] = useState<T>(initialValue);
  const previousValueRef = useRef<T>(initialValue);
  const { logAction } = useAudit();

  const updateValue = useCallback(async (
    newValue: T,
    action: AuditAction = 'update',
    metadata?: Record<string, any>
  ) => {
    const changes = auditHelpers.createChanges(
      previousValueRef.current,
      newValue,
      fieldDisplayNames
    );

    if (changes.length > 0) {
      await logAction(action, entityType, entityId, changes, metadata);
      previousValueRef.current = { ...currentValue };
    }

    setCurrentValue(newValue);
  }, [currentValue, entityType, entityId, fieldDisplayNames, logAction]);

  const resetValue = useCallback((newInitialValue: T) => {
    setCurrentValue(newInitialValue);
    previousValueRef.current = newInitialValue;
  }, []);

  return {
    currentValue,
    updateValue,
    resetValue,
    hasChanges: JSON.stringify(currentValue) !== JSON.stringify(previousValueRef.current)
  };
}

/**
 * Hook for suspicious activity monitoring
 */
export function useSuspiciousActivityMonitor() {
  const [suspiciousActivities, setSuspiciousActivities] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkSuspiciousActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const activities = await auditService.detectSuspiciousActivities();
      setSuspiciousActivities(activities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check suspicious activities');
      setSuspiciousActivities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSuspiciousActivities();
    
    // Check every 5 minutes
    const interval = setInterval(checkSuspiciousActivities, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [checkSuspiciousActivities]);

  return {
    suspiciousActivities,
    loading,
    error,
    checkSuspiciousActivities,
    hasSuspiciousActivities: suspiciousActivities.length > 0
  };
}

/**
 * Hook for audit event real-time updates
 */
export function useAuditRealTime() {
  const [recentEvents, setRecentEvents] = useState<AuditEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // In a real implementation, this would use WebSocket or Server-Sent Events
    // For now, we'll simulate with polling
    const pollInterval = setInterval(async () => {
      try {
        const events = await auditService.getEvents({
          dateFrom: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // Last 5 minutes
          limit: 10,
          sortBy: 'timestamp',
          sortOrder: 'desc'
        });
        setRecentEvents(events);
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to fetch recent audit events:', error);
        setIsConnected(false);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(pollInterval);
  }, []);

  return {
    recentEvents,
    isConnected
  };
}

/**
 * Hook for audit data cleanup and maintenance
 */
export function useAuditMaintenance() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCleanup, setLastCleanup] = useState<Date | null>(null);

  const purgeOldEvents = useCallback(async (olderThanDays: number) => {
    setIsProcessing(true);
    try {
      const deletedCount = await auditService.purgeOldEvents(olderThanDays);
      setLastCleanup(new Date());
      return deletedCount;
    } catch (error) {
      console.error('Failed to purge old events:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    purgeOldEvents,
    isProcessing,
    lastCleanup
  };
}