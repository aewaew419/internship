/**
 * Audit Utilities
 * Helper functions and utilities for audit logging
 */

import { 
  AuditEvent, 
  AuditAction, 
  AuditEntityType, 
  AuditChange, 
  AuditSeverity,
  AuditCategory
} from '../types/audit';

/**
 * Audit decorators and higher-order functions
 */

/**
 * Decorator for automatic audit logging of function calls
 */
export function auditLog(
  action: AuditAction,
  entityType: AuditEntityType,
  options?: {
    getEntityId?: (...args: any[]) => string;
    getMetadata?: (...args: any[]) => Record<string, any>;
    logErrors?: boolean;
    logPerformance?: boolean;
  }
) {
  return function <T extends (...args: any[]) => any>(
    target: any,
    propertyName: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const method = descriptor.value!;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const entityId = options?.getEntityId?.(...args) || 'unknown';
      const metadata = options?.getMetadata?.(...args) || {};

      try {
        const result = await method.apply(this, args);
        
        // Log successful operation
        const { auditService } = await import('../services/auditService');
        await auditService.logAction(
          action,
          entityType,
          entityId,
          [], // Changes would need to be calculated based on the operation
          {
            ...metadata,
            functionName: propertyName,
            duration: options?.logPerformance ? Date.now() - startTime : undefined,
            success: true
          }
        );

        return result;
      } catch (error) {
        if (options?.logErrors !== false) {
          const { auditService } = await import('../services/auditService');
          await auditService.logError(
            action,
            entityType,
            entityId,
            error as Error,
            {
              ...metadata,
              functionName: propertyName,
              duration: Date.now() - startTime
            }
          );
        }
        throw error;
      }
    } as any;

    return descriptor;
  };
}

/**
 * Higher-order function for wrapping async functions with audit logging
 */
export function withAuditLogging<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  action: AuditAction,
  entityType: AuditEntityType,
  options?: {
    getEntityId?: (...args: Parameters<T>) => string;
    getChanges?: (args: Parameters<T>, result: Awaited<ReturnType<T>>) => AuditChange[];
    getMetadata?: (...args: Parameters<T>) => Record<string, any>;
  }
): T {
  return (async (...args: Parameters<T>) => {
    const startTime = Date.now();
    const entityId = options?.getEntityId?.(...args) || 'unknown';
    const metadata = options?.getMetadata?.(...args) || {};

    try {
      const result = await fn(...args);
      const changes = options?.getChanges?.(args, result) || [];

      const { auditService } = await import('../services/auditService');
      await auditService.logAction(
        action,
        entityType,
        entityId,
        changes,
        {
          ...metadata,
          duration: Date.now() - startTime,
          success: true
        }
      );

      return result;
    } catch (error) {
      const { auditService } = await import('../services/auditService');
      await auditService.logError(
        action,
        entityType,
        entityId,
        error as Error,
        {
          ...metadata,
          duration: Date.now() - startTime
        }
      );
      throw error;
    }
  }) as T;
}

/**
 * Audit formatting utilities
 */
export const auditFormatters = {
  /**
   * Format audit event for human-readable display
   */
  formatEvent(event: AuditEvent): string {
    const timestamp = new Date(event.timestamp).toLocaleString();
    const action = event.action.replace(/_/g, ' ').toUpperCase();
    const entity = event.entityName || event.entityId;
    
    return `[${timestamp}] ${event.userName} ${action} ${event.entityType} "${entity}"`;
  },

  /**
   * Format changes for display
   */
  formatChanges(changes: AuditChange[]): string {
    return changes.map(change => {
      const displayName = change.displayName || change.field;
      const oldValue = this.formatValue(change.oldValue);
      const newValue = this.formatValue(change.newValue);
      
      return `${displayName}: ${oldValue} → ${newValue}`;
    }).join(', ');
  },

  /**
   * Format value for display
   */
  formatValue(value: any): string {
    if (value === null || value === undefined) {
      return '(empty)';
    }
    
    if (typeof value === 'string') {
      return `"${value}"`;
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  },

  /**
   * Format duration in human-readable format
   */
  formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    }
    
    const seconds = Math.floor(milliseconds / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  },

  /**
   * Get severity badge color
   */
  getSeverityColor(severity: AuditSeverity): string {
    const colors = {
      low: '#10B981',      // green-500
      medium: '#F59E0B',   // amber-500
      high: '#EF4444',     // red-500
      critical: '#7C2D12'  // red-900
    };
    return colors[severity];
  },

  /**
   * Get category icon
   */
  getCategoryIcon(category: AuditCategory): string {
    const icons = {
      authentication: '🔐',
      authorization: '🛡️',
      data_modification: '📝',
      system_configuration: '⚙️',
      security: '🚨',
      performance: '⚡',
      error: '❌'
    };
    return icons[category] || '📋';
  }
};

