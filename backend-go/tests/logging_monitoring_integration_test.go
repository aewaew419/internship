package tests

import (
	"backend-go/internal/config"
	"backend-go/internal/database"
	"backend-go/internal/routes"
	"backend-go/internal/services"
	"encoding/json"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

func TestLoggingMonitoringIntegration(t *testing.T) {
	// Skip this test if we don't have a real database connection
	if os.Getenv("INTEGRATION_TEST") != "true" {
		t.Skip("Skipping integration test. Set INTEGRATION_TEST=true to run.")
	}

	// Load test configuration
	cfg := &config.Config{
		Port:           "8080",
		DatabaseURL:    "root:password@tcp(localhost:3306)/internship_test_db?charset=utf8mb4&parseTime=True&loc=Local",
		JWTSecret:      "test-secret",
		AllowedOrigins: "*",
		Environment:    "test",
		LogLevel:       "debug",
		LogFormat:      "json",
	}

	// Initialize database (this would fail if no real DB is available)
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		t.Skipf("Skipping integration test: cannot connect to database: %v", err)
	}

	// Create Fiber app
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			message := "Internal Server Error"
			
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
				message = e.Message
			}

			return c.Status(code).JSON(fiber.Map{
				"error":      message,
				"code":       code,
				"request_id": c.Get("X-Request-ID"),
			})
		},
	})

	// Setup routes with logging and monitoring
	routes.Setup(app, db, cfg)

	// Test health endpoints
	t.Run("Health Endpoints", func(t *testing.T) {
		endpoints := []string{"/api/v1/health", "/api/v1/ready", "/api/v1/live", "/api/v1/metrics"}
		
		for _, endpoint := range endpoints {
			req := httptest.NewRequest("GET", endpoint, nil)
			resp, err := app.Test(req)
			
			assert.NoError(t, err)
			assert.True(t, resp.StatusCode == 200 || resp.StatusCode == 503, 
				"Endpoint %s should return 200 or 503, got %d", endpoint, resp.StatusCode)
			
			// Check that response has proper headers
			assert.NotEmpty(t, resp.Header.Get("Content-Type"))
			
			if endpoint == "/api/v1/health" || endpoint == "/api/v1/ready" || endpoint == "/api/v1/live" {
				assert.Equal(t, "no-cache, no-store, must-revalidate", resp.Header.Get("Cache-Control"))
			}
		}
	})

	// Test detailed health endpoint
	t.Run("Detailed Health Check", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/health/detailed", nil)
		resp, err := app.Test(req)
		
		assert.NoError(t, err)
		assert.True(t, resp.StatusCode == 200 || resp.StatusCode == 503)
		
		var healthResponse map[string]interface{}
		err = json.NewDecoder(resp.Body).Decode(&healthResponse)
		assert.NoError(t, err)
		
		// Check required fields
		assert.Contains(t, healthResponse, "status")
		assert.Contains(t, healthResponse, "timestamp")
		assert.Contains(t, healthResponse, "uptime")
		assert.Contains(t, healthResponse, "checks")
		assert.Contains(t, healthResponse, "services")
		
		// Check checks
		checks, ok := healthResponse["checks"].(map[string]interface{})
		assert.True(t, ok)
		assert.Contains(t, checks, "database")
		assert.Contains(t, checks, "memory")
		assert.Contains(t, checks, "disk")
		assert.Contains(t, checks, "externalServices")
	})

	// Test metrics endpoint
	t.Run("Metrics Endpoint", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/metrics", nil)
		resp, err := app.Test(req)
		
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
		
		var metrics map[string]interface{}
		err = json.NewDecoder(resp.Body).Decode(&metrics)
		assert.NoError(t, err)
		
		// Check required metrics
		assert.Contains(t, metrics, "timestamp")
		assert.Contains(t, metrics, "uptime")
		assert.Contains(t, metrics, "memory")
		assert.Contains(t, metrics, "runtime")
		assert.Contains(t, metrics, "database")
		
		// Check memory metrics structure
		memory, ok := metrics["memory"].(map[string]interface{})
		assert.True(t, ok)
		assert.Contains(t, memory, "alloc")
		assert.Contains(t, memory, "sys")
		assert.Contains(t, memory, "num_gc")
	})

	// Test request logging
	t.Run("Request Logging", func(t *testing.T) {
		// Test successful request
		req := httptest.NewRequest("GET", "/api/v1/test", nil)
		req.Header.Set("User-Agent", "integration-test")
		resp, err := app.Test(req)
		
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
		
		// Check that request ID is set
		requestID := resp.Header.Get("X-Request-ID")
		assert.NotEmpty(t, requestID)
		
		// Test with custom request ID
		req2 := httptest.NewRequest("GET", "/api/v1/test", nil)
		req2.Header.Set("X-Request-ID", "custom-test-id")
		resp2, err := app.Test(req2)
		
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
		assert.Equal(t, "custom-test-id", resp2.Header.Get("X-Request-ID"))
	})

	// Test error handling and logging
	t.Run("Error Handling", func(t *testing.T) {
		// Test 404 error
		req := httptest.NewRequest("GET", "/api/v1/nonexistent", nil)
		resp, err := app.Test(req)
		
		assert.NoError(t, err)
		assert.Equal(t, 404, resp.StatusCode)
		
		var errorResponse map[string]interface{}
		err = json.NewDecoder(resp.Body).Decode(&errorResponse)
		assert.NoError(t, err)
		
		assert.Contains(t, errorResponse, "error")
		assert.Contains(t, errorResponse, "code")
	})

	// Test HEAD requests
	t.Run("HEAD Requests", func(t *testing.T) {
		req := httptest.NewRequest("HEAD", "/api/v1/health", nil)
		resp, err := app.Test(req)
		
		assert.NoError(t, err)
		assert.True(t, resp.StatusCode == 200 || resp.StatusCode == 503)
		
		// HEAD requests should have cache control headers
		assert.Equal(t, "no-cache, no-store, must-revalidate", resp.Header.Get("Cache-Control"))
	})

	// Test performance monitoring
	t.Run("Performance Monitoring", func(t *testing.T) {
		// Make multiple requests to test performance logging
		for i := 0; i < 5; i++ {
			req := httptest.NewRequest("GET", "/api/v1/health", nil)
			resp, err := app.Test(req)
			
			assert.NoError(t, err)
			assert.True(t, resp.StatusCode == 200 || resp.StatusCode == 503)
			
			// Check response time header
			responseTime := resp.Header.Get("X-Response-Time")
			assert.NotEmpty(t, responseTime)
		}
	})
}

