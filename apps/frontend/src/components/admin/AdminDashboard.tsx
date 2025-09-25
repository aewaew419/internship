'use client';

import React, { useState, useMemo } from 'react';
import { 
  ChartBarIcon,
  UserGroupIcon,
  CalendarDaysIcon,
  UserIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  Cog6ToothIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { DashboardWidget, QuickActionWidget, SystemHealthWidget } from './DashboardWidget';

interface DashboardStats {
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

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  badge?: number;
}

interface RecentActivity {
  id: string;
  type: 'role_change' | 'calendar_update' | 'prefix_assignment' | 'system_config';
  title: string;
  description: string;
  timestamp: string;
  user: string;
  severity: 'info' | 'warning' | 'error';
}

interface AdminDashboardProps {
  stats: DashboardStats;
  recentActivities: RecentActivity[];
  onQuickAction?: (actionId: string) => void;
}

const StatCard: React.FC<{
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  onClick?: () => void;
}> = ({ title, value, subtitle, icon: Icon, color, trend, trendValue, onClick }) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <ArrowTrendingUpIcon className="w-4 h-4 text-green-500" />;
      case 'down': return <ArrowTrendingDownIcon className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  return (
    <div 
      className={`${color} rounded-lg p-6 cursor-pointer transition-all hover:shadow-md ${
        onClick ? 'hover:scale-105' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-8 h-8" />
        {trend && (
          <div className="flex items-center space-x-1">
            {getTrendIcon()}
            <span className={`text-sm font-medium ${
              trend === 'up' ? 'text-green-600' : 
              trend === 'down' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {trendValue}
            </span>
          </div>
        )}
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm font-medium mb-1">{title}</div>
      {subtitle && <div className="text-xs opacity-75">{subtitle}</div>}
    </div>
  );
};

const QuickActionCard: React.FC<{
  action: QuickAction;
  onClick?: () => void;
}> = ({ action, onClick }) => {
  const Icon = action.icon;

  return (
    <Link href={action.href} className="block">
      <div 
        className={`${action.color} rounded-lg p-4 transition-all hover:shadow-md hover:scale-105 cursor-pointer`}
        onClick={onClick}
      >
        <div className="flex items-center justify-between mb-3">
          <Icon className="w-6 h-6" />
          {action.badge && action.badge > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              {action.badge}
            </span>
          )}
        </div>
        <h3 className="font-semibold mb-1">{action.title}</h3>
        <p className="text-sm opacity-75">{action.description}</p>
      </div>
    </Link>
  );
};

