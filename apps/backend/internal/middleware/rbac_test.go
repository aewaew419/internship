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

func setupTestDB(t *testing.T) *gorm.DB {
	// Skip tests that require database if CGO is disabled
	if testing.Short() {
		t.Skip("Skipping database tests in short mode")
	}

	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	if err != nil {
		t.Skip("Skipping database tests - SQLite not available")
		return nil
	}

	// Auto migrate tables
	err = db.AutoMigrate(&models.Role{}, &models.Permission{}, &models.RolePermission{})
	if err != nil {
		t.Skip("Skipping database tests - migration failed")
		return nil
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

	// Create test permissions
	permissions := []models.Permission{
		{ID: 1, Name: "read_users"},
		{ID: 2, Name: "write_users"},
		{ID: 3, Name: "delete_users"},
	}

	for _, permission := range permissions {
		db.Create(&permission)
	}

	// Assign permissions to admin role
	adminRole := roles[0]
	db.Model(&adminRole).Association("Permissions").Append(permissions)

	return db
}

func TestRoleBasedAuth(t *testing.T) {
	db := setupTestDB(t)
	jwtService := services.NewJWTService("test-secret-key")
	app := fiber.New()

	// Create protected routes
	app.Use("/admin", AuthMiddleware(jwtService), RoleBasedAuth(db, "admin"))
	app.Get("/admin/test", func(c *fiber.Ctx) error {
		roleName, _ := GetRoleName(c)
		return c.JSON(fiber.Map{"role": roleName})
	})

	app.Use("/instructor", AuthMiddleware(jwtService), RoleBasedAuth(db, "instructor", "admin"))
	app.Get("/instructor/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"success": true})
	})

	tests := []struct {
		name           string
		roleID         uint
		path           string
		expectedStatus int
	}{
		{
			name:           "Admin accessing admin route",
			roleID:         1, // admin
			path:           "/admin/test",
			expectedStatus: 200,
		},
		{
			name:           "Student accessing admin route",
			roleID:         3, // student
			path:           "/admin/test",
			expectedStatus: 403,
		},
		{
			name:           "Admin accessing instructor route",
			roleID:         1, // admin
			path:           "/instructor/test",
			expectedStatus: 200,
		},
		{
			name:           "Instructor accessing instructor route",
			roleID:         2, // instructor
			path:           "/instructor/test",
			expectedStatus: 200,
		},
		{
			name:           "Student accessing instructor route",
			roleID:         3, // student
			path:           "/instructor/test",
			expectedStatus: 403,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			token, err := jwtService.GenerateToken(1, "test@example.com", tt.roleID)
			assert.NoError(t, err)

			req := httptest.NewRequest("GET", tt.path, nil)
			req.Header.Set("Authorization", "Bearer "+token)

			resp, err := app.Test(req)
			assert.NoError(t, err)
			assert.Equal(t, tt.expectedStatus, resp.StatusCode)
		})
	}
}

func TestPermissionBasedAuth(t *testing.T) {
	db := setupTestDB(t)
	jwtService := services.NewJWTService("test-secret-key")
	app := fiber.New()

	// Create protected route with permission requirement
	app.Use("/users", AuthMiddleware(jwtService), PermissionBasedAuth(db, "read_users"))
	app.Get("/users/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"success": true})
	})

	tests := []struct {
		name           string
		roleID         uint
		expectedStatus int
	}{
		{
			name:           "Admin with read_users permission",
			roleID:         1, // admin (has permissions)
			expectedStatus: 200,
		},
		{
			name:           "Student without read_users permission",
			roleID:         3, // student (no permissions)
			expectedStatus: 403,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			token, err := jwtService.GenerateToken(1, "test@example.com", tt.roleID)
			assert.NoError(t, err)

			req := httptest.NewRequest("GET", "/users/test", nil)
			req.Header.Set("Authorization", "Bearer "+token)

			resp, err := app.Test(req)
			assert.NoError(t, err)
			assert.Equal(t, tt.expectedStatus, resp.StatusCode)
		})
	}
}

func TestAdminOnly(t *testing.T) {
	db := setupTestDB(t)
	jwtService := services.NewJWTService("test-secret-key")
	app := fiber.New()

	app.Use("/admin-only", AuthMiddleware(jwtService), AdminOnly(db))
	app.Get("/admin-only/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"success": true})
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

			req := httptest.NewRequest("GET", "/admin-only/test", nil)
			req.Header.Set("Authorization", "Bearer "+token)

			resp, err := app.Test(req)
			assert.NoError(t, err)
			assert.Equal(t, tt.expectedStatus, resp.StatusCode)
		})
	}
}

func TestOwnerOrAdmin(t *testing.T) {
	db := setupTestDB(t)
	jwtService := services.NewJWTService("test-secret-key")
	app := fiber.New()

	// Mock function to get user ID from resource
	getUserIDFromResource := func(c *fiber.Ctx) (uint, error) {
		// For testing, assume the resource belongs to user ID 1
		return 1, nil
	}

	app.Use("/profile/:id", AuthMiddleware(jwtService), OwnerOrAdmin(db, getUserIDFromResource))
	app.Get("/profile/:id", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"success": true})
	})

	tests := []struct {
		name           string
		userID         uint
		roleID         uint
		expectedStatus int
	}{
		{
			name:           "Owner accessing own resource",
			userID:         1, // same as resource owner
			roleID:         3, // student
			expectedStatus: 200,
		},
		{
			name:           "Admin accessing any resource",
			userID:         2, // different user
			roleID:         1, // admin
			expectedStatus: 200,
		},
		{
			name:           "Non-owner non-admin accessing resource",
			userID:         2, // different user
			roleID:         3, // student
			expectedStatus: 403,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			token, err := jwtService.GenerateToken(tt.userID, "test@example.com", tt.roleID)
			assert.NoError(t, err)

			req := httptest.NewRequest("GET", "/profile/1", nil)
			req.Header.Set("Authorization", "Bearer "+token)

			resp, err := app.Test(req)
			assert.NoError(t, err)
			assert.Equal(t, tt.expectedStatus, resp.StatusCode)
		})
	}
}

func TestGetRoleHelpers(t *testing.T) {
	app := fiber.New()

	app.Get("/test", func(c *fiber.Ctx) error {
		// Set test values in context
		c.Locals("role_name", "admin")
		c.Locals("permissions", map[string]bool{
			"read_users":  true,
			"write_users": true,
		})

		// Test helper functions
		roleName, ok := GetRoleName(c)
		assert.True(t, ok)
		assert.Equal(t, "admin", roleName)

		permissions, ok := GetPermissions(c)
		assert.True(t, ok)
		assert.True(t, permissions["read_users"])
		assert.True(t, permissions["write_users"])
		assert.False(t, permissions["delete_users"])

		// Test HasPermission
		assert.True(t, HasPermission(c, "read_users"))
		assert.False(t, HasPermission(c, "delete_users"))

		return c.JSON(fiber.Map{"success": true})
	})

	req := httptest.NewRequest("GET", "/test", nil)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)
}