/**
 * History Timeline Component
 * Visual timeline component for displaying audit history
 */

import React, { useState, useMemo } from 'react';
import { 
  HistoryTimeline as HistoryTimelineType, 
  TimelineEvent, 
  HistoryFilter,
  TimelineGroup 
} from '../../types/auditHistory';
import { AuditEntityType } from '../../types/audit';
import { useHistoryTimeline, useTimelineFilters } from '../../hooks/useAuditHistory';

interface HistoryTimelineProps {
  entityType: AuditEntityType;
  entityId: string;
  initialFilter?: HistoryFilter;
  showFilters?: boolean;
  showGrouping?: boolean;
  compactMode?: boolean;
  maxHeight?: string;
  onEventClick?: (event: TimelineEvent) => void;
  onRollbackClick?: (event: TimelineEvent) => void;
}

export const HistoryTimeline: React.FC<HistoryTimelineProps> = ({
  entityType,
  entityId,
  initialFilter,
  showFilters = true,
  showGrouping = true,
  compactMode = false,
  maxHeight = '600px',
  onEventClick,
  onRollbackClick
}) => {
  const { timeline, loading, error, filter, updateFilter } = useHistoryTimeline(
    entityType,
    entityId,
    initialFilter
  );

  const [groupBy, setGroupBy] = useState<'date' | 'user' | 'action' | 'none'>('date');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const {
    filteredEvents,
    activeFilters,
    sortConfig,
    updateFilters,
    updateSort,
    clearFilters
  } = useTimelineFilters(timeline?.events || []);

  const groupedEvents = useMemo(() => {
    if (groupBy === 'none') return null;

    const groups: Record<string, TimelineEvent[]> = {};
    filteredEvents.forEach(event => {
      let key: string;
      switch (groupBy) {
        case 'date':
          key = new Date(event.timestamp).toDateString();
          break;
        case 'user':
          key = event.user.name;
          break;
        case 'action':
          key = event.action;
          break;
        default:
          key = 'unknown';
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(event);
    });

    return Object.entries(groups).map(([key, events]) => ({
      key,
      events,
      count: events.length
    }));
  }, [filteredEvents, groupBy]);

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading timeline...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading timeline</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!timeline || timeline.events.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012-2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No history found</h3>
        <p className="mt-1 text-sm text-gray-500">No audit events found for this entity.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Header */}
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              History Timeline
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {timeline.totalEvents} events from {new Date(timeline.dateRange.start).toLocaleDateString()} to {new Date(timeline.dateRange.end).toLocaleDateString()}
            </p>
          </div>
          
          {showGrouping && (
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Group by:</label>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as any)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="none">None</option>
                <option value="date">Date</option>
                <option value="user">User</option>
                <option value="action">Action</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <TimelineFilters
          filters={activeFilters}
          onFiltersChange={updateFilters}
          onClearFilters={clearFilters}
          sortConfig={sortConfig}
          onSortChange={updateSort}
        />
      )}

      {/* Timeline Content */}
      <div className="p-4" style={{ maxHeight, overflowY: 'auto' }}>
        {groupedEvents ? (
          <GroupedTimelineView
            groups={groupedEvents}
            expandedGroups={expandedGroups}
            onToggleGroup={toggleGroup}
            compactMode={compactMode}
            onEventClick={onEventClick}
            onRollbackClick={onRollbackClick}
          />
        ) : (
          <LinearTimelineView
            events={filteredEvents}
            compactMode={compactMode}
            onEventClick={onEventClick}
            onRollbackClick={onRollbackClick}
          />
        )}
      </div>

      {/* Summary */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <TimelineSummary summary={timeline.summary} />
      </div>
    </div>
  );
};

// Timeline Filters Component
interface TimelineFiltersProps {
  filters: HistoryFilter;
  onFiltersChange: (filters: Partial<HistoryFilter>) => void;
  onClearFilters: () => void;
  sortConfig: { field: string; direction: 'asc' | 'desc' };
  onSortChange: (field: any, direction?: 'asc' | 'desc') => void;
}

