package handlers

import (
	"bytes"
	"encoding/json"
	"net/http/httptest"
	"testing"

	"backend-go/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
)

// TestLogin_InvalidRequestBody tests login with invalid JSON
func TestLogin_InvalidRequestBody(t *testing.T) {
	// Create a mock auth handler (we'll test without database for now)
	authHandler := &AuthHandler{
		authService: nil, // We'll handle this in the handler
		validator:   nil,
	}

	// Create Fiber app
	app := fiber.New()
	app.Post("/login", authHandler.Login)

	// Make request with invalid JSON
	req := httptest.NewRequest("POST", "/login", bytes.NewReader([]byte("invalid json")))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)

	// Assertions
	assert.NoError(t, err)
	assert.Equal(t, 400, resp.StatusCode)

	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(t, err)

	assert.Equal(t, "Invalid request body", response["error"])
	assert.Equal(t, "INVALID_REQUEST_BODY", response["code"])
}

// TestLogin_ValidationError tests login with missing required fields
func TestLogin_ValidationError(t *testing.T) {
	// Create a mock auth handler with validator
	authHandler := NewAuthHandler(nil) // Pass nil for auth service

	// Create Fiber app
	app := fiber.New()
	app.Post("/login", authHandler.Login)

	// Prepare request with missing password
	loginReq := map[string]string{
		"email": "test@example.com",
		// password is missing
	}
	reqBody, _ := json.Marshal(loginReq)

	// Make request
	req := httptest.NewRequest("POST", "/login", bytes.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)

	// Assertions
	assert.NoError(t, err)
	assert.Equal(t, 400, resp.StatusCode)

	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(t, err)

	assert.Equal(t, "Validation failed", response["error"])
	assert.Equal(t, "VALIDATION_ERROR", response["code"])
	assert.Contains(t, response, "details")
}

// TestRegister_ValidationError tests registration with validation errors
func TestRegister_ValidationError(t *testing.T) {
	// Create a mock auth handler with validator
	authHandler := NewAuthHandler(nil)

	// Create Fiber app
	app := fiber.New()
	app.Post("/register", authHandler.Register)

	// Prepare request with invalid email
	registerReq := map[string]interface{}{
		"full_name":        "Test User",
		"email":           "invalid-email", // Invalid email format
		"password":        "password123",
		"confirm_password": "password123",
		"role_id":         1,
	}
	reqBody, _ := json.Marshal(registerReq)

	// Make request
	req := httptest.NewRequest("POST", "/register", bytes.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)

	// Assertions
	assert.NoError(t, err)
	assert.Equal(t, 400, resp.StatusCode)

	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(t, err)

	assert.Equal(t, "Validation failed", response["error"])
	assert.Equal(t, "VALIDATION_ERROR", response["code"])
	assert.Contains(t, response, "details")
}

// TestMe_Unauthorized tests /me endpoint without authentication
func TestMe_Unauthorized(t *testing.T) {
	// Create a mock auth handler
	authHandler := NewAuthHandler(nil)

	// Create Fiber app
	app := fiber.New()
	app.Get("/me", authHandler.Me)

	// Make request without auth token
	req := httptest.NewRequest("GET", "/me", nil)
	resp, err := app.Test(req)

	// Assertions
	assert.NoError(t, err)
	assert.Equal(t, 401, resp.StatusCode)

	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(t, err)

	assert.Equal(t, "Authentication required", response["error"])
	assert.Equal(t, "AUTH_REQUIRED", response["code"])
}

// TestRefreshToken_ValidationError tests refresh token with missing token
func TestRefreshToken_ValidationError(t *testing.T) {
	// Create a mock auth handler
	authHandler := NewAuthHandler(nil)

	// Create Fiber app
	app := fiber.New()
	app.Post("/refresh-token", authHandler.RefreshToken)

	// Prepare request without refresh token
	refreshReq := map[string]string{
		// refresh_token is missing
	}
	reqBody, _ := json.Marshal(refreshReq)

	// Make request
	req := httptest.NewRequest("POST", "/refresh-token", bytes.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)

	// Assertions
	assert.NoError(t, err)
	assert.Equal(t, 400, resp.StatusCode)

	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(t, err)

	assert.Equal(t, "Validation failed", response["error"])
	assert.Equal(t, "VALIDATION_ERROR", response["code"])
}

// TestChangePassword_Unauthorized tests change password without authentication
func TestChangePassword_Unauthorized(t *testing.T) {
	// Create a mock auth handler
	authHandler := NewAuthHandler(nil)

	// Create Fiber app
	app := fiber.New()
	app.Post("/change-password", authHandler.ChangePassword)

	// Prepare request
	changePasswordReq := services.ChangePasswordRequest{
		CurrentPassword: "oldpassword",
		NewPassword:     "newpassword123",
		ConfirmPassword: "newpassword123",
	}
	reqBody, _ := json.Marshal(changePasswordReq)

	// Make request without auth
	req := httptest.NewRequest("POST", "/change-password", bytes.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)

	// Assertions
	assert.NoError(t, err)
	assert.Equal(t, 401, resp.StatusCode)

	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(t, err)

	assert.Equal(t, "Authentication required", response["error"])
	assert.Equal(t, "AUTH_REQUIRED", response["code"])
}

// TestRequestPasswordReset_ValidationError tests password reset request with invalid email
func TestRequestPasswordReset_ValidationError(t *testing.T) {
	// Create a mock auth handler
	authHandler := NewAuthHandler(nil)

	// Create Fiber app
	app := fiber.New()
	app.Post("/request-password-reset", authHandler.RequestPasswordReset)

	// Prepare request with invalid email
	resetReq := map[string]string{
		"email": "invalid-email", // Invalid email format
	}
	reqBody, _ := json.Marshal(resetReq)

	// Make request
	req := httptest.NewRequest("POST", "/request-password-reset", bytes.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	resp, err := app.Test(req)

	// Assertions
	assert.NoError(t, err)
	assert.Equal(t, 400, resp.StatusCode)

	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(t, err)

	assert.Equal(t, "Validation failed", response["error"])
	assert.Equal(t, "VALIDATION_ERROR", response["code"])
}

// TestLogout_Success tests logout endpoint
func TestLogout_Success(t *testing.T) {
	// Create a mock auth handler
	authHandler := NewAuthHandler(nil)

	// Create Fiber app
	app := fiber.New()
	app.Post("/logout", authHandler.Logout)

	// Make request
	req := httptest.NewRequest("POST", "/logout", nil)
	resp, err := app.Test(req)

	// Assertions
	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(t, err)

	assert.Equal(t, "Logged out successfully", response["message"])
}