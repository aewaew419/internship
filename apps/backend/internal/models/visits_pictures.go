package models

import (
	"time"
)

// VisitsPicture represents the visits_pictures table
type VisitsPicture struct {
	ID                uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	VisitorScheduleID uint      `gorm:"column:visitor_schedule_id;not null" json:"visitor_schedule_id"`
	PhotoNo           int       `gorm:"column:photo_no;not null" json:"photo_no"`
	FileURL           string    `gorm:"column:file_url;not null" json:"file_url"`
	CreatedAt         time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt         time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	Schedule VisitorSchedule `gorm:"foreignKey:VisitorScheduleID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"schedule,omitempty"`
}

// TableName specifies the table name for VisitsPicture model
func (VisitsPicture) TableName() string {
	return "visits_pictures"
}