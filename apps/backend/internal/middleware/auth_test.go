package middleware

import (
	"net/http/httptest"
	"testing"

	"backend-go/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

func TestAuthMiddleware(t *testing.T) {
	// Setup
	jwtService := services.NewJWTService("test-secret-key")
	app := fiber.New()

	// Create a protected route
	app.Use("/protected", AuthMiddleware(jwtService))
	app.Get("/protected/test", func(c *fiber.Ctx) error {
		userID, _ := GetUserID(c)
		return c.JSON(fiber.Map{"user_id": userID})
	})

	// Create a test token
	token, err := jwtService.GenerateToken(1, "test@example.com", 1)
	assert.NoError(t, err)

	tests := []struct {
		name           string
		authHeader     string
		expectedStatus int
		expectedError  string
	}{
		{
			name:           "Valid token",
			authHeader:     "Bearer " + token,
			expectedStatus: 200,
		},
		{
			name:           "Missing authorization header",
			authHeader:     "",
			expectedStatus: 401,
			expectedError:  "Authorization header is required",
		},
		{
			name:           "Invalid authorization format",
			authHeader:     "Basic " + token,
			expectedStatus: 401,
			expectedError:  "Authorization header must start with 'Bearer '",
		},
		{
			name:           "Missing token",
			authHeader:     "Bearer ",
			expectedStatus: 401,
			expectedError:  "Token is required",
		},
		{
			name:           "Invalid token",
			authHeader:     "Bearer invalid-token",
			expectedStatus: 401,
			expectedError:  "Invalid or expired token",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", "/protected/test", nil)
			if tt.authHeader != "" {
				req.Header.Set("Authorization", tt.authHeader)
			}

			resp, err := app.Test(req)
			assert.NoError(t, err)
			assert.Equal(t, tt.expectedStatus, resp.StatusCode)
		})
	}
}

func TestOptionalAuthMiddleware(t *testing.T) {
	// Setup
	jwtService := services.NewJWTService("test-secret-key")
	app := fiber.New()

	// Create a route with optional auth
	app.Use("/optional", OptionalAuthMiddleware(jwtService))
	app.Get("/optional/test", func(c *fiber.Ctx) error {
		userID, ok := GetUserID(c)
		if !ok {
			return c.JSON(fiber.Map{"authenticated": false})
		}
		return c.JSON(fiber.Map{"authenticated": true, "user_id": userID})
	})

	// Create a test token
	token, err := jwtService.GenerateToken(1, "test@example.com", 1)
	assert.NoError(t, err)

	tests := []struct {
		name           string
		authHeader     string
		expectedStatus int
		expectAuth     bool
	}{
		{
			name:           "Valid token",
			authHeader:     "Bearer " + token,
			expectedStatus: 200,
			expectAuth:     true,
		},
		{
			name:           "No authorization header",
			authHeader:     "",
			expectedStatus: 200,
			expectAuth:     false,
		},
		{
			name:           "Invalid token",
			authHeader:     "Bearer invalid-token",
			expectedStatus: 200,
			expectAuth:     false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", "/optional/test", nil)
			if tt.authHeader != "" {
				req.Header.Set("Authorization", tt.authHeader)
			}

			resp, err := app.Test(req)
			assert.NoError(t, err)
			assert.Equal(t, tt.expectedStatus, resp.StatusCode)
		})
	}
}

func TestRequireAuth(t *testing.T) {
	// Setup
	app := fiber.New()

	// Create a route that requires auth but doesn't use AuthMiddleware
	app.Use("/require-auth", RequireAuth())
	app.Get("/require-auth/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"success": true})
	})

	// Test without authentication
	req := httptest.NewRequest("GET", "/require-auth/test", nil)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, 401, resp.StatusCode)
}

func TestGetUserHelpers(t *testing.T) {
	app := fiber.New()

	app.Get("/test", func(c *fiber.Ctx) error {
		// Set test values in context
		c.Locals("user_id", uint(123))
		c.Locals("user_email", "test@example.com")
		c.Locals("role_id", uint(456))

		// Test helper functions
		userID, ok := GetUserID(c)
		assert.True(t, ok)
		assert.Equal(t, uint(123), userID)

		email, ok := GetUserEmail(c)
		assert.True(t, ok)
		assert.Equal(t, "test@example.com", email)

		roleID, ok := GetRoleID(c)
		assert.True(t, ok)
		assert.Equal(t, uint(456), roleID)

		return c.JSON(fiber.Map{"success": true})
	})

	req := httptest.NewRequest("GET", "/test", nil)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)
}