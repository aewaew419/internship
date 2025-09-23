package handlers

import (
	"backend-go/internal/models"
	"backend-go/internal/services"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// ApprovalHandler handles internship approval workflow endpoints
type ApprovalHandler struct {
	approvalService *services.ApprovalService
	db              *gorm.DB
}

// NewApprovalHandler creates a new approval handler
func NewApprovalHandler(db *gorm.DB) *ApprovalHandler {
	return &ApprovalHandler{
		approvalService: services.NewApprovalService(db),
		db:              db,
	}
}

// GetApprovalStatus gets the current approval status for a student enrollment
// GET /api/v1/approvals/status/:studentEnrollId
func (h *ApprovalHandler) GetApprovalStatus(c *fiber.Ctx) error {
	studentEnrollID, err := strconv.ParseUint(c.Params("studentEnrollId"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid student enrollment ID",
		})
	}

	status, err := h.approvalService.GetApprovalStatus(uint(studentEnrollID))
	if err != nil {
		if err.Error() == "approval record not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Approval record not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve approval status",
		})
	}

	return c.JSON(status)
}

// GetCommitteeVotingData gets committee voting information
// GET /api/v1/approvals/committee-voting/:studentEnrollId
func (h *ApprovalHandler) GetCommitteeVotingData(c *fiber.Ctx) error {
	studentEnrollID, err := strconv.ParseUint(c.Params("studentEnrollId"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid student enrollment ID",
		})
	}

	votingData, err := h.approvalService.GetCommitteeVotingData(uint(studentEnrollID))
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve committee voting data",
		})
	}

	return c.JSON(votingData)
}

// AdvisorApproval handles advisor approval or rejection
// POST /api/v1/approvals/advisor/:studentEnrollId
func (h *ApprovalHandler) AdvisorApproval(c *fiber.Ctx) error {
	studentEnrollID, err := strconv.ParseUint(c.Params("studentEnrollId"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid student enrollment ID",
		})
	}

	// Get current user from context (set by auth middleware)
	userID := c.Locals("userID").(uint)

	var request struct {
		Approved bool   `json:"approved"`
		Remarks  string `json:"remarks"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	err = h.approvalService.AdvisorApproval(uint(studentEnrollID), userID, request.Approved, request.Remarks)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	action := "rejected"
	if request.Approved {
		action = "approved"
	}

	return c.JSON(fiber.Map{
		"message":           "Application " + action + " successfully",
		"student_enroll_id": studentEnrollID,
		"approved":          request.Approved,
	})
}

// CommitteeMemberVote handles committee member voting
// POST /api/v1/approvals/committee-vote/:studentEnrollId
func (h *ApprovalHandler) CommitteeMemberVote(c *fiber.Ctx) error {
	studentEnrollID, err := strconv.ParseUint(c.Params("studentEnrollId"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid student enrollment ID",
		})
	}

	// Get current user from context (set by auth middleware)
	userID := c.Locals("userID").(uint)

	var request struct {
		Vote    string `json:"vote"`
		Remarks string `json:"remarks"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	err = h.approvalService.CommitteeMemberVote(uint(studentEnrollID), userID, request.Vote, request.Remarks)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message":           "Vote recorded successfully",
		"student_enroll_id": studentEnrollID,
		"vote":              request.Vote,
	})
}

// UpdateApprovalStatus updates approval status (admin function)
// PUT /api/v1/approvals/status/:studentEnrollId
func (h *ApprovalHandler) UpdateApprovalStatus(c *fiber.Ctx) error {
	studentEnrollID, err := strconv.ParseUint(c.Params("studentEnrollId"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid student enrollment ID",
		})
	}

	// Get current user from context (set by auth middleware)
	userID := c.Locals("userID").(uint)

	var request struct {
		Status models.InternshipApprovalStatus `json:"status"`
		Reason string                          `json:"reason"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	err = h.approvalService.UpdateApprovalStatus(uint(studentEnrollID), request.Status, userID, request.Reason)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"message":           "Approval status updated successfully",
		"student_enroll_id": studentEnrollID,
		"new_status":        request.Status,
	})
}

// CreateApprovalRecord creates a new approval record
// POST /api/v1/approvals
func (h *ApprovalHandler) CreateApprovalRecord(c *fiber.Ctx) error {
	var request struct {
		StudentEnrollID uint  `json:"student_enroll_id"`
		AdvisorID       *uint `json:"advisor_id"`
	}

	if err := c.BodyParser(&request); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	approval, err := h.approvalService.CreateApprovalRecord(request.StudentEnrollID, request.AdvisorID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create approval record",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(approval)
}

// GetApprovalsByStatus gets approvals by status with pagination
// GET /api/v1/approvals?status=registered&page=1&limit=10
func (h *ApprovalHandler) GetApprovalsByStatus(c *fiber.Ctx) error {
	status := c.Query("status")
	if status == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Status parameter is required",
		})
	}

	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	offset := (page - 1) * limit

	approvals, err := h.approvalService.GetApprovalsByStatus(models.InternshipApprovalStatus(status), limit, offset)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve approvals",
		})
	}

	return c.JSON(fiber.Map{
		"data":  approvals,
		"page":  page,
		"limit": limit,
	})
}

// GetApprovalStatuses gets all available approval statuses
// GET /api/v1/approvals/statuses
func (h *ApprovalHandler) GetApprovalStatuses(c *fiber.Ctx) error {
	statuses := []fiber.Map{
		{"value": models.StatusRegistered, "label": "ลงทะเบียนแล้ว"},
		{"value": models.StatusTApproved, "label": "อนุมัติโดยอาจารย์ที่ปรึกษา"},
		{"value": models.StatusCApproved, "label": "อนุมัติโดยคณะกรรมการ"},
		{"value": models.StatusDocApproved, "label": "อนุมัติเอกสาร"},
		{"value": models.StatusDocCancel, "label": "ยกเลิกเอกสาร"},
		{"value": models.StatusApprove, "label": "อนุมัติ"},
		{"value": models.StatusDenied, "label": "ปฏิเสธ"},
		{"value": models.StatusPending, "label": "รอดำเนินการ"},
	}

	return c.JSON(fiber.Map{
		"statuses": statuses,
	})
}