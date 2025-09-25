/**
 * Audit Logging for Authentication Events
 * Provides comprehensive logging for security incidents and authentication events
 */

interface AuditEvent {
  id: string;
  timestamp: number;
  eventType: AuditEventType;
  userId?: string;
  userType?: 'student' | 'admin';
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  success: boolean;
}

type AuditEventType = 
  | 'login_attempt'
  | 'login_success'
  | 'login_failure'
  | 'logout'
  | 'password_reset_request'
  | 'password_reset_success'
  | 'registration_attempt'
  | 'registration_success'
  | 'token_refresh'
  | 'session_timeout'
  | 'rate_limit_exceeded'
  | 'suspicious_activity'
  | 'csrf_violation'
  | 'invalid_token'
  | 'permission_denied'
  | 'account_locked';

interface AuditConfig {
  maxEvents: number;
  retentionDays: number;
  enableLocalStorage: boolean;
  enableRemoteLogging: boolean;
  remoteEndpoint?: string;
  batchSize: number;
  flushInterval: number;
}

class AuditLogger {
  private config: AuditConfig;
  private events: AuditEvent[] = [];
  private pendingEvents: AuditEvent[] = [];
  private flushTimer?: NodeJS.Timeout;
  private sessionId: string;

  constructor(config: Partial<AuditConfig> = {}) {
    this.config = {
      maxEvents: 1000,
      retentionDays: 30,
      enableLocalStorage: true,
      enableRemoteLogging: false,
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.loadStoredEvents();
    this.startFlushTimer();
  }

  /**
   * Log an authentication event
   */
  logEvent(
    eventType: AuditEventType,
    details: Record<string, any> = {},
    options: {
      userId?: string;
      userType?: 'student' | 'admin';
      success?: boolean;
      severity?: 'low' | 'medium' | 'high' | 'critical';
    } = {}
  ): void {
    const event: AuditEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      eventType,
      userId: options.userId,
      userType: options.userType,
      sessionId: this.sessionId,
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      details: this.sanitizeDetails(details),
      severity: options.severity || this.determineSeverity(eventType, options.success),
      success: options.success !== false
    };

    this.addEvent(event);
  }

  /**
   * Log login attempt
   */
  logLoginAttempt(identifier: string, userType: 'student' | 'admin', success: boolean, error?: string): void {
    this.logEvent('login_attempt', {
      identifier: this.hashIdentifier(identifier),
      error,
      timestamp: new Date().toISOString()
    }, {
      userType,
      success,
      severity: success ? 'low' : 'medium'
    });
  }

  /**
   * Log successful login
   */
  logLoginSuccess(userId: string, userType: 'student' | 'admin'): void {
    this.logEvent('login_success', {
      loginTime: new Date().toISOString()
    }, {
      userId,
      userType,
      success: true,
      severity: 'low'
    });
  }

  /**
   * Log logout
   */
  logLogout(userId: string, userType: 'student' | 'admin', reason: 'manual' | 'timeout' | 'forced' = 'manual'): void {
    this.logEvent('logout', {
      reason,
      logoutTime: new Date().toISOString()
    }, {
      userId,
      userType,
      success: true,
      severity: 'low'
    });
  }

  /**
   * Log rate limit exceeded
   */
  logRateLimitExceeded(identifier: string, attemptCount: number): void {
    this.logEvent('rate_limit_exceeded', {
      identifier: this.hashIdentifier(identifier),
      attemptCount,
      timestamp: new Date().toISOString()
    }, {
      success: false,
      severity: 'high'
    });
  }

  /**
   * Log suspicious activity
   */
  logSuspiciousActivity(activityType: string, details: Record<string, any>): void {
    this.logEvent('suspicious_activity', {
      activityType,
      ...details,
      timestamp: new Date().toISOString()
    }, {
      success: false,
      severity: 'critical'
    });
  }

  /**
   * Log CSRF violation
   */
  logCSRFViolation(expectedToken: string, receivedToken: string): void {
    this.logEvent('csrf_violation', {
      expectedTokenHash: this.hashToken(expectedToken),
      receivedTokenHash: this.hashToken(receivedToken),
      timestamp: new Date().toISOString()
    }, {
      success: false,
      severity: 'high'
    });
  }

  /**
   * Log session timeout
   */
  logSessionTimeout(userId?: string, userType?: 'student' | 'admin'): void {
    this.logEvent('session_timeout', {
      timeoutTime: new Date().toISOString()
    }, {
      userId,
      userType,
      success: true,
      severity: 'medium'
    });
  }

  /**
   * Get events by type
   */
  getEventsByType(eventType: AuditEventType): AuditEvent[] {
    return this.events.filter(event => event.eventType === eventType);
  }

  /**
   * Get events by user
   */
  getEventsByUser(userId: string): AuditEvent[] {
    return this.events.filter(event => event.userId === userId);
  }

  /**
   * Get events by severity
   */
  getEventsBySeverity(severity: 'low' | 'medium' | 'high' | 'critical'): AuditEvent[] {
    return this.events.filter(event => event.severity === severity);
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit: number = 50): AuditEvent[] {
    return this.events
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get security summary
   */
  getSecuritySummary(timeRangeMs: number = 24 * 60 * 60 * 1000): {
    totalEvents: number;
    failedLogins: number;
    rateLimitViolations: number;
    suspiciousActivities: number;
    csrfViolations: number;
  } {
    const cutoff = Date.now() - timeRangeMs;
    const recentEvents = this.events.filter(event => event.timestamp >= cutoff);

    return {
      totalEvents: recentEvents.length,
      failedLogins: recentEvents.filter(e => e.eventType === 'login_failure').length,
      rateLimitViolations: recentEvents.filter(e => e.eventType === 'rate_limit_exceeded').length,
      suspiciousActivities: recentEvents.filter(e => e.eventType === 'suspicious_activity').length,
      csrfViolations: recentEvents.filter(e => e.eventType === 'csrf_violation').length
    };
  }

  /**
   * Export events for analysis
   */
  exportEvents(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      return this.exportAsCSV();
    }
    return JSON.stringify(this.events, null, 2);
  }

