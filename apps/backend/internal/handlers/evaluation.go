package handlers

import (
	"backend-go/internal/models"
	"backend-go/internal/services"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// EvaluationHandler handles evaluation status tracking endpoints
type EvaluationHandler struct {
	evaluationService *services.EvaluationService
	db                *gorm.DB
}

// NewEvaluationHandler creates a new evaluation handler
func NewEvaluationHandler(db *gorm.DB) *EvaluationHandler {
	return &EvaluationHandler{
		evaluationService: services.NewEvaluationService(db),
		db:                db,
	}
}

// GetEvaluationSummary gets evaluation summary for a student training
// GET /api/v1/evaluations/summary/:studentTrainingId
func (h *EvaluationHandler) GetEvaluationSummary(c *fiber.Ctx) error {
	studentTrainingID, err := strconv.ParseUint(c.Params("studentTrainingId"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid student training ID",
		})
	}

	summary, err := h.evaluationService.GetEvaluationSummary(uint(studentTrainingID))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve evaluation summary",
		})
	}

	return c.JSON(summary)
}

// CreateEvaluationTrackers creates evaluation trackers for a student training
// POST /api/v1/evaluations/trackers
func (h *EvaluationHandler) CreateEvaluationTrackers(c *fiber.Ctx) error {
	var request struct {
		StudentTrainingID uint `json:"student_training_id"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	err := h.evaluationService.CreateEvaluationTrackers(request.StudentTrainingID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create evaluation trackers",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message":             "Evaluation trackers created successfully",
		"student_training_id": request.StudentTrainingID,
	})
}

// UpdateEvaluationStatus updates the status of an evaluation
// PUT /api/v1/evaluations/:id/status
func (h *EvaluationHandler) UpdateEvaluationStatus(c *fiber.Ctx) error {
	evaluationID, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid evaluation ID",
		})
	}

	var request struct {
		Status  models.EvaluationStatus `json:"status"`
		Remarks string                  `json:"remarks"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	err = h.evaluationService.UpdateEvaluationStatus(uint(evaluationID), request.Status, request.Remarks)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update evaluation status",
		})
	}

	return c.JSON(fiber.Map{
		"message":       "Evaluation status updated successfully",
		"evaluation_id": evaluationID,
		"new_status":    request.Status,
	})
}

// AssignEvaluator assigns an evaluator to an evaluation
// PUT /api/v1/evaluations/:id/assign
func (h *EvaluationHandler) AssignEvaluator(c *fiber.Ctx) error {
	evaluationID, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid evaluation ID",
		})
	}

	var request struct {
		EvaluatorID uint       `json:"evaluator_id"`
		DueDate     *time.Time `json:"due_date"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	err = h.evaluationService.AssignEvaluator(uint(evaluationID), request.EvaluatorID, request.DueDate)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to assign evaluator",
		})
	}

	return c.JSON(fiber.Map{
		"message":       "Evaluator assigned successfully",
		"evaluation_id": evaluationID,
		"evaluator_id":  request.EvaluatorID,
	})
}

// MarkEvaluationCompleted marks an evaluation as completed
// POST /api/v1/evaluations/complete
func (h *EvaluationHandler) MarkEvaluationCompleted(c *fiber.Ctx) error {
	var request struct {
		StudentTrainingID uint                   `json:"student_training_id"`
		EvaluationType    models.EvaluationType `json:"evaluation_type"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	err := h.evaluationService.MarkEvaluationCompleted(request.StudentTrainingID, request.EvaluationType)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to mark evaluation as completed",
		})
	}

	return c.JSON(fiber.Map{
		"message":             "Evaluation marked as completed",
		"student_training_id": request.StudentTrainingID,
		"evaluation_type":     request.EvaluationType,
	})
}

