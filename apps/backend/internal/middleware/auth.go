package middleware

import (
	"strings"

	"backend-go/internal/services"
	"github.com/gofiber/fiber/v2"
)

// AuthMiddleware creates a JWT authentication middleware
func AuthMiddleware(jwtService *services.JWTService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Get the Authorization header
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Authorization header is required",
				"code":  "MISSING_AUTH_HEADER",
			})
		}

		// Check if the header starts with "Bearer "
		if !strings.HasPrefix(authHeader, "Bearer ") {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Authorization header must start with 'Bearer '",
				"code":  "INVALID_AUTH_FORMAT",
			})
		}

		// Extract the token
		token := strings.TrimPrefix(authHeader, "Bearer ")
		if token == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Token is required",
				"code":  "MISSING_TOKEN",
			})
		}

		// Validate the token
		claims, err := jwtService.ValidateToken(token)
		if err != nil {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid or expired token",
				"code":  "INVALID_TOKEN",
			})
		}

		// Store user information in context for use in handlers
		c.Locals("user_id", claims.Claims.UserID)
		c.Locals("user_email", claims.Claims.Email)
		c.Locals("user_type", claims.Claims.UserType)
		c.Locals("claims", claims.Claims)

		return c.Next()
	}
}

// OptionalAuthMiddleware creates a middleware that allows both authenticated and unauthenticated requests
func OptionalAuthMiddleware(jwtService *services.JWTService) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Get the Authorization header
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			// No auth header, continue without authentication
			return c.Next()
		}

		// Check if the header starts with "Bearer "
		if !strings.HasPrefix(authHeader, "Bearer ") {
			// Invalid format, continue without authentication
			return c.Next()
		}

		// Extract the token
		token := strings.TrimPrefix(authHeader, "Bearer ")
		if token == "" {
			// No token, continue without authentication
			return c.Next()
		}

		// Validate the token
		claims, err := jwtService.ValidateToken(token)
		if err != nil {
			// Invalid token, continue without authentication
			return c.Next()
		}

		// Store user information in context for use in handlers
		c.Locals("user_id", claims.Claims.UserID)
		c.Locals("user_email", claims.Claims.Email)
		c.Locals("user_type", claims.Claims.UserType)
		c.Locals("claims", claims.Claims)

		return c.Next()
	}
}

// GetUserID extracts the user ID from the context
func GetUserID(c *fiber.Ctx) (string, bool) {
	userID, ok := c.Locals("user_id").(string)
	return userID, ok
}

// GetUserEmail extracts the user email from the context
func GetUserEmail(c *fiber.Ctx) (string, bool) {
	email, ok := c.Locals("user_email").(string)
	return email, ok
}

// GetUserType extracts the user type from the context
func GetUserType(c *fiber.Ctx) (services.UserType, bool) {
	userType, ok := c.Locals("user_type").(services.UserType)
	return userType, ok
}

// GetClaims extracts the JWT claims from the context
func GetClaims(c *fiber.Ctx) (*services.JWTClaims, bool) {
	claims, ok := c.Locals("claims").(*services.JWTClaims)
	return claims, ok
}

// RequireAuth ensures that the request is authenticated
func RequireAuth() fiber.Handler {
	return func(c *fiber.Ctx) error {
		_, ok := GetUserID(c)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Authentication required",
				"code":  "AUTH_REQUIRED",
			})
		}
		return c.Next()
	}
}