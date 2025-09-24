package services

import (
	"fmt"
	"os"
	"time"

	"backend-go/internal/models"
	"gorm.io/gorm"
)

// NotificationService handles notification operations
type NotificationService struct {
	db       *gorm.DB
	disabled bool
}

// NewNotificationService creates a new notification service instance
func NewNotificationService(db *gorm.DB) *NotificationService {
	// Check if notifications are disabled via environment variable
	disabled := os.Getenv("DISABLE_NOTIFICATIONS") == "true"
	
	return &NotificationService{
		db:       db,
		disabled: disabled,
	}
}

// NotificationRequest represents the request for creating a notification
type NotificationRequest struct {
	UserID    uint                         `json:"user_id" validate:"required"`
	Type      models.NotificationType      `json:"type" validate:"required"`
	Title     string                       `json:"title" validate:"required"`
	Message   string                       `json:"message" validate:"required"`
	Priority  models.NotificationPriority  `json:"priority"`
	ActionURL string                       `json:"action_url"`
	Metadata  map[string]interface{}       `json:"metadata"`
}

// NotificationListRequest represents the request for listing notifications
type NotificationListRequest struct {
	UserID     uint                        `json:"user_id"`
	Type       models.NotificationType     `json:"type"`
	Priority   models.NotificationPriority `json:"priority"`
	UnreadOnly bool                        `json:"unread_only"`
	Page       int                         `json:"page"`
	Limit      int                         `json:"limit"`
}

// NotificationResponse represents the notification response
type NotificationResponse struct {
	ID        uint                         `json:"id"`
	UserID    uint                         `json:"user_id"`
	Type      models.NotificationType      `json:"type"`
	Title     string                       `json:"title"`
	Message   string                       `json:"message"`
	IsRead    bool                         `json:"is_read"`
	Priority  models.NotificationPriority  `json:"priority"`
	ActionURL string                       `json:"action_url"`
	Metadata  map[string]interface{}       `json:"metadata"`
	ReadAt    *time.Time                   `json:"read_at"`
	CreatedAt time.Time                    `json:"created_at"`
}

// BulkNotificationRequest represents the request for bulk notifications
type BulkNotificationRequest struct {
	UserIDs   []uint                      `json:"user_ids" validate:"required,min=1"`
	Type      models.NotificationType     `json:"type" validate:"required"`
	Title     string                      `json:"title" validate:"required"`
	Message   string                      `json:"message" validate:"required"`
	Priority  models.NotificationPriority `json:"priority"`
	ActionURL string                      `json:"action_url"`
	Metadata  map[string]interface{}      `json:"metadata"`
}

// SendNotification creates and sends a notification
func (s *NotificationService) SendNotification(req NotificationRequest) (*NotificationResponse, error) {
	// If notifications are disabled, return a dummy response
	if s.disabled {
		return &NotificationResponse{
			ID:        0,
			UserID:    req.UserID,
			Type:      req.Type,
			Title:     req.Title,
			Message:   req.Message,
			IsRead:    false,
			Priority:  req.Priority,
			ActionURL: req.ActionURL,
			Metadata:  req.Metadata,
			CreatedAt: time.Now(),
		}, nil
	}

	// Set default priority if not specified
	if req.Priority == "" {
		req.Priority = models.NotificationPriorityNormal
	}

	// Create notification
	notification, err := models.CreateNotification(
		s.db,
		req.UserID,
		req.Type,
		req.Title,
		req.Message,
		req.Priority,
		req.ActionURL,
		req.Metadata,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create notification: %w", err)
	}

	// Log activity
	err = models.LogActivity(
		s.db,
		req.UserID,
		models.ActivityActionCreate,
		models.EntityTypeNotification,
		notification.ID,
		fmt.Sprintf("Notification sent: %s", req.Title),
		"",
		"",
		map[string]interface{}{
			"notification_type": req.Type,
			"priority":         req.Priority,
		},
	)
	if err != nil {
		// Log error but don't fail the notification creation
		fmt.Printf("Failed to log notification activity: %v\n", err)
	}

	return s.convertToResponse(notification), nil
}

