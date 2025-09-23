#!/usr/bin/env node

/**
 * Cross-device testing script
 * Runs comprehensive tests across different devices and browsers
 */

const puppeteer = require('puppeteer');
const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// Test configuration
const CONFIG = {
  baseUrl: process.env.TEST_URL || 'http://localhost:3000',
  outputDir: path.join(process.cwd(), 'test-results'),
  timeout: 30000,
  devices: {
    'iPhone SE': puppeteer.devices['iPhone SE'],
    'iPhone 12 Pro': puppeteer.devices['iPhone 12 Pro'],
    'iPad': puppeteer.devices['iPad'],
    'iPad Pro': puppeteer.devices['iPad Pro'],
    'Galaxy S5': puppeteer.devices['Galaxy S5'],
    'Pixel 2': puppeteer.devices['Pixel 2'],
    'Desktop 1920x1080': {
      name: 'Desktop 1920x1080',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      viewport: {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false
      }
    },
    'Desktop 1366x768': {
      name: 'Desktop 1366x768',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      viewport: {
        width: 1366,
        height: 768,
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false
      }
    }
  },
  testPages: [
    { path: '/', name: 'dashboard', critical: true },
    { path: '/login', name: 'login', critical: true },
    { path: '/intern-request', name: 'intern-request', critical: true },
    { path: '/instructor/intern-request', name: 'instructor-requests', critical: false },
    { path: '/visitor/schedule', name: 'visitor-schedule', critical: false },
    { path: '/admin/upload-list', name: 'admin-upload', critical: false },
    { path: '/reports/summary-report', name: 'reports', critical: false },
  ]
};

