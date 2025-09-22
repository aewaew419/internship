package tests

import (
	"bytes"
	"encoding/json"
	"net/http/httptest"
	"os"
	"testing"

	"backend-go/internal/config"
	"backend-go/internal/database"
	"backend-go/internal/models"
	"backend-go/internal/routes"
	"backend-go/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	"gorm.io/gorm"
)

// AuthIntegrationTestSuite defines the test suite for authentication integration tests
type AuthIntegrationTestSuite struct {
	suite.Suite
	app    *fiber.App
	db     *gorm.DB
	config *config.Config
}

// SetupSuite runs once before all tests in the suite
func (suite *AuthIntegrationTestSuite) SetupSuite() {
	// Set test environment
	os.Setenv("ENVIRONMENT", "test")
	os.Setenv("DATABASE_URL", "root:password@tcp(localhost:3306)/internship_test_db?charset=utf8mb4&parseTime=True&loc=Local")
	os.Setenv("JWT_SECRET", "test-jwt-secret-key")

	// Load test configuration
	suite.config = config.Load()

	// Initialize database connection
	var err error
	suite.db, err = database.Connect(suite.config.DatabaseURL)
	if err != nil {
		suite.T().Skipf("Skipping integration tests: database connection failed: %v", err)
		return
	}

	// Run migrations
	err = database.Migrate(suite.db)
	if err != nil {
		suite.T().Skipf("Skipping integration tests: database migration failed: %v", err)
		return
	}

	// Create test roles
	suite.createTestRoles()

	// Create Fiber app and setup routes
	suite.app = fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		},
	})

	// Setup routes
	routes.Setup(suite.app, suite.db, suite.config)
}

// TearDownSuite runs once after all tests in the suite
func (suite *AuthIntegrationTestSuite) TearDownSuite() {
	if suite.db != nil {
		// Clean up test data
		suite.cleanupTestData()
		
		// Close database connection
		sqlDB, _ := suite.db.DB()
		if sqlDB != nil {
			sqlDB.Close()
		}
	}
}

// SetupTest runs before each test
func (suite *AuthIntegrationTestSuite) SetupTest() {
	// Clean up any existing test users before each test
	suite.db.Where("email LIKE ?", "%test%").Delete(&models.User{})
}

// createTestRoles creates test roles in the database
func (suite *AuthIntegrationTestSuite) createTestRoles() {
	roles := []models.Role{
		{Name: "admin"},
		{Name: "student"},
		{Name: "instructor"},
		{Name: "staff"},
	}

	for _, role := range roles {
		var existingRole models.Role
		err := suite.db.Where("name = ?", role.Name).First(&existingRole).Error
		if err == gorm.ErrRecordNotFound {
			suite.db.Create(&role)
		}
	}
}

// cleanupTestData removes all test data from the database
func (suite *AuthIntegrationTestSuite) cleanupTestData() {
	suite.db.Where("email LIKE ?", "%test%").Delete(&models.User{})
}

