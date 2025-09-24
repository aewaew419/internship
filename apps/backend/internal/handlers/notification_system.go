package handlers

import (
	"backend-go/internal/services"
	"strconv"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

// NotificationSystemHandler handles notification system HTTP requests
type NotificationSystemHandler struct {
	notificationService *services.NotificationService
	validator           *validator.Validate
}

// NewNotificationSystemHandler creates a new notification system handler instance
func NewNotificationSystemHandler(notificationService *services.NotificationService) *NotificationSystemHandler {
	return &NotificationSystemHandler{
		notificationService: notificationService,
		validator:           validator.New(),
	}
}

// GetNotifications handles GET /api/v1/notifications
func (h *NotificationSystemHandler) GetNotifications(c *fiber.Ctx) error {
	// Get user ID from context (set by auth middleware)
	userID, ok := c.Locals("user_id").(uint)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "User not authenticated",
			"code":  "UNAUTHORIZED",
		})
	}

	// Parse query parameters
	req := services.NotificationListRequest{
		UserID:     userID,
		UnreadOnly: c.Query("unread_only", "") == "true",
		Page:       1,
		Limit:      20,
	}

	if page := c.Query("page"); page != "" {
		if p, err := strconv.Atoi(page); err == nil && p > 0 {
			req.Page = p
		}
	}

	if limit := c.Query("limit"); limit != "" {
		if l, err := strconv.Atoi(limit); err == nil && l > 0 {
			req.Limit = l
		}
	}

	// Note: Type and Priority filtering can be added here if needed

	notifications, total, err := h.notificationService.GetUserNotifications(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve notifications",
			"code":  "INTERNAL_ERROR",
		})
	}

	totalPages := int((total + int64(req.Limit) - 1) / int64(req.Limit))

	return c.JSON(fiber.Map{
		"data":        notifications,
		"total":       total,
		"page":        req.Page,
		"limit":       req.Limit,
		"total_pages": totalPages,
	})
}

// MarkAsRead handles PUT /api/v1/notifications/:id/read
func (h *NotificationSystemHandler) MarkAsRead(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(uint)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "User not authenticated",
			"code":  "UNAUTHORIZED",
		})
	}

	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid notification ID",
			"code":  "INVALID_ID",
		})
	}

	err = h.notificationService.MarkAsRead(uint(id), userID)
	if err != nil {
		if err.Error() == "notification not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Notification not found",
				"code":  "NOTIFICATION_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to mark notification as read",
			"code":  "INTERNAL_ERROR",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Notification marked as read",
	})
}

// MarkAllAsRead handles POST /api/v1/notifications/mark-all-read
func (h *NotificationSystemHandler) MarkAllAsRead(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(uint)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "User not authenticated",
			"code":  "UNAUTHORIZED",
		})
	}

	err := h.notificationService.MarkAllAsRead(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to mark all notifications as read",
			"code":  "INTERNAL_ERROR",
		})
	}

	return c.JSON(fiber.Map{
		"message": "All notifications marked as read",
	})
}

// GetUnreadCount handles GET /api/v1/notifications/unread-count
func (h *NotificationSystemHandler) GetUnreadCount(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(uint)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "User not authenticated",
			"code":  "UNAUTHORIZED",
		})
	}

	count, err := h.notificationService.GetUnreadCount(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get unread count",
			"code":  "INTERNAL_ERROR",
		})
	}

	return c.JSON(fiber.Map{
		"unread_count": count,
	})
}

// DeleteNotification handles DELETE /api/v1/notifications/:id
func (h *NotificationSystemHandler) DeleteNotification(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(uint)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "User not authenticated",
			"code":  "UNAUTHORIZED",
		})
	}

	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid notification ID",
			"code":  "INVALID_ID",
		})
	}

	err = h.notificationService.DeleteNotification(uint(id), userID)
	if err != nil {
		if err.Error() == "notification not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Notification not found",
				"code":  "NOTIFICATION_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete notification",
			"code":  "INTERNAL_ERROR",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Notification deleted successfully",
	})
}

// GetNotificationStats handles GET /api/v1/notifications/stats
func (h *NotificationSystemHandler) GetNotificationStats(c *fiber.Ctx) error {
	userID, ok := c.Locals("user_id").(uint)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "User not authenticated",
			"code":  "UNAUTHORIZED",
		})
	}

	stats, err := h.notificationService.GetNotificationStats(userID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get notification statistics",
			"code":  "INTERNAL_ERROR",
		})
	}

	return c.JSON(stats)
}

// SendNotification handles POST /api/v1/notifications (Admin only)
func (h *NotificationSystemHandler) SendNotification(c *fiber.Ctx) error {
	var req services.NotificationRequest

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

	notification, err := h.notificationService.SendNotification(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to send notification",
			"code":  "INTERNAL_ERROR",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(notification)
}

// SendBulkNotifications handles POST /api/v1/notifications/bulk (Admin only)
func (h *NotificationSystemHandler) SendBulkNotifications(c *fiber.Ctx) error {
	var req services.BulkNotificationRequest

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

	notifications, err := h.notificationService.SendBulkNotifications(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to send bulk notifications",
			"code":  "INTERNAL_ERROR",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message":       "Bulk notifications sent successfully",
		"count":         len(notifications),
		"notifications": notifications,
	})
}