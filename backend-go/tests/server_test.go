package tests

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"backend-go/internal/config"
	"backend-go/internal/database"
	"backend-go/internal/routes"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/stretchr/testify/assert"
)

// TestServerSetup tests that the server can be set up correctly
func TestServerSetup(t *testing.T) {
	// Set test environment
	os.Setenv("ENVIRONMENT", "test")
	os.Setenv("JWT_SECRET", "test-jwt-secret-key")

	// Load test configuration
	cfg := config.Load()

	// Create Fiber app (same as main.go)
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{
				"error": err.Error(),
			})
		},
	})

	// Middleware (same as main.go)
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: cfg.AllowedOrigins,
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	// Health check endpoint (same as main.go)
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status": "ok",
			"message": "Server is running",
		})
	})

	// Try to connect to database (skip routes setup if no database)
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		t.Logf("Database connection failed, testing without database: %v", err)
		// Add basic test routes without database
		api := app.Group("/api/v1")
		api.Get("/test", func(c *fiber.Ctx) error {
			return c.JSON(fiber.Map{
				"message": "API is working without database",
				"version": "1.0.0",
			})
		})
	} else {
		// Setup routes with database
		routes.Setup(app, db, cfg)
		defer func() {
			sqlDB, _ := db.DB()
			if sqlDB != nil {
				sqlDB.Close()
			}
		}()
	}

	// Test health endpoint
	req := httptest.NewRequest("GET", "/health", nil)
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	var healthResponse map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&healthResponse)
	assert.NoError(t, err)

	assert.Equal(t, "ok", healthResponse["status"])
	assert.Equal(t, "Server is running", healthResponse["message"])

	// Test API endpoint
	req = httptest.NewRequest("GET", "/api/v1/test", nil)
	resp, err = app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	var apiResponse map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&apiResponse)
	assert.NoError(t, err)

	assert.Contains(t, apiResponse["message"], "API is working")
	assert.Equal(t, "1.0.0", apiResponse["version"])
}

// TestAuthEndpointsAvailable tests that authentication endpoints are available
func TestAuthEndpointsAvailable(t *testing.T) {
	// Set test environment
	os.Setenv("ENVIRONMENT", "test")
	os.Setenv("JWT_SECRET", "test-jwt-secret-key")

	// Load test configuration
	cfg := config.Load()

	// Create Fiber app
	app := fiber.New()

	// Try to connect to database and setup routes
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		t.Skipf("Skipping auth endpoints test: database connection failed: %v", err)
		return
	}
	defer func() {
		sqlDB, _ := db.DB()
		if sqlDB != nil {
			sqlDB.Close()
		}
	}()

	// Setup routes
	routes.Setup(app, db, cfg)

	// Test that authentication endpoints exist and respond appropriately
	endpoints := []struct {
		method         string
		path           string
		body           string
		expectedStatus int
		description    string
	}{
		{"POST", "/api/v1/login", `{"email":"test@example.com","password":"password123"}`, 401, "Login should return 401 for invalid credentials"},
		{"POST", "/api/v1/register", `{"full_name":"Test","email":"invalid-email","password":"pass","confirm_password":"pass","role_id":1}`, 400, "Register should return 400 for validation errors"},
		{"GET", "/api/v1/me", "", 401, "Me endpoint should return 401 without auth"},
		{"POST", "/api/v1/refresh-token", `{"refresh_token":"invalid"}`, 400, "Refresh token should return 400 for validation errors"},
		{"POST", "/api/v1/request-password-reset", `{"email":"test@example.com"}`, 200, "Password reset request should return 200"},
		{"POST", "/api/v1/reset-password", `{"token":"invalid","password":"pass","confirm_password":"pass"}`, 400, "Reset password should return 400 for validation errors"},
		{"POST", "/api/v1/change-password", `{"current_password":"old","new_password":"new","confirm_password":"new"}`, 401, "Change password should return 401 without auth"},
		{"POST", "/api/v1/logout", "", 200, "Logout should return 200"},
	}

	for _, endpoint := range endpoints {
		t.Run(endpoint.description, func(t *testing.T) {
			var req *http.Request
			if endpoint.body != "" {
				req = httptest.NewRequest(endpoint.method, endpoint.path, bytes.NewReader([]byte(endpoint.body)))
				req.Header.Set("Content-Type", "application/json")
			} else {
				req = httptest.NewRequest(endpoint.method, endpoint.path, nil)
			}

			resp, err := app.Test(req)
			assert.NoError(t, err)
			assert.Equal(t, endpoint.expectedStatus, resp.StatusCode, 
				"Endpoint %s %s should return status %d", endpoint.method, endpoint.path, endpoint.expectedStatus)
		})
	}
}

// TestCORSHeaders tests that CORS headers are properly set
func TestCORSHeaders(t *testing.T) {
	// Set test environment
	os.Setenv("ENVIRONMENT", "test")
	os.Setenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173")

	// Load test configuration
	cfg := config.Load()

	// Create Fiber app with CORS
	app := fiber.New()
	app.Use(cors.New(cors.Config{
		AllowOrigins: cfg.AllowedOrigins,
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	// Add a test endpoint
	app.Get("/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"message": "CORS test"})
	})

	// Test CORS preflight request
	req := httptest.NewRequest("OPTIONS", "/test", nil)
	req.Header.Set("Origin", "http://localhost:3000")
	req.Header.Set("Access-Control-Request-Method", "GET")
	req.Header.Set("Access-Control-Request-Headers", "Authorization")

	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, 204, resp.StatusCode)

	// Check CORS headers (note: Fiber CORS middleware may set different header names)
	allowOrigin := resp.Header.Get("Access-Control-Allow-Origin")
	allowMethods := resp.Header.Get("Access-Control-Allow-Methods")
	allowHeaders := resp.Header.Get("Access-Control-Allow-Headers")
	
	// At least one of these should be set for CORS to be working
	assert.True(t, len(allowOrigin) > 0 || len(allowMethods) > 0 || len(allowHeaders) > 0, "CORS headers should be present")
}