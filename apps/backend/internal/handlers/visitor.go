package handlers

import (
	"fmt"
	"strconv"
	"strings"

	"backend-go/internal/services"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

// VisitorHandler handles visitor management HTTP requests
type VisitorHandler struct {
	visitorService services.VisitorServiceInterface
	validator      *validator.Validate
}

// NewVisitorHandler creates a new visitor handler instance
func NewVisitorHandler(visitorService services.VisitorServiceInterface) *VisitorHandler {
	return &VisitorHandler{
		visitorService: visitorService,
		validator:      validator.New(),
	}
}

// GetValidator returns the validator instance (for testing purposes)
func (h *VisitorHandler) GetValidator() *validator.Validate {
	return h.validator
}

// GetVisitorTrainings handles visitor training listing requests with pagination, search, and filtering
// GET /api/v1/visitor-trainings
func (h *VisitorHandler) GetVisitorTrainings(c *fiber.Ctx) error {
	// Parse query parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	search := c.Query("search", "")
	sortBy := c.Query("sort_by", "")
	sortDesc := c.Query("sort_desc", "false") == "true"

	var studentEnrollID *uint
	if studentEnrollIDStr := c.Query("student_enroll_id"); studentEnrollIDStr != "" {
		if id, err := strconv.ParseUint(studentEnrollIDStr, 10, 32); err == nil {
			studentEnrollIDUint := uint(id)
			studentEnrollID = &studentEnrollIDUint
		}
	}

	var visitorInstructorID *uint
	if visitorInstructorIDStr := c.Query("visitor_instructor_id"); visitorInstructorIDStr != "" {
		if id, err := strconv.ParseUint(visitorInstructorIDStr, 10, 32); err == nil {
			visitorInstructorIDUint := uint(id)
			visitorInstructorID = &visitorInstructorIDUint
		}
	}

	req := services.VisitorTrainingListRequest{
		Page:                page,
		Limit:               limit,
		Search:              search,
		StudentEnrollID:     studentEnrollID,
		VisitorInstructorID: visitorInstructorID,
		SortBy:              sortBy,
		SortDesc:            sortDesc,
	}

	response, err := h.visitorService.GetVisitorTrainings(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch visitor trainings",
			"code":  "FETCH_VISITOR_TRAININGS_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Visitor trainings retrieved successfully",
		"data":    response,
	})
}

// GetVisitorTraining handles single visitor training retrieval requests
// GET /api/v1/visitor-trainings/:id
func (h *VisitorHandler) GetVisitorTraining(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid visitor training ID",
			"code":  "INVALID_VISITOR_TRAINING_ID",
		})
	}

	training, err := h.visitorService.GetVisitorTrainingByID(uint(id))
	if err != nil {
		if err.Error() == "visitor training not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Visitor training not found",
				"code":  "VISITOR_TRAINING_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch visitor training",
			"code":  "FETCH_VISITOR_TRAINING_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Visitor training retrieved successfully",
		"data":    training,
	})
}

// CreateVisitorTraining handles visitor training creation requests
// POST /api/v1/visitor-trainings
func (h *VisitorHandler) CreateVisitorTraining(c *fiber.Ctx) error {
	var req services.CreateVisitorTrainingRequest

	// Parse request body
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
			"code":  "INVALID_REQUEST_BODY",
		})
	}

	// Validate request
	if err := h.validator.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"code":    "VALIDATION_ERROR",
			"details": err.Error(),
		})
	}

	training, err := h.visitorService.CreateVisitorTraining(req)
	if err != nil {
		switch err.Error() {
		case "student enrollment not found":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Student enrollment not found",
				"code":  "STUDENT_ENROLLMENT_NOT_FOUND",
			})
		case "visitor instructor not found":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Visitor instructor not found",
				"code":  "VISITOR_INSTRUCTOR_NOT_FOUND",
			})
		case "visitor training already exists for this student enrollment":
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Visitor training already exists for this student enrollment",
				"code":  "VISITOR_TRAINING_EXISTS",
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to create visitor training",
				"code":  "CREATE_VISITOR_TRAINING_ERROR",
			})
		}
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Visitor training created successfully",
		"data":    training,
	})
}

