package handlers

import (
	"backend-go/internal/services"
	"strconv"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

// StudentTrainingHandler handles student training management HTTP requests
type StudentTrainingHandler struct {
	studentTrainingService *services.StudentTrainingService
	validator              *validator.Validate
}

// NewStudentTrainingHandler creates a new student training handler instance
func NewStudentTrainingHandler(studentTrainingService *services.StudentTrainingService) *StudentTrainingHandler {
	return &StudentTrainingHandler{
		studentTrainingService: studentTrainingService,
		validator:              validator.New(),
	}
}

// GetStudentTrainings handles GET /api/v1/student-trainings
func (h *StudentTrainingHandler) GetStudentTrainings(c *fiber.Ctx) error {
	var req services.StudentTrainingListRequest

	// Parse query parameters
	req.Page, _ = strconv.Atoi(c.Query("page", "1"))
	req.Limit, _ = strconv.Atoi(c.Query("limit", "10"))
	req.Search = c.Query("search", "")
	req.SortBy = c.Query("sort_by", "")
	req.SortDesc = c.Query("sort_desc", "") == "true"

	if studentEnrollID := c.Query("student_enroll_id"); studentEnrollID != "" {
		if id, err := strconv.ParseUint(studentEnrollID, 10, 32); err == nil {
			studentEnrollIDUint := uint(id)
			req.StudentEnrollID = &studentEnrollIDUint
		}
	}

	if companyID := c.Query("company_id"); companyID != "" {
		if id, err := strconv.ParseUint(companyID, 10, 32); err == nil {
			companyIDUint := uint(id)
			req.CompanyID = &companyIDUint
		}
	}

	response, err := h.studentTrainingService.GetStudentTrainings(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to retrieve student trainings",
			"code":    "INTERNAL_ERROR",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    response,
	})
}

// GetStudentTraining handles GET /api/v1/student-trainings/:id
func (h *StudentTrainingHandler) GetStudentTraining(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid student training ID",
			"code":    "INVALID_ID",
		})
	}

	training, err := h.studentTrainingService.GetStudentTrainingByID(uint(id))
	if err != nil {
		if err.Error() == "student training not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"success": false,
				"error":   "Student training not found",
				"code":    "STUDENT_TRAINING_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to retrieve student training",
			"code":    "INTERNAL_ERROR",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    training,
	})
}

// CreateStudentTraining handles POST /api/v1/student-trainings
func (h *StudentTrainingHandler) CreateStudentTraining(c *fiber.Ctx) error {
	var req services.CreateStudentTrainingRequest

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid request body",
			"code":    "INVALID_REQUEST_BODY",
		})
	}

	if err := h.validator.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Validation failed",
			"code":    "VALIDATION_ERROR",
			"details": err.Error(),
		})
	}

	training, err := h.studentTrainingService.CreateStudentTraining(req)
	if err != nil {
		switch err.Error() {
		case "student enrollment not found":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"success": false,
				"error":   "Student enrollment not found",
				"code":    "STUDENT_ENROLLMENT_NOT_FOUND",
			})
		case "company not found":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"success": false,
				"error":   "Company not found",
				"code":    "COMPANY_NOT_FOUND",
			})
		case "student training already exists for this enrollment":
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"success": false,
				"error":   "Student training already exists for this enrollment",
				"code":    "STUDENT_TRAINING_EXISTS",
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"success": false,
				"error":   "Failed to create student training",
				"code":    "INTERNAL_ERROR",
			})
		}
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "Student training created successfully",
		"data":    training,
	})
}

// UpdateStudentTraining handles PUT /api/v1/student-trainings/:id
func (h *StudentTrainingHandler) UpdateStudentTraining(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid student training ID",
			"code":    "INVALID_ID",
		})
	}

	var req services.UpdateStudentTrainingRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid request body",
			"code":    "INVALID_REQUEST_BODY",
		})
	}

	if err := h.validator.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Validation failed",
			"code":    "VALIDATION_ERROR",
			"details": err.Error(),
		})
	}

	training, err := h.studentTrainingService.UpdateStudentTraining(uint(id), req)
	if err != nil {
		switch err.Error() {
		case "student training not found":
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"success": false,
				"error":   "Student training not found",
				"code":    "STUDENT_TRAINING_NOT_FOUND",
			})
		case "company not found":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"success": false,
				"error":   "Company not found",
				"code":    "COMPANY_NOT_FOUND",
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"success": false,
				"error":   "Failed to update student training",
				"code":    "INTERNAL_ERROR",
			})
		}
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Student training updated successfully",
		"data":    training,
	})
}

// DeleteStudentTraining handles DELETE /api/v1/student-trainings/:id
func (h *StudentTrainingHandler) DeleteStudentTraining(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid student training ID",
			"code":    "INVALID_ID",
		})
	}

	err = h.studentTrainingService.DeleteStudentTraining(uint(id))
	if err != nil {
		if err.Error() == "student training not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"success": false,
				"error":   "Student training not found",
				"code":    "STUDENT_TRAINING_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to delete student training",
			"code":    "INTERNAL_ERROR",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Student training deleted successfully",
	})
}

// GetStudentTrainingStats handles GET /api/v1/student-trainings/stats
func (h *StudentTrainingHandler) GetStudentTrainingStats(c *fiber.Ctx) error {
	stats, err := h.studentTrainingService.GetStudentTrainingStats()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to retrieve student training statistics",
			"code":    "INTERNAL_ERROR",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    stats,
	})
}