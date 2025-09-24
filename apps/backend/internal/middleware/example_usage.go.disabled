package middleware

import (
	"backend-go/internal/services"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// ExampleUsage demonstrates how to use the middleware in a Fiber application
func ExampleUsage(app *fiber.App, db *gorm.DB, jwtService *services.JWTService) {
	// Setup global middleware
	config := MiddlewareConfig{
		JWTService:     jwtService,
		DB:             db,
		Environment:    "development", // or "production"
		AllowedOrigins: []string{"http://localhost:3000", "https://example.com"},
	}
	SetupMiddleware(app, config)

	// Public routes (no authentication required)
	publicAPI := PublicGroup(app, "/api/v1/public")
	publicAPI.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})
	publicAPI.Post("/login", func(c *fiber.Ctx) error {
		// Login handler implementation
		return c.JSON(fiber.Map{"message": "Login endpoint"})
	})

	// Protected routes (authentication required)
	authAPI := AuthGroup(app, "/api/v1", jwtService)
	authAPI.Get("/me", func(c *fiber.Ctx) error {
		userID, _ := GetUserID(c)
		userEmail, _ := GetUserEmail(c)
		return c.JSON(fiber.Map{
			"user_id": userID,
			"email":   userEmail,
		})
	})

	// Admin-only routes
	adminAPI := AdminGroup(app, "/api/v1/admin", jwtService, db)
	adminAPI.Get("/users", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"message": "Admin users endpoint"})
	})
	adminAPI.Delete("/users/:id", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"message": "Delete user endpoint"})
	})

	// Instructor or admin routes
	instructorAPI := InstructorGroup(app, "/api/v1/instructor", jwtService, db)
	instructorAPI.Get("/courses", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"message": "Instructor courses endpoint"})
	})

	// Staff or admin routes
	staffAPI := StaffGroup(app, "/api/v1/staff", jwtService, db)
	staffAPI.Get("/reports", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"message": "Staff reports endpoint"})
	})

	// Student and above routes
	studentAPI := StudentGroup(app, "/api/v1/student", jwtService, db)
	studentAPI.Get("/profile", func(c *fiber.Ctx) error {
		userID, _ := GetUserID(c)
		return c.JSON(fiber.Map{
			"message": "Student profile endpoint",
			"user_id": userID,
		})
	})

	// Optional authentication routes
	optionalAPI := OptionalAuthGroup(app, "/api/v1/optional", jwtService)
	optionalAPI.Get("/data", func(c *fiber.Ctx) error {
		userID, authenticated := GetUserID(c)
		if authenticated {
			return c.JSON(fiber.Map{
				"message":       "Authenticated user data",
				"user_id":       userID,
				"authenticated": true,
			})
		}
		return c.JSON(fiber.Map{
			"message":       "Public data",
			"authenticated": false,
		})
	})

	// Custom middleware usage examples
	app.Get("/api/v1/custom", 
		AuthMiddleware(jwtService),
		RoleBasedAuth(db, "admin", "instructor"),
		func(c *fiber.Ctx) error {
			roleName, _ := GetRoleName(c)
			return c.JSON(fiber.Map{
				"message": "Custom middleware endpoint",
				"role":    roleName,
			})
		},
	)

	// Permission-based route
	app.Get("/api/v1/permissions",
		AuthMiddleware(jwtService),
		PermissionBasedAuth(db, "read_users", "write_users"),
		func(c *fiber.Ctx) error {
			permissions, _ := GetPermissions(c)
			return c.JSON(fiber.Map{
				"message":     "Permission-based endpoint",
				"permissions": permissions,
			})
		},
	)

	// Owner or admin route example
	getUserIDFromResource := func(c *fiber.Ctx) (uint, error) {
		// In a real application, you would extract the user ID from the resource
		// For example, from a database query based on the resource ID
		return 1, nil // Mock implementation
	}

	app.Get("/api/v1/profile/:id",
		AuthMiddleware(jwtService),
		OwnerOrAdmin(db, getUserIDFromResource),
		func(c *fiber.Ctx) error {
			return c.JSON(fiber.Map{
				"message": "Profile endpoint - owner or admin only",
			})
		},
	)
}