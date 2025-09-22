'use client';

import { useEffect, useState } from 'react';
import { getCLS, getFCP, getFID, getLCP, getTTFB } from 'web-vitals';

interface WebVital {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

interface PerformanceData {
  vitals: WebVital[];
  navigationTiming: PerformanceTiming | null;
  resourceTiming: PerformanceResourceTiming[];
}

/**
 * Performance Monitor Component
 * Tracks and displays Core Web Vitals and performance metrics
 */
export default function PerformanceMonitor({ 
  enabled = true,
  showUI = false 
}: { 
  enabled?: boolean;
  showUI?: boolean;
}) {
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    vitals: [],
    navigationTiming: null,
    resourceTiming: []
  });

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const vitals: WebVital[] = [];

    // Collect Core Web Vitals
    const onVital = (vital: any) => {
      const webVital: WebVital = {
        name: vital.name,
        value: vital.value,
        rating: vital.rating,
        timestamp: Date.now()
      };
      
      vitals.push(webVital);
      
      // Send to analytics (replace with your analytics service)
      if (process.env.NODE_ENV === 'production') {
        // Example: Send to Google Analytics
        // gtag('event', vital.name, {
        //   event_category: 'Web Vitals',
        //   value: Math.round(vital.name === 'CLS' ? vital.value * 1000 : vital.value),
        //   event_label: vital.id,
        //   non_interaction: true,
        // });
        
        // Example: Send to custom analytics endpoint
        fetch('/api/analytics/web-vitals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webVital)
        }).catch(console.error);
      }
      
      // Update state for UI display
      setPerformanceData(prev => ({
        ...prev,
        vitals: [...prev.vitals, webVital]
      }));
    };

    // Register Web Vitals observers
    getCLS(onVital);
    getFCP(onVital);
    getFID(onVital);
    getLCP(onVital);
    getTTFB(onVital);

    // Collect navigation timing
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navigationEntries.length > 0) {
        setPerformanceData(prev => ({
          ...prev,
          navigationTiming: navigationEntries[0] as any
        }));
      }

      // Collect resource timing
      const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      setPerformanceData(prev => ({
        ...prev,
        resourceTiming: resourceEntries
      }));
    }

    // Performance observer for additional metrics
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Log performance entries for debugging
          if (process.env.NODE_ENV === 'development') {
            console.log('Performance entry:', entry);
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
      } catch (error) {
        console.warn('Performance Observer not supported:', error);
      }

      return () => observer.disconnect();
    }
  }, [enabled]);

  // Don't render UI in production unless explicitly enabled
  if (!showUI || process.env.NODE_ENV === 'production') {
    return null;
  }

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'text-green-600';
      case 'needs-improvement': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatValue = (name: string, value: number) => {
    if (name === 'CLS') {
      return value.toFixed(3);
    }
    return Math.round(value);
  };

  const getUnit = (name: string) => {
    return name === 'CLS' ? '' : 'ms';
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 max-w-sm z-50 border">
      <h3 className="text-sm font-semibold mb-2">📊 Performance Monitor</h3>
      
      {performanceData.vitals.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-700">Core Web Vitals</h4>
          {performanceData.vitals.map((vital, index) => (
            <div key={index} className="flex justify-between items-center text-xs">
              <span className="font-medium">{vital.name}:</span>
              <span className={getRatingColor(vital.rating)}>
                {formatValue(vital.name, vital.value)}{getUnit(vital.name)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500">Collecting metrics...</p>
      )}

      {performanceData.navigationTiming && (
        <div className="mt-3 pt-2 border-t">
          <h4 className="text-xs font-medium text-gray-700 mb-1">Navigation</h4>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>DOM Load:</span>
              <span>{Math.round(performanceData.navigationTiming.domContentLoadedEventEnd - performanceData.navigationTiming.navigationStart)}ms</span>
            </div>
            <div className="flex justify-between">
              <span>Page Load:</span>
              <span>{Math.round(performanceData.navigationTiming.loadEventEnd - performanceData.navigationTiming.navigationStart)}ms</span>
            </div>
          </div>
        </div>
      )}

      <div className="mt-2 pt-2 border-t">
        <div className="flex justify-between items-center text-xs">
          <span>Resources:</span>
          <span>{performanceData.resourceTiming.length}</span>
        </div>
      </div>
    </div>
  );
}

// Hook for accessing performance data in other components
export function usePerformanceData() {
  const [vitals, setVitals] = useState<WebVital[]>([]);

  useEffect(() => {
    const onVital = (vital: any) => {
      setVitals(prev => [...prev, {
        name: vital.name,
        value: vital.value,
        rating: vital.rating,
        timestamp: Date.now()
      }]);
    };

    getCLS(onVital);
    getFCP(onVital);
    getFID(onVital);
    getLCP(onVital);
    getTTFB(onVital);
  }, []);

  return vitals;
}