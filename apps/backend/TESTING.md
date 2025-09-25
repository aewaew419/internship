# Backend Testing Guide

## Overview

This document describes the comprehensive testing infrastructure for the Go backend application, including unit tests, integration tests, and performance tests.

## Testing Stack

- **Go Testing**: Built-in Go testing framework
- **Testify**: Assertion library and test suites
- **GORM**: Database testing with SQLite in-memory
- **Fiber**: HTTP testing with test requests
- **Golangci-lint**: Code quality and linting
- **Go-junit-report**: JUnit XML report generation

## Test Types

### 1. Unit Tests
- **Location**: `tests/unit/`
- **Purpose**: Test individual functions, methods, and components in isolation
- **Command**: `make test-unit`
- **Coverage Threshold**: 85%

### 2. Integration Tests
- **Location**: `tests/integration/`
- **Purpose**: Test API endpoints, database interactions, and service integrations
- **Command**: `make test-integration`
- **Coverage Threshold**: 75%

### 3. Performance Tests
- **Location**: `tests/performance/`
- **Purpose**: Test application performance, benchmarks, and load testing
- **Command**: `make test-performance`

## Configuration Files

### Test Configuration
- `tests/enhanced_test_config.go` - Comprehensive test configuration
- `tests/test_config.go` - Basic test configuration
- `tests/test_utilities.go` - Test utility functions
- `tests/test_seeder.go` - Database seeding for tests

### Build Configuration
- `Makefile` - Test execution commands and targets
- `scripts/enhanced_test_runner.sh` - Comprehensive test runner script
- `.github/workflows/test.yml` - CI/CD pipeline configuration

## Test Utilities

### Test Suites
```go
// Enhanced test suite with comprehensive setup
type EnhancedTestSuite struct {
    suite.Suite
    app           *fiber.App
    db            *gorm.DB
    config        *config.Config
    testUtilities *TestUtilities
}

// Basic test suite for simple tests
type BaseTestSuite struct {
    suite.Suite
    app    *fiber.App
    db     *gorm.DB
    config *config.Config
}
```

### Test Utilities
```go
// Create test users
user := testUtils.CreateTestUser(t, "test@example.com", "Test User", 2)

// Make authenticated requests
resp := testUtils.MakeAuthenticatedRequest(t, "GET", "/api/users", nil, userID, "admin")

// Assert JSON responses
testUtils.AssertJSONResponse(t, resp, 200, map[string]interface{}{
    "success": true,
})

// Assert database records
testUtils.AssertDatabaseRecord(t, &models.User{}, "email = ?", "test@example.com")
```

### Database Seeding
```go
// Seed all test data
seeder := NewTestSeeder(db)
err := seeder.SeedAll()

// Seed minimal data for basic tests
err := seeder.SeedMinimalData()

// Seed performance test data
err := seeder.SeedPerformanceTestData(1000, 100) // 1000 users, 100 courses

// Clean all seeded data
err := seeder.CleanAll()
```

## Writing Tests

### Unit Test Example
```go
// tests/unit/services/user_service_test.go
package unit

import (
    "testing"
    "backend-go/internal/services"
    "backend-go/tests"
    "github.com/stretchr/testify/suite"
)

type UserServiceTestSuite struct {
    tests.EnhancedTestSuite
    userService *services.UserService
}

func (suite *UserServiceTestSuite) SetupTest() {
    suite.EnhancedTestSuite.SetupTest()
    suite.userService = services.NewUserService(suite.GetDB())
}

func (suite *UserServiceTestSuite) TestCreateUser() {
    // Arrange
    userData := &services.CreateUserRequest{
        Email:    "test@example.com",
        FullName: "Test User",
        RoleID:   2,
    }
    
    // Act
    user, err := suite.userService.CreateUser(userData)
    
    // Assert
    suite.NoError(err)
    suite.NotNil(user)
    suite.Equal("test@example.com", user.Email)
    suite.Equal("Test User", *user.FullName)
    
    // Verify database
    suite.GetTestUtilities().AssertDatabaseRecord(
        suite.T(), 
        &models.User{}, 
        "email = ?", 
        "test@example.com",
    )
}

func TestUserServiceTestSuite(t *testing.T) {
    suite.Run(t, new(UserServiceTestSuite))
}
```

