package routes

import (
	"backend-go/internal/config"
	"backend-go/internal/handlers"
	"backend-go/internal/middleware"
	"backend-go/internal/services"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func Setup(app *fiber.App, db *gorm.DB, cfg *config.Config) {
	// API v1 routes
	api := app.Group("/api/v1")

	// Basic test endpoint
	api.Get("/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "API is working",
			"version": "1.0.0",
		})
	})

	// Setup authentication routes
	setupAuthRoutes(api, db, cfg)

	// Setup user management routes
	setupUserRoutes(api, db, cfg)

	// TODO: Add more route groups as they are implemented
	// setupStudentRoutes(api, db, cfg)
	// etc.
}

// setupAuthRoutes sets up authentication-related routes
func setupAuthRoutes(api fiber.Router, db *gorm.DB, cfg *config.Config) {
	// Initialize services
	jwtService := services.NewJWTService(cfg.JWTSecret)
	authService := services.NewAuthService(db, jwtService)
	authHandler := handlers.NewAuthHandler(authService)

	// Public authentication routes (no auth required)
	api.Post("/login", authHandler.Login)
	api.Post("/register", authHandler.Register)
	api.Post("/refresh-token", authHandler.RefreshToken)
	api.Post("/request-password-reset", authHandler.RequestPasswordReset)
	api.Post("/reset-password", authHandler.ResetPassword)

	// Protected authentication routes (auth required)
	authMiddleware := middleware.AuthMiddleware(jwtService)
	api.Get("/me", authMiddleware, authHandler.Me)
	api.Post("/change-password", authMiddleware, authHandler.ChangePassword)
	api.Post("/logout", authMiddleware, authHandler.Logout)
}

// setupUserRoutes sets up user management routes
func setupUserRoutes(api fiber.Router, db *gorm.DB, cfg *config.Config) {
	// Initialize services
	jwtService := services.NewJWTService(cfg.JWTSecret)
	userService := services.NewUserService(db)
	userHandler := handlers.NewUserHandler(userService)

	// Authentication middleware
	authMiddleware := middleware.AuthMiddleware(jwtService)

	// User management routes (all require authentication)
	users := api.Group("/users", authMiddleware)
	
	// Basic CRUD operations
	users.Get("/", userHandler.GetUsers)           // GET /api/v1/users
	users.Get("/stats", userHandler.GetUserStats)  // GET /api/v1/users/stats
	users.Get("/:id", userHandler.GetUser)         // GET /api/v1/users/:id
	users.Post("/", userHandler.CreateUser)        // POST /api/v1/users
	users.Put("/:id", userHandler.UpdateUser)      // PUT /api/v1/users/:id
	users.Delete("/:id", userHandler.DeleteUser)   // DELETE /api/v1/users/:id
	
	// Bulk operations
	users.Delete("/bulk", userHandler.BulkDeleteUsers)        // DELETE /api/v1/users/bulk
	users.Post("/bulk-excel", userHandler.BulkCreateFromExcel) // POST /api/v1/users/bulk-excel
}