'use client';

import { useState, useEffect, useCallback } from 'react';

export interface DashboardStats {
  roles: {
    total: number;
    active: number;
    withConflicts: number;
    systemRoles: number;
  };
  calendar: {
    activeSemesters: number;
    upcomingHolidays: number;
    conflictingDates: number;
    totalEvents: number;
  };
  prefixes: {
    total: number;
    assigned: number;
    defaults: number;
    conflicts: number;
  };
  system: {
    lastUpdated: string;
    activeUsers: number;
    pendingActions: number;
    systemHealth: 'good' | 'warning' | 'critical';
  };
}

export interface RecentActivity {
  id: string;
  type: 'role_change' | 'calendar_update' | 'prefix_assignment' | 'system_config';
  title: string;
  description: string;
  timestamp: string;
  user: string;
  severity: 'info' | 'warning' | 'error';
}

export interface SystemHealthIssue {
  type: string;
  count: number;
  message: string;
  severity: 'warning' | 'error';
  actionRequired: boolean;
}

export interface DashboardData {
  stats: DashboardStats;
  recentActivities: RecentActivity[];
  systemIssues: SystemHealthIssue[];
  isLoading: boolean;
  error: string | null;
  lastRefresh: Date | null;
}

export interface UseAdminDashboardOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  maxActivities?: number;
}

export const useAdminDashboard = (options: UseAdminDashboardOptions = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    maxActivities = 10
  } = options;

  const [data, setData] = useState<DashboardData>({
    stats: {
      roles: { total: 0, active: 0, withConflicts: 0, systemRoles: 0 },
      calendar: { activeSemesters: 0, upcomingHolidays: 0, conflictingDates: 0, totalEvents: 0 },
      prefixes: { total: 0, assigned: 0, defaults: 0, conflicts: 0 },
      system: { 
        lastUpdated: new Date().toISOString(), 
        activeUsers: 0, 
        pendingActions: 0, 
        systemHealth: 'good' 
      }
    },
    recentActivities: [],
    systemIssues: [],
    isLoading: true,
    error: null,
    lastRefresh: null
  });

  // Fetch dashboard statistics
  const fetchDashboardStats = useCallback(async (): Promise<DashboardStats> => {
    try {
      // In a real implementation, this would be an API call
      // const response = await fetch('/api/admin/dashboard/stats');
      // return await response.json();

      // Mock data for demonstration
      const mockStats: DashboardStats = {
        roles: {
          total: 12,
          active: 10,
          withConflicts: Math.floor(Math.random() * 3),
          systemRoles: 4
        },
        calendar: {
          activeSemesters: 2,
          upcomingHolidays: 3,
          conflictingDates: Math.floor(Math.random() * 2),
          totalEvents: 15
        },
        prefixes: {
          total: 24,
          assigned: 20,
          defaults: 8,
          conflicts: Math.floor(Math.random() * 2)
        },
        system: {
          lastUpdated: new Date().toISOString(),
          activeUsers: Math.floor(Math.random() * 20) + 40,
          pendingActions: Math.floor(Math.random() * 5),
          systemHealth: Math.random() > 0.7 ? 'warning' : 'good'
        }
      };

      return mockStats;
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      throw error;
    }
  }, []);

  // Fetch recent activities
  const fetchRecentActivities = useCallback(async (): Promise<RecentActivity[]> => {
    try {
      // In a real implementation, this would be an API call
      // const response = await fetch(`/api/admin/dashboard/activities?limit=${maxActivities}`);
      // return await response.json();

      // Mock data for demonstration
      const mockActivities: RecentActivity[] = [
        {
          id: '1',
          type: 'role_change',
          title: 'อัปเดตสิทธิ์บทบาท "อาจารย์นิเทศ"',
          description: 'เพิ่มสิทธิ์การเข้าถึงรายงานการประเมิน',
          timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          user: 'ผู้ดูแลระบบ',
          severity: 'info'
        },
        {
          id: '2',
          type: 'calendar_update',
          title: 'เพิ่มภาคการศึกษาใหม่',
          description: 'เพิ่มภาคการศึกษา 2/2567 พร้อมกำหนดการสำคัญ',
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          user: 'ผู้จัดการปฏิทิน',
          severity: 'info'
        },
        {
          id: '3',
          type: 'prefix_assignment',
          title: 'แก้ไขคำนำหน้าชื่อ',
          description: 'อัปเดตการกำหนดคำนำหน้าชื่อสำหรับบทบาทนักศึกษา',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          user: 'ผู้ดูแลระบบ',
          severity: 'warning'
        },
        {
          id: '4',
          type: 'system_config',
          title: 'ตรวจพบข้อขัดแย้งในระบบ',
          description: 'พบข้อขัดแย้งในการกำหนดสิทธิ์ระหว่างบทบาท',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          user: 'ระบบ',
          severity: 'error'
        },
        {
          id: '5',
          type: 'role_change',
          title: 'สร้างบทบาทใหม่',
          description: 'สร้างบทบาท "ผู้ประสานงานสหกิจ" พร้อมสิทธิ์เบื้องต้น',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          user: 'ผู้ดูแลระบบ',
          severity: 'info'
        }
      ];

      return mockActivities.slice(0, maxActivities);
    } catch (error) {
      console.error('Failed to fetch recent activities:', error);
      throw error;
    }
  }, [maxActivities]);

  // Generate system health issues based on stats
  const generateSystemIssues = useCallback((stats: DashboardStats): SystemHealthIssue[] => {
    const issues: SystemHealthIssue[] = [];

    if (stats.roles.withConflicts > 0) {
      issues.push({
        type: 'role_conflicts',
        count: stats.roles.withConflicts,
        message: 'ข้อขัดแย้งในบทบาท',
        severity: 'error',
        actionRequired: true
      });
    }

    if (stats.calendar.conflictingDates > 0) {
      issues.push({
        type: 'calendar_conflicts',
        count: stats.calendar.conflictingDates,
        message: 'ข้อขัดแย้งในปฏิทิน',
        severity: 'warning',
        actionRequired: true
      });
    }

    if (stats.prefixes.conflicts > 0) {
      issues.push({
        type: 'prefix_conflicts',
        count: stats.prefixes.conflicts,
        message: 'ข้อขัดแย้งในคำนำหน้าชื่อ',
        severity: 'warning',
        actionRequired: true
      });
    }

    if (stats.system.pendingActions > 3) {
      issues.push({
        type: 'pending_actions',
        count: stats.system.pendingActions,
        message: 'การดำเนินการที่รอการอนุมัติ',
        severity: 'warning',
        actionRequired: false
      });
    }

    return issues;
  }, []);

  // Load all dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }));

      const [stats, activities] = await Promise.all([
        fetchDashboardStats(),
        fetchRecentActivities()
      ]);

      const systemIssues = generateSystemIssues(stats);

      setData({
        stats,
        recentActivities: activities,
        systemIssues,
        isLoading: false,
        error: null,
        lastRefresh: new Date()
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load dashboard data'
      }));
    }
  }, [fetchDashboardStats, fetchRecentActivities, generateSystemIssues]);

  // Refresh dashboard data
  const refreshDashboard = useCallback(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Initial data load
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadDashboardData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadDashboardData]);

  // Quick action handlers
  const handleQuickAction = useCallback((actionId: string) => {
    // This would typically trigger navigation or modal opening
    console.log('Quick action triggered:', actionId);
    
    // You could also track analytics here
    // analytics.track('admin_quick_action', { actionId });
  }, []);

  // System health calculation
  const getSystemHealth = useCallback((): 'good' | 'warning' | 'critical' => {
    const { systemIssues } = data;
    
    if (systemIssues.some(issue => issue.severity === 'error')) {
      return 'critical';
    }
    
    if (systemIssues.some(issue => issue.severity === 'warning')) {
      return 'warning';
    }
    
    return 'good';
  }, [data.systemIssues]);

  return {
    ...data,
    systemHealth: getSystemHealth(),
    refreshDashboard,
    handleQuickAction,
    isHealthy: getSystemHealth() === 'good',
    hasWarnings: getSystemHealth() === 'warning',
    hasCriticalIssues: getSystemHealth() === 'critical'
  };
};

export default useAdminDashboard;