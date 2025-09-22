#!/usr/bin/env node

/**
 * Production verification script
 * Validates that the production build works correctly
 */

const puppeteer = require('puppeteer');
const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class ProductionVerifier {
  constructor() {
    this.baseUrl = process.env.VERIFY_URL || 'http://localhost:3000';
    this.browser = null;
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async setup() {
    console.log('🔧 Setting up production verification...');
    
    // Launch browser
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    console.log('✅ Browser launched');
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
      console.log('✅ Browser closed');
    }
  }

  async runTest(testName, testFn) {
    console.log(`🧪 Running test: ${testName}`);
    
    try {
      const startTime = Date.now();
      await testFn();
      const duration = Date.now() - startTime;
      
      this.results.passed++;
      this.results.tests.push({
        name: testName,
        status: 'passed',
        duration,
        error: null
      });
      
      console.log(`  ✅ ${testName} - PASSED (${duration}ms)`);
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({
        name: testName,
        status: 'failed',
        duration: 0,
        error: error.message
      });
      
      console.log(`  ❌ ${testName} - FAILED: ${error.message}`);
    }
  }

  async verifyHealthEndpoint() {
    const response = await fetch(`${this.baseUrl}/api/health`);
    
    if (!response.ok) {
      throw new Error(`Health endpoint returned ${response.status}`);
    }
    
    const health = await response.json();
    
    if (health.status !== 'healthy') {
      throw new Error(`Application is not healthy: ${health.status}`);
    }
    
    console.log(`    Health status: ${health.status}`);
    console.log(`    Version: ${health.version}`);
    console.log(`    Uptime: ${health.uptime}s`);
  }

  async verifyPageLoading() {
    const page = await this.browser.newPage();
    
    try {
      const response = await page.goto(this.baseUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });
      
      if (!response.ok()) {
        throw new Error(`Page returned ${response.status()}`);
      }
      
      // Check if page has basic content
      const title = await page.title();
      if (!title || title.includes('Error')) {
        throw new Error('Page title indicates an error');
      }
      
      console.log(`    Page title: ${title}`);
      
      // Check for critical elements
      const hasNavigation = await page.$('nav, [role="navigation"]');
      if (!hasNavigation) {
        throw new Error('Navigation element not found');
      }
      
      console.log('    Navigation element found');
      
    } finally {
      await page.close();
    }
  }

  async verifyResponsiveDesign() {
    const page = await this.browser.newPage();
    
    try {
      // Test mobile viewport
      await page.setViewport({ width: 375, height: 667 });
      await page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
      
      // Check if mobile navigation is working
      const mobileNav = await page.evaluate(() => {
        const nav = document.querySelector('[data-testid="mobile-nav"]');
        return nav ? window.getComputedStyle(nav).display !== 'none' : false;
      });
      
      console.log(`    Mobile navigation visible: ${mobileNav}`);
      
      // Test desktop viewport
      await page.setViewport({ width: 1920, height: 1080 });
      await page.reload({ waitUntil: 'networkidle2' });
      
      const desktopLayout = await page.evaluate(() => {
        const sidebar = document.querySelector('[data-testid="sidebar"]');
        return sidebar ? window.getComputedStyle(sidebar).display !== 'none' : false;
      });
      
      console.log(`    Desktop sidebar visible: ${desktopLayout}`);
      
    } finally {
      await page.close();
    }
  }

  async verifyStaticAssets() {
    const page = await this.browser.newPage();
    
    try {
      // Enable request interception to check assets
      await page.setRequestInterception(true);
      
      const failedAssets = [];
      
      page.on('request', request => {
        request.continue();
      });
      
      page.on('response', response => {
        const url = response.url();
        const status = response.status();
        
        // Check static assets
        if (url.includes('/_next/static/') && status >= 400) {
          failedAssets.push({ url, status });
        }
      });
      
      await page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
      
      if (failedAssets.length > 0) {
        throw new Error(`Failed to load assets: ${failedAssets.map(a => `${a.url} (${a.status})`).join(', ')}`);
      }
      
      console.log('    All static assets loaded successfully');
      
    } finally {
      await page.close();
    }
  }

  async verifyPerformance() {
    const page = await this.browser.newPage();
    
    try {
      // Enable performance monitoring
      await page.coverage.startJSCoverage();
      await page.coverage.startCSSCoverage();
      
      const startTime = Date.now();
      await page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
      const loadTime = Date.now() - startTime;
      
      // Get performance metrics
      const metrics = await page.metrics();
      
      console.log(`    Load time: ${loadTime}ms`);
      console.log(`    JS Heap: ${Math.round(metrics.JSHeapUsedSize / 1024 / 1024)}MB`);
      console.log(`    DOM Nodes: ${metrics.Nodes}`);
      
      // Check if load time is reasonable
      if (loadTime > 5000) {
        throw new Error(`Load time too slow: ${loadTime}ms`);
      }
      
      // Stop coverage
      await page.coverage.stopJSCoverage();
      await page.coverage.stopCSSCoverage();
      
    } finally {
      await page.close();
    }
  }

  async verifyServiceWorker() {
    const page = await this.browser.newPage();
    
    try {
      await page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
      
      // Check if service worker is registered
      const swRegistered = await page.evaluate(async () => {
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          return !!registration;
        }
        return false;
      });
      
      console.log(`    Service worker registered: ${swRegistered}`);
      
      // In production, service worker should be registered
      if (process.env.NODE_ENV === 'production' && !swRegistered) {
        console.warn('    Warning: Service worker not registered in production');
      }
      
    } finally {
      await page.close();
    }
  }

  async verifySecurityHeaders() {
    const response = await fetch(this.baseUrl);
    const headers = response.headers;
    
    const securityHeaders = {
      'x-frame-options': headers.get('x-frame-options'),
      'x-content-type-options': headers.get('x-content-type-options'),
      'x-xss-protection': headers.get('x-xss-protection'),
      'strict-transport-security': headers.get('strict-transport-security'),
      'content-security-policy': headers.get('content-security-policy')
    };
    
    console.log('    Security headers:');
    Object.entries(securityHeaders).forEach(([name, value]) => {
      console.log(`      ${name}: ${value || 'Not set'}`);
    });
    
    // Check for critical security headers
    if (!securityHeaders['x-frame-options']) {
      console.warn('    Warning: X-Frame-Options header not set');
    }
    
    if (!securityHeaders['x-content-type-options']) {
      console.warn('    Warning: X-Content-Type-Options header not set');
    }
  }

  async verifyEnvironmentVariables() {
    // Check if critical environment variables are set
    const requiredVars = [
      'NODE_ENV',
      'NEXT_PUBLIC_API_BASE_URL'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
    }
    
    console.log(`    NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`    API URL: ${process.env.NEXT_PUBLIC_API_BASE_URL}`);
  }

  async generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      baseUrl: this.baseUrl,
      summary: {
        total: this.results.passed + this.results.failed,
        passed: this.results.passed,
        failed: this.results.failed,
        successRate: this.results.passed / (this.results.passed + this.results.failed) * 100
      },
      tests: this.results.tests
    };
    
    const reportPath = path.join(process.cwd(), 'production-verification-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📊 Verification Report:`);
    console.log(`   Total tests: ${report.summary.total}`);
    console.log(`   Passed: ${report.summary.passed}`);
    console.log(`   Failed: ${report.summary.failed}`);
    console.log(`   Success rate: ${report.summary.successRate.toFixed(1)}%`);
    console.log(`   Report saved: ${reportPath}`);
    
    return report;
  }

  async run() {
    try {
      console.log('🚀 Starting production verification...\n');
      
      await this.setup();
      
      // Run all verification tests
      await this.runTest('Health Endpoint', () => this.verifyHealthEndpoint());
      await this.runTest('Page Loading', () => this.verifyPageLoading());
      await this.runTest('Responsive Design', () => this.verifyResponsiveDesign());
      await this.runTest('Static Assets', () => this.verifyStaticAssets());
      await this.runTest('Performance', () => this.verifyPerformance());
      await this.runTest('Service Worker', () => this.verifyServiceWorker());
      await this.runTest('Security Headers', () => this.verifySecurityHeaders());
      await this.runTest('Environment Variables', () => this.verifyEnvironmentVariables());
      
      const report = await this.generateReport();
      
      if (this.results.failed > 0) {
        console.log('\n❌ Production verification failed!');
        console.log('Failed tests:');
        this.results.tests
          .filter(test => test.status === 'failed')
          .forEach(test => console.log(`  - ${test.name}: ${test.error}`));
        
        process.exit(1);
      } else {
        console.log('\n🎉 Production verification passed!');
        console.log('Your application is ready for production use.');
      }
      
    } catch (error) {
      console.error('\n💥 Production verification failed:', error.message);
      process.exit(1);
    } finally {
      await this.teardown();
    }
  }
}

// Run verification if this script is executed directly
if (require.main === module) {
  const verifier = new ProductionVerifier();
  verifier.run();
}

module.exports = { ProductionVerifier };