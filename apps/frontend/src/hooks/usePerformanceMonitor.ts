import { useEffect, useCallback, useRef } from 'react';

interface PerformanceMetrics {
  componentName: string;
  renderTime: number;
  mountTime: number;
  updateTime?: number;
  interactionTime?: number;
  memoryUsage?: number;
}

interface PerformanceMonitorOptions {
  componentName: string;
  enableMemoryTracking?: boolean;
  enableInteractionTracking?: boolean;
  reportThreshold?: number; // Report if render time exceeds this (ms)
}

export const usePerformanceMonitor = ({
  componentName,
  enableMemoryTracking = false,
  enableInteractionTracking = false,
  reportThreshold = 16, // 60fps = 16.67ms per frame
}: PerformanceMonitorOptions) => {
  const mountTimeRef = useRef<number>(0);
  const renderStartRef = useRef<number>(0);
  const updateCountRef = useRef<number>(0);
  const metricsRef = useRef<PerformanceMetrics[]>([]);

  // Start performance measurement
  const startMeasurement = useCallback(() => {
    renderStartRef.current = performance.now();
  }, []);

  // End performance measurement
  const endMeasurement = useCallback((type: 'mount' | 'update' | 'interaction' = 'update') => {
    const endTime = performance.now();
    const duration = endTime - renderStartRef.current;

    const metrics: PerformanceMetrics = {
      componentName,
      renderTime: duration,
      mountTime: type === 'mount' ? duration : mountTimeRef.current,
    };

    if (type === 'update') {
      metrics.updateTime = duration;
      updateCountRef.current += 1;
    }

    if (type === 'interaction') {
      metrics.interactionTime = duration;
    }

    // Add memory usage if enabled
    if (enableMemoryTracking && 'memory' in performance) {
      metrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
    }

    metricsRef.current.push(metrics);

    // Report if threshold exceeded
    if (duration > reportThreshold) {
      console.warn(`Performance warning: ${componentName} ${type} took ${duration.toFixed(2)}ms`);
    }

    // Log to analytics or monitoring service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'performance_metric', {
        component_name: componentName,
        metric_type: type,
        duration: Math.round(duration),
        custom_parameter_1: updateCountRef.current,
      });
    }

    return metrics;
  }, [componentName, reportThreshold, enableMemoryTracking]);

  // Track component mount
  useEffect(() => {
    mountTimeRef.current = performance.now();
    startMeasurement();

    return () => {
      endMeasurement('mount');
    };
  }, [startMeasurement, endMeasurement]);

  // Measure interaction performance
  const measureInteraction = useCallback((interactionName: string, fn: () => void | Promise<void>) => {
    if (!enableInteractionTracking) {
      return fn();
    }

    const startTime = performance.now();
    
    const result = fn();
    
    if (result instanceof Promise) {
      return result.finally(() => {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        console.log(`Interaction "${interactionName}" in ${componentName} took ${duration.toFixed(2)}ms`);
        
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'interaction_performance', {
            component_name: componentName,
            interaction_name: interactionName,
            duration: Math.round(duration),
          });
        }
      });
    } else {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      console.log(`Interaction "${interactionName}" in ${componentName} took ${duration.toFixed(2)}ms`);
      
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'interaction_performance', {
          component_name: componentName,
          interaction_name: interactionName,
          duration: Math.round(duration),
        });
      }
      
      return result;
    }
  }, [componentName, enableInteractionTracking]);

  // Get performance summary
  const getPerformanceSummary = useCallback(() => {
    const metrics = metricsRef.current;
    if (metrics.length === 0) return null;

    const renderTimes = metrics.map(m => m.renderTime);
    const avgRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
    const maxRenderTime = Math.max(...renderTimes);
    const minRenderTime = Math.min(...renderTimes);

    return {
      componentName,
      totalRenders: metrics.length,
      avgRenderTime: Number(avgRenderTime.toFixed(2)),
      maxRenderTime: Number(maxRenderTime.toFixed(2)),
      minRenderTime: Number(minRenderTime.toFixed(2)),
      updateCount: updateCountRef.current,
      lastMemoryUsage: enableMemoryTracking ? metrics[metrics.length - 1]?.memoryUsage : undefined,
    };
  }, [componentName, enableMemoryTracking]);

  // Clear metrics
  const clearMetrics = useCallback(() => {
    metricsRef.current = [];
    updateCountRef.current = 0;
  }, []);

  // Report Core Web Vitals
  const reportWebVitals = useCallback((metric: any) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        event_category: 'Web Vitals',
        event_label: metric.id,
        non_interaction: true,
      });
    }
  }, []);

  return {
    startMeasurement,
    endMeasurement,
    measureInteraction,
    getPerformanceSummary,
    clearMetrics,
    reportWebVitals,
  };
};

// Performance budget checker
export const usePerformanceBudget = (budgets: Record<string, number>) => {
  const checkBudget = useCallback((metricName: string, value: number) => {
    const budget = budgets[metricName];
    if (budget && value > budget) {
      console.warn(`Performance budget exceeded: ${metricName} (${value}ms) > budget (${budget}ms)`);
      
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'performance_budget_exceeded', {
          metric_name: metricName,
          value: Math.round(value),
          budget: budget,
        });
      }
      
      return false;
    }
    return true;
  }, [budgets]);

  return { checkBudget };
};

// Memory usage tracker
export const useMemoryTracker = () => {
  const getMemoryUsage = useCallback(() => {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
      };
    }
    return null;
  }, []);

  const trackMemoryLeaks = useCallback(() => {
    const initialMemory = getMemoryUsage();
    
    return () => {
      const currentMemory = getMemoryUsage();
      if (initialMemory && currentMemory) {
        const memoryIncrease = currentMemory.usedJSHeapSize - initialMemory.usedJSHeapSize;
        if (memoryIncrease > 1024 * 1024) { // 1MB threshold
          console.warn(`Potential memory leak detected: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB increase`);
        }
      }
    };
  }, [getMemoryUsage]);

  return {
    getMemoryUsage,
    trackMemoryLeaks,
  };
};