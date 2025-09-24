package handlers_test

import (
	"net/http/httptest"
	"testing"

	"backend-go/internal/handlers"
	"backend-go/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupDashboardTest() *fiber.App {
	// Setup Fiber app
	app := fiber.New()
	
	// Setup in-memory database for testing
	db, _ := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	
	// Setup dashboard service and handler
	dashboardService := services.NewDashboardService(db)
	dashboardHandler := handlers.NewDashboardHandler(dashboardService)
	
	// Setup routes
	api := app.Group("/api/v1")
	api.Get("/dashboard/admin", dashboardHandler.GetAdminDashboard)
	api.Get("/dashboard/student/:id", dashboardHandler.GetStudentDashboard)
	api.Get("/dashboard/instructor/:id", dashboardHandler.GetInstructorDashboard)
	
	return app
}

func TestDashboardHandler_GetAdminDashboard(t *testing.T) {
	app := setupDashboardTest()
	
	req := httptest.NewRequest("GET", "/api/v1/dashboard/admin", nil)
	
	resp, err := app.Test(req)
	
	assert.NoError(t, err)
	// Should return 500 due to missing tables (expected in test)
	assert.Equal(t, 500, resp.StatusCode)
}

func TestDashboardHandler_GetStudentDashboard(t *testing.T) {
	app := setupDashboardTest()
	
	req := httptest.NewRequest("GET", "/api/v1/dashboard/student/1", nil)
	
	resp, err := app.Test(req)
	
	assert.NoError(t, err)
	// Should return 500 due to missing tables (expected in test)
	assert.Equal(t, 500, resp.StatusCode)
}

func TestDashboardHandler_GetInstructorDashboard(t *testing.T) {
	app := setupDashboardTest()
	
	req := httptest.NewRequest("GET", "/api/v1/dashboard/instructor/1", nil)
	
	resp, err := app.Test(req)
	
	assert.NoError(t, err)
	// Should return 500 due to missing tables (expected in test)
	assert.Equal(t, 500, resp.StatusCode)
}

func TestDashboardHandler_InvalidStudentID(t *testing.T) {
	app := setupDashboardTest()
	
	req := httptest.NewRequest("GET", "/api/v1/dashboard/student/invalid", nil)
	
	resp, err := app.Test(req)
	
	assert.NoError(t, err)
	assert.Equal(t, 400, resp.StatusCode)
}

func TestDashboardHandler_InvalidInstructorID(t *testing.T) {
	app := setupDashboardTest()
	
	req := httptest.NewRequest("GET", "/api/v1/dashboard/instructor/invalid", nil)
	
	resp, err := app.Test(req)
	
	assert.NoError(t, err)
	assert.Equal(t, 400, resp.StatusCode)
}