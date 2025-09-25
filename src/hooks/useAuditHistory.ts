/**
 * Audit History Hooks
 * React hooks for audit history visualization and management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  HistoryTimeline,
  TimelineEvent,
  HistoryFilter,
  TimelineGroup,
  DiffVisualization,
  HistoryAnalytics,
  HistorySearch,
  RollbackOperation,
  RollbackData,
  HistoryExport
} from '../types/auditHistory';
import { AuditEntityType } from '../types/audit';
import { auditHistoryService } from '../services/auditHistoryService';

/**
 * Hook for managing history timeline
 */
export function useHistoryTimeline(
  entityType: AuditEntityType,
  entityId: string,
  initialFilter?: HistoryFilter
) {
  const [timeline, setTimeline] = useState<HistoryTimeline | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<HistoryFilter>(initialFilter || {});

  const fetchTimeline = useCallback(async (newFilter?: HistoryFilter) => {
    setLoading(true);
    setError(null);

    try {
      const filterToUse = newFilter || filter;
      const timelineData = await auditHistoryService.getHistoryTimeline(
        entityType,
        entityId,
        filterToUse
      );
      setTimeline(timelineData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch timeline');
      setTimeline(null);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, filter]);

  const updateFilter = useCallback((newFilter: Partial<HistoryFilter>) => {
    const updatedFilter = { ...filter, ...newFilter };
    setFilter(updatedFilter);
    fetchTimeline(updatedFilter);
  }, [filter, fetchTimeline]);

  const refreshTimeline = useCallback(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  useEffect(() => {
    fetchTimeline();
  }, [entityType, entityId]);

  return {
    timeline,
    loading,
    error,
    filter,
    updateFilter,
    refreshTimeline
  };
}

/**
 * Hook for grouped timeline view
 */
export function useGroupedTimeline(
  entityType: AuditEntityType,
  entityId: string,
  groupBy: 'date' | 'user' | 'action' = 'date',
  filter?: HistoryFilter
) {
  const [groups, setGroups] = useState<TimelineGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const groupedData = await auditHistoryService.getGroupedTimeline(
        entityType,
        entityId,
        groupBy,
        filter
      );
      setGroups(groupedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch grouped timeline');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, groupBy, filter]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return {
    groups,
    loading,
    error,
    refreshGroups: fetchGroups
  };
}

/**
 * Hook for diff visualization
 */
export function useDiffVisualization(eventId: string | null) {
  const [diffs, setDiffs] = useState<DiffVisualization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDiffs = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const diffData = await auditHistoryService.getDiffVisualization(id);
      setDiffs(diffData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch diff visualization');
      setDiffs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (eventId) {
      fetchDiffs(eventId);
    } else {
      setDiffs([]);
      setError(null);
    }
  }, [eventId, fetchDiffs]);

  return {
    diffs,
    loading,
    error,
    refreshDiffs: () => eventId && fetchDiffs(eventId)
  };
}

/**
 * Hook for history search
 */
export function useHistorySearch(initialQuery = '', initialFilters?: HistoryFilter) {
  const [searchResult, setSearchResult] = useState<HistorySearch | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<HistoryFilter>(initialFilters || {});
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const performSearch = useCallback(async (searchQuery: string, searchFilters?: HistoryFilter) => {
    if (!searchQuery.trim()) {
      setSearchResult(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await auditHistoryService.searchHistory(
        searchQuery,
        searchFilters || filters
      );
      setSearchResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search history');
      setSearchResult(null);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const debouncedSearch = useCallback((searchQuery: string, searchFilters?: HistoryFilter) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery, searchFilters);
    }, 300);
  }, [performSearch]);

  const updateQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
    debouncedSearch(newQuery, filters);
  }, [filters, debouncedSearch]);

  const updateFilters = useCallback((newFilters: Partial<HistoryFilter>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    if (query.trim()) {
      debouncedSearch(query, updatedFilters);
    }
  }, [filters, query, debouncedSearch]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setSearchResult(null);
    setError(null);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    searchResult,
    loading,
    error,
    query,
    filters,
    updateQuery,
    updateFilters,
    clearSearch,
    performSearch: () => performSearch(query, filters)
  };
}

/**
 * Hook for history analytics
 */
export function useHistoryAnalytics(
  entityType: AuditEntityType,
  entityId: string,
  period: { start: string; end: string }
) {
  const [analytics, setAnalytics] = useState<HistoryAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const analyticsData = await auditHistoryService.getHistoryAnalytics(
        entityType,
        entityId,
        period
      );
      setAnalytics(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    analytics,
    loading,
    error,
    refreshAnalytics: fetchAnalytics
  };
}

/**
 * Hook for rollback operations
 */
