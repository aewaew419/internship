/**
 * Audit Logging System Types
 * Comprehensive type definitions for tracking all administrative operations
 */

export interface AuditEvent {
  id: string;
  userId: number;
  userEmail: string;
  userName: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityName?: string;
  oldValue: any;
  newValue: any;
  changes: AuditChange[];
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  severity: AuditSeverity;
  category: AuditCategory;
  metadata?: Record<string, any>;
  success: boolean;
  errorMessage?: string;
  duration?: number;
}

export interface AuditChange {
  field: string;
  oldValue: any;
  newValue: any;
  fieldType: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'date';
  displayName?: string;
}

export type AuditAction = 
  // CRUD Operations
  | 'create' | 'read' | 'update' | 'delete'
  // Role Management
  | 'role_create' | 'role_update' | 'role_delete' | 'role_assign' | 'role_unassign'
  | 'permission_grant' | 'permission_revoke' | 'permission_bulk_update'
  // Calendar Management
  | 'semester_create' | 'semester_update' | 'semester_delete'
  | 'holiday_create' | 'holiday_update' | 'holiday_delete'
  | 'calendar_import' | 'calendar_export'
  // Prefix Management
  | 'prefix_create' | 'prefix_update' | 'prefix_delete'
  | 'prefix_assign' | 'prefix_unassign' | 'prefix_bulk_assign'
  // System Operations
  | 'login' | 'logout' | 'password_change' | 'settings_update'
  | 'bulk_operation' | 'data_import' | 'data_export'
  // Security Events
  | 'access_denied' | 'suspicious_activity' | 'session_timeout';

export type AuditEntityType = 
  | 'user' | 'role' | 'permission' | 'module'
  | 'semester' | 'holiday' | 'academic_calendar'
  | 'title_prefix' | 'prefix_assignment'
  | 'system_settings' | 'session' | 'bulk_operation';

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';

export type AuditCategory = 
  | 'authentication' | 'authorization' | 'data_modification'
  | 'system_configuration' | 'security' | 'performance' | 'error';

export interface AuditFilter {
  userId?: number;
  userEmail?: string;
  action?: AuditAction | AuditAction[];
  entityType?: AuditEntityType | AuditEntityType[];
  entityId?: string;
  severity?: AuditSeverity | AuditSeverity[];
  category?: AuditCategory | AuditCategory[];
  dateFrom?: string;
  dateTo?: string;
  ipAddress?: string;
  success?: boolean;
  searchTerm?: string;
  limit?: number;
  offset?: number;
  sortBy?: keyof AuditEvent;
  sortOrder?: 'asc' | 'desc';
}

export interface AuditSummary {
  totalEvents: number;
  eventsByAction: Record<AuditAction, number>;
  eventsByEntityType: Record<AuditEntityType, number>;
  eventsBySeverity: Record<AuditSeverity, number>;
  eventsByCategory: Record<AuditCategory, number>;
  eventsByUser: Array<{
    userId: number;
    userName: string;
    eventCount: number;
  }>;
  recentEvents: AuditEvent[];
  suspiciousActivities: AuditEvent[];
  failedOperations: AuditEvent[];
}

export interface AuditConfiguration {
  enabled: boolean;
  retentionDays: number;
  logLevel: AuditSeverity;
  enabledActions: AuditAction[];
  enabledEntityTypes: AuditEntityType[];
  enabledCategories: AuditCategory[];
  excludeReadOperations: boolean;
  enablePerformanceTracking: boolean;
  enableSuspiciousActivityDetection: boolean;
  maxEventsPerBatch: number;
  batchFlushInterval: number;
  enableEncryption: boolean;
  enableCompression: boolean;
}

export interface AuditContext {
  userId: number;
  userEmail: string;
  userName: string;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
  requestId?: string;
  correlationId?: string;
}

export interface AuditLogger {
  log(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void>;
  logAction(
    action: AuditAction,
    entityType: AuditEntityType,
    entityId: string,
    changes: AuditChange[],
    metadata?: Record<string, any>
  ): Promise<void>;
  logError(
    action: AuditAction,
    entityType: AuditEntityType,
    entityId: string,
    error: Error,
    metadata?: Record<string, any>
  ): Promise<void>;
  getEvents(filter: AuditFilter): Promise<AuditEvent[]>;
  getSummary(filter?: Partial<AuditFilter>): Promise<AuditSummary>;
  exportEvents(filter: AuditFilter, format: 'json' | 'csv' | 'excel'): Promise<Blob>;
  purgeOldEvents(olderThanDays: number): Promise<number>;
}