'use client';

import React, { useState, useMemo } from 'react';
import { useEngagementAnalytics, useUserEngagementProfile } from '../../../hooks/useNotificationEngagement';
import { NotificationType, NotificationCategory } from '../../../types/notifications';
import { EngagementAnalytics as EngagementAnalyticsType } from '../../../lib/notifications/engagement-tracking';

interface EngagementAnalyticsProps {
  userId?: number;
  timeRange?: { start: number; end: number };
  className?: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  format?: 'percentage' | 'number' | 'time';
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  format = 'number',
  className = '' 
}) => {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'percentage':
        return `${(val * 100).toFixed(1)}%`;
      case 'time':
        return `${Math.round(val / 1000)}s`;
      default:
        return val.toLocaleString();
    }
  };

  const formatChange = (changeVal: number) => {
    const sign = changeVal > 0 ? '+' : '';
    return `${sign}${(changeVal * 100).toFixed(1)}%`;
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <div className="flex items-baseline justify-between">
        <p className="text-2xl font-semibold text-gray-900">
          {formatValue(value)}
        </p>
        {change !== undefined && (
          <span className={`text-sm font-medium ${
            change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500'
          }`}>
            {formatChange(change)}
          </span>
        )}
      </div>
    </div>
  );
};

interface TypeMetricsTableProps {
  metrics: Record<NotificationType, any>;
  title: string;
}

const TypeMetricsTable: React.FC<TypeMetricsTableProps> = ({ metrics, title }) => {
  const sortedMetrics = useMemo(() => {
    return Object.entries(metrics)
      .sort(([, a], [, b]) => b.engagementScore - a.engagementScore);
  }, [metrics]);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Open Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Click Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Engagement Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avg. Time to Open
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedMetrics.map(([type, metric]) => (
              <tr key={type} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {(metric.openRate * 100).toFixed(1)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {(metric.clickThroughRate * 100).toFixed(1)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${metric.engagementScore}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500">{metric.engagementScore}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {Math.round(metric.averageTimeToOpen / 1000)}s
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface HeatmapProps {
  data: Record<number, any>;
  title: string;
  type: 'hourly' | 'daily';
}

const Heatmap: React.FC<HeatmapProps> = ({ data, title, type }) => {
  const maxValue = Math.max(...Object.values(data).map((d: any) => d.engagementScore || 0));
  
  const getLabel = (key: number) => {
    if (type === 'hourly') {
      return `${key}:00`;
    } else {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days[key] || key.toString();
    }
  };

  const getIntensity = (value: number) => {
    return Math.round((value / maxValue) * 100);
  };

  const range = type === 'hourly' ? 24 : 7;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className={`grid gap-1 ${type === 'hourly' ? 'grid-cols-12' : 'grid-cols-7'}`}>
        {Array.from({ length: range }, (_, i) => {
          const value = data[i]?.engagementScore || 0;
          const intensity = getIntensity(value);
          
          return (
            <div
              key={i}
              className="aspect-square rounded flex items-center justify-center text-xs font-medium relative group"
              style={{
                backgroundColor: `rgba(59, 130, 246, ${intensity / 100})`,
                color: intensity > 50 ? 'white' : 'black'
              }}
              title={`${getLabel(i)}: ${value.toFixed(1)} engagement score`}
            >
              {type === 'daily' ? getLabel(i) : i}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {getLabel(i)}: {value.toFixed(1)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
        <span>Less engaged</span>
        <div className="flex space-x-1">
          {[0, 25, 50, 75, 100].map(intensity => (
            <div
              key={intensity}
              className="w-3 h-3 rounded"
              style={{ backgroundColor: `rgba(59, 130, 246, ${intensity / 100})` }}
            />
          ))}
        </div>
        <span>More engaged</span>
      </div>
    </div>
  );
};

export const EngagementAnalytics: React.FC<EngagementAnalyticsProps> = ({
  userId,
  timeRange,
  className = ''
}) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'types' | 'timing' | 'users'>('overview');
  
  const { analytics, loading, error, refresh } = useEngagementAnalytics(timeRange);
  const { profile: userProfile } = useUserEngagementProfile(userId || 0);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-24" />
          ))}
        </div>
        <div className="bg-gray-200 rounded-lg h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Analytics</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={refresh}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 ${className}`}>
        <p className="text-gray-600">No analytics data available</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'types', label: 'By Type' },
    { id: 'timing', label: 'Timing' },
    ...(userId ? [{ id: 'users', label: 'User Profile' }] : [])
  ];

  return (
    <div className={className}>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <MetricCard
              title="Total Notifications"
              value={analytics.overall.totalNotifications}
              format="number"
            />
            <MetricCard
              title="Delivery Rate"
              value={analytics.overall.deliveryRate}
              format="percentage"
            />
            <MetricCard
              title="Open Rate"
              value={analytics.overall.openRate}
              format="percentage"
            />
            <MetricCard
              title="Click-Through Rate"
              value={analytics.overall.clickThroughRate}
              format="percentage"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard
              title="Average Engagement Time"
              value={analytics.overall.averageEngagementTime}
              format="time"
              className="md:col-span-2"
            />
          </div>

          {/* Trends Chart Placeholder */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Engagement Trends</h3>
            <div className="h-64 bg-gray-50 rounded flex items-center justify-center">
              <p className="text-gray-500">Trends chart would be displayed here</p>
            </div>
          </div>
        </div>
      )}

      {/* Types Tab */}
      {selectedTab === 'types' && (
        <div className="space-y-6">
          <TypeMetricsTable
            metrics={analytics.byType}
            title="Engagement by Notification Type"
          />
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Category Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(analytics.byCategory).map(([category, metrics]) => (
                <div key={category} className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {metrics.engagementScore}
                  </div>
                  <div className="text-sm text-gray-500 capitalize">
                    {category.replace(/_/g, ' ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Timing Tab */}
      {selectedTab === 'timing' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Heatmap
              data={analytics.byTimeOfDay}
              title="Engagement by Hour of Day"
              type="hourly"
            />
            <Heatmap
              data={analytics.byDayOfWeek}
              title="Engagement by Day of Week"
              type="daily"
            />
          </div>
        </div>
      )}

      {/* User Profile Tab */}
      {selectedTab === 'users' && userProfile && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Total Notifications"
              value={userProfile.totalNotifications}
              format="number"
            />
            <MetricCard
              title="Open Rate"
              value={userProfile.openRate}
              format="percentage"
            />
            <MetricCard
              title="Click-Through Rate"
              value={userProfile.clickThroughRate}
              format="percentage"
            />
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Preferred Types</h4>
                <div className="space-y-1">
                  {userProfile.preferredTypes.map((type) => (
                    <span
                      key={type}
                      className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2"
                    >
                      {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Optimal Timing</h4>
                <p className="text-sm text-gray-600">
                  Best hour: {userProfile.optimalTiming.hour}:00
                </p>
                <p className="text-sm text-gray-600">
                  Best day: {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][userProfile.optimalTiming.dayOfWeek]}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Engagement Trend</h3>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              userProfile.engagementTrend === 'increasing' 
                ? 'bg-green-100 text-green-800'
                : userProfile.engagementTrend === 'decreasing'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {userProfile.engagementTrend.charAt(0).toUpperCase() + userProfile.engagementTrend.slice(1)}
            </div>
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <div className="flex justify-end mt-6">
        <button
          onClick={refresh}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Refresh Data
        </button>
      </div>
    </div>
  );
};