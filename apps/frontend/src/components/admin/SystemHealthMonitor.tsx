'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  BellIcon,
  WrenchScrewdriverIcon,
  EyeIcon,
  ChartBarIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

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

export interface SystemHealthMonitorProps {
  issues: SystemHealthIssue[];
  metrics: SystemHealthMetrics;
  onRefresh?: () => Promise<void>;
  onResolveIssue?: (issueId: string) => Promise<void>;
  onQuickFix?: (issueId: string) => Promise<void>;
  autoRefresh?: boolean;
  refreshInterval?: number;
  className?: string;
}

const severityConfig = {
  low: {
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    icon: CheckCircleIcon,
    label: 'ต่ำ'
  },
  medium: {
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    icon: ExclamationTriangleIcon,
    label: 'ปานกลาง'
  },
  high: {
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    icon: ExclamationTriangleIcon,
    label: 'สูง'
  },
  critical: {
    color: 'text-red-600 bg-red-50 border-red-200',
    icon: XCircleIcon,
    label: 'วิกฤต'
  }
};

const healthStatusConfig = {
  healthy: {
    color: 'text-green-600 bg-green-50 border-green-200',
    icon: CheckCircleIcon,
    label: 'ปกติ'
  },
  warning: {
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    icon: ExclamationTriangleIcon,
    label: 'เตือน'
  },
  critical: {
    color: 'text-red-600 bg-red-50 border-red-200',
    icon: XCircleIcon,
    label: 'วิกฤต'
  },
  maintenance: {
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    icon: WrenchScrewdriverIcon,
    label: 'บำรุงรักษา'
  }
};

