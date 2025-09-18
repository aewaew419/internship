import { useEffect, useRef, useCallback, useState } from 'react';
import { useRealTimeUpdates, type RealTimeUpdateConfig } from './realTimeUpdates';

// Enhanced synchronization configuration
export interface SynchronizationConfig extends RealTimeUpdateConfig {
  // Enable cross-tab synchronization using BroadcastChannel
  enableCrossTabSync: boolean;
  // Enable WebSocket real-time updates (if available)
  enableWebSocketSync: boolean;
  // Enable service worker background sync
  enableBackgroundSync: boolean;
  // Conflict resolution strategy
  conflictResolution: 'client-wins' | 'server-wins' | 'merge' | 'prompt-user';
}

// Default synchronization configuration
export const DEFAULT_SYNC_CONFIG: SynchronizationConfig = {
  refreshInterval: 30000,
  maxFailures: 3,
  enableAutoRefresh: true,
  refreshOnFocus: true,
  refreshOnOnline: true,
  minRefreshInterval: 5000,
  enableCrossTabSync: true,
  enableWebSocketSync: false,
  enableBackgroundSync: true,
  conflictResolution: 'server-wins'
};

// Data synchronization event types
export type SyncEventType = 
  | 'data-updated' 
  | 'data-conflict' 
  | 'sync-status-changed'
  | 'connection-status-changed';

export interface SyncEvent {
  type: SyncEventType;
  data: any;
  timestamp: Date;
  source: 'local' | 'remote' | 'cross-tab';
}

// Enhanced real-time synchronization hook
export interface RealTimeSynchronizationHook {
  // All properties from RealTimeUpdateHook
  isAutoRefreshing: boolean;
  stalenessInfo: any;
  lastManualRefresh: Date | null;
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;
  triggerManualRefresh: () => Promise<void>;
  resetStaleness: () => void;
  updateConfig: (newConfig: Partial<SynchronizationConfig>) => void;
  
  // Enhanced synchronization properties
  isSyncing: boolean;
  syncStatus: 'idle' | 'syncing' | 'error' | 'conflict';
  connectionStatus: 'online' | 'offline' | 'unstable';
  lastSyncTime: Date | null;
  conflictCount: number;
  
  // Enhanced synchronization methods
  forceSynchronization: () => Promise<void>;
  resolveConflict: (resolution: 'client' | 'server' | 'merge') => Promise<void>;
  enableCrossTabSync: () => void;
  disableCrossTabSync: () => void;
  
  // Event handling
  addEventListener: (type: SyncEventType, listener: (event: SyncEvent) => void) => void;
  removeEventListener: (type: SyncEventType, listener: (event: SyncEvent) => void) => void;
}

/**
 * Enhanced real-time synchronization hook with cross-tab sync and conflict resolution
 */
