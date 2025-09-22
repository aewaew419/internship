package handlers

import (
	"backend-go/internal/config"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// NotificationHandler handles push notification endpoints
type NotificationHandler struct {
	db  *gorm.DB
	cfg *config.Config
}

// NewNotificationHandler creates a new notification handler
func NewNotificationHandler(db *gorm.DB, cfg *config.Config) *NotificationHandler {
	return &NotificationHandler{
		db:  db,
		cfg: cfg,
	}
}

// DeviceToken represents a device token for push notifications
type DeviceToken struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"userId" gorm:"not null"`
	Token     string    `json:"token" gorm:"not null;unique"`
	Platform  string    `json:"platform" gorm:"not null"` // ios, android, web
	IsActive  bool      `json:"isActive" gorm:"default:true"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

// NotificationPayload represents the notification content
type NotificationPayload struct {
	Title       string                 `json:"title" validate:"required"`
	Body        string                 `json:"body" validate:"required"`
	Data        map[string]interface{} `json:"data,omitempty"`
	ImageURL    string                 `json:"imageUrl,omitempty"`
	ClickAction string                 `json:"clickAction,omitempty"`
}

// SendNotificationRequest represents the request to send notifications
type SendNotificationRequest struct {
	UserIDs      []uint              `json:"userIds,omitempty"`
	Tokens       []string            `json:"tokens,omitempty"`
	Notification NotificationPayload `json:"notification" validate:"required"`
	Priority     string              `json:"priority,omitempty"` // high, normal
	TimeToLive   int                 `json:"timeToLive,omitempty"`
}

// RegisterTokenRequest represents the request to register a device token
type RegisterTokenRequest struct {
	Token    string `json:"token" validate:"required"`
	Platform string `json:"platform" validate:"required,oneof=ios android web"`
}

// NotificationResponse represents a standard notification response
type NotificationResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

// RegisterToken registers a device token for push notifications
// POST /api/v1/notifications/register-token
func (h *NotificationHandler) RegisterToken(c *fiber.Ctx) error {
	// TODO: Get user from JWT middleware
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(NotificationResponse{
			Success: false,
			Message: "Authentication required",
		})
	}

	var req RegisterTokenRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(NotificationResponse{
			Success: false,
			Message: "Invalid request body",
			Error:   err.Error(),
		})
	}

	// Validate platform
	if req.Platform != "ios" && req.Platform != "android" && req.Platform != "web" {
		return c.Status(fiber.StatusBadRequest).JSON(NotificationResponse{
			Success: false,
			Message: "Platform must be ios, android, or web",
		})
	}

	// TODO: Save to database
	deviceToken := DeviceToken{
		UserID:   userID.(uint),
		Token:    req.Token,
		Platform: req.Platform,
		IsActive: true,
	}

	// if err := h.db.Create(&deviceToken).Error; err != nil {
	// 	return c.Status(fiber.StatusInternalServerError).JSON(NotificationResponse{
	// 		Success: false,
	// 		Message: "Failed to register device token",
	// 		Error:   err.Error(),
	// 	})
	// }

	return c.JSON(NotificationResponse{
		Success: true,
		Message: "Device token registered successfully",
		Data: map[string]interface{}{
			"userId":       userID,
			"token":        req.Token,
			"platform":     req.Platform,
			"registeredAt": time.Now().UTC().Format(time.RFC3339),
		},
	})
}

