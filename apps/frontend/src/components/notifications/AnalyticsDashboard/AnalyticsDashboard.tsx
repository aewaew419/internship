'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { EngagementAnalytics } from '../EngagementAnalytics';
import { useEngagementAnalytics, useNotificationEngagement } from '../../../hooks/useNotificationEngagement';
import { engagementService } from '../../../lib/api/services/engagement.service';
import { NotificationType, NotificationCategory } from '../../../types/notifications';

interface AnalyticsDashboardProps {
  className?: string;
}

interface ABTestResult {
  testId: string;
  name: string;
  status: 'running' | 'completed' | 'paused';
  variants: Array<{
    id: string;
    name: string;
    metrics: {
      openRate: number;
      clickRate: number;
      engagementScore: number;
    };
    sampleSize: number;
  }>;
  winner?: string;
  confidence: number;
  startDate: string;
  endDate?: string;
}

interface OptimizationRecommendation {
  type: 'timing' | 'frequency' | 'content' | 'targeting';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  implementation: string;
  expectedImprovement: number;
}

interface RealTimeMetrics {
  activeUsers: number;
  notificationsDelivered: number;
  openRate: number;
  clickRate: number;
  lastUpdated: number;
}

const RealTimeMetricsCard: React.FC<{ metrics: RealTimeMetrics }> = ({ metrics }) => {
  const [lastUpdate, setLastUpdate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = Date.now();
      const diff = now - metrics.lastUpdated;
      
      if (diff < 60000) {
        setLastUpdate('Just now');
      } else if (diff < 3600000) {
        setLastUpdate(`${Math.floor(diff / 60000)}m ago`);
      } else {
        setLastUpdate(`${Math.floor(diff / 3600000)}h ago`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, [metrics.lastUpdated]);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Real-Time Metrics</h3>
        <div className="flex items-center text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
          {lastUpdate}
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {metrics.activeUsers.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">Active Users</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {metrics.notificationsDelivered.toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">Delivered</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {(metrics.openRate * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500">Open Rate</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {(metrics.clickRate * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500">Click Rate</div>
        </div>
      </div>
    </div>
  );
};

const OptimizationRecommendations: React.FC<{ 
  recommendations: OptimizationRecommendation[] 
}> = ({ recommendations }) => {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'timing': return '⏰';
      case 'frequency': return '📊';
      case 'content': return '📝';
      case 'targeting': return '🎯';
      default: return '💡';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Optimization Recommendations</h3>
      </div>
      
      <div className="p-6">
        {recommendations.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No recommendations available. Your notification system is performing well!
          </p>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{getTypeIcon(rec.type)}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{rec.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(rec.impact)}`}>
                      {rec.impact} impact
                    </span>
                    <span className="text-sm font-medium text-green-600">
                      +{rec.expectedImprovement}%
                    </span>
                  </div>
                </div>
                
                <div className="mt-3 p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-700">
                    <strong>Implementation:</strong> {rec.implementation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ABTestResults: React.FC<{ tests: ABTestResult[] }> = ({ tests }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">A/B Test Results</h3>
      </div>
      
      <div className="p-6">
        {tests.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No A/B tests running. Create a test to optimize your notifications.
          </p>
        ) : (
          <div className="space-y-6">
            {tests.map((test) => (
              <div key={test.testId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900">{test.name}</h4>
                    <p className="text-sm text-gray-500">Test ID: {test.testId}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                      {test.status}
                    </span>
                    {test.confidence > 0 && (
                      <span className="text-sm text-gray-600">
                        {(test.confidence * 100).toFixed(1)}% confidence
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {test.variants.map((variant) => (
                    <div 
                      key={variant.id} 
                      className={`p-3 rounded border-2 ${
                        test.winner === variant.id 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{variant.name}</h5>
                        {test.winner === variant.id && (
                          <span className="text-green-600 text-sm font-medium">Winner</span>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Open Rate:</span>
                          <span className="font-medium">{(variant.metrics.openRate * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Click Rate:</span>
                          <span className="font-medium">{(variant.metrics.clickRate * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Engagement:</span>
                          <span className="font-medium">{variant.metrics.engagementScore}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sample Size:</span>
                          <span className="font-medium">{variant.sampleSize.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const SystemHealthMonitor: React.FC = () => {
  const [healthMetrics, setHealthMetrics] = useState({
    notificationDeliveryRate: 0.98,
    averageResponseTime: 150,
    errorRate: 0.02,
    systemUptime: 99.9,
    lastIncident: '2 days ago'
  });

  const getHealthStatus = () => {
    if (healthMetrics.notificationDeliveryRate > 0.95 && healthMetrics.errorRate < 0.05) {
      return { status: 'healthy', color: 'text-green-600', bg: 'bg-green-100' };
    } else if (healthMetrics.notificationDeliveryRate > 0.90 && healthMetrics.errorRate < 0.10) {
      return { status: 'warning', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    } else {
      return { status: 'critical', color: 'text-red-600', bg: 'bg-red-100' };
    }
  };

  const health = getHealthStatus();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">System Health</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${health.bg} ${health.color}`}>
          {health.status.toUpperCase()}
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">
            {(healthMetrics.notificationDeliveryRate * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500">Delivery Rate</div>
        </div>
        
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">
            {healthMetrics.averageResponseTime}ms
          </div>
          <div className="text-sm text-gray-500">Avg Response</div>
        </div>
        
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">
            {(healthMetrics.errorRate * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500">Error Rate</div>
        </div>
        
        <div className="text-center">
          <div className="text-xl font-bold text-gray-900">
            {healthMetrics.systemUptime}%
          </div>
          <div className="text-sm text-gray-500">Uptime</div>
        </div>
        
        <div className="text-center md:col-span-2">
          <div className="text-xl font-bold text-gray-900">
            {healthMetrics.lastIncident}
          </div>
          <div className="text-sm text-gray-500">Last Incident</div>
        </div>
      </div>
    </div>
  );
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  className = '' 
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimeMetrics | null>(null);
  const [abTests, setAbTests] = useState<ABTestResult[]>([]);
  const [recommendations, setRecommendations] = useState<OptimizationRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const timeRange = useMemo(() => {
    const now = Date.now();
    const ranges = {
      '24h': { start: now - 24 * 60 * 60 * 1000, end: now },
      '7d': { start: now - 7 * 24 * 60 * 60 * 1000, end: now },
      '30d': { start: now - 30 * 24 * 60 * 60 * 1000, end: now },
      '90d': { start: now - 90 * 24 * 60 * 60 * 1000, end: now }
    };
    return ranges[selectedTimeRange];
  }, [selectedTimeRange]);

  const { analytics, loading: analyticsLoading } = useEngagementAnalytics(timeRange);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load real-time metrics
        const realTime = await engagementService.getRealTimeMetrics();
        setRealTimeMetrics(realTime);

        // Load optimization recommendations
        const optimizationReport = await engagementService.getOptimizationRecommendations();
        setRecommendations(optimizationReport.recommendations);

        // Mock A/B test data (in real implementation, this would come from the API)
        setAbTests([
          {
            testId: 'test-1',
            name: 'Notification Timing Optimization',
            status: 'running',
            variants: [
              {
                id: 'variant-a',
                name: 'Morning (9 AM)',
                metrics: { openRate: 0.65, clickRate: 0.32, engagementScore: 78 },
                sampleSize: 1250
              },
              {
                id: 'variant-b',
                name: 'Afternoon (2 PM)',
                metrics: { openRate: 0.58, clickRate: 0.28, engagementScore: 71 },
                sampleSize: 1180
              },
              {
                id: 'variant-c',
                name: 'Evening (6 PM)',
                metrics: { openRate: 0.72, clickRate: 0.38, engagementScore: 85 },
                sampleSize: 1320
              }
            ],
            winner: 'variant-c',
            confidence: 0.95,
            startDate: '2024-01-15',
            endDate: '2024-02-15'
          }
        ]);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();

    // Set up real-time updates
    const interval = setInterval(async () => {
      try {
        const realTime = await engagementService.getRealTimeMetrics();
        setRealTimeMetrics(realTime);
      } catch (err) {
        console.error('Failed to update real-time metrics:', err);
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleExportData = async (format: 'csv' | 'json' | 'xlsx') => {
    try {
      const blob = await engagementService.exportEngagementData(format, timeRange);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notification-analytics-${selectedTimeRange}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export data:', err);
    }
  };

  if (loading || analyticsLoading) {
    return (
      <div className={`animate-pulse space-y-6 ${className}`}>
        <div className="bg-gray-200 rounded-lg h-32" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-200 rounded-lg h-64" />
          <div className="bg-gray-200 rounded-lg h-64" />
        </div>
        <div className="bg-gray-200 rounded-lg h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Dashboard</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor and optimize your notification performance</p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          {/* Time Range Selector */}
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          
          {/* Export Dropdown */}
          <div className="relative">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleExportData(e.target.value as any);
                  e.target.value = '';
                }
              }}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Export Data</option>
              <option value="csv">Export as CSV</option>
              <option value="json">Export as JSON</option>
              <option value="xlsx">Export as Excel</option>
            </select>
          </div>
        </div>
      </div>

      {/* Real-Time Metrics */}
      {realTimeMetrics && <RealTimeMetricsCard metrics={realTimeMetrics} />}

      {/* System Health */}
      <SystemHealthMonitor />

      {/* Main Analytics */}
      {analytics && (
        <EngagementAnalytics 
          timeRange={timeRange}
          className="bg-gray-50 rounded-lg p-6"
        />
      )}

      {/* Optimization and A/B Testing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OptimizationRecommendations recommendations={recommendations} />
        <ABTestResults tests={abTests} />
      </div>

      {/* Additional Insights */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Key Insights</h3>
        <div className="space-y-4">
          {analytics && (
            <>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                <div>
                  <p className="text-sm text-gray-900">
                    <strong>Best Performing Type:</strong> {
                      Object.entries(analytics.byType)
                        .sort(([, a], [, b]) => b.engagementScore - a.engagementScore)[0]?.[0]
                        ?.replace(/_/g, ' ')
                        ?.replace(/\b\w/g, l => l.toUpperCase()) || 'N/A'
                    }
                  </p>
                  <p className="text-xs text-gray-500">
                    This notification type has the highest engagement score
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                <div>
                  <p className="text-sm text-gray-900">
                    <strong>Peak Engagement Time:</strong> {
                      Object.entries(analytics.byTimeOfDay)
                        .sort(([, a], [, b]) => b.engagementScore - a.engagementScore)[0]?.[0]
                    }:00
                  </p>
                  <p className="text-xs text-gray-500">
                    Users are most engaged with notifications at this hour
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2" />
                <div>
                  <p className="text-sm text-gray-900">
                    <strong>Overall Performance:</strong> {
                      analytics.overall.openRate > 0.6 ? 'Excellent' :
                      analytics.overall.openRate > 0.4 ? 'Good' :
                      analytics.overall.openRate > 0.2 ? 'Fair' : 'Needs Improvement'
                    }
                  </p>
                  <p className="text-xs text-gray-500">
                    Based on industry benchmarks for notification open rates
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};