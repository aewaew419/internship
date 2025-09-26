package tests

import (
	"backend-go/internal/config"
	"backend-go/internal/handlers"
	"backend-go/internal/services"
	"database/sql"
	"encoding/json"
	"net/http/httptest"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func setupTestHealthHandler() (*handlers.HealthHandler, *gorm.DB, sqlmock.Sqlmock) {
	// Create mock database for testing with ping monitoring enabled
	sqlDB, mock, err := sqlmock.New(sqlmock.MonitorPingsOption(true))
	if err != nil {
		panic("Failed to create mock database: " + err.Error())
	}

	// Expect initial ping during GORM initialization
	mock.ExpectPing()

	// Create GORM DB with mock
	db, err := gorm.Open(postgres.New(postgres.Config{
		Conn:                      sqlDB,
		PreferSimpleProtocol: true,
	}), &gorm.Config{
		Logger: nil, // Disable GORM logging for tests
	})
	if err != nil {
		panic("Failed to create GORM instance: " + err.Error())
	}

	cfg := &config.Config{
		Environment: "test",
	}

	logger := services.DefaultLogger()
	handler := handlers.NewHealthHandler(db, cfg, logger)

	return handler, db, mock
}

func TestHealthHandler_Health(t *testing.T) {
	handler, _, mock := setupTestHealthHandler()

	// Mock database ping
	mock.ExpectPing()

	app := fiber.New()
	app.Get("/health", handler.Health)

	req := httptest.NewRequest("GET", "/health", nil)
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	var response handlers.HealthResponse
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(t, err)

	assert.Equal(t, "healthy", response.Status)
	assert.NotEmpty(t, response.Timestamp)
	assert.GreaterOrEqual(t, response.Uptime, 0.0)
	assert.Equal(t, "1.0.0", response.Version)
	assert.Equal(t, "test", response.Environment)
	assert.NotNil(t, response.Checks)
	assert.NotNil(t, response.Metrics)

	// Check that database status is healthy
	assert.Equal(t, "healthy", response.Checks["database"])
	assert.Equal(t, "healthy", response.Checks["memory"])

	// Verify all expectations were met
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestHealthHandler_HealthHead(t *testing.T) {
	handler, _, mock := setupTestHealthHandler()

	// Mock database ping
	mock.ExpectPing()

	app := fiber.New()
	app.Head("/health", handler.HealthHead)

	req := httptest.NewRequest("HEAD", "/health", nil)
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	// Verify all expectations were met
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestHealthHandler_HealthDetailed(t *testing.T) {
	handler, _, mock := setupTestHealthHandler()

	// Mock database ping
	mock.ExpectPing()

	app := fiber.New()
	app.Get("/health/detailed", handler.HealthDetailed)

	req := httptest.NewRequest("GET", "/health/detailed", nil)
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	var response handlers.HealthResponse
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(t, err)

	assert.Equal(t, "healthy", response.Status)
	assert.NotEmpty(t, response.Timestamp)
	assert.NotNil(t, response.Checks)
	assert.NotNil(t, response.Metrics)
	assert.NotNil(t, response.Services)

	// Check detailed information
	assert.Contains(t, response.Checks, "database")
	assert.Contains(t, response.Checks, "memory")
	assert.Contains(t, response.Checks, "disk")
	assert.Contains(t, response.Checks, "externalServices")

	// Check services information
	assert.Contains(t, response.Services, "database")
	assert.Contains(t, response.Services, "system")

	// Verify all expectations were met
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestHealthHandler_Metrics(t *testing.T) {
	handler, _, mock := setupTestHealthHandler()

	app := fiber.New()
	app.Get("/metrics", handler.Metrics)

	req := httptest.NewRequest("GET", "/metrics", nil)
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	var metrics map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&metrics)
	assert.NoError(t, err)

	// Check required metrics fields
	assert.Contains(t, metrics, "timestamp")
	assert.Contains(t, metrics, "uptime")
	assert.Contains(t, metrics, "response_time")
	assert.Contains(t, metrics, "memory")
	assert.Contains(t, metrics, "runtime")
	assert.Contains(t, metrics, "database")

	// Check memory metrics
	memory, ok := metrics["memory"].(map[string]interface{})
	assert.True(t, ok)
	assert.Contains(t, memory, "alloc")
	assert.Contains(t, memory, "total_alloc")
	assert.Contains(t, memory, "sys")
	assert.Contains(t, memory, "num_gc")

	// Check runtime metrics
	runtime, ok := metrics["runtime"].(map[string]interface{})
	assert.True(t, ok)
	assert.Contains(t, runtime, "version")
	assert.Contains(t, runtime, "goroutines")
	assert.Contains(t, runtime, "cpus")

	// Verify all expectations were met
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestHealthHandler_Ready(t *testing.T) {
	handler, _, mock := setupTestHealthHandler()

	// Mock database ping
	mock.ExpectPing()

	app := fiber.New()
	app.Get("/ready", handler.Ready)

	req := httptest.NewRequest("GET", "/ready", nil)
	resp, err := app.Test(req)

	assert.NoError(t, err)
	// Should be 200 if ready, 503 if not ready
	assert.True(t, resp.StatusCode == 200 || resp.StatusCode == 503)

	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(t, err)

	assert.Contains(t, response, "status")

	if resp.StatusCode == 200 {
		assert.Equal(t, "ready", response["status"])
		assert.Contains(t, response, "timestamp")
	} else {
		assert.Equal(t, "not_ready", response["status"])
		assert.Contains(t, response, "reason")
	}

	// Verify all expectations were met
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestHealthHandler_Live(t *testing.T) {
	handler, _, _ := setupTestHealthHandler()

	app := fiber.New()
	app.Get("/live", handler.Live)

	req := httptest.NewRequest("GET", "/live", nil)
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(t, err)

	assert.Equal(t, "alive", response["status"])
	assert.Contains(t, response, "timestamp")
	assert.Contains(t, response, "uptime")
}

func TestHealthHandler_DatabaseFailure(t *testing.T) {
	// Create mock database that will fail
	sqlDB, mock, err := sqlmock.New(sqlmock.MonitorPingsOption(true))
	assert.NoError(t, err)
	defer sqlDB.Close()

	// Expect initial ping during GORM initialization to succeed
	mock.ExpectPing()

	// Create GORM DB with mock
	db, err := gorm.Open(postgres.New(postgres.Config{
		Conn:                      sqlDB,
		PreferSimpleProtocol: true,
	}), &gorm.Config{
		Logger: nil,
	})
	assert.NoError(t, err)

	cfg := &config.Config{
		Environment: "test",
	}

	logger := services.DefaultLogger()
	handler := handlers.NewHealthHandler(db, cfg, logger)

	// Mock database ping to fail for the health check
	mock.ExpectPing().WillReturnError(sql.ErrConnDone)

	app := fiber.New()
	app.Get("/health", handler.Health)

	req := httptest.NewRequest("GET", "/health", nil)
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 503, resp.StatusCode) // Service Unavailable

	var response handlers.HealthResponse
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(t, err)

	assert.Equal(t, "unhealthy", response.Status)
	assert.Equal(t, "unhealthy", response.Checks["database"])

	// Verify all expectations were met
	assert.NoError(t, mock.ExpectationsWereMet())
}

func TestHealthHandler_CacheHeaders(t *testing.T) {
	handler, _, mock := setupTestHealthHandler()

	// Mock database ping
	mock.ExpectPing()

	app := fiber.New()
	app.Get("/health", handler.Health)

	req := httptest.NewRequest("GET", "/health", nil)
	resp, err := app.Test(req)

	assert.NoError(t, err)
	assert.Equal(t, 200, resp.StatusCode)

	// Check cache control headers
	assert.Equal(t, "no-cache, no-store, must-revalidate", resp.Header.Get("Cache-Control"))
	assert.Equal(t, "no-cache", resp.Header.Get("Pragma"))
	assert.Equal(t, "0", resp.Header.Get("Expires"))
	assert.NotEmpty(t, resp.Header.Get("X-Response-Time"))

	// Verify all expectations were met
	assert.NoError(t, mock.ExpectationsWereMet())
}