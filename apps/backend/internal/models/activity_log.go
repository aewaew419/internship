package models

import (
	"encoding/json"
	"time"

	"gorm.io/gorm"
)

// ActivityAction represents the type of activity
type ActivityAction string

const (
	ActivityActionLogin          ActivityAction = "login"
	ActivityActionLogout         ActivityAction = "logout"
	ActivityActionCreate         ActivityAction = "create"
	ActivityActionUpdate         ActivityAction = "update"
	ActivityActionDelete         ActivityAction = "delete"
	ActivityActionApprove        ActivityAction = "approve"
	ActivityActionReject         ActivityAction = "reject"
	ActivityActionSubmit         ActivityAction = "submit"
	ActivityActionComplete       ActivityAction = "complete"
	ActivityActionView           ActivityAction = "view"
	ActivityActionDownload       ActivityAction = "download"
	ActivityActionUpload         ActivityAction = "upload"
)

// EntityType represents the type of entity being acted upon
type EntityType string

const (
	EntityTypeStudent           EntityType = "student"
	EntityTypeCompany           EntityType = "company"
	EntityTypeInstructor        EntityType = "instructor"
	EntityTypeApproval          EntityType = "approval"
	EntityTypeEvaluation        EntityType = "evaluation"
	EntityTypeTraining          EntityType = "training"
	EntityTypeNotification      EntityType = "notification"
	EntityTypeDocument          EntityType = "document"
	EntityTypeUser              EntityType = "user"
)

// ActivityLog represents the activity_logs table
type ActivityLog struct {
	ID          uint                   `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID      uint                   `gorm:"not null;index" json:"user_id"`
	Action      ActivityAction         `gorm:"not null" json:"action"`
	EntityType  EntityType             `gorm:"not null" json:"entity_type"`
	EntityID    uint                   `json:"entity_id"`
	Description string                 `gorm:"type:text" json:"description"`
	IPAddress   string                 `json:"ip_address"`
	UserAgent   string                 `json:"user_agent"`
	Metadata    json.RawMessage        `gorm:"type:json" json:"metadata"`
	CreatedAt   time.Time              `gorm:"autoCreateTime" json:"created_at"`

	// Relationships
	User User `gorm:"foreignKey:UserID;references:StudentID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"user,omitempty"`
}

// TableName specifies the table name for ActivityLog model
func (ActivityLog) TableName() string {
	return "activity_logs"
}

// GetMetadata returns parsed metadata
func (al *ActivityLog) GetMetadata() (map[string]interface{}, error) {
	if al.Metadata == nil {
		return map[string]interface{}{}, nil
	}

	var metadata map[string]interface{}
	err := json.Unmarshal(al.Metadata, &metadata)
	if err != nil {
		return nil, err
	}
	return metadata, nil
}

// SetMetadata sets metadata as JSON
func (al *ActivityLog) SetMetadata(metadata map[string]interface{}) error {
	data, err := json.Marshal(metadata)
	if err != nil {
		return err
	}
	al.Metadata = data
	return nil
}

// GetActionDisplayText returns human-readable action text
func (al *ActivityLog) GetActionDisplayText() string {
	actionTexts := map[ActivityAction]string{
		ActivityActionLogin:    "เข้าสู่ระบบ",
		ActivityActionLogout:   "ออกจากระบบ",
		ActivityActionCreate:   "สร้าง",
		ActivityActionUpdate:   "แก้ไข",
		ActivityActionDelete:   "ลบ",
		ActivityActionApprove:  "อนุมัติ",
		ActivityActionReject:   "ปฏิเสธ",
		ActivityActionSubmit:   "ส่ง",
		ActivityActionComplete: "เสร็จสิ้น",
		ActivityActionView:     "ดู",
		ActivityActionDownload: "ดาวน์โหลด",
		ActivityActionUpload:   "อัพโหลด",
	}

	if text, exists := actionTexts[al.Action]; exists {
		return text
	}
	return string(al.Action)
}

// GetEntityDisplayText returns human-readable entity text
func (al *ActivityLog) GetEntityDisplayText() string {
	entityTexts := map[EntityType]string{
		EntityTypeStudent:      "นักศึกษา",
		EntityTypeCompany:      "บริษัท",
		EntityTypeInstructor:   "อาจารย์",
		EntityTypeApproval:     "การอนุมัติ",
		EntityTypeEvaluation:   "การประเมิน",
		EntityTypeTraining:     "การฝึกงาน",
		EntityTypeNotification: "การแจ้งเตือน",
		EntityTypeDocument:     "เอกสาร",
		EntityTypeUser:         "ผู้ใช้",
	}

	if text, exists := entityTexts[al.EntityType]; exists {
		return text
	}
	return string(al.EntityType)
}

