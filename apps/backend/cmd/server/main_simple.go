package main

import (
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
	// Create Fiber app
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			message := "Internal Server Error"
			
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
				message = e.Message
			}

			return c.Status(code).JSON(fiber.Map{
				"error": message,
				"code":  code,
			})
		},
	})

	// CORS middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:3000,http://localhost:5173",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization, X-Request-ID",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS, HEAD",
	}))

	// Basic health check endpoint
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"message": "Go Fiber Backend is running",
			"version": "1.0.0",
		})
	})

	// API v1 routes
	api := app.Group("/api/v1")

	// Test endpoint
	api.Get("/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "API is working",
			"version": "1.0.0",
			"backend": "Go Fiber",
		})
	})

	// Mock auth endpoints
	api.Post("/login", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "Login endpoint - Go backend",
			"status":  "success",
		})
	})

	api.Post("/register", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "Register endpoint - Go backend",
			"status":  "success",
		})
	})

	// Mock user endpoints
	api.Get("/users", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "Users endpoint - Go backend",
			"users":   []interface{}{},
		})
	})

	// Start server
	port := "8080"
	log.Printf("🚀 Go Fiber server starting on port %s", port)
	log.Printf("🌐 Health check: http://localhost:%s/health", port)
	log.Printf("🔗 API test: http://localhost:%s/api/v1/test", port)

	if err := app.Listen(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}