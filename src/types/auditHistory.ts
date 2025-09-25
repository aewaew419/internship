/**
 * Audit History Visualization Types
 * Types for history visualization, timeline, and rollback functionality
 */

import { AuditEvent, AuditChange, AuditAction, AuditEntityType } from './audit';

export interface HistoryTimeline {
  id: string;
  entityType: AuditEntityType;
  entityId: string;
  entityName?: string;
  events: TimelineEvent[];
  totalEvents: number;
  dateRange: {
    start: string;
    end: string;
  };
  summary: HistorySummary;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  action: AuditAction;
  user: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
  };
  changes: AuditChange[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
  rollbackable: boolean;
  rollbackData?: RollbackData;
  relatedEvents?: string[]; // IDs of related events
}

export interface HistorySummary {
  totalChanges: number;
  changesByField: Record<string, number>;
  changesByUser: Record<string, number>;
  changesByAction: Record<AuditAction, number>;
  mostActiveUser: {
    id: number;
    name: string;
    changeCount: number;
  };
  mostChangedField: {
    field: string;
    changeCount: number;
  };
  recentActivity: {
    lastChange: string;
    changesLast24h: number;
    changesLast7d: number;
    changesLast30d: number;
  };
}

export interface RollbackData {
  targetState: any;
  affectedFields: string[];
  dependencies: RollbackDependency[];
  warnings: RollbackWarning[];
  estimatedImpact: RollbackImpact;
}

export interface RollbackDependency {
  entityType: AuditEntityType;
  entityId: string;
  entityName?: string;
  dependencyType: 'parent' | 'child' | 'reference' | 'cascade';
  action: 'update' | 'delete' | 'create';
  description: string;
}

export interface RollbackWarning {
  type: 'data_loss' | 'dependency_conflict' | 'permission_required' | 'irreversible';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  affectedEntities: string[];
  recommendation?: string;
}

export interface RollbackImpact {
  affectedEntities: number;
  affectedUsers: number;
  dataLossRisk: 'none' | 'low' | 'medium' | 'high';
  systemImpact: 'none' | 'low' | 'medium' | 'high';
  estimatedDuration: number; // in milliseconds
  reversible: boolean;
}

export interface HistoryFilter {
  entityType?: AuditEntityType | AuditEntityType[];
  entityId?: string | string[];
  userId?: number | number[];
  action?: AuditAction | AuditAction[];
  dateFrom?: string;
  dateTo?: string;
  severity?: ('low' | 'medium' | 'high' | 'critical')[];
  success?: boolean;
  hasChanges?: boolean;
  searchTerm?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'user' | 'action' | 'severity';
  sortOrder?: 'asc' | 'desc';
  groupBy?: 'date' | 'user' | 'action' | 'entity';
}

export interface HistoryVisualizationConfig {
  timelineView: {
    showAvatars: boolean;
    showMetadata: boolean;
    showRelatedEvents: boolean;
    compactMode: boolean;
    maxEventsPerPage: number;
    autoRefresh: boolean;
    refreshInterval: number;
  };
  diffView: {
    showLineNumbers: boolean;
    highlightChanges: boolean;
    showWhitespace: boolean;
    contextLines: number;
    diffAlgorithm: 'character' | 'word' | 'line';
  };
  rollbackView: {
    showDependencies: boolean;
    showWarnings: boolean;
    showImpactAnalysis: boolean;
    requireConfirmation: boolean;
    allowBulkRollback: boolean;
  };
  export: {
    includeMetadata: boolean;
    includeUserInfo: boolean;
    maxExportSize: number;
    supportedFormats: ('json' | 'csv' | 'pdf' | 'html')[];
  };
}

export interface DiffVisualization {
  id: string;
  eventId: string;
  field: string;
  fieldDisplayName?: string;
  oldValue: any;
  newValue: any;
  diffType: 'added' | 'removed' | 'modified' | 'unchanged';
  diffLines: DiffLine[];
  summary: DiffSummary;
}

export interface DiffLine {
  lineNumber: number;
  type: 'added' | 'removed' | 'unchanged' | 'context';
  content: string;
  highlighted: boolean;
}

export interface DiffSummary {
  totalLines: number;
  addedLines: number;
  removedLines: number;
  modifiedLines: number;
  unchangedLines: number;
}

export interface TimelineGroup {
  date: string;
  events: TimelineEvent[];
  summary: {
    totalEvents: number;
    uniqueUsers: number;
    actions: AuditAction[];
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface HistoryExport {
  format: 'json' | 'csv' | 'pdf' | 'html';
  data: HistoryTimeline;
  metadata: {
    exportedAt: string;
    exportedBy: {
      id: number;
      name: string;
      email: string;
    };
    filter: HistoryFilter;
    totalRecords: number;
  };
  options: {
    includeMetadata: boolean;
    includeUserInfo: boolean;
    includeDiffs: boolean;
    includeRollbackData: boolean;
  };
}

export interface HistorySearch {
  query: string;
  filters: HistoryFilter;
  results: HistorySearchResult[];
  totalResults: number;
  searchTime: number;
  suggestions: string[];
}

export interface HistorySearchResult {
  event: TimelineEvent;
  relevanceScore: number;
  matchedFields: string[];
  highlights: HistoryHighlight[];
}

export interface HistoryHighlight {
  field: string;
  text: string;
  startIndex: number;
  endIndex: number;
}

export interface HistoryAnalytics {
  entityId: string;
  entityType: AuditEntityType;
  period: {
    start: string;
    end: string;
  };
  metrics: {
    totalChanges: number;
    averageChangesPerDay: number;
    peakActivityDay: string;
    mostActiveUser: string;
    mostChangedField: string;
    changeVelocity: number; // changes per hour
    stabilityScore: number; // 0-100, higher = more stable
  };
  trends: {
    changeFrequency: TimeSeriesData[];
    userActivity: TimeSeriesData[];
    fieldChanges: TimeSeriesData[];
    errorRate: TimeSeriesData[];
  };
  patterns: {
    commonChangeSequences: ChangeSequence[];
    userBehaviorPatterns: UserPattern[];
    timePatterns: TimePattern[];
  };
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
  label?: string;
}

export interface ChangeSequence {
  sequence: AuditAction[];
  frequency: number;
  averageTimeBetween: number;
  users: string[];
}

export interface UserPattern {
  userId: number;
  userName: string;
  pattern: {
    preferredActions: AuditAction[];
    activeHours: number[];
    averageSessionDuration: number;
    changeComplexity: 'low' | 'medium' | 'high';
  };
}

export interface TimePattern {
  type: 'hourly' | 'daily' | 'weekly' | 'monthly';
  pattern: {
    peak: string;
    low: string;
    distribution: Record<string, number>;
  };
}

export interface RollbackOperation {
  id: string;
  targetEventId: string;
  entityType: AuditEntityType;
  entityId: string;
  rollbackData: RollbackData;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  initiatedBy: {
    id: number;
    name: string;
    email: string;
  };
  initiatedAt: string;
  completedAt?: string;
  error?: string;
  result?: RollbackResult;
}

export interface RollbackResult {
  success: boolean;
  affectedEntities: string[];
  rollbackEvents: string[]; // IDs of events created by rollback
  warnings: string[];
  errors: string[];
  duration: number;
  summary: string;
}