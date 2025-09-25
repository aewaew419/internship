/**
 * Audit Service
 * Comprehensive audit logging service for tracking all administrative operations
 */

import { 
  AuditEvent, 
  AuditAction, 
  AuditEntityType, 
  AuditChange, 
  AuditFilter, 
  AuditSummary, 
  AuditConfiguration, 
  AuditContext, 
  AuditLogger,
  AuditSeverity,
  AuditCategory
} from '../types/audit';

class AuditService implements AuditLogger {
  private config: AuditConfiguration;
  private context: AuditContext | null = null;
  private eventQueue: AuditEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<AuditConfiguration> = {}) {
    this.config = {
      enabled: true,
      retentionDays: 365,
      logLevel: 'low',
      enabledActions: [],
      enabledEntityTypes: [],
      enabledCategories: [],
      excludeReadOperations: false,
      enablePerformanceTracking: true,
      enableSuspiciousActivityDetection: true,
      maxEventsPerBatch: 100,
      batchFlushInterval: 5000,
      enableEncryption: false,
      enableCompression: true,
      ...config
    };

    this.startBatchFlushTimer();
  }

  /**
   * Set audit context for current user session
   */
  setContext(context: AuditContext): void {
    this.context = context;
  }

  /**
   * Clear audit context
   */
  clearContext(): void {
    this.context = null;
  }

  /**
   * Log an audit event
   */
  async log(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<void> {
    if (!this.config.enabled || !this.context) {
      return;
    }

    // Check if action should be logged
    if (!this.shouldLogAction(event.action, event.entityType, event.category)) {
      return;
    }

    const auditEvent: AuditEvent = {
      id: this.generateEventId(),
      timestamp: new Date().toISOString(),
      userId: this.context.userId,
      userEmail: this.context.userEmail,
      userName: this.context.userName,
      ipAddress: this.context.ipAddress,
      userAgent: this.context.userAgent,
      sessionId: this.context.sessionId,
      ...event
    };

    // Add to queue for batch processing
    this.eventQueue.push(auditEvent);

    // Flush immediately for critical events
    if (event.severity === 'critical') {
      await this.flushEvents();
    } else if (this.eventQueue.length >= this.config.maxEventsPerBatch) {
      await this.flushEvents();
    }
  }

  /**
   * Log a specific action with changes
   */
  async logAction(
    action: AuditAction,
    entityType: AuditEntityType,
    entityId: string,
    changes: AuditChange[],
    metadata?: Record<string, any>
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      await this.log({
        action,
        entityType,
        entityId,
        oldValue: this.extractOldValues(changes),
        newValue: this.extractNewValues(changes),
        changes,
        severity: this.determineSeverity(action, entityType),
        category: this.determineCategory(action),
        metadata,
        success: true,
        duration: this.config.enablePerformanceTracking ? Date.now() - startTime : undefined
      });
    } catch (error) {
      console.error('Failed to log audit event:', error);
    }
  }

  /**
   * Log an error event
   */
  async logError(
    action: AuditAction,
    entityType: AuditEntityType,
    entityId: string,
    error: Error,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log({
      action,
      entityType,
      entityId,
      oldValue: null,
      newValue: null,
      changes: [],
      severity: 'high',
      category: 'error',
      metadata: {
        ...metadata,
        errorName: error.name,
        errorStack: error.stack
      },
      success: false,
      errorMessage: error.message
    });
  }

  /**
   * Get audit events with filtering
   */
  async getEvents(filter: AuditFilter): Promise<AuditEvent[]> {
    try {
      // In a real implementation, this would query the database
      // For now, we'll simulate with localStorage or API call
      const response = await fetch('/api/admin/audit/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filter)
      });

      if (!response.ok) {
        throw new Error('Failed to fetch audit events');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get audit events:', error);
      return [];
    }
  }

  /**
   * Get audit summary statistics
   */
  async getSummary(filter?: Partial<AuditFilter>): Promise<AuditSummary> {
    try {
      const response = await fetch('/api/admin/audit/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filter || {})
      });

      if (!response.ok) {
        throw new Error('Failed to fetch audit summary');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get audit summary:', error);
      return this.getEmptySummary();
    }
  }

  /**
   * Export audit events
   */
  async exportEvents(filter: AuditFilter, format: 'json' | 'csv' | 'excel'): Promise<Blob> {
    try {
      const response = await fetch(`/api/admin/audit/export/${format}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filter)
      });

      if (!response.ok) {
        throw new Error('Failed to export audit events');
      }

      return await response.blob();
    } catch (error) {
      console.error('Failed to export audit events:', error);
      throw error;
    }
  }

  /**
   * Purge old audit events
   */
  async purgeOldEvents(olderThanDays: number): Promise<number> {
    try {
      const response = await fetch('/api/admin/audit/purge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ olderThanDays })
      });

      if (!response.ok) {
        throw new Error('Failed to purge old events');
      }

      const result = await response.json();
      return result.deletedCount || 0;
    } catch (error) {
      console.error('Failed to purge old events:', error);
      return 0;
    }
  }

  /**
   * Detect suspicious activities
   */
  async detectSuspiciousActivities(): Promise<AuditEvent[]> {
    if (!this.config.enableSuspiciousActivityDetection) {
      return [];
    }

    const filter: AuditFilter = {
      dateFrom: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
      severity: ['high', 'critical'],
      limit: 100
    };

    const events = await this.getEvents(filter);
    
    return events.filter(event => 
      this.isSuspiciousActivity(event)
    );
  }

  /**
   * Private helper methods
   */
  private shouldLogAction(action: AuditAction, entityType: AuditEntityType, category: AuditCategory): boolean {
    // Check if action is enabled
    if (this.config.enabledActions.length > 0 && !this.config.enabledActions.includes(action)) {
      return false;
    }

    // Check if entity type is enabled
    if (this.config.enabledEntityTypes.length > 0 && !this.config.enabledEntityTypes.includes(entityType)) {
      return false;
    }

    // Check if category is enabled
    if (this.config.enabledCategories.length > 0 && !this.config.enabledCategories.includes(category)) {
      return false;
    }

    // Exclude read operations if configured
    if (this.config.excludeReadOperations && action === 'read') {
      return false;
    }

    return true;
  }

  private determineSeverity(action: AuditAction, entityType: AuditEntityType): AuditSeverity {
    // Critical operations
    if (action.includes('delete') || action === 'permission_revoke' || action === 'role_unassign') {
      return 'critical';
    }

    // High severity operations
    if (action.includes('permission') || action.includes('role') || entityType === 'system_settings') {
      return 'high';
    }

    // Medium severity operations
    if (action.includes('update') || action.includes('create')) {
      return 'medium';
    }

    return 'low';
  }

  private determineCategory(action: AuditAction): AuditCategory {
    if (action === 'login' || action === 'logout' || action === 'password_change') {
      return 'authentication';
    }

    if (action.includes('permission') || action.includes('role') || action === 'access_denied') {
      return 'authorization';
    }

    if (action.includes('settings') || action.includes('system')) {
      return 'system_configuration';
    }

    if (action === 'suspicious_activity' || action === 'session_timeout') {
      return 'security';
    }

    return 'data_modification';
  }

  private extractOldValues(changes: AuditChange[]): Record<string, any> {
    return changes.reduce((acc, change) => {
      acc[change.field] = change.oldValue;
      return acc;
    }, {} as Record<string, any>);
  }

  private extractNewValues(changes: AuditChange[]): Record<string, any> {
    return changes.reduce((acc, change) => {
      acc[change.field] = change.newValue;
      return acc;
    }, {} as Record<string, any>);
  }

  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await fetch('/api/admin/audit/events/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventsToFlush)
      });
    } catch (error) {
      console.error('Failed to flush audit events:', error);
      // Re-add events to queue for retry
      this.eventQueue.unshift(...eventsToFlush);
    }
  }

  private startBatchFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flushEvents();
    }, this.config.batchFlushInterval);
  }

  private isSuspiciousActivity(event: AuditEvent): boolean {
    // Multiple failed login attempts
    if (event.action === 'login' && !event.success) {
      return true;
    }

    // Access denied events
    if (event.action === 'access_denied') {
      return true;
    }

    // Bulk operations outside business hours
    if (event.action === 'bulk_operation') {
      const hour = new Date(event.timestamp).getHours();
      if (hour < 6 || hour > 22) {
        return true;
      }
    }

    // Critical operations by non-admin users
    if (event.severity === 'critical' && !event.userName.includes('admin')) {
      return true;
    }

    return false;
  }

  private getEmptySummary(): AuditSummary {
    return {
      totalEvents: 0,
      eventsByAction: {} as Record<AuditAction, number>,
      eventsByEntityType: {} as Record<AuditEntityType, number>,
      eventsBySeverity: {} as Record<AuditSeverity, number>,
      eventsByCategory: {} as Record<AuditCategory, number>,
      eventsByUser: [],
      recentEvents: [],
      suspiciousActivities: [],
      failedOperations: []
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    // Flush remaining events
    this.flushEvents();
  }
}

// Create singleton instance
export const auditService = new AuditService();

// Export helper functions for common audit operations
export const auditHelpers = {
  /**
   * Create audit changes from object comparison
   */
  createChanges(oldObj: any, newObj: any, fieldDisplayNames?: Record<string, string>): AuditChange[] {
    const changes: AuditChange[] = [];
    const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);

    for (const key of allKeys) {
      const oldValue = oldObj?.[key];
      const newValue = newObj?.[key];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          field: key,
          oldValue,
          newValue,
          fieldType: typeof newValue || typeof oldValue,
          displayName: fieldDisplayNames?.[key] || key
        });
      }
    }

    return changes;
  },

  /**
   * Format audit event for display
   */
  formatEventForDisplay(event: AuditEvent): string {
    const action = event.action.replace(/_/g, ' ').toUpperCase();
    const entity = event.entityName || event.entityId;
    const user = event.userName || event.userEmail;
    
    return `${user} ${action} ${event.entityType} "${entity}"`;
  },

  /**
   * Get severity color for UI
   */
  getSeverityColor(severity: AuditSeverity): string {
    const colors = {
      low: '#10B981',      // green
      medium: '#F59E0B',   // yellow
      high: '#EF4444',     // red
      critical: '#7C2D12'  // dark red
    };
    return colors[severity];
  }
};

export default auditService;