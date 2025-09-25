/**
 * History Analytics Component
 * Component for displaying audit history analytics and insights
 */

import React, { useState, useMemo } from 'react';
import { HistoryAnalytics as HistoryAnalyticsType, TimeSeriesData } from '../../types/auditHistory';
import { AuditEntityType } from '../../types/audit';
import { useHistoryAnalytics } from '../../hooks/useAuditHistory';

interface HistoryAnalyticsProps {
  entityType: AuditEntityType;
  entityId: string;
  period: { start: string; end: string };
  onPeriodChange?: (period: { start: string; end: string }) => void;
}

export const HistoryAnalytics: React.FC<HistoryAnalyticsProps> = ({
  entityType,
  entityId,
  period,
  onPeriodChange
}) => {
  const { analytics, loading, error, refreshAnalytics } = useHistoryAnalytics(entityType, entityId, period);
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'patterns'>('overview');

  const predefinedPeriods = [
    { label: 'Last 7 days', days: 7 },
    { label: 'Last 30 days', days: 30 },
    { label: 'Last 90 days', days: 90 },
    { label: 'Last year', days: 365 }
  ];

  const handlePeriodSelect = (days: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
    
    onPeriodChange?.({
      start: start.toISOString(),
      end: end.toISOString()
    });
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading analytics</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={refreshAnalytics}
              className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="mt-2 text-sm text-gray-600">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Header */}
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              History Analytics
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {new Date(analytics.period.start).toLocaleDateString()} - {new Date(analytics.period.end).toLocaleDateString()}
            </p>
          </div>
          
          {/* Period Selector */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Period:</label>
            <select
              onChange={(e) => handlePeriodSelect(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Custom</option>
              {predefinedPeriods.map((p) => (
                <option key={p.days} value={p.days}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'trends', label: 'Trends' },
              { id: 'patterns', label: 'Patterns' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <OverviewTab analytics={analytics} />
        )}
        
        {activeTab === 'trends' && (
          <TrendsTab analytics={analytics} />
        )}
        
        {activeTab === 'patterns' && (
          <PatternsTab analytics={analytics} />
        )}
      </div>
    </div>
  );
};

// Overview Tab
interface OverviewTabProps {
  analytics: HistoryAnalyticsType;
}

const OverviewTab: React.FC<OverviewTabProps> = ({ analytics }) => {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Changes"
          value={analytics.metrics.totalChanges}
          icon="📊"
          color="blue"
        />
        <MetricCard
          title="Avg Changes/Day"
          value={analytics.metrics.averageChangesPerDay.toFixed(1)}
          icon="📈"
          color="green"
        />
        <MetricCard
          title="Change Velocity"
          value={`${analytics.metrics.changeVelocity.toFixed(2)}/hr`}
          icon="⚡"
          color="yellow"
        />
        <MetricCard
          title="Stability Score"
          value={`${analytics.metrics.stabilityScore.toFixed(0)}%`}
          icon="🎯"
          color={analytics.metrics.stabilityScore >= 80 ? 'green' : analytics.metrics.stabilityScore >= 60 ? 'yellow' : 'red'}
        />
      </div>

      {/* Activity Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Activity Highlights</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Peak Activity Day:</span>
              <span className="font-medium text-gray-900">
                {new Date(analytics.metrics.peakActivityDay).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Most Active User:</span>
              <span className="font-medium text-gray-900">{analytics.metrics.mostActiveUser}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Most Changed Field:</span>
              <span className="font-medium text-gray-900">{analytics.metrics.mostChangedField}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Stability Analysis</h4>
          <div className="space-y-2">
            <StabilityIndicator
              label="Overall Stability"
              score={analytics.metrics.stabilityScore}
            />
            <div className="text-xs text-gray-600 mt-2">
              Based on change frequency, error rates, and consistency patterns
            </div>
          </div>
        </div>
      </div>

      {/* Quick Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimpleChart
          title="Change Frequency"
          data={analytics.trends.changeFrequency}
          color="blue"
        />
        <SimpleChart
          title="Error Rate"
          data={analytics.trends.errorRate}
          color="red"
        />
      </div>
    </div>
  );
};

// Trends Tab
interface TrendsTabProps {
  analytics: HistoryAnalyticsType;
}

const TrendsTab: React.FC<TrendsTabProps> = ({ analytics }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart
          title="Change Frequency Over Time"
          data={analytics.trends.changeFrequency}
          color="blue"
          description="Number of changes per time period"
        />
        
        <TrendChart
          title="User Activity"
          data={analytics.trends.userActivity}
          color="green"
          description="User activity levels over time"
        />
        
        <TrendChart
          title="Field Changes"
          data={analytics.trends.fieldChanges}
          color="purple"
          description="Most frequently changed fields"
        />
        
        <TrendChart
          title="Error Rate"
          data={analytics.trends.errorRate}
          color="red"
          description="Failed operations over time"
        />
      </div>
    </div>
  );
};

// Patterns Tab
interface PatternsTabProps {
  analytics: HistoryAnalyticsType;
}

const PatternsTab: React.FC<PatternsTabProps> = ({ analytics }) => {
  return (
    <div className="space-y-6">
      {/* Change Sequences */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Common Change Sequences</h4>
        <div className="space-y-3">
          {analytics.patterns.commonChangeSequences.map((sequence, index) => (
            <div key={index} className="bg-white rounded p-3 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {sequence.sequence.map((action, idx) => (
                    <React.Fragment key={idx}>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        {action.replace(/_/g, ' ')}
                      </span>
                      {idx < sequence.sequence.length - 1 && (
                        <span className="text-gray-400">→</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {sequence.frequency} times
                </span>
              </div>
              <div className="text-xs text-gray-500">
                Avg time between: {Math.round(sequence.averageTimeBetween / 1000)}s
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Patterns */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">User Behavior Patterns</h4>
        <div className="space-y-3">
          {analytics.patterns.userBehaviorPatterns.map((pattern, index) => (
            <div key={index} className="bg-white rounded p-3 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{pattern.userName}</span>
                <span className={`px-2 py-1 text-xs rounded ${
                  pattern.pattern.changeComplexity === 'high' ? 'bg-red-100 text-red-800' :
                  pattern.pattern.changeComplexity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {pattern.pattern.changeComplexity} complexity
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <p>Preferred actions: {pattern.pattern.preferredActions.join(', ')}</p>
                <p>Active hours: {pattern.pattern.activeHours.join(', ')}</p>
                <p>Avg session: {Math.round(pattern.pattern.averageSessionDuration / 60)}min</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time Patterns */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Time Patterns</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analytics.patterns.timePatterns.map((pattern, index) => (
            <div key={index} className="bg-white rounded p-3 border border-gray-200">
              <h5 className="font-medium text-gray-900 mb-2 capitalize">
                {pattern.type} Pattern
              </h5>
              <div className="text-sm text-gray-600">
                <p><strong>Peak:</strong> {pattern.pattern.peak}</p>
                <p><strong>Low:</strong> {pattern.pattern.low}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'green' | 'yellow' | 'red';
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600'
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center">
        <div className={`p-2 rounded-md ${colorClasses[color]}`}>
          <span className="text-lg">{icon}</span>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

// Stability Indicator
interface StabilityIndicatorProps {
  label: string;
  score: number;
}

const StabilityIndicator: React.FC<StabilityIndicatorProps> = ({ label, score }) => {
  const getColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{score.toFixed(0)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${getColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};

// Simple Chart Component
interface SimpleChartProps {
  title: string;
  data: TimeSeriesData[];
  color: string;
}

const SimpleChart: React.FC<SimpleChartProps> = ({ title, data, color }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <h4 className="font-medium text-gray-900 mb-3">{title}</h4>
      <div className="h-32 flex items-end space-x-1">
        {data.slice(-20).map((point, index) => (
          <div
            key={index}
            className={`flex-1 bg-${color}-500 rounded-t`}
            style={{
              height: `${(point.value / maxValue) * 100}%`,
              minHeight: '2px'
            }}
            title={`${point.label || new Date(point.timestamp).toLocaleDateString()}: ${point.value}`}
          />
        ))}
      </div>
      <div className="mt-2 text-xs text-gray-500 text-center">
        Last {data.length} data points
      </div>
    </div>
  );
};

// Trend Chart Component
interface TrendChartProps {
  title: string;
  data: TimeSeriesData[];
  color: string;
  description: string;
}

const TrendChart: React.FC<TrendChartProps> = ({ title, data, color, description }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="mb-4">
        <h4 className="font-medium text-gray-900">{title}</h4>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      
      <div className="h-40 flex items-end space-x-1 mb-4">
        {data.map((point, index) => (
          <div
            key={index}
            className={`flex-1 bg-${color}-500 rounded-t opacity-75 hover:opacity-100 transition-opacity`}
            style={{
              height: `${((point.value - minValue) / (maxValue - minValue)) * 100}%`,
              minHeight: '2px'
            }}
            title={`${new Date(point.timestamp).toLocaleDateString()}: ${point.value}`}
          />
        ))}
      </div>
      
      <div className="flex justify-between text-xs text-gray-500">
        <span>Min: {minValue}</span>
        <span>Max: {maxValue}</span>
      </div>
    </div>
  );
};

export default HistoryAnalytics;