// SendBulkNotifications sends notifications to multiple users
func (s *NotificationService) SendBulkNotifications(req BulkNotificationRequest) ([]NotificationResponse, error) {
	// If notifications are disabled, return dummy responses
	if s.disabled {
		var responses []NotificationResponse
		for _, userID := range req.UserIDs {
			responses = append(responses, NotificationResponse{
				ID:        0,
				UserID:    userID,
				Type:      req.Type,
				Title:     req.Title,
				Message:   req.Message,
				IsRead:    false,
				Priority:  req.Priority,
				ActionURL: req.ActionURL,
				Metadata:  req.Metadata,
				CreatedAt: time.Now(),
			})
		}
		return responses, nil
	}

	// Set default priority if not specified
	if req.Priority == "" {
		req.Priority = models.NotificationPriorityNormal
	}

	var notifications []models.Notification
	var responses []NotificationResponse

	// Create notifications for each user
	for _, userID := range req.UserIDs {
		notification := models.Notification{
			UserID:    userID,
			Type:      req.Type,
			Title:     req.Title,
			Message:   req.Message,
			Priority:  req.Priority,
			ActionURL: req.ActionURL,
		}

		if req.Metadata != nil {
			err := notification.SetMetadata(req.Metadata)
			if err != nil {
				return nil, fmt.Errorf("failed to set metadata for user %d: %w", userID, err)
			}
		}

		notifications = append(notifications, notification)
	}

	// Bulk create notifications
	err := models.BulkCreateNotifications(s.db, notifications)
	if err != nil {
		return nil, fmt.Errorf("failed to create bulk notifications: %w", err)
	}

	// Convert to responses
	for _, notification := range notifications {
		responses = append(responses, *s.convertToResponse(&notification))
	}

	return responses, nil
}

// GetUserNotifications retrieves notifications for a user
func (s *NotificationService) GetUserNotifications(req NotificationListRequest) ([]NotificationResponse, int64, error) {
	// If notifications are disabled, return empty list
	if s.disabled {
		return []NotificationResponse{}, 0, nil
	}

	// Set defaults
	if req.Limit <= 0 {
		req.Limit = 20
	}
	if req.Limit > 100 {
		req.Limit = 100
	}
	if req.Page <= 0 {
		req.Page = 1
	}

	offset := (req.Page - 1) * req.Limit

	// Build query
	query := s.db.Model(&models.Notification{}).Where("user_id = ?", req.UserID)

	if req.Type != "" {
		query = query.Where("type = ?", req.Type)
	}

	if req.Priority != "" {
		query = query.Where("priority = ?", req.Priority)
	}

	if req.UnreadOnly {
		query = query.Where("is_read = ?", false)
	}

	// Get total count
	var total int64
	err := query.Count(&total).Error
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count notifications: %w", err)
	}

	// Get notifications
	var notifications []models.Notification
	err = query.Order("priority DESC, created_at DESC").
		Limit(req.Limit).
		Offset(offset).
		Find(&notifications).Error
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get notifications: %w", err)
	}

	// Convert to responses
	var responses []NotificationResponse
	for _, notification := range notifications {
		responses = append(responses, *s.convertToResponse(&notification))
	}

	return responses, total, nil
}

// MarkAsRead marks a notification as read
func (s *NotificationService) MarkAsRead(notificationID uint, userID uint) error {
	var notification models.Notification
	err := s.db.Where("id = ? AND user_id = ?", notificationID, userID).First(&notification).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return fmt.Errorf("notification not found")
		}
		return fmt.Errorf("failed to find notification: %w", err)
	}

	if notification.IsRead {
		return nil // Already read
	}

	err = notification.MarkAsRead(s.db)
	if err != nil {
		return fmt.Errorf("failed to mark notification as read: %w", err)
	}

	// Log activity
	err = models.LogActivity(
		s.db,
		userID,
		models.ActivityActionView,
		models.EntityTypeNotification,
		notificationID,
		"Notification marked as read",
		"",
		"",
		nil,
	)
	if err != nil {
		fmt.Printf("Failed to log notification read activity: %v\n", err)
	}

	return nil
}

// MarkAllAsRead marks all notifications as read for a user
func (s *NotificationService) MarkAllAsRead(userID uint) error {
	err := models.MarkAllAsRead(s.db, userID)
	if err != nil {
		return fmt.Errorf("failed to mark all notifications as read: %w", err)
	}

	// Log activity
	err = models.LogActivity(
		s.db,
		userID,
		models.ActivityActionUpdate,
		models.EntityTypeNotification,
		0,
		"All notifications marked as read",
		"",
		"",
		nil,
	)
	if err != nil {
		fmt.Printf("Failed to log mark all read activity: %v\n", err)
	}

	return nil
}