export const useRealTimeSynchronization = (
  refreshFunction: () => Promise<void>,
  dataKey: string,
  config: Partial<SynchronizationConfig> = {}
): RealTimeSynchronizationHook => {
  const fullConfig = { ...DEFAULT_SYNC_CONFIG, ...config };
  
  // Base real-time updates functionality
  const realTimeUpdates = useRealTimeUpdates(refreshFunction, fullConfig);
  
  // Enhanced synchronization state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error' | 'conflict'>('idle');
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'unstable'>('online');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [conflictCount, setConflictCount] = useState(0);
  
  // Refs for managing synchronization
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const eventListenersRef = useRef<Map<SyncEventType, Set<(event: SyncEvent) => void>>>(new Map());
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize event listeners map
  useEffect(() => {
    const listeners = eventListenersRef.current;
    listeners.set('data-updated', new Set());
    listeners.set('data-conflict', new Set());
    listeners.set('sync-status-changed', new Set());
    listeners.set('connection-status-changed', new Set());
  }, []);
  
  // Emit synchronization events
  const emitSyncEvent = useCallback((type: SyncEventType, data: any, source: 'local' | 'remote' | 'cross-tab' = 'local') => {
    const event: SyncEvent = {
      type,
      data,
      timestamp: new Date(),
      source
    };
    
    const listeners = eventListenersRef.current.get(type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in sync event listener for ${type}:`, error);
        }
      });
    }
  }, []);
  
  // Enhanced refresh function with synchronization
  const enhancedRefreshFunction = useCallback(async () => {
    setIsSyncing(true);
    setSyncStatus('syncing');
    
    try {
      await refreshFunction();
      setLastSyncTime(new Date());
      setSyncStatus('idle');
      emitSyncEvent('data-updated', { success: true });
      
      // Broadcast to other tabs if enabled
      if (fullConfig.enableCrossTabSync && broadcastChannelRef.current) {
        broadcastChannelRef.current.postMessage({
          type: 'data-updated',
          dataKey,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      setSyncStatus('error');
      emitSyncEvent('data-updated', { success: false, error });
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [refreshFunction, fullConfig.enableCrossTabSync, dataKey, emitSyncEvent]);
  
  // Force synchronization
  const forceSynchronization = useCallback(async () => {
    await enhancedRefreshFunction();
  }, [enhancedRefreshFunction]);
  
  // Resolve data conflicts
  const resolveConflict = useCallback(async (resolution: 'client' | 'server' | 'merge') => {
    setSyncStatus('syncing');
    
    try {
      // Implementation would depend on specific conflict resolution strategy
      // For now, we'll just refresh the data
      await enhancedRefreshFunction();
      setConflictCount(prev => Math.max(0, prev - 1));
      setSyncStatus('idle');
    } catch (error) {
      setSyncStatus('error');
      throw error;
    }
  }, [enhancedRefreshFunction]);
  
  // Cross-tab synchronization setup
  const enableCrossTabSync = useCallback(() => {
    if (!fullConfig.enableCrossTabSync || broadcastChannelRef.current) return;
    
    try {
      const channel = new BroadcastChannel(`sync-${dataKey}`);
      
      channel.addEventListener('message', (event) => {
        const { type, dataKey: eventDataKey, timestamp } = event.data;
        
        if (eventDataKey === dataKey && type === 'data-updated') {
          // Another tab updated the data, refresh our view
          emitSyncEvent('data-updated', { source: 'cross-tab', timestamp }, 'cross-tab');
          realTimeUpdates.triggerManualRefresh();
        }
      });
      
      broadcastChannelRef.current = channel;
    } catch (error) {
      console.warn('BroadcastChannel not supported or failed to initialize:', error);
    }
  }, [fullConfig.enableCrossTabSync, dataKey, emitSyncEvent, realTimeUpdates]);
  
  const disableCrossTabSync = useCallback(() => {
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.close();
      broadcastChannelRef.current = null;
    }
  }, []);
  
  // Connection status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus('online');
      emitSyncEvent('connection-status-changed', { status: 'online' });
    };
    
    const handleOffline = () => {
      setConnectionStatus('offline');
      emitSyncEvent('connection-status-changed', { status: 'offline' });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Set initial status
    setConnectionStatus(navigator.onLine ? 'online' : 'offline');
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [emitSyncEvent]);
  
  // Initialize cross-tab sync
  useEffect(() => {
    if (fullConfig.enableCrossTabSync) {
      enableCrossTabSync();
    }
    
    return () => {
      disableCrossTabSync();
    };
  }, [fullConfig.enableCrossTabSync, enableCrossTabSync, disableCrossTabSync]);
  
  // Event listener management
  const addEventListener = useCallback((type: SyncEventType, listener: (event: SyncEvent) => void) => {
    const listeners = eventListenersRef.current.get(type);
    if (listeners) {
      listeners.add(listener);
    }
  }, []);
  
  const removeEventListener = useCallback((type: SyncEventType, listener: (event: SyncEvent) => void) => {
    const listeners = eventListenersRef.current.get(type);
    if (listeners) {
      listeners.delete(listener);
    }
  }, []);
  
  // Enhanced config update
  const updateConfig = useCallback((newConfig: Partial<SynchronizationConfig>) => {
    realTimeUpdates.updateConfig(newConfig);
    
    // Handle cross-tab sync config changes
    if (newConfig.enableCrossTabSync !== undefined) {
      if (newConfig.enableCrossTabSync) {
        enableCrossTabSync();
      } else {
        disableCrossTabSync();
      }
    }
  }, [realTimeUpdates, enableCrossTabSync, disableCrossTabSync]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      disableCrossTabSync();
    };
  }, [disableCrossTabSync]);
  
  return {
    // Base real-time updates functionality
    ...realTimeUpdates,
    
    // Enhanced synchronization properties
    isSyncing,
    syncStatus,
    connectionStatus,
    lastSyncTime,
    conflictCount,
    
    // Enhanced synchronization methods
    forceSynchronization,
    resolveConflict,
    enableCrossTabSync,
    disableCrossTabSync,
    
    // Event handling
    addEventListener,
    removeEventListener,
    
    // Override updateConfig with enhanced version
    updateConfig
  };
};

/**
 * Hook for managing data synchronization across multiple components
 */
export const useDataSynchronization = (dataKey: string) => {
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  
  const broadcastUpdate = useCallback(() => {
    const now = new Date();
    setLastUpdateTime(now);
    setUpdateCount(prev => prev + 1);
    
    // Broadcast to other components
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const channel = new BroadcastChannel(`data-sync-${dataKey}`);
        channel.postMessage({
          type: 'data-updated',
          timestamp: now.toISOString(),
          updateCount: updateCount + 1
        });
        channel.close();
      } catch (error) {
        console.warn('Failed to broadcast data update:', error);
      }
    }
  }, [dataKey, updateCount]);
  
  const subscribeToUpdates = useCallback((callback: (timestamp: Date, count: number) => void) => {
    if (typeof BroadcastChannel === 'undefined') return () => {};
    
    try {
      const channel = new BroadcastChannel(`data-sync-${dataKey}`);
      
      const handleMessage = (event: MessageEvent) => {
        const { type, timestamp, updateCount } = event.data;
        if (type === 'data-updated') {
          callback(new Date(timestamp), updateCount);
        }
      };
      
      channel.addEventListener('message', handleMessage);
      
      return () => {
        channel.removeEventListener('message', handleMessage);
        channel.close();
      };
    } catch (error) {
      console.warn('Failed to subscribe to data updates:', error);
      return () => {};
    }
  }, [dataKey]);
  
  return {
    lastUpdateTime,
    updateCount,
    broadcastUpdate,
    subscribeToUpdates
  };
};