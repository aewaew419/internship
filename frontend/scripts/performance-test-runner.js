const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const performanceConfig = require('../performance.config');

/**
 * Comprehensive Performance Test Runner
 * Orchestrates all performance testing activities
 */

class PerformanceTestRunner {
  constructor(options = {}) {
    this.config = performanceConfig;
    this.options = {
      skipBuild: false,
      skipLighthouse: false,
      skipWebVitals: false,
      skipBundleAnalysis: false,
      outputDir: './performance-reports',
      ...options
    };
    
    this.results = {
      timestamp: new Date().toISOString(),
      lighthouse: null,
      webVitals: null,
      bundleAnalysis: null,
      summary: {
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
  }

  async run() {
    console.log('🚀 Starting Comprehensive Performance Testing Suite');
    console.log('=' .repeat(60));
    
    try {
      // Ensure output directory exists
      this.ensureOutputDir();
      
      // Step 1: Build the application
      if (!this.options.skipBuild) {
        await this.buildApplication();
      }
      
      // Step 2: Start the server
      const serverProcess = await this.startServer();
      
      try {
        // Wait for server to be ready
        await this.waitForServer();
        
        // Step 3: Run bundle analysis
        if (!this.options.skipBundleAnalysis) {
          await this.runBundleAnalysis();
        }
        
        // Step 4: Run Lighthouse tests
        if (!this.options.skipLighthouse) {
          await this.runLighthouseTests();
        }
        
        // Step 5: Run Web Vitals tests
        if (!this.options.skipWebVitals) {
          await this.runWebVitalsTests();
        }
        
        // Step 6: Generate comprehensive report
        await this.generateReport();
        
      } finally {
        // Clean up: stop the server
        if (serverProcess) {
          serverProcess.kill();
        }
      }
      
    } catch (error) {
      console.error('❌ Performance testing failed:', error.message);
      process.exit(1);
    }
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }
  }

  async buildApplication() {
    console.log('\n🔨 Building application...');
    try {
      execSync('npm run build', { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Build completed successfully');
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`);
    }
  }

  async startServer() {
    console.log('\n🚀 Starting server...');
    
    const serverProcess = spawn('npm', ['run', 'start'], {
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('ready on')) {
        console.log('✅ Server started successfully');
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.error('Server error:', data.toString());
    });
    
    return serverProcess;
  }

  async waitForServer(maxAttempts = 30) {
    console.log('⏳ Waiting for server to be ready...');
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch('http://localhost:3000');
        if (response.ok) {
          console.log('✅ Server is ready');
          return;
        }
      } catch (error) {
        // Server not ready yet
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Server failed to start within timeout period');
  }

  async runBundleAnalysis() {
    console.log('\n📦 Running bundle analysis...');
    
    try {
      const { generateBundleReport } = require('./analyze-bundle');
      const success = generateBundleReport();
      
      this.results.bundleAnalysis = {
        passed: success,
        timestamp: new Date().toISOString()
      };
      
      if (success) {
        console.log('✅ Bundle analysis passed');
        this.results.summary.passed++;
      } else {
        console.log('❌ Bundle analysis failed');
        this.results.summary.failed++;
      }
      
    } catch (error) {
      console.error('❌ Bundle analysis error:', error.message);
      this.results.summary.failed++;
    }
  }

  async runLighthouseTests() {
    console.log('\n🔍 Running Lighthouse performance tests...');
    
    try {
      // Run mobile Lighthouse tests
      execSync('npm run lighthouse:mobile', {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      this.results.lighthouse = {
        mobile: true,
        passed: true,
        timestamp: new Date().toISOString()
      };
      
      console.log('✅ Lighthouse tests completed');
      this.results.summary.passed++;
      
    } catch (error) {
      console.error('❌ Lighthouse tests failed:', error.message);
      this.results.lighthouse = {
        mobile: true,
        passed: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      this.results.summary.failed++;
    }
  }

  async runWebVitalsTests() {
    console.log('\n📊 Running Web Vitals tests...');
    
    try {
      const { measureWebVitals, evaluateMetrics } = require('./test-web-vitals');
      
      const results = [];
      const devices = this.config.testDevices.slice(0, 2); // Limit for CI
      const urls = this.config.testUrls.slice(0, 3); // Limit for CI
      
      for (const device of devices) {
        for (const url of urls) {
          const fullUrl = `http://localhost:3000${url}`;
          console.log(`  📱 Testing ${url} on ${device}...`);
          
          const result = await measureWebVitals(fullUrl, device);
          if (result) {
            results.push(result);
          }
        }
      }
      
      const report = evaluateMetrics(results);
      
      this.results.webVitals = {
        results,
        report,
        passed: report.failed === 0,
        timestamp: new Date().toISOString()
      };
      
      if (report.failed === 0) {
        console.log('✅ Web Vitals tests passed');
        this.results.summary.passed++;
      } else {
        console.log(`❌ Web Vitals tests failed: ${report.failed} failures`);
        this.results.summary.failed++;
      }
      
      if (report.warnings > 0) {
        this.results.summary.warnings += report.warnings;
      }
      
    } catch (error) {
      console.error('❌ Web Vitals tests error:', error.message);
      this.results.webVitals = {
        passed: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
      this.results.summary.failed++;
    }
  }

  async generateReport() {
    console.log('\n📄 Generating comprehensive performance report...');
    
    const reportData = {
      ...this.results,
      config: this.config,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        timestamp: new Date().toISOString()
      }
    };
    
    // Save JSON report
    const jsonReportPath = path.join(this.options.outputDir, 'performance-report.json');
    fs.writeFileSync(jsonReportPath, JSON.stringify(reportData, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport(reportData);
    const htmlReportPath = path.join(this.options.outputDir, 'performance-report.html');
    fs.writeFileSync(htmlReportPath, htmlReport);
    
    // Print summary
    this.printSummary();
    
    console.log(`\n📁 Reports saved to:`);
    console.log(`  📄 JSON: ${jsonReportPath}`);
    console.log(`  🌐 HTML: ${htmlReportPath}`);
  }

  generateHTMLReport(data) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        .pass { color: #28a745; }
        .fail { color: #dc3545; }
        .warn { color: #ffc107; }
        .metric { display: flex; justify-content: space-between; margin: 5px 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Performance Test Report</h1>
        <p><strong>Generated:</strong> ${data.timestamp}</p>
        <p><strong>Summary:</strong> 
            <span class="pass">✅ ${data.summary.passed} Passed</span> | 
            <span class="fail">❌ ${data.summary.failed} Failed</span> | 
            <span class="warn">⚠️ ${data.summary.warnings} Warnings</span>
        </p>
    </div>

    <div class="section">
        <h2>📦 Bundle Analysis</h2>
        <p class="${data.bundleAnalysis?.passed ? 'pass' : 'fail'}">
            Status: ${data.bundleAnalysis?.passed ? '✅ Passed' : '❌ Failed'}
        </p>
    </div>

    <div class="section">
        <h2>🔍 Lighthouse Tests</h2>
        <p class="${data.lighthouse?.passed ? 'pass' : 'fail'}">
            Status: ${data.lighthouse?.passed ? '✅ Passed' : '❌ Failed'}
        </p>
    </div>

    <div class="section">
        <h2>📱 Web Vitals Tests</h2>
        <p class="${data.webVitals?.passed ? 'pass' : 'fail'}">
            Status: ${data.webVitals?.passed ? '✅ Passed' : '❌ Failed'}
        </p>
        ${data.webVitals?.report ? `
        <table>
            <tr><th>URL</th><th>Device</th><th>Status</th><th>Metrics</th></tr>
            ${data.webVitals.report.details.map(detail => `
            <tr>
                <td>${detail.url}</td>
                <td>${detail.device}</td>
                <td class="${detail.status === 'PASS' ? 'pass' : 'fail'}">${detail.status}</td>
                <td>${Object.entries(detail.metrics).map(([key, metric]) => 
                    `${key}: ${metric.value}${['FCP','LCP','FID','TTFB'].includes(key) ? 'ms' : ''}`
                ).join(', ')}</td>
            </tr>
            `).join('')}
        </table>
        ` : ''}
    </div>

    <div class="section">
        <h2>🔧 Environment</h2>
        <div class="metric"><span>Node Version:</span><span>${data.environment.nodeVersion}</span></div>
        <div class="metric"><span>Platform:</span><span>${data.environment.platform}</span></div>
        <div class="metric"><span>Architecture:</span><span>${data.environment.arch}</span></div>
    </div>
</body>
</html>`;
  }

  printSummary() {
    console.log('\n📊 Performance Test Summary');
    console.log('=' .repeat(40));
    console.log(`✅ Passed: ${this.results.summary.passed}`);
    console.log(`❌ Failed: ${this.results.summary.failed}`);
    console.log(`⚠️  Warnings: ${this.results.summary.warnings}`);
    console.log('=' .repeat(40));
    
    if (this.results.summary.failed > 0) {
      console.log('❌ Performance tests failed. Please review the issues and optimize.');
      process.exit(1);
    } else if (this.results.summary.warnings > 0) {
      console.log('⚠️  Performance tests passed with warnings. Consider optimizations.');
    } else {
      console.log('✅ All performance tests passed! Your app is optimized for mobile.');
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  args.forEach(arg => {
    if (arg === '--skip-build') options.skipBuild = true;
    if (arg === '--skip-lighthouse') options.skipLighthouse = true;
    if (arg === '--skip-web-vitals') options.skipWebVitals = true;
    if (arg === '--skip-bundle') options.skipBundleAnalysis = true;
  });
  
  const runner = new PerformanceTestRunner(options);
  runner.run().catch(console.error);
}

module.exports = PerformanceTestRunner;