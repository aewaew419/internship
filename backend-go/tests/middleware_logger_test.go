package tests

import (
	"backend-go/internal/middleware"
	"backend-go/internal/services"
	"bytes"
	"encoding/json"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

func TestStructuredLogger_Middleware(t *testing.T) {
	var buf bytes.Buffer
	logger := services.NewLogger(services.LoggerConfig{
		Level:        services.INFO,
		ServiceName:  "test-service",
		Output:       &buf,
		EnableCaller: false,
	})

	app := fiber.New()
	app.Use(middleware.StructuredLogger(logger))

	app.Get("/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"message": "success"})
	})

	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("User-Agent", "test-agent")
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	// Check that request ID header was set
	assert.NotEmpty(t, resp.Header.Get("X-Request-ID"))

	// Parse log output
	output := buf.String()
	assert.NotEmpty(t, output)

	var logEntry services.LogEntry
	err = json.Unmarshal([]byte(strings.TrimSpace(output)), &logEntry)
	assert.NoError(t, err)

	assert.Equal(t, "INFO", logEntry.Level)
	assert.Equal(t, "HTTP Request", logEntry.Message)
	assert.Equal(t, "test-service", logEntry.Service)
	assert.Equal(t, "GET", logEntry.Method)
	assert.Equal(t, "/test", logEntry.Path)
	assert.Equal(t, 200, logEntry.StatusCode)
	assert.NotEmpty(t, logEntry.RequestID)
	assert.NotEmpty(t, logEntry.Latency)
	assert.GreaterOrEqual(t, logEntry.LatencyMS, int64(0))
	assert.Equal(t, "test-agent", logEntry.UserAgent)
}

func TestStructuredLogger_WithUserContext(t *testing.T) {
	var buf bytes.Buffer
	logger := services.NewLogger(services.LoggerConfig{
		Level:        services.INFO,
		ServiceName:  "test-service",
		Output:       &buf,
		EnableCaller: false,
	})

	app := fiber.New()
	app.Use(middleware.StructuredLogger(logger))

	app.Get("/test", func(c *fiber.Ctx) error {
		// Simulate authenticated user
		c.Locals("user_id", uint(123))
		c.Locals("user_email", "test@example.com")
		return c.JSON(fiber.Map{"message": "success"})
	})

	req := httptest.NewRequest("GET", "/test", nil)
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	// Parse log output
	output := buf.String()
	var logEntry services.LogEntry
	err = json.Unmarshal([]byte(strings.TrimSpace(output)), &logEntry)
	assert.NoError(t, err)

	assert.Equal(t, uint(123), logEntry.UserID)
	assert.Equal(t, "test@example.com", logEntry.UserEmail)
}

func TestSecurityLogger_Middleware(t *testing.T) {
	var buf bytes.Buffer
	logger := services.NewLogger(services.LoggerConfig{
		Level:        services.INFO,
		ServiceName:  "test-service",
		Output:       &buf,
		EnableCaller: false,
	})

	app := fiber.New()
	app.Use(middleware.SecurityLogger(logger))

	// Test 401 Unauthorized
	app.Get("/unauthorized", func(c *fiber.Ctx) error {
		return c.Status(401).JSON(fiber.Map{"error": "unauthorized"})
	})

	req := httptest.NewRequest("GET", "/unauthorized", nil)
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 401, resp.StatusCode)

	// Parse log output
	output := buf.String()
	assert.NotEmpty(t, output)

	var logEntry services.LogEntry
	err = json.Unmarshal([]byte(strings.TrimSpace(output)), &logEntry)
	assert.NoError(t, err)

	assert.Equal(t, "WARN", logEntry.Level)
	assert.Contains(t, logEntry.Message, "Security Event")
	assert.NotNil(t, logEntry.Fields)
	assert.Equal(t, "authentication_failure", logEntry.Fields["security_event"])
}

