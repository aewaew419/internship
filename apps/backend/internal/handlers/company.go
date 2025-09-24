package handlers

import (
	"backend-go/internal/services"
	"strconv"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

// CompanyHandler handles company management HTTP requests
type CompanyHandler struct {
	companyService *services.CompanyService
	validator      *validator.Validate
}

// NewCompanyHandler creates a new company handler instance
func NewCompanyHandler(companyService *services.CompanyService) *CompanyHandler {
	return &CompanyHandler{
		companyService: companyService,
		validator:      validator.New(),
	}
}

// GetCompanies handles GET /api/v1/companies
func (h *CompanyHandler) GetCompanies(c *fiber.Ctx) error {
	var req services.CompanyListRequest

	// Parse query parameters
	req.Page, _ = strconv.Atoi(c.Query("page", "1"))
	req.Limit, _ = strconv.Atoi(c.Query("limit", "10"))
	req.Search = c.Query("search", "")
	req.CompanyType = c.Query("company_type", "")
	req.SortBy = c.Query("sort_by", "")
	req.SortDesc = c.Query("sort_desc", "") == "true"
	req.ActiveOnly = c.Query("active_only", "") == "true"

	response, err := h.companyService.GetCompanies(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve companies",
			"code":  "INTERNAL_ERROR",
		})
	}

	return c.JSON(response)
}

// GetCompany handles GET /api/v1/companies/:id
func (h *CompanyHandler) GetCompany(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid company ID",
			"code":  "INVALID_ID",
		})
	}

	company, err := h.companyService.GetCompanyByID(uint(id))
	if err != nil {
		if err.Error() == "company not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Company not found",
				"code":  "COMPANY_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve company",
			"code":  "INTERNAL_ERROR",
		})
	}

	return c.JSON(company)
}

// CreateCompany handles POST /api/v1/companies
func (h *CompanyHandler) CreateCompany(c *fiber.Ctx) error {
	var req services.CreateCompanyRequest

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

	company, err := h.companyService.CreateCompany(req)
	if err != nil {
		if err.Error() == "company with this register number already exists" {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Company with this register number already exists",
				"code":  "COMPANY_REGISTER_EXISTS",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create company",
			"code":  "INTERNAL_ERROR",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(company)
}

// UpdateCompany handles PUT /api/v1/companies/:id
func (h *CompanyHandler) UpdateCompany(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid company ID",
			"code":  "INVALID_ID",
		})
	}

	var req services.UpdateCompanyRequest
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

	company, err := h.companyService.UpdateCompany(uint(id), req)
	if err != nil {
		switch err.Error() {
		case "company not found":
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Company not found",
				"code":  "COMPANY_NOT_FOUND",
			})
		case "company with this register number already exists":
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Company with this register number already exists",
				"code":  "COMPANY_REGISTER_EXISTS",
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to update company",
				"code":  "INTERNAL_ERROR",
			})
		}
	}

	return c.JSON(company)
}

// DeleteCompany handles DELETE /api/v1/companies/:id
func (h *CompanyHandler) DeleteCompany(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid company ID",
			"code":  "INVALID_ID",
		})
	}

	err = h.companyService.DeleteCompany(uint(id))
	if err != nil {
		switch err.Error() {
		case "company not found":
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Company not found",
				"code":  "COMPANY_NOT_FOUND",
			})
		case "cannot delete company with active student trainings":
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Cannot delete company with active student trainings",
				"code":  "COMPANY_HAS_ACTIVE_TRAININGS",
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to delete company",
				"code":  "INTERNAL_ERROR",
			})
		}
	}

	return c.JSON(fiber.Map{
		"message": "Company deleted successfully",
	})
}

// GetCompanyStats handles GET /api/v1/companies/stats
func (h *CompanyHandler) GetCompanyStats(c *fiber.Ctx) error {
	stats, err := h.companyService.GetCompanyStats()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve company statistics",
			"code":  "INTERNAL_ERROR",
		})
	}

	return c.JSON(stats)
}

// AdvancedCompanySearch handles POST /api/v1/companies/search
func (h *CompanyHandler) AdvancedCompanySearch(c *fiber.Ctx) error {
	var req services.CompanySearchRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
			"code":  "INVALID_REQUEST_BODY",
		})
	}

	companies, err := h.companyService.AdvancedCompanySearch(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to perform advanced search",
			"code":  "INTERNAL_ERROR",
		})
	}

	return c.JSON(fiber.Map{
		"data":  companies,
		"count": len(companies),
	})
}

// GetCompanyPerformanceMetrics handles GET /api/v1/companies/performance
func (h *CompanyHandler) GetCompanyPerformanceMetrics(c *fiber.Ctx) error {
	metrics, err := h.companyService.GetCompanyPerformanceMetrics()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve company performance metrics",
			"code":  "INTERNAL_ERROR",
		})
	}

	return c.JSON(metrics)
}

// GetCompanyAnalytics handles GET /api/v1/companies/analytics
func (h *CompanyHandler) GetCompanyAnalytics(c *fiber.Ctx) error {
	analytics, err := h.companyService.GetCompanyAnalytics()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve company analytics",
			"code":  "INTERNAL_ERROR",
		})
	}

	return c.JSON(analytics)
}