/**
 * Visual regression testing for cross-device compatibility
 * Uses Puppeteer to capture screenshots across different devices
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { promises as fs } from 'fs';
import path from 'path';

// Device configurations for visual testing
const VISUAL_TEST_DEVICES = {
  'iPhone SE': {
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
  },
  'iPhone 12 Pro': {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
  },
  'iPad': {
    width: 768,
    height: 1024,
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
  },
  'iPad Pro': {
    width: 1024,
    height: 1366,
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
  },
  'Desktop': {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  'Small Desktop': {
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
};

// Pages to test across devices
const TEST_PAGES = [
  { path: '/', name: 'dashboard' },
  { path: '/login', name: 'login' },
  { path: '/intern-request', name: 'intern-request' },
  { path: '/instructor/intern-request', name: 'instructor-requests' },
  { path: '/visitor/schedule', name: 'visitor-schedule' },
  { path: '/admin/upload-list', name: 'admin-upload' },
];

class VisualRegressionTester {
  private browser: Browser | null = null;
  private baseUrl: string;
  private screenshotDir: string;

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.screenshotDir = path.join(process.cwd(), 'screenshots');
  }

  async setup(): Promise<void> {
    // Ensure screenshot directory exists
    await fs.mkdir(this.screenshotDir, { recursive: true });

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
        '--disable-gpu'
      ]
    });
  }

  async teardown(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async captureScreenshots(): Promise<void> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call setup() first.');
    }

    for (const [deviceName, deviceConfig] of Object.entries(VISUAL_TEST_DEVICES)) {
      console.log(`Testing on ${deviceName}...`);
      
      const page = await this.browser.newPage();
      
      // Set viewport and user agent
      await page.setViewport({
        width: deviceConfig.width,
        height: deviceConfig.height,
        deviceScaleFactor: deviceConfig.deviceScaleFactor,
        isMobile: deviceConfig.isMobile,
        hasTouch: deviceConfig.hasTouch
      });
      
      await page.setUserAgent(deviceConfig.userAgent);

      // Test each page
      for (const testPage of TEST_PAGES) {
        try {
          console.log(`  Capturing ${testPage.name} on ${deviceName}...`);
          
          await page.goto(`${this.baseUrl}${testPage.path}`, {
            waitUntil: 'networkidle2',
            timeout: 30000
          });

          // Wait for any animations to complete
          await page.waitForTimeout(1000);

          // Take screenshot
          const screenshotPath = path.join(
            this.screenshotDir,
            `${testPage.name}-${deviceName.toLowerCase().replace(/\s+/g, '-')}.png`
          );

          await page.screenshot({
            path: screenshotPath,
            fullPage: true,
            type: 'png'
          });

          console.log(`    Screenshot saved: ${screenshotPath}`);
        } catch (error) {
          console.error(`    Error capturing ${testPage.name} on ${deviceName}:`, error);
        }
      }

      await page.close();
    }
  }

  async testResponsiveBreakpoints(): Promise<void> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call setup() first.');
    }

    const page = await this.browser.newPage();
    
    // Test breakpoints: 320px, 768px, 1024px, 1920px
    const breakpoints = [320, 768, 1024, 1920];
    
    for (const width of breakpoints) {
      console.log(`Testing breakpoint: ${width}px`);
      
      await page.setViewport({
        width,
        height: 1080,
        deviceScaleFactor: 1
      });

      await page.goto(`${this.baseUrl}/`, {
        waitUntil: 'networkidle2'
      });

      // Test navigation visibility
      const navElements = await page.evaluate(() => {
        const mobileNav = document.querySelector('[data-testid="mobile-nav"]');
        const desktopNav = document.querySelector('[data-testid="desktop-nav"]');
        const sidebar = document.querySelector('[data-testid="sidebar"]');
        
        return {
          mobileNavVisible: mobileNav ? window.getComputedStyle(mobileNav).display !== 'none' : false,
          desktopNavVisible: desktopNav ? window.getComputedStyle(desktopNav).display !== 'none' : false,
          sidebarVisible: sidebar ? window.getComputedStyle(sidebar).display !== 'none' : false
        };
      });

      console.log(`  Navigation state at ${width}px:`, navElements);

      // Take screenshot of breakpoint
      const screenshotPath = path.join(
        this.screenshotDir,
        `breakpoint-${width}px.png`
      );

      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      });
    }

    await page.close();
  }

  async testTouchInteractions(): Promise<void> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call setup() first.');
    }

    const page = await this.browser.newPage();
    
    // Set mobile viewport
    await page.setViewport({
      width: 375,
      height: 667,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    });

    await page.goto(`${this.baseUrl}/`, {
      waitUntil: 'networkidle2'
    });

    // Test touch targets
    const touchTargets = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, a, input[type="button"], input[type="submit"]'));
      
      return buttons.map(element => {
        const rect = element.getBoundingClientRect();
        const styles = window.getComputedStyle(element);
        
        return {
          tagName: element.tagName,
          width: rect.width,
          height: rect.height,
          minHeight: parseInt(styles.minHeight) || 0,
          minWidth: parseInt(styles.minWidth) || 0,
          padding: styles.padding,
          isAccessible: rect.width >= 44 && rect.height >= 44
        };
      });
    });

    console.log('Touch target analysis:', touchTargets);

    // Test swipe gestures (if implemented)
    try {
      await page.touchscreen.tap(100, 100);
      console.log('Touch interaction successful');
    } catch (error) {
      console.log('Touch interaction not available or failed:', error);
    }

    await page.close();
  }

  async testPerformanceAcrossDevices(): Promise<void> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call setup() first.');
    }

    const performanceResults: any[] = [];

    for (const [deviceName, deviceConfig] of Object.entries(VISUAL_TEST_DEVICES)) {
      const page = await this.browser.newPage();
      
      await page.setViewport({
        width: deviceConfig.width,
        height: deviceConfig.height,
        deviceScaleFactor: deviceConfig.deviceScaleFactor,
        isMobile: deviceConfig.isMobile,
        hasTouch: deviceConfig.hasTouch
      });

      // Enable performance monitoring
      await page.coverage.startJSCoverage();
      await page.coverage.startCSSCoverage();

      const startTime = Date.now();
      
      await page.goto(`${this.baseUrl}/`, {
        waitUntil: 'networkidle2'
      });

      const loadTime = Date.now() - startTime;

      // Get performance metrics
      const metrics = await page.metrics();
      const jsCoverage = await page.coverage.stopJSCoverage();
      const cssCoverage = await page.coverage.stopCSSCoverage();

      // Calculate coverage
      const jsUsed = jsCoverage.reduce((acc, entry) => acc + entry.ranges.reduce((a, r) => a + r.end - r.start, 0), 0);
      const jsTotal = jsCoverage.reduce((acc, entry) => acc + entry.text.length, 0);
      const cssUsed = cssCoverage.reduce((acc, entry) => acc + entry.ranges.reduce((a, r) => a + r.end - r.start, 0), 0);
      const cssTotal = cssCoverage.reduce((acc, entry) => acc + entry.text.length, 0);

      performanceResults.push({
        device: deviceName,
        loadTime,
        metrics,
        jsCoverage: jsTotal > 0 ? (jsUsed / jsTotal) * 100 : 0,
        cssCoverage: cssTotal > 0 ? (cssUsed / cssTotal) * 100 : 0
      });

      await page.close();
    }

    // Save performance results
    const resultsPath = path.join(this.screenshotDir, 'performance-results.json');
    await fs.writeFile(resultsPath, JSON.stringify(performanceResults, null, 2));
    
    console.log('Performance results saved to:', resultsPath);
    console.table(performanceResults.map(r => ({
      Device: r.device,
      'Load Time (ms)': r.loadTime,
      'JS Coverage (%)': r.jsCoverage.toFixed(2),
      'CSS Coverage (%)': r.cssCoverage.toFixed(2)
    })));
  }
}

// Jest test suite
describe('Visual Regression Testing', () => {
  let tester: VisualRegressionTester;

  beforeAll(async () => {
    tester = new VisualRegressionTester();
    await tester.setup();
  }, 30000);

  afterAll(async () => {
    await tester.teardown();
  });

  test('should capture screenshots across all devices', async () => {
    await tester.captureScreenshots();
  }, 120000);

  test('should test responsive breakpoints', async () => {
    await tester.testResponsiveBreakpoints();
  }, 60000);

  test('should test touch interactions on mobile', async () => {
    await tester.testTouchInteractions();
  }, 30000);

  test('should measure performance across devices', async () => {
    await tester.testPerformanceAcrossDevices();
  }, 120000);
});

export { VisualRegressionTester, VISUAL_TEST_DEVICES };