'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { NotificationPerformanceMonitor } from '../lib/notifications/NotificationOptimizer';
import { notificationCache } from '../lib/notifications/NotificationCache';
import { notificationBatcher } from '../lib/notifications/NotificationBatcher';
import { usePerformanceMonitor } from '../lib/performance';

interface PerformanceMetrics {
  renderTime: number;
  filterTime: number;
  cacheHitRate: number;
  batchEfficiency: number;
  memoryUsage: number;
}

interface NotificationPerformanceConfig {
  enableMonitoring: boolean;
  enableCaching: boolean;
  enableBatching: boolean;
  reportInterval: number; // milliseconds
}

export function useNotificationPerformance(
  config: Partial<NotificationPerformanceConfig> = {}
) {
  const {
    enableMonitoring = true,
    enableCaching = true,
    enableBatching = true,
    reportInterval = 30000, // 30 seconds
  } = config;

  const { mark, measure } = usePerformanceMonitor();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    filterTime: 0,
    cacheHitRate: 0,
    batchEfficiency: 0,
    memoryUsage: 0,
  });
  
  const metricsRef = useRef<PerformanceMetrics>(metrics);
  const reportTimerRef = useRef<NodeJS.Timeout>();

  // Update metrics reference
  useEffect(() => {
    metricsRef.current = metrics;
  }, [metrics]);

  // Start performance monitoring
  useEffect(() => {
    if (!enableMonitoring) return;

    const updateMetrics = () => {
      const newMetrics: PerformanceMetrics = {
        renderTime: 0,
        filterTime: 0,
        cacheHitRate: 0,
        batchEfficiency: 0,
        memoryUsage: 0,
      };

      // Get render performance
      const renderStats = NotificationPerformanceMonitor.getStats('notification-rendering');
      if (renderStats) {
        newMetrics.renderTime = renderStats.average;
      }

      // Get filter performance
      const filterStats = NotificationPerformanceMonitor.getStats('notification-filtering');
      if (filterStats) {
        newMetrics.filterTime = filterStats.average;
      }

      // Get cache performance
      if (enableCaching) {
        const cacheStats = notificationCache.getStats();
        newMetrics.cacheHitRate = cacheStats.hitRate;
        newMetrics.memoryUsage = cacheStats.memoryUsage;
      }

      // Get batch efficiency (simplified metric)
      if (enableBatching) {
        // This would be more sophisticated in a real implementation
        newMetrics.batchEfficiency = 0.85; // Placeholder
      }

      setMetrics(newMetrics);
    };

    // Update metrics immediately
    updateMetrics();

    // Set up periodic updates
    reportTimerRef.current = setInterval(updateMetrics, reportInterval);

    return () => {
      if (reportTimerRef.current) {
        clearInterval(reportTimerRef.current);
      }
    };
  }, [enableMonitoring, enableCaching, enableBatching, reportInterval]);

  // Measure notification rendering performance
  const measureRender = useCallback(<T>(fn: () => T): T => {
    if (!enableMonitoring) return fn();

    return NotificationPerformanceMonitor.measure('notification-rendering', fn);
  }, [enableMonitoring]);

  // Measure notification filtering performance
  const measureFilter = useCallback(<T>(fn: () => T): T => {
    if (!enableMonitoring) return fn();

    return NotificationPerformanceMonitor.measure('notification-filtering', fn);
  }, [enableMonitoring]);

  // Measure async operations
  const measureAsync = useCallback(async <T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    if (!enableMonitoring) return fn();

    return NotificationPerformanceMonitor.measureAsync(operation, fn);
  }, [enableMonitoring]);

  // Get detailed performance stats
  const getDetailedStats = useCallback(() => {
    return NotificationPerformanceMonitor.getAllStats();
  }, []);

  // Get cache efficiency
  const getCacheEfficiency = useCallback(() => {
    if (!enableCaching) return null;
    
    return notificationCache.getCacheEfficiency();
  }, [enableCaching]);

  // Clear performance metrics
  const clearMetrics = useCallback(() => {
    NotificationPerformanceMonitor.clearMetrics();
    setMetrics({
      renderTime: 0,
      filterTime: 0,
      cacheHitRate: 0,
      batchEfficiency: 0,
      memoryUsage: 0,
    });
  }, []);

  // Performance recommendations based on metrics
  const getRecommendations = useCallback((): string[] => {
    const recommendations: string[] = [];
    const currentMetrics = metricsRef.current;

    if (currentMetrics.renderTime > 16) { // 60fps threshold
      recommendations.push('Consider reducing notification item complexity or enabling virtualization');
    }

    if (currentMetrics.filterTime > 10) {
      recommendations.push('Consider optimizing filter logic or using search indexing');
    }

    if (enableCaching && currentMetrics.cacheHitRate < 0.7) {
      recommendations.push('Cache hit rate is low. Consider adjusting cache TTL or size');
    }

    if (currentMetrics.memoryUsage > 50 * 1024 * 1024) { // 50MB
      recommendations.push('Memory usage is high. Consider reducing cache size or enabling compression');
    }

    if (enableBatching && currentMetrics.batchEfficiency < 0.8) {
      recommendations.push('Batch efficiency is low. Consider adjusting batch size or timeout');
    }

    return recommendations;
  }, [enableCaching, enableBatching]);

  // Performance grade based on metrics
  const getPerformanceGrade = useCallback((): 'A' | 'B' | 'C' | 'D' | 'F' => {
    const currentMetrics = metricsRef.current;
    let score = 100;

    // Render time penalty
    if (currentMetrics.renderTime > 16) {
      score -= Math.min(30, (currentMetrics.renderTime - 16) * 2);
    }

    // Filter time penalty
    if (currentMetrics.filterTime > 10) {
      score -= Math.min(20, (currentMetrics.filterTime - 10) * 1.5);
    }

    // Cache hit rate bonus/penalty
    if (enableCaching) {
      if (currentMetrics.cacheHitRate > 0.8) {
        score += 10;
      } else if (currentMetrics.cacheHitRate < 0.5) {
        score -= 15;
      }
    }

    // Memory usage penalty
    const memoryMB = currentMetrics.memoryUsage / (1024 * 1024);
    if (memoryMB > 100) {
      score -= Math.min(25, (memoryMB - 100) * 0.5);
    }

    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }, [enableCaching]);

  return {
    metrics,
    measureRender,
    measureFilter,
    measureAsync,
    getDetailedStats,
    getCacheEfficiency,
    clearMetrics,
    getRecommendations,
    getPerformanceGrade,
    isMonitoring: enableMonitoring,
  };
}

