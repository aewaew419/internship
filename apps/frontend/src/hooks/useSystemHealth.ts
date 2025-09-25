'use client';

import { useState, useEffect, useCallback } from 'react';

export interface SystemHealthIssue {
  id: string;
  type: 'role_conflicts' | 'calendar_conflicts' | 'prefix_conflicts' | 'permission_errors' | 'data_integrity' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  count: number;
  affectedItems: string[];
  quickFix?: {
    available: boolean;
    action: string;
    description: string;
    handler: () => Promise<void>;
  };
  detailsUrl?: string;
  lastDetected: Date;
  resolved: boolean;
}

export interface SystemHealthMetrics {
  overall: 'healthy' | 'warning' | 'critical' | 'maintenance';
  uptime: number;
  responseTime: number;
  errorRate: number;
  activeUsers: number;
  systemLoad: number;
  memoryUsage: number;
  lastCheck: Date;
}

export interface SystemHealthData {
  issues: SystemHealthIssue[];
  metrics: SystemHealthMetrics;
  isLoading: boolean;
  error: string | null;
  lastRefresh: Date | null;
}

export interface UseSystemHealthOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableNotifications?: boolean;
}

export const useSystemHealth = (options: UseSystemHealthOptions = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    enableNotifications = true
  } = options;

  const [data, setData] = useState<SystemHealthData>({
    issues: [],
    metrics: {
      overall: 'healthy',
      uptime: 0,
      responseTime: 0,
      errorRate: 0,
      activeUsers: 0,
      systemLoad: 0,
      memoryUsage: 0,
      lastCheck: new Date()
    },
    isLoading: true,
    error: null,
    lastRefresh: null
  });

  // Generate mock system health data
  const generateMockData = useCallback((): { issues: SystemHealthIssue[]; metrics: SystemHealthMetrics } => {
    const now = new Date();
    
    const mockIssues: SystemHealthIssue[] = [
      {
        id: '1',
        type: 'role_conflicts',
        severity: 'high',
        title: 'ข้อขัดแย้งในการกำหนดสิทธิ์บทบาท',
        description: 'พบการกำหนดสิทธิ์ที่ขัดแย้งกันระหว่างบทบาท "อาจารย์นิเทศ" และ "ผู้ประสานงาน"',
        count: 3,
        affectedItems: ['บทบาทอาจารย์นิเทศ', 'บทบาทผู้ประสานงาน', 'สิทธิ์การอนุมัติ'],
        quickFix: {
          available: true,
          action: 'แก้ไขอัตโนมัติ',
          description: 'ระบบจะปรับสิทธิ์ให้สอดคล้องกันโดยอัตโนมัติ',
          handler: async () => {
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log('Quick fix applied for role conflicts');
          }
        },
        detailsUrl: '/admin/roles?filter=conflicts',
        lastDetected: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        resolved: false
      },
      {
        id: '2',
        type: 'calendar_conflicts',
        severity: 'medium',
        title: 'ข้อขัดแย้งในปฏิทินการศึกษา',
        description: 'วันหยุดราชการซ้อนทับกับช่วงสอบกลางภาค',
        count: 1,
        affectedItems: ['วันหยุดวิสาขบูชา', 'สอบกลางภาคเทอม 2/2567'],
        quickFix: {
          available: true,
          action: 'เลื่อนกำหนดการ',
          description: 'เลื่อนกำหนดสอบไปวันถัดไป',
          handler: async () => {
            await new Promise(resolve => setTimeout(resolve, 1500));
            console.log('Quick fix applied for calendar conflicts');
          }
        },
        detailsUrl: '/admin/calendar?view=conflicts',
        lastDetected: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        resolved: false
      },
      {
        id: '3',
        type: 'prefix_conflicts',
        severity: 'low',
        title: 'คำนำหน้าชื่อไม่สอดคล้องกับเพศ',
        description: 'พบการกำหนดคำนำหน้าชื่อที่ไม่เหมาะสมกับเพศของผู้ใช้',
        count: 2,
        affectedItems: ['นาย สมหญิง', 'นางสาว สมชาย'],
        quickFix: {
          available: true,
          action: 'แก้ไขคำนำหน้า',
          description: 'ปรับคำนำหน้าชื่อให้เหมาะสมกับเพศ',
          handler: async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Quick fix applied for prefix conflicts');
          }
        },
        detailsUrl: '/admin/prefixes?filter=gender-mismatch',
        lastDetected: new Date(now.getTime() - 6 * 60 * 60 * 1000),
        resolved: false
      },
      {
        id: '4',
        type: 'performance',
        severity: 'critical',
        title: 'ประสิทธิภาพระบบลดลง',
        description: 'เวลาตอบสนองของระบบช้าเกินกว่าปกติ อาจส่งผลต่อประสบการณ์ผู้ใช้',
        count: 1,
        affectedItems: ['API Response Time', 'Database Queries', 'Page Load Speed'],
        quickFix: {
          available: false,
          action: 'ตรวจสอบระบบ',
          description: 'ต้องตรวจสอบและแก้ไขโดยทีมเทคนิค',
          handler: async () => {
            await new Promise(resolve => setTimeout(resolve, 3000));
            console.log('Performance issue escalated to technical team');
          }
        },
        detailsUrl: '/admin/system/performance',
        lastDetected: new Date(now.getTime() - 30 * 60 * 1000),
        resolved: false
      }
    ];

    // Randomly resolve some issues
    const resolvedIssues = mockIssues.map(issue => ({
      ...issue,
      resolved: Math.random() > 0.7
    }));

    const mockMetrics: SystemHealthMetrics = {
      overall: resolvedIssues.some(issue => issue.severity === 'critical' && !issue.resolved) ? 'critical' :
               resolvedIssues.some(issue => issue.severity === 'high' && !issue.resolved) ? 'warning' : 'healthy',
      uptime: 72.5, // hours
      responseTime: Math.floor(Math.random() * 500) + 200, // 200-700ms
      errorRate: Math.random() * 0.05, // 0-5%
      activeUsers: Math.floor(Math.random() * 20) + 40,
      systemLoad: Math.random() * 80 + 10, // 10-90%
      memoryUsage: Math.random() * 70 + 20, // 20-90%
      lastCheck: now
    };

    return { issues: resolvedIssues, metrics: mockMetrics };
  }, []);

  // Fetch system health data
  const fetchSystemHealth = useCallback(async () => {
    try {
      // In a real implementation, this would be API calls
      // const [issuesResponse, metricsResponse] = await Promise.all([
      //   fetch('/api/admin/system/health/issues'),
      //   fetch('/api/admin/system/health/metrics')
      // ]);
      
      // Mock data for demonstration
      const { issues, metrics } = generateMockData();
      
      return { issues, metrics };
    } catch (error) {
      console.error('Failed to fetch system health data:', error);
      throw error;
    }
  }, [generateMockData]);

  // Load system health data
  const loadSystemHealth = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));
      
      const { issues, metrics } = await fetchSystemHealth();
      
      setData({
        issues,
        metrics,
        isLoading: false,
        error: null,
        lastRefresh: new Date()
      });
    } catch (error) {
      console.error('Failed to load system health data:', error);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load system health data'
      }));
    }
  }, [fetchSystemHealth]);

  // Refresh system health data
  const refreshSystemHealth = useCallback(() => {
    loadSystemHealth();
  }, [loadSystemHealth]);

  // Resolve an issue
  const resolveIssue = useCallback(async (issueId: string) => {
    try {
      // In a real implementation, this would be an API call
      // await fetch(`/api/admin/system/health/issues/${issueId}/resolve`, { method: 'POST' });
      
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setData(prev => ({
        ...prev,
        issues: prev.issues.map(issue =>
          issue.id === issueId ? { ...issue, resolved: true } : issue
        )
      }));
    } catch (error) {
      console.error('Failed to resolve issue:', error);
      throw error;
    }
  }, []);

  // Apply quick fix for an issue
  const applyQuickFix = useCallback(async (issueId: string) => {
    try {
      const issue = data.issues.find(i => i.id === issueId);
      if (!issue?.quickFix?.handler) {
        throw new Error('Quick fix not available for this issue');
      }
      
      await issue.quickFix.handler();
      
      // Mark issue as resolved after quick fix
      setData(prev => ({
        ...prev,
        issues: prev.issues.map(i =>
          i.id === issueId ? { ...i, resolved: true } : i
        )
      }));
    } catch (error) {
      console.error('Failed to apply quick fix:', error);
      throw error;
    }
  }, [data.issues]);

  // Show notification for critical issues
  const showCriticalIssueNotification = useCallback((issue: SystemHealthIssue) => {
    if (!enableNotifications || typeof window === 'undefined') return;
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`ปัญหาวิกฤต: ${issue.title}`, {
        body: issue.description,
        icon: '/favicon.ico',
        tag: `health-issue-${issue.id}`
      });
    }
  }, [enableNotifications]);

  // Initial data load
  useEffect(() => {
    loadSystemHealth();
  }, [loadSystemHealth]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadSystemHealth();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadSystemHealth]);

  // Monitor for new critical issues
  useEffect(() => {
    const criticalIssues = data.issues.filter(
      issue => issue.severity === 'critical' && !issue.resolved
    );
    
    criticalIssues.forEach(issue => {
      showCriticalIssueNotification(issue);
    });
  }, [data.issues, showCriticalIssueNotification]);

  // Request notification permission
  useEffect(() => {
    if (!enableNotifications || typeof window === 'undefined') return;
    
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [enableNotifications]);

  // Calculate health statistics
  const healthStats = {
    totalIssues: data.issues.filter(issue => !issue.resolved).length,
    criticalIssues: data.issues.filter(issue => issue.severity === 'critical' && !issue.resolved).length,
    highIssues: data.issues.filter(issue => issue.severity === 'high' && !issue.resolved).length,
    mediumIssues: data.issues.filter(issue => issue.severity === 'medium' && !issue.resolved).length,
    lowIssues: data.issues.filter(issue => issue.severity === 'low' && !issue.resolved).length,
    resolvedIssues: data.issues.filter(issue => issue.resolved).length,
    quickFixAvailable: data.issues.filter(issue => issue.quickFix?.available && !issue.resolved).length
  };

  return {
    ...data,
    healthStats,
    refreshSystemHealth,
    resolveIssue,
    applyQuickFix,
    isHealthy: data.metrics.overall === 'healthy',
    hasWarnings: data.metrics.overall === 'warning',
    hasCriticalIssues: data.metrics.overall === 'critical',
    isInMaintenance: data.metrics.overall === 'maintenance'
  };
};

export default useSystemHealth;