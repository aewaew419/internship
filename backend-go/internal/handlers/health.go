package handlers

import (
	"backend-go/internal/config"
	"backend-go/internal/services"
	"fmt"
	"os"
	"runtime"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// HealthHandler handles health check endpoints
type HealthHandler struct {
	db     *gorm.DB
	cfg    *config.Config
	logger *services.Logger
}

// NewHealthHandler creates a new health handler
func NewHealthHandler(db *gorm.DB, cfg *config.Config, logger *services.Logger) *HealthHandler {
	return &HealthHandler{
		db:     db,
		cfg:    cfg,
		logger: logger,
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

// checkDiskSpace checks available disk space (cross-platform implementation)
func (h *HealthHandler) checkDiskSpace() map[string]interface{} {
	// Get current working directory
	wd, err := os.Getwd()
	if err != nil {
		return map[string]interface{}{
			"status": "unhealthy",
			"error":  err.Error(),
			"metrics": map[string]interface{}{
				"total":      0,
				"used":       0,
				"free":       0,
				"percentage": 0,
			},
		}
	}
	
	// Try to get disk space information
	// This is a simplified cross-platform approach
	// For production, consider using a library like github.com/shirou/gopsutil
	
	// Check if we can write to the directory as a basic health check
	testFile := fmt.Sprintf("%s/.health_check_%d", wd, time.Now().Unix())
	file, err := os.Create(testFile)
	if err != nil {
		return map[string]interface{}{
			"status": "unhealthy",
			"error":  "Cannot write to disk: " + err.Error(),
			"metrics": map[string]interface{}{
				"total":      0,
				"used":       0,
				"free":       0,
				"percentage": 0,
			},
		}
	}
	file.Close()
	os.Remove(testFile)
	
	// For now, return healthy status with placeholder metrics
	// In a production environment, you would implement platform-specific disk space checks
	return map[string]interface{}{
		"status": "healthy",
		"metrics": map[string]interface{}{
			"total":      0, // Would be actual total space
			"used":       0, // Would be actual used space
			"free":       0, // Would be actual free space
			"percentage": 0, // Would be actual usage percentage
			"note":       "Cross-platform disk space monitoring not implemented",
		},
	}
}

// checkExternalServices checks external service dependencies
func (h *HealthHandler) checkExternalServices() map[string]interface{} {
	services := make(map[string]string)
	overallStatus := "healthy"
	
	// Check file system access (uploads directory)
	uploadsDir := "uploads"
	if _, err := os.Stat(uploadsDir); os.IsNotExist(err) {
		services["file_system"] = "unhealthy"
		overallStatus = "unhealthy"
	} else {
		services["file_system"] = "healthy"
	}
	
	// Check if we can write to uploads directory
	testFile := fmt.Sprintf("%s/.health_check_%d", uploadsDir, time.Now().Unix())
	if file, err := os.Create(testFile); err != nil {
		services["file_write"] = "unhealthy"
		overallStatus = "unhealthy"
	} else {
		file.Close()
		os.Remove(testFile)
		services["file_write"] = "healthy"
	}
	
	return map[string]interface{}{
		"status":   overallStatus,
		"services": services,
	}
}

// Metrics handles application metrics endpoint
// GET /api/v1/metrics
func (h *HealthHandler) Metrics(c *fiber.Ctx) error {
	requestStart := time.Now()
	
	// Get runtime metrics
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	
	// Get database connection stats
	sqlDB, err := h.db.DB()
	var dbStats interface{}
	if err == nil {
		stats := sqlDB.Stats()
		dbStats = map[string]interface{}{
			"open_connections":     stats.OpenConnections,
			"in_use":              stats.InUse,
			"idle":                stats.Idle,
			"wait_count":          stats.WaitCount,
			"wait_duration":       stats.WaitDuration.String(),
			"max_idle_closed":     stats.MaxIdleClosed,
			"max_idle_time_closed": stats.MaxIdleTimeClosed,
			"max_lifetime_closed": stats.MaxLifetimeClosed,
		}
	}
	
	// Calculate response time
	responseTime := time.Since(requestStart).Milliseconds()
	
	metrics := map[string]interface{}{
		"timestamp":    time.Now().UTC().Format(time.RFC3339),
		"uptime":       time.Since(startTime).Seconds(),
		"response_time": responseTime,
		"memory": map[string]interface{}{
			"alloc":       m.Alloc / 1024 / 1024,      // MB
			"total_alloc": m.TotalAlloc / 1024 / 1024, // MB
			"sys":         m.Sys / 1024 / 1024,        // MB
			"num_gc":      m.NumGC,
			"gc_cpu_fraction": m.GCCPUFraction,
		},
		"runtime": map[string]interface{}{
			"version":     runtime.Version(),
			"goroutines":  runtime.NumGoroutine(),
			"cgocalls":    runtime.NumCgoCall(),
			"cpus":        runtime.NumCPU(),
		},
		"database": dbStats,
	}
	
	// Set cache headers
	c.Set("Cache-Control", "no-cache, no-store, must-revalidate")
	c.Set("X-Response-Time", fmt.Sprintf("%dms", responseTime))
	
	return c.JSON(metrics)
}

// Ready handles readiness probe endpoint
// GET /api/v1/ready
func (h *HealthHandler) Ready(c *fiber.Ctx) error {
	// Check if application is ready to serve requests
	
	// Check database connectivity
	if err := h.quickDBPing(); err != nil {
		h.logger.Error("Readiness check failed: database not ready", map[string]interface{}{
			"error": err.Error(),
		})
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
			"status": "not_ready",
			"reason": "database_not_ready",
			"error":  err.Error(),
		})
	}
	
	// Check critical directories exist
	criticalDirs := []string{"uploads", "uploads/pdf", "uploads/visit-photos"}
	for _, dir := range criticalDirs {
		if _, err := os.Stat(dir); os.IsNotExist(err) {
			h.logger.Error("Readiness check failed: critical directory missing", map[string]interface{}{
				"directory": dir,
			})
			return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
				"status": "not_ready",
				"reason": "critical_directory_missing",
				"directory": dir,
			})
		}
	}
	
	return c.JSON(fiber.Map{
		"status":    "ready",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
	})
}

// Live handles liveness probe endpoint
// GET /api/v1/live
func (h *HealthHandler) Live(c *fiber.Ctx) error {
	// Simple liveness check - if we can respond, we're alive
	return c.JSON(fiber.Map{
		"status":    "alive",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"uptime":    time.Since(startTime).Seconds(),
	})
}