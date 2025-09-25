"use client";

import type { ProcessedAuthError } from './error-handler';

export interface ErrorReport {
  id: string;
  timestamp: string;
  error: ProcessedAuthError;
  userFeedback?: string;
  deviceInfo: DeviceInfo;
  sessionInfo: SessionInfo;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  screenResolution: string;
  viewport: string;
  touchSupport: boolean;
  connectionType?: string;
  language: string;
  timezone: string;
}

export interface SessionInfo {
  sessionId: string;
  userId?: string;
  userType?: 'student' | 'admin';
  pageUrl: string;
  referrer: string;
  sessionDuration: number;
  previousErrors: number;
}

export interface ErrorAnalytics {
  totalErrors: number;
  errorsByCategory: Record<string, number>;
  errorsByCode: Record<string, number>;
  errorsBySeverity: Record<string, number>;
  errorsByUserType: Record<string, number>;
  errorsByAction: Record<string, number>;
  errorTrends: Array<{
    date: string;
    count: number;
    category: string;
  }>;
  topErrors: Array<{
    code: string;
    count: number;
    lastOccurred: string;
  }>;
  recoverySuccess: Record<string, {
    attempted: number;
    successful: number;
    successRate: number;
  }>;
}

/**
 * Authentication error reporting and analytics system
 * Handles error logging, user feedback collection, and analytics
 */
export class AuthErrorReporter {
  private static readonly STORAGE_KEY = 'auth_error_reports';
  private static readonly ANALYTICS_KEY = 'auth_error_analytics';
  private static readonly MAX_STORED_REPORTS = 100;
  private static readonly REPORT_ENDPOINT = '/api/auth/error-reports';
  
  private static sessionId: string = this.generateSessionId();
  private static errorCount: number = 0;