/**
 * Audit validation utilities
 */
export const auditValidators = {
  /**
   * Validate audit event structure
   */
  validateEvent(event: Partial<AuditEvent>): string[] {
    const errors: string[] = [];

    if (!event.action) {
      errors.push('Action is required');
    }

    if (!event.entityType) {
      errors.push('Entity type is required');
    }

    if (!event.entityId) {
      errors.push('Entity ID is required');
    }

    if (!event.userId) {
      errors.push('User ID is required');
    }

    if (!event.timestamp) {
      errors.push('Timestamp is required');
    }

    return errors;
  },

  /**
   * Validate audit filter
   */
  validateFilter(filter: any): string[] {
    const errors: string[] = [];

    if (filter.dateFrom && filter.dateTo) {
      const fromDate = new Date(filter.dateFrom);
      const toDate = new Date(filter.dateTo);
      
      if (fromDate > toDate) {
        errors.push('Date from must be before date to');
      }
    }

    if (filter.limit && (filter.limit < 1 || filter.limit > 1000)) {
      errors.push('Limit must be between 1 and 1000');
    }

    if (filter.offset && filter.offset < 0) {
      errors.push('Offset must be non-negative');
    }

    return errors;
  }
};

/**
 * Audit comparison utilities
 */
export const auditComparators = {
  /**
   * Deep compare two objects and return changes
   */
  compareObjects(oldObj: any, newObj: any, path = ''): AuditChange[] {
    const changes: AuditChange[] = [];

    // Handle null/undefined cases
    if (oldObj === null || oldObj === undefined) {
      if (newObj !== null && newObj !== undefined) {
        changes.push({
          field: path || 'root',
          oldValue: oldObj,
          newValue: newObj,
          fieldType: typeof newObj
        });
      }
      return changes;
    }

    if (newObj === null || newObj === undefined) {
      changes.push({
        field: path || 'root',
        oldValue: oldObj,
        newValue: newObj,
        fieldType: typeof oldObj
      });
      return changes;
    }

    // Handle primitive types
    if (typeof oldObj !== 'object' || typeof newObj !== 'object') {
      if (oldObj !== newObj) {
        changes.push({
          field: path || 'root',
          oldValue: oldObj,
          newValue: newObj,
          fieldType: typeof newObj
        });
      }
      return changes;
    }

    // Handle arrays
    if (Array.isArray(oldObj) || Array.isArray(newObj)) {
      if (JSON.stringify(oldObj) !== JSON.stringify(newObj)) {
        changes.push({
          field: path || 'root',
          oldValue: oldObj,
          newValue: newObj,
          fieldType: 'array'
        });
      }
      return changes;
    }

    // Handle objects
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
    
    for (const key of allKeys) {
      const fieldPath = path ? `${path}.${key}` : key;
      const oldValue = oldObj[key];
      const newValue = newObj[key];

      if (typeof oldValue === 'object' && typeof newValue === 'object' && 
          oldValue !== null && newValue !== null &&
          !Array.isArray(oldValue) && !Array.isArray(newValue)) {
        // Recursively compare nested objects
        changes.push(...this.compareObjects(oldValue, newValue, fieldPath));
      } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({
          field: fieldPath,
          oldValue,
          newValue,
          fieldType: typeof newValue || typeof oldValue
        });
      }
    }

    return changes;
  },

  /**
   * Compare arrays and return detailed changes
   */
  compareArrays(oldArray: any[], newArray: any[]): AuditChange[] {
    const changes: AuditChange[] = [];

    // Simple comparison for now - in a real implementation, you might want
    // to do more sophisticated array diffing
    if (JSON.stringify(oldArray) !== JSON.stringify(newArray)) {
      changes.push({
        field: 'array',
        oldValue: oldArray,
        newValue: newArray,
        fieldType: 'array'
      });
    }

    return changes;
  }
};