// GetUnreadCount returns the count of unread notifications for a user
func (s *NotificationService) GetUnreadCount(userID uint) (int64, error) {
	// If notifications are disabled, return 0
	if s.disabled {
		return 0, nil
	}

	count, err := models.GetUnreadCount(s.db, userID)
	if err != nil {
		return 0, fmt.Errorf("failed to get unread count: %w", err)
	}
	return count, nil
}

// DeleteNotification deletes a notification
func (s *NotificationService) DeleteNotification(notificationID uint, userID uint) error {
	result := s.db.Where("id = ? AND user_id = ?", notificationID, userID).Delete(&models.Notification{})
	if result.Error != nil {
		return fmt.Errorf("failed to delete notification: %w", result.Error)
	}

	if result.RowsAffected == 0 {
		return fmt.Errorf("notification not found")
	}

	// Log activity
	err := models.LogActivity(
		s.db,
		userID,
		models.ActivityActionDelete,
		models.EntityTypeNotification,
		notificationID,
		"Notification deleted",
		"",
		"",
		nil,
	)
	if err != nil {
		fmt.Printf("Failed to log notification delete activity: %v\n", err)
	}

	return nil
}

// GetNotificationStats returns notification statistics for a user
func (s *NotificationService) GetNotificationStats(userID uint) (map[string]interface{}, error) {
	stats, err := models.GetNotificationStats(s.db, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get notification stats: %w", err)
	}
	return stats, nil
}

// CleanupExpiredNotifications removes old notifications
func (s *NotificationService) CleanupExpiredNotifications() error {
	err := models.DeleteExpiredNotifications(s.db)
	if err != nil {
		return fmt.Errorf("failed to cleanup expired notifications: %w", err)
	}
	return nil
}

// Helper method to convert model to response
func (s *NotificationService) convertToResponse(notification *models.Notification) *NotificationResponse {
	metadata, _ := notification.GetMetadata()

	return &NotificationResponse{
		ID:        notification.ID,
		UserID:    notification.UserID,
		Type:      notification.Type,
		Title:     notification.Title,
		Message:   notification.Message,
		IsRead:    notification.IsRead,
		Priority:  notification.Priority,
		ActionURL: notification.ActionURL,
		Metadata:  metadata,
		ReadAt:    notification.ReadAt,
		CreatedAt: notification.CreatedAt,
	}
}

// Predefined notification templates
func (s *NotificationService) SendApprovalNotification(userID uint, approvalType, studentName, status string) error {
	title := "Approval Update"
	message := fmt.Sprintf("Internship approval for %s has been %s", studentName, status)
	
	priority := models.NotificationPriorityNormal
	if status == "approved" {
		priority = models.NotificationPriorityHigh
	}

	req := NotificationRequest{
		UserID:   userID,
		Type:     models.NotificationTypeApproval,
		Title:    title,
		Message:  message,
		Priority: priority,
		Metadata: map[string]interface{}{
			"approval_type": approvalType,
			"student_name":  studentName,
			"status":        status,
		},
	}

	_, err := s.SendNotification(req)
	return err
}

func (s *NotificationService) SendEvaluationReminder(userID uint, evaluationType, studentName string, dueDate time.Time) error {
	title := "Evaluation Reminder"
	message := fmt.Sprintf("Please complete %s evaluation for %s by %s", evaluationType, studentName, dueDate.Format("2006-01-02"))

	req := NotificationRequest{
		UserID:   userID,
		Type:     models.NotificationTypeEvaluation,
		Title:    title,
		Message:  message,
		Priority: models.NotificationPriorityHigh,
		Metadata: map[string]interface{}{
			"evaluation_type": evaluationType,
			"student_name":    studentName,
			"due_date":        dueDate,
		},
	}

	_, err := s.SendNotification(req)
	return err
}

func (s *NotificationService) SendTrainingNotification(userID uint, trainingEvent, message string) error {
	title := "Training Update"

	req := NotificationRequest{
		UserID:   userID,
		Type:     models.NotificationTypeTraining,
		Title:    title,
		Message:  message,
		Priority: models.NotificationPriorityNormal,
		Metadata: map[string]interface{}{
			"training_event": trainingEvent,
		},
	}

	_, err := s.SendNotification(req)
	return err
}

func (s *NotificationService) SendSystemNotification(userID uint, title, message string, priority models.NotificationPriority) error {
	req := NotificationRequest{
		UserID:   userID,
		Type:     models.NotificationTypeSystem,
		Title:    title,
		Message:  message,
		Priority: priority,
	}

	_, err := s.SendNotification(req)
	return err
}