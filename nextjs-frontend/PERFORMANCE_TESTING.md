# Performance Testing for Mobile Optimization

This document outlines the comprehensive performance testing setup for the Next.js mobile-first application.

## Overview

The performance testing suite includes:
- **Lighthouse CI** for mobile performance auditing
- **Core Web Vitals** testing on real mobile devices
- **Bundle size analysis** for mobile network optimization
- **Continuous monitoring** and reporting

## Quick Start

### Prerequisites

```bash
# Install dependencies
npm install

# Install Lighthouse CI globally (optional)
npm install -g @lhci/cli
```

### Running Tests

```bash
# Run all performance tests
npm run perf:full

# Run individual test suites
npm run perf:bundle      # Bundle size analysis
npm run perf:vitals      # Web Vitals testing
npm run lighthouse:mobile # Lighthouse mobile audit

# For CI environments (skip build step)
npm run perf:ci
```

## Test Suites

### 1. Lighthouse CI Mobile Testing

**Purpose:** Comprehensive mobile performance auditing using Google Lighthouse.

**Configuration:** `lighthouserc.mobile.js`

**Key Metrics:**
- Performance Score (target: >75%)
- First Contentful Paint (<1.8s)
- Largest Contentful Paint (<2.5s)
- Cumulative Layout Shift (<0.1)
- Total Blocking Time (<200ms)

**Mobile-Specific Checks:**
- Touch target sizing
- Viewport configuration
- Content width optimization
- Image optimization

```bash
# Run mobile Lighthouse tests
npm run lighthouse:mobile

# View results
open .lighthouseci/
```

### 2. Core Web Vitals Testing

**Purpose:** Real-world performance measurement on mobile devices using Puppeteer.

**Script:** `scripts/test-web-vitals.js`

**Tested Devices:**
- iPhone 12/13/14
- Google Pixel 5/6
- Samsung Galaxy S21/S22

**Network Conditions:**
- Slow 4G (1.5 Mbps, 150ms latency)
- CPU throttling (4x slowdown)

**Metrics Measured:**
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- First Input Delay (FID)
- Cumulative Layout Shift (CLS)
- Time to First Byte (TTFB)

```bash
# Run Web Vitals tests
npm run perf:vitals

# Ensure server is running first
npm run start &
npm run perf:vitals
```

### 3. Bundle Size Analysis

**Purpose:** Analyze JavaScript and CSS bundle sizes for mobile network optimization.

**Script:** `scripts/analyze-bundle.js`

**Thresholds:**
- Total JS: <250KB
- First Load JS: <200KB
- Individual Chunks: <50KB
- CSS: <50KB

**Analysis Includes:**
- Load time estimates for different network speeds
- Parse time estimation for mobile devices
- Gzip compression analysis
- Chunk size optimization recommendations

```bash
# Run bundle analysis
npm run perf:bundle

# View detailed bundle analyzer
npm run analyze
```

## Configuration

### Performance Thresholds

Edit `performance.config.js` to customize thresholds:

```javascript
module.exports = {
  webVitals: {
    FCP: { good: 1800, needsImprovement: 3000 },
    LCP: { good: 2500, needsImprovement: 4000 },
    // ... more thresholds
  },
  bundleSize: {
    totalJS: { good: 200, warning: 250, critical: 350 },
    // ... more thresholds
  }
};
```

### Test URLs

Configure test URLs in `performance.config.js`:

```javascript
testUrls: [
  '/',
  '/login',
  '/intern-request',
  '/instructor/intern-request',
  // Add more URLs to test
]
```

### Mobile Devices

Add or modify test devices:

```javascript
testDevices: [
  'iPhone 12',
  'Pixel 5',
  'Galaxy S21',
  // Add more devices
]
```

## Continuous Integration

### GitHub Actions

The performance testing is integrated with GitHub Actions:

**Workflow:** `.github/workflows/performance-ci.yml`

**Triggers:**
- Push to main/develop branches
- Pull requests
- Daily scheduled runs (2 AM UTC)

**Artifacts:**
- Lighthouse reports
- Bundle analysis reports
- Performance test results

### Performance Budgets

The CI will fail if:
- Performance score drops below 70%
- Bundle size increases by >15%
- Core Web Vitals exceed thresholds

## Real-Time Monitoring

### Performance Monitor Component

Add to your app for real-time monitoring:

```tsx
import PerformanceMonitor from '@/components/performance/PerformanceMonitor';

export default function App() {
  return (
    <>
      {/* Your app content */}
      <PerformanceMonitor 
        enabled={true} 
        showUI={process.env.NODE_ENV === 'development'} 
      />
    </>
  );
}
```

### Web Vitals API

Collect performance data via API endpoint:

```
POST /api/analytics/web-vitals
GET /api/analytics/web-vitals?timeframe=24h&metric=LCP
```

## Optimization Recommendations

### Bundle Size Optimization

1. **Code Splitting**
   ```tsx
   const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
     loading: () => <Spinner />
   });
   ```

2. **Tree Shaking**
   ```javascript
   // Import only what you need
   import { debounce } from 'lodash/debounce';
   // Instead of: import _ from 'lodash';
   ```

3. **Dynamic Imports**
   ```tsx
   const handleClick = async () => {
     const { heavyFunction } = await import('./heavyModule');
     heavyFunction();
   };
   ```

### Performance Optimization

1. **Image Optimization**
   ```tsx
   import Image from 'next/image';
   
   <Image
     src="/image.jpg"
     alt="Description"
     width={300}
     height={200}
     priority={isAboveFold}
   />
   ```

2. **Font Optimization**
   ```tsx
   import { Inter } from 'next/font/google';
   
   const inter = Inter({ subsets: ['latin'] });
   ```

3. **Preloading Critical Resources**
   ```tsx
   <link rel="preload" href="/critical.css" as="style" />
   <link rel="preconnect" href="https://api.example.com" />
   ```

## Troubleshooting

### Common Issues

1. **Server Not Running**
   ```bash
   # Ensure server is running before tests
   npm run start &
   sleep 10
   npm run perf:vitals
   ```

2. **Puppeteer Issues**
   ```bash
   # Install Chromium dependencies (Linux)
   sudo apt-get install -y chromium-browser
   
   # Or use system Chrome
   export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
   export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
   ```

3. **Memory Issues**
   ```bash
   # Increase Node.js memory limit
   export NODE_OPTIONS="--max-old-space-size=4096"
   ```

### Debug Mode

Enable debug logging:

```bash
# Enable Lighthouse debug
DEBUG=lhci:* npm run lighthouse:mobile

# Enable Puppeteer debug
DEBUG=puppeteer:* npm run perf:vitals
```

## Reports and Analytics

### Generated Reports

- **JSON Report:** `performance-reports/performance-report.json`
- **HTML Report:** `performance-reports/performance-report.html`
- **Bundle Report:** `bundle-analysis-report.json`
- **Lighthouse Reports:** `.lighthouseci/`

### Integration with Analytics

The setup supports integration with:
- Google Analytics 4
- Sentry Performance Monitoring
- DataDog RUM
- Custom analytics endpoints

## Best Practices

1. **Run tests on every deployment**
2. **Monitor performance trends over time**
3. **Set up alerts for performance regressions**
4. **Test on real devices when possible**
5. **Consider network conditions of your users**
6. **Optimize for the 75th percentile of users**

## Resources

- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse Performance Auditing](https://developers.google.com/web/tools/lighthouse)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Bundle Analysis](https://nextjs.org/docs/advanced-features/analyzing-bundles)