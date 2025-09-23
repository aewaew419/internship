/**
 * Performance Testing Configuration for Mobile Optimization
 * Centralizes all performance testing settings and thresholds
 */

module.exports = {
  // Core Web Vitals thresholds for mobile
  webVitals: {
    // First Contentful Paint (ms)
    FCP: {
      good: 1800,
      needsImprovement: 3000,
      poor: Infinity
    },
    // Largest Contentful Paint (ms)
    LCP: {
      good: 2500,
      needsImprovement: 4000,
      poor: Infinity
    },
    // First Input Delay (ms)
    FID: {
      good: 100,
      needsImprovement: 300,
      poor: Infinity
    },
    // Cumulative Layout Shift
    CLS: {
      good: 0.1,
      needsImprovement: 0.25,
      poor: Infinity
    },
    // Time to First Byte (ms)
    TTFB: {
      good: 800,
      needsImprovement: 1800,
      poor: Infinity
    },
    // Speed Index (ms)
    SI: {
      good: 3400,
      needsImprovement: 5800,
      poor: Infinity
    }
  },

  // Bundle size thresholds (KB)
  bundleSize: {
    totalJS: {
      good: 200,
      warning: 250,
      critical: 350
    },
    firstLoadJS: {
      good: 150,
      warning: 200,
      critical: 300
    },
    individualChunk: {
      good: 30,
      warning: 50,
      critical: 100
    },
    css: {
      good: 30,
      warning: 50,
      critical: 100
    }
  },

  // Network conditions for testing
  networkConditions: {
    slow3G: {
      offline: false,
      downloadThroughput: 500 * 1024 / 8, // 500 Kbps
      uploadThroughput: 500 * 1024 / 8,
      latency: 400
    },
    regular3G: {
      offline: false,
      downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
      uploadThroughput: 750 * 1024 / 8, // 750 Kbps
      latency: 150
    },
    fast4G: {
      offline: false,
      downloadThroughput: 4 * 1024 * 1024 / 8, // 4 Mbps
      uploadThroughput: 3 * 1024 * 1024 / 8, // 3 Mbps
      latency: 20
    }
  },

  // Mobile devices to test
  testDevices: [
    'iPhone 12',
    'iPhone 13',
    'iPhone 14',
    'Pixel 5',
    'Pixel 6',
    'Galaxy S21',
    'Galaxy S22'
  ],

  // Test URLs (relative to base URL)
  testUrls: [
    '/',
    '/login',
    '/intern-request',
    '/intern-request/register-personal-info',
    '/instructor/intern-request',
    '/visitor/schedule',
    '/admin/upload-list'
  ],

  // Lighthouse configuration
  lighthouse: {
    // Number of runs for each test
    numberOfRuns: 3,
    
    // Performance budget
    budget: {
      performance: 75,
      accessibility: 95,
      bestPractices: 85,
      seo: 90,
      pwa: 70
    },
    
    // Mobile-specific settings
    mobile: {
      formFactor: 'mobile',
      throttling: {
        rttMs: 150,
        throughputKbps: 1638.4,
        cpuSlowdownMultiplier: 4,
        requestLatencyMs: 150 * 3.75,
        downloadThroughputKbps: 1638.4,
        uploadThroughputKbps: 675
      },
      screenEmulation: {
        mobile: true,
        width: 375,
        height: 667,
        deviceScaleFactor: 2,
        disabled: false
      }
    },
    
    // Desktop settings for comparison
    desktop: {
      formFactor: 'desktop',
      throttling: {
        rttMs: 40,
        throughputKbps: 10240,
        cpuSlowdownMultiplier: 1,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0
      },
      screenEmulation: {
        mobile: false,
        width: 1350,
        height: 940,
        deviceScaleFactor: 1,
        disabled: false
      }
    }
  },

  // Performance monitoring settings
  monitoring: {
    // Continuous monitoring intervals
    intervals: {
      development: 300000, // 5 minutes
      staging: 900000,     // 15 minutes
      production: 1800000  // 30 minutes
    },
    
    // Alert thresholds
    alerts: {
      performanceScore: 70,
      loadTime: 5000,
      bundleIncrease: 20 // Percentage increase
    }
  },

  // CI/CD integration settings
  ci: {
    // Fail build if performance drops below threshold
    failOnPerformance: true,
    performanceThreshold: 70,
    
    // Fail build if bundle size increases significantly
    failOnBundleIncrease: true,
    bundleIncreaseThreshold: 15, // Percentage
    
    // Generate performance reports
    generateReports: true,
    reportFormats: ['json', 'html', 'csv']
  }
};