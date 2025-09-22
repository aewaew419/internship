package middleware

import (
	"fmt"
	"strconv"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
)

// RateLimitConfig holds the rate limiting configuration
type RateLimitConfig struct {
	Max        int           // Maximum number of requests
	Expiration time.Duration // Time window for the limit
	KeyFunc    func(*fiber.Ctx) string // Function to generate the key for rate limiting
	LimitReached func(*fiber.Ctx) error // Function to call when limit is reached
	SkipFailedRequest bool // Skip failed requests in rate limiting
	SkipSuccessfulRequest bool // Skip successful requests in rate limiting
}

// RateLimitStore represents the storage interface for rate limiting
type RateLimitStore interface {
	Get(key string) (int, time.Time, bool)
	Set(key string, count int, expiration time.Time)
	Delete(key string)
}

// InMemoryStore implements RateLimitStore using in-memory storage
type InMemoryStore struct {
	data map[string]*rateLimitEntry
	mu   sync.RWMutex
}

type rateLimitEntry struct {
	count      int
	expiration time.Time
}

// NewInMemoryStore creates a new in-memory rate limit store
func NewInMemoryStore() *InMemoryStore {
	store := &InMemoryStore{
		data: make(map[string]*rateLimitEntry),
	}
	
	// Start cleanup goroutine
	go store.cleanup()
	
	return store
}

// Get retrieves the current count and expiration for a key
func (s *InMemoryStore) Get(key string) (int, time.Time, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	entry, exists := s.data[key]
	if !exists {
		return 0, time.Time{}, false
	}
	
	// Check if expired
	if time.Now().After(entry.expiration) {
		return 0, time.Time{}, false
	}
	
	return entry.count, entry.expiration, true
}

// Set stores the count and expiration for a key
func (s *InMemoryStore) Set(key string, count int, expiration time.Time) {
	s.mu.Lock()
	defer s.mu.Unlock()
	
	s.data[key] = &rateLimitEntry{
		count:      count,
		expiration: expiration,
	}
}

// Delete removes a key from the store
func (s *InMemoryStore) Delete(key string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	
	delete(s.data, key)
}

// cleanup removes expired entries
func (s *InMemoryStore) cleanup() {
	ticker := time.NewTicker(time.Minute)
	defer ticker.Stop()
	
	for range ticker.C {
		s.mu.Lock()
		now := time.Now()
		for key, entry := range s.data {
			if now.After(entry.expiration) {
				delete(s.data, key)
			}
		}
		s.mu.Unlock()
	}
}

// DefaultRateLimitConfig returns a default rate limit configuration
func DefaultRateLimitConfig() RateLimitConfig {
	return RateLimitConfig{
		Max:        100,
		Expiration: time.Minute,
		KeyFunc: func(c *fiber.Ctx) string {
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error":   "Too Many Requests",
				"message": "Rate limit exceeded. Please try again later.",
			})
		},
		SkipFailedRequest:     false,
		SkipSuccessfulRequest: false,
	}
}

