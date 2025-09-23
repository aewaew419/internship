package main

import (
	"log"

	"backend-go/internal/config"
	"backend-go/internal/database"
	"backend-go/internal/routes"
	"backend-go/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Load configuration
	cfg := config.Load()

	// Initialize structured logging
	var loggerConfig services.LoggerConfig
	if cfg.Environment == "production" {
		loggerConfig = services.LoggerConfig{
			Level:        services.INFO,
			ServiceName:  "backend-go",
			EnableCaller: false,
		}
	} else {
		loggerConfig = services.LoggerConfig{
			Level:        services.DEBUG,
			ServiceName:  "backend-go",
			EnableCaller: true,
		}
	}
	
	services.InitGlobalLogger(loggerConfig)
	logger := services.GetGlobalLogger()

	logger.Info("Starting application", map[string]interface{}{
		"environment": cfg.Environment,
		"port":        cfg.Port,
	})

	// Initialize database
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		logger.Fatal("Failed to connect to database", map[string]interface{}{
			"error": err.Error(),
		})
	}

	logger.Info("Database connected successfully")

	// Create Fiber app with enhanced error handling
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			message := "Internal Server Error"
			
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
				message = e.Message
			}

			// Log the error
			contextLogger := logger.WithRequestContext(c)
			contextLogger.Error("Request error", map[string]interface{}{
				"error":       err.Error(),
				"status_code": code,
			})

			return c.Status(code).JSON(fiber.Map{
				"error":   message,
				"code":    code,
				"request_id": c.Get("X-Request-ID"),
			})
		},
	})

	// CORS middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins: cfg.AllowedOrigins,
		AllowHeaders: "Origin, Content-Type, Accept, Authorization, X-Request-ID",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS, HEAD",
	}))

	// Basic health check endpoint (for load balancers)
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"message": "Server is running",
		})
	})

	// Setup all routes with middleware
	routes.Setup(app, db, cfg)

	// Start server
	port := cfg.Port
	if port == "" {
		port = "8080"
	}

	logger.Info("Server starting", map[string]interface{}{
		"port":        port,
		"environment": cfg.Environment,
	})

	if err := app.Listen(":" + port); err != nil {
		logger.Fatal("Failed to start server", map[string]interface{}{
			"error": err.Error(),
			"port":  port,
		})
	}
}