// UpdateVisitorTraining handles visitor training update requests
// PUT /api/v1/visitor-trainings/:id
func (h *VisitorHandler) UpdateVisitorTraining(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid visitor training ID",
			"code":  "INVALID_VISITOR_TRAINING_ID",
		})
	}

	var req services.UpdateVisitorTrainingRequest

	// Parse request body
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
			"code":  "INVALID_REQUEST_BODY",
		})
	}

	// Validate request
	if err := h.validator.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"code":    "VALIDATION_ERROR",
			"details": err.Error(),
		})
	}

	training, err := h.visitorService.UpdateVisitorTraining(uint(id), req)
	if err != nil {
		switch err.Error() {
		case "visitor training not found":
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Visitor training not found",
				"code":  "VISITOR_TRAINING_NOT_FOUND",
			})
		case "visitor instructor not found":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Visitor instructor not found",
				"code":  "VISITOR_INSTRUCTOR_NOT_FOUND",
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to update visitor training",
				"code":  "UPDATE_VISITOR_TRAINING_ERROR",
			})
		}
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Visitor training updated successfully",
		"data":    training,
	})
}

// DeleteVisitorTraining handles visitor training deletion requests
// DELETE /api/v1/visitor-trainings/:id
func (h *VisitorHandler) DeleteVisitorTraining(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid visitor training ID",
			"code":  "INVALID_VISITOR_TRAINING_ID",
		})
	}

	err = h.visitorService.DeleteVisitorTraining(uint(id))
	if err != nil {
		if err.Error() == "visitor training not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Visitor training not found",
				"code":  "VISITOR_TRAINING_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete visitor training",
			"code":  "DELETE_VISITOR_TRAINING_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Visitor training deleted successfully",
	})
}

// Visitor Schedule handlers

// GetVisitorSchedules handles visitor schedule listing requests with pagination and filtering
// GET /api/v1/visitor-schedules
func (h *VisitorHandler) GetVisitorSchedules(c *fiber.Ctx) error {
	// Parse query parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	sortBy := c.Query("sort_by", "")
	sortDesc := c.Query("sort_desc", "false") == "true"

	var visitorTrainingID *uint
	if visitorTrainingIDStr := c.Query("visitor_training_id"); visitorTrainingIDStr != "" {
		if id, err := strconv.ParseUint(visitorTrainingIDStr, 10, 32); err == nil {
			visitorTrainingIDUint := uint(id)
			visitorTrainingID = &visitorTrainingIDUint
		}
	}

	var visitNo *int
	if visitNoStr := c.Query("visit_no"); visitNoStr != "" {
		if no, err := strconv.Atoi(visitNoStr); err == nil {
			visitNo = &no
		}
	}

	req := services.VisitorScheduleListRequest{
		Page:              page,
		Limit:             limit,
		VisitorTrainingID: visitorTrainingID,
		VisitNo:           visitNo,
		SortBy:            sortBy,
		SortDesc:          sortDesc,
	}

	response, err := h.visitorService.GetVisitorSchedules(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch visitor schedules",
			"code":  "FETCH_VISITOR_SCHEDULES_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Visitor schedules retrieved successfully",
		"data":    response,
	})
}

// GetVisitorSchedule handles single visitor schedule retrieval requests
// GET /api/v1/visitor-schedules/:id
func (h *VisitorHandler) GetVisitorSchedule(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid visitor schedule ID",
			"code":  "INVALID_VISITOR_SCHEDULE_ID",
		})
	}

	schedule, err := h.visitorService.GetVisitorScheduleByID(uint(id))
	if err != nil {
		if err.Error() == "visitor schedule not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Visitor schedule not found",
				"code":  "VISITOR_SCHEDULE_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch visitor schedule",
			"code":  "FETCH_VISITOR_SCHEDULE_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Visitor schedule retrieved successfully",
		"data":    schedule,
	})
}