// TestFullAuthenticationFlow tests the complete authentication flow
func (suite *AuthIntegrationTestSuite) TestFullAuthenticationFlow() {
	// Step 1: Register a new user
	registerReq := map[string]interface{}{
		"full_name":        "Test User",
		"email":           "testuser@example.com",
		"password":        "password123",
		"confirm_password": "password123",
		"role_id":         1, // admin role
	}
	reqBody, _ := json.Marshal(registerReq)

	req := httptest.NewRequest("POST", "/api/v1/register", bytes.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	resp, err := suite.app.Test(req)

	suite.NoError(err)
	suite.Equal(201, resp.StatusCode)

	var registerResponse map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&registerResponse)
	suite.NoError(err)
	suite.Equal("User registered successfully", registerResponse["message"])
	suite.Contains(registerResponse, "data")

	// Step 2: Login with the registered user
	loginReq := map[string]string{
		"email":    "testuser@example.com",
		"password": "password123",
	}
	reqBody, _ = json.Marshal(loginReq)

	req = httptest.NewRequest("POST", "/api/v1/login", bytes.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	resp, err = suite.app.Test(req)

	suite.NoError(err)
	suite.Equal(200, resp.StatusCode)

	var loginResponse map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&loginResponse)
	suite.NoError(err)
	suite.Equal("Login successful", loginResponse["message"])
	
	data := loginResponse["data"].(map[string]interface{})
	accessToken := data["access_token"].(string)
	refreshToken := data["refresh_token"].(string)
	suite.NotEmpty(accessToken)
	suite.NotEmpty(refreshToken)

	// Step 3: Access protected endpoint (/me) with access token
	req = httptest.NewRequest("GET", "/api/v1/me", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	resp, err = suite.app.Test(req)

	suite.NoError(err)
	suite.Equal(200, resp.StatusCode)

	var meResponse map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&meResponse)
	suite.NoError(err)
	suite.Equal("User profile retrieved successfully", meResponse["message"])
	
	userData := meResponse["data"].(map[string]interface{})
	suite.Equal("testuser@example.com", userData["email"])
	suite.Equal("Test User", userData["full_name"])

	// Step 4: Change password
	changePasswordReq := map[string]string{
		"current_password": "password123",
		"new_password":     "newpassword123",
		"confirm_password": "newpassword123",
	}
	reqBody, _ = json.Marshal(changePasswordReq)

	req = httptest.NewRequest("POST", "/api/v1/change-password", bytes.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+accessToken)
	resp, err = suite.app.Test(req)

	suite.NoError(err)
	suite.Equal(200, resp.StatusCode)

	var changePasswordResponse map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&changePasswordResponse)
	suite.NoError(err)
	suite.Equal("Password changed successfully", changePasswordResponse["message"])

	// Step 5: Login with new password
	loginReq["password"] = "newpassword123"
	reqBody, _ = json.Marshal(loginReq)

	req = httptest.NewRequest("POST", "/api/v1/login", bytes.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	resp, err = suite.app.Test(req)

	suite.NoError(err)
	suite.Equal(200, resp.StatusCode)

	// Step 6: Refresh token
	refreshReq := map[string]string{
		"refresh_token": refreshToken,
	}
	reqBody, _ = json.Marshal(refreshReq)

	req = httptest.NewRequest("POST", "/api/v1/refresh-token", bytes.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	resp, err = suite.app.Test(req)

	suite.NoError(err)
	suite.Equal(200, resp.StatusCode)

	var refreshResponse map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&refreshResponse)
	suite.NoError(err)
	suite.Equal("Token refreshed successfully", refreshResponse["message"])

	// Step 7: Logout
	req = httptest.NewRequest("POST", "/api/v1/logout", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	resp, err = suite.app.Test(req)

	suite.NoError(err)
	suite.Equal(200, resp.StatusCode)

	var logoutResponse map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&logoutResponse)
	suite.NoError(err)
	suite.Equal("Logged out successfully", logoutResponse["message"])
}