const IssueCard: React.FC<{
  issue: SystemHealthIssue;
  onResolve?: (issueId: string) => Promise<void>;
  onQuickFix?: (issueId: string) => Promise<void>;
}> = ({ issue, onResolve, onQuickFix }) => {
  const [isResolving, setIsResolving] = useState(false);
  const [isApplyingFix, setIsApplyingFix] = useState(false);
  
  const severityInfo = severityConfig[issue.severity];
  const SeverityIcon = severityInfo.icon;

  const handleResolve = async () => {
    if (!onResolve) return;
    
    setIsResolving(true);
    try {
      await onResolve(issue.id);
    } catch (error) {
      console.error('Failed to resolve issue:', error);
    } finally {
      setIsResolving(false);
    }
  };

  const handleQuickFix = async () => {
    if (!onQuickFix || !issue.quickFix) return;
    
    setIsApplyingFix(true);
    try {
      await onQuickFix(issue.id);
    } catch (error) {
      console.error('Failed to apply quick fix:', error);
    } finally {
      setIsApplyingFix(false);
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${severityInfo.color} ${issue.resolved ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <SeverityIcon className="w-5 h-5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-sm">{issue.title}</h4>
            <p className="text-xs opacity-75 mt-1">{issue.description}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <span className="px-2 py-1 rounded-full bg-current bg-opacity-20">
            {severityInfo.label}
          </span>
          {issue.count > 1 && (
            <span className="px-2 py-1 rounded-full bg-current bg-opacity-20">
              {issue.count} รายการ
            </span>
          )}
        </div>
      </div>

      {/* Affected Items */}
      {issue.affectedItems.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium mb-1">รายการที่ได้รับผลกระทบ:</p>
          <div className="flex flex-wrap gap-1">
            {issue.affectedItems.slice(0, 3).map((item, index) => (
              <span key={index} className="text-xs px-2 py-1 rounded bg-current bg-opacity-10">
                {item}
              </span>
            ))}
            {issue.affectedItems.length > 3 && (
              <span className="text-xs px-2 py-1 rounded bg-current bg-opacity-10">
                +{issue.affectedItems.length - 3} อื่นๆ
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center text-xs opacity-75">
          <ClockIcon className="w-3 h-3 mr-1" />
          <span>ตรวจพบ: {issue.lastDetected.toLocaleString('th-TH')}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {issue.quickFix?.available && !issue.resolved && (
            <button
              onClick={handleQuickFix}
              disabled={isApplyingFix}
              className="text-xs px-3 py-1 rounded bg-current bg-opacity-20 hover:bg-opacity-30 transition-colors disabled:opacity-50"
            >
              {isApplyingFix ? 'กำลังแก้ไข...' : issue.quickFix.action}
            </button>
          )}
          
          {issue.detailsUrl && (
            <a
              href={issue.detailsUrl}
              className="text-xs px-3 py-1 rounded bg-current bg-opacity-20 hover:bg-opacity-30 transition-colors"
            >
              ดูรายละเอียด
            </a>
          )}
          
          {!issue.resolved && (
            <button
              onClick={handleResolve}
              disabled={isResolving}
              className="text-xs px-3 py-1 rounded bg-current bg-opacity-20 hover:bg-opacity-30 transition-colors disabled:opacity-50"
            >
              {isResolving ? 'กำลังแก้ไข...' : 'แก้ไขแล้ว'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const MetricsCard: React.FC<{
  title: string;
  value: string | number;
  unit?: string;
  status: 'good' | 'warning' | 'critical';
  icon: React.ComponentType<{ className?: string }>;
}> = ({ title, value, unit, status, icon: Icon }) => {
  const statusColors = {
    good: 'text-green-600 bg-green-50 border-green-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    critical: 'text-red-600 bg-red-50 border-red-200'
  };

  return (
    <div className={`border rounded-lg p-3 ${statusColors[status]}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium">{title}</span>
      </div>
      <div className="text-lg font-bold">
        {typeof value === 'number' ? value.toLocaleString('th-TH') : value}
        {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
      </div>
    </div>
  );
};

export const SystemHealthMonitor: React.FC<SystemHealthMonitorProps> = ({
  issues,
  metrics,
  onRefresh,
  onResolveIssue,
  onQuickFix,
  autoRefresh = true,
  refreshInterval = 30000,
  className = ''
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh || !onRefresh) return;

    const interval = setInterval(async () => {
      try {
        await onRefresh();
        setLastRefresh(new Date());
      } catch (error) {
        console.error('Auto-refresh failed:', error);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, onRefresh]);

  const handleManualRefresh = useCallback(async () => {
    if (!onRefresh) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Manual refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  // Filter issues by severity
  const criticalIssues = issues.filter(issue => issue.severity === 'critical' && !issue.resolved);
  const highIssues = issues.filter(issue => issue.severity === 'high' && !issue.resolved);
  const mediumIssues = issues.filter(issue => issue.severity === 'medium' && !issue.resolved);
  const lowIssues = issues.filter(issue => issue.severity === 'low' && !issue.resolved);

  const healthInfo = healthStatusConfig[metrics.overall];
  const HealthIcon = healthInfo.icon;

  // Calculate system metrics status
  const getMetricStatus = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value >= thresholds.critical) return 'critical';
    if (value >= thresholds.warning) return 'warning';
    return 'good';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overall Health Status */}
      <div className={`border rounded-lg p-4 ${healthInfo.color}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <HealthIcon className="w-6 h-6" />
            <div>
              <h3 className="font-semibold">สถานะระบบโดยรวม</h3>
              <p className="text-sm opacity-75">{healthInfo.label}</p>
            </div>
          </div>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1 text-sm px-3 py-1 rounded bg-current bg-opacity-20 hover:bg-opacity-30 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'กำลังรีเฟรช...' : 'รีเฟรช'}</span>
          </button>
        </div>

        {/* System Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricsCard
            title="เวลาตอบสนอง"
            value={metrics.responseTime}
            unit="ms"
            status={getMetricStatus(metrics.responseTime, { warning: 500, critical: 1000 })}
            icon={ChartBarIcon}
          />
          <MetricsCard
            title="ผู้ใช้ออนไลน์"
            value={metrics.activeUsers}
            status="good"
            icon={EyeIcon}
          />
          <MetricsCard
            title="อัตราข้อผิดพลาด"
            value={`${(metrics.errorRate * 100).toFixed(1)}`}
            unit="%"
            status={getMetricStatus(metrics.errorRate * 100, { warning: 1, critical: 5 })}
            icon={ExclamationTriangleIcon}
          />
          <MetricsCard
            title="ระยะเวลาทำงาน"
            value={`${(metrics.uptime / 24).toFixed(1)}`}
            unit="วัน"
            status="good"
            icon={ShieldCheckIcon}
          />
        </div>

        <div className="mt-4 flex items-center justify-between text-xs opacity-75">
          <span>ตรวจสอบล่าสุด: {metrics.lastCheck.toLocaleString('th-TH')}</span>
          <span>รีเฟรชอัตโนมัติ: {autoRefresh ? 'เปิด' : 'ปิด'}</span>
        </div>
      </div>

      {/* Critical Issues Alert */}
      {criticalIssues.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <BellIcon className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-800">
              ปัญหาวิกฤตที่ต้องแก้ไขด่วน ({criticalIssues.length} รายการ)
            </h3>
          </div>
          <div className="space-y-3">
            {criticalIssues.map(issue => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onResolve={onResolveIssue}
                onQuickFix={onQuickFix}
              />
            ))}
          </div>
        </div>
      )}

      {/* Issues by Severity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High Priority Issues */}
        {highIssues.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              ปัญหาความสำคัญสูง ({highIssues.length} รายการ)
            </h3>
            <div className="space-y-3">
              {highIssues.map(issue => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  onResolve={onResolveIssue}
                  onQuickFix={onQuickFix}
                />
              ))}
            </div>
          </div>
        )}

        {/* Medium Priority Issues */}
        {mediumIssues.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              ปัญหาความสำคัญปานกลาง ({mediumIssues.length} รายการ)
            </h3>
            <div className="space-y-3">
              {mediumIssues.map(issue => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  onResolve={onResolveIssue}
                  onQuickFix={onQuickFix}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Low Priority Issues (Collapsible) */}
      {lowIssues.length > 0 && (
        <details className="border rounded-lg">
          <summary className="p-4 cursor-pointer hover:bg-gray-50 transition-colors">
            <span className="font-semibold text-gray-900">
              ปัญหาความสำคัญต่ำ ({lowIssues.length} รายการ)
            </span>
          </summary>
          <div className="p-4 pt-0 space-y-3">
            {lowIssues.map(issue => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onResolve={onResolveIssue}
                onQuickFix={onQuickFix}
              />
            ))}
          </div>
        </details>
      )}

      {/* No Issues */}
      {issues.filter(issue => !issue.resolved).length === 0 && (
        <div className="text-center py-8">
          <CheckCircleIcon className="w-12 h-12 mx-auto text-green-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            ระบบทำงานปกติ
          </h3>
          <p className="text-gray-600">
            ไม่พบปัญหาที่ต้องแก้ไขในขณะนี้
          </p>
        </div>
      )}
    </div>
  );
};

export default SystemHealthMonitor;