/**
 * Audit search utilities
 */
export const auditSearch = {
  /**
   * Search audit events by text
   */
  searchEvents(events: AuditEvent[], searchTerm: string): AuditEvent[] {
    if (!searchTerm.trim()) {
      return events;
    }

    const term = searchTerm.toLowerCase();
    
    return events.filter(event => 
      event.action.toLowerCase().includes(term) ||
      event.entityType.toLowerCase().includes(term) ||
      event.entityId.toLowerCase().includes(term) ||
      event.userName.toLowerCase().includes(term) ||
      event.userEmail.toLowerCase().includes(term) ||
      (event.entityName && event.entityName.toLowerCase().includes(term)) ||
      (event.errorMessage && event.errorMessage.toLowerCase().includes(term))
    );
  },

  /**
   * Filter events by date range
   */
  filterByDateRange(events: AuditEvent[], fromDate: string, toDate: string): AuditEvent[] {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    
    return events.filter(event => {
      const eventDate = new Date(event.timestamp);
      return eventDate >= from && eventDate <= to;
    });
  },

  /**
   * Group events by a specific field
   */
  groupEvents<K extends keyof AuditEvent>(
    events: AuditEvent[], 
    groupBy: K
  ): Record<string, AuditEvent[]> {
    return events.reduce((groups, event) => {
      const key = String(event[groupBy]);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(event);
      return groups;
    }, {} as Record<string, AuditEvent[]>);
  }
};

/**
 * Audit export utilities
 */
export const auditExport = {
  /**
   * Convert events to CSV format
   */
  toCSV(events: AuditEvent[]): string {
    if (events.length === 0) {
      return '';
    }

    const headers = [
      'Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 
      'Severity', 'Category', 'Success', 'IP Address', 'Changes'
    ];

    const rows = events.map(event => [
      event.timestamp,
      event.userName,
      event.action,
      event.entityType,
      event.entityId,
      event.severity,
      event.category,
      event.success ? 'Yes' : 'No',
      event.ipAddress,
      auditFormatters.formatChanges(event.changes)
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
  },

  /**
   * Convert events to JSON format
   */
  toJSON(events: AuditEvent[]): string {
    return JSON.stringify(events, null, 2);
  },

  /**
   * Download events as file
   */
  downloadAsFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

/**
 * Performance monitoring for audit operations
 */
export class AuditPerformanceMonitor {
  private static instance: AuditPerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): AuditPerformanceMonitor {
    if (!AuditPerformanceMonitor.instance) {
      AuditPerformanceMonitor.instance = new AuditPerformanceMonitor();
    }
    return AuditPerformanceMonitor.instance;
  }

  startTimer(operation: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(operation, duration);
    };
  }

  recordMetric(operation: string, duration: number): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    const metrics = this.metrics.get(operation)!;
    metrics.push(duration);
    
    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  getMetrics(operation: string): { avg: number; min: number; max: number; count: number } | null {
    const metrics = this.metrics.get(operation);
    if (!metrics || metrics.length === 0) {
      return null;
    }

    const sum = metrics.reduce((a, b) => a + b, 0);
    return {
      avg: sum / metrics.length,
      min: Math.min(...metrics),
      max: Math.max(...metrics),
      count: metrics.length
    };
  }

  getAllMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, any> = {};
    
    for (const [operation] of this.metrics) {
      const metrics = this.getMetrics(operation);
      if (metrics) {
        result[operation] = metrics;
      }
    }
    
    return result;
  }
}

export const auditPerformanceMonitor = AuditPerformanceMonitor.getInstance();