// CreateVisitorSchedule handles visitor schedule creation requests
// POST /api/v1/visitor-schedules
func (h *VisitorHandler) CreateVisitorSchedule(c *fiber.Ctx) error {
	var req services.CreateVisitorScheduleRequest

	// Parse request body
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
			"code":  "INVALID_REQUEST_BODY",
		})
	}

	// Validate request
	if err := h.validator.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"code":    "VALIDATION_ERROR",
			"details": err.Error(),
		})
	}

	schedule, err := h.visitorService.CreateVisitorSchedule(req)
	if err != nil {
		switch err.Error() {
		case "visitor training not found":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Visitor training not found",
				"code":  "VISITOR_TRAINING_NOT_FOUND",
			})
		case "visitor schedule with this visit number already exists for this training":
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Visitor schedule with this visit number already exists for this training",
				"code":  "VISITOR_SCHEDULE_EXISTS",
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to create visitor schedule",
				"code":  "CREATE_VISITOR_SCHEDULE_ERROR",
			})
		}
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Visitor schedule created successfully",
		"data":    schedule,
	})
}

// UpdateVisitorSchedule handles visitor schedule update requests
// PUT /api/v1/visitor-schedules/:id
func (h *VisitorHandler) UpdateVisitorSchedule(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid visitor schedule ID",
			"code":  "INVALID_VISITOR_SCHEDULE_ID",
		})
	}

	var req services.UpdateVisitorScheduleRequest

	// Parse request body
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
			"code":  "INVALID_REQUEST_BODY",
		})
	}

	// Validate request
	if err := h.validator.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"code":    "VALIDATION_ERROR",
			"details": err.Error(),
		})
	}

	schedule, err := h.visitorService.UpdateVisitorSchedule(uint(id), req)
	if err != nil {
		if err.Error() == "visitor schedule not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Visitor schedule not found",
				"code":  "VISITOR_SCHEDULE_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update visitor schedule",
			"code":  "UPDATE_VISITOR_SCHEDULE_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Visitor schedule updated successfully",
		"data":    schedule,
	})
}

// DeleteVisitorSchedule handles visitor schedule deletion requests
// DELETE /api/v1/visitor-schedules/:id
func (h *VisitorHandler) DeleteVisitorSchedule(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid visitor schedule ID",
			"code":  "INVALID_VISITOR_SCHEDULE_ID",
		})
	}

	err = h.visitorService.DeleteVisitorSchedule(uint(id))
	if err != nil {
		if err.Error() == "visitor schedule not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Visitor schedule not found",
				"code":  "VISITOR_SCHEDULE_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete visitor schedule",
			"code":  "DELETE_VISITOR_SCHEDULE_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Visitor schedule deleted successfully",
	})
}

// Visitor Evaluate Student handlers

// GetVisitorEvaluateStudents handles visitor evaluate student listing requests
// GET /api/v1/visitor-trainings/:training_id/evaluate-students
func (h *VisitorHandler) GetVisitorEvaluateStudents(c *fiber.Ctx) error {
	trainingID, err := strconv.ParseUint(c.Params("training_id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid visitor training ID",
			"code":  "INVALID_VISITOR_TRAINING_ID",
		})
	}

	evaluations, err := h.visitorService.GetVisitorEvaluateStudents(uint(trainingID))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch visitor evaluate students",
			"code":  "FETCH_VISITOR_EVALUATE_STUDENTS_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Visitor evaluate students retrieved successfully",
		"data":    evaluations,
	})
}

// GetVisitorEvaluateStudent handles single visitor evaluate student retrieval requests
// GET /api/v1/visitor-evaluate-students/:id
func (h *VisitorHandler) GetVisitorEvaluateStudent(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid visitor evaluate student ID",
			"code":  "INVALID_VISITOR_EVALUATE_STUDENT_ID",
		})
	}

	evaluation, err := h.visitorService.GetVisitorEvaluateStudentByID(uint(id))
	if err != nil {
		if err.Error() == "visitor evaluate student not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Visitor evaluate student not found",
				"code":  "VISITOR_EVALUATE_STUDENT_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch visitor evaluate student",
			"code":  "FETCH_VISITOR_EVALUATE_STUDENT_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Visitor evaluate student retrieved successfully",
		"data":    evaluation,
	})
}