  /**
   * Report an authentication error
   */
  static async reportError(
    processedError: ProcessedAuthError,
    userFeedback?: string
  ): Promise<void> {
    try {
      const report = this.createErrorReport(processedError, userFeedback);
      
      // Store locally first
      this.storeReportLocally(report);
      
      // Update analytics
      this.updateAnalytics(processedError);
      
      // Send to server if error should be reported
      if (processedError.shouldReport) {
        await this.sendReportToServer(report);
      }
      
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.group('🔴 Authentication Error Report');
        console.error('Error:', processedError);
        console.info('Report:', report);
        console.groupEnd();
      }
    } catch (error) {
      console.error('Failed to report authentication error:', error);
    }
  }

  /**
   * Create a comprehensive error report
   */
  private static createErrorReport(
    processedError: ProcessedAuthError,
    userFeedback?: string
  ): ErrorReport {
    return {
      id: this.generateReportId(),
      timestamp: new Date().toISOString(),
      error: processedError,
      userFeedback,
      deviceInfo: this.collectDeviceInfo(),
      sessionInfo: this.collectSessionInfo(),
    };
  }

  /**
   * Collect device information for error context
   */
  private static collectDeviceInfo(): DeviceInfo {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      connectionType: connection?.effectiveType || 'unknown',
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  /**
   * Collect session information for error context
   */
  private static collectSessionInfo(): SessionInfo {
    const sessionStart = sessionStorage.getItem('session_start');
    const sessionStartTime = sessionStart ? new Date(sessionStart) : new Date();
    const sessionDuration = Date.now() - sessionStartTime.getTime();
    
    return {
      sessionId: this.sessionId,
      userId: this.getCurrentUserId(),
      userType: this.getCurrentUserType(),
      pageUrl: window.location.href,
      referrer: document.referrer,
      sessionDuration: Math.floor(sessionDuration / 1000), // in seconds
      previousErrors: this.errorCount,
    };
  }

  /**
   * Store error report locally for offline support and analytics
   */
  private static storeReportLocally(report: ErrorReport): void {
    try {
      const existingReports = this.getStoredReports();
      const updatedReports = [report, ...existingReports].slice(0, this.MAX_STORED_REPORTS);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedReports));
      this.errorCount++;
    } catch (error) {
      console.warn('Failed to store error report locally:', error);
    }
  }

  /**
   * Send error report to server
   */
  private static async sendReportToServer(report: ErrorReport): Promise<void> {
    try {
      const response = await fetch(this.REPORT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      });

      if (!response.ok) {
        throw new Error(`Failed to send report: ${response.status}`);
      }
    } catch (error) {
      console.warn('Failed to send error report to server:', error);
      // Keep the report locally for retry later
    }
  }

  /**
   * Update error analytics
   */
  private static updateAnalytics(processedError: ProcessedAuthError): void {
    try {
      const analytics = this.getAnalytics();
      const today = new Date().toISOString().split('T')[0];
      
      // Update counters
      analytics.totalErrors++;
      analytics.errorsByCategory[processedError.category] = (analytics.errorsByCategory[processedError.category] || 0) + 1;
      analytics.errorsByCode[processedError.code] = (analytics.errorsByCode[processedError.code] || 0) + 1;
      analytics.errorsBySeverity[processedError.severity] = (analytics.errorsBySeverity[processedError.severity] || 0) + 1;
      
      if (processedError.context.userType) {
        analytics.errorsByUserType[processedError.context.userType] = (analytics.errorsByUserType[processedError.context.userType] || 0) + 1;
      }
      
      analytics.errorsByAction[processedError.context.action] = (analytics.errorsByAction[processedError.context.action] || 0) + 1;
      
      // Update trends
      const existingTrend = analytics.errorTrends.find(t => t.date === today && t.category === processedError.category);
      if (existingTrend) {
        existingTrend.count++;
      } else {
        analytics.errorTrends.push({
          date: today,
          count: 1,
          category: processedError.category,
        });
      }
      
      // Keep only last 30 days of trends
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      analytics.errorTrends = analytics.errorTrends.filter(t => new Date(t.date) >= thirtyDaysAgo);
      
      // Update top errors
      const existingTopError = analytics.topErrors.find(e => e.code === processedError.code);
      if (existingTopError) {
        existingTopError.count++;
        existingTopError.lastOccurred = new Date().toISOString();
      } else {
        analytics.topErrors.push({
          code: processedError.code,
          count: 1,
          lastOccurred: new Date().toISOString(),
        });
      }
      
      // Sort and keep top 10 errors
      analytics.topErrors.sort((a, b) => b.count - a.count);
      analytics.topErrors = analytics.topErrors.slice(0, 10);
      
      // Save analytics
      localStorage.setItem(this.ANALYTICS_KEY, JSON.stringify(analytics));
    } catch (error) {
      console.warn('Failed to update error analytics:', error);
    }
  }

  /**
   * Record error recovery attempt
   */
  static recordRecoveryAttempt(errorCode: string, successful: boolean): void {
    try {
      const analytics = this.getAnalytics();
      
      if (!analytics.recoverySuccess[errorCode]) {
        analytics.recoverySuccess[errorCode] = {
          attempted: 0,
          successful: 0,
          successRate: 0,
        };
      }
      
      const recovery = analytics.recoverySuccess[errorCode];
      recovery.attempted++;
      
      if (successful) {
        recovery.successful++;
      }
      
      recovery.successRate = recovery.successful / recovery.attempted;
      
      localStorage.setItem(this.ANALYTICS_KEY, JSON.stringify(analytics));
    } catch (error) {
      console.warn('Failed to record recovery attempt:', error);
    }
  }

  /**
   * Get stored error reports
   */
  static getStoredReports(): ErrorReport[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to get stored error reports:', error);
      return [];
    }
  }

  /**
   * Get error analytics
   */
  static getAnalytics(): ErrorAnalytics {
    try {
      const stored = localStorage.getItem(this.ANALYTICS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to get error analytics:', error);
    }
    
    // Return default analytics structure
    return {
      totalErrors: 0,
      errorsByCategory: {},
      errorsByCode: {},
      errorsBySeverity: {},
      errorsByUserType: {},
      errorsByAction: {},
      errorTrends: [],
      topErrors: [],
      recoverySuccess: {},
    };
  }

  /**
   * Clear stored error data (for privacy/cleanup)
   */
  static clearStoredData(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.ANALYTICS_KEY);
      this.errorCount = 0;
    } catch (error) {
      console.warn('Failed to clear stored error data:', error);
    }
  }

  /**
   * Export error data for analysis
   */
  static exportErrorData(): {
    reports: ErrorReport[];
    analytics: ErrorAnalytics;
    exportedAt: string;
  } {
    return {
      reports: this.getStoredReports(),
      analytics: this.getAnalytics(),
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Get error summary for dashboard
   */
  static getErrorSummary(): {
    totalErrors: number;
    recentErrors: number;
    criticalErrors: number;
    topErrorCode: string | null;
    averageRecoveryRate: number;
  } {
    const analytics = this.getAnalytics();
    const reports = this.getStoredReports();
    
    // Count recent errors (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const recentErrors = reports.filter(r => new Date(r.timestamp) >= oneDayAgo).length;
    
    // Count critical errors
    const criticalErrors = reports.filter(r => r.error.severity === 'critical').length;
    
    // Get top error code
    const topErrorCode = analytics.topErrors.length > 0 ? analytics.topErrors[0].code : null;
    
    // Calculate average recovery rate
    const recoveryRates = Object.values(analytics.recoverySuccess).map(r => r.successRate);
    const averageRecoveryRate = recoveryRates.length > 0 
      ? recoveryRates.reduce((sum, rate) => sum + rate, 0) / recoveryRates.length 
      : 0;
    
    return {
      totalErrors: analytics.totalErrors,
      recentErrors,
      criticalErrors,
      topErrorCode,
      averageRecoveryRate,
    };
  }

  /**
   * Retry failed server reports
   */
  static async retryFailedReports(): Promise<void> {
    const reports = this.getStoredReports();
    const failedReports = reports.filter(r => r.error.shouldReport);
    
    for (const report of failedReports) {
      try {
        await this.sendReportToServer(report);
      } catch (error) {
        console.warn(`Failed to retry report ${report.id}:`, error);
      }
    }
  }

  /**
   * Generate unique session ID
   */
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique report ID
   */
  private static generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current user ID from storage
   */
  private static getCurrentUserId(): string | undefined {
    try {
      const user = localStorage.getItem('user_account');
      if (user) {
        const parsedUser = JSON.parse(user);
        return parsedUser.id?.toString();
      }
    } catch (error) {
      // Ignore errors
    }
    return undefined;
  }

  /**
   * Get current user type from storage
   */
  private static getCurrentUserType(): 'student' | 'admin' | undefined {
    try {
      const user = localStorage.getItem('user_account');
      if (user) {
        const parsedUser = JSON.parse(user);
        return parsedUser.role === 'student' ? 'student' : 'admin';
      }
    } catch (error) {
      // Ignore errors
    }
    return undefined;
  }
}

// Initialize session tracking
if (typeof window !== 'undefined' && !sessionStorage.getItem('session_start')) {
  sessionStorage.setItem('session_start', new Date().toISOString());
}