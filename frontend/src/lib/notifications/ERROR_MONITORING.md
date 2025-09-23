# Notification Error Monitoring System

This document describes the comprehensive error monitoring and alerting system for push notifications in the frontend application.

## Overview

The notification error monitoring system provides:

- **Error Tracking**: Comprehensive tracking of push notification failures, subscription issues, and delivery problems
- **Performance Monitoring**: Real-time monitoring of notification system performance metrics
- **Alerting System**: Configurable alerts for critical issues and performance degradation
- **Cross-Browser Compatibility**: Error monitoring across different browsers and devices
- **Service Worker Integration**: Error tracking within service worker context

## Architecture

### Core Components

1. **NotificationErrorMonitor**: Main error monitoring class
2. **ServiceWorkerErrorMonitor**: Lightweight monitoring for service worker context
3. **Error Tracking Hooks**: React hooks for easy integration
4. **Dashboard Components**: UI components for displaying error metrics and alerts

### Error Categories

- **Subscription**: Push subscription and permission errors
- **Delivery**: Notification delivery and display failures
- **Performance**: Performance degradation and resource issues
- **Network**: Network connectivity and timeout errors
- **API**: Backend API request failures
- **Compatibility**: Browser compatibility and feature support issues

### Error Severity Levels

- **Critical**: System-breaking errors requiring immediate attention
- **High**: Significant errors affecting user experience
- **Medium**: Moderate errors with workarounds available
- **Low**: Minor errors with minimal impact

## Usage

### Basic Error Tracking

```typescript
import { trackNotificationError, NotificationErrorType } from '@/lib/notifications';

// Track a basic error
const errorId = trackNotificationError(
  NotificationErrorType.PUSH_SUBSCRIPTION_FAILED,
  'Failed to subscribe to push notifications',
  {
    browserInfo: navigator.userAgent,
    timestamp: Date.now()
  },
  userId
);
```

### Subscription Error Tracking

```typescript
import { trackSubscriptionError } from '@/lib/notifications';
import { PushNotificationError } from '@/types/notifications';

// Track subscription-specific errors
const errorId = trackSubscriptionError(
  PushNotificationError.PERMISSION_DENIED,
  originalError,
  userId
);
```

### API Error Tracking

```typescript
import { trackApiError } from '@/lib/notifications';

// Track API request failures
const errorId = trackApiError(
  '/api/notifications/subscribe',
  'POST',
  500,
  error,
  userId
);
```

### Using React Hooks

```typescript
import { useNotificationErrorMonitoring } from '@/hooks/useNotificationErrorMonitoring';

function NotificationComponent() {
  const {
    isMonitoring,
    errorMetrics,
    activeAlerts,
    trackError,
    resolveAlert
  } = useNotificationErrorMonitoring();

  // Track errors in component
  const handleError = (error: Error) => {
    trackError(
      NotificationErrorType.NOTIFICATION_DISPLAY_FAILED,
      error.message,
      { componentError: true }
    );
  };

  return (
    <div>
      {activeAlerts.map(alert => (
        <div key={alert.id}>
          {alert.message}
          <button onClick={() => resolveAlert(alert.id)}>
            Resolve
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Dashboard Integration

```typescript
import { NotificationErrorDashboard } from '@/components/notifications/ErrorMonitoring';

function AdminPanel() {
  return (
    <div>
      <h1>System Monitoring</h1>
      <NotificationErrorDashboard
        showExportButton={true}
        autoRefresh={true}
        refreshInterval={30000}
      />
    </div>
  );
}
```

### Alert Banner

```typescript
import { ErrorAlertBanner } from '@/components/notifications/ErrorMonitoring';

function Layout() {
  return (
    <div>
      <ErrorAlertBanner
        maxAlertsToShow={3}
        showOnlyHighPriority={true}
        autoHide={false}
      />
      {/* Rest of layout */}
    </div>
  );
}
```

## Service Worker Integration

### Setup Error Monitoring in Service Worker

```typescript
// In your service worker file
import { 
  setupServiceWorkerErrorMonitoring,
  createMonitoredPushHandler,
  trackPushError
} from '@/lib/notifications/service-worker-error-monitoring';