class CrossDeviceTester {
  constructor() {
    this.browser = null;
    this.results = {
      devices: {},
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        errors: []
      }
    };
  }

  async setup() {
    console.log('🚀 Setting up cross-device testing...');
    
    // Ensure output directory exists
    await fs.mkdir(CONFIG.outputDir, { recursive: true });
    
    // Launch browser
    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-extensions'
      ]
    });

    console.log('✅ Browser launched successfully');
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
      console.log('✅ Browser closed');
    }
  }

  async testDevice(deviceName, deviceConfig) {
    console.log(`\n📱 Testing device: ${deviceName}`);
    
    const page = await this.browser.newPage();
    const deviceResults = {
      name: deviceName,
      config: deviceConfig,
      pages: {},
      performance: {},
      accessibility: {},
      errors: []
    };

    try {
      // Set device configuration
      if (deviceConfig.viewport) {
        await page.setViewport(deviceConfig.viewport);
      } else {
        await page.emulate(deviceConfig);
      }

      if (deviceConfig.userAgent) {
        await page.setUserAgent(deviceConfig.userAgent);
      }

      // Test each page
      for (const testPage of CONFIG.testPages) {
        console.log(`  📄 Testing page: ${testPage.name}`);
        
        try {
          const pageResult = await this.testPage(page, testPage, deviceConfig);
          deviceResults.pages[testPage.name] = pageResult;
          
          if (pageResult.success) {
            this.results.summary.passedTests++;
            console.log(`    ✅ ${testPage.name} - PASSED`);
          } else {
            this.results.summary.failedTests++;
            console.log(`    ❌ ${testPage.name} - FAILED`);
          }
        } catch (error) {
          console.log(`    💥 ${testPage.name} - ERROR: ${error.message}`);
          deviceResults.errors.push({
            page: testPage.name,
            error: error.message,
            stack: error.stack
          });
          this.results.summary.failedTests++;
        }
        
        this.results.summary.totalTests++;
      }

      // Test responsive behavior
      if (deviceConfig.viewport || deviceConfig.name.includes('Desktop')) {
        console.log(`  📐 Testing responsive behavior`);
        const responsiveResult = await this.testResponsiveBehavior(page, deviceConfig);
        deviceResults.responsive = responsiveResult;
      }

      // Test performance
      console.log(`  ⚡ Testing performance`);
      const performanceResult = await this.testPerformance(page, deviceConfig);
      deviceResults.performance = performanceResult;

      // Test accessibility
      console.log(`  ♿ Testing accessibility`);
      const accessibilityResult = await this.testAccessibility(page, deviceConfig);
      deviceResults.accessibility = accessibilityResult;

    } catch (error) {
      console.error(`💥 Device test failed for ${deviceName}:`, error.message);
      deviceResults.errors.push({
        type: 'device_setup',
        error: error.message,
        stack: error.stack
      });
    } finally {
      await page.close();
    }

    this.results.devices[deviceName] = deviceResults;
    return deviceResults;
  }

  async testPage(page, testPage, deviceConfig) {
    const startTime = Date.now();
    const result = {
      success: false,
      loadTime: 0,
      screenshot: null,
      errors: [],
      metrics: {}
    };

    try {
      // Navigate to page
      const response = await page.goto(`${CONFIG.baseUrl}${testPage.path}`, {
        waitUntil: 'networkidle2',
        timeout: CONFIG.timeout
      });

      result.loadTime = Date.now() - startTime;

      // Check if page loaded successfully
      if (!response.ok()) {
        throw new Error(`HTTP ${response.status()}: ${response.statusText()}`);
      }

      // Wait for page to be fully rendered
      await page.waitForTimeout(1000);

      // Take screenshot
      const screenshotPath = path.join(
        CONFIG.outputDir,
        `${testPage.name}-${deviceConfig.name || 'unknown'}.png`
      );
      
      await page.screenshot({
        path: screenshotPath,
        fullPage: true,
        type: 'png'
      });
      
      result.screenshot = screenshotPath;

      // Check for JavaScript errors
      const jsErrors = await page.evaluate(() => {
        return window.__jsErrors || [];
      });

      if (jsErrors.length > 0) {
        result.errors.push(...jsErrors);
      }

      // Test critical elements are present
      const criticalElements = await this.checkCriticalElements(page, testPage);
      result.criticalElements = criticalElements;

      // Test responsive layout
      if (deviceConfig.viewport?.isMobile || deviceConfig.name?.includes('iPhone')) {
        const mobileLayout = await this.checkMobileLayout(page);
        result.mobileLayout = mobileLayout;
      }

      result.success = result.errors.length === 0 && criticalElements.allPresent;

    } catch (error) {
      result.errors.push({
        type: 'page_load',
        message: error.message,
        stack: error.stack
      });
    }

    return result;
  }

  async checkCriticalElements(page, testPage) {
    const elements = {
      navigation: '[data-testid="navigation"], nav, .navbar',
      content: 'main, [role="main"], .main-content',
      footer: 'footer, [role="contentinfo"]'
    };

    const results = {};
    let allPresent = true;

    for (const [name, selector] of Object.entries(elements)) {
      try {
        const element = await page.$(selector);
        results[name] = !!element;
        if (!element) allPresent = false;
      } catch (error) {
        results[name] = false;
        allPresent = false;
      }
    }

    return { ...results, allPresent };
  }

  async checkMobileLayout(page) {
    return await page.evaluate(() => {
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };

      // Check if mobile navigation is visible
      const mobileNav = document.querySelector('[data-testid="mobile-nav"]');
      const desktopNav = document.querySelector('[data-testid="desktop-nav"]');
      
      // Check touch targets
      const buttons = Array.from(document.querySelectorAll('button, a[role="button"]'));
      const touchTargets = buttons.map(btn => {
        const rect = btn.getBoundingClientRect();
        return {
          width: rect.width,
          height: rect.height,
          meetsMinimum: rect.width >= 44 && rect.height >= 44
        };
      });

      const inadequateTouchTargets = touchTargets.filter(t => !t.meetsMinimum).length;

      return {
        viewport,
        mobileNavVisible: mobileNav ? window.getComputedStyle(mobileNav).display !== 'none' : false,
        desktopNavHidden: desktopNav ? window.getComputedStyle(desktopNav).display === 'none' : true,
        touchTargets: touchTargets.length,
        inadequateTouchTargets,
        touchTargetCompliance: inadequateTouchTargets === 0
      };
    });
  }

  async testResponsiveBehavior(page, deviceConfig) {
    const breakpoints = [320, 768, 1024, 1920];
    const results = {};

    for (const width of breakpoints) {
      await page.setViewport({
        width,
        height: 1080,
        deviceScaleFactor: 1
      });

      await page.goto(`${CONFIG.baseUrl}/`, { waitUntil: 'networkidle2' });

      const layout = await page.evaluate(() => {
        const sidebar = document.querySelector('[data-testid="sidebar"]');
        const mobileNav = document.querySelector('[data-testid="mobile-nav"]');
        
        return {
          sidebarVisible: sidebar ? window.getComputedStyle(sidebar).display !== 'none' : false,
          mobileNavVisible: mobileNav ? window.getComputedStyle(mobileNav).display !== 'none' : false,
          bodyWidth: document.body.offsetWidth
        };
      });

      results[`${width}px`] = layout;
    }

    return results;
  }

  async testPerformance(page, deviceConfig) {
    // Enable performance monitoring
    await page.coverage.startJSCoverage();
    await page.coverage.startCSSCoverage();

    const startTime = Date.now();
    
    await page.goto(`${CONFIG.baseUrl}/`, {
      waitUntil: 'networkidle2'
    });

    const loadTime = Date.now() - startTime;

    // Get performance metrics
    const metrics = await page.metrics();
    const jsCoverage = await page.coverage.stopJSCoverage();
    const cssCoverage = await page.coverage.stopCSSCoverage();

    // Calculate bundle sizes and coverage
    const jsTotal = jsCoverage.reduce((acc, entry) => acc + entry.text.length, 0);
    const jsUsed = jsCoverage.reduce((acc, entry) => 
      acc + entry.ranges.reduce((a, r) => a + r.end - r.start, 0), 0);
    
    const cssTotal = cssCoverage.reduce((acc, entry) => acc + entry.text.length, 0);
    const cssUsed = cssCoverage.reduce((acc, entry) => 
      acc + entry.ranges.reduce((a, r) => a + r.end - r.start, 0), 0);

    return {
      loadTime,
      metrics: {
        JSEventListeners: metrics.JSEventListeners,
        Nodes: metrics.Nodes,
        JSHeapUsedSize: metrics.JSHeapUsedSize,
        JSHeapTotalSize: metrics.JSHeapTotalSize
      },
      bundles: {
        jsTotal: Math.round(jsTotal / 1024), // KB
        jsUsed: Math.round(jsUsed / 1024), // KB
        jsCoverage: jsTotal > 0 ? Math.round((jsUsed / jsTotal) * 100) : 0,
        cssTotal: Math.round(cssTotal / 1024), // KB
        cssUsed: Math.round(cssUsed / 1024), // KB
        cssCoverage: cssTotal > 0 ? Math.round((cssUsed / cssTotal) * 100) : 0
      }
    };
  }

  async testAccessibility(page, deviceConfig) {
    // Basic accessibility checks
    const accessibilityIssues = await page.evaluate(() => {
      const issues = [];

      // Check for images without alt text
      const images = Array.from(document.querySelectorAll('img'));
      images.forEach((img, index) => {
        if (!img.alt && !img.getAttribute('aria-label')) {
          issues.push({
            type: 'missing_alt_text',
            element: `img[${index}]`,
            src: img.src
          });
        }
      });

      // Check for buttons without accessible names
      const buttons = Array.from(document.querySelectorAll('button'));
      buttons.forEach((btn, index) => {
        const hasText = btn.textContent.trim().length > 0;
        const hasAriaLabel = btn.getAttribute('aria-label');
        const hasAriaLabelledBy = btn.getAttribute('aria-labelledby');
        
        if (!hasText && !hasAriaLabel && !hasAriaLabelledBy) {
          issues.push({
            type: 'button_no_accessible_name',
            element: `button[${index}]`
          });
        }
      });

      // Check for form inputs without labels
      const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], textarea'));
      inputs.forEach((input, index) => {
        const hasLabel = document.querySelector(`label[for="${input.id}"]`);
        const hasAriaLabel = input.getAttribute('aria-label');
        const hasAriaLabelledBy = input.getAttribute('aria-labelledby');
        
        if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
          issues.push({
            type: 'input_no_label',
            element: `input[${index}]`,
            type_attr: input.type
          });
        }
      });

      return issues;
    });

    return {
      issueCount: accessibilityIssues.length,
      issues: accessibilityIssues,
      passed: accessibilityIssues.length === 0
    };
  }

  async generateReport() {
    console.log('\n📊 Generating test report...');
    
    const reportPath = path.join(CONFIG.outputDir, 'cross-device-report.json');
    const htmlReportPath = path.join(CONFIG.outputDir, 'cross-device-report.html');
    
    // Save JSON report
    await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport();
    await fs.writeFile(htmlReportPath, htmlReport);
    
    console.log(`✅ Reports generated:`);
    console.log(`   JSON: ${reportPath}`);
    console.log(`   HTML: ${htmlReportPath}`);
    
    // Print summary
    this.printSummary();
  }

  generateHTMLReport() {
    const { summary, devices } = this.results;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cross-Device Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .device { border: 1px solid #ddd; margin: 20px 0; padding: 20px; border-radius: 8px; }
        .success { color: #28a745; }
        .error { color: #dc3545; }
        .warning { color: #ffc107; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .screenshot { max-width: 300px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>Cross-Device Test Report</h1>
    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Tests:</strong> ${summary.totalTests}</p>
        <p><strong>Passed:</strong> <span class="success">${summary.passedTests}</span></p>
        <p><strong>Failed:</strong> <span class="error">${summary.failedTests}</span></p>
        <p><strong>Success Rate:</strong> ${((summary.passedTests / summary.totalTests) * 100).toFixed(1)}%</p>
    </div>
    
    ${Object.entries(devices).map(([deviceName, deviceData]) => `
        <div class="device">
            <h2>${deviceName}</h2>
            <h3>Pages Tested</h3>
            <table>
                <tr>
                    <th>Page</th>
                    <th>Status</th>
                    <th>Load Time</th>
                    <th>Errors</th>
                </tr>
                ${Object.entries(deviceData.pages).map(([pageName, pageData]) => `
                    <tr>
                        <td>${pageName}</td>
                        <td class="${pageData.success ? 'success' : 'error'}">
                            ${pageData.success ? '✅ PASS' : '❌ FAIL'}
                        </td>
                        <td>${pageData.loadTime}ms</td>
                        <td>${pageData.errors.length}</td>
                    </tr>
                `).join('')}
            </table>
            
            <h3>Performance</h3>
            <table>
                <tr>
                    <th>Metric</th>
                    <th>Value</th>
                </tr>
                <tr>
                    <td>Load Time</td>
                    <td>${deviceData.performance.loadTime}ms</td>
                </tr>
                <tr>
                    <td>JS Bundle Size</td>
                    <td>${deviceData.performance.bundles?.jsTotal || 0} KB</td>
                </tr>
                <tr>
                    <td>CSS Bundle Size</td>
                    <td>${deviceData.performance.bundles?.cssTotal || 0} KB</td>
                </tr>
                <tr>
                    <td>JS Coverage</td>
                    <td>${deviceData.performance.bundles?.jsCoverage || 0}%</td>
                </tr>
            </table>
            
            <h3>Accessibility</h3>
            <p class="${deviceData.accessibility.passed ? 'success' : 'error'}">
                ${deviceData.accessibility.passed ? '✅ No issues found' : `❌ ${deviceData.accessibility.issueCount} issues found`}
            </p>
        </div>
    `).join('')}
</body>
</html>
    `;
  }

  printSummary() {
    const { summary } = this.results;
    
    console.log('\n📋 Test Summary:');
    console.log('================');
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`Passed: ${summary.passedTests}`);
    console.log(`Failed: ${summary.failedTests}`);
    console.log(`Success Rate: ${((summary.passedTests / summary.totalTests) * 100).toFixed(1)}%`);
    
    if (summary.failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      Object.entries(this.results.devices).forEach(([deviceName, deviceData]) => {
        const failedPages = Object.entries(deviceData.pages)
          .filter(([_, pageData]) => !pageData.success)
          .map(([pageName]) => pageName);
        
        if (failedPages.length > 0) {
          console.log(`  ${deviceName}: ${failedPages.join(', ')}`);
        }
      });
    }
  }

  async run() {
    try {
      await this.setup();
      
      console.log(`🧪 Starting cross-device testing on ${Object.keys(CONFIG.devices).length} devices...`);
      
      for (const [deviceName, deviceConfig] of Object.entries(CONFIG.devices)) {
        await this.testDevice(deviceName, deviceConfig);
      }
      
      await this.generateReport();
      
      console.log('\n🎉 Cross-device testing completed!');
      
      // Exit with error code if tests failed
      if (this.results.summary.failedTests > 0) {
        process.exit(1);
      }
      
    } catch (error) {
      console.error('💥 Cross-device testing failed:', error);
      process.exit(1);
    } finally {
      await this.teardown();
    }
  }
}

// Run the tests if this script is executed directly
if (require.main === module) {
  const tester = new CrossDeviceTester();
  tester.run();
}

module.exports = { CrossDeviceTester, CONFIG };