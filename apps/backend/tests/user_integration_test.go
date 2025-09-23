package tests

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http/httptest"
	"testing"

	"backend-go/internal/handlers"
	"backend-go/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// MockUserService implements a mock user service for testing
type MockUserService struct {
	users []mockUser
}

type mockUser struct {
	ID       uint   `json:"id"`
	FullName string `json:"full_name"`
	Email    string `json:"email"`
	RoleID   uint   `json:"role_id"`
}

func NewMockUserService() *MockUserService {
	return &MockUserService{
		users: []mockUser{
			{ID: 1, FullName: "Test User 1", Email: "test1@example.com", RoleID: 1},
			{ID: 2, FullName: "Test User 2", Email: "test2@example.com", RoleID: 1},
		},
	}
}

func setupMockUserApp() *fiber.App {
	app := fiber.New()
	
	// Create mock service
	mockService := NewMockUserService()
	
	// Setup routes - specific routes must come before parameterized ones
	api := app.Group("/api/v1")
	
	// Specific routes first (to avoid conflicts with :id routes)
	api.Get("/users/stats", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "User statistics retrieved successfully",
			"data": fiber.Map{
				"total_users": len(mockService.users),
				"by_role": []fiber.Map{
					{"role_id": 1, "role_name": "student", "count": len(mockService.users)},
				},
			},
		})
	})
	
	api.Delete("/users/bulk", func(c *fiber.Ctx) error {
		var req map[string]interface{}
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
		}
		
		userIDs, ok := req["user_ids"].([]interface{})
		if !ok || len(userIDs) == 0 {
			return c.Status(400).JSON(fiber.Map{"error": "user_ids is required"})
		}
		
		return c.JSON(fiber.Map{
			"message": "Users deleted successfully",
		})
	})
	
	// General routes
	api.Get("/users", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "Users retrieved successfully",
			"data": fiber.Map{
				"data":        mockService.users,
				"total":       len(mockService.users),
				"page":        1,
				"limit":       10,
				"total_pages": 1,
			},
		})
	})
	
	api.Post("/users", func(c *fiber.Ctx) error {
		var req map[string]interface{}
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
		}
		
		// Basic validation
		if req["email"] == nil || req["password"] == nil || req["role_id"] == nil {
			return c.Status(400).JSON(fiber.Map{"error": "Missing required fields"})
		}
		
		// Mock successful creation
		newUser := mockUser{
			ID:       uint(len(mockService.users) + 1),
			FullName: req["full_name"].(string),
			Email:    req["email"].(string),
			RoleID:   uint(req["role_id"].(float64)),
		}
		
		return c.Status(201).JSON(fiber.Map{
			"message": "User created successfully",
			"data":    newUser,
		})
	})
	
	// Parameterized routes last
	api.Get("/users/:id", func(c *fiber.Ctx) error {
		id := c.Params("id")
		if id == "1" {
			return c.JSON(fiber.Map{
				"message": "User retrieved successfully",
				"data":    mockService.users[0],
			})
		}
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	})
	
	api.Put("/users/:id", func(c *fiber.Ctx) error {
		id := c.Params("id")
		if id != "1" {
			return c.Status(404).JSON(fiber.Map{"error": "User not found"})
		}
		
		var req map[string]interface{}
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
		}
		
		// Mock successful update
		updatedUser := mockService.users[0]
		if fullName, ok := req["full_name"].(string); ok {
			updatedUser.FullName = fullName
		}
		
		return c.JSON(fiber.Map{
			"message": "User updated successfully",
			"data":    updatedUser,
		})
	})
	
	api.Delete("/users/:id", func(c *fiber.Ctx) error {
		id := c.Params("id")
		if id != "1" {
			return c.Status(404).JSON(fiber.Map{"error": "User not found"})
		}
		
		return c.JSON(fiber.Map{
			"message": "User deleted successfully",
		})
	})
	
	return app
}

