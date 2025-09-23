package middleware

import (
	"backend-go/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/recover"
	"gorm.io/gorm"
)

// MiddlewareConfig holds all middleware configuration
type MiddlewareConfig struct {
	JWTService     *services.JWTService
	DB             *gorm.DB
	Environment    string
	AllowedOrigins []string
	Logger         *services.Logger
}

// SetupMiddleware configures all middleware for the Fiber app
func SetupMiddleware(app *fiber.App, config MiddlewareConfig) {
	// Recovery middleware - should be first
	app.Use(recover.New(recover.Config{
		EnableStackTrace: config.Environment == "development",
	}))

	// Request ID middleware
	app.Use(RequestIDLogger())

	// CORS middleware
	if config.Environment == "production" {
		app.Use(ProductionCORS(config.AllowedOrigins))
	} else {
		app.Use(DefaultCORS())
	}

	// Logging middleware
	if config.Environment == "production" {
		app.Use(ProductionLogger())
	} else {
		app.Use(DefaultLogger())
	}

	// Structured logging for important events
	if config.Logger != nil {
		app.Use(StructuredLogger(config.Logger))
		app.Use(SecurityLogger(config.Logger))
		app.Use(MetricsLogger(config.Logger))
		app.Use(ErrorLogger(config.Logger))
	}
}

// AuthGroup creates a route group with authentication middleware
func AuthGroup(app *fiber.App, prefix string, jwtService *services.JWTService) fiber.Router {
	return app.Group(prefix, AuthMiddleware(jwtService))
}

// AdminGroup creates a route group with admin-only access
func AdminGroup(app *fiber.App, prefix string, jwtService *services.JWTService, db *gorm.DB) fiber.Router {
	return app.Group(prefix, 
		AuthMiddleware(jwtService),
		AdminOnly(db),
	)
}

// InstructorGroup creates a route group with instructor or admin access
func InstructorGroup(app *fiber.App, prefix string, jwtService *services.JWTService, db *gorm.DB) fiber.Router {
	return app.Group(prefix,
		AuthMiddleware(jwtService),
		InstructorOrAdmin(db),
	)
}

// StaffGroup creates a route group with staff or admin access
func StaffGroup(app *fiber.App, prefix string, jwtService *services.JWTService, db *gorm.DB) fiber.Router {
	return app.Group(prefix,
		AuthMiddleware(jwtService),
		StaffOrAdmin(db),
	)
}

// StudentGroup creates a route group with student or above access
func StudentGroup(app *fiber.App, prefix string, jwtService *services.JWTService, db *gorm.DB) fiber.Router {
	return app.Group(prefix,
		AuthMiddleware(jwtService),
		StudentOrAbove(db),
	)
}

// PublicGroup creates a route group without authentication
func PublicGroup(app *fiber.App, prefix string) fiber.Router {
	return app.Group(prefix)
}

// OptionalAuthGroup creates a route group with optional authentication
func OptionalAuthGroup(app *fiber.App, prefix string, jwtService *services.JWTService) fiber.Router {
	return app.Group(prefix, OptionalAuthMiddleware(jwtService))
}