package middleware

import (
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/limiter"
)

// APIRateLimit creates a rate limiter for general API endpoints
func APIRateLimit() fiber.Handler {
	return limiter.New(limiter.Config{
		Max:        100,              // 100 requests
		Expiration: 1 * time.Minute,  // per minute
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(429).JSON(fiber.Map{
				"error": "Too many requests, please try again later",
				"code":  "RATE_LIMITED",
			})
		},
	})
}

// AuthRateLimit creates a rate limiter for authentication endpoints
func AuthRateLimit() fiber.Handler {
	return limiter.New(limiter.Config{
		Max:        10,               // 10 attempts
		Expiration: 15 * time.Minute, // per 15 minutes
		KeyGenerator: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(429).JSON(fiber.Map{
				"error": "Too many authentication attempts, please try again later",
				"code":  "AUTH_RATE_LIMITED",
			})
		},
	})
}

// DashboardRateLimit creates a rate limiter for dashboard endpoints
func DashboardRateLimit() fiber.Handler {
	return limiter.New(limiter.Config{
		Max:        30,               // 30 requests
		Expiration: 1 * time.Minute,  // per minute
		KeyGenerator: func(c *fiber.Ctx) string {
			userID := c.Locals("user_id")
			if userID != nil {
				return c.IP() + ":" + string(rune(userID.(uint)))
			}
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(429).JSON(fiber.Map{
				"error": "Too many dashboard requests, please try again later",
				"code":  "DASHBOARD_RATE_LIMITED",
			})
		},
	})
}

// AnalyticsRateLimit creates a rate limiter for analytics endpoints
func AnalyticsRateLimit() fiber.Handler {
	return limiter.New(limiter.Config{
		Max:        20,               // 20 requests
		Expiration: 5 * time.Minute,  // per 5 minutes
		KeyGenerator: func(c *fiber.Ctx) string {
			userID := c.Locals("user_id")
			if userID != nil {
				return c.IP() + ":" + string(rune(userID.(uint)))
			}
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(429).JSON(fiber.Map{
				"error": "Too many analytics requests, please try again later",
				"code":  "ANALYTICS_RATE_LIMITED",
			})
		},
	})
}

// NotificationRateLimit creates a rate limiter for notification endpoints
func NotificationRateLimit() fiber.Handler {
	return limiter.New(limiter.Config{
		Max:        50,               // 50 requests
		Expiration: 1 * time.Minute,  // per minute
		KeyGenerator: func(c *fiber.Ctx) string {
			userID := c.Locals("user_id")
			if userID != nil {
				return c.IP() + ":" + string(rune(userID.(uint)))
			}
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(429).JSON(fiber.Map{
				"error": "Too many notification requests, please try again later",
				"code":  "NOTIFICATION_RATE_LIMITED",
			})
		},
	})
}