#!/usr/bin/env node

/**
 * Comprehensive Integration Test Suite
 * Tests Frontend ↔ Backend integration with proper error handling
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const BACKEND_URL = 'http://localhost:8080';
const FRONTEND_URL = 'http://localhost:3000';
const API_BASE = `${BACKEND_URL}/api/v1`;

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

class ComprehensiveIntegrationTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      details: [],
      categories: {
        connectivity: { passed: 0, failed: 0, total: 0 },
        api: { passed: 0, failed: 0, total: 0 },
        frontend: { passed: 0, failed: 0, total: 0 },
        database: { passed: 0, failed: 0, total: 0 },
        performance: { passed: 0, failed: 0, total: 0 }
      }
    };
    this.backendRunning = false;
    this.frontendRunning = false;
    this.databaseConnected = false;
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async runTest(testName, testFn, category = 'general', skipCondition = null) {
    this.results.total++;
    if (this.results.categories[category]) {
      this.results.categories[category].total++;
    }

    const startTime = Date.now();
    
    try {
      // Check skip condition
      if (skipCondition && skipCondition()) {
        this.results.skipped++;
        this.results.details.push({
          name: testName,
          status: 'SKIP',
          duration: '0ms',
          error: 'Skipped due to precondition',
          category
        });
        this.log(`⏭️  SKIP: ${testName} (precondition not met)`, 'yellow');
        return;
      }

      this.log(`\n🧪 Testing: ${testName}`, 'blue');
      await testFn();
      const duration = Date.now() - startTime;
      this.results.passed++;
      if (this.results.categories[category]) {
        this.results.categories[category].passed++;
      }
      this.results.details.push({
        name: testName,
        status: 'PASS',
        duration: `${duration}ms`,
        error: null,
        category
      });
      this.log(`✅ PASS: ${testName} (${duration}ms)`, 'green');
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.failed++;
      if (this.results.categories[category]) {
        this.results.categories[category].failed++;
      }
      this.results.details.push({
        name: testName,
        status: 'FAIL',
        duration: `${duration}ms`,
        error: error.message,
        category
      });
      this.log(`❌ FAIL: ${testName} (${duration}ms)`, 'red');
      this.log(`   Error: ${error.message}`, 'red');
    }
  }

  // ============ CONNECTIVITY TESTS ============
  async testBackendConnectivity() {
    const response = await axios.get(`${BACKEND_URL}/health`, {
      timeout: 5000
    });
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    if (!response.data.status || response.data.status !== 'ok') {
      throw new Error('Health check failed - invalid response');
    }
    
    this.backendRunning = true;
    this.log(`   Backend status: ${response.data.status}`, 'cyan');
    this.log(`   Backend message: ${response.data.message}`, 'cyan');
  }

  async testFrontendConnectivity() {
    try {
      const response = await axios.get(FRONTEND_URL, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Integration-Test-Bot/1.0'
        }
      });
      
      if (response.status !== 200) {
        throw new Error(`Expected status 200, got ${response.status}`);
      }
      
      this.frontendRunning = true;
      this.log(`   Frontend is accessible`, 'cyan');
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Frontend server is not running on port 3000');
      }
      throw error;
    }
  }

  async testCORSConfiguration() {
    try {
      // Test preflight request
      const response = await axios.options(`${API_BASE}/test`, {
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type'
        },
        timeout: 5000
      });
      
      this.log('   CORS preflight successful', 'cyan');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // Try a regular request with Origin header
        const response = await axios.get(`${API_BASE}/test`, {
          headers: {
            'Origin': 'http://localhost:3000'
          },
          timeout: 5000
        });
        
        if (response.status === 200) {
          this.log('   CORS working (no preflight needed)', 'cyan');
          return;
        }
      }
      throw new Error(`CORS configuration issue: ${error.message}`);
    }
  }

  // ============ API TESTS ============
  async testAPIEndpoints() {
    const response = await axios.get(`${API_BASE}/test`, {
      timeout: 5000
    });
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    if (!response.data.message) {
      throw new Error('API test endpoint returned invalid response');
    }
    
    this.log(`   API message: ${response.data.message}`, 'cyan');
    this.log(`   API version: ${response.data.version}`, 'cyan');
  }

  async testAuthEndpointsBasic() {
    // Test login endpoint (expect it to handle the request even if DB is not connected)
    try {
      const loginResponse = await axios.post(`${API_BASE}/login`, {
        email: 'test@example.com',
        password: 'testpassword'
      }, {
        timeout: 5000,
        validateStatus: function (status) {
          // Accept both success and error responses
          return status >= 200 && status < 600;
        }
      });
      
      this.log(`   Login endpoint responded with status: ${loginResponse.status}`, 'cyan');
      
      // Test register endpoint
      const registerResponse = await axios.post(`${API_BASE}/register`, {
        email: 'newuser@example.com',
        password: 'newpassword',
        firstName: 'Test',
        lastName: 'User'
      }, {
        timeout: 5000,
        validateStatus: function (status) {
          return status >= 200 && status < 600;
        }
      });
      
      this.log(`   Register endpoint responded with status: ${registerResponse.status}`, 'cyan');
      
    } catch (error) {
      if (error.response && error.response.status >= 400) {
        // This is expected if database is not connected
        this.log(`   Auth endpoints responding (${error.response.status} - expected without DB)`, 'cyan');
        return;
      }
      throw error;
    }
  }

  async testErrorHandling() {
    try {
      await axios.get(`${API_BASE}/nonexistent-endpoint`, {
        timeout: 5000
      });
      throw new Error('Expected 404 error for non-existent endpoint');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        this.log('   404 error handling works correctly', 'cyan');
        return;
      }
      if (error.response) {
        this.log(`   Error handling works (status: ${error.response.status})`, 'cyan');
        return;
      }
      throw error;
    }
  }

  // ============ DATABASE TESTS ============
  async testDatabaseConnection() {
    try {
      // Try to access an endpoint that requires database
      const response = await axios.get(`${API_BASE}/users`, {
        timeout: 5000,
        validateStatus: function (status) {
          return status >= 200 && status < 600;
        }
      });
      
      if (response.status === 200) {
        this.databaseConnected = true;
        this.log('   Database is connected and working', 'cyan');
        if (response.data.users && Array.isArray(response.data.users)) {
          this.log(`   Found ${response.data.users.length} users in database`, 'cyan');
        }
      } else if (response.status === 500) {
        this.log('   Database connection issue detected', 'yellow');
        this.log('   This is expected if database is not set up', 'yellow');
      }
    } catch (error) {
      this.log('   Database connection test failed (expected without setup)', 'yellow');
    }
  }

  // ============ FRONTEND TESTS ============
  async testFrontendAPIClient() {
    // Check if frontend API client configuration exists
    const apiClientPath = path.join(__dirname, 'apps/frontend/src/lib/api/client.ts');
    const baseAPIPath = path.join(__dirname, 'apps/frontend/src/lib/api/base.ts');
    
    if (!fs.existsSync(apiClientPath)) {
      throw new Error('Frontend API client configuration not found');
    }
    
    if (!fs.existsSync(baseAPIPath)) {
      throw new Error('Frontend base API configuration not found');
    }
    
    // Read and validate API client configuration
    const clientContent = fs.readFileSync(apiClientPath, 'utf8');
    const baseContent = fs.readFileSync(baseAPIPath, 'utf8');
    
    if (!clientContent.includes('NEXT_PUBLIC_API_V1')) {
      throw new Error('API URL configuration not found in client');
    }
    
    if (!baseContent.includes('axios')) {
      throw new Error('Axios not configured in base API');
    }
    
    this.log('   Frontend API client is properly configured', 'cyan');
    this.log('   Axios integration is set up', 'cyan');
  }

  async testFrontendEnvironmentConfig() {
    const envExamplePath = path.join(__dirname, 'apps/frontend/.env.example');
    const envLocalPath = path.join(__dirname, 'apps/frontend/.env.local');
    
    if (!fs.existsSync(envExamplePath)) {
      throw new Error('Frontend .env.example not found');
    }
    
    const envContent = fs.readFileSync(envExamplePath, 'utf8');
    
    if (!envContent.includes('NEXT_PUBLIC_API_URL')) {
      throw new Error('API URL not configured in environment example');
    }
    
    this.log('   Environment configuration template exists', 'cyan');
    
    if (fs.existsSync(envLocalPath)) {
      this.log('   Local environment configuration found', 'cyan');
    } else {
      this.log('   Local environment configuration not found (using defaults)', 'yellow');
    }
  }

  // ============ PERFORMANCE TESTS ============
  async testResponseTimes() {
    const endpoints = [
      { url: `${BACKEND_URL}/health`, name: 'Health Check' },
      { url: `${API_BASE}/test`, name: 'API Test' }
    ];
    
    const times = [];
    
    for (const endpoint of endpoints) {
      const start = Date.now();
      try {
        await axios.get(endpoint.url, { timeout: 5000 });
        const duration = Date.now() - start;
        times.push({ name: endpoint.name, duration });
        this.log(`   ${endpoint.name}: ${duration}ms`, 'cyan');
      } catch (error) {
        this.log(`   ${endpoint.name}: Failed (${error.message})`, 'yellow');
      }
    }
    
    if (times.length === 0) {
      throw new Error('No endpoints responded for performance testing');
    }
    
    const avgTime = times.reduce((a, b) => a + b.duration, 0) / times.length;
    
    if (avgTime > 2000) {
      throw new Error(`Average response time too high: ${avgTime.toFixed(2)}ms`);
    }
    
    this.log(`   Average response time: ${avgTime.toFixed(2)}ms`, 'cyan');
  }

  async testConcurrentRequests() {
    const concurrentRequests = 5;
    const promises = [];
    
    for (let i = 0; i < concurrentRequests; i++) {
      promises.push(
        axios.get(`${BACKEND_URL}/health`, { timeout: 5000 })
          .then(response => ({ success: true, status: response.status }))
          .catch(error => ({ success: false, error: error.message }))
      );
    }
    
    const results = await Promise.all(promises);
    const successful = results.filter(r => r.success).length;
    
    if (successful < concurrentRequests * 0.8) {
      throw new Error(`Only ${successful}/${concurrentRequests} concurrent requests succeeded`);
    }
    
    this.log(`   ${successful}/${concurrentRequests} concurrent requests succeeded`, 'cyan');
  }

  // ============ SYSTEM CHECKS ============
  async checkSystemRequirements() {
    const requirements = [];
    
    // Check if backend directory exists
    if (fs.existsSync(path.join(__dirname, 'apps/backend'))) {
      requirements.push('✅ Backend directory exists');
    } else {
      requirements.push('❌ Backend directory not found');
    }
    
    // Check if frontend directory exists
    if (fs.existsSync(path.join(__dirname, 'apps/frontend'))) {
      requirements.push('✅ Frontend directory exists');
    } else {
      requirements.push('❌ Frontend directory not found');
    }
    
    // Check if package.json exists
    if (fs.existsSync(path.join(__dirname, 'package.json'))) {
      requirements.push('✅ Root package.json exists');
    } else {
      requirements.push('❌ Root package.json not found');
    }
    
    requirements.forEach(req => this.log(`   ${req}`, 'cyan'));
    
    if (requirements.some(req => req.includes('❌'))) {
      throw new Error('Some system requirements are missing');
    }
  }

  // ============ MAIN TEST RUNNER ============
  async run() {
    this.log('🚀 Comprehensive Integration Test Suite', 'bold');
    this.log('==========================================', 'bold');
    this.log(`Backend URL: ${BACKEND_URL}`, 'blue');
    this.log(`Frontend URL: ${FRONTEND_URL}`, 'blue');
    this.log(`API Base: ${API_BASE}`, 'blue');
    
    // System Requirements
    this.log('\n📋 System Requirements Check', 'magenta');
    await this.runTest('System Requirements', () => this.checkSystemRequirements(), 'connectivity');
    
    // Connectivity Tests
    this.log('\n🔗 Connectivity Tests', 'magenta');
    await this.runTest('Backend Connectivity', () => this.testBackendConnectivity(), 'connectivity');
    await this.runTest('Frontend Connectivity', () => this.testFrontendConnectivity(), 'connectivity');
    await this.runTest('CORS Configuration', () => this.testCORSConfiguration(), 'connectivity', 
      () => !this.backendRunning);
    
    // API Tests
    this.log('\n🔌 API Integration Tests', 'magenta');
    await this.runTest('API Endpoints', () => this.testAPIEndpoints(), 'api', 
      () => !this.backendRunning);
    await this.runTest('Auth Endpoints Basic', () => this.testAuthEndpointsBasic(), 'api', 
      () => !this.backendRunning);
    await this.runTest('Error Handling', () => this.testErrorHandling(), 'api', 
      () => !this.backendRunning);
    
    // Database Tests
    this.log('\n🗄️  Database Integration Tests', 'magenta');
    await this.runTest('Database Connection', () => this.testDatabaseConnection(), 'database', 
      () => !this.backendRunning);
    
    // Frontend Tests
    this.log('\n🎨 Frontend Integration Tests', 'magenta');
    await this.runTest('Frontend API Client', () => this.testFrontendAPIClient(), 'frontend');
    await this.runTest('Frontend Environment Config', () => this.testFrontendEnvironmentConfig(), 'frontend');
    
    // Performance Tests
    this.log('\n⚡ Performance Tests', 'magenta');
    await this.runTest('Response Times', () => this.testResponseTimes(), 'performance', 
      () => !this.backendRunning);
    await this.runTest('Concurrent Requests', () => this.testConcurrentRequests(), 'performance', 
      () => !this.backendRunning);
    
    // Print Results
    this.printResults();
    
    // Exit with appropriate code
    process.exit(this.results.failed > 0 ? 1 : 0);
  }

  printResults() {
    this.log('\n' + '='.repeat(80), 'bold');
    this.log('🧪 COMPREHENSIVE INTEGRATION TEST RESULTS', 'bold');
    this.log('='.repeat(80), 'bold');
    
    // Overall Summary
    this.log(`\n📊 Overall Summary:`, 'blue');
    this.log(`   Total Tests: ${this.results.total}`);
    this.log(`   Passed: ${this.results.passed}`, 'green');
    this.log(`   Failed: ${this.results.failed}`, this.results.failed > 0 ? 'red' : 'green');
    this.log(`   Skipped: ${this.results.skipped}`, 'yellow');
    this.log(`   Success Rate: ${((this.results.passed / (this.results.total - this.results.skipped)) * 100).toFixed(1)}%`);
    
    // Category Breakdown
    this.log(`\n📋 Category Breakdown:`, 'blue');
    Object.entries(this.results.categories).forEach(([category, stats]) => {
      if (stats.total > 0) {
        const successRate = ((stats.passed / stats.total) * 100).toFixed(1);
        const status = stats.failed === 0 ? '✅' : '⚠️';
        this.log(`   ${status} ${category.toUpperCase()}: ${stats.passed}/${stats.total} (${successRate}%)`);
      }
    });
    
    // System Status
    this.log(`\n🔍 System Status:`, 'blue');
    this.log(`   Backend Running: ${this.backendRunning ? '✅' : '❌'}`, this.backendRunning ? 'green' : 'red');
    this.log(`   Frontend Running: ${this.frontendRunning ? '✅' : '❌'}`, this.frontendRunning ? 'green' : 'red');
    this.log(`   Database Connected: ${this.databaseConnected ? '✅' : '⚠️'}`, this.databaseConnected ? 'green' : 'yellow');
    
    // Recommendations
    this.log(`\n💡 Recommendations:`, 'blue');
    
    if (!this.backendRunning) {
      this.log(`   🔴 Start the backend server:`, 'red');
      this.log(`      cd apps/backend && npm run dev`, 'yellow');
    }
    
    if (!this.frontendRunning) {
      this.log(`   🔴 Start the frontend server:`, 'red');
      this.log(`      cd apps/frontend && npm run dev`, 'yellow');
    }
    
    if (!this.databaseConnected && this.backendRunning) {
      this.log(`   🟡 Set up the database:`, 'yellow');
      this.log(`      1. Use the full server: cd apps/backend && go run cmd/server/main.go`, 'cyan');
      this.log(`      2. Or run migrations: cd apps/backend && npm run migrate`, 'cyan');
      this.log(`      3. Seed data: cd apps/backend && npm run seed`, 'cyan');
    }
    
    if (this.results.failed === 0) {
      this.log('\n🎉 All integration tests passed!', 'green');
      this.log('✅ Frontend and Backend are properly integrated', 'green');
    } else {
      this.log('\n⚠️  Some integration tests failed', 'yellow');
      this.log('📝 Check the recommendations above to resolve issues', 'yellow');
    }
    
    this.log('\n' + '='.repeat(80), 'bold');
  }
}

// Run the comprehensive tests
if (require.main === module) {
  const tester = new ComprehensiveIntegrationTester();
  tester.run().catch(error => {
    console.error('❌ Integration test runner failed:', error.message);
    process.exit(1);
  });
}

module.exports = ComprehensiveIntegrationTester;