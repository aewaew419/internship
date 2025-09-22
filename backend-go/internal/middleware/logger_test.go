package middleware

import (
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

func TestDefaultLogger(t *testing.T) {
	app := fiber.New()
	app.Use(DefaultLogger())
	app.Get("/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"success": true})
	})

	req := httptest.NewRequest("GET", "/test", nil)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)
}

func TestProductionLogger(t *testing.T) {
	app := fiber.New()
	app.Use(ProductionLogger())
	app.Get("/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"success": true})
	})

	req := httptest.NewRequest("GET", "/test", nil)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)
}

func TestStructuredLogger(t *testing.T) {
	app := fiber.New()
	app.Use(StructuredLogger())
	app.Get("/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"success": true})
	})

	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("User-Agent", "test-agent")
	
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)
}

func TestRequestIDLogger(t *testing.T) {
	app := fiber.New()
	app.Use(RequestIDLogger())
	app.Get("/test", func(c *fiber.Ctx) error {
		requestID, ok := GetRequestID(c)
		assert.True(t, ok)
		assert.NotEmpty(t, requestID)
		
		return c.JSON(fiber.Map{"request_id": requestID})
	})

	req := httptest.NewRequest("GET", "/test", nil)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)
}

func TestRequestIDLoggerWithExistingID(t *testing.T) {
	app := fiber.New()
	app.Use(RequestIDLogger())
	app.Get("/test", func(c *fiber.Ctx) error {
		requestID, ok := GetRequestID(c)
		assert.True(t, ok)
		assert.Equal(t, "existing-id", requestID)
		
		return c.JSON(fiber.Map{"request_id": requestID})
	})

	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("X-Request-ID", "existing-id")
	
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)
}

func TestSecurityLogger(t *testing.T) {
	app := fiber.New()
	app.Use(SecurityLogger())
	
	// Route that returns 401
	app.Get("/unauthorized", func(c *fiber.Ctx) error {
		return c.Status(401).JSON(fiber.Map{"error": "Unauthorized"})
	})
	
	// Route that returns 403
	app.Get("/forbidden", func(c *fiber.Ctx) error {
		return c.Status(403).JSON(fiber.Map{"error": "Forbidden"})
	})
	
	// Login route for testing failed login logging
	app.Post("/api/v1/login", func(c *fiber.Ctx) error {
		return c.Status(401).JSON(fiber.Map{"error": "Invalid credentials"})
	})

	tests := []struct {
		name           string
		method         string
		path           string
		expectedStatus int
	}{
		{
			name:           "Unauthorized request",
			method:         "GET",
			path:           "/unauthorized",
			expectedStatus: 401,
		},
		{
			name:           "Forbidden request",
			method:         "GET",
			path:           "/forbidden",
			expectedStatus: 403,
		},
		{
			name:           "Failed login attempt",
			method:         "POST",
			path:           "/api/v1/login",
			expectedStatus: 401,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(tt.method, tt.path, nil)
			resp, err := app.Test(req)
			assert.NoError(t, err)
			assert.Equal(t, tt.expectedStatus, resp.StatusCode)
		})
	}
}

func TestLoggerConfig(t *testing.T) {
	// Test default config
	defaultConfig := DefaultLoggerConfig()
	assert.Contains(t, defaultConfig.Format, "${time}")
	assert.Contains(t, defaultConfig.Format, "${status}")
	assert.Equal(t, "2006-01-02 15:04:05", defaultConfig.TimeFormat)
	assert.Equal(t, "Local", defaultConfig.TimeZone)

	// Test production config
	prodConfig := ProductionLoggerConfig()
	assert.Contains(t, prodConfig.Format, `"time":"${time}"`)
	assert.Contains(t, prodConfig.Format, `"status":${status}`)
	assert.Equal(t, "UTC", prodConfig.TimeZone)
}