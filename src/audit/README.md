# Audit Logging System

A comprehensive audit logging system for tracking all administrative operations in the Super Admin Configuration Panels.

## Features

- **Comprehensive Logging**: Track all CRUD operations, role management, calendar changes, and system configurations
- **Real-time Monitoring**: Detect suspicious activities and security threats
- **Performance Tracking**: Monitor operation performance and system health
- **Flexible Configuration**: Environment-specific configurations for different deployment scenarios
- **React Integration**: Hooks and context providers for seamless React integration
- **Middleware Support**: Automatic logging for API calls, state changes, and form submissions
- **Export Capabilities**: Export audit logs in JSON, CSV, and Excel formats
- **Change Tracking**: Detailed before/after value tracking for all modifications

## Quick Start

### 1. Initialize the Audit System

```typescript
import { initializeAuditSystem } from './audit';

// Initialize with environment and user context
const { auditService, config } = initializeAuditSystem('production', {
  id: 1,
  email: 'admin@example.com',
  name: 'Admin User'
});
```

### 2. Use in React Components

```typescript
import { AuditProvider, useAudit } from './audit';

// Wrap your app with AuditProvider
function App() {
  return (
    <AuditProvider config={{ environment: 'production' }}>
      <AdminPanel />
    </AuditProvider>
  );
}

// Use audit hooks in components
function RoleManager() {
  const { logAction, logError } = useAudit();

  const handleRoleUpdate = async (roleId: string, changes: any[]) => {
    try {
      await updateRole(roleId, changes);
      await logAction('role_update', 'role', roleId, changes);
    } catch (error) {
      await logError('role_update', 'role', roleId, error);
    }
  };
}
```

### 3. Automatic API Logging

```typescript
import { setupReactAudit } from './audit';

// Setup automatic API and state logging
const { middleware } = setupReactAudit({
  environment: 'production',
  enableAPILogging: true,
  enableStateLogging: true
});

// API calls will be automatically logged
fetch('/api/roles', { method: 'POST', body: JSON.stringify(roleData) });
```

## Core Components

### AuditService

The main service for logging audit events:

```typescript
import { auditService } from './audit';

// Log an action
await auditService.logAction(
  'role_create',
  'role',
  'role-123',
  [{ field: 'name', oldValue: null, newValue: 'Admin', fieldType: 'string' }],
  { userId: 1, timestamp: new Date().toISOString() }
);

// Log an error
await auditService.logError(
  'role_update',
  'role',
  'role-123',
  new Error('Validation failed'),
  { attemptedChanges: ['name', 'permissions'] }
);

// Get audit events
const events = await auditService.getEvents({
  userId: 1,
  dateFrom: '2024-01-01',
  dateTo: '2024-12-31',
  action: ['role_create', 'role_update'],
  limit: 100
});
```

### React Hooks

#### useAudit
Basic audit logging functionality:

```typescript
const { logAction, logError, setContext, isLogging } = useAudit();
```

#### useAuditEvents
Fetch and manage audit events:

```typescript
const { 
  events, 
  loading, 
  error, 
  updateFilter, 
  refreshEvents, 
  exportEvents 
} = useAuditEvents({
  dateFrom: '2024-01-01',
  limit: 50
});
```

#### useAuditTracker
Track changes to objects:

```typescript
const { 
  currentValue, 
  updateValue, 
  hasChanges 
} = useAuditTracker(
  initialRole,
  'role',
  'role-123',
  { name: 'Role Name', permissions: 'Permissions' }
);
```

#### useSuspiciousActivityMonitor
Monitor for suspicious activities:

```typescript
const { 
  suspiciousActivities, 
  hasSuspiciousActivities, 
  checkSuspiciousActivities 
} = useSuspiciousActivityMonitor();
```

### Middleware

#### API Middleware
Automatically log API requests and responses:

```typescript
import { apiAuditMiddleware } from './audit';

// Setup fetch interceptor
apiAuditMiddleware.createFetchInterceptor();

// Or use with Axios
const axiosInterceptor = apiAuditMiddleware.createAxiosInterceptor();
axios.interceptors.request.use(axiosInterceptor.request);
axios.interceptors.response.use(axiosInterceptor.response, axiosInterceptor.error);
```

#### State Middleware
Log state management changes:

```typescript
import { stateAuditMiddleware } from './audit';

// Redux middleware
const store = createStore(
  reducer,
  applyMiddleware(stateAuditMiddleware.createReduxMiddleware())
);

// Zustand middleware
const useStore = create(
  stateAuditMiddleware.createZustandMiddleware()(
    (set, get) => ({
      // your store implementation
    })
  )
);
```

#### Form Middleware
Track form interactions:

```typescript
import { formAuditMiddleware } from './audit';

// Track field changes
formAuditMiddleware.trackFieldChange('user-form', 'email', 'old@example.com', 'new@example.com');

// Log form submission
await formAuditMiddleware.logFormSubmission(
  'user-form',
  'user',
  'user-123',
  formData,
  true // success
);
```

## Configuration

### Environment-Specific Configurations

```typescript
import { getAuditConfig } from './audit';

// Get configuration for specific environment
const prodConfig = getAuditConfig('production');
const devConfig = getAuditConfig('development');
const testConfig = getAuditConfig('testing');
```

### Custom Configuration

```typescript
import { AuditConfiguration } from './audit';

const customConfig: Partial<AuditConfiguration> = {
  enabled: true,
  retentionDays: 180,
  logLevel: 'medium',
  enabledActions: ['create', 'update', 'delete'],
  excludeReadOperations: true,
  enablePerformanceTracking: true,
  enableSuspiciousActivityDetection: true
};
```

