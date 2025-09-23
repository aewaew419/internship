package models

import (
	"time"

	"gorm.io/gorm"
)

// VisitMode represents the visit mode enum
type VisitMode string

const (
	VisitModeOnsite VisitMode = "onsite"
	VisitModeOnline VisitMode = "online"
)

// VisitStatus represents the visit status enum
type VisitStatus string

const (
	VisitStatusScheduled VisitStatus = "scheduled"
	VisitStatusCompleted VisitStatus = "completed"
	VisitStatusSkipped   VisitStatus = "skipped"
	VisitStatusCancelled VisitStatus = "cancelled"
)

// VisitorSchedule represents the visitor_schedules table
type VisitorSchedule struct {
	ID                uint       `gorm:"primaryKey;autoIncrement" json:"id"`
	VisitorTrainingID uint       `gorm:"column:visitor_training_id;not null" json:"visitor_training_id"`
	VisitNo           int        `gorm:"column:visit_no;not null;check:visit_no >= 1 AND visit_no <= 4" json:"visit_no"`
	VisitAt           *time.Time `gorm:"column:visit_at" json:"visit_at"`
	Comment           *string    `gorm:"type:text" json:"comment"`
	CreatedAt         time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt         time.Time  `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	Training VisitorTraining `gorm:"foreignKey:VisitorTrainingID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"training,omitempty"`
	Photos   []VisitsPicture `gorm:"foreignKey:VisitorScheduleID" json:"photos,omitempty"`
}

// TableName specifies the table name for VisitorSchedule model
func (VisitorSchedule) TableName() string {
	return "visitor_schedules"
}

// BeforeDelete hook to clean up related records when visitor schedule is deleted
func (vs *VisitorSchedule) BeforeDelete(tx *gorm.DB) error {
	// Delete all photos for this schedule
	if err := tx.Where("visitor_schedule_id = ?", vs.ID).Delete(&VisitsPicture{}).Error; err != nil {
		return err
	}

	return nil
}