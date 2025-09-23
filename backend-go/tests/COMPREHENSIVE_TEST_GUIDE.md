# Comprehensive Test Suite Guide

This document provides a complete guide to the comprehensive test suite for the Go Fiber backend migration project.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Types](#test-types)
- [Coverage Requirements](#coverage-requirements)
- [Performance Testing](#performance-testing)
- [Test Configuration](#test-configuration)
- [Writing Tests](#writing-tests)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Overview

The comprehensive test suite ensures the reliability, performance, and correctness of the Go Fiber backend application. It includes:

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test complete workflows and API endpoints
- **Performance Tests**: Validate performance characteristics
- **Database Tests**: Test database operations and data integrity
- **Coverage Reporting**: Maintain high test coverage across all components

### Test Goals

- **Reliability**: Ensure all components work correctly under various conditions
- **Performance**: Validate that the application meets performance requirements
- **Coverage**: Maintain high test coverage across all critical components
- **Regression Prevention**: Catch bugs before they reach production
- **Documentation**: Tests serve as living documentation of expected behavior

## Test Structure

```
tests/
├── COMPREHENSIVE_TEST_GUIDE.md     # This documentation
├── test_configuration.go           # Test configuration management
├── test_utilities.go              # Common testing utilities
├── comprehensive_suite_test.go     # Main comprehensive test suite
├── enhanced_coverage_test.go       # Enhanced coverage testing
├── unit/                          # Unit tests
│   └── services_test.go           # Service layer unit tests
├── integration/                   # Integration tests
│   └── api_endpoints_test.go      # API endpoint integration tests
├── performance/                   # Performance tests
│   └── performance_test.go        # Load and performance tests
├── fixtures/                      # Test data fixtures
│   └── database_fixtures.go       # Database test data
└── coverage/                      # Coverage reports and utilities
    └── coverage_test.go           # Coverage generation tests
```

## Running Tests

### Prerequisites

1. **Go 1.21+** installed
2. **MySQL** database (for integration tests)
3. **Make** utility (optional, for Makefile commands)

### Environment Setup

1. Copy the environment file:
   ```bash
   cp .env.example .env.test
   ```

2. Configure test database:
   ```bash
   # .env.test
   TEST_DATABASE_URL=root:password@tcp(localhost:3306)/internship_test_db?charset=utf8mb4&parseTime=True&loc=Local
   JWT_SECRET=test-jwt-secret-key
   ENVIRONMENT=test
   COVERAGE_THRESHOLD=70
   ENABLE_DATABASE_TESTS=true
   ENABLE_PERFORMANCE_TESTS=true
   ENABLE_INTEGRATION_TESTS=true
   ```

### Quick Start

```bash
# Run all tests
make test

# Run comprehensive test suite
make test-comprehensive

# Run enhanced test runner
make test-enhanced

# Run tests with coverage
make test-coverage

# Generate HTML coverage report
make coverage-html

# Run specific test types
make test-unit
make test-integration
make test-performance
```

### Using the Enhanced Test Runner

```bash
# Run all tests with comprehensive reporting
./scripts/enhanced_test_runner.sh

# Run only unit tests
./scripts/enhanced_test_runner.sh -u

# Run only integration tests
./scripts/enhanced_test_runner.sh -i

# Run with benchmarks
./scripts/enhanced_test_runner.sh -b

# Show help
./scripts/enhanced_test_runner.sh -h
```

### Manual Test Execution

```bash
# Unit tests
go test -race -timeout 30m ./tests/unit/...

# Integration tests
go test -race -timeout 30m ./tests/integration/...

# Performance tests
go test -timeout 30m ./tests/performance/...

# All tests with coverage
go test -race -timeout 30m -coverprofile=coverage.out ./...
```

## Test Types

### 1. Unit Tests

**Location**: `tests/unit/`

**Purpose**: Test individual components in isolation

**Coverage**:
- Service layer functions
- Utility functions
- Business logic
- Data validation
- Error handling

**Example**:
```go
func TestUserService_CreateUser(t *testing.T) {
    config := LoadTestConfiguration()
    utils := NewTestUtilities(mockDB, nil, config)
    
    userService := services.NewUserService(mockDB)
    
    request := services.CreateUserRequest{
        FullName: "Test User",
        Email:    "test@example.com",
        Password: "password123",
        RoleID:   1,
    }
    
    user, err := userService.CreateUser(request)
    assert.NoError(t, err)
    assert.Equal(t, "test@example.com", user.Email)
}
```

### 2. Integration Tests

**Location**: `tests/integration/`

**Purpose**: Test complete workflows and API endpoints

**Coverage**:
- HTTP endpoints
- Database operations
- Authentication flows
- File uploads
- PDF generation
- Error responses

**Example**:
```go
func (suite *ComprehensiveTestSuite) TestAuthenticationEndpoints() {
    utils := NewTestUtilities(suite.db, suite.app, suite.config)
    
    // Test user login
    payload := map[string]string{
        "email":    "test@example.com",
        "password": "password123",
    }
    
    resp := utils.MakeJSONRequest(t, "POST", "/api/v1/login", payload, nil)
    utils.AssertJSONResponse(t, resp, 200, map[string]interface{}{
        "success": true,
    })
}
```

### 3. Performance Tests

**Location**: `tests/performance/`

**Purpose**: Validate performance characteristics

**Coverage**:
- Response time benchmarks
- Concurrent request handling
- Memory usage under load
- Database query performance
- Throughput measurements

**Metrics Tracked**:
- Requests per second
- Average/min/max latency
- Memory consumption
- Error rates under load

**Example**:
```go
func (suite *ComprehensiveTestSuite) TestPerformanceCharacteristics() {
    utils := NewTestUtilities(suite.db, suite.app, suite.config)
    
    requestFunc := func() (*httptest.ResponseRecorder, error) {
        return utils.MakeAuthenticatedRequest(t, "GET", "/api/v1/users", nil, userID, "admin"), nil
    }
    
    result := utils.RunPerformanceTest(t, "User List", requestFunc, 10, 100)
    
    assert.Greater(t, result.RequestsPerSec, 50.0)
    assert.Less(t, result.AverageLatency, 100*time.Millisecond)
}
```

### 4. Database Tests

**Purpose**: Test database operations and data integrity

**Coverage**:
- Model relationships
- CRUD operations
- Migrations
- Constraints
- Transactions

## Coverage Requirements

### Coverage Targets

- **Overall Coverage**: ≥ 70%
- **Critical Services**: ≥ 85%
- **API Handlers**: ≥ 80%
- **Business Logic**: ≥ 90%

### Coverage Reports

1. **HTML Report**: Interactive coverage visualization
   ```bash
   make coverage-html
   # Open coverage/comprehensive_coverage.html in browser
   ```

2. **Terminal Report**: Function-level coverage
   ```bash
   make coverage-func
   ```

3. **Threshold Check**: Verify coverage meets requirements
   ```bash
   make test-coverage-threshold
   ```

### Coverage Analysis

```bash
# View coverage by package
go tool cover -func=coverage.out

# Generate detailed HTML report
go tool cover -html=coverage.out -o coverage.html

# Extract coverage percentage
go tool cover -func=coverage.out | grep total | awk '{print $3}'
```

## Performance Testing

### Performance Thresholds

The test suite includes configurable performance thresholds:

- **Requests per Second**: ≥ 50 req/sec (configurable)
- **Average Latency**: ≤ 100ms (configurable)
- **Maximum Latency**: ≤ 1s (configurable)
- **Error Rate**: ≤ 1% (configurable)

### Performance Test Configuration

```go
config := LoadTestConfiguration()
config.PerformanceThreshold.RequestsPerSecond = 100.0
config.PerformanceThreshold.AverageLatency = 50 * time.Millisecond
config.DefaultConcurrency = 20
config.DefaultRequestsPerTest = 200
```

### Running Performance Tests

```bash
# Run performance tests only
make test-performance

# Run with custom concurrency
TEST_CONCURRENCY=20 make test-performance

# Run with custom request count
TEST_REQUESTS_PER_TEST=500 make test-performance
```

## Test Configuration

### Environment Variables

The test suite supports extensive configuration through environment variables:

```bash
# Database configuration
DATABASE_URL=mysql://user:pass@localhost:3306/db
TEST_DATABASE_URL=mysql://user:pass@localhost:3306/test_db

# Test behavior
ENVIRONMENT=test
COVERAGE_THRESHOLD=80
ENABLE_DATABASE_TESTS=true
ENABLE_PERFORMANCE_TESTS=true
ENABLE_INTEGRATION_TESTS=true
ENABLE_BENCHMARK_TESTS=false

# Performance settings
TEST_CONCURRENCY=10
TEST_REQUESTS_PER_TEST=100

# Reporting
COVERAGE_DIR=coverage
REPORTS_DIR=test-reports
```

### Configuration Loading

```go
config := LoadTestConfiguration()
config.PrintConfiguration() // Display current settings
err := config.ValidateConfiguration() // Validate settings
```

## Writing Tests

### Test Structure Guidelines

1. **Use testify/suite** for complex test setups
2. **Follow AAA pattern**: Arrange, Act, Assert
3. **Use descriptive test names**: `TestServiceName_MethodName_Scenario`
4. **Include edge cases** and error conditions
5. **Use test utilities** for common operations

### Test Naming Conventions

```go
// Good test names
func TestUserService_CreateUser_ValidInput_ReturnsUser(t *testing.T) {}
func TestUserService_CreateUser_DuplicateEmail_ReturnsError(t *testing.T) {}
func TestAuthHandler_Login_InvalidCredentials_Returns401(t *testing.T) {}

// Poor test names
func TestCreateUser(t *testing.T) {}
func TestLogin(t *testing.T) {}
```

### Using Test Utilities

```go
func TestUserManagement(t *testing.T) {
    // Setup
    config := LoadTestConfiguration()
    utils := NewTestUtilities(db, app, config)
    
    // Create test user
    user := utils.CreateTestUser(t, "test@example.com", "Test User", 1)
    
    // Make authenticated request
    resp := utils.MakeAuthenticatedRequest(t, "GET", "/api/v1/users", nil, user.ID, "admin")
    
    // Assert response
    utils.AssertJSONResponse(t, resp, 200, map[string]interface{}{
        "success": true,
    })
    
    // Cleanup
    utils.CleanupTestData(t)
}
```

### Test Data Management

```go
// Use fixtures for consistent test data
fixtures := fixtures.NewDatabaseFixtures(db)
fixtures.LoadAllFixtures()

// Clean up after tests
defer fixtures.CleanupTestData()

// Create temporary files
tempFile := utils.CreateTempFile(t, "test content", ".txt")
defer os.Remove(tempFile)
```

## CI/CD Integration

### GitHub Actions

The project includes a comprehensive GitHub Actions workflow that:

- Runs tests on multiple Go versions
- Sets up MySQL database
- Executes all test suites
- Generates coverage reports
- Performs security scans
- Uploads artifacts

### Makefile Targets for CI

```bash
# Complete CI pipeline
make test-ci

# Individual CI steps
make lint
make test-coverage
make test-coverage-threshold
make test-report
```

### Artifacts Generated

- Test results (JUnit XML)
- Coverage reports (HTML, text)
- Performance test results
- Test execution logs

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

```bash
# Check MySQL is running
mysql -u root -p -e "SELECT 1"

# Create test database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS internship_test_db"

# Check connection string
TEST_DATABASE_URL=root:password@tcp(localhost:3306)/internship_test_db?charset=utf8mb4&parseTime=True&loc=Local
```

#### 2. Test Timeouts

```bash
# Increase timeout for slow tests
go test -timeout 60m ./...

# Run tests in short mode
go test -short ./...
```

#### 3. Coverage Issues

```bash
# Check coverage threshold
make test-coverage-threshold

# Generate detailed coverage report
make coverage-html

# View coverage by package
make test-services
make test-handlers
```

#### 4. Performance Test Failures

```bash
# Adjust performance thresholds
export TEST_CONCURRENCY=5
export TEST_REQUESTS_PER_TEST=50

# Run performance tests only
make test-performance
```

### Debugging Tests

```bash
# Run specific test with verbose output
go test -v -run TestSpecificTest ./...

# Run with race detection
go test -race ./...

# Use delve debugger
dlv test ./tests/unit -- -test.run TestSpecificTest
```

## Best Practices

### Test Organization

1. **Group related tests** in test suites
2. **Use setup/teardown** methods appropriately
3. **Keep tests independent** - no test should depend on another
4. **Use parallel tests** where possible for speed

### Test Data

1. **Use fixtures** for consistent test data
2. **Clean up after tests** to prevent interference
3. **Use realistic data** that represents production scenarios
4. **Avoid hardcoded values** - use constants or generators

### Assertions

1. **Use specific assertions** - `assert.Equal` vs `assert.True`
2. **Include helpful messages** in assertions
3. **Test both positive and negative cases**
4. **Verify error messages** and types

### Performance

1. **Set realistic thresholds** based on requirements
2. **Test under load** to find bottlenecks
3. **Monitor resource usage** (CPU, memory, database connections)
4. **Document performance expectations**

## Continuous Improvement

### Metrics to Track

- Test coverage percentage
- Test execution time
- Number of flaky tests
- Performance regression detection
- Bug escape rate

### Regular Maintenance

1. **Review and update tests** when requirements change
2. **Remove obsolete tests** that no longer provide value
3. **Refactor test code** to reduce duplication
4. **Update test data** to reflect current business scenarios
5. **Monitor test performance** and optimize slow tests

### Code Review Checklist

- [ ] Tests cover new functionality
- [ ] Tests include error cases
- [ ] Test names are descriptive
- [ ] No hardcoded values
- [ ] Proper cleanup in teardown
- [ ] Performance tests for critical paths
- [ ] Documentation updated if needed

## Resources

- [Go Testing Documentation](https://golang.org/pkg/testing/)
- [Testify Framework](https://github.com/stretchr/testify)
- [Go Test Coverage](https://golang.org/doc/tutorial/add-a-test)
- [Fiber Testing Guide](https://docs.gofiber.io/guide/testing)
- [GORM Testing](https://gorm.io/docs/testing.html)