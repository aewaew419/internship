# Offline Notification Handling

This directory contains the implementation for offline notification handling, providing robust functionality when users are disconnected from the network.

## Components

### 1. Offline Queue (`offline-queue.ts`)
- **Purpose**: Manages queuing of notification actions when offline
- **Features**:
  - Queues actions like mark as read, delete, update settings
  - Exponential backoff retry logic with jitter
  - Persistent storage in localStorage
  - Automatic processing when network is restored
  - Configurable retry limits and delays
  - Queue size management and cleanup

### 2. Offline Storage (`offline-storage.ts`)
- **Purpose**: Provides IndexedDB-based storage for notifications and settings
- **Features**:
  - Stores large notification history efficiently
  - Intelligent cache invalidation
  - Data compression for storage efficiency
  - Filtering and pagination support
  - Statistics and cleanup functionality
  - Fallback for when network is unavailable

### 3. Network Status Manager (`network-status.ts`)
- **Purpose**: Monitors network connectivity and provides retry mechanisms
- **Features**:
  - Real-time network status monitoring
  - Connection quality assessment
  - Automatic retry with exponential backoff
  - Connection stability metrics
  - Network event listeners
  - Connectivity testing

### 4. Network Status Indicator (`NetworkStatusIndicator.tsx`)
- **Purpose**: UI components for displaying network status
- **Features**:
  - Visual network status indicator
  - Offline banner with retry button
  - Detailed network information tooltip
  - Configurable positioning and auto-hide
  - Accessibility support

## Integration

The offline functionality is integrated into the existing `NotificationProvider` to provide:

1. **Optimistic Updates**: UI updates immediately, with rollback on failure
2. **Automatic Queuing**: Actions are queued when offline
3. **Seamless Sync**: Automatic synchronization when network is restored
4. **Fallback Loading**: Load from offline storage when network is unavailable
5. **Error Handling**: Graceful degradation with user feedback

## Usage Examples

### Basic Network Status Monitoring
```typescript
import { useNetworkStatus } from '../lib/notifications/network-status';

function MyComponent() {
  const { isOnline, quality, waitForConnection } = useNetworkStatus();
  
  if (!isOnline) {
    return <div>You're offline. Changes will sync when connection is restored.</div>;
  }
  
  return <div>Connection quality: {quality.level}</div>;
}
```

### Manual Queue Management
```typescript
import { offlineNotificationManager } from '../lib/notifications/offline-queue';

// Queue an action
const actionId = offlineNotificationManager.queueAction('mark_read', { notificationId: '123' });

// Get queue stats
const stats = offlineNotificationManager.getStats();
console.log(`${stats.pendingActions} actions pending`);

// Process queue manually
await offlineNotificationManager.processQueue();
```

### Offline Storage Access
```typescript
import { offlineNotificationStorage } from '../lib/notifications/offline-storage';

// Store notifications for offline access
await offlineNotificationStorage.storeNotifications(notifications);

// Retrieve notifications when offline
const response = await offlineNotificationStorage.getNotifications({
  page: 1,
  limit: 20,
  unreadOnly: true
});
```

### Network Status UI
```typescript
import { NetworkStatusIndicator, NetworkStatusBanner } from '../components/notifications/NetworkStatusIndicator';

function App() {
  return (
    <div>
      <NetworkStatusBanner showRetryButton onRetry={() => window.location.reload()} />
      <NetworkStatusIndicator showDetails position="top-right" />
      {/* Your app content */}
    </div>
  );
}
```

## Configuration

### Offline Queue Configuration
```typescript
const queueConfig = {
  maxQueueSize: 100,
  maxRetries: 3,
  retryDelayMs: 1000,
  maxRetryDelayMs: 30000,
  backoffMultiplier: 2,
  persistenceKey: 'notification_offline_queue',
};
```

### Offline Storage Configuration
```typescript
const storageConfig = {
  dbName: 'NotificationOfflineDB',
  dbVersion: 1,
  maxNotifications: 1000,
  maxCacheAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  compressionEnabled: true,
};
```

### Network Retry Configuration
```typescript
const retryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitterEnabled: true,
};
```

## Requirements Satisfied

This implementation satisfies the following requirements from the specification:

- **6.1**: Offline notification registration queuing and processing
- **6.2**: Graceful handling of connectivity restoration
- **6.3**: Local storage of notifications for offline access
- **6.4**: Synchronization when network is restored
- **6.5**: Network error handling with user feedback

## Performance Considerations

1. **IndexedDB**: Used for efficient storage of large notification datasets
2. **Compression**: Optional data compression for storage efficiency
3. **Batching**: Queue processing is batched to reduce server load
4. **Cleanup**: Automatic cleanup of old data to prevent storage bloat
5. **Lazy Loading**: Components and storage are initialized only when needed

## Browser Compatibility

- **IndexedDB**: Supported in all modern browsers
- **Network Information API**: Progressive enhancement where available
- **Service Workers**: Required for full offline functionality
- **LocalStorage**: Fallback for basic queue persistence

## Error Handling

The system provides comprehensive error handling:

1. **Network Errors**: Automatic queuing and retry
2. **Storage Errors**: Graceful fallback to memory storage
3. **Quota Errors**: Automatic cleanup and user notification
4. **Corruption**: Database recreation and data recovery
5. **Permission Errors**: User-friendly error messages

## Testing

The offline functionality can be tested by:

1. **Network Throttling**: Use browser dev tools to simulate slow/offline connections
2. **Storage Limits**: Test quota exceeded scenarios
3. **Error Injection**: Simulate various error conditions
4. **Cross-tab Testing**: Verify synchronization across multiple tabs
5. **Mobile Testing**: Test on actual mobile devices with poor connectivity