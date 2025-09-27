package handlers

import (
	"backend-go/internal/services"
	"strconv"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

// DocumentTemplateHandler handles document template HTTP requests
type DocumentTemplateHandler struct {
	templateService *services.DocumentTemplateService
	validator       *validator.Validate
}

// NewDocumentTemplateHandler creates a new document template handler instance
func NewDocumentTemplateHandler(templateService *services.DocumentTemplateService) *DocumentTemplateHandler {
	return &DocumentTemplateHandler{
		templateService: templateService,
		validator:       validator.New(),
	}
}

// GetTemplates handles GET /api/v1/document-templates
func (h *DocumentTemplateHandler) GetTemplates(c *fiber.Ctx) error {
	templates, err := h.templateService.GetTemplates()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to retrieve templates",
			"code":    "INTERNAL_ERROR",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    templates,
	})
}

// GetTemplate handles GET /api/v1/document-templates/:id
func (h *DocumentTemplateHandler) GetTemplate(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid template ID",
			"code":    "INVALID_ID",
		})
	}

	template, err := h.templateService.GetTemplateByID(uint(id))
	if err != nil {
		if err.Error() == "template not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"success": false,
				"error":   "Template not found",
				"code":    "TEMPLATE_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to retrieve template",
			"code":    "INTERNAL_ERROR",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data":    template,
	})
}

// CreateTemplate handles POST /api/v1/document-templates
func (h *DocumentTemplateHandler) CreateTemplate(c *fiber.Ctx) error {
	var req services.CreateTemplateRequest

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

	template, err := h.templateService.CreateTemplate(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to create template",
			"code":    "INTERNAL_ERROR",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "Template created successfully",
		"data":    template,
	})
}

// UpdateTemplate handles PUT /api/v1/document-templates/:id
func (h *DocumentTemplateHandler) UpdateTemplate(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid template ID",
			"code":    "INVALID_ID",
		})
	}

	var req services.CreateTemplateRequest
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

	template, err := h.templateService.UpdateTemplate(uint(id), req)
	if err != nil {
		if err.Error() == "template not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"success": false,
				"error":   "Template not found",
				"code":    "TEMPLATE_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to update template",
			"code":    "INTERNAL_ERROR",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Template updated successfully",
		"data":    template,
	})
}

// DeleteTemplate handles DELETE /api/v1/document-templates/:id
func (h *DocumentTemplateHandler) DeleteTemplate(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid template ID",
			"code":    "INVALID_ID",
		})
	}

	err = h.templateService.DeleteTemplate(uint(id))
	if err != nil {
		if err.Error() == "template not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"success": false,
				"error":   "Template not found",
				"code":    "TEMPLATE_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to delete template",
			"code":    "INTERNAL_ERROR",
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Template deleted successfully",
	})
}

// GenerateDocument handles POST /api/v1/document-templates/:id/generate
func (h *DocumentTemplateHandler) GenerateDocument(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid template ID",
			"code":    "INVALID_ID",
		})
	}

	var req services.GenerateDocumentRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid request body",
			"code":    "INVALID_REQUEST_BODY",
		})
	}

	// Set template ID from URL parameter
	req.TemplateID = uint(id)

	// Set default output format if not provided
	if req.OutputFormat == "" {
		req.OutputFormat = "pdf"
	}

	if err := h.validator.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Validation failed",
			"code":    "VALIDATION_ERROR",
			"details": err.Error(),
		})
	}

	filename, err := h.templateService.GenerateDocument(req)
	if err != nil {
		if err.Error() == "template not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"success": false,
				"error":   "Template not found",
				"code":    "TEMPLATE_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to generate document",
			"code":    "GENERATION_ERROR",
			"details": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Document generated successfully",
		"data": fiber.Map{
			"filename":      filename,
			"download_url":  "/api/v1/documents/download/" + filename,
			"template_id":   req.TemplateID,
			"output_format": req.OutputFormat,
		},
	})
}

// PreviewTemplate handles POST /api/v1/document-templates/:id/preview
func (h *DocumentTemplateHandler) PreviewTemplate(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid template ID",
			"code":    "INVALID_ID",
		})
	}

	var req services.GenerateDocumentRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid request body",
			"code":    "INVALID_REQUEST_BODY",
		})
	}

	// Set template ID and force HTML output for preview
	req.TemplateID = uint(id)
	req.OutputFormat = "html"

	if err := h.validator.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Validation failed",
			"code":    "VALIDATION_ERROR",
			"details": err.Error(),
		})
	}

	filename, err := h.templateService.GenerateDocument(req)
	if err != nil {
		if err.Error() == "template not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"success": false,
				"error":   "Template not found",
				"code":    "TEMPLATE_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to generate preview",
			"code":    "PREVIEW_ERROR",
			"details": err.Error(),
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Preview generated successfully",
		"data": fiber.Map{
			"filename":    filename,
			"preview_url": "/api/v1/documents/preview/" + filename,
			"template_id": req.TemplateID,
		},
	})
}