// UnregisterToken unregisters a device token
// DELETE /api/v1/notifications/unregister-token
func (h *NotificationHandler) UnregisterToken(c *fiber.Ctx) error {
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(NotificationResponse{
			Success: false,
			Message: "Authentication required",
		})
	}

	var req struct {
		Token string `json:"token" validate:"required"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(NotificationResponse{
			Success: false,
			Message: "Invalid request body",
			Error:   err.Error(),
		})
	}

	// TODO: Update database to mark token as inactive
	// err := h.db.Model(&DeviceToken{}).
	// 	Where("user_id = ? AND token = ?", userID, req.Token).
	// 	Update("is_active", false).Error

	// if err != nil {
	// 	return c.Status(fiber.StatusInternalServerError).JSON(NotificationResponse{
	// 		Success: false,
	// 		Message: "Failed to unregister device token",
	// 		Error:   err.Error(),
	// 	})
	// }

	return c.JSON(NotificationResponse{
		Success: true,
		Message: "Device token unregistered successfully",
	})
}

// SendNotification sends push notifications
// POST /api/v1/notifications/send
func (h *NotificationHandler) SendNotification(c *fiber.Ctx) error {
	var req SendNotificationRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(NotificationResponse{
			Success: false,
			Message: "Invalid request body",
			Error:   err.Error(),
		})
	}

	// Validate notification payload
	if req.Notification.Title == "" || req.Notification.Body == "" {
		return c.Status(fiber.StatusBadRequest).JSON(NotificationResponse{
			Success: false,
			Message: "Notification title and body are required",
		})
	}

	// Set defaults
	if req.Priority == "" {
		req.Priority = "normal"
	}
	if req.TimeToLive == 0 {
		req.TimeToLive = 3600 // 1 hour
	}

	var targetTokens []string

	// Get tokens from user IDs
	if len(req.UserIDs) > 0 {
		// TODO: Get tokens from database
		// var deviceTokens []DeviceToken
		// h.db.Where("user_id IN ? AND is_active = ?", req.UserIDs, true).Find(&deviceTokens)
		// for _, dt := range deviceTokens {
		// 	targetTokens = append(targetTokens, dt.Token)
		// }
	}

	// Add direct tokens
	if len(req.Tokens) > 0 {
		targetTokens = append(targetTokens, req.Tokens...)
	}

	if len(targetTokens) == 0 {
		return c.Status(fiber.StatusBadRequest).JSON(NotificationResponse{
			Success: false,
			Message: "No valid tokens found",
		})
	}

	// Send notifications using Firebase
	results, err := h.sendFirebaseNotifications(targetTokens, req.Notification, map[string]interface{}{
		"priority":    req.Priority,
		"timeToLive": req.TimeToLive,
	})

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(NotificationResponse{
			Success: false,
			Message: "Failed to send notifications",
			Error:   err.Error(),
		})
	}

	return c.JSON(NotificationResponse{
		Success: true,
		Message: "Notifications sent successfully",
		Data: map[string]interface{}{
			"totalSent":   results["successCount"],
			"totalFailed": results["failureCount"],
			"results":     results["responses"],
		},
	})
}

// SendToUser sends notification to a specific user
// POST /api/v1/notifications/send-to-user/:userId
func (h *NotificationHandler) SendToUser(c *fiber.Ctx) error {
	userIDStr := c.Params("userId")
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(NotificationResponse{
			Success: false,
			Message: "Invalid user ID",
		})
	}

	var req struct {
		Notification NotificationPayload `json:"notification" validate:"required"`
		Priority     string              `json:"priority,omitempty"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(NotificationResponse{
			Success: false,
			Message: "Invalid request body",
			Error:   err.Error(),
		})
	}

	if req.Notification.Title == "" || req.Notification.Body == "" {
		return c.Status(fiber.StatusBadRequest).JSON(NotificationResponse{
			Success: false,
			Message: "Notification title and body are required",
		})
	}

	if req.Priority == "" {
		req.Priority = "normal"
	}

	// TODO: Get user's device tokens from database
	// var deviceTokens []DeviceToken
	// if err := h.db.Where("user_id = ? AND is_active = ?", userID, true).Find(&deviceTokens).Error; err != nil {
	// 	return c.Status(fiber.StatusInternalServerError).JSON(NotificationResponse{
	// 		Success: false,
	// 		Message: "Failed to get user device tokens",
	// 		Error:   err.Error(),
	// 	})
	// }

	// if len(deviceTokens) == 0 {
	// 	return c.Status(fiber.StatusNotFound).JSON(NotificationResponse{
	// 		Success: false,
	// 		Message: "No active device tokens found for user",
	// 	})
	// }

	// var tokens []string
	// for _, dt := range deviceTokens {
	// 	tokens = append(tokens, dt.Token)
	// }

	// Mock tokens for now
	tokens := []string{}

	results, err := h.sendFirebaseNotifications(tokens, req.Notification, map[string]interface{}{
		"priority":    req.Priority,
		"timeToLive": 3600,
	})

	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(NotificationResponse{
			Success: false,
			Message: "Failed to send notification to user",
			Error:   err.Error(),
		})
	}

	return c.JSON(NotificationResponse{
		Success: true,
		Message: "Notification sent to user successfully",
		Data: map[string]interface{}{
			"userId":      userID,
			"totalSent":   results["successCount"],
			"totalFailed": results["failureCount"],
		},
	})
}