// CreateVisitorEvaluateStudent handles visitor evaluate student creation requests
// POST /api/v1/visitor-evaluate-students
func (h *VisitorHandler) CreateVisitorEvaluateStudent(c *fiber.Ctx) error {
	var req services.CreateVisitorEvaluateStudentRequest

	// Parse request body
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
			"code":  "INVALID_REQUEST_BODY",
		})
	}

	// Validate request
	if err := h.validator.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"code":    "VALIDATION_ERROR",
			"details": err.Error(),
		})
	}

	evaluation, err := h.visitorService.CreateVisitorEvaluateStudent(req)
	if err != nil {
		if err.Error() == "visitor training not found" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Visitor training not found",
				"code":  "VISITOR_TRAINING_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create visitor evaluate student",
			"code":  "CREATE_VISITOR_EVALUATE_STUDENT_ERROR",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Visitor evaluate student created successfully",
		"data":    evaluation,
	})
}

// UpdateVisitorEvaluateStudent handles visitor evaluate student update requests
// PUT /api/v1/visitor-evaluate-students/:id
func (h *VisitorHandler) UpdateVisitorEvaluateStudent(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid visitor evaluate student ID",
			"code":  "INVALID_VISITOR_EVALUATE_STUDENT_ID",
		})
	}

	var req services.UpdateVisitorEvaluateStudentRequest

	// Parse request body
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
			"code":  "INVALID_REQUEST_BODY",
		})
	}

	// Validate request
	if err := h.validator.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"code":    "VALIDATION_ERROR",
			"details": err.Error(),
		})
	}

	evaluation, err := h.visitorService.UpdateVisitorEvaluateStudent(uint(id), req)
	if err != nil {
		if err.Error() == "visitor evaluate student not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Visitor evaluate student not found",
				"code":  "VISITOR_EVALUATE_STUDENT_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update visitor evaluate student",
			"code":  "UPDATE_VISITOR_EVALUATE_STUDENT_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Visitor evaluate student updated successfully",
		"data":    evaluation,
	})
}

// DeleteVisitorEvaluateStudent handles visitor evaluate student deletion requests
// DELETE /api/v1/visitor-evaluate-students/:id
func (h *VisitorHandler) DeleteVisitorEvaluateStudent(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid visitor evaluate student ID",
			"code":  "INVALID_VISITOR_EVALUATE_STUDENT_ID",
		})
	}

	err = h.visitorService.DeleteVisitorEvaluateStudent(uint(id))
	if err != nil {
		if err.Error() == "visitor evaluate student not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Visitor evaluate student not found",
				"code":  "VISITOR_EVALUATE_STUDENT_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete visitor evaluate student",
			"code":  "DELETE_VISITOR_EVALUATE_STUDENT_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Visitor evaluate student deleted successfully",
	})
}

// Visitor Evaluate Company handlers

// GetVisitorEvaluateCompanies handles visitor evaluate company listing requests
// GET /api/v1/visitor-trainings/:training_id/evaluate-companies
func (h *VisitorHandler) GetVisitorEvaluateCompanies(c *fiber.Ctx) error {
	trainingID, err := strconv.ParseUint(c.Params("training_id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid visitor training ID",
			"code":  "INVALID_VISITOR_TRAINING_ID",
		})
	}

	evaluations, err := h.visitorService.GetVisitorEvaluateCompanies(uint(trainingID))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch visitor evaluate companies",
			"code":  "FETCH_VISITOR_EVALUATE_COMPANIES_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Visitor evaluate companies retrieved successfully",
		"data":    evaluations,
	})
}

// GetVisitorEvaluateCompany handles single visitor evaluate company retrieval requests
// GET /api/v1/visitor-evaluate-companies/:id
func (h *VisitorHandler) GetVisitorEvaluateCompany(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid visitor evaluate company ID",
			"code":  "INVALID_VISITOR_EVALUATE_COMPANY_ID",
		})
	}

	evaluation, err := h.visitorService.GetVisitorEvaluateCompanyByID(uint(id))
	if err != nil {
		if err.Error() == "visitor evaluate company not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Visitor evaluate company not found",
				"code":  "VISITOR_EVALUATE_COMPANY_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch visitor evaluate company",
			"code":  "FETCH_VISITOR_EVALUATE_COMPANY_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Visitor evaluate company retrieved successfully",
		"data":    evaluation,
	})
}

