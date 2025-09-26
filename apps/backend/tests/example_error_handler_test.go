package tests

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	
	"backend-go/internal/errors"
	"backend-go/internal/handlers"
	"backend-go/internal/middleware"
	"backend-go/internal/models"
)

func setupTestApp() (*fiber.App, *gorm.DB) {
	// Create in-memory SQLite database for testing
	db, err := gorm.Open(postgres.Open("postgres://postgres:password@localhost:5432/test_memory?sslmode=disable"), &gorm.Config{})
	if err != nil {
		panic("Failed to connect to test database")
	}
	
	// Auto-migrate the schema - create a simple User table for testing
	err = db.Exec(`
		CREATE TABLE users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			email VARCHAR(255) UNIQUE NOT NULL,
			password VARCHAR(255) NOT NULL,
			full_name VARCHAR(255),
			role_id INTEGER NOT NULL DEFAULT 1,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`).Error
	if err != nil {
		panic("Failed to create test table: " + err.Error())
	}
	
	// Create Fiber app with error handler
	app := fiber.New(fiber.Config{
		ErrorHandler: middleware.ErrorHandler(),
	})
	
	// Add recover middleware
	app.Use(middleware.RecoverMiddleware())
	
	// Setup routes
	handler := handlers.NewExampleHandler(db)
	app.Post("/users", handler.CreateUser)
	app.Get("/users/:id", handler.GetUser)
	app.Put("/users/:id", handler.UpdateUser)
	app.Delete("/users/:id", handler.DeleteUser)
	app.Get("/users", handler.GetUsers)
	app.Get("/simulate-error", handler.SimulateError)
	
	return app, db
}

func TestCreateUserErrorHandling(t *testing.T) {
	app, db := setupTestApp()
	
	t.Run("Successful user creation", func(t *testing.T) {
		reqBody := `{
			"email": "test@example.com",
			"password": "password123",
			"full_name": "John Doe",
			"role_id": 1
		}`
		
		req := httptest.NewRequest("POST", "/users", strings.NewReader(reqBody))
		req.Header.Set("Content-Type", "application/json")
		
		resp, err := app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)
		
		var response map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&response)
		assert.True(t, response["success"].(bool))
		assert.Equal(t, "User created successfully", response["message"])
	})
	
	t.Run("Validation error - invalid email", func(t *testing.T) {
		reqBody := `{
			"email": "invalid-email",
			"password": "password123",
			"full_name": "John Doe",
			"role_id": 1
		}`
		
		req := httptest.NewRequest("POST", "/users", strings.NewReader(reqBody))
		req.Header.Set("Content-Type", "application/json")
		
		resp, err := app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusUnprocessableEntity, resp.StatusCode)
		
		var response errors.ValidationErrorResponse
		json.NewDecoder(resp.Body).Decode(&response)
		assert.False(t, response.Success)
		assert.Equal(t, "Validation failed", response.Error.Message)
		assert.Greater(t, len(response.Errors), 0)
	})
	
	t.Run("Validation error - missing required fields", func(t *testing.T) {
		reqBody := `{
			"email": "test2@example.com"
		}`
		
		req := httptest.NewRequest("POST", "/users", strings.NewReader(reqBody))
		req.Header.Set("Content-Type", "application/json")
		
		resp, err := app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusUnprocessableEntity, resp.StatusCode)
	})
	
	t.Run("Conflict error - duplicate email", func(t *testing.T) {
		// First, create a user
		fullName := "Jane Doe"
		user := models.User{
			Email:    "duplicate@example.com",
			Password: "password123",
			FullName: &fullName,
			RoleID:   1,
		}
		db.Create(&user)
		
		// Try to create another user with the same email
		reqBody := `{
			"email": "duplicate@example.com",
			"password": "password123",
			"full_name": "John Smith",
			"role_id": 1
		}`
		
		req := httptest.NewRequest("POST", "/users", strings.NewReader(reqBody))
		req.Header.Set("Content-Type", "application/json")
		
		resp, err := app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusConflict, resp.StatusCode)
		
		var response errors.ErrorResponse
		json.NewDecoder(resp.Body).Decode(&response)
		assert.False(t, response.Success)
		assert.Equal(t, "User with this email already exists", response.Error.Message)
	})
}

