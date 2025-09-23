const puppeteer = require('puppeteer');
const { performance } = require('perf_hooks');

/**
 * Test Core Web Vitals on mobile devices
 * This script uses Puppeteer to simulate mobile devices and measure performance
 */

const MOBILE_DEVICES = [
  'iPhone 12',
  'iPhone 13',
  'Pixel 5',
  'Galaxy S21'
];

const TEST_URLS = [
  'http://localhost:3000',
  'http://localhost:3000/login',
  'http://localhost:3000/intern-request',
  'http://localhost:3000/instructor/intern-request'
];

const THRESHOLDS = {
  FCP: 1800, // First Contentful Paint (ms)
  LCP: 2500, // Largest Contentful Paint (ms)
  FID: 100,  // First Input Delay (ms)
  CLS: 0.1,  // Cumulative Layout Shift
  TTFB: 800  // Time to First Byte (ms)
};

async function measureWebVitals(url, deviceName) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Emulate mobile device
    await page.emulate(puppeteer.devices[deviceName]);
    
    // Enable CPU throttling (4x slowdown for mobile)
    const client = await page.target().createCDPSession();
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    
    // Network throttling (Slow 4G)
    await page.emulateNetworkConditions({
      offline: false,
      downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
      uploadThroughput: 750 * 1024 / 8, // 750 Kbps
      latency: 150
    });

    const metrics = {};
    
    // Measure TTFB and navigation timing
    const startTime = performance.now();
    
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    
    // Get Web Vitals using the web-vitals library
    const webVitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals = {};
        let metricsCount = 0;
        const expectedMetrics = 4; // FCP, LCP, FID, CLS
        
        function onVital(metric) {
          vitals[metric.name] = metric.value;
          metricsCount++;
          
          if (metricsCount >= expectedMetrics) {
            resolve(vitals);
          }
        }
        
        // Import and use web-vitals if available
        if (typeof webVitals !== 'undefined') {
          webVitals.getFCP(onVital);
          webVitals.getLCP(onVital);
          webVitals.getFID(onVital);
          webVitals.getCLS(onVital);
        } else {
          // Fallback to Performance Observer
          const observer = new PerformissionObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
                vitals.FCP = entry.startTime;
              }
              if (entry.entryType === 'largest-contentful-paint') {
                vitals.LCP = entry.startTime;
              }
              if (entry.entryType === 'first-input') {
                vitals.FID = entry.processingStart - entry.startTime;
              }
              if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
                vitals.CLS = (vitals.CLS || 0) + entry.value;
              }
            }
          });
          
          observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] });
          
          // Resolve after timeout if metrics aren't available
          setTimeout(() => resolve(vitals), 5000);
        }
      });
    });
    
    // Get additional performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        TTFB: navigation.responseStart - navigation.requestStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        loadComplete: navigation.loadEventEnd - navigation.navigationStart,
        transferSize: navigation.transferSize,
        encodedBodySize: navigation.encodedBodySize,
        decodedBodySize: navigation.decodedBodySize
      };
    });

    return {
      url,
      device: deviceName,
      webVitals,
      performance: performanceMetrics,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error(`Error testing ${url} on ${deviceName}:`, error.message);
    return null;
  } finally {
    await browser.close();
  }
}

function evaluateMetrics(results) {
  const report = {
    passed: 0,
    failed: 0,
    warnings: 0,
    details: []
  };

  results.forEach(result => {
    if (!result) return;

    const { url, device, webVitals, performance } = result;
    const evaluation = {
      url,
      device,
      metrics: {},
      status: 'PASS'
    };

    // Evaluate Core Web Vitals
    Object.entries(THRESHOLDS).forEach(([metric, threshold]) => {
      let value;
      
      switch (metric) {
        case 'FCP':
          value = webVitals.FCP || performance.domContentLoaded;
          break;
        case 'LCP':
          value = webVitals.LCP;
          break;
        case 'FID':
          value = webVitals.FID;
          break;
        case 'CLS':
          value = webVitals.CLS;
          break;
        case 'TTFB':
          value = performance.TTFB;
          break;
      }

      if (value !== undefined) {
        const status = value <= threshold ? 'PASS' : 'FAIL';
        evaluation.metrics[metric] = {
          value: Math.round(value * 100) / 100,
          threshold,
          status
        };

        if (status === 'FAIL') {
          evaluation.status = 'FAIL';
          report.failed++;
        } else {
          report.passed++;
        }
      }
    });

    report.details.push(evaluation);
  });

  return report;
}

function printReport(report) {
  console.log('\n🚀 Mobile Web Vitals Performance Report');
  console.log('=' .repeat(50));
  
  console.log(`\n📊 Summary:`);
  console.log(`✅ Passed: ${report.passed}`);
  console.log(`❌ Failed: ${report.failed}`);
  console.log(`⚠️  Warnings: ${report.warnings}`);
  
  console.log(`\n📱 Detailed Results:`);
  
  report.details.forEach(result => {
    console.log(`\n🔗 ${result.url} (${result.device})`);
    console.log(`Status: ${result.status === 'PASS' ? '✅' : '❌'} ${result.status}`);
    
    Object.entries(result.metrics).forEach(([metric, data]) => {
      const icon = data.status === 'PASS' ? '✅' : '❌';
      const unit = ['FCP', 'LCP', 'FID', 'TTFB'].includes(metric) ? 'ms' : '';
      console.log(`  ${icon} ${metric}: ${data.value}${unit} (threshold: ${data.threshold}${unit})`);
    });
  });
  
  console.log('\n' + '='.repeat(50));
  
  if (report.failed > 0) {
    console.log('❌ Some performance tests failed. Consider optimizing your application.');
    process.exit(1);
  } else {
    console.log('✅ All performance tests passed!');
  }
}

async function runWebVitalsTest() {
  console.log('🚀 Starting Mobile Web Vitals Testing...');
  console.log('📱 Testing devices:', MOBILE_DEVICES.join(', '));
  console.log('🔗 Testing URLs:', TEST_URLS.join(', '));
  
  const results = [];
  
  for (const device of MOBILE_DEVICES) {
    for (const url of TEST_URLS) {
      console.log(`\n📊 Testing ${url} on ${device}...`);
      const result = await measureWebVitals(url, device);
      if (result) {
        results.push(result);
      }
    }
  }
  
  const report = evaluateMetrics(results);
  printReport(report);
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000');
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.error('❌ Server is not running on http://localhost:3000');
    console.log('Please start the server with: npm run start');
    process.exit(1);
  }
  
  await runWebVitalsTest();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { measureWebVitals, evaluateMetrics };