// CreateVisitorEvaluateCompany handles visitor evaluate company creation requests
// POST /api/v1/visitor-evaluate-companies
func (h *VisitorHandler) CreateVisitorEvaluateCompany(c *fiber.Ctx) error {
	var req services.CreateVisitorEvaluateCompanyRequest

	// Parse request body
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
			"code":  "INVALID_REQUEST_BODY",
		})
	}

	// Validate request
	if err := h.validator.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"code":    "VALIDATION_ERROR",
			"details": err.Error(),
		})
	}

	evaluation, err := h.visitorService.CreateVisitorEvaluateCompany(req)
	if err != nil {
		switch err.Error() {
		case "visitor training not found":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Visitor training not found",
				"code":  "VISITOR_TRAINING_NOT_FOUND",
			})
		case "student training not found":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Student training not found",
				"code":  "STUDENT_TRAINING_NOT_FOUND",
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to create visitor evaluate company",
				"code":  "CREATE_VISITOR_EVALUATE_COMPANY_ERROR",
			})
		}
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Visitor evaluate company created successfully",
		"data":    evaluation,
	})
}

// UpdateVisitorEvaluateCompany handles visitor evaluate company update requests
// PUT /api/v1/visitor-evaluate-companies/:id
func (h *VisitorHandler) UpdateVisitorEvaluateCompany(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid visitor evaluate company ID",
			"code":  "INVALID_VISITOR_EVALUATE_COMPANY_ID",
		})
	}

	var req services.UpdateVisitorEvaluateCompanyRequest

	// Parse request body
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
			"code":  "INVALID_REQUEST_BODY",
		})
	}

	// Validate request
	if err := h.validator.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"code":    "VALIDATION_ERROR",
			"details": err.Error(),
		})
	}

	evaluation, err := h.visitorService.UpdateVisitorEvaluateCompany(uint(id), req)
	if err != nil {
		switch err.Error() {
		case "visitor evaluate company not found":
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Visitor evaluate company not found",
				"code":  "VISITOR_EVALUATE_COMPANY_NOT_FOUND",
			})
		case "student training not found":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Student training not found",
				"code":  "STUDENT_TRAINING_NOT_FOUND",
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to update visitor evaluate company",
				"code":  "UPDATE_VISITOR_EVALUATE_COMPANY_ERROR",
			})
		}
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Visitor evaluate company updated successfully",
		"data":    evaluation,
	})
}

// DeleteVisitorEvaluateCompany handles visitor evaluate company deletion requests
// DELETE /api/v1/visitor-evaluate-companies/:id
func (h *VisitorHandler) DeleteVisitorEvaluateCompany(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid visitor evaluate company ID",
			"code":  "INVALID_VISITOR_EVALUATE_COMPANY_ID",
		})
	}

	err = h.visitorService.DeleteVisitorEvaluateCompany(uint(id))
	if err != nil {
		if err.Error() == "visitor evaluate company not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Visitor evaluate company not found",
				"code":  "VISITOR_EVALUATE_COMPANY_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete visitor evaluate company",
			"code":  "DELETE_VISITOR_EVALUATE_COMPANY_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Visitor evaluate company deleted successfully",
	})
}

// Visit Photo handlers

// GetVisitPhotos handles visit photo listing requests
// GET /api/v1/visitor-schedules/:schedule_id/photos
func (h *VisitorHandler) GetVisitPhotos(c *fiber.Ctx) error {
	scheduleID, err := strconv.ParseUint(c.Params("schedule_id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid visitor schedule ID",
			"code":  "INVALID_VISITOR_SCHEDULE_ID",
		})
	}

	photos, err := h.visitorService.GetVisitPhotos(uint(scheduleID))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch visit photos",
			"code":  "FETCH_VISIT_PHOTOS_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Visit photos retrieved successfully",
		"data":    photos,
	})
}

// GetVisitPhoto handles single visit photo retrieval requests
// GET /api/v1/visit-photos/:id
func (h *VisitorHandler) GetVisitPhoto(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid visit photo ID",
			"code":  "INVALID_VISIT_PHOTO_ID",
		})
	}

	photo, err := h.visitorService.GetVisitPhotoByID(uint(id))
	if err != nil {
		if err.Error() == "visit photo not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Visit photo not found",
				"code":  "VISIT_PHOTO_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch visit photo",
			"code":  "FETCH_VISIT_PHOTO_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Visit photo retrieved successfully",
		"data":    photo,
	})
}