### Integration Test Example
```go
// tests/integration/auth_integration_test.go
package integration

import (
    "testing"
    "backend-go/tests"
    "github.com/stretchr/testify/suite"
)

type AuthIntegrationTestSuite struct {
    tests.EnhancedTestSuite
}

func (suite *AuthIntegrationTestSuite) TestLoginEndpoint() {
    // Create test user
    testUtils := suite.GetTestUtilities()
    user := testUtils.CreateTestUser(suite.T(), "test@example.com", "Test User", 2)
    
    // Test login
    loginData := map[string]interface{}{
        "email":    "test@example.com",
        "password": "password123",
    }
    
    resp := testUtils.MakeJSONRequest(
        suite.T(), 
        "POST", 
        "/api/auth/login", 
        loginData, 
        nil,
    )
    
    // Assert response
    testUtils.AssertJSONResponse(suite.T(), resp, 200, map[string]interface{}{
        "success": true,
    })
    
    // Verify token in response
    responseData := testUtils.GetResponseJSON(suite.T(), resp)
    suite.Contains(responseData, "token")
    suite.NotEmpty(responseData["token"])
}

func TestAuthIntegrationTestSuite(t *testing.T) {
    suite.Run(t, new(AuthIntegrationTestSuite))
}
```

### Performance Test Example
```go
// tests/performance/user_performance_test.go
package performance

import (
    "testing"
    "backend-go/tests"
    "github.com/stretchr/testify/suite"
)

type UserPerformanceTestSuite struct {
    tests.EnhancedTestSuite
}

func (suite *UserPerformanceTestSuite) SetupSuite() {
    suite.EnhancedTestSuite.SetupSuite()
    
    // Seed performance test data
    seeder := tests.NewTestSeeder(suite.GetDB())
    err := seeder.SeedPerformanceTestData(1000, 100)
    suite.Require().NoError(err)
}

func (suite *UserPerformanceTestSuite) BenchmarkGetUsers() {
    testUtils := suite.GetTestUtilities()
    token := testUtils.GenerateAuthToken(suite.T(), 1, "admin")
    
    suite.T().ResetTimer()
    
    for i := 0; i < suite.T().N; i++ {
        resp := testUtils.MakeJSONRequest(
            suite.T(),
            "GET",
            "/api/users?limit=50",
            nil,
            map[string]string{"Authorization": "Bearer " + token},
        )
        
        suite.Equal(200, resp.StatusCode)
    }
}

func TestUserPerformanceTestSuite(t *testing.T) {
    suite.Run(t, new(UserPerformanceTestSuite))
}
```

## Test Commands

### Basic Commands
```bash
# Run all tests
make test

# Run with coverage
make test-coverage

# Generate HTML coverage report
make coverage-html

# Show coverage by function
make coverage-func
```

### Test Type Commands
```bash
# Run unit tests only
make test-unit

# Run integration tests only
make test-integration

# Run performance tests only
make test-performance
```

### Package-Specific Commands
```bash
# Test specific packages
make test-services
make test-handlers
make test-middleware
make test-models
```

### Advanced Commands
```bash
# Run comprehensive test suite
make test-comprehensive

# Run enhanced test runner
make test-enhanced

# Check coverage threshold
make test-coverage-threshold

# Run tests in parallel
make test-parallel

# Generate test reports
make test-report

# Run CI pipeline
make test-ci
```

### Development Commands
```bash
# Run tests in verbose mode
make test-verbose

# Run tests in short mode (skip long tests)
make test-short

# Run specific test by name
make test-run TEST=TestUserService

# Run with race detection
make test-race

# Watch for changes and run tests
make test-watch
```

## Coverage Reports

Coverage reports are generated in the `coverage/` directory:
- `coverage/combined_coverage.html` - HTML coverage report
- `coverage/combined_coverage.out` - Coverage data file
- `coverage/coverage_report.txt` - Text coverage summary

### Coverage Thresholds
- **Global**: 70% minimum
- **Unit Tests**: 85% target
- **Integration Tests**: 75% target
- **Critical Packages**: 90% target

## Database Testing

### Test Database Setup
- Uses SQLite in-memory database for fast testing
- Automatic migrations run before each test suite
- Test data seeding with realistic data
- Automatic cleanup after tests

### Test Data Management
```go
// Create test data
seeder := NewTestSeeder(db)
seeder.SeedAll()

// Get seeded data
user, err := seeder.GetSeededUserByRole("admin")
student, err := seeder.GetSeededStudentByID("STD001")
course, err := seeder.GetSeededCourseByCode("CS101")

// Clean up
seeder.CleanAll()
```

## API Testing

### HTTP Request Testing
```go
// JSON requests
resp := testUtils.MakeJSONRequest(t, "POST", "/api/users", userData, headers)

// Authenticated requests
resp := testUtils.MakeAuthenticatedRequest(t, "GET", "/api/users", nil, userID, "admin")

// Multipart form requests
resp := testUtils.CreateMultipartRequest(t, "/api/upload", files, fields, headers)
```