export function useRollback() {
  const [rollbackData, setRollbackData] = useState<RollbackData | null>(null);
  const [operation, setOperation] = useState<RollbackOperation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prepareRollback = useCallback(async (eventId: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await auditHistoryService.prepareRollback(eventId);
      setRollbackData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to prepare rollback');
      setRollbackData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const executeRollback = useCallback(async (
    eventId: string,
    data: RollbackData,
    userId: number
  ) => {
    setLoading(true);
    setError(null);

    try {
      const op = await auditHistoryService.executeRollback(eventId, data, userId);
      setOperation(op);
      return op;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to execute rollback');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearRollback = useCallback(() => {
    setRollbackData(null);
    setOperation(null);
    setError(null);
  }, []);

  return {
    rollbackData,
    operation,
    loading,
    error,
    prepareRollback,
    executeRollback,
    clearRollback
  };
}

/**
 * Hook for history export
 */
export function useHistoryExport() {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportHistory = useCallback(async (
    timeline: HistoryTimeline,
    format: 'json' | 'csv' | 'pdf' | 'html',
    options?: {
      includeMetadata?: boolean;
      includeUserInfo?: boolean;
      includeDiffs?: boolean;
      includeRollbackData?: boolean;
    }
  ) => {
    setExporting(true);
    setError(null);

    try {
      const exportData = await auditHistoryService.exportHistory(timeline, format, options);
      
      // Generate and download file
      const blob = await generateExportBlob(exportData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `history-${timeline.entityType}-${timeline.entityId}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return exportData;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export history');
      throw err;
    } finally {
      setExporting(false);
    }
  }, []);

  return {
    exportHistory,
    exporting,
    error
  };
}

/**
 * Hook for real-time timeline updates
 */
export function useRealtimeTimeline(
  entityType: AuditEntityType,
  entityId: string,
  enabled = true
) {
  const [timeline, setTimeline] = useState<HistoryTimeline | null>(null);
  const [newEvents, setNewEvents] = useState<TimelineEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const updateTimeline = useCallback((newTimeline: HistoryTimeline) => {
    setTimeline(prevTimeline => {
      if (!prevTimeline) return newTimeline;

      // Find new events
      const existingEventIds = new Set(prevTimeline.events.map(e => e.id));
      const newEventsFound = newTimeline.events.filter(e => !existingEventIds.has(e.id));
      
      if (newEventsFound.length > 0) {
        setNewEvents(prev => [...newEventsFound, ...prev].slice(0, 10)); // Keep last 10 new events
      }

      return newTimeline;
    });
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // In a real implementation, this would use WebSocket or Server-Sent Events
    const interval = setInterval(async () => {
      try {
        const updatedTimeline = await auditHistoryService.getHistoryTimeline(
          entityType,
          entityId,
          { limit: 50 } // Get recent events
        );
        updateTimeline(updatedTimeline);
        setIsConnected(true);
      } catch (error) {
        console.error('Failed to fetch timeline updates:', error);
        setIsConnected(false);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [entityType, entityId, enabled, updateTimeline]);

  const markEventAsRead = useCallback((eventId: string) => {
    setNewEvents(prev => prev.filter(e => e.id !== eventId));
  }, []);

  const clearNewEvents = useCallback(() => {
    setNewEvents([]);
  }, []);

  return {
    timeline,
    newEvents,
    isConnected,
    markEventAsRead,
    clearNewEvents
  };
}

/**
 * Hook for timeline filtering and sorting
 */
export function useTimelineFilters(initialEvents: TimelineEvent[] = []) {
  const [filteredEvents, setFilteredEvents] = useState<TimelineEvent[]>(initialEvents);
  const [activeFilters, setActiveFilters] = useState<HistoryFilter>({});
  const [sortConfig, setSortConfig] = useState<{
    field: keyof TimelineEvent;
    direction: 'asc' | 'desc';
  }>({ field: 'timestamp', direction: 'desc' });

  const applyFilters = useCallback((events: TimelineEvent[], filters: HistoryFilter) => {
    let filtered = [...events];

    // Filter by action
    if (filters.action) {
      const actions = Array.isArray(filters.action) ? filters.action : [filters.action];
      filtered = filtered.filter(event => actions.includes(event.action));
    }

    // Filter by user
    if (filters.userId) {
      const userIds = Array.isArray(filters.userId) ? filters.userId : [filters.userId];
      filtered = filtered.filter(event => userIds.includes(event.user.id));
    }

    // Filter by date range
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(event => new Date(event.timestamp) >= fromDate);
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      filtered = filtered.filter(event => new Date(event.timestamp) <= toDate);
    }

    // Filter by severity
    if (filters.severity) {
      filtered = filtered.filter(event => filters.severity!.includes(event.severity));
    }

    // Filter by success
    if (filters.success !== undefined) {
      filtered = filtered.filter(event => event.success === filters.success);
    }

    // Filter by search term
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(event =>
        event.action.toLowerCase().includes(term) ||
        event.user.name.toLowerCase().includes(term) ||
        event.changes.some(change =>
          change.field.toLowerCase().includes(term) ||
          String(change.oldValue).toLowerCase().includes(term) ||
          String(change.newValue).toLowerCase().includes(term)
        )
      );
    }

    return filtered;
  }, []);

  const applySorting = useCallback((events: TimelineEvent[], config: typeof sortConfig) => {
    return [...events].sort((a, b) => {
      const aValue = a[config.field];
      const bValue = b[config.field];

      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;

      return config.direction === 'desc' ? -comparison : comparison;
    });
  }, []);

  const updateFilters = useCallback((newFilters: Partial<HistoryFilter>) => {
    const updatedFilters = { ...activeFilters, ...newFilters };
    setActiveFilters(updatedFilters);

    let filtered = applyFilters(initialEvents, updatedFilters);
    filtered = applySorting(filtered, sortConfig);
    setFilteredEvents(filtered);
  }, [activeFilters, initialEvents, applyFilters, applySorting, sortConfig]);

  const updateSort = useCallback((field: keyof TimelineEvent, direction?: 'asc' | 'desc') => {
    const newDirection = direction || (sortConfig.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc');
    const newSortConfig = { field, direction: newDirection };
    setSortConfig(newSortConfig);

    const filtered = applyFilters(initialEvents, activeFilters);
    const sorted = applySorting(filtered, newSortConfig);
    setFilteredEvents(sorted);
  }, [sortConfig, initialEvents, activeFilters, applyFilters, applySorting]);

  const clearFilters = useCallback(() => {
    setActiveFilters({});
    const sorted = applySorting(initialEvents, sortConfig);
    setFilteredEvents(sorted);
  }, [initialEvents, applySorting, sortConfig]);

  useEffect(() => {
    let filtered = applyFilters(initialEvents, activeFilters);
    filtered = applySorting(filtered, sortConfig);
    setFilteredEvents(filtered);
  }, [initialEvents, activeFilters, sortConfig, applyFilters, applySorting]);

  return {
    filteredEvents,
    activeFilters,
    sortConfig,
    updateFilters,
    updateSort,
    clearFilters
  };
}

// Helper function for export
async function generateExportBlob(exportData: HistoryExport): Promise<Blob> {
  switch (exportData.format) {
    case 'json':
      return new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    
    case 'csv':
      const csvContent = convertToCSV(exportData);
      return new Blob([csvContent], { type: 'text/csv' });
    
    case 'html':
      const htmlContent = convertToHTML(exportData);
      return new Blob([htmlContent], { type: 'text/html' });
    
    default:
      throw new Error(`Unsupported export format: ${exportData.format}`);
  }
}

function convertToCSV(exportData: HistoryExport): string {
  const headers = ['Timestamp', 'Action', 'User', 'Changes', 'Success', 'Severity'];
  const rows = exportData.data.events.map(event => [
    event.timestamp,
    event.action,
    event.user.name,
    event.changes.map(c => `${c.field}: ${c.oldValue} → ${c.newValue}`).join('; '),
    event.success ? 'Yes' : 'No',
    event.severity
  ]);

  return [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

function convertToHTML(exportData: HistoryExport): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>History Export - ${exportData.data.entityType} ${exportData.data.entityId}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .severity-high { color: #d32f2f; }
        .severity-medium { color: #f57c00; }
        .severity-low { color: #388e3c; }
      </style>
    </head>
    <body>
      <h1>History Export</h1>
      <p><strong>Entity:</strong> ${exportData.data.entityType} - ${exportData.data.entityId}</p>
      <p><strong>Exported:</strong> ${exportData.metadata.exportedAt}</p>
      <p><strong>Total Events:</strong> ${exportData.data.totalEvents}</p>
      
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Action</th>
            <th>User</th>
            <th>Changes</th>
            <th>Success</th>
            <th>Severity</th>
          </tr>
        </thead>
        <tbody>
          ${exportData.data.events.map(event => `
            <tr>
              <td>${new Date(event.timestamp).toLocaleString()}</td>
              <td>${event.action}</td>
              <td>${event.user.name}</td>
              <td>${event.changes.map(c => `${c.field}: ${c.oldValue} → ${c.newValue}`).join('<br>')}</td>
              <td>${event.success ? 'Yes' : 'No'}</td>
              <td class="severity-${event.severity}">${event.severity}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
}