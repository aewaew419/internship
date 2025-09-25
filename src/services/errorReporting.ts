/**
 * Error Reporting and Analytics Service
 * Handles error logging, user feedback, and analytics for authentication system
 */

export interface AuthError {
  id: string;
  type: 'validation' | 'authentication' | 'network' | 'system';
  code: string;
  message: string;
  timestamp: Date;
  userId?: string;
  userAgent: string;
  url: string;
  stackTrace?: string;
  context?: Record<string, any>;
}

export interface ErrorReport {
  error: AuthError;
  userFeedback?: string;
  reproductionSteps?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  reportedAt: Date;
}

export interface ErrorAnalytics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByCode: Record<string, number>;
  errorTrends: Array<{ date: string; count: number }>;
  topErrors: Array<{ code: string; count: number; message: string }>;
  userImpact: {
    affectedUsers: number;
    failureRate: number;
    averageResolutionTime: number;
  };
}

class ErrorReportingService {
  private errors: AuthError[] = [];
  private reports: ErrorReport[] = [];
  private analyticsEndpoint = '/api/analytics/errors';
  private reportingEndpoint = '/api/errors/report';

  /**
   * Log an authentication error
   */
  logError(error: Partial<AuthError>): string {
    const authError: AuthError = {
      id: this.generateErrorId(),
      type: error.type || 'system',
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      timestamp: new Date(),
      userId: error.userId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      stackTrace: error.stackTrace,
      context: error.context || {}
    };

    this.errors.push(authError);
    this.persistError(authError);
    this.sendToAnalytics(authError);

    return authError.id;
  }

  /**
   * Create error report with user feedback
   */
  async reportError(
    errorId: string, 
    userFeedback?: string, 
    reproductionSteps?: string,
    severity: ErrorReport['severity'] = 'medium'
  ): Promise<void> {
    const error = this.errors.find(e => e.id === errorId);
    if (!error) {
      throw new Error('Error not found');
    }

    const report: ErrorReport = {
      error,
      userFeedback,
      reproductionSteps,
      severity,
      resolved: false,
      reportedAt: new Date()
    };

    this.reports.push(report);
    
    try {
      await this.sendErrorReport(report);
    } catch (err) {
      console.error('Failed to send error report:', err);
      // Store locally for retry
      this.storeReportForRetry(report);
    }
  }

  /**
   * Get error analytics data
   */
  getAnalytics(timeRange: 'day' | 'week' | 'month' = 'week'): ErrorAnalytics {
    const now = new Date();
    const startDate = new Date();
    
    switch (timeRange) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    const filteredErrors = this.errors.filter(
      error => error.timestamp >= startDate
    );

    return {
      totalErrors: filteredErrors.length,
      errorsByType: this.groupErrorsByType(filteredErrors),
      errorsByCode: this.groupErrorsByCode(filteredErrors),
      errorTrends: this.calculateErrorTrends(filteredErrors, timeRange),
      topErrors: this.getTopErrors(filteredErrors),
      userImpact: this.calculateUserImpact(filteredErrors)
    };
  }

  /**
   * Get errors for specific user
   */
  getUserErrors(userId: string): AuthError[] {
    return this.errors.filter(error => error.userId === userId);
  }

  /**
   * Mark error as resolved
   */
  resolveError(errorId: string): void {
    const report = this.reports.find(r => r.error.id === errorId);
    if (report) {
      report.resolved = true;
    }
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private persistError(error: AuthError): void {
    try {
      const stored = localStorage.getItem('auth_errors') || '[]';
      const errors = JSON.parse(stored);
      errors.push(error);
      
      // Keep only last 100 errors in localStorage
      if (errors.length > 100) {
        errors.splice(0, errors.length - 100);
      }
      
      localStorage.setItem('auth_errors', JSON.stringify(errors));
    } catch (err) {
      console.error('Failed to persist error:', err);
    }
  }

  private async sendToAnalytics(error: AuthError): Promise<void> {
    try {
      await fetch(this.analyticsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: {
            type: error.type,
            code: error.code,
            timestamp: error.timestamp,
            userId: error.userId,
            userAgent: error.userAgent,
            url: error.url,
            context: error.context
          }
        })
      });
    } catch (err) {
      console.error('Failed to send analytics:', err);
    }
  }

  private async sendErrorReport(report: ErrorReport): Promise<void> {
    const response = await fetch(this.reportingEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(report)
    });

    if (!response.ok) {
      throw new Error(`Failed to send error report: ${response.statusText}`);
    }
  }

  private storeReportForRetry(report: ErrorReport): void {
    try {
      const stored = localStorage.getItem('pending_error_reports') || '[]';
      const reports = JSON.parse(stored);
      reports.push(report);
      localStorage.setItem('pending_error_reports', JSON.stringify(reports));
    } catch (err) {
      console.error('Failed to store report for retry:', err);
    }
  }

  private groupErrorsByType(errors: AuthError[]): Record<string, number> {
    return errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupErrorsByCode(errors: AuthError[]): Record<string, number> {
    return errors.reduce((acc, error) => {
      acc[error.code] = (acc[error.code] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateErrorTrends(errors: AuthError[], timeRange: string): Array<{ date: string; count: number }> {
    const trends: Record<string, number> = {};
    
    errors.forEach(error => {
      const date = error.timestamp.toISOString().split('T')[0];
      trends[date] = (trends[date] || 0) + 1;
    });

    return Object.entries(trends)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private getTopErrors(errors: AuthError[]): Array<{ code: string; count: number; message: string }> {
    const errorCounts = this.groupErrorsByCode(errors);
    
    return Object.entries(errorCounts)
      .map(([code, count]) => {
        const error = errors.find(e => e.code === code);
        return {
          code,
          count,
          message: error?.message || 'Unknown error'
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private calculateUserImpact(errors: AuthError[]): ErrorAnalytics['userImpact'] {
    const uniqueUsers = new Set(errors.filter(e => e.userId).map(e => e.userId));
    const totalAttempts = errors.length + 1000; // Assume some successful attempts
    
    return {
      affectedUsers: uniqueUsers.size,
      failureRate: (errors.length / totalAttempts) * 100,
      averageResolutionTime: 24 // hours - placeholder
    };
  }
}

export const errorReportingService = new ErrorReportingService();