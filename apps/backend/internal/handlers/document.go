package handlers

import (
	"backend-go/internal/services"
	"strconv"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

// DocumentHandler handles document management HTTP requests
type DocumentHandler struct {
	documentService *services.DocumentService
	validator       *validator.Validate
}

// NewDocumentHandler creates a new document handler instance
func NewDocumentHandler(documentService *services.DocumentService) *DocumentHandler {
	return &DocumentHandler{
		documentService: documentService,
		validator:       validator.New(),
	}
}

// GetDocuments handles GET /api/v1/documents
func (h *DocumentHandler) GetDocuments(c *fiber.Ctx) error {
	var req services.DocumentListRequest

	// Parse query parameters
	req.Page, _ = strconv.Atoi(c.Query("page", "1"))
	req.Limit, _ = strconv.Atoi(c.Query("limit", "10"))
	req.Search = c.Query("search", "")
	req.DocumentType = c.Query("document_type", "")
	req.Status = c.Query("status", "")
	req.SortBy = c.Query("sort_by", "")
	req.SortDesc = c.Query("sort_desc", "") == "true"

	if studentTrainingID := c.Query("student_training_id"); studentTrainingID != "" {
		if id, err := strconv.ParseUint(studentTrainingID, 10, 32); err == nil {
			studentTrainingIDUint := uint(id)
			req.StudentTrainingID = &studentTrainingIDUint
		}
	}

	if uploadedByID := c.Query("uploaded_by_id"); uploadedByID != "" {
		if id, err := strconv.ParseUint(uploadedByID, 10, 32); err == nil {
			uploadedByIDUint := uint(id)
			req.UploadedByID = &uploadedByIDUint
		}
	}

	response, err := h.documentService.GetDocuments(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to retrieve documents",
			"code":    "INTERNAL_ERROR",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    response,
	})
}

// GetDocument handles GET /api/v1/documents/:id
func (h *DocumentHandler) GetDocument(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid document ID",
			"code":    "INVALID_ID",
		})
	}

	document, err := h.documentService.GetDocumentByID(uint(id))
	if err != nil {
		if err.Error() == "document not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"success": false,
				"error":   "Document not found",
				"code":    "DOCUMENT_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to retrieve document",
			"code":    "INTERNAL_ERROR",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    document,
	})
}

// UploadDocument handles POST /api/v1/documents/upload
func (h *DocumentHandler) UploadDocument(c *fiber.Ctx) error {
	// Get uploaded file
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "File is required",
			"code":    "FILE_REQUIRED",
		})
	}

	// Parse form data
	var req services.UploadDocumentRequest
	req.Title = c.FormValue("title")
	req.Description = c.FormValue("description")
	req.DocumentType = c.FormValue("document_type")

	if studentTrainingID := c.FormValue("student_training_id"); studentTrainingID != "" {
		if id, err := strconv.ParseUint(studentTrainingID, 10, 32); err == nil {
			studentTrainingIDUint := uint(id)
			req.StudentTrainingID = &studentTrainingIDUint
		}
	}

	// Get user ID from context
	userID := c.Locals("userID").(uint)
	req.UploadedByID = userID

	if err := h.validator.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Validation failed",
			"code":    "VALIDATION_ERROR",
			"details": err.Error(),
		})
	}

	document, err := h.documentService.UploadDocument(req, file)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to upload document",
			"code":    "UPLOAD_ERROR",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "Document uploaded successfully",
		"data":    document,
	})
}

// UpdateDocument handles PUT /api/v1/documents/:id
func (h *DocumentHandler) UpdateDocument(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid document ID",
			"code":    "INVALID_ID",
		})
	}

	var req services.UpdateDocumentRequest
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

	document, err := h.documentService.UpdateDocument(uint(id), req)
	if err != nil {
		if err.Error() == "document not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"success": false,
				"error":   "Document not found",
				"code":    "DOCUMENT_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to update document",
			"code":    "INTERNAL_ERROR",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Document updated successfully",
		"data":    document,
	})
}

// DeleteDocument handles DELETE /api/v1/documents/:id
func (h *DocumentHandler) DeleteDocument(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid document ID",
			"code":    "INVALID_ID",
		})
	}

	err = h.documentService.DeleteDocument(uint(id))
	if err != nil {
		if err.Error() == "document not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"success": false,
				"error":   "Document not found",
				"code":    "DOCUMENT_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to delete document",
			"code":    "INTERNAL_ERROR",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Document deleted successfully",
	})
}

// ApproveDocument handles POST /api/v1/documents/:id/approve
func (h *DocumentHandler) ApproveDocument(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid document ID",
			"code":    "INVALID_ID",
		})
	}

	var req services.ApproveDocumentRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid request body",
			"code":    "INVALID_REQUEST_BODY",
		})
	}

	// Get user ID from context
	userID := c.Locals("userID").(uint)
	req.ApproverID = userID

	err = h.documentService.ApproveDocument(uint(id), req)
	if err != nil {
		if err.Error() == "document not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"success": false,
				"error":   "Document not found",
				"code":    "DOCUMENT_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to approve document",
			"code":    "INTERNAL_ERROR",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Document approved successfully",
	})
}

// AddComment handles POST /api/v1/documents/:id/comments
func (h *DocumentHandler) AddComment(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid document ID",
			"code":    "INVALID_ID",
		})
	}

	var req services.AddCommentRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid request body",
			"code":    "INVALID_REQUEST_BODY",
		})
	}

	// Get user ID from context
	userID := c.Locals("userID").(uint)
	req.UserID = userID
	req.DocumentID = uint(id)

	comment, err := h.documentService.AddComment(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to add comment",
			"code":    "INTERNAL_ERROR",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "Comment added successfully",
		"data":    comment,
	})
}

// DownloadDocument handles GET /api/v1/documents/:id/download
func (h *DocumentHandler) DownloadDocument(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid document ID",
			"code":    "INVALID_ID",
		})
	}

	filePath, fileName, err := h.documentService.GetDocumentFile(uint(id))
	if err != nil {
		if err.Error() == "document not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"success": false,
				"error":   "Document not found",
				"code":    "DOCUMENT_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to get document file",
			"code":    "INTERNAL_ERROR",
		})
	}

	return c.Download(filePath, fileName)
}

// GetDocumentStats handles GET /api/v1/documents/stats
func (h *DocumentHandler) GetDocumentStats(c *fiber.Ctx) error {
	stats, err := h.documentService.GetDocumentStats()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to retrieve document statistics",
			"code":    "INTERNAL_ERROR",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    stats,
	})
}