// Initialize error monitoring
setupServiceWorkerErrorMonitoring();

// Enhanced push event handler
const handlePush = createMonitoredPushHandler(async (event) => {
  try {
    const data = event.data?.json();
    await self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      data: data.data
    });
  } catch (error) {
    // Error is automatically tracked by the wrapper
    throw error;
  }
});

self.addEventListener('push', handlePush);
```

### Manual Error Tracking in Service Worker

```typescript
import { trackServiceWorkerError, NotificationErrorType } from '@/lib/notifications';

// Track custom errors
self.addEventListener('push', (event) => {
  try {
    // Push handling logic
  } catch (error) {
    trackServiceWorkerError(
      NotificationErrorType.NOTIFICATION_DISPLAY_FAILED,
      error.message,
      { pushEventData: event.data?.json() },
      'push'
    );
  }
});
```

## Alert Configuration

### Default Alert Rules

The system comes with pre-configured alert rules:

- **High Error Rate**: Triggers when error rate exceeds 10% in 5 minutes
- **Critical Subscription Failures**: Triggers when more than 5 subscription failures occur in 10 minutes
- **Performance Degradation**: Triggers when average response time exceeds 5 seconds in 15 minutes

### Custom Alert Rules

```typescript
import { useNotificationErrorMonitoring, ErrorSeverity } from '@/hooks/useNotificationErrorMonitoring';

function AdminSettings() {
  const { addAlertRule } = useNotificationErrorMonitoring();

  const createCustomAlert = () => {
    const ruleId = addAlertRule({
      name: 'High Memory Usage',
      condition: { metric: 'memoryUsage', operator: 'gt', value: 100000000 },
      threshold: 100000000, // 100MB
      timeWindow: 5, // 5 minutes
      severity: ErrorSeverity.HIGH,
      enabled: true
    });
  };

  return (
    <button onClick={createCustomAlert}>
      Add Memory Alert
    </button>
  );
}
```

## Performance Metrics

### Tracked Metrics

- **Subscription Time**: Time taken to subscribe to push notifications
- **Display Time**: Time taken to display notifications
- **API Response Time**: Average API response time
- **Memory Usage**: Current JavaScript heap usage
- **Network Latency**: Average network request latency
- **Error Rate**: Percentage of failed operations
- **Success Rate**: Percentage of successful operations

### Accessing Metrics

```typescript
import { getPerformanceMetrics, getErrorMetrics } from '@/lib/notifications';

// Get current performance metrics
const performanceMetrics = getPerformanceMetrics();
console.log('Subscription time:', performanceMetrics.subscriptionTime);

// Get error metrics
const errorMetrics = getErrorMetrics();
console.log('Total errors:', errorMetrics.totalErrors);
console.log('Error rate:', errorMetrics.errorRate);
```

## Data Export

### Export Error Data

```typescript
import { useNotificationErrorMonitoring } from '@/hooks/useNotificationErrorMonitoring';