### Response Assertions
```go
// Assert JSON response
testUtils.AssertJSONResponse(t, resp, 200, map[string]interface{}{
    "success": true,
    "data": map[string]interface{}{
        "id": 1,
    },
})

// Assert error response
testUtils.AssertErrorResponse(t, resp, 400, "validation failed")

// Get response data
data := testUtils.GetResponseJSON(t, resp)
```

## Performance Testing

### Benchmark Tests
```go
func BenchmarkUserCreation(b *testing.B) {
    // Setup
    suite := setupTestSuite()
    defer suite.cleanup()
    
    b.ResetTimer()
    
    for i := 0; i < b.N; i++ {
        // Test code here
    }
}
```

### Load Testing
```go
func (suite *PerformanceTestSuite) TestConcurrentUserCreation() {
    concurrency := 10
    totalRequests := 100
    
    result := suite.GetTestUtilities().RunPerformanceTest(
        suite.T(),
        "User Creation",
        func() (*httptest.ResponseRecorder, error) {
            return suite.createUserRequest()
        },
        concurrency,
        totalRequests,
    )
    
    // Assert performance metrics
    suite.Less(result.AverageLatency, 100*time.Millisecond)
    suite.Greater(result.RequestsPerSec, 50.0)
}
```

## CI/CD Integration

### GitHub Actions
The test pipeline runs automatically on:
- Push to main/develop branches
- Pull requests to main/develop branches
- Changes to backend code

### Pipeline Steps
1. **Setup**: Go installation, dependency caching
2. **Linting**: Code quality checks with golangci-lint
3. **Unit Tests**: Fast unit test execution
4. **Integration Tests**: API and database integration tests
5. **Performance Tests**: Benchmark and load tests
6. **Coverage**: Combined coverage report and threshold check
7. **Security**: Security scanning with Gosec
8. **Build**: Application build verification

### Artifacts
- Coverage reports (HTML and LCOV)
- Test reports (JUnit XML and Markdown)
- Performance profiles (CPU and memory)
- Security scan results (SARIF)

## Best Practices

### Test Organization
- Group related tests in test suites
- Use descriptive test names that explain the scenario
- Follow Arrange-Act-Assert pattern
- Keep tests independent and isolated

### Database Testing
- Use transactions for test isolation when possible
- Clean up test data after each test
- Use realistic test data that matches production patterns
- Test both success and failure scenarios

### API Testing
- Test all HTTP methods and status codes
- Validate request/response formats
- Test authentication and authorization
- Include edge cases and error conditions

### Performance Testing
- Set realistic performance targets
- Test under various load conditions
- Monitor memory usage and CPU utilization
- Profile slow tests to identify bottlenecks

### Mocking and Stubbing
- Mock external dependencies (APIs, services)
- Use dependency injection for testability
- Keep mocks simple and focused
- Verify mock interactions when necessary

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check database URL configuration
   - Ensure test database is accessible
   - Verify migration files are correct

2. **Test Timeouts**
   - Increase timeout values for slow tests
   - Check for deadlocks or infinite loops
   - Optimize database queries

3. **Coverage Issues**
   - Exclude generated code from coverage
   - Add tests for uncovered code paths
   - Check coverage thresholds are realistic

4. **Flaky Tests**
   - Ensure proper test isolation
   - Fix race conditions
   - Use deterministic test data

### Debug Commands
```bash
# Run specific test with verbose output
go test -v -run TestSpecificTest ./tests/unit/

# Run tests with race detection
go test -race ./...

# Profile memory usage
go test -memprofile=mem.prof ./tests/performance/

# Profile CPU usage
go test -cpuprofile=cpu.prof ./tests/performance/

# Analyze profiles
go tool pprof mem.prof
go tool pprof cpu.prof
```

## Maintenance

### Regular Tasks
- Update test dependencies monthly
- Review and update coverage thresholds quarterly
- Clean up obsolete tests when refactoring
- Monitor test execution time and optimize slow tests

### Metrics to Track
- Test coverage percentage
- Test execution time
- Number of flaky tests
- Test maintenance overhead
- Performance benchmark trends

## Tools and Dependencies

### Required Tools
- Go 1.21+ (testing framework)
- Make (build automation)
- Git (version control)

### Optional Tools
- golangci-lint (code quality)
- go-junit-report (JUnit XML reports)
- pprof (performance profiling)
- Codecov (coverage reporting)

### Dependencies
- github.com/stretchr/testify (assertions and suites)
- github.com/gofiber/fiber/v2 (HTTP testing)
- gorm.io/gorm (database testing)
- gorm.io/driver/sqlite (in-memory database)
- github.com/DATA-DOG/go-sqlmock (SQL mocking)