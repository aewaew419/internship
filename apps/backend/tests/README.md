# Go Backend Test Suite Documentation

This document provides comprehensive information about the test suite for the Go Fiber backend migration project.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Types](#test-types)
- [Coverage Reports](#coverage-reports)
- [CI/CD Integration](#cicd-integration)
- [Writing Tests](#writing-tests)
- [Troubleshooting](#troubleshooting)

## Overview

The test suite is designed to ensure the reliability, performance, and correctness of the Go Fiber backend application. It includes unit tests, integration tests, performance tests, and comprehensive coverage reporting.

### Test Goals

- **Reliability**: Ensure all components work correctly under various conditions
- **Performance**: Validate that the application meets performance requirements
- **Coverage**: Maintain high test coverage across all critical components
- **Regression Prevention**: Catch bugs before they reach production
- **Documentation**: Tests serve as living documentation of expected behavior

## Test Structure

```
tests/
├── README.md                    # This documentation
├── test_config.go              # Common test configuration and utilities
├── fixtures/                   # Test data fixtures
│   └── database_fixtures.go    # Database test data
├── unit/                       # Unit tests
│   └── services_test.go        # Service layer unit tests
├── integration/                # Integration tests
│   └── api_endpoints_test.go   # API endpoint integration tests
├── performance/                # Performance tests
│   └── performance_test.go     # Load and performance tests
└── coverage/                   # Coverage reports and utilities
    └── coverage_test.go        # Coverage generation tests
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
   DATABASE_URL=root:password@tcp(localhost:3306)/internship_test_db?charset=utf8mb4&parseTime=True&loc=Local
   JWT_SECRET=test-jwt-secret-key
   ENVIRONMENT=test
   ```

### Quick Start

```bash
# Run all tests
make test

# Run tests with coverage
make test-coverage

# Generate HTML coverage report
make coverage-html

# Run specific test types
make test-unit
make test-integration
make test-performance
```

### Using the Test Runner Script

```bash
# Run all tests with comprehensive reporting
./scripts/run_tests.sh

# Run with verbose output
./scripts/run_tests.sh -v

# Run only unit tests
./scripts/run_tests.sh -u

# Run with benchmarks
./scripts/run_tests.sh -b

# Show help
./scripts/run_tests.sh -h
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
    userService := services.NewUserService(mockDB)
    
    request := services.CreateUserRequest{
        FullName: stringPtr("Test User"),
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
func (suite *APIEndpointsTestSuite) TestAuthenticationEndpoints() {
    // Test user registration
    payload := map[string]interface{}{
        "full_name": "Test User",
        "email":     "test@example.com",
        "password":  "password123",
        "role_id":   1,
    }
    
    body, _ := json.Marshal(payload)
    req := httptest.NewRequest("POST", "/api/v1/register", bytes.NewReader(body))
    req.Header.Set("Content-Type", "application/json")
    
    resp, err := suite.app.Test(req)
    assert.NoError(t, err)
    assert.Equal(t, 201, resp.StatusCode)
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
func (suite *PerformanceTestSuite) TestAuthenticationPerformance() {
    result := suite.runPerformanceTest("Login", requestFunc, 10, 100)
    
    assert.Greater(t, result.RequestsPerSec, 50.0)
    assert.Less(t, result.AverageLatency, 100*time.Millisecond)
    assert.Equal(t, 0, result.FailedRequests)
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

## Coverage Reports

### Coverage Targets

- **Overall Coverage**: ≥ 70%
- **Critical Services**: ≥ 85%
- **API Handlers**: ≥ 80%
- **Business Logic**: ≥ 90%

### Report Formats

1. **HTML Report**: Interactive coverage visualization
   ```bash
   make coverage-html
   # Open coverage/coverage.html in browser
   ```

2. **Terminal Report**: Function-level coverage
   ```bash
   make coverage-func
   ```

3. **JSON Report**: Machine-readable format for CI/CD
   ```bash
   go test -coverprofile=coverage.out -json ./...
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

## CI/CD Integration

### GitHub Actions

The project includes a comprehensive GitHub Actions workflow (`.github/workflows/test.yml`) that:

- Runs tests on multiple Go versions
- Sets up MySQL database
- Executes all test suites
- Generates coverage reports
- Performs security scans
- Runs code quality checks
- Uploads artifacts

### Workflow Triggers

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual workflow dispatch

### Artifacts Generated

- Test results (JUnit XML)
- Coverage reports (HTML, text)
- Benchmark results
- Security scan results

## Writing Tests

### Test Structure Guidelines

1. **Use testify/suite** for complex test setups
2. **Follow AAA pattern**: Arrange, Act, Assert
3. **Use descriptive test names**: `TestServiceName_MethodName_Scenario`
4. **Include edge cases** and error conditions
5. **Mock external dependencies**

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

### Test Data Management

Use the fixtures package for consistent test data:

```go
// Create test fixtures
fixtures := fixtures.NewDatabaseFixtures(db)
fixtures.LoadAllFixtures()

// Clean up after tests
defer fixtures.CleanupTestData()
```

### Mocking Guidelines

```go
// Use interfaces for mockable dependencies
type UserRepository interface {
    CreateUser(user *models.User) error
    GetUserByEmail(email string) (*models.User, error)
}

// Create mock implementations for testing
type MockUserRepository struct {
    users map[string]*models.User
}

func (m *MockUserRepository) CreateUser(user *models.User) error {
    m.users[user.Email] = user
    return nil
}
```

### Performance Test Guidelines

1. **Use realistic data volumes**
2. **Test concurrent scenarios**
3. **Measure multiple metrics**
4. **Set performance thresholds**
5. **Document expected performance**

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

```bash
# Check MySQL is running
mysql -u root -p -e "SELECT 1"

# Verify test database exists
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS internship_test_db"

# Check connection string in .env.test
DATABASE_URL=root:password@tcp(localhost:3306)/internship_test_db?charset=utf8mb4&parseTime=True&loc=Local
```

#### 2. Test Timeouts

```bash
# Increase timeout for slow tests
go test -timeout 60m ./...

# Run tests in short mode
go test -short ./...
```

#### 3. Race Condition Failures

```bash
# Run without race detection for debugging
go test ./...

# Fix race conditions in code
# Use proper synchronization (mutexes, channels)
```

#### 4. Memory Issues

```bash
# Run with memory profiling
go test -memprofile=mem.prof ./...

# Analyze memory usage
go tool pprof mem.prof
```

### Debugging Tests

```bash
# Run specific test with verbose output
go test -v -run TestSpecificTest ./...

# Run tests with debugging
go test -v -run TestSpecificTest ./... -args -debug

# Use delve debugger
dlv test ./tests/unit -- -test.run TestSpecificTest
```

### Performance Debugging

```bash
# CPU profiling
go test -cpuprofile=cpu.prof -bench=. ./...
go tool pprof cpu.prof

# Memory profiling
go test -memprofile=mem.prof -bench=. ./...
go tool pprof mem.prof

# Trace analysis
go test -trace=trace.out ./...
go tool trace trace.out
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