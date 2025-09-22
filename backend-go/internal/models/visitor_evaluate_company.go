package models

import (
	"time"
)

// VisitorEvaluateCompany represents the visitor_evaluate_companies table
type VisitorEvaluateCompany struct {
	ID                uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Score             int       `gorm:"not null" json:"score"`
	Questions         string    `gorm:"type:text;not null" json:"questions"`
	Comment           string    `gorm:"type:text;not null" json:"comment"`
	VisitorTrainingID uint      `gorm:"column:visitor_training_id;not null" json:"visitor_training_id"`
	StudentTrainingID *uint     `gorm:"column:student_training_id" json:"student_training_id"`
	CreatedAt         time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt         time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	VisitorTraining VisitorTraining  `gorm:"foreignKey:VisitorTrainingID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"visitor_training,omitempty"`
	StudentTraining *StudentTraining `gorm:"foreignKey:StudentTrainingID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL" json:"student_training,omitempty"`
}

// TableName specifies the table name for VisitorEvaluateCompany model
func (VisitorEvaluateCompany) TableName() string {
	return "visitor_evaluate_companies"
}