func TestSecurityLogger_FailedLogin(t *testing.T) {
	var buf bytes.Buffer
	logger := services.NewLogger(services.LoggerConfig{
		Level:        services.INFO,
		ServiceName:  "test-service",
		Output:       &buf,
		EnableCaller: false,
	})

	app := fiber.New()
	app.Use(middleware.SecurityLogger(logger))

	// Test failed login
	app.Post("/api/v1/login", func(c *fiber.Ctx) error {
		return c.Status(401).JSON(fiber.Map{"error": "invalid credentials"})
	})

	req := httptest.NewRequest("POST", "/api/v1/login", nil)
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 401, resp.StatusCode)

	// Parse log output - there might be multiple log entries, get the last one
	output := buf.String()
	assert.NotEmpty(t, output)

	lines := strings.Split(strings.TrimSpace(output), "\n")
	lastLine := lines[len(lines)-1]

	var logEntry services.LogEntry
	err = json.Unmarshal([]byte(lastLine), &logEntry)
	assert.NoError(t, err)

	assert.Equal(t, "WARN", logEntry.Level)
	assert.Contains(t, logEntry.Message, "Security Event")
	assert.Equal(t, "failed_login_attempt", logEntry.Fields["security_event"])
}

func TestMetricsLogger_SlowRequest(t *testing.T) {
	var buf bytes.Buffer
	logger := services.NewLogger(services.LoggerConfig{
		Level:        services.INFO,
		ServiceName:  "test-service",
		Output:       &buf,
		EnableCaller: false,
	})

	app := fiber.New()
	app.Use(middleware.MetricsLogger(logger))

	// Simulate slow endpoint
	app.Get("/slow", func(c *fiber.Ctx) error {
		time.Sleep(1100 * time.Millisecond) // Slightly over 1 second
		return c.JSON(fiber.Map{"message": "slow response"})
	})

	req := httptest.NewRequest("GET", "/slow", nil)
	resp, err := app.Test(req, 2000) // 2 second timeout

	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	// Parse log output
	output := buf.String()
	assert.NotEmpty(t, output)

	var logEntry services.LogEntry
	err = json.Unmarshal([]byte(strings.TrimSpace(output)), &logEntry)
	assert.NoError(t, err)

	assert.Equal(t, "WARN", logEntry.Level)
	assert.Equal(t, "Slow request detected", logEntry.Message)
	assert.NotNil(t, logEntry.Fields)
	assert.Greater(t, logEntry.Fields["latency_ms"], float64(1000))
}

func TestErrorLogger_Middleware(t *testing.T) {
	var buf bytes.Buffer
	logger := services.NewLogger(services.LoggerConfig{
		Level:        services.INFO,
		ServiceName:  "test-service",
		Output:       &buf,
		EnableCaller: false,
	})

	app := fiber.New()
	app.Use(middleware.ErrorLogger(logger))

	// Test endpoint that returns an error
	app.Get("/error", func(c *fiber.Ctx) error {
		return fiber.NewError(500, "internal server error")
	})

	req := httptest.NewRequest("GET", "/error", nil)
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 500, resp.StatusCode)

	// Parse log output
	output := buf.String()
	assert.NotEmpty(t, output)

	var logEntry services.LogEntry
	err = json.Unmarshal([]byte(strings.TrimSpace(output)), &logEntry)
	assert.NoError(t, err)

	assert.Equal(t, "ERROR", logEntry.Level)
	assert.Equal(t, "Application error", logEntry.Message)
	assert.NotNil(t, logEntry.Fields)
	assert.Equal(t, float64(500), logEntry.Fields["status_code"])
}

func TestRequestIDGeneration(t *testing.T) {
	var buf bytes.Buffer
	logger := services.NewLogger(services.LoggerConfig{
		Level:        services.INFO,
		ServiceName:  "test-service",
		Output:       &buf,
		EnableCaller: false,
	})

	app := fiber.New()
	app.Use(middleware.StructuredLogger(logger))

	app.Get("/test", func(c *fiber.Ctx) error {
		// Check if request ID is available in context
		requestID, exists := c.Locals("request_id").(string)
		return c.JSON(fiber.Map{
			"message":    "success",
			"request_id": requestID,
			"has_id":     exists,
		})
	})

	// Test that request ID is generated and stored in context
	req := httptest.NewRequest("GET", "/test", nil)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	// Check that a request ID header is set
	requestID := resp.Header.Get("X-Request-ID")
	assert.NotEmpty(t, requestID)

	// Parse the log to verify request ID is logged
	output := buf.String()
	assert.NotEmpty(t, output)

	var logEntry services.LogEntry
	err = json.Unmarshal([]byte(strings.TrimSpace(output)), &logEntry)
	assert.NoError(t, err)
	assert.NotEmpty(t, logEntry.RequestID)
}