// LogActivity creates a new activity log entry
func LogActivity(db *gorm.DB, userID uint, action ActivityAction, entityType EntityType, entityID uint, description, ipAddress, userAgent string, metadata map[string]interface{}) error {
	activityLog := &ActivityLog{
		UserID:      userID,
		Action:      action,
		EntityType:  entityType,
		EntityID:    entityID,
		Description: description,
		IPAddress:   ipAddress,
		UserAgent:   userAgent,
	}

	if metadata != nil {
		err := activityLog.SetMetadata(metadata)
		if err != nil {
			return err
		}
	}

	return db.Create(activityLog).Error
}

// GetUserActivities retrieves activities for a user with pagination
func GetUserActivities(db *gorm.DB, userID uint, limit, offset int) ([]ActivityLog, error) {
	var activities []ActivityLog
	err := db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&activities).Error
	return activities, err
}

// GetRecentActivities retrieves recent activities across all users
func GetRecentActivities(db *gorm.DB, limit int) ([]ActivityLog, error) {
	var activities []ActivityLog
	err := db.Preload("User").
		Order("created_at DESC").
		Limit(limit).
		Find(&activities).Error
	return activities, err
}

// GetActivitiesByEntity retrieves activities for a specific entity
func GetActivitiesByEntity(db *gorm.DB, entityType EntityType, entityID uint, limit int) ([]ActivityLog, error) {
	var activities []ActivityLog
	err := db.Where("entity_type = ? AND entity_id = ?", entityType, entityID).
		Preload("User").
		Order("created_at DESC").
		Limit(limit).
		Find(&activities).Error
	return activities, err
}

// GetActivitiesByAction retrieves activities by action type
func GetActivitiesByAction(db *gorm.DB, action ActivityAction, limit int) ([]ActivityLog, error) {
	var activities []ActivityLog
	err := db.Where("action = ?", action).
		Preload("User").
		Order("created_at DESC").
		Limit(limit).
		Find(&activities).Error
	return activities, err
}

// GetActivityStats returns activity statistics
func GetActivityStats(db *gorm.DB, userID *uint, days int) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	query := db.Model(&ActivityLog{})
	if userID != nil {
		query = query.Where("user_id = ?", *userID)
	}

	if days > 0 {
		startDate := time.Now().AddDate(0, 0, -days)
		query = query.Where("created_at >= ?", startDate)
	}

	// Total activities
	var total int64
	err := query.Count(&total).Error
	if err != nil {
		return nil, err
	}
	stats["total"] = total

	// By action
	var actionStats []struct {
		Action ActivityAction `json:"action"`
		Count  int64          `json:"count"`
	}
	err = query.Select("action, COUNT(*) as count").
		Group("action").
		Scan(&actionStats).Error
	if err != nil {
		return nil, err
	}
	stats["by_action"] = actionStats

	// By entity type
	var entityStats []struct {
		EntityType EntityType `json:"entity_type"`
		Count      int64      `json:"count"`
	}
	err = query.Select("entity_type, COUNT(*) as count").
		Group("entity_type").
		Scan(&entityStats).Error
	if err != nil {
		return nil, err
	}
	stats["by_entity"] = entityStats

	// Daily activity (last 7 days)
	var dailyStats []struct {
		Date  string `json:"date"`
		Count int64  `json:"count"`
	}
	err = db.Raw(`
		SELECT 
			DATE(created_at) as date,
			COUNT(*) as count
		FROM activity_logs 
		WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
		GROUP BY DATE(created_at)
		ORDER BY date
	`).Scan(&dailyStats).Error
	if err != nil {
		return nil, err
	}
	stats["daily_activity"] = dailyStats

	return stats, nil
}

// CleanupOldActivities deletes activity logs older than specified days
func CleanupOldActivities(db *gorm.DB, days int) error {
	cutoffDate := time.Now().AddDate(0, 0, -days)
	return db.Where("created_at < ?", cutoffDate).Delete(&ActivityLog{}).Error
}