const TimelineFilters: React.FC<TimelineFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  sortConfig,
  onSortChange
}) => {
  return (
    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Search</label>
          <input
            type="text"
            value={filters.searchTerm || ''}
            onChange={(e) => onFiltersChange({ searchTerm: e.target.value })}
            placeholder="Search events..."
            className="w-full border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Action Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Action</label>
          <select
            value={Array.isArray(filters.action) ? filters.action[0] || '' : filters.action || ''}
            onChange={(e) => onFiltersChange({ action: e.target.value || undefined })}
            className="w-full border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
            <option value="role_create">Role Create</option>
            <option value="role_update">Role Update</option>
            <option value="permission_grant">Permission Grant</option>
          </select>
        </div>

        {/* Severity Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Severity</label>
          <select
            value={filters.severity?.[0] || ''}
            onChange={(e) => onFiltersChange({ severity: e.target.value ? [e.target.value as any] : undefined })}
            className="w-full border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Severities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {/* Clear Filters */}
        <div className="flex items-end">
          <button
            onClick={onClearFilters}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-md text-sm font-medium transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};

// Grouped Timeline View
interface GroupedTimelineViewProps {
  groups: Array<{ key: string; events: TimelineEvent[]; count: number }>;
  expandedGroups: Set<string>;
  onToggleGroup: (key: string) => void;
  compactMode: boolean;
  onEventClick?: (event: TimelineEvent) => void;
  onRollbackClick?: (event: TimelineEvent) => void;
}

const GroupedTimelineView: React.FC<GroupedTimelineViewProps> = ({
  groups,
  expandedGroups,
  onToggleGroup,
  compactMode,
  onEventClick,
  onRollbackClick
}) => {
  return (
    <div className="space-y-4">
      {groups.map(({ key, events, count }) => (
        <div key={key} className="border border-gray-200 rounded-lg">
          <button
            onClick={() => onToggleGroup(key)}
            className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-t-lg flex items-center justify-between"
          >
            <div className="flex items-center space-x-2">
              <svg
                className={`h-4 w-4 text-gray-500 transform transition-transform ${
                  expandedGroups.has(key) ? 'rotate-90' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="font-medium text-gray-900">{key}</span>
            </div>
            <span className="text-sm text-gray-500">{count} events</span>
          </button>
          
          {expandedGroups.has(key) && (
            <div className="p-4 border-t border-gray-200">
              <LinearTimelineView
                events={events}
                compactMode={compactMode}
                onEventClick={onEventClick}
                onRollbackClick={onRollbackClick}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Linear Timeline View
interface LinearTimelineViewProps {
  events: TimelineEvent[];
  compactMode: boolean;
  onEventClick?: (event: TimelineEvent) => void;
  onRollbackClick?: (event: TimelineEvent) => void;
}

const LinearTimelineView: React.FC<LinearTimelineViewProps> = ({
  events,
  compactMode,
  onEventClick,
  onRollbackClick
}) => {
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {events.map((event, eventIdx) => (
          <li key={event.id}>
            <div className="relative pb-8">
              {eventIdx !== events.length - 1 && (
                <span
                  className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}
              <TimelineEventCard
                event={event}
                compactMode={compactMode}
                onClick={onEventClick}
                onRollbackClick={onRollbackClick}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

// Timeline Event Card
interface TimelineEventCardProps {
  event: TimelineEvent;
  compactMode: boolean;
  onClick?: (event: TimelineEvent) => void;
  onRollbackClick?: (event: TimelineEvent) => void;
}

const TimelineEventCard: React.FC<TimelineEventCardProps> = ({
  event,
  compactMode,
  onClick,
  onRollbackClick
}) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('create')) return '➕';
    if (action.includes('update')) return '✏️';
    if (action.includes('delete')) return '🗑️';
    if (action.includes('login')) return '🔐';
    return '📝';
  };

  return (
    <div className="relative flex space-x-3">
      {/* Avatar */}
      <div>
        <img
          className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center ring-8 ring-white"
          src={event.user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(event.user.name)}&background=random`}
          alt={event.user.name}
        />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div
          className={`bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
            !event.success ? 'border-red-200 bg-red-50' : 'border-gray-200'
          }`}
          onClick={() => onClick?.(event)}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getActionIcon(event.action)}</span>
              <span className="font-medium text-gray-900">
                {event.action.replace(/_/g, ' ').toUpperCase()}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(event.severity)}`}>
                {event.severity}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <time className="text-sm text-gray-500">
                {new Date(event.timestamp).toLocaleString()}
              </time>
              {event.rollbackable && onRollbackClick && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRollbackClick(event);
                  }}
                  className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded-md transition-colors"
                >
                  Rollback
                </button>
              )}
            </div>
          </div>

          {/* User */}
          <div className="text-sm text-gray-600 mb-2">
            by <span className="font-medium">{event.user.name}</span>
          </div>

          {/* Error Message */}
          {!event.success && event.errorMessage && (
            <div className="mb-2 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-700">
              <strong>Error:</strong> {event.errorMessage}
            </div>
          )}

          {/* Changes */}
          {event.changes.length > 0 && !compactMode && (
            <div className="space-y-1">
              {event.changes.map((change, idx) => (
                <div key={idx} className="text-sm">
                  <span className="font-medium text-gray-700">
                    {change.displayName || change.field}:
                  </span>
                  <span className="text-gray-500 ml-1">
                    {String(change.oldValue || '(empty)')} → {String(change.newValue || '(empty)')}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Compact Changes */}
          {event.changes.length > 0 && compactMode && (
            <div className="text-sm text-gray-600">
              {event.changes.length} field{event.changes.length !== 1 ? 's' : ''} changed
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Timeline Summary
interface TimelineSummaryProps {
  summary: any;
}

const TimelineSummary: React.FC<TimelineSummaryProps> = ({ summary }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      <div>
        <span className="font-medium text-gray-900">Total Changes:</span>
        <span className="ml-1 text-gray-600">{summary.totalChanges}</span>
      </div>
      <div>
        <span className="font-medium text-gray-900">Most Active User:</span>
        <span className="ml-1 text-gray-600">{summary.mostActiveUser.name}</span>
      </div>
      <div>
        <span className="font-medium text-gray-900">Most Changed Field:</span>
        <span className="ml-1 text-gray-600">{summary.mostChangedField.field}</span>
      </div>
      <div>
        <span className="font-medium text-gray-900">Last 24h:</span>
        <span className="ml-1 text-gray-600">{summary.recentActivity.changesLast24h} changes</span>
      </div>
    </div>
  );
};

export default HistoryTimeline;