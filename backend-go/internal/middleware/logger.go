package middleware

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

// LoggerConfig holds the logger configuration
type LoggerConfig struct {
	Format     string
	TimeFormat string
	TimeZone   string
	Output     *os.File
	Done       func(c *fiber.Ctx, logString []byte)
}

// DefaultLoggerConfig returns a default logger configuration
func DefaultLoggerConfig() LoggerConfig {
	return LoggerConfig{
		Format: "${time} | ${status} | ${latency} | ${ip} | ${method} | ${path} | ${error}\n",
		TimeFormat: "2006-01-02 15:04:05",
		TimeZone:   "Local",
		Output:     os.Stdout,
	}
}

// ProductionLoggerConfig returns a production logger configuration with JSON format
func ProductionLoggerConfig() LoggerConfig {
	return LoggerConfig{
		Format: `{"time":"${time}","status":${status},"latency":"${latency}","ip":"${ip}","method":"${method}","path":"${path}","user_agent":"${ua}","error":"${error}"}` + "\n",
		TimeFormat: time.RFC3339,
		TimeZone:   "UTC",
		Output:     os.Stdout,
	}
}

// Logger creates a request logging middleware
func Logger(config LoggerConfig) fiber.Handler {
	return logger.New(logger.Config{
		Format:     config.Format,
		TimeFormat: config.TimeFormat,
		TimeZone:   config.TimeZone,
		Output:     config.Output,
		Done:       config.Done,
	})
}

// DefaultLogger creates a request logging middleware with default configuration
func DefaultLogger() fiber.Handler {
	return Logger(DefaultLoggerConfig())
}

// ProductionLogger creates a request logging middleware with production configuration
func ProductionLogger() fiber.Handler {
	return Logger(ProductionLoggerConfig())
}

// StructuredLogger creates a structured logging middleware
func StructuredLogger() fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()

		// Process request
		err := c.Next()

		// Calculate latency
		latency := time.Since(start)

		// Get user information if available
		userID, _ := GetUserID(c)
		userEmail, _ := GetUserEmail(c)

		// Create structured log entry
		logEntry := map[string]interface{}{
			"timestamp":    start.Format(time.RFC3339),
			"method":       c.Method(),
			"path":         c.Path(),
			"query":        c.Context().QueryArgs().String(),
			"status":       c.Response().StatusCode(),
			"latency":      latency.String(),
			"latency_ms":   latency.Milliseconds(),
			"ip":           c.IP(),
			"user_agent":   c.Get("User-Agent"),
			"content_type": c.Get("Content-Type"),
			"size":         len(c.Response().Body()),
		}

		// Add user information if authenticated
		if userID > 0 {
			logEntry["user_id"] = userID
			logEntry["user_email"] = userEmail
		}

		// Add error information if present
		if err != nil {
			logEntry["error"] = err.Error()
		}

		// Log based on status code
		if c.Response().StatusCode() >= 500 {
			log.Printf("ERROR: %+v", logEntry)
		} else if c.Response().StatusCode() >= 400 {
			log.Printf("WARN: %+v", logEntry)
		} else {
			log.Printf("INFO: %+v", logEntry)
		}

		return err
	}
}

// RequestIDLogger creates a middleware that adds request ID to logs
func RequestIDLogger() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Generate or get request ID
		requestID := c.Get("X-Request-ID")
		if requestID == "" {
			requestID = generateRequestID()
			c.Set("X-Request-ID", requestID)
		}

		// Store request ID in context
		c.Locals("request_id", requestID)

		start := time.Now()
		err := c.Next()
		latency := time.Since(start)

		// Get user information if available
		userID, _ := GetUserID(c)

		// Log with request ID
		log.Printf("[%s] %s %s - %d - %v - User: %d - IP: %s",
			requestID,
			c.Method(),
			c.Path(),
			c.Response().StatusCode(),
			latency,
			userID,
			c.IP(),
		)

		return err
	}
}

// SecurityLogger creates a middleware that logs security-related events
func SecurityLogger() fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()
		err := c.Next()

		// Log security events
		status := c.Response().StatusCode()
		if status == 401 || status == 403 {
			userID, _ := GetUserID(c)
			log.Printf("SECURITY: %s %s - Status: %d - User: %d - IP: %s - UA: %s - Time: %v",
				c.Method(),
				c.Path(),
				status,
				userID,
				c.IP(),
				c.Get("User-Agent"),
				time.Since(start),
			)
		}

		// Log failed login attempts
		if c.Path() == "/api/v1/login" && c.Method() == "POST" && status != 200 {
			log.Printf("SECURITY: Failed login attempt - IP: %s - UA: %s - Time: %v",
				c.IP(),
				c.Get("User-Agent"),
				time.Since(start),
			)
		}

		return err
	}
}

// generateRequestID generates a simple request ID
func generateRequestID() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}

// GetRequestID extracts the request ID from the context
func GetRequestID(c *fiber.Ctx) (string, bool) {
	requestID, ok := c.Locals("request_id").(string)
	return requestID, ok
}