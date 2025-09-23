package middleware

import (
	"net/http/httptest"
	"testing"

	"backend-go/internal/models"
	"backend-go/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupTestAppWithDB(t *testing.T) (*fiber.App, *gorm.DB, *services.JWTService) {
	// Skip tests that require database if CGO is disabled
	if testing.Short() {
		t.Skip("Skipping database tests in short mode")
	}

	// Setup test database
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	if err != nil {
		t.Skip("Skipping database tests - SQLite not available")
		return nil, nil, nil
	}

	// Auto migrate tables
	err = db.AutoMigrate(&models.Role{}, &models.Permission{}, &models.RolePermission{})
	if err != nil {
		t.Skip("Skipping database tests - migration failed")
		return nil, nil, nil
	}

	// Create test roles
	roles := []models.Role{
		{ID: 1, Name: "admin"},
		{ID: 2, Name: "instructor"},
		{ID: 3, Name: "student"},
		{ID: 4, Name: "staff"},
	}

	for _, role := range roles {
		db.Create(&role)
	}

	// Setup JWT service
	jwtService := services.NewJWTService("test-secret-key")

	// Setup Fiber app
	app := fiber.New()

	// Setup middleware
	config := MiddlewareConfig{
		JWTService:  jwtService,
		DB:          db,
		Environment: "test",
		AllowedOrigins: []string{
			"http://localhost:3000",
			"https://example.com",
		},
	}
	SetupMiddleware(app, config)

	return app, db, jwtService
}

func TestSetupMiddleware(t *testing.T) {
	app, _, _ := setupTestAppWithDB(t)

	// Test that middleware is properly set up by making a request
	app.Get("/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"success": true})
	})

	req := httptest.NewRequest("GET", "/test", nil)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)
}

func TestAuthGroup(t *testing.T) {
	app, _, jwtService := setupTestAppWithDB(t)

	// Create auth group
	authGroup := AuthGroup(app, "/api/v1", jwtService)
	authGroup.Get("/protected", func(c *fiber.Ctx) error {
		userID, _ := GetUserID(c)
		return c.JSON(fiber.Map{"user_id": userID})
	})

	// Test without token
	req := httptest.NewRequest("GET", "/api/v1/protected", nil)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, 401, resp.StatusCode)

	// Test with valid token
	token, err := jwtService.GenerateToken(1, "test@example.com", 1)
	assert.NoError(t, err)

	req = httptest.NewRequest("GET", "/api/v1/protected", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	resp, err = app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)
}

func TestAdminGroup(t *testing.T) {
	app, db, jwtService := setupTestAppWithDB(t)

	// Create admin group
	adminGroup := AdminGroup(app, "/admin", jwtService, db)
	adminGroup.Get("/dashboard", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"admin": true})
	})

	tests := []struct {
		name           string
		roleID         uint
		expectedStatus int
	}{
		{
			name:           "Admin access",
			roleID:         1, // admin
			expectedStatus: 200,
		},
		{
			name:           "Non-admin access",
			roleID:         3, // student
			expectedStatus: 403,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			token, err := jwtService.GenerateToken(1, "test@example.com", tt.roleID)
			assert.NoError(t, err)

			req := httptest.NewRequest("GET", "/admin/dashboard", nil)
			req.Header.Set("Authorization", "Bearer "+token)
			resp, err := app.Test(req)
			assert.NoError(t, err)
			assert.Equal(t, tt.expectedStatus, resp.StatusCode)
		})
	}
}

