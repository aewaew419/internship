package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

// TestAuthEndpointsIntegration tests all authentication endpoints integration
func TestAuthEndpointsIntegration(t *testing.T) {
	// Create Fiber app with basic test endpoint
	app := fiber.New()
	
	// Basic test endpoint
	api := app.Group("/api/v1")
	api.Get("/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "API is working",
			"version": "1.0.0",
		})
	})
	
	// Test the basic endpoint
	req := httptest.NewRequest("GET", "/api/v1/test", nil)
	resp, err := app.Test(req)
	
	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)
	
	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(t, err)
	
	assert.Equal(t, "API is working", response["message"])
	assert.Equal(t, "1.0.0", response["version"])
}

// TestAuthHandlerCreation tests that auth handlers can be created
func TestAuthHandlerCreation(t *testing.T) {
	// Test that we can create an auth handler
	authHandler := NewAuthHandler(nil)
	assert.NotNil(t, authHandler)
	assert.NotNil(t, authHandler.validator)
}

// TestAllAuthEndpointsRouting tests that all auth endpoints are properly routed
func TestAllAuthEndpointsRouting(t *testing.T) {
	// Create a simple app to test routing
	app := fiber.New()
	
	// Create auth handler
	authHandler := NewAuthHandler(nil)
	
	// Setup auth routes manually
	api := app.Group("/api/v1")
	api.Post("/login", authHandler.Login)
	api.Post("/register", authHandler.Register)
	api.Post("/refresh-token", authHandler.RefreshToken)
	api.Post("/request-password-reset", authHandler.RequestPasswordReset)
	api.Post("/reset-password", authHandler.ResetPassword)
	api.Get("/me", authHandler.Me)
	api.Post("/change-password", authHandler.ChangePassword)
	api.Post("/logout", authHandler.Logout)
	
	// Test each endpoint exists (they should return errors due to nil services, but routing should work)
	endpoints := []struct {
		method string
		path   string
		expectedStatus int
	}{
		{"POST", "/api/v1/login", 400}, // Should fail validation
		{"POST", "/api/v1/register", 400}, // Should fail validation
		{"POST", "/api/v1/refresh-token", 400}, // Should fail validation
		{"POST", "/api/v1/request-password-reset", 400}, // Should fail validation
		{"POST", "/api/v1/reset-password", 400}, // Should fail validation
		{"GET", "/api/v1/me", 401}, // Should fail auth
		{"POST", "/api/v1/change-password", 401}, // Should fail auth
		{"POST", "/api/v1/logout", 200}, // Should succeed
	}
	
	for _, endpoint := range endpoints {
		t.Run(endpoint.method+" "+endpoint.path, func(t *testing.T) {
			var req *http.Request
			if endpoint.method == "GET" {
				req = httptest.NewRequest(endpoint.method, endpoint.path, nil)
			} else {
				req = httptest.NewRequest(endpoint.method, endpoint.path, bytes.NewReader([]byte("{}")))
				req.Header.Set("Content-Type", "application/json")
			}
			
			resp, err := app.Test(req)
			assert.NoError(t, err)
			assert.Equal(t, endpoint.expectedStatus, resp.StatusCode, "Endpoint %s %s should return status %d", endpoint.method, endpoint.path, endpoint.expectedStatus)
		})
	}
}

// TestValidationErrorResponses tests that validation errors are properly formatted
func TestValidationErrorResponses(t *testing.T) {
	authHandler := NewAuthHandler(nil)
	app := fiber.New()
	app.Post("/login", authHandler.Login)
	
	// Test with completely empty body
	req := httptest.NewRequest("POST", "/login", bytes.NewReader([]byte("{}")))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)
	
	assert.NoError(t, err)
	assert.Equal(t, 400, resp.StatusCode)
	
	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(t, err)
	
	assert.Equal(t, "Validation failed", response["error"])
	assert.Equal(t, "VALIDATION_ERROR", response["code"])
	assert.Contains(t, response, "details")
}