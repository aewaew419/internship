module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'ready on',
      startServerReadyTimeout: 30000,
      url: [
        'http://localhost:3000',
        'http://localhost:3000/login',
        'http://localhost:3000/intern-request',
        'http://localhost:3000/instructor/intern-request',
        'http://localhost:3000/visitor/schedule',
        'http://localhost:3000/admin/upload-list'
      ],
      numberOfRuns: 3,
      settings: {
        // Mobile configuration
        formFactor: 'mobile',
        throttling: {
          // Simulate slow 4G connection
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
        },
        // Additional mobile-specific settings
        emulatedUserAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1'
      }
    },
    assert: {
      assertions: {
        // Stricter mobile performance requirements
        'categories:performance': ['error', { minScore: 0.75 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.85 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'categories:pwa': ['warn', { minScore: 0.7 }],
        
        // Core Web Vitals - Mobile thresholds
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        'speed-index': ['warn', { maxNumericValue: 3400 }],
        
        // Mobile-specific performance metrics
        'interactive': ['warn', { maxNumericValue: 3800 }],
        'first-meaningful-paint': ['warn', { maxNumericValue: 1600 }],
        
        // Resource optimization
        'unused-javascript': ['warn', { maxNumericValue: 50000 }],
        'unused-css-rules': ['warn', { maxNumericValue: 20000 }],
        'unminified-javascript': 'error',
        'unminified-css': 'error',
        'render-blocking-resources': ['error', { maxNumericValue: 300 }],
        'uses-optimized-images': 'warn',
        'uses-webp-images': 'warn',
        'uses-responsive-images': 'warn',
        'efficient-animated-content': 'warn',
        
        // Mobile UX
        'tap-targets': 'error',
        'content-width': 'error',
        'viewport': 'error',
        
        // Network efficiency
        'uses-text-compression': 'warn',
        'uses-rel-preconnect': 'warn',
        'preload-lcp-image': 'warn'
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};