const ActivityItem: React.FC<{
  activity: RecentActivity;
}> = ({ activity }) => {
  const getActivityIcon = () => {
    switch (activity.type) {
      case 'role_change': return <UserGroupIcon className="w-4 h-4" />;
      case 'calendar_update': return <CalendarDaysIcon className="w-4 h-4" />;
      case 'prefix_assignment': return <UserIcon className="w-4 h-4" />;
      case 'system_config': return <Cog6ToothIcon className="w-4 h-4" />;
    }
  };

  const getSeverityColor = () => {
    switch (activity.severity) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
      <div className={`p-2 rounded-full ${getSeverityColor()}`}>
        {getActivityIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h4 className="font-medium text-gray-900 truncate">{activity.title}</h4>
          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
            {new Date(activity.timestamp).toLocaleString('th-TH')}
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-1">{activity.description}</p>
        <p className="text-xs text-gray-500">โดย {activity.user}</p>
      </div>
    </div>
  );
};

const SystemHealthIndicator: React.FC<{
  health: 'good' | 'warning' | 'critical';
  issues: Array<{ type: string; count: number; message: string }>;
}> = ({ health, issues }) => {
  const getHealthColor = () => {
    switch (health) {
      case 'good': return 'bg-green-50 border-green-200 text-green-800';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'critical': return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  const getHealthIcon = () => {
    switch (health) {
      case 'good': return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'warning': return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600" />;
      case 'critical': return <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />;
    }
  };

  const getHealthLabel = () => {
    switch (health) {
      case 'good': return 'ระบบทำงานปกติ';
      case 'warning': return 'ต้องการความสนใจ';
      case 'critical': return 'ต้องแก้ไขด่วน';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getHealthColor()}`}>
      <div className="flex items-center space-x-2 mb-3">
        {getHealthIcon()}
        <span className="font-medium">สถานะระบบ: {getHealthLabel()}</span>
      </div>
      
      {issues.length > 0 && (
        <div className="space-y-2">
          {issues.map((issue, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <span>{issue.message}</span>
              <span className="font-medium">{issue.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  recentActivities,
  onQuickAction
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('week');

  const quickActions: QuickAction[] = [
    {
      id: 'manage_roles',
      title: 'จัดการบทบาท',
      description: 'เพิ่ม แก้ไข หรือลบบทบาทผู้ใช้',
      icon: UserGroupIcon,
      href: '/admin/roles',
      color: 'bg-blue-50 border border-blue-200 text-blue-800',
      badge: stats.roles.withConflicts
    },
    {
      id: 'manage_calendar',
      title: 'จัดการปฏิทิน',
      description: 'ตั้งค่าภาคการศึกษาและวันหยุด',
      icon: CalendarDaysIcon,
      href: '/admin/calendar',
      color: 'bg-green-50 border border-green-200 text-green-800',
      badge: stats.calendar.conflictingDates
    },
    {
      id: 'manage_prefixes',
      title: 'จัดการคำนำหน้าชื่อ',
      description: 'กำหนดคำนำหน้าชื่อและบทบาท',
      icon: UserIcon,
      href: '/admin/prefixes',
      color: 'bg-purple-50 border border-purple-200 text-purple-800',
      badge: stats.prefixes.conflicts
    },
    {
      id: 'system_settings',
      title: 'ตั้งค่าระบบ',
      description: 'กำหนดค่าระบบและความปลอดภัย',
      icon: Cog6ToothIcon,
      href: '/admin/settings',
      color: 'bg-gray-50 border border-gray-200 text-gray-800',
      badge: stats.system.pendingActions
    }
  ];

  const systemIssues = useMemo(() => {
    const issues = [];
    
    if (stats.roles.withConflicts > 0) {
      issues.push({
        type: 'role_conflicts',
        count: stats.roles.withConflicts,
        message: 'ข้อขัดแย้งในบทบาท'
      });
    }
    
    if (stats.calendar.conflictingDates > 0) {
      issues.push({
        type: 'calendar_conflicts',
        count: stats.calendar.conflictingDates,
        message: 'ข้อขัดแย้งในปฏิทิน'
      });
    }
    
    if (stats.prefixes.conflicts > 0) {
      issues.push({
        type: 'prefix_conflicts',
        count: stats.prefixes.conflicts,
        message: 'ข้อขัดแย้งในคำนำหน้าชื่อ'
      });
    }

    return issues;
  }, [stats]);

  const filteredActivities = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    
    switch (selectedPeriod) {
      case 'today':
        cutoff.setHours(0, 0, 0, 0);
        break;
      case 'week':
        cutoff.setDate(now.getDate() - 7);
        break;
      case 'month':
        cutoff.setMonth(now.getMonth() - 1);
        break;
    }
    
    return recentActivities.filter(activity => 
      new Date(activity.timestamp) >= cutoff
    );
  }, [recentActivities, selectedPeriod]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">แดชบอร์ดผู้ดูแลระบบ</h1>
          <p className="text-gray-600 mt-1">
            ภาพรวมและการจัดการระบบทั้งหมด
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-500">อัปเดตล่าสุด:</span>
          <span className="text-sm font-medium text-gray-900">
            {new Date(stats.system.lastUpdated).toLocaleString('th-TH')}
          </span>
        </div>
      </div>

      {/* System Health */}
      <SystemHealthWidget
        health={stats.system.systemHealth}
        issues={systemIssues}
        lastCheck={new Date(stats.system.lastUpdated)}
        onRefresh={() => window.location.reload()}
      />

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardWidget
          title="บทบาททั้งหมด"
          value={stats.roles.total}
          subtitle={`${stats.roles.active} ใช้งาน`}
          icon={UserGroupIcon}
          color="blue"
          trend={{
            direction: stats.roles.withConflicts > 0 ? 'down' : 'stable',
            value: stats.roles.withConflicts > 0 ? `${stats.roles.withConflicts} ข้อขัดแย้ง` : 'ปกติ',
            isPositive: stats.roles.withConflicts === 0
          }}
          status={stats.roles.withConflicts > 0 ? 'error' : 'normal'}
          onClick={() => onQuickAction?.('manage_roles')}
        />
        
        <DashboardWidget
          title="กิจกรรมปฏิทิน"
          value={stats.calendar.totalEvents}
          subtitle={`${stats.calendar.activeSemesters} ภาคการศึกษา`}
          icon={CalendarDaysIcon}
          color="green"
          trend={{
            direction: stats.calendar.conflictingDates > 0 ? 'down' : 'up',
            value: stats.calendar.upcomingHolidays > 0 ? `${stats.calendar.upcomingHolidays} วันหยุดใกล้เข้า` : 'ปกติ',
            isPositive: stats.calendar.conflictingDates === 0
          }}
          status={stats.calendar.conflictingDates > 0 ? 'warning' : 'normal'}
          onClick={() => onQuickAction?.('manage_calendar')}
        />
        
        <DashboardWidget
          title="คำนำหน้าชื่อ"
          value={stats.prefixes.total}
          subtitle={`${stats.prefixes.assigned} กำหนดแล้ว`}
          icon={UserIcon}
          color="purple"
          trend={{
            direction: stats.prefixes.conflicts > 0 ? 'down' : 'stable',
            value: `${stats.prefixes.defaults} ค่าเริ่มต้น`,
            isPositive: stats.prefixes.conflicts === 0
          }}
          status={stats.prefixes.conflicts > 0 ? 'warning' : 'normal'}
          onClick={() => onQuickAction?.('manage_prefixes')}
        />
        
        <DashboardWidget
          title="ผู้ใช้ออนไลน์"
          value={stats.system.activeUsers}
          subtitle="ขณะนี้"
          icon={EyeIcon}
          color="yellow"
          trend={{
            direction: 'stable',
            value: 'ปกติ',
            isPositive: true
          }}
          status="normal"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">การดำเนินการด่วน</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <QuickActionWidget
              key={action.id}
              title={action.title}
              description={action.description}
              icon={action.icon}
              color={action.color.includes('blue') ? 'blue' : 
                     action.color.includes('green') ? 'green' :
                     action.color.includes('purple') ? 'purple' : 'gray'}
              href={action.href}
              badge={action.badge}
              onClick={() => onQuickAction?.(action.id)}
            />
          ))}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">กิจกรรมล่าสุด</h2>
            <div className="flex items-center space-x-2">
              {(['today', 'week', 'month'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    selectedPeriod === period
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {period === 'today' ? 'วันนี้' : period === 'week' ? 'สัปดาห์' : 'เดือน'}
                </button>
              ))}
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg">
            {filteredActivities.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {filteredActivities.slice(0, 10).map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <ClockIcon className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ไม่มีกิจกรรมในช่วงเวลานี้
                </h3>
                <p className="text-gray-600">
                  ลองเปลี่ยนช่วงเวลาหรือตรวจสอบในภายหลัง
                </p>
              </div>
            )}
          </div>
        </div>

        {/* System Summary */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">สรุประบบ</h2>
          <div className="space-y-4">
            {/* Role Summary */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <UserGroupIcon className="w-5 h-5 mr-2" />
                บทบาทและสิทธิ์
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">บทบาททั้งหมด:</span>
                  <span className="font-medium">{stats.roles.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ใช้งานอยู่:</span>
                  <span className="font-medium text-green-600">{stats.roles.active}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">บทบาทระบบ:</span>
                  <span className="font-medium text-blue-600">{stats.roles.systemRoles}</span>
                </div>
                {stats.roles.withConflicts > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">มีข้อขัดแย้ง:</span>
                    <span className="font-medium text-red-600">{stats.roles.withConflicts}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Calendar Summary */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <CalendarDaysIcon className="w-5 h-5 mr-2" />
                ปฏิทินการศึกษา
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">ภาคการศึกษาที่เปิด:</span>
                  <span className="font-medium text-green-600">{stats.calendar.activeSemesters}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">วันหยุดที่จะมาถึง:</span>
                  <span className="font-medium text-blue-600">{stats.calendar.upcomingHolidays}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">กิจกรรมทั้งหมด:</span>
                  <span className="font-medium">{stats.calendar.totalEvents}</span>
                </div>
                {stats.calendar.conflictingDates > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">วันที่ขัดแย้ง:</span>
                    <span className="font-medium text-red-600">{stats.calendar.conflictingDates}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Prefix Summary */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <UserIcon className="w-5 h-5 mr-2" />
                คำนำหน้าชื่อ
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">คำนำหน้าชื่อทั้งหมด:</span>
                  <span className="font-medium">{stats.prefixes.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">กำหนดแล้ว:</span>
                  <span className="font-medium text-green-600">{stats.prefixes.assigned}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ค่าเริ่มต้น:</span>
                  <span className="font-medium text-blue-600">{stats.prefixes.defaults}</span>
                </div>
                {stats.prefixes.conflicts > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">ข้อขัดแย้ง:</span>
                    <span className="font-medium text-red-600">{stats.prefixes.conflicts}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <DocumentTextIcon className="w-5 h-5 mr-2" />
                ลิงก์ด่วน
              </h3>
              <div className="space-y-2">
                <Link href="/admin/reports" className="block text-sm text-blue-600 hover:text-blue-700">
                  → รายงานระบบ
                </Link>
                <Link href="/admin/audit" className="block text-sm text-blue-600 hover:text-blue-700">
                  → ประวัติการใช้งาน
                </Link>
                <Link href="/admin/backup" className="block text-sm text-blue-600 hover:text-blue-700">
                  → สำรองข้อมูล
                </Link>
                <Link href="/admin/help" className="block text-sm text-blue-600 hover:text-blue-700">
                  → คู่มือการใช้งาน
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;