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
        // Desktop configuration
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
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        'categories:pwa': 'off',
        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        // Bundle size related
        'unused-javascript': ['warn', { maxNumericValue: 100000 }],
        'unminified-javascript': 'error',
        'unminified-css': 'error',
        'render-blocking-resources': ['warn', { maxNumericValue: 500 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};