// Hook for monitoring notification list performance specifically
export function useNotificationListPerformance() {
  const [listMetrics, setListMetrics] = useState({
    itemsRendered: 0,
    scrollPerformance: 0,
    updateFrequency: 0,
    lastUpdate: Date.now(),
  });

  const updateCountRef = useRef(0);
  const lastUpdateRef = useRef(Date.now());

  // Track list updates
  const trackUpdate = useCallback(() => {
    const now = Date.now();
    updateCountRef.current++;
    
    setListMetrics(prev => ({
      ...prev,
      updateFrequency: updateCountRef.current / ((now - lastUpdateRef.current) / 1000),
      lastUpdate: now,
    }));
  }, []);

  // Track items rendered
  const trackItemsRendered = useCallback((count: number) => {
    setListMetrics(prev => ({
      ...prev,
      itemsRendered: count,
    }));
  }, []);

  // Track scroll performance
  const trackScrollPerformance = useCallback((fps: number) => {
    setListMetrics(prev => ({
      ...prev,
      scrollPerformance: fps,
    }));
  }, []);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    updateCountRef.current = 0;
    lastUpdateRef.current = Date.now();
    setListMetrics({
      itemsRendered: 0,
      scrollPerformance: 0,
      updateFrequency: 0,
      lastUpdate: Date.now(),
    });
  }, []);

  return {
    listMetrics,
    trackUpdate,
    trackItemsRendered,
    trackScrollPerformance,
    resetMetrics,
  };
}

// Hook for notification cache warming
export function useNotificationCacheWarming() {
  const [isWarming, setIsWarming] = useState(false);
  const [warmupProgress, setWarmupProgress] = useState(0);

  const warmupCache = useCallback(async (
    notificationIds: string[],
    onProgress?: (progress: number) => void
  ) => {
    if (isWarming) return;

    setIsWarming(true);
    setWarmupProgress(0);

    try {
      const batchSize = 10;
      const batches = [];
      
      for (let i = 0; i < notificationIds.length; i += batchSize) {
        batches.push(notificationIds.slice(i, i + batchSize));
      }

      for (let i = 0; i < batches.length; i++) {
        await notificationCache.warmupCache(batches[i]);
        
        const progress = ((i + 1) / batches.length) * 100;
        setWarmupProgress(progress);
        
        if (onProgress) {
          onProgress(progress);
        }

        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } finally {
      setIsWarming(false);
      setWarmupProgress(100);
    }
  }, [isWarming]);

  return {
    warmupCache,
    isWarming,
    warmupProgress,
  };
}