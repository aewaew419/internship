package routes

import (
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func Setup(app *fiber.App, db *gorm.DB) {
	// API v1 routes
	api := app.Group("/api/v1")

	// Basic test endpoint
	api.Get("/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "API is working",
			"version": "1.0.0",
		})
	})

	// TODO: Add more route groups as they are implemented
	// setupAuthRoutes(api, db)
	// setupUserRoutes(api, db)
	// setupStudentRoutes(api, db)
	// etc.
}