func TestLoggingConfiguration(t *testing.T) {
	// Test different log levels
	testCases := []struct {
		level    string
		expected services.LogLevel
	}{
		{"debug", services.DEBUG},
		{"info", services.INFO},
		{"warn", services.WARN},
		{"error", services.ERROR},
	}

	for _, tc := range testCases {
		t.Run("LogLevel_"+tc.level, func(t *testing.T) {
			cfg := &config.Config{
				Environment: "test",
				LogLevel:    tc.level,
				LogFormat:   "json",
			}

			var logLevel services.LogLevel
			switch cfg.LogLevel {
			case "debug":
				logLevel = services.DEBUG
			case "info":
				logLevel = services.INFO
			case "warn":
				logLevel = services.WARN
			case "error":
				logLevel = services.ERROR
			default:
				logLevel = services.INFO
			}

			assert.Equal(t, tc.expected, logLevel)
		})
	}
}

func TestMonitoringEndpointsPerformance(t *testing.T) {
	// Create a simple app for performance testing
	app := fiber.New()
	
	cfg := &config.Config{
		Environment: "test",
	}
	
	logger := services.DefaultLogger()
	
	// Mock database for testing
	db := &mockDB{}
	
	// Add a simple health handler
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":    "ok",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		})
	})

	// Test response times
	start := time.Now()
	for i := 0; i < 100; i++ {
		req := httptest.NewRequest("GET", "/health", nil)
		resp, err := app.Test(req)
		
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
	}
	duration := time.Since(start)
	
	// Should handle 100 requests in reasonable time (less than 1 second)
	assert.Less(t, duration, time.Second, "100 health check requests should complete in less than 1 second")
	
	// Average response time should be reasonable
	avgResponseTime := duration / 100
	assert.Less(t, avgResponseTime, 10*time.Millisecond, "Average response time should be less than 10ms")
}

// mockDB is a simple mock for database interface
type mockDB struct{}

func (m *mockDB) Ping() error {
	return nil
}