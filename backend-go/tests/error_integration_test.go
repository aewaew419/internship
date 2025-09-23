package tests

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	
	"backend-go/internal/errors"
	"backend-go/internal/middleware"
	"backend-go/internal/validation"
)

// Simple test struct for validation testing
type TestUser struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,password"`
	Name     string `json:"name" validate:"required,min=2"`
}

func setupSimpleTestApp() *fiber.App {
	// Create Fiber app with error handler
	app := fiber.New(fiber.Config{
		ErrorHandler: middleware.ErrorHandler(),
	})
	
	// Add recover middleware
	app.Use(middleware.RecoverMiddleware())
	
	// Test routes for error handling
	app.Post("/test-validation", func(c *fiber.Ctx) error {
		var user TestUser
		return validation.ParseAndValidate(c, &user)
	})
	
	app.Get("/test-app-error", func(c *fiber.Ctx) error {
		return errors.SendError(c, errors.NewNotFoundError("Test Resource"))
	})
	
	app.Get("/test-database-error", func(c *fiber.Ctx) error {
		// Simulate a database error
		mockErr := &mockDatabaseError{message: "Duplicate entry 'test@example.com' for key 'email'"}
		return errors.SendDatabaseError(c, mockErr)
	})
	
	app.Get("/test-panic", func(c *fiber.Ctx) error {
		panic("Test panic for recovery")
	})
	
	app.Get("/test-success", func(c *fiber.Ctx) error {
		return errors.SendSuccess(c, map[string]string{"message": "Success"})
	})
	
	return app
}

type mockDatabaseError struct {
	message string
}

func (e *mockDatabaseError) Error() string {
	return e.message
}

func TestErrorHandlingIntegration(t *testing.T) {
	app := setupSimpleTestApp()
	
	t.Run("Validation Error Response", func(t *testing.T) {
		reqBody := `{"email": "invalid-email", "password": "123", "name": "A"}`
		req := httptest.NewRequest("POST", "/test-validation", strings.NewReader(reqBody))
		req.Header.Set("Content-Type", "application/json")
		
		resp, err := app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusUnprocessableEntity, resp.StatusCode)
		
		var response errors.ValidationErrorResponse
		json.NewDecoder(resp.Body).Decode(&response)
		
		assert.False(t, response.Success)
		assert.Equal(t, "Validation failed", response.Error.Message)
		assert.Equal(t, errors.ErrorTypeValidation, response.Error.Type)
		assert.Greater(t, len(response.Errors), 0)
		
		// Check that validation messages are human-readable
		found := false
		for _, validationErr := range response.Errors {
			if validationErr.Field == "email" && strings.Contains(validationErr.Message, "valid email") {
				found = true
				break
			}
		}
		assert.True(t, found, "Should have human-readable email validation message")
	})
	
	t.Run("App Error Response", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/test-app-error", nil)
		resp, err := app.Test(req)
		
		assert.NoError(t, err)
		assert.Equal(t, http.StatusNotFound, resp.StatusCode)
		
		var response errors.ErrorResponse
		json.NewDecoder(resp.Body).Decode(&response)
		
		assert.False(t, response.Success)
		assert.Equal(t, "Test Resource not found", response.Error.Message)
		assert.Equal(t, errors.ErrorTypeNotFound, response.Error.Type)
	})
	
	t.Run("Database Error Response", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/test-database-error", nil)
		resp, err := app.Test(req)
		
		assert.NoError(t, err)
		assert.Equal(t, http.StatusConflict, resp.StatusCode)
		
		var response errors.ErrorResponse
		json.NewDecoder(resp.Body).Decode(&response)
		
		assert.False(t, response.Success)
		assert.Equal(t, "Duplicate entry", response.Error.Message)
		assert.Equal(t, errors.ErrorTypeConflict, response.Error.Type)
	})
	
	t.Run("Panic Recovery", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/test-panic", nil)
		resp, err := app.Test(req)
		
		assert.NoError(t, err)
		assert.Equal(t, http.StatusInternalServerError, resp.StatusCode)
		
		var response errors.ErrorResponse
		json.NewDecoder(resp.Body).Decode(&response)
		
		assert.False(t, response.Success)
		assert.Equal(t, "Internal server error", response.Error.Message)
		assert.Equal(t, errors.ErrorTypeInternal, response.Error.Type)
	})
	
	t.Run("Success Response", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/test-success", nil)
		resp, err := app.Test(req)
		
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)
		
		var response map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&response)
		
		assert.True(t, response["success"].(bool))
		assert.NotNil(t, response["data"])
	})
}

func TestCustomValidationRules(t *testing.T) {
	app := setupSimpleTestApp()
	
	t.Run("Valid Request Passes", func(t *testing.T) {
		reqBody := `{"email": "test@example.com", "password": "password123", "name": "John Doe"}`
		req := httptest.NewRequest("POST", "/test-validation", strings.NewReader(reqBody))
		req.Header.Set("Content-Type", "application/json")
		
		resp, err := app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)
	})
	
	t.Run("Invalid Password Format", func(t *testing.T) {
		reqBody := `{"email": "test@example.com", "password": "weak", "name": "John Doe"}`
		req := httptest.NewRequest("POST", "/test-validation", strings.NewReader(reqBody))
		req.Header.Set("Content-Type", "application/json")
		
		resp, err := app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusUnprocessableEntity, resp.StatusCode)
		
		var response errors.ValidationErrorResponse
		json.NewDecoder(resp.Body).Decode(&response)
		
		// Should have password validation error
		found := false
		for _, validationErr := range response.Errors {
			if validationErr.Field == "password" {
				found = true
				break
			}
		}
		assert.True(t, found, "Should have password validation error")
	})
}

func TestErrorUtilityFunctions(t *testing.T) {
	t.Run("Error Type Mapping", func(t *testing.T) {
		// Test predefined errors
		assert.Equal(t, http.StatusNotFound, errors.ErrNotFound.Code)
		assert.Equal(t, errors.ErrorTypeNotFound, errors.ErrNotFound.Type)
		
		assert.Equal(t, http.StatusUnauthorized, errors.ErrUnauthorized.Code)
		assert.Equal(t, errors.ErrorTypeAuth, errors.ErrUnauthorized.Type)
		
		assert.Equal(t, http.StatusConflict, errors.ErrConflict.Code)
		assert.Equal(t, errors.ErrorTypeConflict, errors.ErrConflict.Type)
	})
	
	t.Run("Error Creators", func(t *testing.T) {
		notFoundErr := errors.NewNotFoundError("User")
		assert.Equal(t, http.StatusNotFound, notFoundErr.Code)
		assert.Equal(t, "User not found", notFoundErr.Message)
		assert.Equal(t, errors.ErrorTypeNotFound, notFoundErr.Type)
		
		unauthorizedErr := errors.NewUnauthorizedError("Invalid token")
		assert.Equal(t, http.StatusUnauthorized, unauthorizedErr.Code)
		assert.Equal(t, "Invalid token", unauthorizedErr.Message)
		assert.Equal(t, errors.ErrorTypeAuth, unauthorizedErr.Type)
		
		conflictErr := errors.NewConflictError("Email already exists")
		assert.Equal(t, http.StatusConflict, conflictErr.Code)
		assert.Equal(t, "Email already exists", conflictErr.Message)
		assert.Equal(t, errors.ErrorTypeConflict, conflictErr.Type)
	})
}