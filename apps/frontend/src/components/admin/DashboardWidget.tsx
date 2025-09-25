'use client';

import React from 'react';
import { 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export interface DashboardWidgetProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'gray';
  trend?: {
    direction: 'up' | 'down' | 'stable';
    value: string;
    isPositive?: boolean;
  };
  status?: 'normal' | 'warning' | 'error';
  onClick?: () => void;
  loading?: boolean;
  className?: string;
}

const colorClasses = {
  blue: 'bg-blue-50 border-blue-200 text-blue-800',
  green: 'bg-green-50 border-green-200 text-green-800',
  purple: 'bg-purple-50 border-purple-200 text-purple-800',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  red: 'bg-red-50 border-red-200 text-red-800',
  gray: 'bg-gray-50 border-gray-200 text-gray-800'
};

const trendColors = {
  up: 'text-green-600',
  down: 'text-red-600',
  stable: 'text-gray-600'
};

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
  status,
  onClick,
  loading = false,
  className = ''
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    
    switch (trend.direction) {
      case 'up':
        return <ArrowTrendingUpIcon className="w-4 h-4" />;
      case 'down':
        return <ArrowTrendingDownIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'warning':
        return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />;
      case 'normal':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className={`border rounded-lg p-6 animate-pulse ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="w-8 h-8 bg-gray-200 rounded"></div>
          <div className="w-16 h-4 bg-gray-200 rounded"></div>
        </div>
        <div className="w-20 h-8 bg-gray-200 rounded mb-2"></div>
        <div className="w-32 h-4 bg-gray-200 rounded mb-1"></div>
        <div className="w-24 h-3 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div 
      className={`
        border rounded-lg p-6 transition-all duration-200
        ${colorClasses[color]}
        ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-105' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {/* Header with Icon and Status */}
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-8 h-8" />
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          {trend && (
            <div className={`flex items-center space-x-1 ${trendColors[trend.direction]}`}>
              {getTrendIcon()}
              <span className="text-sm font-medium">
                {trend.value}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Value */}
      <div className="text-3xl font-bold mb-1">
        {typeof value === 'number' ? value.toLocaleString('th-TH') : value}
      </div>

      {/* Title */}
      <div className="text-sm font-medium mb-1">{title}</div>

      {/* Subtitle */}
      {subtitle && (
        <div className="text-xs opacity-75">{subtitle}</div>
      )}
    </div>
  );
};

export interface QuickActionWidgetProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'red' | 'gray';
  href?: string;
  onClick?: () => void;
  badge?: number;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export const QuickActionWidget: React.FC<QuickActionWidgetProps> = ({
  title,
  description,
  icon: Icon,
  color,
  href,
  onClick,
  badge,
  disabled = false,
  loading = false,
  className = ''
}) => {
  const handleClick = () => {
    if (disabled || loading) return;
    
    if (href) {
      window.location.href = href;
    } else if (onClick) {
      onClick();
    }
  };

  if (loading) {
    return (
      <div className={`border rounded-lg p-4 animate-pulse ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="w-6 h-6 bg-gray-200 rounded"></div>
          <div className="w-6 h-4 bg-gray-200 rounded-full"></div>
        </div>
        <div className="w-32 h-5 bg-gray-200 rounded mb-2"></div>
        <div className="w-full h-4 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div 
      className={`
        border rounded-lg p-4 transition-all duration-200
        ${colorClasses[color]}
        ${!disabled ? 'cursor-pointer hover:shadow-md hover:scale-105' : 'opacity-50 cursor-not-allowed'}
        ${className}
      `}
      onClick={handleClick}
    >
      {/* Header with Icon and Badge */}
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-6 h-6" />
        {badge && badge > 0 && (
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full min-w-[20px] text-center">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-semibold mb-1 text-sm">{title}</h3>

      {/* Description */}
      <p className="text-xs opacity-75 leading-relaxed">{description}</p>
    </div>
  );
};

export interface SystemHealthWidgetProps {
  health: 'good' | 'warning' | 'critical';
  issues: Array<{
    type: string;
    count: number;
    message: string;
    severity: 'warning' | 'error';
  }>;
  lastCheck?: Date;
  onRefresh?: () => void;
  loading?: boolean;
  className?: string;
}

export const SystemHealthWidget: React.FC<SystemHealthWidgetProps> = ({
  health,
  issues,
  lastCheck,
  onRefresh,
  loading = false,
  className = ''
}) => {
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

  if (loading) {
    return (
      <div className={`border rounded-lg p-4 animate-pulse ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-gray-200 rounded"></div>
            <div className="w-32 h-4 bg-gray-200 rounded"></div>
          </div>
          <div className="w-16 h-4 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="w-24 h-3 bg-gray-200 rounded"></div>
              <div className="w-8 h-3 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-4 ${getHealthColor()} ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getHealthIcon()}
          <span className="font-medium">สถานะระบบ: {getHealthLabel()}</span>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-xs opacity-75 hover:opacity-100 transition-opacity"
          >
            รีเฟรช
          </button>
        )}
      </div>
      
      {/* Issues List */}
      {issues.length > 0 && (
        <div className="space-y-2">
          {issues.map((issue, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-2">
                {issue.severity === 'error' ? (
                  <ExclamationTriangleIcon className="w-3 h-3 text-red-500" />
                ) : (
                  <ExclamationTriangleIcon className="w-3 h-3 text-yellow-500" />
                )}
                <span>{issue.message}</span>
              </div>
              <span className="font-medium">{issue.count}</span>
            </div>
          ))}
        </div>
      )}

      {/* Last Check */}
      {lastCheck && (
        <div className="mt-3 pt-3 border-t border-current border-opacity-20">
          <div className="flex items-center text-xs opacity-75">
            <ClockIcon className="w-3 h-3 mr-1" />
            <span>ตรวจสอบล่าสุด: {lastCheck.toLocaleString('th-TH')}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardWidget;