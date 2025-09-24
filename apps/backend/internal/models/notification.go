package models

import (
	"encoding/json"
	"time"

	"gorm.io/gorm"
)

// NotificationType represents the type of notification
type NotificationType string

const (
	NotificationTypeApproval    NotificationType = "approval"
	NotificationTypeEvaluation  NotificationType = "evaluation"
	NotificationTypeTraining    NotificationType = "training"
	NotificationTypeSystem      NotificationType = "system"
	NotificationTypeReminder    NotificationType = "reminder"
)

// NotificationPriority represents the priority level of notification
type NotificationPriority string

const (
	NotificationPriorityLow    NotificationPriority = "low"
	NotificationPriorityNormal NotificationPriority = "normal"
	NotificationPriorityHigh   NotificationPriority = "high"
	NotificationPriorityUrgent NotificationPriority = "urgent"
)

// Notification represents the notifications table
type Notification struct {
	ID        uint                 `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    uint                 `gorm:"not null;index" json:"user_id"`
	Type      NotificationType     `gorm:"not null" json:"type"`
	Title     string               `gorm:"not null" json:"title"`
	Message   string               `gorm:"type:text" json:"message"`
	IsRead    bool                 `gorm:"default:false" json:"is_read"`
	Priority  NotificationPriority `gorm:"default:normal" json:"priority"`
	ActionURL string               `json:"action_url"`
	Metadata  json.RawMessage      `gorm:"type:json" json:"metadata"`
	ReadAt    *time.Time           `json:"read_at"`
	CreatedAt time.Time            `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time            `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	User User `gorm:"foreignKey:UserID;references:StudentID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"user,omitempty"`
}

// TableName specifies the table name for Notification model
func (Notification) TableName() string {
	return "notifications"
}

// GetMetadata returns parsed metadata
func (n *Notification) GetMetadata() (map[string]interface{}, error) {
	if n.Metadata == nil {
		return map[string]interface{}{}, nil
	}

	var metadata map[string]interface{}
	err := json.Unmarshal(n.Metadata, &metadata)
	if err != nil {
		return nil, err
	}
	return metadata, nil
}

// SetMetadata sets metadata as JSON
func (n *Notification) SetMetadata(metadata map[string]interface{}) error {
	data, err := json.Marshal(metadata)
	if err != nil {
		return err
	}
	n.Metadata = data
	return nil
}

// MarkAsRead marks the notification as read
func (n *Notification) MarkAsRead(db *gorm.DB) error {
	now := time.Now()
	n.IsRead = true
	n.ReadAt = &now
	return db.Save(n).Error
}

// GetPriorityLevel returns numeric priority level for sorting
func (n *Notification) GetPriorityLevel() int {
	switch n.Priority {
	case NotificationPriorityUrgent:
		return 4
	case NotificationPriorityHigh:
		return 3
	case NotificationPriorityNormal:
		return 2
	case NotificationPriorityLow:
		return 1
	default:
		return 2
	}
}

// IsExpired checks if notification is expired (older than 30 days)
func (n *Notification) IsExpired() bool {
	return time.Since(n.CreatedAt) > 30*24*time.Hour
}

// GetDisplayTitle returns formatted title based on type
func (n *Notification) GetDisplayTitle() string {
	if n.Title != "" {
		return n.Title
	}

	// Default titles based on type
	switch n.Type {
	case NotificationTypeApproval:
		return "Approval Notification"
	case NotificationTypeEvaluation:
		return "Evaluation Notification"
	case NotificationTypeTraining:
		return "Training Notification"
	case NotificationTypeSystem:
		return "System Notification"
	case NotificationTypeReminder:
		return "Reminder"
	default:
		return "Notification"
	}
}

// CreateNotification creates a new notification
func CreateNotification(db *gorm.DB, userID uint, notificationType NotificationType, title, message string, priority NotificationPriority, actionURL string, metadata map[string]interface{}) (*Notification, error) {
	notification := &Notification{
		UserID:    userID,
		Type:      notificationType,
		Title:     title,
		Message:   message,
		Priority:  priority,
		ActionURL: actionURL,
	}

	if metadata != nil {
		err := notification.SetMetadata(metadata)
		if err != nil {
			return nil, err
		}
	}

	err := db.Create(notification).Error
	if err != nil {
		return nil, err
	}

	return notification, nil
}

// GetUserNotifications retrieves notifications for a user with pagination
func GetUserNotifications(db *gorm.DB, userID uint, limit, offset int, unreadOnly bool) ([]Notification, error) {
	query := db.Where("user_id = ?", userID)

	if unreadOnly {
		query = query.Where("is_read = ?", false)
	}

	var notifications []Notification
	err := query.Order("priority DESC, created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&notifications).Error

	return notifications, err
}

// GetUnreadCount returns count of unread notifications for a user
func GetUnreadCount(db *gorm.DB, userID uint) (int64, error) {
	var count int64
	err := db.Model(&Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Count(&count).Error
	return count, err
}

// MarkAllAsRead marks all notifications as read for a user
func MarkAllAsRead(db *gorm.DB, userID uint) error {
	now := time.Now()
	return db.Model(&Notification{}).
		Where("user_id = ? AND is_read = ?", userID, false).
		Updates(map[string]interface{}{
			"is_read": true,
			"read_at": now,
		}).Error
}

// DeleteExpiredNotifications deletes notifications older than 30 days
func DeleteExpiredNotifications(db *gorm.DB) error {
	expiredDate := time.Now().AddDate(0, 0, -30)
	return db.Where("created_at < ?", expiredDate).Delete(&Notification{}).Error
}

// GetNotificationsByType retrieves notifications by type
func GetNotificationsByType(db *gorm.DB, userID uint, notificationType NotificationType, limit int) ([]Notification, error) {
	var notifications []Notification
	err := db.Where("user_id = ? AND type = ?", userID, notificationType).
		Order("created_at DESC").
		Limit(limit).
		Find(&notifications).Error
	return notifications, err
}

// BulkCreateNotifications creates multiple notifications
func BulkCreateNotifications(db *gorm.DB, notifications []Notification) error {
	if len(notifications) == 0 {
		return nil
	}

	return db.CreateInBatches(notifications, 100).Error
}

// GetNotificationStats returns notification statistics
func GetNotificationStats(db *gorm.DB, userID uint) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Total notifications
	var total int64
	err := db.Model(&Notification{}).Where("user_id = ?", userID).Count(&total).Error
	if err != nil {
		return nil, err
	}
	stats["total"] = total

	// Unread notifications
	unread, err := GetUnreadCount(db, userID)
	if err != nil {
		return nil, err
	}
	stats["unread"] = unread

	// By type
	var typeStats []struct {
		Type  NotificationType `json:"type"`
		Count int64            `json:"count"`
	}
	err = db.Model(&Notification{}).
		Select("type, COUNT(*) as count").
		Where("user_id = ?", userID).
		Group("type").
		Scan(&typeStats).Error
	if err != nil {
		return nil, err
	}
	stats["by_type"] = typeStats

	// By priority
	var priorityStats []struct {
		Priority NotificationPriority `json:"priority"`
		Count    int64                `json:"count"`
	}
	err = db.Model(&Notification{}).
		Select("priority, COUNT(*) as count").
		Where("user_id = ?", userID).
		Group("priority").
		Scan(&priorityStats).Error
	if err != nil {
		return nil, err
	}
	stats["by_priority"] = priorityStats

	return stats, nil
}