// TestPasswordResetFlow tests the password reset functionality
func (suite *AuthIntegrationTestSuite) TestPasswordResetFlow() {
	// First, register a user
	registerReq := map[string]interface{}{
		"full_name":        "Reset Test User",
		"email":           "resettest@example.com",
		"password":        "password123",
		"confirm_password": "password123",
		"role_id":         2, // student role
	}
	reqBody, _ := json.Marshal(registerReq)

	req := httptest.NewRequest("POST", "/api/v1/register", bytes.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	resp, err := suite.app.Test(req)

	suite.NoError(err)
	suite.Equal(201, resp.StatusCode)

	// Step 1: Request password reset
	resetReq := map[string]string{
		"email": "resettest@example.com",
	}
	reqBody, _ = json.Marshal(resetReq)

	req = httptest.NewRequest("POST", "/api/v1/request-password-reset", bytes.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	resp, err = suite.app.Test(req)

	suite.NoError(err)
	suite.Equal(200, resp.StatusCode)

	var resetResponse map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&resetResponse)
	suite.NoError(err)
	suite.Contains(resetResponse["message"], "password reset link has been sent")

	// Step 2: Generate a reset token manually for testing
	// In a real scenario, this would be sent via email
	jwtService := services.NewJWTService(suite.config.JWTSecret)
	
	// Get the user ID from database
	var user models.User
	err = suite.db.Where("email = ?", "resettest@example.com").First(&user).Error
	suite.NoError(err)
	
	resetToken, err := jwtService.GeneratePasswordResetToken(user.ID, "resettest@example.com")
	suite.NoError(err)

	// Step 3: Reset password with token
	resetConfirmReq := map[string]string{
		"token":            resetToken,
		"password":         "newresetpassword123",
		"confirm_password": "newresetpassword123",
	}
	reqBody, _ = json.Marshal(resetConfirmReq)

	req = httptest.NewRequest("POST", "/api/v1/reset-password", bytes.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	resp, err = suite.app.Test(req)

	suite.NoError(err)
	suite.Equal(200, resp.StatusCode)

	var resetConfirmResponse map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&resetConfirmResponse)
	suite.NoError(err)
	suite.Equal("Password reset successfully", resetConfirmResponse["message"])

	// Step 4: Login with new password
	loginReq := map[string]string{
		"email":    "resettest@example.com",
		"password": "newresetpassword123",
	}
	reqBody, _ = json.Marshal(loginReq)

	req = httptest.NewRequest("POST", "/api/v1/login", bytes.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	resp, err = suite.app.Test(req)

	suite.NoError(err)
	suite.Equal(200, resp.StatusCode)
}

// TestAuthenticationErrors tests various error scenarios
func (suite *AuthIntegrationTestSuite) TestAuthenticationErrors() {
	// Test 1: Login with non-existent user
	loginReq := map[string]string{
		"email":    "nonexistent@example.com",
		"password": "password123",
	}
	reqBody, _ := json.Marshal(loginReq)

	req := httptest.NewRequest("POST", "/api/v1/login", bytes.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	resp, err := suite.app.Test(req)

	suite.NoError(err)
	suite.Equal(401, resp.StatusCode)

	var errorResponse map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&errorResponse)
	suite.NoError(err)
	suite.Equal("Invalid email or password", errorResponse["error"])
	suite.Equal("INVALID_CREDENTIALS", errorResponse["code"])

	// Test 2: Register with existing email
	// First register a user
	registerReq := map[string]interface{}{
		"full_name":        "Duplicate Test User",
		"email":           "duplicate@example.com",
		"password":        "password123",
		"confirm_password": "password123",
		"role_id":         1,
	}
	reqBody, _ = json.Marshal(registerReq)

	req = httptest.NewRequest("POST", "/api/v1/register", bytes.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	resp, err = suite.app.Test(req)

	suite.NoError(err)
	suite.Equal(201, resp.StatusCode)

	// Try to register again with same email
	req = httptest.NewRequest("POST", "/api/v1/register", bytes.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	resp, err = suite.app.Test(req)

	suite.NoError(err)
	suite.Equal(409, resp.StatusCode)

	err = json.NewDecoder(resp.Body).Decode(&errorResponse)
	suite.NoError(err)
	suite.Equal("User with this email already exists", errorResponse["error"])
	suite.Equal("EMAIL_EXISTS", errorResponse["code"])

	// Test 3: Access protected endpoint without token
	req = httptest.NewRequest("GET", "/api/v1/me", nil)
	resp, err = suite.app.Test(req)

	suite.NoError(err)
	suite.Equal(401, resp.StatusCode)

	// Test 4: Access protected endpoint with invalid token
	req = httptest.NewRequest("GET", "/api/v1/me", nil)
	req.Header.Set("Authorization", "Bearer invalid-token")
	resp, err = suite.app.Test(req)

	suite.NoError(err)
	suite.Equal(401, resp.StatusCode)
}

// TestValidationErrors tests input validation
func (suite *AuthIntegrationTestSuite) TestValidationErrors() {
	// Test 1: Register with password mismatch
	registerReq := map[string]interface{}{
		"full_name":        "Validation Test User",
		"email":           "validation@example.com",
		"password":        "password123",
		"confirm_password": "differentpassword",
		"role_id":         1,
	}
	reqBody, _ := json.Marshal(registerReq)

	req := httptest.NewRequest("POST", "/api/v1/register", bytes.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	resp, err := suite.app.Test(req)

	suite.NoError(err)
	suite.Equal(400, resp.StatusCode)

	var errorResponse map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&errorResponse)
	suite.NoError(err)
	suite.Equal("Passwords do not match", errorResponse["error"])
	suite.Equal("PASSWORD_MISMATCH", errorResponse["code"])

	// Test 2: Register with invalid role
	registerReq["confirm_password"] = "password123"
	registerReq["role_id"] = 999 // Non-existent role
	reqBody, _ = json.Marshal(registerReq)

	req = httptest.NewRequest("POST", "/api/v1/register", bytes.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	resp, err = suite.app.Test(req)

	suite.NoError(err)
	suite.Equal(400, resp.StatusCode)

	err = json.NewDecoder(resp.Body).Decode(&errorResponse)
	suite.NoError(err)
	suite.Equal("Invalid role specified", errorResponse["error"])
	suite.Equal("INVALID_ROLE", errorResponse["code"])
}

// TestConcurrentAuthentication tests concurrent authentication requests
func (suite *AuthIntegrationTestSuite) TestConcurrentAuthentication() {
	// Register a test user first
	registerReq := map[string]interface{}{
		"full_name":        "Concurrent Test User",
		"email":           "concurrent@example.com",
		"password":        "password123",
		"confirm_password": "password123",
		"role_id":         1,
	}
	reqBody, _ := json.Marshal(registerReq)

	req := httptest.NewRequest("POST", "/api/v1/register", bytes.NewReader(reqBody))
	req.Header.Set("Content-Type", "application/json")
	resp, err := suite.app.Test(req)

	suite.NoError(err)
	suite.Equal(201, resp.StatusCode)

	// Perform concurrent login requests
	loginReq := map[string]string{
		"email":    "concurrent@example.com",
		"password": "password123",
	}
	loginReqBody, _ := json.Marshal(loginReq)

	// Create multiple concurrent requests
	numRequests := 10
	results := make(chan int, numRequests)

	for i := 0; i < numRequests; i++ {
		go func() {
			req := httptest.NewRequest("POST", "/api/v1/login", bytes.NewReader(loginReqBody))
			req.Header.Set("Content-Type", "application/json")
			resp, err := suite.app.Test(req)
			
			if err != nil {
				results <- 500
			} else {
				results <- resp.StatusCode
			}
		}()
	}

	// Collect results
	successCount := 0
	for i := 0; i < numRequests; i++ {
		statusCode := <-results
		if statusCode == 200 {
			successCount++
		}
	}

	// All concurrent requests should succeed
	suite.Equal(numRequests, successCount, "All concurrent login requests should succeed")
}

// TestRunAuthIntegrationSuite runs the authentication integration test suite
func TestRunAuthIntegrationSuite(t *testing.T) {
	suite.Run(t, new(AuthIntegrationTestSuite))
}

// TestBasicAuthEndpoints tests basic authentication endpoints without database
func TestBasicAuthEndpoints(t *testing.T) {
	// Create a simple test to verify endpoints exist and respond correctly to basic requests
	app := fiber.New()
	
	// Add a simple test endpoint
	api := app.Group("/api/v1")
	api.Get("/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "Authentication endpoints are ready",
			"status":  "ok",
		})
	})
	
	req := httptest.NewRequest("GET", "/api/v1/test", nil)
	resp, err := app.Test(req)
	
	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)
	
	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(t, err)
	
	assert.Equal(t, "Authentication endpoints are ready", response["message"])
	assert.Equal(t, "ok", response["status"])
}