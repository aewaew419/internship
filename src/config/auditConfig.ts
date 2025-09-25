/**
 * Audit Configuration
 * Central configuration for the audit logging system
 */

import { 
  AuditConfiguration, 
  AuditAction, 
  AuditEntityType, 
  AuditCategory,
  AuditSeverity
} from '../types/audit';

/**
 * Default audit configuration
 */
export const defaultAuditConfig: AuditConfiguration = {
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
  enableCompression: true
};

/**
 * Production audit configuration
 */
export const productionAuditConfig: Partial<AuditConfiguration> = {
  enabled: true,
  retentionDays: 730, // 2 years
  logLevel: 'medium',
  excludeReadOperations: true,
  enablePerformanceTracking: true,
  enableSuspiciousActivityDetection: true,
  maxEventsPerBatch: 50,
  batchFlushInterval: 3000,
  enableEncryption: true,
  enableCompression: true,
  enabledActions: [
    // Critical operations only in production
    'create', 'update', 'delete',
    'role_create', 'role_update', 'role_delete', 'role_assign', 'role_unassign',
    'permission_grant', 'permission_revoke', 'permission_bulk_update',
    'semester_create', 'semester_update', 'semester_delete',
    'holiday_create', 'holiday_update', 'holiday_delete',
    'prefix_create', 'prefix_update', 'prefix_delete',
    'prefix_assign', 'prefix_unassign', 'prefix_bulk_assign',
    'login', 'logout', 'password_change', 'settings_update',
    'bulk_operation', 'data_import', 'data_export',
    'access_denied', 'suspicious_activity', 'session_timeout'
  ],
  enabledCategories: [
    'authentication', 'authorization', 'data_modification',
    'system_configuration', 'security'
  ]
};

/**
 * Development audit configuration
 */
export const developmentAuditConfig: Partial<AuditConfiguration> = {
  enabled: true,
  retentionDays: 30,
  logLevel: 'low',
  excludeReadOperations: false,
  enablePerformanceTracking: true,
  enableSuspiciousActivityDetection: false,
  maxEventsPerBatch: 200,
  batchFlushInterval: 10000,
  enableEncryption: false,
  enableCompression: false
};

/**
 * Testing audit configuration
 */
export const testingAuditConfig: Partial<AuditConfiguration> = {
  enabled: false,
  retentionDays: 1,
  logLevel: 'low',
  excludeReadOperations: true,
  enablePerformanceTracking: false,
  enableSuspiciousActivityDetection: false,
  maxEventsPerBatch: 1000,
  batchFlushInterval: 1000,
  enableEncryption: false,
  enableCompression: false
};

/**
 * Audit action configurations
 */
export const auditActionConfig = {
  // High-priority actions that should always be logged
  criticalActions: [
    'delete', 'role_delete', 'permission_revoke', 'role_unassign',
    'semester_delete', 'holiday_delete', 'prefix_delete',
    'settings_update', 'access_denied', 'suspicious_activity'
  ] as AuditAction[],

  // Actions that require immediate logging (no batching)
  immediateActions: [
    'access_denied', 'suspicious_activity', 'session_timeout',
    'login', 'logout', 'password_change'
  ] as AuditAction[],

  // Actions that can be batched for performance
  batchableActions: [
    'read', 'create', 'update',
    'role_create', 'role_update', 'role_assign',
    'permission_grant', 'permission_bulk_update',
    'semester_create', 'semester_update',
    'holiday_create', 'holiday_update',
    'prefix_create', 'prefix_update', 'prefix_assign'
  ] as AuditAction[],

  // Actions that should be excluded in high-traffic scenarios
  lowPriorityActions: [
    'read'
  ] as AuditAction[]
};

/**
 * Entity type configurations
 */
export const auditEntityConfig = {
  // Entities that require detailed change tracking
  detailedTrackingEntities: [
    'role', 'permission', 'system_settings',
    'semester', 'academic_calendar', 'title_prefix'
  ] as AuditEntityType[],

  // Entities that only need basic logging
  basicTrackingEntities: [
    'user', 'session', 'bulk_operation'
  ] as AuditEntityType[],

  // Entities that can be excluded from read operation logging
  excludeReadEntities: [
    'session', 'bulk_operation'
  ] as AuditEntityType[]
};

/**
 * Severity level configurations
 */
export const auditSeverityConfig = {
  severityMapping: {
    // Critical severity actions
    critical: [
      'delete', 'role_delete', 'permission_revoke', 'role_unassign',
      'access_denied', 'suspicious_activity', 'session_timeout'
    ] as AuditAction[],

    // High severity actions
    high: [
      'role_create', 'role_update', 'permission_grant', 'permission_bulk_update',
      'settings_update', 'data_import', 'data_export', 'bulk_operation'
    ] as AuditAction[],

    // Medium severity actions
    medium: [
      'create', 'update', 'role_assign',
      'semester_create', 'semester_update', 'semester_delete',
      'holiday_create', 'holiday_update', 'holiday_delete',
      'prefix_create', 'prefix_update', 'prefix_delete',
      'prefix_assign', 'prefix_unassign', 'prefix_bulk_assign'
    ] as AuditAction[],

    // Low severity actions
    low: [
      'read', 'login', 'logout', 'password_change'
    ] as AuditAction[]
  },

  // Minimum severity levels for different environments
  environmentSeverity: {
    production: 'medium' as AuditSeverity,
    staging: 'low' as AuditSeverity,
    development: 'low' as AuditSeverity,
    testing: 'high' as AuditSeverity
  }
};

