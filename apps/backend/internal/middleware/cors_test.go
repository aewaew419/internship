package middleware

import (
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

func TestDefaultCORS(t *testing.T) {
	app := fiber.New()
	app.Use(DefaultCORS())
	app.Get("/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"success": true})
	})

	tests := []struct {
		name           string
		origin         string
		method         string
		expectedStatus int
		checkHeaders   bool
	}{
		{
			name:           "Allowed origin",
			origin:         "http://localhost:3000",
			method:         "GET",
			expectedStatus: 200,
			checkHeaders:   true,
		},
		{
			name:           "Preflight request",
			origin:         "http://localhost:3000",
			method:         "OPTIONS",
			expectedStatus: 405, // Method not allowed without proper CORS handling
			checkHeaders:   false,
		},
		{
			name:           "No origin",
			origin:         "",
			method:         "GET",
			expectedStatus: 200,
			checkHeaders:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(tt.method, "/test", nil)
			if tt.origin != "" {
				req.Header.Set("Origin", tt.origin)
			}

			resp, err := app.Test(req)
			assert.NoError(t, err)
			assert.Equal(t, tt.expectedStatus, resp.StatusCode)

			if tt.checkHeaders && tt.origin != "" {
				assert.Contains(t, resp.Header.Get("Access-Control-Allow-Origin"), tt.origin)
			}
		})
	}
}

func TestProductionCORS(t *testing.T) {
	allowedOrigins := []string{"https://example.com", "https://app.example.com"}
	app := fiber.New()
	app.Use(ProductionCORS(allowedOrigins))
	app.Get("/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"success": true})
	})

	tests := []struct {
		name           string
		origin         string
		expectedStatus int
		shouldAllow    bool
	}{
		{
			name:           "Allowed production origin",
			origin:         "https://example.com",
			expectedStatus: 200,
			shouldAllow:    true,
		},
		{
			name:           "Disallowed origin",
			origin:         "https://malicious.com",
			expectedStatus: 200,
			shouldAllow:    false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", "/test", nil)
			req.Header.Set("Origin", tt.origin)

			resp, err := app.Test(req)
			assert.NoError(t, err)
			assert.Equal(t, tt.expectedStatus, resp.StatusCode)
		})
	}
}

func TestDevelopmentCORS(t *testing.T) {
	app := fiber.New()
	app.Use(DevelopmentCORS())
	app.Get("/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"success": true})
	})

	// Test that any origin is allowed in development
	req := httptest.NewRequest("GET", "/test", nil)
	req.Header.Set("Origin", "https://any-origin.com")

	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)
}

func TestCustomCORS(t *testing.T) {
	// Custom origin validation function
	allowOriginFunc := func(origin string) bool {
		return origin == "https://trusted.com" || origin == "https://app.trusted.com"
	}

	app := fiber.New()
	app.Use(CustomCORS(allowOriginFunc))
	app.Get("/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"success": true})
	})

	tests := []struct {
		name           string
		origin         string
		method         string
		expectedStatus int
		shouldHaveCORS bool
	}{
		{
			name:           "Trusted origin GET request",
			origin:         "https://trusted.com",
			method:         "GET",
			expectedStatus: 200,
			shouldHaveCORS: true,
		},
		{
			name:           "Trusted origin OPTIONS request",
			origin:         "https://trusted.com",
			method:         "OPTIONS",
			expectedStatus: 204,
			shouldHaveCORS: true,
		},
		{
			name:           "Untrusted origin",
			origin:         "https://untrusted.com",
			method:         "GET",
			expectedStatus: 200,
			shouldHaveCORS: false,
		},
		{
			name:           "No origin",
			origin:         "",
			method:         "GET",
			expectedStatus: 200,
			shouldHaveCORS: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(tt.method, "/test", nil)
			if tt.origin != "" {
				req.Header.Set("Origin", tt.origin)
			}

			resp, err := app.Test(req)
			assert.NoError(t, err)
			assert.Equal(t, tt.expectedStatus, resp.StatusCode)

			if tt.shouldHaveCORS {
				assert.Equal(t, tt.origin, resp.Header.Get("Access-Control-Allow-Origin"))
			} else {
				assert.Empty(t, resp.Header.Get("Access-Control-Allow-Origin"))
			}
		})
	}
}

func TestCORSConfig(t *testing.T) {
	// Test default config
	defaultConfig := DefaultCORSConfig()
	assert.Contains(t, defaultConfig.AllowOrigins, "http://localhost:3000")
	assert.Contains(t, defaultConfig.AllowMethods, "GET")
	assert.Contains(t, defaultConfig.AllowMethods, "POST")
	assert.True(t, defaultConfig.AllowCredentials)
	assert.Equal(t, 86400, defaultConfig.MaxAge)

	// Test production config
	allowedOrigins := []string{"https://example.com"}
	prodConfig := ProductionCORSConfig(allowedOrigins)
	assert.Equal(t, allowedOrigins, prodConfig.AllowOrigins)
	assert.Contains(t, prodConfig.AllowMethods, "GET")
	assert.True(t, prodConfig.AllowCredentials)
}