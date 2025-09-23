'use client';

import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

interface PerformanceMonitorProps {
  onMetricsUpdate?: (metrics: Partial<PerformanceMetrics>) => void;
  showDebugInfo?: boolean;
}

export const PerformanceMonitor = ({ 
  onMetricsUpdate,
  showDebugInfo = false 
}: PerformanceMonitorProps) => {
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});
  const [isVisible, setIsVisible] = useState(showDebugInfo);

  useEffect(() => {
    // Web Vitals measurement
    const measureWebVitals = () => {
      // First Contentful Paint
      const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0] as PerformanceEntry;
      if (fcpEntry) {
        const fcp = fcpEntry.startTime;
        updateMetric('fcp', fcp);
      }

      // Time to First Byte
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
        updateMetric('ttfb', ttfb);
      }

      // Largest Contentful Paint
      if ('PerformanceObserver' in window) {
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as any;
            if (lastEntry) {
              updateMetric('lcp', lastEntry.startTime);
            }
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

          // First Input Delay
          const fidObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              updateMetric('fid', entry.processingStart - entry.startTime);
            });
          });
          fidObserver.observe({ entryTypes: ['first-input'] });

          // Cumulative Layout Shift
          const clsObserver = new PerformanceObserver((list) => {
            let clsValue = 0;
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            });
            updateMetric('cls', clsValue);
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });

          // Cleanup observers after 10 seconds
          setTimeout(() => {
            lcpObserver.disconnect();
            fidObserver.disconnect();
            clsObserver.disconnect();
          }, 10000);
        } catch (error) {
          console.warn('Performance Observer not supported:', error);
        }
      }
    };

    const updateMetric = (key: keyof PerformanceMetrics, value: number) => {
      setMetrics(prev => {
        const updated = { ...prev, [key]: value };
        if (onMetricsUpdate) {
          onMetricsUpdate(updated);
        }
        return updated;
      });
    };

    // Start measuring after component mount
    setTimeout(measureWebVitals, 100);

    // Memory usage monitoring (if available)
    const monitorMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        console.log('Memory usage:', {
          used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
          total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
          limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB'
        });
      }
    };

    const memoryInterval = setInterval(monitorMemory, 30000); // Every 30 seconds

    return () => {
      clearInterval(memoryInterval);
    };
  }, [onMetricsUpdate]);

  const getScoreColor = (metric: keyof PerformanceMetrics, value: number) => {
    const thresholds = {
      fcp: { good: 1800, poor: 3000 },
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      ttfb: { good: 800, poor: 1800 }
    };

    const threshold = thresholds[metric];
    if (value <= threshold.good) return 'text-green-600';
    if (value <= threshold.poor) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatValue = (metric: keyof PerformanceMetrics, value: number) => {
    if (metric === 'cls') {
      return value.toFixed(3);
    }
    return Math.round(value) + 'ms';
  };

  const getMetricName = (metric: keyof PerformanceMetrics) => {
    const names = {
      fcp: 'First Contentful Paint',
      lcp: 'Largest Contentful Paint',
      fid: 'First Input Delay',
      cls: 'Cumulative Layout Shift',
      ttfb: 'Time to First Byte'
    };
    return names[metric];
  };

  // Toggle visibility with keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!isVisible || Object.keys(metrics).length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 bg-black bg-opacity-90 text-white p-3 rounded-lg text-xs font-mono z-50 max-w-xs">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Performance</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-1">
        {Object.entries(metrics).map(([key, value]) => (
          <div key={key} className="flex justify-between items-center">
            <span className="text-gray-300">
              {getMetricName(key as keyof PerformanceMetrics)}:
            </span>
            <span className={getScoreColor(key as keyof PerformanceMetrics, value)}>
              {formatValue(key as keyof PerformanceMetrics, value)}
            </span>
          </div>
        ))}
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-600 text-gray-400">
        Press Ctrl+Shift+P to toggle
      </div>
    </div>
  );
};