// UploadVisitPhoto handles visit photo upload requests
// POST /api/v1/visitor-schedules/:schedule_id/photos
func (h *VisitorHandler) UploadVisitPhoto(c *fiber.Ctx) error {
	scheduleID, err := strconv.ParseUint(c.Params("schedule_id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid visitor schedule ID",
			"code":  "INVALID_VISITOR_SCHEDULE_ID",
		})
	}

	// Parse photo_no from form data
	photoNoStr := c.FormValue("photo_no")
	if photoNoStr == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Photo number is required",
			"code":  "PHOTO_NO_REQUIRED",
		})
	}

	photoNo, err := strconv.Atoi(photoNoStr)
	if err != nil || photoNo < 1 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid photo number",
			"code":  "INVALID_PHOTO_NO",
		})
	}

	// Get uploaded file
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "File is required",
			"code":  "FILE_REQUIRED",
		})
	}

	// Validate file type (basic image validation)
	if !isImageFile(file.Filename) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Only image files are allowed",
			"code":  "INVALID_FILE_TYPE",
		})
	}

	// Save file (this would typically involve saving to a storage service)
	// For now, we'll create a simple file path
	fileURL := fmt.Sprintf("/uploads/visit-photos/%d_%d_%s", scheduleID, photoNo, file.Filename)

	// Save file to disk (in a real implementation, you'd use cloud storage)
	if err := c.SaveFile(file, "./uploads/visit-photos/"+fmt.Sprintf("%d_%d_%s", scheduleID, photoNo, file.Filename)); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save file",
			"code":  "FILE_SAVE_ERROR",
		})
	}

	photo, err := h.visitorService.CreateVisitPhoto(uint(scheduleID), photoNo, fileURL)
	if err != nil {
		switch err.Error() {
		case "visitor schedule not found":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Visitor schedule not found",
				"code":  "VISITOR_SCHEDULE_NOT_FOUND",
			})
		case "photo with this number already exists for this schedule":
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Photo with this number already exists for this schedule",
				"code":  "PHOTO_EXISTS",
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to create visit photo",
				"code":  "CREATE_VISIT_PHOTO_ERROR",
			})
		}
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Visit photo uploaded successfully",
		"data":    photo,
	})
}

// UpdateVisitPhoto handles visit photo update requests
// PUT /api/v1/visit-photos/:id
func (h *VisitorHandler) UpdateVisitPhoto(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid visit photo ID",
			"code":  "INVALID_VISIT_PHOTO_ID",
		})
	}

	// Get uploaded file
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "File is required",
			"code":  "FILE_REQUIRED",
		})
	}

	// Validate file type
	if !isImageFile(file.Filename) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Only image files are allowed",
			"code":  "INVALID_FILE_TYPE",
		})
	}

	// Create new file URL
	fileURL := fmt.Sprintf("/uploads/visit-photos/updated_%d_%s", id, file.Filename)

	// Save file to disk
	if err := c.SaveFile(file, "./uploads/visit-photos/"+fmt.Sprintf("updated_%d_%s", id, file.Filename)); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save file",
			"code":  "FILE_SAVE_ERROR",
		})
	}

	photo, err := h.visitorService.UpdateVisitPhoto(uint(id), fileURL)
	if err != nil {
		if err.Error() == "visit photo not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Visit photo not found",
				"code":  "VISIT_PHOTO_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update visit photo",
			"code":  "UPDATE_VISIT_PHOTO_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Visit photo updated successfully",
		"data":    photo,
	})
}

// DeleteVisitPhoto handles visit photo deletion requests
// DELETE /api/v1/visit-photos/:id
func (h *VisitorHandler) DeleteVisitPhoto(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid visit photo ID",
			"code":  "INVALID_VISIT_PHOTO_ID",
		})
	}

	err = h.visitorService.DeleteVisitPhoto(uint(id))
	if err != nil {
		if err.Error() == "visit photo not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Visit photo not found",
				"code":  "VISIT_PHOTO_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete visit photo",
			"code":  "DELETE_VISIT_PHOTO_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Visit photo deleted successfully",
	})
}

// Helper function to validate image files
func isImageFile(filename string) bool {
	allowedExtensions := []string{".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"}
	for _, ext := range allowedExtensions {
		if strings.HasSuffix(strings.ToLower(filename), ext) {
			return true
		}
	}
	return false
}