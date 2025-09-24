#!/usr/bin/env node

/**
 * Performance Testing Suite for Demo Data
 * ทดสอบประสิทธิภาพระบบด้วยข้อมูล Demo
 */

const axios = require('axios');
const fs = require('fs');

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

class PerformanceTester {
  constructor() {
    this.results = {
      tests: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        avgResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0
      }
    };
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async runPerformanceTest(testName, testFn, iterations = 10) {
    this.log(`\n🚀 Performance Test: ${testName}`, 'blue');
    this.log(`📊 Running ${iterations} iterations...`, 'dim');

    const times = [];
    const errors = [];
    let successCount = 0;

    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      try {
        await testFn();
        const duration = Date.now() - startTime;
        times.push(duration);
        successCount++;
        process.stdout.write(`${colors.green}.${colors.reset}`);
      } catch (error) {
        const duration = Date.now() - startTime;
        times.push(duration);
        errors.push(error.message);
        process.stdout.write(`${colors.red}x${colors.reset}`);
      }
    }

    console.log(); // New line after dots

    // Calculate statistics
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const successRate = (successCount / iterations) * 100;

    // Update global summary
    this.results.summary.totalTests++;
    this.results.summary.totalRequests += iterations;
    this.results.summary.successfulRequests += successCount;
    this.results.summary.failedRequests += (iterations - successCount);
    this.results.summary.minResponseTime = Math.min(this.results.summary.minResponseTime, minTime);
    this.results.summary.maxResponseTime = Math.max(this.results.summary.maxResponseTime, maxTime);

    const testResult = {
      name: testName,
      iterations,
      successCount,
      successRate: successRate.toFixed(1),
      avgTime: avgTime.toFixed(2),
      minTime,
      maxTime,
      errors: errors.slice(0, 3), // Keep only first 3 errors
      status: successRate >= 90 ? 'PASS' : 'FAIL'
    };

    this.results.tests.push(testResult);

    // Display results
    const statusColor = testResult.status === 'PASS' ? 'green' : 'red';
    this.log(`${testResult.status === 'PASS' ? '✅' : '❌'} ${testName}`, statusColor);
    this.log(`   Success Rate: ${successRate.toFixed(1)}% (${successCount}/${iterations})`, 'cyan');
    this.log(`   Response Time: ${avgTime.toFixed(2)}ms avg (${minTime}ms - ${maxTime}ms)`, 'cyan');
    
    if (errors.length > 0) {
      this.log(`   Errors: ${errors.length}`, 'yellow');
      errors.slice(0, 2).forEach(error => {
        this.log(`     - ${error}`, 'dim');
      });
    }

    if (testResult.status === 'PASS') {
      this.results.summary.passed++;
    } else {
      this.results.summary.failed++;
    }

