package handlers

import (
	"backend-go/internal/services"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

// DashboardHandler handles dashboard HTTP requests
type DashboardHandler struct {
	dashboardService *services.DashboardService
}

// NewDashboardHandler creates a new dashboard handler instance
func NewDashboardHandler(dashboardService *services.DashboardService) *DashboardHandler {
	return &DashboardHandler{
		dashboardService: dashboardService,
	}
}

// GetStudentDashboard handles GET /api/v1/dashboard/student/:id
func (h *DashboardHandler) GetStudentDashboard(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid student ID",
			"code":  "INVALID_ID",
		})
	}

	dashboard, err := h.dashboardService.GetStudentDashboard(uint(id))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve student dashboard",
			"code":  "INTERNAL_ERROR",
		})
	}

	return c.JSON(dashboard)
}

// GetInstructorDashboard handles GET /api/v1/dashboard/instructor/:id
func (h *DashboardHandler) GetInstructorDashboard(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid instructor ID",
			"code":  "INVALID_ID",
		})
	}

	dashboard, err := h.dashboardService.GetInstructorDashboard(uint(id))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve instructor dashboard",
			"code":  "INTERNAL_ERROR",
		})
	}

	return c.JSON(dashboard)
}

// GetAdminDashboard handles GET /api/v1/dashboard/admin
func (h *DashboardHandler) GetAdminDashboard(c *fiber.Ctx) error {
	dashboard, err := h.dashboardService.GetAdminDashboard()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve admin dashboard",
			"code":  "INTERNAL_ERROR",
		})
	}

	return c.JSON(dashboard)
}