function ExportButton() {
  const { exportErrorData } = useNotificationErrorMonitoring();

  const handleExport = () => {
    const data = exportErrorData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notification-errors-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button onClick={handleExport}>
      Export Error Data
    </button>
  );
}
```

## Error Types Reference

### Push Notification Errors

- `PUSH_SUBSCRIPTION_FAILED`: Failed to create push subscription
- `PUSH_PERMISSION_DENIED`: User denied notification permission
- `PUSH_NOT_SUPPORTED`: Browser doesn't support push notifications
- `VAPID_KEY_INVALID`: Invalid or missing VAPID key
- `SERVICE_WORKER_ERROR`: Service worker registration or operation failed

### Delivery Errors

- `NOTIFICATION_DELIVERY_FAILED`: Failed to deliver notification
- `NOTIFICATION_DISPLAY_FAILED`: Failed to display notification
- `NOTIFICATION_ACTION_FAILED`: Failed to handle notification action

### API Errors

- `API_REQUEST_FAILED`: API request failed
- `API_TIMEOUT`: API request timed out
- `API_RATE_LIMITED`: API rate limit exceeded

### Network Errors

- `NETWORK_OFFLINE`: Device is offline
- `NETWORK_TIMEOUT`: Network request timed out
- `NETWORK_CONNECTION_FAILED`: Network connection failed

### Performance Errors

- `PERFORMANCE_DEGRADATION`: Performance metrics exceeded thresholds
- `MEMORY_LEAK`: High memory usage detected
- `HIGH_CPU_USAGE`: High CPU usage detected

### Compatibility Errors

- `BROWSER_NOT_SUPPORTED`: Browser not supported
- `FEATURE_NOT_AVAILABLE`: Required feature not available
- `POLYFILL_FAILED`: Polyfill loading failed

## Best Practices

### Error Tracking

1. **Be Specific**: Use appropriate error types and provide detailed context
2. **Include User Context**: Always include user ID when available
3. **Add Relevant Details**: Include browser info, timestamps, and operation context
4. **Don't Over-Track**: Avoid tracking the same error repeatedly in short time periods

### Performance Monitoring

1. **Set Reasonable Thresholds**: Configure alert thresholds based on your application's performance characteristics
2. **Monitor Trends**: Look for trends in error rates and performance metrics
3. **Regular Review**: Regularly review and update alert rules based on system behavior

### Alert Management

1. **Prioritize Alerts**: Focus on critical and high-severity alerts first
2. **Resolve Promptly**: Resolve alerts once issues are fixed to maintain clean state
3. **Custom Rules**: Create custom alert rules for application-specific scenarios
4. **Documentation**: Document alert resolution procedures for your team

### Service Worker Integration

1. **Wrap Handlers**: Use monitored handler wrappers for automatic error tracking
2. **Context Awareness**: Provide appropriate context (push, sync, notification) for errors
3. **Performance Impact**: Monitor the performance impact of error tracking in service workers
4. **Error Propagation**: Ensure errors are still propagated after tracking

## Troubleshooting

### Common Issues

1. **High Memory Usage**: Check for memory leaks in error storage
2. **Performance Impact**: Ensure error monitoring doesn't significantly impact performance
3. **Alert Fatigue**: Tune alert thresholds to reduce false positives
4. **Service Worker Errors**: Verify service worker registration and update procedures

### Debug Mode

Enable debug logging for detailed error tracking information:

```typescript
// Enable debug mode (development only)
if (process.env.NODE_ENV === 'development') {
  window.notificationErrorDebug = true;
}
```

### Error Recovery

The system includes automatic error recovery mechanisms:

- **Exponential Backoff**: For network-related errors
- **Retry Logic**: For transient failures
- **Graceful Degradation**: Fallback to basic functionality when advanced features fail

## Integration with External Systems

### Logging Services

```typescript
// Example integration with external logging service
import { notificationErrorMonitor } from '@/lib/notifications';

// Send errors to external service
notificationErrorMonitor.onError((error) => {
  externalLoggingService.log({
    level: error.severity,
    message: error.message,
    context: error.details,
    timestamp: error.timestamp
  });
});
```

### Monitoring Dashboards

The error monitoring system can be integrated with external monitoring dashboards by exporting metrics in standard formats or through webhook notifications.

## Security Considerations

1. **Data Sanitization**: Ensure error details don't contain sensitive information
2. **User Privacy**: Respect user privacy when tracking errors
3. **Data Retention**: Implement appropriate data retention policies
4. **Access Control**: Restrict access to error monitoring dashboards

## Future Enhancements

- **Machine Learning**: Anomaly detection for unusual error patterns
- **Predictive Alerts**: Predict potential issues before they occur
- **Advanced Analytics**: More sophisticated error analysis and reporting
- **Integration APIs**: APIs for third-party monitoring tools
- **Mobile App Integration**: Extended monitoring for mobile app notifications