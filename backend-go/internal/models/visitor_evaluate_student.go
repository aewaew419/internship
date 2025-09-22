package models

import (
	"time"
)

// VisitorEvaluateStudent represents the visitor_evaluate_students table
type VisitorEvaluateStudent struct {
	ID                uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Score             int       `gorm:"not null" json:"score"`
	Questions         string    `gorm:"type:text;not null" json:"questions"`
	Comment           string    `gorm:"type:text;not null" json:"comment"`
	VisitorTrainingID uint      `gorm:"column:visitor_training_id;not null" json:"visitor_training_id"`
	CreatedAt         time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt         time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	Training VisitorTraining `gorm:"foreignKey:VisitorTrainingID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"training,omitempty"`
}

// TableName specifies the table name for VisitorEvaluateStudent model
func (VisitorEvaluateStudent) TableName() string {
	return "visitor_evaluate_students"
}