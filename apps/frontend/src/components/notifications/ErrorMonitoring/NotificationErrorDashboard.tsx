'use client';

import React, { useState, useMemo } from 'react';
import { useNotificationErrorMonitoring, useNotificationMetrics, useNotificationAlerts } from '../../../hooks/useNotificationErrorMonitoring';
import { ErrorSeverity, NotificationErrorType, NotificationErrorCategory } from '../../../lib/notifications/error-monitoring';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Alert, AlertDescription } from '../../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import { Progress } from '../../ui/progress';
import { 
  AlertTriangle, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  XCircle,
  Download,
  RefreshCw,
  Bell,
  BellOff
} from 'lucide-react';

interface NotificationErrorDashboardProps {
  className?: string;
  showExportButton?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function NotificationErrorDashboard({
  className = '',
  showExportButton = true,
  autoRefresh = true,
  refreshInterval = 30000
}: NotificationErrorDashboardProps) {
  const {
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    refreshMetrics,
    exportErrorData,
    error
  } = useNotificationErrorMonitoring();

  const { errorMetrics, performanceMetrics } = useNotificationMetrics();
  const { alerts, resolveAlert } = useNotificationAlerts();

  const [selectedTab, setSelectedTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate derived metrics
  const derivedMetrics = useMemo(() => {
    if (!errorMetrics || !performanceMetrics) {
      return {
        healthScore: 100,
        criticalIssues: 0,
        trendDirection: 'stable' as 'up' | 'down' | 'stable',
        mostCommonError: 'None',
        averageResolutionTime: '0m'
      };
    }

    const criticalErrors = errorMetrics.errorsBySeverity[ErrorSeverity.CRITICAL] || 0;
    const highErrors = errorMetrics.errorsBySeverity[ErrorSeverity.HIGH] || 0;
    const totalErrors = errorMetrics.totalErrors;

    // Calculate health score (0-100)
    const healthScore = Math.max(0, 100 - (criticalErrors * 20) - (highErrors * 10) - (totalErrors * 2));

    // Find most common error type
    const mostCommonError = Object.entries(errorMetrics.errorsByType)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'None';

    // Format average resolution time
    const avgResolutionMs = errorMetrics.averageResolutionTime;
    const avgResolutionMinutes = Math.round(avgResolutionMs / (1000 * 60));
    const averageResolutionTime = avgResolutionMinutes > 0 ? `${avgResolutionMinutes}m` : '< 1m';

    return {
      healthScore,
      criticalIssues: criticalErrors + highErrors,
      trendDirection: performanceMetrics.errorRate > 5 ? 'up' : performanceMetrics.errorRate < 2 ? 'down' : 'stable',
      mostCommonError,
      averageResolutionTime
    };
  }, [errorMetrics, performanceMetrics]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshMetrics();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportData = () => {
    const data = exportErrorData();
    if (data) {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notification-error-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const getSeverityColor = (severity: ErrorSeverity): string => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 'destructive';
      case ErrorSeverity.HIGH:
        return 'destructive';
      case ErrorSeverity.MEDIUM:
        return 'default';
      case ErrorSeverity.LOW:
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getHealthScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Error loading monitoring dashboard: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">Notification Error Monitoring</h2>
          <div className="flex items-center space-x-2">
            {isMonitoring ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <Activity className="w-3 h-3 mr-1" />
                Active
              </Badge>
            ) : (
              <Badge variant="secondary">
                <XCircle className="w-3 h-3 mr-1" />
                Inactive
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          {showExportButton && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportData}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          )}
          
          <Button
            variant={isMonitoring ? "destructive" : "default"}
            size="sm"
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
          >
            {isMonitoring ? (
              <>
                <BellOff className="w-4 h-4 mr-2" />
                Stop
              </>
            ) : (
              <>
                <Bell className="w-4 h-4 mr-2" />
                Start
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getHealthScoreColor(derivedMetrics.healthScore)}`}>
              {derivedMetrics.healthScore}%
            </div>
            <Progress value={derivedMetrics.healthScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorMetrics?.totalErrors || 0}</div>
            <p className="text-xs text-muted-foreground">
              {errorMetrics?.unresolvedErrors || 0} unresolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            {derivedMetrics.trendDirection === 'up' ? (
              <TrendingUp className="h-4 w-4 text-red-500" />
            ) : derivedMetrics.trendDirection === 'down' ? (
              <TrendingDown className="h-4 w-4 text-green-500" />
            ) : (
              <Activity className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {performanceMetrics?.errorRate.toFixed(1) || '0.0'}%
            </div>
            <p className="text-xs text-muted-foreground">
              Success rate: {performanceMetrics?.successRate.toFixed(1) || '100.0'}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-xs text-muted-foreground">
              {derivedMetrics.criticalIssues} critical issues
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                      <span className="font-medium">{alert.message}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resolveAlert(alert.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Resolve
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Error Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Errors by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(errorMetrics?.errorsByCategory || {}).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="capitalize">{category.replace('_', ' ')}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Error Severity */}
            <Card>
              <CardHeader>
                <CardTitle>Errors by Severity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(errorMetrics?.errorsBySeverity || {}).map(([severity, count]) => (
                    <div key={severity} className="flex items-center justify-between">
                      <span className="capitalize">{severity}</span>
                      <Badge variant={getSeverityColor(severity as ErrorSeverity)}>
                        {count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Errors */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {errorMetrics?.recentErrors.slice(0, 5).map((error) => (
                  <div key={error.id} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant={getSeverityColor(error.severity)}>
                          {error.severity}
                        </Badge>
                        <span className="font-medium">{error.type.replace('_', ' ')}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(error.timestamp).toLocaleString()} • 
                        Occurred {error.occurrenceCount} time{error.occurrenceCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Badge variant={error.resolved ? "default" : "destructive"}>
                      {error.resolved ? 'Resolved' : 'Active'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Error Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{errorMetrics?.totalErrors || 0}</div>
                    <p className="text-sm text-muted-foreground">Total Errors</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{errorMetrics?.unresolvedErrors || 0}</div>
                    <p className="text-sm text-muted-foreground">Unresolved</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{derivedMetrics.averageResolutionTime}</div>
                    <p className="text-sm text-muted-foreground">Avg Resolution Time</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Most Common Error Types</h4>
                  {Object.entries(errorMetrics?.errorsByType || {})
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 10)
                    .map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-sm">{type.replace(/_/g, ' ')}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Subscription Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceMetrics?.subscriptionTime.toFixed(0) || '0'}ms
                </div>
                <p className="text-sm text-muted-foreground">Average subscription time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Display Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceMetrics?.notificationDisplayTime.toFixed(0) || '0'}ms
                </div>
                <p className="text-sm text-muted-foreground">Average display time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>API Response</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceMetrics?.apiResponseTime.toFixed(0) || '0'}ms
                </div>
                <p className="text-sm text-muted-foreground">Average API response time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Memory Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((performanceMetrics?.memoryUsage || 0) / 1024 / 1024).toFixed(1)}MB
                </div>
                <p className="text-sm text-muted-foreground">Current memory usage</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Network Latency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceMetrics?.networkLatency.toFixed(0) || '0'}ms
                </div>
                <p className="text-sm text-muted-foreground">Average network latency</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {performanceMetrics?.successRate.toFixed(1) || '100.0'}%
                </div>
                <p className="text-sm text-muted-foreground">Overall success rate</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alert Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No Active Alerts</h3>
                    <p className="text-muted-foreground">All systems are operating normally</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <div key={alert.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant={getSeverityColor(alert.severity)}>
                                {alert.severity}
                              </Badge>
                              <span className="font-medium">{alert.message}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Triggered: {new Date(alert.timestamp).toLocaleString()}
                            </p>
                            {alert.data && Object.keys(alert.data).length > 0 && (
                              <div className="mt-2">
                                <details className="text-sm">
                                  <summary className="cursor-pointer text-muted-foreground">
                                    View Details
                                  </summary>
                                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                                    {JSON.stringify(alert.data, null, 2)}
                                  </pre>
                                </details>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Resolve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}