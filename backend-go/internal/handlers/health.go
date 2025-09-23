package handlers

import (
	"backend-go/internal/config"
	"fmt"
	"runtime"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// HealthHandler handles health check endpoints
type HealthHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

// NewHealthHandler creates a new health handler
func NewHealthHandler(db *gorm.DB, cfg *config.Config) *HealthHandler {
	return &HealthHandler{
		db:  db,
		cfg: cfg,
	}
}

// HealthResponse represents the health check response
type HealthResponse struct {
	Status      string                 `json:"status"`
	Timestamp   string                 `json:"timestamp"`
	Uptime      float64                `json:"uptime"`
	Version     string                 `json:"version"`
	Environment string                 `json:"environment"`
	Checks      map[string]string      `json:"checks"`
	Metrics     map[string]interface{} `json:"metrics"`
	Services    map[string]interface{} `json:"services,omitempty"`
}

// DatabaseHealth represents database health information
type DatabaseHealth struct {
	Status       string  `json:"status"`
	ResponseTime int64   `json:"responseTime"`
	Connections  *DBConnections `json:"connections,omitempty"`
	Error        string  `json:"error,omitempty"`
}

// DBConnections represents database connection pool information
type DBConnections struct {
	Open     int `json:"open"`
	InUse    int `json:"inUse"`
	Idle     int `json:"idle"`
	MaxOpen  int `json:"maxOpen"`
	MaxIdle  int `json:"maxIdle"`
}

// MemoryMetrics represents memory usage information
type MemoryMetrics struct {
	Status     string  `json:"status"`
	Alloc      uint64  `json:"alloc"`      // bytes allocated and still in use
	TotalAlloc uint64  `json:"totalAlloc"` // bytes allocated (even if freed)
	Sys        uint64  `json:"sys"`        // bytes obtained from system
	NumGC      uint32  `json:"numGC"`      // number of garbage collections
	Percentage float64 `json:"percentage"`
}

var startTime = time.Now()

// Health handles basic health check
// GET /api/v1/health
func (h *HealthHandler) Health(c *fiber.Ctx) error {
	requestStart := time.Now()
	
	// Check database
	dbHealth := h.checkDatabase()
	
	// Get system metrics
	memMetrics := h.getMemoryMetrics()
	
	// Calculate response time
	responseTime := time.Since(requestStart).Milliseconds()
	
	// Determine overall status
	status := "healthy"
	if dbHealth.Status != "healthy" || memMetrics.Status != "healthy" {
		status = "unhealthy"
	}
	
	response := HealthResponse{
		Status:      status,
		Timestamp:   time.Now().UTC().Format(time.RFC3339),
		Uptime:      time.Since(startTime).Seconds(),
		Version:     "1.0.0", // TODO: Get from build info
		Environment: h.cfg.Environment,
		Checks: map[string]string{
			"database": dbHealth.Status,
			"memory":   memMetrics.Status,
		},
		Metrics: map[string]interface{}{
			"responseTime": responseTime,
			"memory":       memMetrics,
			"database": map[string]interface{}{
				"responseTime": dbHealth.ResponseTime,
			},
		},
		Services: map[string]interface{}{
			"database": map[string]interface{}{
				"status":       dbHealth.Status,
				"responseTime": dbHealth.ResponseTime,
				"connections":  dbHealth.Connections,
			},
		},
	}
	
	// Set appropriate status code
	statusCode := fiber.StatusOK
	if status != "healthy" {
		statusCode = fiber.StatusServiceUnavailable
	}
	
	// Set cache headers
	c.Set("Cache-Control", "no-cache, no-store, must-revalidate")
	c.Set("Pragma", "no-cache")
	c.Set("Expires", "0")
	c.Set("X-Response-Time", fmt.Sprintf("%dms", responseTime))
	
	return c.Status(statusCode).JSON(response)
}

// HealthHead handles HEAD requests for health check (for load balancers)
// HEAD /api/v1/health
func (h *HealthHandler) HealthHead(c *fiber.Ctx) error {
	// Quick database ping
	if err := h.quickDBPing(); err != nil {
		c.Set("Cache-Control", "no-cache, no-store, must-revalidate")
		return c.SendStatus(fiber.StatusServiceUnavailable)
	}
	
	c.Set("Cache-Control", "no-cache, no-store, must-revalidate")
	c.Set("Pragma", "no-cache")
	c.Set("Expires", "0")
	
	return c.SendStatus(fiber.StatusOK)
}

// HealthDetailed handles detailed health check
// GET /api/v1/health/detailed
func (h *HealthHandler) HealthDetailed(c *fiber.Ctx) error {
	requestStart := time.Now()
	
	// Comprehensive checks
	dbHealth := h.checkDatabase()
	memMetrics := h.getMemoryMetrics()
	diskHealth := h.checkDiskSpace()
	externalServices := h.checkExternalServices()
	
	// Calculate response time
	responseTime := time.Since(requestStart).Milliseconds()
	
	// Determine overall status
	status := "healthy"
	if dbHealth.Status != "healthy" || memMetrics.Status != "healthy" || 
	   diskHealth["status"] != "healthy" {
		status = "unhealthy"
	}
	
	response := HealthResponse{
		Status:      status,
		Timestamp:   time.Now().UTC().Format(time.RFC3339),
		Uptime:      time.Since(startTime).Seconds(),
		Version:     "1.0.0",
		Environment: h.cfg.Environment,
		Checks: map[string]string{
			"database":         dbHealth.Status,
			"memory":          memMetrics.Status,
			"disk":            diskHealth["status"].(string),
			"externalServices": externalServices["status"].(string),
		},
		Metrics: map[string]interface{}{
			"responseTime": responseTime,
			"memory":       memMetrics,
			"database": map[string]interface{}{
				"responseTime": dbHealth.ResponseTime,
			},
			"disk": diskHealth["metrics"],
		},
		Services: map[string]interface{}{
			"database": map[string]interface{}{
				"status":       dbHealth.Status,
				"responseTime": dbHealth.ResponseTime,
				"connections":  dbHealth.Connections,
			},
			"externalServices": externalServices["services"],
		},
	}
	
	// Add system information
	response.Services["system"] = map[string]interface{}{
		"golang":   runtime.Version(),
		"platform": runtime.GOOS,
		"arch":     runtime.GOARCH,
		"cpus":     runtime.NumCPU(),
	}
	
	// Set appropriate status code
	statusCode := fiber.StatusOK
	if status != "healthy" {
		statusCode = fiber.StatusServiceUnavailable
	}
	
	// Set headers
	c.Set("Cache-Control", "no-cache, no-store, must-revalidate")
	c.Set("X-Response-Time", fmt.Sprintf("%dms", responseTime))
	
	return c.Status(statusCode).JSON(response)
}

// checkDatabase checks database connectivity and performance
func (h *HealthHandler) checkDatabase() DatabaseHealth {
	start := time.Now()
	
	// Get underlying SQL DB for connection stats
	sqlDB, err := h.db.DB()
	if err != nil {
		return DatabaseHealth{
			Status:       "unhealthy",
			ResponseTime: time.Since(start).Milliseconds(),
			Error:        err.Error(),
		}
	}
	
	// Test connectivity
	if err := sqlDB.Ping(); err != nil {
		return DatabaseHealth{
			Status:       "unhealthy",
			ResponseTime: time.Since(start).Milliseconds(),
			Error:        err.Error(),
		}
	}
	
	// Get connection pool stats
	stats := sqlDB.Stats()
	connections := &DBConnections{
		Open:    stats.OpenConnections,
		InUse:   stats.InUse,
		Idle:    stats.Idle,
		MaxOpen: stats.MaxOpenConnections,
		MaxIdle: 0, // Not available in sql.DBStats
	}
	
	return DatabaseHealth{
		Status:       "healthy",
		ResponseTime: time.Since(start).Milliseconds(),
		Connections:  connections,
	}
}

// quickDBPing performs a quick database ping for HEAD requests
func (h *HealthHandler) quickDBPing() error {
	sqlDB, err := h.db.DB()
	if err != nil {
		return err
	}
	return sqlDB.Ping()
}

// getMemoryMetrics gets current memory usage
func (h *HealthHandler) getMemoryMetrics() MemoryMetrics {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	
	// Calculate memory percentage (rough estimate)
	percentage := float64(m.Alloc) / float64(m.Sys) * 100
	
	status := "healthy"
	if percentage > 90 {
		status = "warning"
	}
	if percentage > 95 {
		status = "unhealthy"
	}
	
	return MemoryMetrics{
		Status:     status,
		Alloc:      m.Alloc / 1024 / 1024,      // Convert to MB
		TotalAlloc: m.TotalAlloc / 1024 / 1024, // Convert to MB
		Sys:        m.Sys / 1024 / 1024,        // Convert to MB
		NumGC:      m.NumGC,
		Percentage: percentage,
	}
}

// checkDiskSpace checks available disk space
func (h *HealthHandler) checkDiskSpace() map[string]interface{} {
	// TODO: Implement actual disk space check
	// For now, return healthy status
	return map[string]interface{}{
		"status": "healthy",
		"metrics": map[string]interface{}{
			"total":      0,
			"used":       0,
			"free":       0,
			"percentage": 0,
		},
	}
}

// checkExternalServices checks external service dependencies
func (h *HealthHandler) checkExternalServices() map[string]interface{} {
	// TODO: Check external services like Redis, file storage, etc.
	return map[string]interface{}{
		"status": "healthy",
		"services": map[string]string{
			"redis":   "not_configured",
			"storage": "not_configured",
			"email":   "not_configured",
		},
	}
}