// RateLimit creates a rate limiting middleware
func RateLimit(config RateLimitConfig, store RateLimitStore) fiber.Handler {
	// Set defaults if not provided
	if config.Max <= 0 {
		config.Max = 100
	}
	if config.Expiration <= 0 {
		config.Expiration = time.Minute
	}
	if config.KeyFunc == nil {
		config.KeyFunc = func(c *fiber.Ctx) string {
			return c.IP()
		}
	}
	if config.LimitReached == nil {
		config.LimitReached = func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"error": "Too Many Requests",
			})
		}
	}
	if store == nil {
		store = NewInMemoryStore()
	}

	return func(c *fiber.Ctx) error {
		key := config.KeyFunc(c)
		
		// Get current count
		count, expiration, exists := store.Get(key)
		
		// If not exists or expired, start new window
		if !exists {
			expiration = time.Now().Add(config.Expiration)
			count = 0
		}
		
		// Check if limit exceeded
		if count >= config.Max {
			// Set rate limit headers
			c.Set("X-RateLimit-Limit", strconv.Itoa(config.Max))
			c.Set("X-RateLimit-Remaining", "0")
			c.Set("X-RateLimit-Reset", strconv.FormatInt(expiration.Unix(), 10))
			
			return config.LimitReached(c)
		}
		
		// Increment count
		count++
		store.Set(key, count, expiration)
		
		// Set rate limit headers
		c.Set("X-RateLimit-Limit", strconv.Itoa(config.Max))
		c.Set("X-RateLimit-Remaining", strconv.Itoa(config.Max-count))
		c.Set("X-RateLimit-Reset", strconv.FormatInt(expiration.Unix(), 10))
		
		// Continue to next handler
		err := c.Next()
		
		// Handle skip options
		if config.SkipFailedRequest && c.Response().StatusCode() >= 400 {
			// Decrement count for failed requests
			if count > 0 {
				store.Set(key, count-1, expiration)
			}
		}
		
		if config.SkipSuccessfulRequest && c.Response().StatusCode() < 400 {
			// Decrement count for successful requests
			if count > 0 {
				store.Set(key, count-1, expiration)
			}
		}
		
		return err
	}
}

// APIRateLimit creates a rate limit middleware for API endpoints
func APIRateLimit(requestsPerMinute int) fiber.Handler {
	config := RateLimitConfig{
		Max:        requestsPerMinute,
		Expiration: time.Minute,
		KeyFunc: func(c *fiber.Ctx) string {
			// Use IP + User-Agent for better identification
			return fmt.Sprintf("%s:%s", c.IP(), c.Get("User-Agent"))
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"success": false,
				"error":   "Rate limit exceeded",
				"message": fmt.Sprintf("Maximum %d requests per minute allowed", requestsPerMinute),
				"retryAfter": 60,
			})
		},
	}
	
	return RateLimit(config, NewInMemoryStore())
}

// AuthRateLimit creates a rate limit middleware for authentication endpoints
func AuthRateLimit() fiber.Handler {
	config := RateLimitConfig{
		Max:        5, // 5 attempts per 15 minutes
		Expiration: 15 * time.Minute,
		KeyFunc: func(c *fiber.Ctx) string {
			// Use IP for auth rate limiting
			return fmt.Sprintf("auth:%s", c.IP())
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"success": false,
				"error":   "Too many authentication attempts",
				"message": "Please wait 15 minutes before trying again",
				"retryAfter": 900, // 15 minutes
			})
		},
		SkipSuccessfulRequest: true, // Don't count successful auth attempts
	}
	
	return RateLimit(config, NewInMemoryStore())
}

// UploadRateLimit creates a rate limit middleware for file upload endpoints
func UploadRateLimit() fiber.Handler {
	config := RateLimitConfig{
		Max:        10, // 10 uploads per hour
		Expiration: time.Hour,
		KeyFunc: func(c *fiber.Ctx) string {
			// Use user ID if available, otherwise IP
			userID := c.Locals("userID")
			if userID != nil {
				return fmt.Sprintf("upload:user:%v", userID)
			}
			return fmt.Sprintf("upload:ip:%s", c.IP())
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"success": false,
				"error":   "Upload limit exceeded",
				"message": "Maximum 10 uploads per hour allowed",
				"retryAfter": 3600, // 1 hour
			})
		},
	}
	
	return RateLimit(config, NewInMemoryStore())
}

// NotificationRateLimit creates a rate limit middleware for notification endpoints
func NotificationRateLimit() fiber.Handler {
	config := RateLimitConfig{
		Max:        20, // 20 notifications per hour
		Expiration: time.Hour,
		KeyFunc: func(c *fiber.Ctx) string {
			userID := c.Locals("userID")
			if userID != nil {
				return fmt.Sprintf("notification:user:%v", userID)
			}
			return fmt.Sprintf("notification:ip:%s", c.IP())
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"success": false,
				"error":   "Notification limit exceeded",
				"message": "Maximum 20 notifications per hour allowed",
				"retryAfter": 3600,
			})
		},
	}
	
	return RateLimit(config, NewInMemoryStore())
}