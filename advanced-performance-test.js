#!/usr/bin/env node

/**
 * Advanced Performance Testing Suite
 * ทดสอบประสิทธิภาพขั้นสูงพร้อม Stress Testing และ Edge Cases
 */

const axios = require('axios');
const fs = require('fs');

// Configuration
const BACKEND_URL = 'http://localhost:8080';
const API_BASE = `${BACKEND_URL}/api/v1`;

// Colors
const colors = {
  green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m', blue: '\x1b[34m',
  magenta: '\x1b[35m', cyan: '\x1b[36m', reset: '\x1b[0m', bold: '\x1b[1m'
};

class AdvancedPerformanceTester {
  constructor() {
    this.results = {
      stressTests: [],
      edgeCaseTests: [],
      memoryTests: [],
      concurrencyTests: [],
      summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async measureMemoryUsage() {
    const used = process.memoryUsage();
    return {
      rss: Math.round(used.rss / 1024 / 1024 * 100) / 100,
      heapTotal: Math.round(used.heapTotal / 1024 / 1024 * 100) / 100,
      heapUsed: Math.round(used.heapUsed / 1024 / 1024 * 100) / 100,
      external: Math.round(used.external / 1024 / 1024 * 100) / 100
    };
  }

  async stressTestEndpoint(endpoint, maxConcurrency = 50, duration = 15000) {
    this.log(`\n🔥 Stress Test: ${endpoint}`, 'red');
    this.log(`📊 Max Concurrency: ${maxConcurrency}, Duration: ${duration/1000}s`, 'dim');

    const startTime = Date.now();
    const endTime = startTime + duration;
    const results = [];
    let activeRequests = 0;
    let completedRequests = 0;
    let failedRequests = 0;

    const makeRequest = async () => {
      if (Date.now() >= endTime) return;
      
      activeRequests++;
      const requestStart = Date.now();
      
      try {
        const response = await axios.get(endpoint, { timeout: 10000 });
        const responseTime = Date.now() - requestStart;
        results.push({ success: true, time: responseTime, status: response.status });
        completedRequests++;
        process.stdout.write(`${colors.green}.${colors.reset}`);
      } catch (error) {
        const responseTime = Date.now() - requestStart;
        results.push({ success: false, time: responseTime, error: error.message });
        failedRequests++;
        process.stdout.write(`${colors.red}x${colors.reset}`);
      } finally {
        activeRequests--;
      }
    };

    // Start initial batch of requests
    const promises = [];
    for (let i = 0; i < Math.min(maxConcurrency, 10); i++) {
      promises.push(makeRequest());
    }

    // Continue making requests until duration ends
    while (Date.now() < endTime) {
      if (activeRequests < maxConcurrency) {
        promises.push(makeRequest());
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Wait for all requests to complete
    await Promise.all(promises);
    console.log(); // New line

    // Calculate statistics
    const successfulResults = results.filter(r => r.success);
    const avgResponseTime = successfulResults.length > 0 
      ? successfulResults.reduce((sum, r) => sum + r.time, 0) / successfulResults.length 
      : 0;
    const minResponseTime = successfulResults.length > 0 
      ? Math.min(...successfulResults.map(r => r.time)) 
      : 0;
    const maxResponseTime = successfulResults.length > 0 
      ? Math.max(...successfulResults.map(r => r.time)) 
      : 0;
    const actualRPS = completedRequests / (duration / 1000);
    const successRate = (completedRequests / (completedRequests + failedRequests)) * 100;

    const stressResult = {
      endpoint,
      duration: duration / 1000,
      maxConcurrency,
      totalRequests: completedRequests + failedRequests,
      successfulRequests: completedRequests,
      failedRequests,
      successRate: successRate.toFixed(1),
      avgResponseTime: avgResponseTime.toFixed(2),
      minResponseTime,
      maxResponseTime,
      actualRPS: actualRPS.toFixed(1),
      status: successRate >= 95 ? 'EXCELLENT' : successRate >= 85 ? 'GOOD' : 'NEEDS_IMPROVEMENT'
    };

    this.results.stressTests.push(stressResult);

    // Display results
    const statusColor = stressResult.status === 'EXCELLENT' ? 'green' : 
                       stressResult.status === 'GOOD' ? 'yellow' : 'red';
    
    this.log(`🔥 Stress Test Results:`, statusColor);
    this.log(`   Total Requests: ${stressResult.totalRequests}`, 'cyan');
    this.log(`   Success Rate: ${stressResult.successRate}%`, 'cyan');
    this.log(`   Actual RPS: ${stressResult.actualRPS}`, 'cyan');
    this.log(`   Response Time: ${stressResult.avgResponseTime}ms avg (${minResponseTime}ms - ${maxResponseTime}ms)`, 'cyan');
    this.log(`   Status: ${stressResult.status}`, statusColor);

    return stressResult;
  }

  async testEdgeCases() {
    this.log(`\n🎯 Edge Case Testing`, 'magenta');
    
    const edgeCases = [
      {
        name: 'Invalid Student ID Login',
        test: async () => {
          const response = await axios.post(`${API_BASE}/auth/student-login`, {
            studentId: 'invalid123',
            password: 'password123'
          }, { 
            timeout: 5000,
            validateStatus: () => true 
          });
          return { status: response.status, expected: 401 };
        }
      },
      {
        name: 'Empty Login Credentials',
        test: async () => {
          const response = await axios.post(`${API_BASE}/login`, {
            email: '',
            password: ''
          }, { 
            timeout: 5000,
            validateStatus: () => true 
          });
          return { status: response.status, expected: 400 };
        }
      },
      {
        name: 'Non-existent User ID',
        test: async () => {
          const response = await axios.get(`${API_BASE}/users/999`, { 
            timeout: 5000,
            validateStatus: () => true 
          });
          return { status: response.status, expected: 404 };
        }
      },
      {
        name: 'Large Request Body',
        test: async () => {
          const largeData = 'x'.repeat(10000);
          const response = await axios.post(`${API_BASE}/login`, {
            email: largeData,
            password: 'test'
          }, { 
            timeout: 5000,
            validateStatus: () => true 
          });
          return { status: response.status, expected: 400 };
        }
      },
      {
        name: 'Malformed JSON',
        test: async () => {
          try {
            const response = await axios.post(`${API_BASE}/login`, 'invalid-json', {
              headers: { 'Content-Type': 'application/json' },
              timeout: 5000,
              validateStatus: () => true
            });
            return { status: response.status, expected: 400 };
          } catch (error) {
            return { status: 'ERROR', expected: 400, error: error.message };
          }
        }
      }
    ];

    for (const edgeCase of edgeCases) {
      const startTime = Date.now();
      try {
        const result = await edgeCase.test();
        const duration = Date.now() - startTime;
        
        const passed = result.status === result.expected;
        const status = passed ? 'PASS' : 'FAIL';
        const statusColor = passed ? 'green' : 'red';
        
        this.results.edgeCaseTests.push({
          name: edgeCase.name,
          status,
          duration,
          expected: result.expected,
          actual: result.status,
          error: result.error
        });

        this.log(`${passed ? '✅' : '❌'} ${edgeCase.name}: ${result.status} (expected ${result.expected}) - ${duration}ms`, statusColor);
        
        if (passed) this.results.summary.passed++;
        else this.results.summary.failed++;
        
      } catch (error) {
        this.log(`❌ ${edgeCase.name}: ERROR - ${error.message}`, 'red');
        this.results.summary.failed++;
      }
      
      this.results.summary.totalTests++;
    }
  }

  async testConcurrencyLimits() {
    this.log(`\n⚡ Concurrency Limit Testing`, 'magenta');
    
    const concurrencyLevels = [5, 10, 20, 30, 50];
    
    for (const level of concurrencyLevels) {
      this.log(`\n🔄 Testing ${level} concurrent requests...`, 'blue');
      
      const startTime = Date.now();
      const promises = [];
      
      for (let i = 0; i < level; i++) {
        promises.push(
          axios.get(`${API_BASE}/test`, { timeout: 10000 })
            .then(response => ({ success: true, status: response.status, time: Date.now() - startTime }))
            .catch(error => ({ success: false, error: error.message, time: Date.now() - startTime }))
        );
      }

      const results = await Promise.all(promises);
      const successful = results.filter(r => r.success).length;
      const avgTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
      const successRate = (successful / level) * 100;

      const concurrencyResult = {
        level,
        successful,
        total: level,
        successRate: successRate.toFixed(1),
        avgTime: avgTime.toFixed(2),
        status: successRate >= 90 ? 'PASS' : 'FAIL'
      };

      this.results.concurrencyTests.push(concurrencyResult);

      const statusColor = concurrencyResult.status === 'PASS' ? 'green' : 'red';
      this.log(`   ${concurrencyResult.status === 'PASS' ? '✅' : '❌'} Level ${level}: ${successful}/${level} success (${successRate.toFixed(1)}%) - ${avgTime.toFixed(2)}ms avg`, statusColor);

      if (concurrencyResult.status === 'PASS') this.results.summary.passed++;
      else this.results.summary.failed++;
      this.results.summary.totalTests++;
    }
  }

  async testMemoryUsage() {
    this.log(`\n💾 Memory Usage Testing`, 'magenta');
    
    const initialMemory = await this.measureMemoryUsage();
    this.log(`📊 Initial Memory Usage:`, 'cyan');
    this.log(`   RSS: ${initialMemory.rss}MB`, 'dim');
    this.log(`   Heap Used: ${initialMemory.heapUsed}MB`, 'dim');

    // Perform intensive operations
    const operations = [
      { name: 'Heavy API Calls', requests: 100, endpoint: `${API_BASE}/users` },
      { name: 'Authentication Stress', requests: 50, endpoint: `${API_BASE}/login` },
      { name: 'Data Retrieval', requests: 75, endpoint: `${API_BASE}/companies` }
    ];

    for (const operation of operations) {
      this.log(`\n🔄 ${operation.name} (${operation.requests} requests)...`, 'blue');
      
      const promises = [];
      for (let i = 0; i < operation.requests; i++) {
        if (operation.endpoint.includes('/login')) {
          promises.push(
            axios.post(operation.endpoint, {
              email: 'admin@university.ac.th',
              password: 'password123'
            }, { timeout: 5000 }).catch(() => {})
          );
        } else {
          promises.push(
            axios.get(operation.endpoint, { timeout: 5000 }).catch(() => {})
          );
        }
      }

      await Promise.all(promises);
      
      const currentMemory = await this.measureMemoryUsage();
      const memoryIncrease = currentMemory.heapUsed - initialMemory.heapUsed;
      
      this.log(`   Memory after ${operation.name}: ${currentMemory.heapUsed}MB (+${memoryIncrease.toFixed(2)}MB)`, 'cyan');
      
      this.results.memoryTests.push({
        operation: operation.name,
        requests: operation.requests,
        memoryBefore: initialMemory.heapUsed,
        memoryAfter: currentMemory.heapUsed,
        memoryIncrease: memoryIncrease.toFixed(2)
      });
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      const afterGC = await this.measureMemoryUsage();
      this.log(`   Memory after GC: ${afterGC.heapUsed}MB`, 'green');
    }
  }

  async testResponseConsistency() {
    this.log(`\n🎯 Response Consistency Testing`, 'magenta');
    
    const endpoints = [
      `${API_BASE}/users`,
      `${API_BASE}/companies`,
      `${API_BASE}/students`
    ];

    for (const endpoint of endpoints) {
      const responses = [];
      const times = [];
      
      // Make 10 requests and compare responses
      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        try {
          const response = await axios.get(endpoint, { timeout: 5000 });
          const responseTime = Date.now() - startTime;
          responses.push(JSON.stringify(response.data));
          times.push(responseTime);
        } catch (error) {
          responses.push(`ERROR: ${error.message}`);
          times.push(Date.now() - startTime);
        }
      }

      // Check consistency
      const uniqueResponses = [...new Set(responses)];
      const isConsistent = uniqueResponses.length === 1;
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const timeVariance = Math.max(...times) - Math.min(...times);

      const endpointName = endpoint.split('/').pop();
      this.log(`${isConsistent ? '✅' : '❌'} ${endpointName}: ${isConsistent ? 'Consistent' : 'Inconsistent'} responses`, 
        isConsistent ? 'green' : 'red');
      this.log(`   Response Time Variance: ${timeVariance}ms (avg: ${avgTime.toFixed(2)}ms)`, 'cyan');

      if (isConsistent) this.results.summary.passed++;
      else this.results.summary.failed++;
      this.results.summary.totalTests++;
    }
  }

  async testErrorRecovery() {
    this.log(`\n🛡️  Error Recovery Testing`, 'magenta');
    
    // Test recovery from various error conditions
    const errorTests = [
      {
        name: 'Timeout Recovery',
        test: async () => {
          try {
            await axios.get(`${API_BASE}/test`, { timeout: 1 }); // Very short timeout
          } catch (error) {
            // Should recover with normal timeout
            const response = await axios.get(`${API_BASE}/test`, { timeout: 5000 });
            return response.status === 200;
          }
          return false;
        }
      },
      {
        name: 'Invalid Endpoint Recovery',
        test: async () => {
          try {
            await axios.get(`${API_BASE}/invalid-endpoint`);
          } catch (error) {
            // Should still work with valid endpoint
            const response = await axios.get(`${API_BASE}/test`);
            return response.status === 200;
          }
          return false;
        }
      },
      {
        name: 'Malformed Request Recovery',
        test: async () => {
          try {
            await axios.post(`${API_BASE}/login`, 'invalid-data', {
              headers: { 'Content-Type': 'application/json' }
            });
          } catch (error) {
            // Should still work with valid request
            const response = await axios.post(`${API_BASE}/login`, {
              email: 'admin@university.ac.th',
              password: 'password123'
            });
            return response.status === 200;
          }
          return false;
        }
      }
    ];

    for (const errorTest of errorTests) {
      const startTime = Date.now();
      try {
        const recovered = await errorTest.test();
        const duration = Date.now() - startTime;
        
        this.log(`${recovered ? '✅' : '❌'} ${errorTest.name}: ${recovered ? 'Recovered' : 'Failed'} (${duration}ms)`, 
          recovered ? 'green' : 'red');
        
        if (recovered) this.results.summary.passed++;
        else this.results.summary.failed++;
        
      } catch (error) {
        this.log(`❌ ${errorTest.name}: ERROR - ${error.message}`, 'red');
        this.results.summary.failed++;
      }
      
      this.results.summary.totalTests++;
    }
  }

  async run() {
    this.log('🚀 Advanced Performance Testing Suite', 'bold');
    this.log('='.repeat(80), 'blue');
    this.log(`Testing Demo Data Performance`, 'dim');
    this.log(`Backend: ${BACKEND_URL}`, 'dim');

    // Check if backend is running
    try {
      await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });
      this.log('✅ Backend is running', 'green');
    } catch (error) {
      this.log('❌ Backend is not running', 'red');
      this.log('Please start the backend server first', 'yellow');
      process.exit(1);
    }

    // Run all test suites
    await this.testResponseConsistency();
    await this.testEdgeCases();
    await this.testConcurrencyLimits();
    await this.testMemoryUsage();

    // Stress tests
    this.log(`\n🔥 Stress Testing Phase`, 'red');
    await this.stressTestEndpoint(`${BACKEND_URL}/health`, 30, 10000);
    await this.stressTestEndpoint(`${API_BASE}/test`, 20, 8000);
    await this.stressTestEndpoint(`${API_BASE}/users`, 15, 6000);

    await this.testErrorRecovery();

    // Print final results
    this.printFinalResults();
    this.saveAdvancedResults();
  }

  printFinalResults() {
    this.log('\n' + '='.repeat(80), 'bold');
    this.log('🏆 ADVANCED PERFORMANCE TEST RESULTS', 'bold');
    this.log('='.repeat(80), 'bold');

    // Overall Summary
    this.log(`\n📊 Test Summary:`, 'blue');
    this.log(`   Total Tests: ${this.results.summary.totalTests}`);
    this.log(`   Passed: ${this.results.summary.passed}`, 'green');
    this.log(`   Failed: ${this.results.summary.failed}`, this.results.summary.failed > 0 ? 'red' : 'green');
    this.log(`   Success Rate: ${((this.results.summary.passed / this.results.summary.totalTests) * 100).toFixed(1)}%`);

    // Stress Test Summary
    this.log(`\n🔥 Stress Test Summary:`, 'blue');
    this.results.stressTests.forEach(test => {
      const statusColor = test.status === 'EXCELLENT' ? 'green' : 
                         test.status === 'GOOD' ? 'yellow' : 'red';
      this.log(`   ${test.endpoint.split('/').pop()}: ${test.actualRPS} req/s, ${test.avgResponseTime}ms avg, ${test.successRate}% success`, statusColor);
    });

    // Concurrency Test Summary
    this.log(`\n⚡ Concurrency Test Summary:`, 'blue');
    this.results.concurrencyTests.forEach(test => {
      const statusColor = test.status === 'PASS' ? 'green' : 'red';
      this.log(`   Level ${test.level}: ${test.successRate}% success, ${test.avgTime}ms avg`, statusColor);
    });

    // Memory Usage Summary
    this.log(`\n💾 Memory Usage Summary:`, 'blue');
    this.results.memoryTests.forEach(test => {
      const memoryColor = parseFloat(test.memoryIncrease) < 10 ? 'green' : 
                         parseFloat(test.memoryIncrease) < 50 ? 'yellow' : 'red';
      this.log(`   ${test.operation}: +${test.memoryIncrease}MB (${test.requests} requests)`, memoryColor);
    });

    // Performance Assessment
    this.log(`\n🎯 Performance Assessment:`, 'blue');
    const overallScore = this.calculateOverallScore();
    
    if (overallScore >= 90) {
      this.log(`   🎉 OUTSTANDING (${overallScore}/100) - Production ready!`, 'green');
    } else if (overallScore >= 80) {
      this.log(`   👍 EXCELLENT (${overallScore}/100) - Demo ready!`, 'green');
    } else if (overallScore >= 70) {
      this.log(`   ✅ GOOD (${overallScore}/100) - Minor optimizations needed`, 'yellow');
    } else {
      this.log(`   ⚠️  NEEDS IMPROVEMENT (${overallScore}/100) - Address performance issues`, 'red');
    }

    // Demo Readiness
    this.log(`\n🎬 Demo Readiness:`, 'blue');
    const demoReady = overallScore >= 75 && this.results.summary.failed < 3;
    
    if (demoReady) {
      this.log(`   🚀 READY FOR DEMO!`, 'green');
      this.log(`   ✅ System performs excellently under load`, 'green');
      this.log(`   ✅ Error handling is robust`, 'green');
      this.log(`   ✅ Concurrency handling is stable`, 'green');
    } else {
      this.log(`   ⚠️  Demo readiness concerns:`, 'yellow');
      if (this.results.summary.failed >= 3) {
        this.log(`      - ${this.results.summary.failed} tests failed`, 'red');
      }
      if (overallScore < 75) {
        this.log(`      - Performance score below threshold`, 'red');
      }
    }

    this.log('\n' + '='.repeat(80), 'bold');
  }

  calculateOverallScore() {
    const successRate = (this.results.summary.passed / this.results.summary.totalTests) * 100;
    const stressTestScore = this.results.stressTests.reduce((sum, test) => {
      return sum + (test.status === 'EXCELLENT' ? 100 : test.status === 'GOOD' ? 80 : 60);
    }, 0) / this.results.stressTests.length;
    
    const concurrencyScore = this.results.concurrencyTests.reduce((sum, test) => {
      return sum + (test.status === 'PASS' ? 100 : 50);
    }, 0) / this.results.concurrencyTests.length;

    return Math.round((successRate * 0.4 + stressTestScore * 0.4 + concurrencyScore * 0.2));
  }

  saveAdvancedResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `advanced-performance-results-${timestamp}.json`;
    
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: this.results.summary,
      stressTests: this.results.stressTests,
      edgeCaseTests: this.results.edgeCaseTests,
      concurrencyTests: this.results.concurrencyTests,
      memoryTests: this.results.memoryTests,
      overallScore: this.calculateOverallScore(),
      environment: {
        backend: BACKEND_URL,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };

    fs.writeFileSync(filename, JSON.stringify(reportData, null, 2));
    this.log(`\n💾 Advanced results saved to: ${filename}`, 'cyan');
  }
}

// Run advanced performance tests
if (require.main === module) {
  const tester = new AdvancedPerformanceTester();
  tester.run().catch(error => {
    console.error('❌ Advanced performance test failed:', error.message);
    process.exit(1);
  });
}

module.exports = AdvancedPerformanceTester;