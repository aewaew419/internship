'use client';

// Performance monitoring and optimization utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();
  private observers: Map<string, PerformanceObserver> = new Map();

  private constructor() {
    this.initializeObservers();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initializeObservers(): void {
    if (typeof window === 'undefined') return;

    // Core Web Vitals observer
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.set('LCP', lastEntry.startTime);
        this.reportMetric('LCP', lastEntry.startTime);
      });

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('LCP', lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          const fid = entry.processingStart - entry.startTime;
          this.metrics.set('FID', fid);
          this.reportMetric('FID', fid);
        });
      });

      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('FID', fidObserver);
      } catch (e) {
        console.warn('FID observer not supported');
      }

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.metrics.set('CLS', clsValue);
        this.reportMetric('CLS', clsValue);
      });

      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.set('CLS', clsObserver);
      } catch (e) {
        console.warn('CLS observer not supported');
      }
    }

    // Navigation timing
    this.measureNavigationTiming();
  }

  private measureNavigationTiming(): void {
    if (typeof window === 'undefined' || !window.performance) return;

    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        const metrics = {
          'DNS': navigation.domainLookupEnd - navigation.domainLookupStart,
          'TCP': navigation.connectEnd - navigation.connectStart,
          'TTFB': navigation.responseStart - navigation.requestStart,
          'Download': navigation.responseEnd - navigation.responseStart,
          'DOM': navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          'Load': navigation.loadEventEnd - navigation.loadEventStart,
        };

        Object.entries(metrics).forEach(([key, value]) => {
          this.metrics.set(key, value);
          this.reportMetric(key, value);
        });
      }
    });
  }

  private reportMetric(name: string, value: number): void {
    // In production, send to analytics service
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance metric - ${name}: ${value.toFixed(2)}ms`);
    }

    // Send to analytics (example)
    // this.sendToAnalytics(name, value);
  }

  // Measure custom performance marks
  mark(name: string): void {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(name);
    }
  }

  // Measure time between marks
  measure(name: string, startMark: string, endMark?: string): number {
    if (typeof window === 'undefined' || !window.performance) return 0;

    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name, 'measure')[0];
      this.metrics.set(name, measure.duration);
      this.reportMetric(name, measure.duration);
      return measure.duration;
    } catch (e) {
      console.warn(`Failed to measure ${name}:`, e);
      return 0;
    }
  }

  // Get all metrics
  getMetrics(): Map<string, number> {
    return new Map(this.metrics);
  }

  // Clear all metrics
  clearMetrics(): void {
    this.metrics.clear();
    if (typeof window !== 'undefined' && window.performance) {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }

  // Disconnect all observers
  disconnect(): void {
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers.clear();
  }
}

// Resource loading optimization
export class ResourceOptimizer {
  private static loadedResources: Set<string> = new Set();

  // Preload critical resources
  static preloadResource(href: string, as: string, crossorigin?: string): void {
    if (typeof document === 'undefined' || this.loadedResources.has(href)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (crossorigin) link.crossOrigin = crossorigin;
    
    document.head.appendChild(link);
    this.loadedResources.add(href);
  }

  // Prefetch resources for next navigation
  static prefetchResource(href: string): void {
    if (typeof document === 'undefined' || this.loadedResources.has(href)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    
    document.head.appendChild(link);
    this.loadedResources.add(href);
  }

  // Lazy load images with intersection observer
  static lazyLoadImages(): void {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          if (src) {
            img.src = src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img);
    });
  }

  // Optimize font loading
  static optimizeFontLoading(): void {
    if (typeof document === 'undefined') return;

    // Preload critical fonts
    const criticalFonts = [
      '/fonts/bai-jamjuree-400.woff2',
      '/fonts/bai-jamjuree-500.woff2',
    ];

    criticalFonts.forEach((font) => {
      this.preloadResource(font, 'font', 'anonymous');
    });
  }
}

// Bundle size analyzer
export class BundleAnalyzer {
  static analyzeBundle(): void {
    if (typeof window === 'undefined') return;

    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));

    console.group('Bundle Analysis');
    console.log(`Scripts: ${scripts.length}`);
    console.log(`Stylesheets: ${styles.length}`);

    // Estimate bundle sizes (simplified)
    let totalScriptSize = 0;
    let totalStyleSize = 0;

    scripts.forEach((script: any) => {
      if (script.src.includes('_next/static')) {
        // Estimate size based on filename patterns
        totalScriptSize += this.estimateFileSize(script.src);
      }
    });

    styles.forEach((style: any) => {
      if (style.href.includes('_next/static')) {
        totalStyleSize += this.estimateFileSize(style.href);
      }
    });

    console.log(`Estimated JS size: ${(totalScriptSize / 1024).toFixed(2)} KB`);
    console.log(`Estimated CSS size: ${(totalStyleSize / 1024).toFixed(2)} KB`);
    console.groupEnd();
  }

  private static estimateFileSize(url: string): number {
    // This is a rough estimation - in production you'd want actual file sizes
    if (url.includes('main')) return 50000; // 50KB
    if (url.includes('vendor')) return 100000; // 100KB
    if (url.includes('chunk')) return 20000; // 20KB
    return 10000; // 10KB default
  }
}

// React hooks for performance monitoring
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance();

  return {
    mark: (name: string) => monitor.mark(name),
    measure: (name: string, startMark: string, endMark?: string) => 
      monitor.measure(name, startMark, endMark),
    getMetrics: () => monitor.getMetrics(),
    clearMetrics: () => monitor.clearMetrics(),
  };
}

export function useResourceOptimizer() {
  return {
    preloadResource: ResourceOptimizer.preloadResource,
    prefetchResource: ResourceOptimizer.prefetchResource,
    lazyLoadImages: ResourceOptimizer.lazyLoadImages,
    optimizeFontLoading: ResourceOptimizer.optimizeFontLoading,
  };
}