func TestInstructorGroup(t *testing.T) {
	app, db, jwtService := setupTestAppWithDB(t)

	// Create instructor group
	instructorGroup := InstructorGroup(app, "/instructor", jwtService, db)
	instructorGroup.Get("/courses", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"courses": []string{}})
	})

	tests := []struct {
		name           string
		roleID         uint
		expectedStatus int
	}{
		{
			name:           "Admin access",
			roleID:         1, // admin
			expectedStatus: 200,
		},
		{
			name:           "Instructor access",
			roleID:         2, // instructor
			expectedStatus: 200,
		},
		{
			name:           "Student access",
			roleID:         3, // student
			expectedStatus: 403,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			token, err := jwtService.GenerateToken(1, "test@example.com", tt.roleID)
			assert.NoError(t, err)

			req := httptest.NewRequest("GET", "/instructor/courses", nil)
			req.Header.Set("Authorization", "Bearer "+token)
			resp, err := app.Test(req)
			assert.NoError(t, err)
			assert.Equal(t, tt.expectedStatus, resp.StatusCode)
		})
	}
}

func TestStaffGroup(t *testing.T) {
	app, db, jwtService := setupTestAppWithDB(t)

	// Create staff group
	staffGroup := StaffGroup(app, "/staff", jwtService, db)
	staffGroup.Get("/reports", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"reports": []string{}})
	})

	tests := []struct {
		name           string
		roleID         uint
		expectedStatus int
	}{
		{
			name:           "Admin access",
			roleID:         1, // admin
			expectedStatus: 200,
		},
		{
			name:           "Staff access",
			roleID:         4, // staff
			expectedStatus: 200,
		},
		{
			name:           "Student access",
			roleID:         3, // student
			expectedStatus: 403,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			token, err := jwtService.GenerateToken(1, "test@example.com", tt.roleID)
			assert.NoError(t, err)

			req := httptest.NewRequest("GET", "/staff/reports", nil)
			req.Header.Set("Authorization", "Bearer "+token)
			resp, err := app.Test(req)
			assert.NoError(t, err)
			assert.Equal(t, tt.expectedStatus, resp.StatusCode)
		})
	}
}

func TestStudentGroup(t *testing.T) {
	app, db, jwtService := setupTestAppWithDB(t)

	// Create student group
	studentGroup := StudentGroup(app, "/student", jwtService, db)
	studentGroup.Get("/profile", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"profile": true})
	})

	tests := []struct {
		name           string
		roleID         uint
		expectedStatus int
	}{
		{
			name:           "Admin access",
			roleID:         1, // admin
			expectedStatus: 200,
		},
		{
			name:           "Instructor access",
			roleID:         2, // instructor
			expectedStatus: 200,
		},
		{
			name:           "Staff access",
			roleID:         4, // staff
			expectedStatus: 200,
		},
		{
			name:           "Student access",
			roleID:         3, // student
			expectedStatus: 200,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			token, err := jwtService.GenerateToken(1, "test@example.com", tt.roleID)
			assert.NoError(t, err)

			req := httptest.NewRequest("GET", "/student/profile", nil)
			req.Header.Set("Authorization", "Bearer "+token)
			resp, err := app.Test(req)
			assert.NoError(t, err)
			assert.Equal(t, tt.expectedStatus, resp.StatusCode)
		})
	}
}

func TestPublicGroup(t *testing.T) {
	app, _, _ := setupTestAppWithDB(t)

	// Create public group
	publicGroup := PublicGroup(app, "/public")
	publicGroup.Get("/info", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"public": true})
	})

	// Test public access without authentication
	req := httptest.NewRequest("GET", "/public/info", nil)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)
}

func TestOptionalAuthGroup(t *testing.T) {
	app, _, jwtService := setupTestAppWithDB(t)

	// Create optional auth group
	optionalGroup := OptionalAuthGroup(app, "/optional", jwtService)
	optionalGroup.Get("/data", func(c *fiber.Ctx) error {
		userID, authenticated := GetUserID(c)
		return c.JSON(fiber.Map{
			"authenticated": authenticated,
			"user_id":       userID,
		})
	})

	// Test without authentication
	req := httptest.NewRequest("GET", "/optional/data", nil)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	// Test with authentication
	token, err := jwtService.GenerateToken(1, "test@example.com", 1)
	assert.NoError(t, err)

	req = httptest.NewRequest("GET", "/optional/data", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	resp, err = app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)
}