    return testResult;
  }

  async testHealthEndpoint() {
    const response = await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
  }

  async testAPIEndpoint() {
    const response = await axios.get(`${API_BASE}/test`, { timeout: 5000 });
    if (response.status !== 200 || !response.data.message) {
      throw new Error(`API test failed: ${response.status}`);
    }
  }

  async testUsersEndpoint() {
    const response = await axios.get(`${API_BASE}/users`, { timeout: 5000 });
    if (response.status !== 200 || !response.data.users) {
      throw new Error(`Users endpoint failed: ${response.status}`);
    }
    if (response.data.users.length !== 9) {
      throw new Error(`Expected 9 users, got ${response.data.users.length}`);
    }
  }

  async testCompaniesEndpoint() {
    const response = await axios.get(`${API_BASE}/companies`, { timeout: 5000 });
    if (response.status !== 200 || !response.data.companies) {
      throw new Error(`Companies endpoint failed: ${response.status}`);
    }
    if (response.data.companies.length !== 5) {
      throw new Error(`Expected 5 companies, got ${response.data.companies.length}`);
    }
  }

  async testStudentsEndpoint() {
    const response = await axios.get(`${API_BASE}/students`, { timeout: 5000 });
    if (response.status !== 200 || !response.data.students) {
      throw new Error(`Students endpoint failed: ${response.status}`);
    }
    if (response.data.students.length !== 5) {
      throw new Error(`Expected 5 students, got ${response.data.students.length}`);
    }
  }

  async testInternshipsEndpoint() {
    const response = await axios.get(`${API_BASE}/internships`, { timeout: 5000 });
    if (response.status !== 200 || !response.data.internships) {
      throw new Error(`Internships endpoint failed: ${response.status}`);
    }
    if (response.data.internships.length !== 5) {
      throw new Error(`Expected 5 internships, got ${response.data.internships.length}`);
    }
  }

  async testStudentLogin() {
    const response = await axios.post(`${API_BASE}/auth/student-login`, {
      studentId: '65010001',
      password: 'password123'
    }, { timeout: 5000 });
    
    if (response.status !== 200 || !response.data.success) {
      throw new Error(`Student login failed: ${response.status}`);
    }
  }

  async testStaffLogin() {
    const response = await axios.post(`${API_BASE}/login`, {
      email: 'admin@university.ac.th',
      password: 'password123'
    }, { timeout: 5000 });
    
    if (response.status !== 200 || !response.data.success) {
      throw new Error(`Staff login failed: ${response.status}`);
    }
  }

  async testDashboardStats() {
    const response = await axios.get(`${API_BASE}/dashboard/stats`, { timeout: 5000 });
    if (response.status !== 200 || !response.data.stats) {
      throw new Error(`Dashboard stats failed: ${response.status}`);
    }
  }

  async testFrontendLoad() {
    const response = await axios.get(FRONTEND_URL, { 
      timeout: 10000,
      headers: {
        'User-Agent': 'Performance-Test-Bot/1.0'
      }
    });
    if (response.status !== 200) {
      throw new Error(`Frontend load failed: ${response.status}`);
    }
  }

  async testConcurrentRequests(endpoint, concurrency = 10) {
    const promises = [];
    for (let i = 0; i < concurrency; i++) {
      promises.push(
        axios.get(endpoint, { timeout: 5000 })
          .then(response => ({ success: true, status: response.status, time: Date.now() }))
          .catch(error => ({ success: false, error: error.message, time: Date.now() }))
      );
    }

    const results = await Promise.all(promises);
    const successful = results.filter(r => r.success).length;
    
    if (successful < concurrency * 0.8) {
      throw new Error(`Only ${successful}/${concurrency} concurrent requests succeeded`);
    }
  }

  async runLoadTest(endpoint, duration = 10000, requestsPerSecond = 5) {
    this.log(`\n🔥 Load Test: ${endpoint}`, 'magenta');
    this.log(`📊 Duration: ${duration/1000}s, Rate: ${requestsPerSecond} req/s`, 'dim');

    const startTime = Date.now();
    const endTime = startTime + duration;
    const interval = 1000 / requestsPerSecond;
    
    const results = [];
    let requestCount = 0;
    let successCount = 0;

    while (Date.now() < endTime) {
      const requestStart = Date.now();
      
      try {
        const response = await axios.get(endpoint, { timeout: 5000 });
        const responseTime = Date.now() - requestStart;
        results.push({ success: true, time: responseTime });
        successCount++;
        process.stdout.write(`${colors.green}.${colors.reset}`);
      } catch (error) {
        const responseTime = Date.now() - requestStart;
        results.push({ success: false, time: responseTime, error: error.message });
        process.stdout.write(`${colors.red}x${colors.reset}`);
      }
      
      requestCount++;
      
      // Wait for next request
      const elapsed = Date.now() - requestStart;
      const waitTime = Math.max(0, interval - elapsed);
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    console.log(); // New line

    const avgResponseTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
    const successRate = (successCount / requestCount) * 100;
    const actualRPS = requestCount / (duration / 1000);

    this.log(`📈 Load Test Results:`, 'cyan');
    this.log(`   Requests: ${requestCount} (${actualRPS.toFixed(1)} req/s)`, 'cyan');
    this.log(`   Success Rate: ${successRate.toFixed(1)}% (${successCount}/${requestCount})`, 'cyan');
    this.log(`   Avg Response Time: ${avgResponseTime.toFixed(2)}ms`, 'cyan');

    return {
      requestCount,
      successCount,
      successRate,
      avgResponseTime,
      actualRPS
    };
  }

  async run() {
    this.log('🚀 Performance Testing Suite - Demo Data', 'bold');
    this.log('='.repeat(60), 'blue');
    this.log(`Backend: ${BACKEND_URL}`, 'dim');
    this.log(`Frontend: ${FRONTEND_URL}`, 'dim');
    this.log(`API Base: ${API_BASE}`, 'dim');

    // Basic Performance Tests
    this.log('\n📊 Basic Performance Tests', 'magenta');
    await this.runPerformanceTest('Health Check', () => this.testHealthEndpoint(), 20);
    await this.runPerformanceTest('API Test Endpoint', () => this.testAPIEndpoint(), 20);
    await this.runPerformanceTest('Users Endpoint', () => this.testUsersEndpoint(), 15);
    await this.runPerformanceTest('Companies Endpoint', () => this.testCompaniesEndpoint(), 15);
    await this.runPerformanceTest('Students Endpoint', () => this.testStudentsEndpoint(), 15);
    await this.runPerformanceTest('Internships Endpoint', () => this.testInternshipsEndpoint(), 15);

    // Authentication Performance Tests
    this.log('\n🔐 Authentication Performance Tests', 'magenta');
    await this.runPerformanceTest('Student Login', () => this.testStudentLogin(), 10);
    await this.runPerformanceTest('Staff Login', () => this.testStaffLogin(), 10);
    await this.runPerformanceTest('Dashboard Stats', () => this.testDashboardStats(), 10);

    // Frontend Performance Tests
    this.log('\n🎨 Frontend Performance Tests', 'magenta');
    await this.runPerformanceTest('Frontend Load', () => this.testFrontendLoad(), 5);

    // Concurrent Request Tests
    this.log('\n⚡ Concurrent Request Tests', 'magenta');
    await this.runPerformanceTest('Concurrent Health Checks', 
      () => this.testConcurrentRequests(`${BACKEND_URL}/health`, 10), 5);
    await this.runPerformanceTest('Concurrent API Calls', 
      () => this.testConcurrentRequests(`${API_BASE}/users`, 8), 5);

    // Load Tests
    this.log('\n🔥 Load Testing', 'magenta');
    const healthLoadTest = await this.runLoadTest(`${BACKEND_URL}/health`, 10000, 10);
    const apiLoadTest = await this.runLoadTest(`${API_BASE}/test`, 8000, 5);
    const usersLoadTest = await this.runLoadTest(`${API_BASE}/users`, 6000, 3);

    // Calculate final summary
    const allTimes = this.results.tests.flatMap(test => [test.minTime, test.maxTime]);
    this.results.summary.avgResponseTime = this.results.tests.reduce((sum, test) => 
      sum + parseFloat(test.avgTime), 0) / this.results.tests.length;

    // Print comprehensive results
    this.printResults({
      healthLoadTest,
      apiLoadTest,
      usersLoadTest
    });

    // Save results to file
    this.saveResults();

    // Exit with appropriate code
    process.exit(this.results.summary.failed > 0 ? 1 : 0);
  }

  printResults(loadTests) {
    this.log('\n' + '='.repeat(80), 'bold');
    this.log('📊 PERFORMANCE TEST RESULTS', 'bold');
    this.log('='.repeat(80), 'bold');

    // Overall Summary
    this.log(`\n📈 Overall Performance Summary:`, 'blue');
    this.log(`   Total Tests: ${this.results.summary.totalTests}`);
    this.log(`   Passed: ${this.results.summary.passed}`, 'green');
    this.log(`   Failed: ${this.results.summary.failed}`, this.results.summary.failed > 0 ? 'red' : 'green');
    this.log(`   Success Rate: ${((this.results.summary.passed / this.results.summary.totalTests) * 100).toFixed(1)}%`);

    // Response Time Statistics
    this.log(`\n⚡ Response Time Statistics:`, 'blue');
    this.log(`   Average: ${this.results.summary.avgResponseTime.toFixed(2)}ms`);
    this.log(`   Minimum: ${this.results.summary.minResponseTime}ms`);
    this.log(`   Maximum: ${this.results.summary.maxResponseTime}ms`);

    // Request Statistics
    this.log(`\n📊 Request Statistics:`, 'blue');
    this.log(`   Total Requests: ${this.results.summary.totalRequests}`);
    this.log(`   Successful: ${this.results.summary.successfulRequests}`, 'green');
    this.log(`   Failed: ${this.results.summary.failedRequests}`, this.results.summary.failedRequests > 0 ? 'red' : 'green');
    this.log(`   Overall Success Rate: ${((this.results.summary.successfulRequests / this.results.summary.totalRequests) * 100).toFixed(1)}%`);

    // Performance Categories
    this.log(`\n🏆 Performance Categories:`, 'blue');
    
    const avgTime = this.results.summary.avgResponseTime;
    let performanceGrade, performanceColor;
    
    if (avgTime < 50) {
      performanceGrade = 'A+ (Excellent)';
      performanceColor = 'green';
    } else if (avgTime < 100) {
      performanceGrade = 'A (Very Good)';
      performanceColor = 'green';
    } else if (avgTime < 200) {
      performanceGrade = 'B (Good)';
      performanceColor = 'yellow';
    } else if (avgTime < 500) {
      performanceGrade = 'C (Acceptable)';
      performanceColor = 'yellow';
    } else {
      performanceGrade = 'D (Needs Improvement)';
      performanceColor = 'red';
    }

    this.log(`   Performance Grade: ${performanceGrade}`, performanceColor);

    // Load Test Results
    this.log(`\n🔥 Load Test Summary:`, 'blue');
    this.log(`   Health Endpoint: ${loadTests.healthLoadTest.actualRPS.toFixed(1)} req/s, ${loadTests.healthLoadTest.avgResponseTime.toFixed(2)}ms avg`);
    this.log(`   API Endpoint: ${loadTests.apiLoadTest.actualRPS.toFixed(1)} req/s, ${loadTests.apiLoadTest.avgResponseTime.toFixed(2)}ms avg`);
    this.log(`   Users Endpoint: ${loadTests.usersLoadTest.actualRPS.toFixed(1)} req/s, ${loadTests.usersLoadTest.avgResponseTime.toFixed(2)}ms avg`);

    // Top Performing Endpoints
    this.log(`\n🚀 Top Performing Endpoints:`, 'blue');
    const sortedTests = [...this.results.tests].sort((a, b) => parseFloat(a.avgTime) - parseFloat(b.avgTime));
    sortedTests.slice(0, 5).forEach((test, index) => {
      this.log(`   ${index + 1}. ${test.name}: ${test.avgTime}ms avg`, 'green');
    });

    // Recommendations
    this.log(`\n💡 Performance Recommendations:`, 'blue');
    
    if (avgTime < 100) {
      this.log(`   ✅ Excellent performance! System is production-ready.`, 'green');
    } else if (avgTime < 200) {
      this.log(`   👍 Good performance. Consider caching for further optimization.`, 'yellow');
    } else {
      this.log(`   ⚠️  Performance could be improved. Consider:`, 'yellow');
      this.log(`      - Database query optimization`, 'dim');
      this.log(`      - Response caching`, 'dim');
      this.log(`      - Connection pooling`, 'dim');
    }

    if (this.results.summary.failedRequests > 0) {
      this.log(`   🔧 Address ${this.results.summary.failedRequests} failed requests for better reliability.`, 'yellow');
    }

    // Demo Readiness Assessment
    this.log(`\n🎬 Demo Readiness Assessment:`, 'blue');
    const demoScore = this.calculateDemoScore();
    
    if (demoScore >= 90) {
      this.log(`   🎉 EXCELLENT - Ready for demo! (Score: ${demoScore}/100)`, 'green');
    } else if (demoScore >= 75) {
      this.log(`   👍 GOOD - Demo ready with minor notes (Score: ${demoScore}/100)`, 'yellow');
    } else {
      this.log(`   ⚠️  NEEDS WORK - Address issues before demo (Score: ${demoScore}/100)`, 'red');
    }

    this.log('\n' + '='.repeat(80), 'bold');
  }

  calculateDemoScore() {
    const successRate = (this.results.summary.passed / this.results.summary.totalTests) * 100;
    const performanceScore = Math.max(0, 100 - (this.results.summary.avgResponseTime / 5));
    const reliabilityScore = (this.results.summary.successfulRequests / this.results.summary.totalRequests) * 100;
    
    return Math.round((successRate * 0.4 + performanceScore * 0.4 + reliabilityScore * 0.2));
  }

  saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `performance-test-results-${timestamp}.json`;
    
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: this.results.summary,
      tests: this.results.tests,
      demoScore: this.calculateDemoScore(),
      environment: {
        backend: BACKEND_URL,
        frontend: FRONTEND_URL,
        nodeVersion: process.version,
        platform: process.platform
      }
    };

    fs.writeFileSync(filename, JSON.stringify(reportData, null, 2));
    this.log(`\n💾 Results saved to: ${filename}`, 'cyan');
  }
}

// Run performance tests
if (require.main === module) {
  const tester = new PerformanceTester();
  tester.run().catch(error => {
    console.error('❌ Performance test runner failed:', error.message);
    process.exit(1);
  });
}

module.exports = PerformanceTester;