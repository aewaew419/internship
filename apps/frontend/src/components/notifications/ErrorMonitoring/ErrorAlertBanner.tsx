'use client';

import React, { useState, useEffect } from 'react';
import { useNotificationAlerts } from '../../../hooks/useNotificationErrorMonitoring';
import { ErrorSeverity } from '../../../lib/notifications/error-monitoring';
import { Alert, AlertDescription } from '../../ui/alert';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { 
  AlertTriangle, 
  X, 
  ChevronDown, 
  ChevronUp,
  Clock,
  CheckCircle
} from 'lucide-react';

interface ErrorAlertBannerProps {
  className?: string;
  maxAlertsToShow?: number;
  autoHide?: boolean;
  hideDelay?: number;
  showOnlyHighPriority?: boolean;
}

export function ErrorAlertBanner({
  className = '',
  maxAlertsToShow = 3,
  autoHide = false,
  hideDelay = 10000,
  showOnlyHighPriority = false
}: ErrorAlertBannerProps) {
  const { alerts, resolveAlert } = useNotificationAlerts();
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Filter alerts based on props
  const filteredAlerts = alerts.filter(alert => {
    if (dismissedAlerts.has(alert.id)) return false;
    if (showOnlyHighPriority) {
      return alert.severity === ErrorSeverity.CRITICAL || alert.severity === ErrorSeverity.HIGH;
    }
    return true;
  });

  const visibleAlerts = isExpanded 
    ? filteredAlerts 
    : filteredAlerts.slice(0, maxAlertsToShow);

  const hasMoreAlerts = filteredAlerts.length > maxAlertsToShow;

  // Auto-hide functionality
  useEffect(() => {
    if (autoHide && filteredAlerts.length > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, hideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, hideDelay, filteredAlerts.length]);

  // Reset visibility when new alerts arrive
  useEffect(() => {
    if (filteredAlerts.length > 0) {
      setIsVisible(true);
    }
  }, [filteredAlerts.length]);

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set(prev).add(alertId));
  };

  const handleResolveAlert = (alertId: string) => {
    resolveAlert(alertId);
    setDismissedAlerts(prev => new Set(prev).add(alertId));
  };

  const handleDismissAll = () => {
    const allAlertIds = filteredAlerts.map(alert => alert.id);
    setDismissedAlerts(prev => new Set([...prev, ...allAlertIds]));
  };

  const getSeverityVariant = (severity: ErrorSeverity): 'default' | 'destructive' => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'destructive';
      default:
        return 'default';
    }
  };

  const getSeverityIcon = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case ErrorSeverity.HIGH:
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (!isVisible || filteredAlerts.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {visibleAlerts.map((alert, index) => (
        <Alert 
          key={alert.id} 
          variant={getSeverityVariant(alert.severity)}
          className="relative"
        >
          <div className="flex items-start space-x-3">
            {getSeverityIcon(alert.severity)}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <Badge variant={getSeverityVariant(alert.severity)}>
                  {alert.severity}
                </Badge>
                <span className="text-sm text-muted-foreground flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatTimeAgo(alert.timestamp)}
                </span>
              </div>
              
              <AlertDescription className="text-sm">
                {alert.message}
              </AlertDescription>

              {alert.data && Object.keys(alert.data).length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                    View technical details
                  </summary>
                  <div className="mt-1 p-2 bg-muted/50 rounded text-xs font-mono overflow-auto max-h-32">
                    {Object.entries(alert.data).map(([key, value]) => (
                      <div key={key} className="flex">
                        <span className="text-muted-foreground mr-2">{key}:</span>
                        <span>{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>

            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleResolveAlert(alert.id)}
                className="h-8 w-8 p-0"
                title="Resolve alert"
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDismissAlert(alert.id)}
                className="h-8 w-8 p-0"
                title="Dismiss alert"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Alert>
      ))}

      {/* Expand/Collapse and Actions */}
      {filteredAlerts.length > 0 && (
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            {hasMoreAlerts && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 px-2"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Show {filteredAlerts.length - maxAlertsToShow} More
                  </>
                )}
              </Button>
            )}
            
            <span className="text-muted-foreground">
              {filteredAlerts.length} active alert{filteredAlerts.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismissAll}
              className="h-8 px-2 text-muted-foreground hover:text-foreground"
            >
              Dismiss All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact version for mobile or limited space
 */
export function CompactErrorAlertBanner({
  className = '',
  showCount = true
}: {
  className?: string;
  showCount?: boolean;
}) {
  const { alerts, resolveAlert } = useNotificationAlerts();
  const [isExpanded, setIsExpanded] = useState(false);

  const criticalAlerts = alerts.filter(alert => 
    alert.severity === ErrorSeverity.CRITICAL || alert.severity === ErrorSeverity.HIGH
  );

  if (alerts.length === 0) return null;

  const highestSeverityAlert = alerts.reduce((highest, current) => {
    const severityOrder = {
      [ErrorSeverity.CRITICAL]: 4,
      [ErrorSeverity.HIGH]: 3,
      [ErrorSeverity.MEDIUM]: 2,
      [ErrorSeverity.LOW]: 1
    };
    
    return severityOrder[current.severity] > severityOrder[highest.severity] 
      ? current 
      : highest;
  });

  return (
    <div className={`${className}`}>
      <Alert 
        variant={getSeverityVariant(highestSeverityAlert.severity)}
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">
              {criticalAlerts.length > 0 
                ? `${criticalAlerts.length} Critical Issue${criticalAlerts.length !== 1 ? 's' : ''}`
                : `${alerts.length} Notification Issue${alerts.length !== 1 ? 's' : ''}`
              }
            </span>
            {showCount && (
              <Badge variant="secondary" className="text-xs">
                {alerts.length}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                resolveAlert(highestSeverityAlert.id);
              }}
              className="h-6 w-6 p-0"
            >
              <CheckCircle className="h-3 w-3" />
            </Button>
            
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="mt-3 space-y-2">
            {alerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <Badge variant={getSeverityVariant(alert.severity)} className="text-xs">
                    {alert.severity}
                  </Badge>
                  <span className="truncate max-w-48">{alert.message}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    resolveAlert(alert.id);
                  }}
                  className="h-5 w-5 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            
            {alerts.length > 3 && (
              <div className="text-xs text-muted-foreground">
                And {alerts.length - 3} more...
              </div>
            )}
          </div>
        )}
      </Alert>
    </div>
  );

  function getSeverityVariant(severity: ErrorSeverity): 'default' | 'destructive' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'destructive';
      default:
        return 'default';
    }
  }
}