## Utilities

### Formatters

```typescript
import { auditFormatters } from './audit';

// Format event for display
const displayText = auditFormatters.formatEvent(auditEvent);

// Format changes
const changesText = auditFormatters.formatChanges(changes);

// Get severity color
const color = auditFormatters.getSeverityColor('high');
```

### Comparators

```typescript
import { auditComparators } from './audit';

// Compare objects and get changes
const changes = auditComparators.compareObjects(oldObject, newObject);
```

### Search and Filter

```typescript
import { auditSearch } from './audit';

// Search events
const filteredEvents = auditSearch.searchEvents(events, 'role update');

// Filter by date range
const recentEvents = auditSearch.filterByDateRange(
  events, 
  '2024-01-01', 
  '2024-01-31'
);

// Group events
const groupedEvents = auditSearch.groupEvents(events, 'action');
```

### Export

```typescript
import { auditExport } from './audit';

// Convert to CSV
const csvData = auditExport.toCSV(events);

// Convert to JSON
const jsonData = auditExport.toJSON(events);

// Download as file
auditExport.downloadAsFile(csvData, 'audit-events.csv', 'text/csv');
```

## Decorators and HOCs

### Audit Decorator

```typescript
import { auditLog } from './audit';

class RoleService {
  @auditLog('role_create', 'role', {
    getEntityId: (roleData) => roleData.id,
    getMetadata: (roleData) => ({ roleName: roleData.name })
  })
  async createRole(roleData: any) {
    // Implementation
  }
}
```

### Higher-Order Function

```typescript
import { withAuditLogging } from './audit';

const auditedUpdateRole = withAuditLogging(
  updateRole,
  'role_update',
  'role',
  {
    getEntityId: (id) => id,
    getChanges: (args, result) => calculateChanges(args[1], result)
  }
);
```

## Performance Monitoring

```typescript
import { auditPerformanceMonitor } from './audit';

// Start timing an operation
const stopTimer = auditPerformanceMonitor.startTimer('role_update');

// ... perform operation ...

// Stop timer
stopTimer();

// Get metrics
const metrics = auditPerformanceMonitor.getMetrics('role_update');
console.log(`Average: ${metrics.avg}ms, Max: ${metrics.max}ms`);
```

## Batch Operations

```typescript
import { BatchAuditLogger } from './audit';

const batchLogger = new BatchAuditLogger(50, 3000); // 50 operations, 3 second flush

// Add operations to batch
batchLogger.add(() => auditService.logAction('create', 'role', 'role-1', []));
batchLogger.add(() => auditService.logAction('create', 'role', 'role-2', []));

// Operations will be batched and flushed automatically
```

## Security Features

### Sensitive Data Redaction

The system automatically redacts sensitive fields like passwords, tokens, and keys from audit logs.

### Suspicious Activity Detection

- Multiple failed login attempts
- Access denied events
- Bulk operations outside business hours
- Critical operations by non-admin users

### IP Address Monitoring

Tracks and flags suspicious IP address patterns and user agents.

## Best Practices

1. **Use Appropriate Log Levels**: Set log levels based on environment (production should exclude read operations)

2. **Batch Operations**: Use batch logging for high-frequency operations to improve performance

3. **Monitor Performance**: Use performance tracking to identify slow operations

4. **Regular Cleanup**: Set appropriate retention periods and regularly purge old events

5. **Security Monitoring**: Enable suspicious activity detection in production environments

6. **Error Handling**: Always log errors with sufficient context for debugging

7. **Change Tracking**: Use detailed change tracking for critical entities like roles and permissions

## API Reference

### Types

- `AuditEvent`: Main audit event structure
- `AuditAction`: Available audit actions
- `AuditEntityType`: Entity types that can be audited
- `AuditChange`: Structure for tracking field changes
- `AuditFilter`: Filtering options for querying events
- `AuditConfiguration`: System configuration options

### Services

- `auditService`: Main audit logging service
- `auditHelpers`: Helper functions for common operations

### Hooks

- `useAudit`: Basic audit functionality
- `useAuditEvents`: Event fetching and management
- `useAuditSummary`: Summary statistics
- `useAuditTracker`: Object change tracking
- `useSuspiciousActivityMonitor`: Security monitoring
- `useAuditRealTime`: Real-time event updates
- `useAuditMaintenance`: System maintenance operations

### Context

- `AuditProvider`: React context provider
- `useAuditContext`: Access audit context
- `withAuditContext`: HOC for audit context

### Middleware

- `APIAuditMiddleware`: API request/response logging
- `StateAuditMiddleware`: State management logging
- `FormAuditMiddleware`: Form interaction logging

## Troubleshooting

### Common Issues

1. **Events Not Being Logged**
   - Check if audit system is enabled
   - Verify user context is set
   - Check if action/entity type is in enabled list

2. **Performance Issues**
   - Increase batch size
   - Exclude read operations
   - Use appropriate log levels

3. **Storage Issues**
   - Set appropriate retention periods
   - Enable compression
   - Regular cleanup of old events

4. **Missing Context**
   - Ensure AuditProvider wraps your app
   - Set user context after authentication
   - Check context is not cleared prematurely

### Debug Mode

Enable debug logging to troubleshoot issues:

```typescript
const config = getAuditConfig('development');
config.logLevel = 'low'; // Log everything
config.enablePerformanceTracking = true; // Track performance
```