  /**
   * Clear old events based on retention policy
   */
  private cleanupOldEvents(): void {
    const cutoff = Date.now() - (this.config.retentionDays * 24 * 60 * 60 * 1000);
    this.events = this.events.filter(event => event.timestamp >= cutoff);
  }

  /**
   * Add event to storage
   */
  private addEvent(event: AuditEvent): void {
    this.events.push(event);
    this.pendingEvents.push(event);

    // Enforce max events limit
    if (this.events.length > this.config.maxEvents) {
      this.events = this.events.slice(-this.config.maxEvents);
    }

    // Store locally if enabled
    if (this.config.enableLocalStorage) {
      this.saveToLocalStorage();
    }

    // Queue for remote logging if enabled
    if (this.config.enableRemoteLogging && this.pendingEvents.length >= this.config.batchSize) {
      this.flushToRemote();
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Determine event severity
   */
  private determineSeverity(eventType: AuditEventType, success?: boolean): 'low' | 'medium' | 'high' | 'critical' {
    if (success === false) {
      switch (eventType) {
        case 'login_attempt':
        case 'registration_attempt':
          return 'medium';
        case 'rate_limit_exceeded':
        case 'csrf_violation':
          return 'high';
        case 'suspicious_activity':
          return 'critical';
        default:
          return 'medium';
      }
    }

    switch (eventType) {
      case 'login_success':
      case 'logout':
        return 'low';
      case 'password_reset_request':
      case 'session_timeout':
        return 'medium';
      default:
        return 'low';
    }
  }

  /**
   * Sanitize event details to remove sensitive information
   */
  private sanitizeDetails(details: Record<string, any>): Record<string, any> {
    const sanitized = { ...details };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Hash identifier for privacy
   */
  private hashIdentifier(identifier: string): string {
    // Simple hash for privacy (not cryptographically secure)
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      const char = identifier.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `hash_${Math.abs(hash).toString(36)}`;
  }

  /**
   * Hash token for logging
   */
  private hashToken(token: string): string {
    return this.hashIdentifier(token);
  }

  /**
   * Get client IP (best effort)
   */
  private getClientIP(): string {
    // This is limited in browser environment
    return 'client-side';
  }

  /**
   * Load stored events from localStorage
   */
  private loadStoredEvents(): void {
    if (!this.config.enableLocalStorage) return;

    try {
      const stored = localStorage.getItem('audit_events');
      if (stored) {
        this.events = JSON.parse(stored);
        this.cleanupOldEvents();
      }
    } catch (error) {
      console.error('Failed to load audit events:', error);
    }
  }

  /**
   * Save events to localStorage
   */
  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('audit_events', JSON.stringify(this.events));
    } catch (error) {
      console.error('Failed to save audit events:', error);
    }
  }

  /**
   * Start flush timer for remote logging
   */
  private startFlushTimer(): void {
    if (!this.config.enableRemoteLogging) return;

    this.flushTimer = setInterval(() => {
      if (this.pendingEvents.length > 0) {
        this.flushToRemote();
      }
    }, this.config.flushInterval);
  }

  /**
   * Flush pending events to remote endpoint
   */
  private async flushToRemote(): Promise<void> {
    if (!this.config.remoteEndpoint || this.pendingEvents.length === 0) return;

    const eventsToSend = [...this.pendingEvents];
    this.pendingEvents = [];

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: eventsToSend })
      });
    } catch (error) {
      console.error('Failed to send audit events to remote:', error);
      // Re-add events to pending queue
      this.pendingEvents.unshift(...eventsToSend);
    }
  }

  /**
   * Export events as CSV
   */
  private exportAsCSV(): string {
    const headers = ['ID', 'Timestamp', 'Event Type', 'User ID', 'User Type', 'Session ID', 'Severity', 'Success', 'Details'];
    const rows = this.events.map(event => [
      event.id,
      new Date(event.timestamp).toISOString(),
      event.eventType,
      event.userId || '',
      event.userType || '',
      event.sessionId || '',
      event.severity,
      event.success.toString(),
      JSON.stringify(event.details)
    ]);

    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }
}

// Global audit logger instance
export const auditLogger = new AuditLogger();

/**
 * Hook for using audit logging in React components
 */
export function useAuditLogger() {
  const logEvent = (eventType: AuditEventType, details?: Record<string, any>, options?: any) => {
    auditLogger.logEvent(eventType, details, options);
  };

  const logLoginAttempt = (identifier: string, userType: 'student' | 'admin', success: boolean, error?: string) => {
    auditLogger.logLoginAttempt(identifier, userType, success, error);
  };

  const logLoginSuccess = (userId: string, userType: 'student' | 'admin') => {
    auditLogger.logLoginSuccess(userId, userType);
  };

  const logLogout = (userId: string, userType: 'student' | 'admin', reason?: 'manual' | 'timeout' | 'forced') => {
    auditLogger.logLogout(userId, userType, reason);
  };

  const getSecuritySummary = (timeRangeMs?: number) => {
    return auditLogger.getSecuritySummary(timeRangeMs);
  };

  return {
    logEvent,
    logLoginAttempt,
    logLoginSuccess,
    logLogout,
    getSecuritySummary
  };
}