// GetNotificationHistory gets notification history for user
// GET /api/v1/notifications/history
func (h *NotificationHandler) GetNotificationHistory(c *fiber.Ctx) error {
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(NotificationResponse{
			Success: false,
			Message: "Authentication required",
		})
	}

	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "20"))

	// TODO: Get notification history from database
	// var notifications []NotificationHistory
	// var total int64

	// offset := (page - 1) * limit
	// h.db.Where("user_id = ?", userID).
	// 	Order("created_at DESC").
	// 	Offset(offset).
	// 	Limit(limit).
	// 	Find(&notifications)

	// h.db.Model(&NotificationHistory{}).Where("user_id = ?", userID).Count(&total)

	return c.JSON(NotificationResponse{
		Success: true,
		Data: map[string]interface{}{
			"notifications": []interface{}{}, // Placeholder
			"pagination": map[string]interface{}{
				"page":       page,
				"limit":      limit,
				"total":      0,
				"totalPages": 0,
			},
		},
	})
}

// MarkAsRead marks notification as read
// PUT /api/v1/notifications/:id/read
func (h *NotificationHandler) MarkAsRead(c *fiber.Ctx) error {
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(NotificationResponse{
			Success: false,
			Message: "Authentication required",
		})
	}

	notificationID := c.Params("id")

	// TODO: Update notification status in database
	// err := h.db.Model(&NotificationHistory{}).
	// 	Where("id = ? AND user_id = ?", notificationID, userID).
	// 	Update("read_at", time.Now()).Error

	// if err != nil {
	// 	return c.Status(fiber.StatusInternalServerError).JSON(NotificationResponse{
	// 		Success: false,
	// 		Message: "Failed to mark notification as read",
	// 		Error:   err.Error(),
	// 	})
	// }

	return c.JSON(NotificationResponse{
		Success: true,
		Message: "Notification marked as read",
	})
}

// GetSettings gets notification settings for user
// GET /api/v1/notifications/settings
func (h *NotificationHandler) GetSettings(c *fiber.Ctx) error {
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(NotificationResponse{
			Success: false,
			Message: "Authentication required",
		})
	}

	// TODO: Get user notification settings from database
	settings := map[string]bool{
		"assignmentChanges":     true,
		"gradeUpdates":         true,
		"scheduleReminders":    true,
		"systemAnnouncements": true,
		"emailNotifications":   true,
		"pushNotifications":    true,
	}

	return c.JSON(NotificationResponse{
		Success: true,
		Data:    settings,
	})
}

// UpdateSettings updates notification settings
// PUT /api/v1/notifications/settings
func (h *NotificationHandler) UpdateSettings(c *fiber.Ctx) error {
	userID := c.Locals("userID")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(NotificationResponse{
			Success: false,
			Message: "Authentication required",
		})
	}

	var settings map[string]bool
	if err := c.BodyParser(&settings); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(NotificationResponse{
			Success: false,
			Message: "Invalid request body",
			Error:   err.Error(),
		})
	}

	// TODO: Update user notification settings in database
	// err := h.db.Model(&UserNotificationSettings{}).
	// 	Where("user_id = ?", userID).
	// 	Updates(settings).Error

	// if err != nil {
	// 	return c.Status(fiber.StatusInternalServerError).JSON(NotificationResponse{
	// 		Success: false,
	// 		Message: "Failed to update notification settings",
	// 		Error:   err.Error(),
	// 	})
	// }

	return c.JSON(NotificationResponse{
		Success: true,
		Message: "Notification settings updated successfully",
		Data:    settings,
	})
}

// sendFirebaseNotifications sends notifications using Firebase Cloud Messaging
func (h *NotificationHandler) sendFirebaseNotifications(
	tokens []string,
	notification NotificationPayload,
	options map[string]interface{},
) (map[string]interface{}, error) {
	// TODO: Implement Firebase Admin SDK
	// This is a placeholder implementation
	
	// Mock successful response
	responses := make([]map[string]interface{}, len(tokens))
	for i, token := range tokens {
		responses[i] = map[string]interface{}{
			"success":   true,
			"messageId": "mock-" + strconv.FormatInt(time.Now().UnixNano(), 10),
			"token":     token,
		}
	}

	return map[string]interface{}{
		"successCount": len(tokens),
		"failureCount": 0,
		"responses":    responses,
	}, nil
}