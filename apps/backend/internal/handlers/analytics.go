package handlers

import (
	"backend-go/internal/services"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

// AnalyticsHandler handles analytics and reporting HTTP requests
type AnalyticsHandler struct {
	analyticsService *services.AnalyticsService
	validator        *validator.Validate
}

// NewAnalyticsHandler creates a new analytics handler instance
func NewAnalyticsHandler(analyticsService *services.AnalyticsService) *AnalyticsHandler {
	return &AnalyticsHandler{
		analyticsService: analyticsService,
		validator:        validator.New(),
	}
}

// GetInternshipAnalytics handles GET /api/v1/analytics/internships
func (h *AnalyticsHandler) GetInternshipAnalytics(c *fiber.Ctx) error {
	req := services.AnalyticsRequest{}

	// Parse query parameters
	if startDate := c.Query("start_date"); startDate != "" {
		if parsed, err := time.Parse("2006-01-02", startDate); err == nil {
			req.StartDate = parsed
		}
	}

	if endDate := c.Query("end_date"); endDate != "" {
		if parsed, err := time.Parse("2006-01-02", endDate); err == nil {
			req.EndDate = parsed
		}
	}

	req.GroupBy = c.Query("group_by", "month")
	req.FilterBy = c.Query("filter_by")
	req.FilterValue = c.Query("filter_value")

	analytics, err := h.analyticsService.GetInternshipAnalytics(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve internship analytics",
			"code":  "INTERNAL_ERROR",
		})
	}

	return c.JSON(analytics)
}

// GetApprovalAnalytics handles GET /api/v1/analytics/approvals
func (h *AnalyticsHandler) GetApprovalAnalytics(c *fiber.Ctx) error {
	req := services.AnalyticsRequest{}

	// Parse query parameters
	if startDate := c.Query("start_date"); startDate != "" {
		if parsed, err := time.Parse("2006-01-02", startDate); err == nil {
			req.StartDate = parsed
		}
	}

	if endDate := c.Query("end_date"); endDate != "" {
		if parsed, err := time.Parse("2006-01-02", endDate); err == nil {
			req.EndDate = parsed
		}
	}

	analytics, err := h.analyticsService.GetApprovalAnalytics(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve approval analytics",
			"code":  "INTERNAL_ERROR",
		})
	}

	return c.JSON(analytics)
}

// GetCompanyAnalytics handles GET /api/v1/analytics/companies
func (h *AnalyticsHandler) GetCompanyAnalytics(c *fiber.Ctx) error {
	req := services.AnalyticsRequest{}

	// Parse query parameters
	if startDate := c.Query("start_date"); startDate != "" {
		if parsed, err := time.Parse("2006-01-02", startDate); err == nil {
			req.StartDate = parsed
		}
	}

	if endDate := c.Query("end_date"); endDate != "" {
		if parsed, err := time.Parse("2006-01-02", endDate); err == nil {
			req.EndDate = parsed
		}
	}

	analytics, err := h.analyticsService.GetCompanyAnalytics(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve company analytics",
			"code":  "INTERNAL_ERROR",
		})
	}

	return c.JSON(analytics)
}

// GenerateReport handles POST /api/v1/analytics/reports
func (h *AnalyticsHandler) GenerateReport(c *fiber.Ctx) error {
	var req services.ReportRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
			"code":  "INVALID_REQUEST_BODY",
		})
	}

	if err := h.validator.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Validation failed",
			"code":  "VALIDATION_ERROR",
			"details": err.Error(),
		})
	}

	reportData, filename, err := h.analyticsService.GenerateReport(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to generate report",
			"code":  "INTERNAL_ERROR",
		})
	}

	// Set appropriate content type based on format
	var contentType string
	switch req.Format {
	case services.ReportFormatPDF:
		contentType = "application/pdf"
	case services.ReportFormatExcel:
		contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	case services.ReportFormatCSV:
		contentType = "text/csv"
	default:
		contentType = "application/octet-stream"
	}

	c.Set("Content-Type", contentType)
	c.Set("Content-Disposition", "attachment; filename="+filename)

	return c.Send(reportData)
}

// GetReportTypes handles GET /api/v1/analytics/report-types
func (h *AnalyticsHandler) GetReportTypes(c *fiber.Ctx) error {
	reportTypes := []map[string]interface{}{
		{
			"type":        "internship",
			"name":        "Internship Report",
			"description": "Comprehensive internship statistics and trends",
		},
		{
			"type":        "approval",
			"name":        "Approval Report",
			"description": "Approval workflow statistics and performance",
		},
		{
			"type":        "company",
			"name":        "Company Report",
			"description": "Company performance and partnership metrics",
		},
		{
			"type":        "student",
			"name":        "Student Report",
			"description": "Student statistics and academic performance",
		},
		{
			"type":        "evaluation",
			"name":        "Evaluation Report",
			"description": "Evaluation status and completion metrics",
		},
	}

	return c.JSON(fiber.Map{
		"report_types": reportTypes,
		"formats":      []string{"pdf", "excel", "csv"},
	})
}

// GetAnalyticsStats handles GET /api/v1/analytics/stats
func (h *AnalyticsHandler) GetAnalyticsStats(c *fiber.Ctx) error {
	// Get quick stats for dashboard
	req := services.AnalyticsRequest{
		StartDate: time.Now().AddDate(0, -1, 0), // Last month
		EndDate:   time.Now(),
	}

	analytics, err := h.analyticsService.GetInternshipAnalytics(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve analytics stats",
			"code":  "INTERNAL_ERROR",
		})
	}

	// Return summary stats
	stats := map[string]interface{}{
		"total_internships": analytics.TotalInternships,
		"approval_rate":     analytics.ApprovalRate,
		"completion_rate":   analytics.CompletionRate,
		"top_companies":     analytics.TopCompanies[:min(5, len(analytics.TopCompanies))],
		"evaluation_metrics": analytics.EvaluationMetrics,
	}

	return c.JSON(stats)
}

// GetCustomAnalytics handles POST /api/v1/analytics/custom
func (h *AnalyticsHandler) GetCustomAnalytics(c *fiber.Ctx) error {
	var req services.AnalyticsRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
			"code":  "INVALID_REQUEST_BODY",
		})
	}

	analytics, err := h.analyticsService.GetInternshipAnalytics(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve custom analytics",
			"code":  "INTERNAL_ERROR",
		})
	}

	return c.JSON(analytics)
}

// Helper function for min
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}