// GetEvaluationsByType gets evaluations by type with optional status filter
// GET /api/v1/evaluations?type=student_company&status=pending&page=1&limit=10
func (h *EvaluationHandler) GetEvaluationsByType(c *fiber.Ctx) error {
	evalType := c.Query("type")
	if evalType == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Type parameter is required",
		})
	}

	var status *models.EvaluationStatus
	if statusStr := c.Query("status"); statusStr != "" {
		s := models.EvaluationStatus(statusStr)
		status = &s
	}

	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	offset := (page - 1) * limit

	evaluations, err := h.evaluationService.GetEvaluationsByType(models.EvaluationType(evalType), status, limit, offset)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve evaluations",
		})
	}

	return c.JSON(fiber.Map{
		"data":  evaluations,
		"page":  page,
		"limit": limit,
	})
}

// GetOverdueEvaluations gets all overdue evaluations
// GET /api/v1/evaluations/overdue
func (h *EvaluationHandler) GetOverdueEvaluations(c *fiber.Ctx) error {
	evaluations, err := h.evaluationService.GetOverdueEvaluations()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve overdue evaluations",
		})
	}

	return c.JSON(fiber.Map{
		"data": evaluations,
	})
}

// GetEvaluationStats gets evaluation statistics
// GET /api/v1/evaluations/stats
func (h *EvaluationHandler) GetEvaluationStats(c *fiber.Ctx) error {
	stats, err := h.evaluationService.GetEvaluationStats()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve evaluation statistics",
		})
	}

	return c.JSON(stats)
}

// CheckStudentEvaluationStatus checks if a student has completed company evaluation
// GET /api/v1/evaluations/student/:studentTrainingId/status
func (h *EvaluationHandler) CheckStudentEvaluationStatus(c *fiber.Ctx) error {
	studentTrainingID, err := strconv.ParseUint(c.Params("studentTrainingId"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid student training ID",
		})
	}

	hasEvaluated, evaluationDate, err := h.evaluationService.CheckStudentEvaluationStatus(uint(studentTrainingID))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to check evaluation status",
		})
	}

	response := fiber.Map{
		"success":             true,
		"has_evaluated":       hasEvaluated,
		"student_training_id": studentTrainingID,
	}

	if evaluationDate != nil {
		response["evaluation_date"] = evaluationDate.Format(time.RFC3339)
	}

	return c.JSON(response)
}

// GetInstructorAssignments gets instructor assignments for evaluation
// GET /api/v1/evaluations/instructor/:instructorId/assignments
func (h *EvaluationHandler) GetInstructorAssignments(c *fiber.Ctx) error {
	instructorID, err := strconv.ParseUint(c.Params("instructorId"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid instructor ID",
		})
	}

	assignments, err := h.evaluationService.GetInstructorAssignments(uint(instructorID))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve instructor assignments",
		})
	}

	return c.JSON(fiber.Map{
		"data": assignments,
	})
}

// UpdateOverdueEvaluations updates evaluations that are past due date
// POST /api/v1/evaluations/update-overdue
func (h *EvaluationHandler) UpdateOverdueEvaluations(c *fiber.Ctx) error {
	err := h.evaluationService.UpdateOverdueEvaluations()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update overdue evaluations",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Overdue evaluations updated successfully",
	})
}

// GetEvaluationTypes gets all available evaluation types
// GET /api/v1/evaluations/types
func (h *EvaluationHandler) GetEvaluationTypes(c *fiber.Ctx) error {
	types := []fiber.Map{
		{"value": models.EvalTypeStudentCompany, "label": "Student Evaluate Company"},
		{"value": models.EvalTypeVisitorStudent, "label": "Visitor Evaluate Student"},
		{"value": models.EvalTypeVisitorCompany, "label": "Visitor Evaluate Company"},
	}

	return c.JSON(fiber.Map{
		"types": types,
	})
}

// GetEvaluationStatuses gets all available evaluation statuses
// GET /api/v1/evaluations/statuses
func (h *EvaluationHandler) GetEvaluationStatuses(c *fiber.Ctx) error {
	statuses := []fiber.Map{
		{"value": models.EvalStatusPending, "label": "Pending"},
		{"value": models.EvalStatusInProgress, "label": "In Progress"},
		{"value": models.EvalStatusCompleted, "label": "Completed"},
		{"value": models.EvalStatusOverdue, "label": "Overdue"},
	}

	return c.JSON(fiber.Map{
		"statuses": statuses,
	})
}