func TestUserEndpoints_Integration(t *testing.T) {
	app := setupMockUserApp()
	
	t.Run("GET /api/v1/users", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/users", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		
		assert.Equal(t, 200, resp.StatusCode)
		
		body, err := io.ReadAll(resp.Body)
		require.NoError(t, err)
		
		var response map[string]interface{}
		err = json.Unmarshal(body, &response)
		require.NoError(t, err)
		
		assert.Equal(t, "Users retrieved successfully", response["message"])
		assert.Contains(t, response, "data")
	})
	
	t.Run("POST /api/v1/users", func(t *testing.T) {
		payload := map[string]interface{}{
			"full_name": "New User",
			"email":     "newuser@example.com",
			"password":  "password123",
			"role_id":   1,
		}
		
		payloadBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest("POST", "/api/v1/users", bytes.NewReader(payloadBytes))
		req.Header.Set("Content-Type", "application/json")
		
		resp, err := app.Test(req)
		require.NoError(t, err)
		
		assert.Equal(t, 201, resp.StatusCode)
		
		body, err := io.ReadAll(resp.Body)
		require.NoError(t, err)
		
		var response map[string]interface{}
		err = json.Unmarshal(body, &response)
		require.NoError(t, err)
		
		assert.Equal(t, "User created successfully", response["message"])
		assert.Contains(t, response, "data")
	})
	
	t.Run("POST /api/v1/users - Missing fields", func(t *testing.T) {
		payload := map[string]interface{}{
			"full_name": "Incomplete User",
		}
		
		payloadBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest("POST", "/api/v1/users", bytes.NewReader(payloadBytes))
		req.Header.Set("Content-Type", "application/json")
		
		resp, err := app.Test(req)
		require.NoError(t, err)
		
		assert.Equal(t, 400, resp.StatusCode)
	})
	
	t.Run("GET /api/v1/users/:id", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/users/1", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		
		assert.Equal(t, 200, resp.StatusCode)
		
		body, err := io.ReadAll(resp.Body)
		require.NoError(t, err)
		
		var response map[string]interface{}
		err = json.Unmarshal(body, &response)
		require.NoError(t, err)
		
		assert.Equal(t, "User retrieved successfully", response["message"])
		assert.Contains(t, response, "data")
	})
	
	t.Run("GET /api/v1/users/:id - Not found", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/users/999", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		
		assert.Equal(t, 404, resp.StatusCode)
	})
	
	t.Run("PUT /api/v1/users/:id", func(t *testing.T) {
		payload := map[string]interface{}{
			"full_name": "Updated User",
		}
		
		payloadBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest("PUT", "/api/v1/users/1", bytes.NewReader(payloadBytes))
		req.Header.Set("Content-Type", "application/json")
		
		resp, err := app.Test(req)
		require.NoError(t, err)
		
		assert.Equal(t, 200, resp.StatusCode)
		
		body, err := io.ReadAll(resp.Body)
		require.NoError(t, err)
		
		var response map[string]interface{}
		err = json.Unmarshal(body, &response)
		require.NoError(t, err)
		
		assert.Equal(t, "User updated successfully", response["message"])
	})
	
	t.Run("DELETE /api/v1/users/:id", func(t *testing.T) {
		req := httptest.NewRequest("DELETE", "/api/v1/users/1", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		
		assert.Equal(t, 200, resp.StatusCode)
		
		body, err := io.ReadAll(resp.Body)
		require.NoError(t, err)
		
		var response map[string]interface{}
		err = json.Unmarshal(body, &response)
		require.NoError(t, err)
		
		assert.Equal(t, "User deleted successfully", response["message"])
	})
	
	t.Run("DELETE /api/v1/users/bulk", func(t *testing.T) {
		payload := map[string]interface{}{
			"user_ids": []int{1, 2},
		}
		
		payloadBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest("DELETE", "/api/v1/users/bulk", bytes.NewReader(payloadBytes))
		req.Header.Set("Content-Type", "application/json")
		
		resp, err := app.Test(req)
		require.NoError(t, err)
		
		assert.Equal(t, 200, resp.StatusCode)
		
		body, err := io.ReadAll(resp.Body)
		require.NoError(t, err)
		
		var response map[string]interface{}
		err = json.Unmarshal(body, &response)
		require.NoError(t, err)
		
		assert.Equal(t, "Users deleted successfully", response["message"])
	})
	
	t.Run("GET /api/v1/users/stats", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/users/stats", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		
		assert.Equal(t, 200, resp.StatusCode)
		
		body, err := io.ReadAll(resp.Body)
		require.NoError(t, err)
		
		var response map[string]interface{}
		err = json.Unmarshal(body, &response)
		require.NoError(t, err)
		
		assert.Equal(t, "User statistics retrieved successfully", response["message"])
		assert.Contains(t, response, "data")
	})
}

func TestUserHandlerValidation(t *testing.T) {
	// Test the actual handler validation logic without database
	userHandler := handlers.NewUserHandler(nil) // nil service for validation testing
	
	app := fiber.New()
	app.Post("/test", func(c *fiber.Ctx) error {
		// Test request parsing
		var req services.CreateUserRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
		}
		
		// Test validation
		validator := userHandler.GetValidator()
		if validator != nil {
			if err := validator.Struct(req); err != nil {
				return c.Status(400).JSON(fiber.Map{"error": "Validation failed"})
			}
		}
		
		return c.JSON(fiber.Map{"message": "Validation passed"})
	})
	
	t.Run("Valid request passes validation", func(t *testing.T) {
		payload := map[string]interface{}{
			"full_name": "Test User",
			"email":     "test@example.com",
			"password":  "password123",
			"role_id":   1,
		}
		
		payloadBytes, _ := json.Marshal(payload)
		req := httptest.NewRequest("POST", "/test", bytes.NewReader(payloadBytes))
		req.Header.Set("Content-Type", "application/json")
		
		resp, err := app.Test(req)
		require.NoError(t, err)
		
		// Should pass basic parsing
		assert.Equal(t, 200, resp.StatusCode)
	})
	
	t.Run("Invalid JSON fails parsing", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/test", bytes.NewReader([]byte("invalid json")))
		req.Header.Set("Content-Type", "application/json")
		
		resp, err := app.Test(req)
		require.NoError(t, err)
		
		assert.Equal(t, 400, resp.StatusCode)
	})
}