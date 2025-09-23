package middleware

import (
	"backend-go/internal/services"
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

// StructuredLogger creates a structured logging middleware using the logging service
func StructuredLogger(logger *services.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()

		// Generate request ID if not present
		requestID := c.Get("X-Request-ID")
		if requestID == "" {
			requestID = generateRequestID()
			c.Set("X-Request-ID", requestID)
		}
		c.Locals("request_id", requestID)

		// Get user information if available
		userID, _ := GetUserID(c)
		userEmail, _ := GetUserEmail(c)
		
		// Store user info in context for logger
		if userID > 0 {
			c.Locals("user_id", userID)
			c.Locals("user_email", userEmail)
		}

		// Process request
		err := c.Next()

		// Calculate latency
		latency := time.Since(start)

		// Create context logger and log the request
		contextLogger := logger.WithRequestContext(c)
		contextLogger.LogRequest(c.Response().StatusCode(), latency, err)

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
func SecurityLogger(logger *services.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()
		err := c.Next()

		status := c.Response().StatusCode()
		contextLogger := logger.WithRequestContext(c)

		// Log authentication/authorization failures
		if status == 401 || status == 403 {
			event := "authentication_failure"
			if status == 403 {
				event = "authorization_failure"
			}
			
			contextLogger.LogSecurity(event, map[string]interface{}{
				"status_code": status,
				"latency":     time.Since(start).String(),
			})
		}

		// Log failed login attempts
		if c.Path() == "/api/v1/login" && c.Method() == "POST" && status != 200 {
			contextLogger.LogSecurity("failed_login_attempt", map[string]interface{}{
				"status_code": status,
				"latency":     time.Since(start).String(),
			})
		}

		// Log suspicious activity patterns
		if status == 429 { // Rate limit exceeded
			contextLogger.LogSecurity("rate_limit_exceeded", map[string]interface{}{
				"status_code": status,
			})
		}

		return err
	}
}

// MetricsLogger creates a middleware that logs performance metrics
func MetricsLogger(logger *services.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()
		
		// Process request
		err := c.Next()
		
		latency := time.Since(start)
		
		// Log slow requests (> 1 second)
		if latency > time.Second {
			contextLogger := logger.WithRequestContext(c)
			contextLogger.Warn("Slow request detected", map[string]interface{}{
				"latency_ms":   latency.Milliseconds(),
				"status_code":  c.Response().StatusCode(),
				"response_size": len(c.Response().Body()),
			})
		}
		
		// Log large responses (> 1MB)
		responseSize := len(c.Response().Body())
		if responseSize > 1024*1024 {
			contextLogger := logger.WithRequestContext(c)
			contextLogger.Warn("Large response detected", map[string]interface{}{
				"response_size": responseSize,
				"latency_ms":    latency.Milliseconds(),
			})
		}
		
		return err
	}
}

// ErrorLogger creates a middleware that logs application errors
func ErrorLogger(logger *services.Logger) fiber.Handler {
	return func(c *fiber.Ctx) error {
		err := c.Next()
		
		if err != nil {
			contextLogger := logger.WithRequestContext(c)
			
			// Determine error severity
			statusCode := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				statusCode = e.Code
			}
			
			fields := map[string]interface{}{
				"error_type":  fmt.Sprintf("%T", err),
				"status_code": statusCode,
			}
			
			if statusCode >= 500 {
				contextLogger.Error("Application error", fields)
			} else if statusCode >= 400 {
				contextLogger.Warn("Client error", fields)
			}
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