/**
 * Performance configurations
 */
export const auditPerformanceConfig = {
  // Batch sizes for different environments
  batchSizes: {
    production: 50,
    staging: 100,
    development: 200,
    testing: 1000
  },

  // Flush intervals (milliseconds)
  flushIntervals: {
    production: 3000,
    staging: 5000,
    development: 10000,
    testing: 1000
  },

  // Maximum payload sizes (bytes)
  maxPayloadSizes: {
    production: 5000,
    staging: 10000,
    development: 50000,
    testing: 100000
  },

  // Performance monitoring thresholds
  performanceThresholds: {
    slowOperationMs: 1000,
    verySlowOperationMs: 5000,
    maxConcurrentOperations: 10,
    maxQueueSize: 1000
  }
};

/**
 * Security configurations
 */
export const auditSecurityConfig = {
  // Fields that should be redacted in logs
  sensitiveFields: [
    'password', 'confirmPassword', 'token', 'accessToken', 'refreshToken',
    'secret', 'key', 'privateKey', 'apiKey', 'sessionId', 'csrfToken'
  ],

  // IP addresses that should be monitored for suspicious activity
  suspiciousIPPatterns: [
    /^10\.0\.0\./, // Internal network attempts from outside
    /^192\.168\./, // Private network attempts
    /^172\.16\./ // Private network attempts
  ],

  // User agents that might indicate automated attacks
  suspiciousUserAgents: [
    'curl', 'wget', 'python-requests', 'bot', 'crawler', 'spider'
  ],

  // Actions that trigger immediate security alerts
  securityAlertActions: [
    'access_denied', 'suspicious_activity', 'session_timeout',
    'permission_revoke', 'role_unassign', 'role_delete'
  ] as AuditAction[],

  // Maximum failed attempts before flagging as suspicious
  maxFailedAttempts: 5,

  // Time window for failed attempt counting (milliseconds)
  failedAttemptWindow: 15 * 60 * 1000 // 15 minutes
};

/**
 * Export configurations
 */
export const auditExportConfig = {
  // Supported export formats
  supportedFormats: ['json', 'csv', 'excel'] as const,

  // Maximum records per export
  maxExportRecords: {
    json: 10000,
    csv: 50000,
    excel: 100000
  },

  // Export file naming patterns
  fileNamePatterns: {
    json: 'audit-events-{date}.json',
    csv: 'audit-events-{date}.csv',
    excel: 'audit-events-{date}.xlsx'
  },

  // Default export filters
  defaultExportFilters: {
    dateRange: 30, // days
    includeSensitiveData: false,
    includeSystemActions: false,
    minSeverity: 'medium' as AuditSeverity
  }
};

/**
 * Get audit configuration based on environment
 */
export function getAuditConfig(environment: string = 'development'): AuditConfiguration {
  const baseConfig = { ...defaultAuditConfig };
  
  switch (environment.toLowerCase()) {
    case 'production':
      return { ...baseConfig, ...productionAuditConfig };
    case 'staging':
      return { ...baseConfig, ...productionAuditConfig, retentionDays: 180 };
    case 'development':
      return { ...baseConfig, ...developmentAuditConfig };
    case 'testing':
    case 'test':
      return { ...baseConfig, ...testingAuditConfig };
    default:
      return baseConfig;
  }
}

/**
 * Validate audit configuration
 */
export function validateAuditConfig(config: Partial<AuditConfiguration>): string[] {
  const errors: string[] = [];

  if (config.retentionDays !== undefined && config.retentionDays < 1) {
    errors.push('Retention days must be at least 1');
  }

  if (config.maxEventsPerBatch !== undefined && config.maxEventsPerBatch < 1) {
    errors.push('Max events per batch must be at least 1');
  }

  if (config.batchFlushInterval !== undefined && config.batchFlushInterval < 1000) {
    errors.push('Batch flush interval must be at least 1000ms');
  }

  if (config.enabledActions && config.enabledActions.length === 0 && config.enabled) {
    errors.push('At least one action must be enabled when audit is enabled');
  }

  return errors;
}

/**
 * Merge audit configurations
 */
export function mergeAuditConfigs(
  base: AuditConfiguration,
  override: Partial<AuditConfiguration>
): AuditConfiguration {
  return {
    ...base,
    ...override,
    enabledActions: override.enabledActions || base.enabledActions,
    enabledEntityTypes: override.enabledEntityTypes || base.enabledEntityTypes,
    enabledCategories: override.enabledCategories || base.enabledCategories
  };
}