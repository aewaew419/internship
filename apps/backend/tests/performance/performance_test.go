package performance

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http/httptest"
	"sync"
	"testing"
	"time"

	"backend-go/tests"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
)

// PerformanceTestSuite tests performance of critical endpoints
type PerformanceTestSuite struct {
	tests.BaseTestSuite
}

// PerformanceResult holds performance test results
type PerformanceResult struct {
	TotalRequests   int
	SuccessRequests int
	FailedRequests  int
	TotalDuration   time.Duration
	AverageLatency  time.Duration
	MinLatency      time.Duration
	MaxLatency      time.Duration
	RequestsPerSec  float64
}

// runPerformanceTest executes a performance test with given parameters
func (suite *PerformanceTestSuite) runPerformanceTest(
	name string,
	requestFunc func() (*httptest.ResponseRecorder, error),
	concurrency int,
	totalRequests int,
) *PerformanceResult {
	
	result := &PerformanceResult{
		TotalRequests: totalRequests,
		MinLatency:    time.Hour, // Initialize with high value
	}

	var wg sync.WaitGroup
	var mu sync.Mutex
	
	requestsPerWorker := totalRequests / concurrency
	latencies := make([]time.Duration, 0, totalRequests)
	
	startTime := time.Now()
	
	// Launch concurrent workers
	for i := 0; i < concurrency; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			
			for j := 0; j < requestsPerWorker; j++ {
				requestStart := time.Now()
				resp, err := requestFunc()
				requestDuration := time.Since(requestStart)
				
				mu.Lock()
				latencies = append(latencies, requestDuration)
				
				if err != nil || resp.Code >= 400 {
					result.FailedRequests++
				} else {
					result.SuccessRequests++
				}
				
				if requestDuration < result.MinLatency {
					result.MinLatency = requestDuration
				}
				if requestDuration > result.MaxLatency {
					result.MaxLatency = requestDuration
				}
				mu.Unlock()
			}
		}(i)
	}
	
	wg.Wait()
	result.TotalDuration = time.Since(startTime)
	
	// Calculate average latency
	var totalLatency time.Duration
	for _, latency := range latencies {
		totalLatency += latency
	}
	result.AverageLatency = totalLatency / time.Duration(len(latencies))
	
	// Calculate requests per second
	result.RequestsPerSec = float64(result.SuccessRequests) / result.TotalDuration.Seconds()
	
	suite.T().Logf("Performance Test: %s", name)
	suite.T().Logf("  Total Requests: %d", result.TotalRequests)
	suite.T().Logf("  Success Requests: %d", result.SuccessRequests)
	suite.T().Logf("  Failed Requests: %d", result.FailedRequests)
	suite.T().Logf("  Total Duration: %v", result.TotalDuration)
	suite.T().Logf("  Average Latency: %v", result.AverageLatency)
	suite.T().Logf("  Min Latency: %v", result.MinLatency)
	suite.T().Logf("  Max Latency: %v", result.MaxLatency)
	suite.T().Logf("  Requests/sec: %.2f", result.RequestsPerSec)
	
	return result
}

// Test Authentication Performance
func (suite *PerformanceTestSuite) TestAuthenticationPerformance() {
	t := suite.T()
	
	// Create test user for login tests
	testUser := suite.CreateTestUser("perftest@example.com", "Performance Test User", 1)
	
	t.Run("Login Performance", func(t *testing.T) {
		requestFunc := func() (*httptest.ResponseRecorder, error) {
			payload := map[string]string{
				"email":    "perftest@example.com",
				"password": "password123",
			}
			
			body, _ := json.Marshal(payload)
			req := httptest.NewRequest("POST", "/api/v1/login", bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			
			resp, err := suite.app.Test(req)
			return resp, err
		}
		
		result := suite.runPerformanceTest("Login", requestFunc, 10, 100)
		
		// Performance assertions
		assert.Greater(t, result.RequestsPerSec, 50.0, "Login should handle at least 50 requests per second")
		assert.Less(t, result.AverageLatency, 100*time.Millisecond, "Average login latency should be under 100ms")
		assert.Equal(t, 0, result.FailedRequests, "No login requests should fail")
	})
	
	t.Run("JWT Token Validation Performance", func(t *testing.T) {
		token := suite.GetAuthToken(testUser.ID, "admin")
		
		requestFunc := func() (*httptest.ResponseRecorder, error) {
			req := httptest.NewRequest("GET", "/api/v1/me", nil)
			req.Header.Set("Authorization", "Bearer "+token)
			
			resp, err := suite.app.Test(req)
			return resp, err
		}
		
		result := suite.runPerformanceTest("JWT Validation", requestFunc, 20, 200)
		
		// Performance assertions
		assert.Greater(t, result.RequestsPerSec, 100.0, "JWT validation should handle at least 100 requests per second")
		assert.Less(t, result.AverageLatency, 50*time.Millisecond, "Average JWT validation latency should be under 50ms")
		assert.Equal(t, 0, result.FailedRequests, "No JWT validation requests should fail")
	})
}

// Test User Management Performance
func (suite *PerformanceTestSuite) TestUserManagementPerformance() {
	t := suite.T()
	
	// Create admin user for testing
	adminUser := suite.CreateTestUser("admin-perf@example.com", "Admin Performance User", 1)
	adminToken := suite.GetAuthToken(adminUser.ID, "admin")
	
	// Create test users for listing performance
	for i := 1; i <= 50; i++ {
		suite.CreateTestUser(fmt.Sprintf("user%d@example.com", i), fmt.Sprintf("User %d", i), 2)
	}
	
	t.Run("Get Users List Performance", func(t *testing.T) {
		requestFunc := func() (*httptest.ResponseRecorder, error) {
			req := httptest.NewRequest("GET", "/api/v1/users?page=1&limit=20", nil)
			req.Header.Set("Authorization", "Bearer "+adminToken)
			
			resp, err := suite.app.Test(req)
			return resp, err
		}
		
		result := suite.runPerformanceTest("Get Users List", requestFunc, 15, 150)
		
		// Performance assertions
		assert.Greater(t, result.RequestsPerSec, 30.0, "User listing should handle at least 30 requests per second")
		assert.Less(t, result.AverageLatency, 200*time.Millisecond, "Average user listing latency should be under 200ms")
		assert.Equal(t, 0, result.FailedRequests, "No user listing requests should fail")
	})
	
	t.Run("Create User Performance", func(t *testing.T) {
		counter := 0
		var mu sync.Mutex
		
		requestFunc := func() (*httptest.ResponseRecorder, error) {
			mu.Lock()
			counter++
			userNum := counter
			mu.Unlock()
			
			payload := map[string]interface{}{
				"full_name": fmt.Sprintf("Performance User %d", userNum),
				"email":     fmt.Sprintf("perfuser%d@example.com", userNum),
				"password":  "password123",
				"role_id":   2,
			}
			
			body, _ := json.Marshal(payload)
			req := httptest.NewRequest("POST", "/api/v1/users", bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("Authorization", "Bearer "+adminToken)
			
			resp, err := suite.app.Test(req)
			return resp, err
		}
		
		result := suite.runPerformanceTest("Create User", requestFunc, 5, 50)
		
		// Performance assertions
		assert.Greater(t, result.RequestsPerSec, 10.0, "User creation should handle at least 10 requests per second")
		assert.Less(t, result.AverageLatency, 500*time.Millisecond, "Average user creation latency should be under 500ms")
		assert.LessOrEqual(t, result.FailedRequests, 5, "User creation should have minimal failures")
	})
}

// Test Student Management Performance
func (suite *PerformanceTestSuite) TestStudentManagementPerformance() {
	t := suite.T()
	
	// Create admin user for testing
	adminUser := suite.CreateTestUser("admin-student-perf@example.com", "Admin Student Performance User", 1)
	adminToken := suite.GetAuthToken(adminUser.ID, "admin")
	
	// Create test students
	for i := 1; i <= 30; i++ {
		suite.CreateTestStudent(fmt.Sprintf("STU%03d", i), fmt.Sprintf("student%d@example.com", i), fmt.Sprintf("Student %d", i))
	}
	
	t.Run("Get Students List Performance", func(t *testing.T) {
		requestFunc := func() (*httptest.ResponseRecorder, error) {
			req := httptest.NewRequest("GET", "/api/v1/students?page=1&limit=15", nil)
			req.Header.Set("Authorization", "Bearer "+adminToken)
			
			resp, err := suite.app.Test(req)
			return resp, err
		}
		
		result := suite.runPerformanceTest("Get Students List", requestFunc, 10, 100)
		
		// Performance assertions
		assert.Greater(t, result.RequestsPerSec, 25.0, "Student listing should handle at least 25 requests per second")
		assert.Less(t, result.AverageLatency, 250*time.Millisecond, "Average student listing latency should be under 250ms")
		assert.Equal(t, 0, result.FailedRequests, "No student listing requests should fail")
	})
}

// Test Database Query Performance
func (suite *PerformanceTestSuite) TestDatabaseQueryPerformance() {
	t := suite.T()
	
	t.Run("Database Connection Performance", func(t *testing.T) {
		requestFunc := func() (*httptest.ResponseRecorder, error) {
			req := httptest.NewRequest("GET", "/health/db", nil)
			
			resp, err := suite.app.Test(req)
			return resp, err
		}
		
		result := suite.runPerformanceTest("Database Health Check", requestFunc, 25, 250)
		
		// Performance assertions
		assert.Greater(t, result.RequestsPerSec, 200.0, "DB health check should handle at least 200 requests per second")
		assert.Less(t, result.AverageLatency, 25*time.Millisecond, "Average DB health check latency should be under 25ms")
		assert.Equal(t, 0, result.FailedRequests, "No DB health check requests should fail")
	})
}

// Test Concurrent User Operations
func (suite *PerformanceTestSuite) TestConcurrentUserOperations() {
	t := suite.T()
	
	// Create multiple admin users for concurrent operations
	var adminTokens []string
	for i := 1; i <= 5; i++ {
		adminUser := suite.CreateTestUser(fmt.Sprintf("concurrent-admin%d@example.com", i), fmt.Sprintf("Concurrent Admin %d", i), 1)
		token := suite.GetAuthToken(adminUser.ID, "admin")
		adminTokens = append(adminTokens, token)
	}
	
	t.Run("Concurrent Mixed Operations", func(t *testing.T) {
		counter := 0
		var mu sync.Mutex
		
		requestFunc := func() (*httptest.ResponseRecorder, error) {
			mu.Lock()
			counter++
			opNum := counter
			tokenIndex := (counter - 1) % len(adminTokens)
			token := adminTokens[tokenIndex]
			mu.Unlock()
			
			// Alternate between different operations
			switch opNum % 4 {
			case 0: // Get users
				req := httptest.NewRequest("GET", "/api/v1/users?page=1&limit=10", nil)
				req.Header.Set("Authorization", "Bearer "+token)
				return suite.app.Test(req)
				
			case 1: // Get user stats
				req := httptest.NewRequest("GET", "/api/v1/users/stats", nil)
				req.Header.Set("Authorization", "Bearer "+token)
				return suite.app.Test(req)
				
			case 2: // Get students
				req := httptest.NewRequest("GET", "/api/v1/students?page=1&limit=10", nil)
				req.Header.Set("Authorization", "Bearer "+token)
				return suite.app.Test(req)
				
			case 3: // Health check
				req := httptest.NewRequest("GET", "/health", nil)
				return suite.app.Test(req)
				
			default:
				req := httptest.NewRequest("GET", "/health", nil)
				return suite.app.Test(req)
			}
		}
		
		result := suite.runPerformanceTest("Concurrent Mixed Operations", requestFunc, 20, 200)
		
		// Performance assertions
		assert.Greater(t, result.RequestsPerSec, 40.0, "Mixed operations should handle at least 40 requests per second")
		assert.Less(t, result.AverageLatency, 300*time.Millisecond, "Average mixed operations latency should be under 300ms")
		assert.LessOrEqual(t, result.FailedRequests, 10, "Mixed operations should have minimal failures")
	})
}

// Test Memory Usage Under Load
func (suite *PerformanceTestSuite) TestMemoryUsageUnderLoad() {
	t := suite.T()
	
	adminUser := suite.CreateTestUser("memory-test-admin@example.com", "Memory Test Admin", 1)
	adminToken := suite.GetAuthToken(adminUser.ID, "admin")
	
	t.Run("Memory Usage During High Load", func(t *testing.T) {
		// Create a large number of users to test memory usage
		for i := 1; i <= 100; i++ {
			suite.CreateTestUser(fmt.Sprintf("memuser%d@example.com", i), fmt.Sprintf("Memory User %d", i), 2)
		}
		
		requestFunc := func() (*httptest.ResponseRecorder, error) {
			req := httptest.NewRequest("GET", "/api/v1/users?page=1&limit=50", nil)
			req.Header.Set("Authorization", "Bearer "+adminToken)
			
			resp, err := suite.app.Test(req)
			return resp, err
		}
		
		result := suite.runPerformanceTest("Memory Usage Test", requestFunc, 30, 300)
		
		// Performance assertions - should still perform well with large dataset
		assert.Greater(t, result.RequestsPerSec, 20.0, "Should handle at least 20 requests per second with large dataset")
		assert.Less(t, result.AverageLatency, 500*time.Millisecond, "Average latency should be under 500ms with large dataset")
		assert.LessOrEqual(t, result.FailedRequests, 15, "Should have minimal failures with large dataset")
	})
}

// Test Response Time Consistency
func (suite *PerformanceTestSuite) TestResponseTimeConsistency() {
	t := suite.T()
	
	adminUser := suite.CreateTestUser("consistency-admin@example.com", "Consistency Admin", 1)
	adminToken := suite.GetAuthToken(adminUser.ID, "admin")
	
	t.Run("Response Time Consistency", func(t *testing.T) {
		var latencies []time.Duration
		var mu sync.Mutex
		
		requestFunc := func() (*httptest.ResponseRecorder, error) {
			start := time.Now()
			req := httptest.NewRequest("GET", "/api/v1/users/stats", nil)
			req.Header.Set("Authorization", "Bearer "+adminToken)
			
			resp, err := suite.app.Test(req)
			latency := time.Since(start)
			
			mu.Lock()
			latencies = append(latencies, latency)
			mu.Unlock()
			
			return resp, err
		}
		
		result := suite.runPerformanceTest("Response Time Consistency", requestFunc, 10, 100)
		
		// Calculate standard deviation of latencies
		var sum time.Duration
		for _, latency := range latencies {
			sum += latency
		}
		mean := sum / time.Duration(len(latencies))
		
		var variance time.Duration
		for _, latency := range latencies {
			diff := latency - mean
			variance += diff * diff / time.Duration(len(latencies))
		}
		stdDev := time.Duration(float64(variance) * 0.5) // Approximate square root
		
		t.Logf("Response time standard deviation: %v", stdDev)
		
		// Performance assertions
		assert.Less(t, stdDev, 100*time.Millisecond, "Response time should be consistent (low standard deviation)")
		assert.Equal(t, 0, result.FailedRequests, "All requests should succeed for consistency test")
	})
}

func TestPerformanceTestSuite(t *testing.T) {
	suite.Run(t, new(PerformanceTestSuite))
}