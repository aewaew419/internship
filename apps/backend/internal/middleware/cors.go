package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

// CORSConfig holds the CORS configuration
type CORSConfig struct {
	AllowOrigins     []string
	AllowMethods     []string
	AllowHeaders     []string
	AllowCredentials bool
	ExposeHeaders    []string
	MaxAge           int
}

// DefaultCORSConfig returns a default CORS configuration
func DefaultCORSConfig() CORSConfig {
	return CORSConfig{
		AllowOrigins: []string{
			"http://localhost:3000",
			"http://localhost:5173",
			"http://localhost:8080",
			"https://localhost:3000",
			"https://localhost:5173",
			"https://localhost:8080",
		},
		AllowMethods: []string{
			"GET",
			"POST",
			"PUT",
			"PATCH",
			"DELETE",
			"OPTIONS",
			"HEAD",
		},
		AllowHeaders: []string{
			"Origin",
			"Content-Type",
			"Accept",
			"Authorization",
			"X-Requested-With",
			"X-CSRF-Token",
			"X-API-Key",
		},
		AllowCredentials: true,
		ExposeHeaders: []string{
			"Content-Length",
			"Content-Type",
			"X-Total-Count",
			"X-Page",
			"X-Per-Page",
		},
		MaxAge: 86400, // 24 hours
	}
}

// ProductionCORSConfig returns a production-ready CORS configuration
func ProductionCORSConfig(allowedOrigins []string) CORSConfig {
	config := DefaultCORSConfig()
	if len(allowedOrigins) > 0 {
		config.AllowOrigins = allowedOrigins
	}
	return config
}

// CORS creates a CORS middleware with the given configuration
func CORS(config CORSConfig) fiber.Handler {
	return cors.New(cors.Config{
		AllowOrigins:     strings.Join(config.AllowOrigins, ","),
		AllowMethods:     strings.Join(config.AllowMethods, ","),
		AllowHeaders:     strings.Join(config.AllowHeaders, ","),
		AllowCredentials: config.AllowCredentials,
		ExposeHeaders:    strings.Join(config.ExposeHeaders, ","),
		MaxAge:           config.MaxAge,
	})
}

// DefaultCORS creates a CORS middleware with default configuration
func DefaultCORS() fiber.Handler {
	return CORS(DefaultCORSConfig())
}

// ProductionCORS creates a CORS middleware with production configuration
func ProductionCORS(allowedOrigins []string) fiber.Handler {
	return CORS(ProductionCORSConfig(allowedOrigins))
}

// DevelopmentCORS creates a permissive CORS middleware for development
func DevelopmentCORS() fiber.Handler {
	return cors.New(cors.Config{
		AllowOrigins:     "*",
		AllowMethods:     "GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD",
		AllowHeaders:     "*",
		AllowCredentials: false,
		MaxAge:           86400,
	})
}

// CustomCORS creates a CORS middleware with custom origin validation
func CustomCORS(allowOriginFunc func(origin string) bool) fiber.Handler {
	return func(c *fiber.Ctx) error {
		origin := c.Get("Origin")
		
		// Handle preflight requests
		if c.Method() == "OPTIONS" {
			if origin != "" && allowOriginFunc(origin) {
				c.Set("Access-Control-Allow-Origin", origin)
				c.Set("Access-Control-Allow-Credentials", "true")
				c.Set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD")
				c.Set("Access-Control-Allow-Headers", "Origin,Content-Type,Accept,Authorization,X-Requested-With,X-CSRF-Token,X-API-Key")
				c.Set("Access-Control-Max-Age", "86400")
			}
			return c.SendStatus(fiber.StatusNoContent)
		}

		// Handle actual requests
		if origin != "" && allowOriginFunc(origin) {
			c.Set("Access-Control-Allow-Origin", origin)
			c.Set("Access-Control-Allow-Credentials", "true")
			c.Set("Access-Control-Expose-Headers", "Content-Length,Content-Type,X-Total-Count,X-Page,X-Per-Page")
		}

		return c.Next()
	}
}