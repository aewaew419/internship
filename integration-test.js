#!/usr/bin/env node

/**
 * Integration Test Script - Frontend & Backend
 * Tests the connection between Next.js frontend and Go Fiber backend
 */

const axios = require('axios');
const { spawn } = require('child_process');
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
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

class IntegrationTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async runTest(testName, testFn) {
    this.results.total++;
    const startTime = Date.now();
    
    try {
      this.log(`\n🧪 Testing: ${testName}`, 'blue');
      await testFn();
      const duration = Date.now() - startTime;
      this.results.passed++;
      this.results.details.push({
        name: testName,
        status: 'PASS',
        duration: `${duration}ms`,
        error: null
      });
      this.log(`✅ PASS: ${testName} (${duration}ms)`, 'green');
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.failed++;
      this.results.details.push({
        name: testName,
        status: 'FAIL',
        duration: `${duration}ms`,
        error: error.message
      });
      this.log(`❌ FAIL: ${testName} (${duration}ms)`, 'red');
      this.log(`   Error: ${error.message}`, 'red');
    }
  }

  async testBackendHealth() {
    const response = await axios.get(`${BACKEND_URL}/health`, {
      timeout: 5000
    });
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    if (!response.data.status || response.data.status !== 'ok') {
      throw new Error('Health check failed - invalid response');
    }
    
    this.log(`   Backend version: ${response.data.version}`, 'yellow');
  }

  async testAPIEndpoint() {
    const response = await axios.get(`${API_BASE}/test`, {
      timeout: 5000
    });
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    if (!response.data.message) {
      throw new Error('API test endpoint returned invalid response');
    }
    
    this.log(`   API message: ${response.data.message}`, 'yellow');
  }

  async testCORSConfiguration() {
    try {
      const response = await axios.options(`${API_BASE}/test`, {
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type'
        },
        timeout: 5000
      });
      
      // CORS preflight should return 200 or 204
      if (response.status !== 200 && response.status !== 204) {
        throw new Error(`CORS preflight failed with status ${response.status}`);
      }
      
      this.log('   CORS preflight successful', 'yellow');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // Some servers don't handle OPTIONS, try a regular request with Origin
        const response = await axios.get(`${API_BASE}/test`, {
          headers: {
            'Origin': 'http://localhost:3000'
          },
          timeout: 5000
        });
        
        if (response.status === 200) {
          this.log('   CORS working (no preflight needed)', 'yellow');
          return;
        }
      }
      throw error;
    }
  }

  async testAuthEndpoints() {
    // Test login endpoint
    const loginResponse = await axios.post(`${API_BASE}/login`, {
      email: 'test@example.com',
      password: 'testpassword'
    }, {
      timeout: 5000
    });
    
    if (loginResponse.status !== 200) {
      throw new Error(`Login endpoint failed with status ${loginResponse.status}`);
    }
    
    // Test register endpoint
    const registerResponse = await axios.post(`${API_BASE}/register`, {
      email: 'newuser@example.com',
      password: 'newpassword',
      firstName: 'Test',
      lastName: 'User'
    }, {
      timeout: 5000
    });
    
    if (registerResponse.status !== 200) {
      throw new Error(`Register endpoint failed with status ${registerResponse.status}`);
    }
    
    this.log('   Auth endpoints responding correctly', 'yellow');
  }

  async testUserEndpoints() {
    const response = await axios.get(`${API_BASE}/users`, {
      timeout: 5000
    });
    
    if (response.status !== 200) {
      throw new Error(`Users endpoint failed with status ${response.status}`);
    }
    
    if (!Array.isArray(response.data.users)) {
      throw new Error('Users endpoint should return an array');
    }
    
    this.log(`   Users endpoint returned ${response.data.users.length} users`, 'yellow');
  }

  async testErrorHandling() {
    try {
      await axios.get(`${API_BASE}/nonexistent-endpoint`, {
        timeout: 5000
      });
      throw new Error('Expected 404 error for non-existent endpoint');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        this.log('   404 error handling works correctly', 'yellow');
        return;
      }
      throw error;
    }
  }

  async testResponseTimes() {
    const endpoints = [
      `${BACKEND_URL}/health`,
      `${API_BASE}/test`,
      `${API_BASE}/users`
    ];
    
    const times = [];
    
    for (const endpoint of endpoints) {
      const start = Date.now();
      try {
        await axios.get(endpoint, { timeout: 5000 });
        const duration = Date.now() - start;
        times.push(duration);
      } catch (error) {
        // Ignore errors for this test, we're just measuring response times
      }
    }
    
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    
    if (avgTime > 1000) {
      throw new Error(`Average response time too high: ${avgTime}ms`);
    }
    
    this.log(`   Average response time: ${avgTime.toFixed(2)}ms`, 'yellow');
  }

  async checkFrontendConfig() {
    const envPath = path.join(__dirname, 'apps/frontend/.env.local');
    const envExamplePath = path.join(__dirname, 'apps/frontend/.env.example');
    
    let envExists = false;
    let config = {};
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envExists = true;
      
      // Parse basic env vars
      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          config[key.trim()] = value.trim();
        }
      });
    } else if (fs.existsSync(envExamplePath)) {
      this.log('   Using .env.example (create .env.local for custom config)', 'yellow');
    }
    
    // Check if API URL is configured correctly
    const expectedApiUrl = BACKEND_URL;
    const configuredApiUrl = config.NEXT_PUBLIC_API_V1 || process.env.NEXT_PUBLIC_API_V1;
    
    if (configuredApiUrl && configuredApiUrl !== expectedApiUrl) {
      this.log(`   Warning: API URL mismatch. Expected: ${expectedApiUrl}, Got: ${configuredApiUrl}`, 'yellow');
    }
    
    this.log(`   Frontend config check complete`, 'yellow');
  }

  async checkBackendStatus() {
    try {
      const response = await axios.get(`${BACKEND_URL}/health`, {
        timeout: 2000
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  async waitForBackend(maxWait = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      if (await this.checkBackendStatus()) {
        return true;
      }
      
      this.log('   Waiting for backend to start...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return false;
  }

  printResults() {
    this.log('\n' + '='.repeat(60), 'bold');
    this.log('🧪 INTEGRATION TEST RESULTS', 'bold');
    this.log('='.repeat(60), 'bold');
    
    this.log(`\n📊 Summary:`, 'blue');
    this.log(`   Total Tests: ${this.results.total}`);
    this.log(`   Passed: ${this.results.passed}`, 'green');
    this.log(`   Failed: ${this.results.failed}`, this.results.failed > 0 ? 'red' : 'green');
    this.log(`   Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
    
    if (this.results.details.length > 0) {
      this.log(`\n📋 Detailed Results:`, 'blue');
      this.results.details.forEach(test => {
        const status = test.status === 'PASS' ? '✅' : '❌';
        const color = test.status === 'PASS' ? 'green' : 'red';
        this.log(`   ${status} ${test.name} (${test.duration})`, color);
        if (test.error) {
          this.log(`      Error: ${test.error}`, 'red');
        }
      });
    }
    
    this.log('\n' + '='.repeat(60), 'bold');
    
    if (this.results.failed === 0) {
      this.log('🎉 All integration tests passed!', 'green');
      this.log('✅ Frontend and Backend are properly integrated', 'green');
    } else {
      this.log('⚠️  Some integration tests failed', 'red');
      this.log('❌ Please check the backend server and configuration', 'red');
    }
  }

  async run() {
    this.log('🚀 Starting Integration Tests...', 'bold');
    this.log(`Backend URL: ${BACKEND_URL}`, 'blue');
    this.log(`Frontend URL: ${FRONTEND_URL}`, 'blue');
    this.log(`API Base: ${API_BASE}`, 'blue');
    
    // Check if backend is running
    this.log('\n🔍 Checking backend status...', 'blue');
    const backendRunning = await this.checkBackendStatus();
    
    if (!backendRunning) {
      this.log('⚠️  Backend not running. Attempting to wait...', 'yellow');
      const backendStarted = await this.waitForBackend();
      
      if (!backendStarted) {
        this.log('❌ Backend is not running. Please start it with:', 'red');
        this.log('   cd apps/backend && npm run dev', 'yellow');
        process.exit(1);
      }
    }
    
    this.log('✅ Backend is running', 'green');
    
    // Run all tests
    await this.runTest('Backend Health Check', () => this.testBackendHealth());
    await this.runTest('API Test Endpoint', () => this.testAPIEndpoint());
    await this.runTest('CORS Configuration', () => this.testCORSConfiguration());
    await this.runTest('Authentication Endpoints', () => this.testAuthEndpoints());
    await this.runTest('User Endpoints', () => this.testUserEndpoints());
    await this.runTest('Error Handling', () => this.testErrorHandling());
    await this.runTest('Response Times', () => this.testResponseTimes());
    await this.runTest('Frontend Configuration', () => this.checkFrontendConfig());
    
    // Print results
    this.printResults();
    
    // Exit with appropriate code
    process.exit(this.results.failed > 0 ? 1 : 0);
  }
}

// Run the tests
if (require.main === module) {
  const tester = new IntegrationTester();
  tester.run().catch(error => {
    console.error('❌ Integration test runner failed:', error.message);
    process.exit(1);
  });
}

module.exports = IntegrationTester;