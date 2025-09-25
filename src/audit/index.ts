/**
 * Audit System - Main Export
 * Central export point for all audit logging functionality
 */

// Types
export * from '../types/audit';

// Core Service
export { default as auditService, auditHelpers } from '../services/auditService';

// React Hooks
export {
  useAudit,
  useAuditEvents,
  useAuditSummary,
  useAuditTracker,
  useSuspiciousActivityMonitor,
  useAuditRealTime,
  useAuditMaintenance
} from '../hooks/useAudit';

// Context Provider
export {
  AuditProvider,
  useAuditContext,
  withAuditContext,
  useComponentAudit
} from '../contexts/AuditContext';

// Utilities
export {
  auditFormatters,
  auditValidators,
  auditComparators,
  auditSearch,
  auditExport,
  auditPerformanceMonitor,
  AuditPerformanceMonitor
} from '../utils/auditUtils';

// Middleware
export {
  APIAuditMiddleware,
  StateAuditMiddleware,
  FormAuditMiddleware,
  apiAuditMiddleware,
  stateAuditMiddleware,
  formAuditMiddleware
} from '../middleware/auditMiddleware';

// Configuration
export {
  defaultAuditConfig,
  productionAuditConfig,
  developmentAuditConfig,
  testingAuditConfig,
  auditActionConfig,
  auditEntityConfig,
  auditSeverityConfig,
  auditPerformanceConfig,
  auditSecurityConfig,
  auditExportConfig,
  getAuditConfig,
  validateAuditConfig,
  mergeAuditConfigs
} from '../config/auditConfig';

// Decorators and HOCs
export { auditLog, withAuditLogging } from '../utils/auditUtils';

/**
 * Quick setup functions for common use cases
 */

import { auditService } from '../services/auditService';
import { apiAuditMiddleware, stateAuditMiddleware } from '../middleware/auditMiddleware';
import { getAuditConfig } from '../config/auditConfig';
import { AuditContext } from '../types/audit';

/**
 * Initialize audit system with default configuration
 */
export function initializeAuditSystem(
  environment: string = 'development',
  userContext?: { id: number; email: string; name: string }
) {
  const config = getAuditConfig(environment);
  
  // Initialize service with configuration
  // Note: In a real implementation, you'd pass config to service constructor
  console.log('Audit system initialized with config:', config);

  // Set up API middleware
  apiAuditMiddleware.createFetchInterceptor();

  // Set user context if provided
  if (userContext) {
    const auditContext: AuditContext = {
      userId: userContext.id,
      userEmail: userContext.email,
      userName: userContext.name,
      ipAddress: '127.0.0.1', // Would be actual IP in real implementation
      userAgent: navigator.userAgent,
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    auditService.setContext(auditContext);
  }

  return {
    auditService,
    config
  };
}

/**
 * Setup audit for React application
 */
export function setupReactAudit(config?: {
  environment?: string;
  enableAPILogging?: boolean;
  enableStateLogging?: boolean;
  enableFormLogging?: boolean;
}) {
  const {
    environment = 'development',
    enableAPILogging = true,
    enableStateLogging = true,
    enableFormLogging = true
  } = config || {};

  const auditConfig = getAuditConfig(environment);

  // Setup middleware
  if (enableAPILogging) {
    apiAuditMiddleware.createFetchInterceptor();
  }

  return {
    auditConfig,
    middleware: {
      api: enableAPILogging ? apiAuditMiddleware : null,
      state: enableStateLogging ? stateAuditMiddleware : null,
      form: enableFormLogging ? formAuditMiddleware : null
    }
  };
}

/**
 * Create audit logger for specific entity type
 */
export function createEntityAuditLogger(entityType: string) {
  return {
    logCreate: (entityId: string, data: any, metadata?: Record<string, any>) =>
      auditService.logAction('create', entityType as any, entityId, [], { data, ...metadata }),
    
    logUpdate: (entityId: string, changes: any[], metadata?: Record<string, any>) =>
      auditService.logAction('update', entityType as any, entityId, changes, metadata),
    
    logDelete: (entityId: string, metadata?: Record<string, any>) =>
      auditService.logAction('delete', entityType as any, entityId, [], metadata),
    
    logRead: (entityId: string, metadata?: Record<string, any>) =>
      auditService.logAction('read', entityType as any, entityId, [], metadata),
    
    logError: (entityId: string, error: Error, metadata?: Record<string, any>) =>
      auditService.logError('update', entityType as any, entityId, error, metadata)
  };
}

/**
 * Batch audit operations for performance
 */
export class BatchAuditLogger {
  private operations: Array<() => Promise<void>> = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private maxBatchSize: number;
  private flushInterval: number;

  constructor(maxBatchSize = 100, flushInterval = 5000) {
    this.maxBatchSize = maxBatchSize;
    this.flushInterval = flushInterval;
  }

  add(operation: () => Promise<void>) {
    this.operations.push(operation);

    if (this.operations.length >= this.maxBatchSize) {
      this.flush();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), this.flushInterval);
    }
  }

  async flush() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    const operations = [...this.operations];
    this.operations = [];

    try {
      await Promise.all(operations.map(op => op()));
    } catch (error) {
      console.error('Failed to flush batch audit operations:', error);
    }
  }

  destroy() {
    this.flush();
  }
}

/**
 * Default export with commonly used functions
 */
export default {
  initializeAuditSystem,
  setupReactAudit,
  createEntityAuditLogger,
  BatchAuditLogger,
  auditService,
  auditHelpers
};