func TestGetUserErrorHandling(t *testing.T) {
	app, db := setupTestApp()
	
	t.Run("Successful user retrieval", func(t *testing.T) {
		// Create a user first
		fullName := "Get User"
		user := models.User{
			Email:    "get@example.com",
			Password: "password123",
			FullName: &fullName,
			RoleID:   1,
		}
		db.Create(&user)
		
		req := httptest.NewRequest("GET", "/users/1", nil)
		resp, err := app.Test(req)
		
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)
		
		var response map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&response)
		assert.True(t, response["success"].(bool))
	})
	
	t.Run("Not found error", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/users/999", nil)
		resp, err := app.Test(req)
		
		assert.NoError(t, err)
		assert.Equal(t, http.StatusNotFound, resp.StatusCode)
		
		var response errors.ErrorResponse
		json.NewDecoder(resp.Body).Decode(&response)
		assert.False(t, response.Success)
		assert.Equal(t, "User not found", response.Error.Message)
	})
	
	t.Run("Bad request error - invalid ID", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/users/invalid", nil)
		resp, err := app.Test(req)
		
		assert.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
		
		var response errors.ErrorResponse
		json.NewDecoder(resp.Body).Decode(&response)
		assert.False(t, response.Success)
		assert.Equal(t, "Invalid user ID", response.Error.Message)
	})
}

func TestSimulateErrorEndpoint(t *testing.T) {
	app, _ := setupTestApp()
	
	testCases := []struct {
		errorType      string
		expectedStatus int
		expectedType   string
	}{
		{"validation", http.StatusUnprocessableEntity, errors.ErrorTypeValidation},
		{"not_found", http.StatusNotFound, errors.ErrorTypeNotFound},
		{"unauthorized", http.StatusUnauthorized, errors.ErrorTypeAuth},
		{"forbidden", http.StatusForbidden, errors.ErrorTypeAuthorization},
		{"conflict", http.StatusConflict, errors.ErrorTypeConflict},
		{"bad_request", http.StatusBadRequest, errors.ErrorTypeBadRequest},
		{"database", http.StatusNotFound, errors.ErrorTypeNotFound}, // GORM ErrRecordNotFound maps to 404
		{"internal", http.StatusInternalServerError, errors.ErrorTypeInternal},
	}
	
	for _, tc := range testCases {
		t.Run("Simulate "+tc.errorType+" error", func(t *testing.T) {
			req := httptest.NewRequest("GET", "/simulate-error?type="+tc.errorType, nil)
			resp, err := app.Test(req)
			
			assert.NoError(t, err)
			assert.Equal(t, tc.expectedStatus, resp.StatusCode)
			
			if tc.errorType == "validation" {
				var response errors.ValidationErrorResponse
				json.NewDecoder(resp.Body).Decode(&response)
				assert.False(t, response.Success)
				assert.Equal(t, tc.expectedType, response.Error.Type)
			} else {
				var response errors.ErrorResponse
				json.NewDecoder(resp.Body).Decode(&response)
				assert.False(t, response.Success)
				assert.Equal(t, tc.expectedType, response.Error.Type)
			}
		})
	}
}

func TestPanicRecovery(t *testing.T) {
	app, _ := setupTestApp()
	
	t.Run("Panic is recovered and returns error response", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/simulate-error?type=panic", nil)
		resp, err := app.Test(req)
		
		assert.NoError(t, err)
		assert.Equal(t, http.StatusInternalServerError, resp.StatusCode)
		
		var response errors.ErrorResponse
		json.NewDecoder(resp.Body).Decode(&response)
		assert.False(t, response.Success)
		assert.Equal(t, errors.ErrorTypeInternal, response.Error.Type)
	})
}

func TestGetUsersWithPagination(t *testing.T) {
	app, db := setupTestApp()
	
	// Create test users
	fullName1 := "User One"
	fullName2 := "User Two"
	fullName3 := "User Three"
	users := []models.User{
		{Email: "user1@example.com", FullName: &fullName1, RoleID: 1},
		{Email: "user2@example.com", FullName: &fullName2, RoleID: 2},
		{Email: "user3@example.com", FullName: &fullName3, RoleID: 3},
	}
	
	for _, user := range users {
		db.Create(&user)
	}
	
	t.Run("Successful pagination", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/users?page=1&limit=2", nil)
		resp, err := app.Test(req)
		
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)
		
		var response map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&response)
		assert.True(t, response["success"].(bool))
		assert.NotNil(t, response["pagination"])
	})
	
	t.Run("Invalid page parameter", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/users?page=invalid", nil)
		resp, err := app.Test(req)
		
		assert.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
		
		var response errors.ErrorResponse
		json.NewDecoder(resp.Body).Decode(&response)
		assert.False(t, response.Success)
		assert.Equal(t, "Invalid page number", response.Error.Message)
	})
	
	t.Run("Invalid limit parameter", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/users?limit=200", nil)
		resp, err := app.Test(req)
		
		assert.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
		
		var response errors.ErrorResponse
		json.NewDecoder(resp.Body).Decode(&response)
		assert.False(t, response.Success)
		assert.Contains(t, response.Error.Message, "Invalid limit")
	})
}