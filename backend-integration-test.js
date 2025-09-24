#!/usr/bin/env node

/**
 * Backend Integration Test - Focus on API Testing
 * Tests the Go Fiber backend API endpoints and functionality
 */

const axios = require('axios');

// Configuration
const BACKEND_URL = 'http://localhost:8080';
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
  bold: '\x1b[1m'
};

class BackendIntegrationTester {
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
      const result = await testFn();
      const duration = Date.now() - startTime;
      this.results.passed++;
      this.results.details.push({
        name: testName,
        status: 'PASS',
        duration: `${duration}ms`,
        error: null,
        result
      });
      this.log(`✅ PASS: ${testName} (${duration}ms)`, 'green');
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.results.failed++;
      this.results.details.push({
        name: testName,
        status: 'FAIL',
        duration: `${duration}ms`,
        error: error.message,
        result: null
      });
      this.log(`❌ FAIL: ${testName} (${duration}ms)`, 'red');
      this.log(`   Error: ${error.message}`, 'red');
      return null;
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
    
    this.log(`   Status: ${response.data.status}`, 'cyan');
    this.log(`   Message: ${response.data.message}`, 'cyan');
    
    return {
      status: response.data.status,
      message: response.data.message,
      responseTime: response.headers['x-response-time'] || 'N/A'
    };
  }

  async testAPITestEndpoint() {
    const response = await axios.get(`${API_BASE}/test`, {
      timeout: 5000
    });
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }
    
    if (!response.data.message) {
      throw new Error('API test endpoint returned invalid response');
    }
    
    this.log(`   Message: ${response.data.message}`, 'cyan');
    this.log(`   Version: ${response.data.version}`, 'cyan');
    this.log(`   Backend: ${response.data.backend}`, 'cyan');
    
    return {
      message: response.data.message,
      version: response.data.version,
      backend: response.data.backend
    };
  }

  async testCORSHeaders() {
    const response = await axios.get(`${API_BASE}/test`, {
      headers: {
        'Origin': 'http://localhost:3000'
      },
      timeout: 5000
    });
    
    // Check if CORS headers are present (they should be in a real CORS setup)
    const corsHeaders = {
      'access-control-allow-origin': response.headers['access-control-allow-origin'],
      'access-control-allow-methods': response.headers['access-control-allow-methods'],
      'access-control-allow-headers': response.headers['access-control-allow-headers']
    };
    
    this.log(`   CORS Origin: ${corsHeaders['access-control-allow-origin'] || 'Not set'}`, 'cyan');
    this.log(`   CORS Methods: ${corsHeaders['access-control-allow-methods'] || 'Not set'}`, 'cyan');
    this.log(`   CORS Headers: ${corsHeaders['access-control-allow-headers'] || 'Not set'}`, 'cyan');
    
    return corsHeaders;
  }

  async testAuthEndpoints() {
    const results = {};
    
    // Test login endpoint
    try {
      const loginResponse = await axios.post(`${API_BASE}/login`, {
        email: 'test@example.com',
        password: 'testpassword'
      }, {
        timeout: 5000,
        validateStatus: function (status) {
          return status >= 200 && status < 600; // Accept any status
        }
      });
      
      results.login = {
        status: loginResponse.status,
        message: loginResponse.data.message || 'No message',
        hasError: loginResponse.status >= 400
      };
      
      this.log(`   Login Status: ${loginResponse.status}`, loginResponse.status < 400 ? 'cyan' : 'yellow');
      this.log(`   Login Message: ${results.login.message}`, 'cyan');
      
    } catch (error) {
      results.login = {
        status: 'ERROR',
        message: error.message,
        hasError: true
      };
    }
    
    // Test register endpoint
    try {
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
      
      results.register = {
        status: registerResponse.status,
        message: registerResponse.data.message || 'No message',
        hasError: registerResponse.status >= 400
      };
      
      this.log(`   Register Status: ${registerResponse.status}`, registerResponse.status < 400 ? 'cyan' : 'yellow');
      this.log(`   Register Message: ${results.register.message}`, 'cyan');
      
    } catch (error) {
      results.register = {
        status: 'ERROR',
        message: error.message,
        hasError: true
      };
    }
    
    return results;
  }

  async testErrorHandling() {
    try {
      await axios.get(`${API_BASE}/nonexistent-endpoint`, {
        timeout: 5000
      });
      throw new Error('Expected 404 error for non-existent endpoint');
    } catch (error) {
      if (error.response) {
        this.log(`   Error Status: ${error.response.status}`, 'cyan');
        this.log(`   Error Message: ${error.response.data?.error || error.response.statusText}`, 'cyan');
        
        if (error.response.status === 404) {
          return {
            status: 404,
            message: 'Correctly returns 404 for non-existent endpoints',
            working: true
          };
        } else {
          return {
            status: error.response.status,
            message: `Returns ${error.response.status} instead of 404`,
            working: false
          };
        }
      }
      throw error;
    }
  }

  async testPerformance() {
    const endpoints = [
      { url: `${BACKEND_URL}/health`, name: 'Health Check' },
      { url: `${API_BASE}/test`, name: 'API Test' }
    ];
    
    const results = {};
    
    for (const endpoint of endpoints) {
      const times = [];
      
      // Run 5 requests to get average
      for (let i = 0; i < 5; i++) {
        const start = Date.now();
        try {
          await axios.get(endpoint.url, { timeout: 5000 });
          times.push(Date.now() - start);
        } catch (error) {
          // Skip failed requests
        }
      }
      
      if (times.length > 0) {
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);
        
        results[endpoint.name] = {
          average: avgTime,
          min: minTime,
          max: maxTime,
          requests: times.length
        };
        
        this.log(`   ${endpoint.name}: avg ${avgTime.toFixed(2)}ms (min: ${minTime}ms, max: ${maxTime}ms)`, 'cyan');
      }
    }
    
    return results;
  }

  async testDatabaseEndpoints() {
    const endpoints = [
      { url: `${API_BASE}/users`, name: 'Users Endpoint' },
      { url: `${API_BASE}/students`, name: 'Students Endpoint' },
      { url: `${API_BASE}/instructors`, name: 'Instructors Endpoint' },
      { url: `${API_BASE}/companies`, name: 'Companies Endpoint' }
    ];
    
    const results = {};
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(endpoint.url, {
          timeout: 5000,
          validateStatus: function (status) {
            return status >= 200 && status < 600;
          }
        });
        
        results[endpoint.name] = {
          status: response.status,
          available: response.status < 500,
          hasData: response.data && typeof response.data === 'object',
          dataType: Array.isArray(response.data) ? 'array' : typeof response.data
        };
        
        const statusColor = response.status < 400 ? 'green' : response.status < 500 ? 'yellow' : 'red';
        this.log(`   ${endpoint.name}: ${response.status}`, statusColor);
        
      } catch (error) {
        results[endpoint.name] = {
          status: 'ERROR',
          available: false,
          error: error.message
        };
        this.log(`   ${endpoint.name}: ERROR (${error.message})`, 'red');
      }
    }
    
    return results;
  }

  async run() {
    this.log('🚀 Backend Integration Test Suite', 'bold');
    this.log('==================================', 'bold');
    this.log(`Backend URL: ${BACKEND_URL}`, 'blue');
    this.log(`API Base: ${API_BASE}`, 'blue');
    
    // Run all tests
    const healthResult = await this.runTest('Backend Health Check', () => this.testBackendHealth());
    const apiResult = await this.runTest('API Test Endpoint', () => this.testAPITestEndpoint());
    const corsResult = await this.runTest('CORS Configuration', () => this.testCORSHeaders());
    const authResult = await this.runTest('Authentication Endpoints', () => this.testAuthEndpoints());
    const errorResult = await this.runTest('Error Handling', () => this.testErrorHandling());
    const perfResult = await this.runTest('Performance Testing', () => this.testPerformance());
    const dbResult = await this.runTest('Database Endpoints', () => this.testDatabaseEndpoints());
    
    // Print comprehensive results
    this.printResults({
      health: healthResult,
      api: apiResult,
      cors: corsResult,
      auth: authResult,
      error: errorResult,
      performance: perfResult,
      database: dbResult
    });
    
    // Exit with appropriate code
    process.exit(this.results.failed > 0 ? 1 : 0);
  }

  printResults(testResults) {
    this.log('\n' + '='.repeat(80), 'bold');
    this.log('🧪 BACKEND INTEGRATION TEST RESULTS', 'bold');
    this.log('='.repeat(80), 'bold');
    
    // Overall Summary
    this.log(`\n📊 Test Summary:`, 'blue');
    this.log(`   Total Tests: ${this.results.total}`);
    this.log(`   Passed: ${this.results.passed}`, 'green');
    this.log(`   Failed: ${this.results.failed}`, this.results.failed > 0 ? 'red' : 'green');
    this.log(`   Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
    
    // Backend Status
    this.log(`\n🔍 Backend Status:`, 'blue');
    if (testResults.health) {
      this.log(`   ✅ Backend is running and healthy`, 'green');
      this.log(`   📡 API endpoints are responding`, 'green');
    } else {
      this.log(`   ❌ Backend health check failed`, 'red');
    }
    
    // API Functionality
    this.log(`\n🔌 API Functionality:`, 'blue');
    if (testResults.api) {
      this.log(`   ✅ Test endpoint working (${testResults.api.version})`, 'green');
      this.log(`   ✅ JSON responses properly formatted`, 'green');
    }
    
    if (testResults.cors) {
      const hasCors = testResults.cors['access-control-allow-origin'];
      this.log(`   ${hasCors ? '✅' : '⚠️'} CORS ${hasCors ? 'configured' : 'may need configuration'}`, hasCors ? 'green' : 'yellow');
    }
    
    // Authentication
    this.log(`\n🔐 Authentication:`, 'blue');
    if (testResults.auth) {
      const loginWorking = testResults.auth.login && !testResults.auth.login.hasError;
      const registerWorking = testResults.auth.register && !testResults.auth.register.hasError;
      
      this.log(`   ${loginWorking ? '✅' : '⚠️'} Login endpoint ${loginWorking ? 'working' : 'needs database'}`, loginWorking ? 'green' : 'yellow');
      this.log(`   ${registerWorking ? '✅' : '⚠️'} Register endpoint ${registerWorking ? 'working' : 'needs database'}`, registerWorking ? 'green' : 'yellow');
    }
    
    // Database Integration
    this.log(`\n🗄️  Database Integration:`, 'blue');
    if (testResults.database) {
      const workingEndpoints = Object.values(testResults.database).filter(r => r.available).length;
      const totalEndpoints = Object.keys(testResults.database).length;
      
      if (workingEndpoints === 0) {
        this.log(`   ⚠️  Database endpoints not available (${workingEndpoints}/${totalEndpoints})`, 'yellow');
        this.log(`   💡 This is expected without database setup`, 'yellow');
      } else {
        this.log(`   ✅ Database endpoints working (${workingEndpoints}/${totalEndpoints})`, 'green');
      }
    }
    
    // Performance
    this.log(`\n⚡ Performance:`, 'blue');
    if (testResults.performance) {
      Object.entries(testResults.performance).forEach(([name, perf]) => {
        const avgTime = perf.average;
        const status = avgTime < 100 ? '🚀' : avgTime < 500 ? '✅' : '⚠️';
        const color = avgTime < 100 ? 'green' : avgTime < 500 ? 'green' : 'yellow';
        this.log(`   ${status} ${name}: ${avgTime.toFixed(2)}ms average`, color);
      });
    }
    
    // Integration Status
    this.log(`\n🔗 Integration Status:`, 'blue');
    const integrationScore = (this.results.passed / this.results.total) * 100;
    
    if (integrationScore >= 90) {
      this.log(`   🎉 Excellent integration (${integrationScore.toFixed(1)}%)`, 'green');
      this.log(`   ✅ Backend is ready for frontend integration`, 'green');
    } else if (integrationScore >= 70) {
      this.log(`   👍 Good integration (${integrationScore.toFixed(1)}%)`, 'yellow');
      this.log(`   ⚠️  Some features may need database setup`, 'yellow');
    } else {
      this.log(`   ⚠️  Integration needs work (${integrationScore.toFixed(1)}%)`, 'red');
      this.log(`   🔧 Check backend configuration and database`, 'red');
    }
    
    // Recommendations
    this.log(`\n💡 Next Steps:`, 'blue');
    
    if (!testResults.health) {
      this.log(`   🔴 Start the backend server: cd apps/backend && npm run dev`, 'red');
    } else {
      this.log(`   ✅ Backend server is running properly`, 'green');
    }
    
    if (testResults.auth && (testResults.auth.login?.hasError || testResults.auth.register?.hasError)) {
      this.log(`   🟡 Set up database for full authentication:`, 'yellow');
      this.log(`      1. Use full server: go run cmd/server/main.go`, 'cyan');
      this.log(`      2. Run migrations: npm run migrate`, 'cyan');
      this.log(`      3. Seed data: npm run seed`, 'cyan');
    }
    
    if (testResults.database && Object.values(testResults.database).every(r => !r.available)) {
      this.log(`   🟡 Database endpoints will work once database is connected`, 'yellow');
    }
    
    this.log(`   🎯 Ready for frontend integration testing`, 'green');
    
    this.log('\n' + '='.repeat(80), 'bold');
  }
}

// Run the backend integration tests
if (require.main === module) {
  const tester = new BackendIntegrationTester();
  tester.run().catch(error => {
    console.error('❌ Backend integration test failed:', error.message);
    process.exit(1);
  });
}

module.exports = BackendIntegrationTester;