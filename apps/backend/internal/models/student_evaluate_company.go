package models

import (
	"time"

	"gorm.io/gorm"
)

// StudentEvaluateCompany represents the student_evaluate_companies table
type StudentEvaluateCompany struct {
	ID                uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Score             int       `gorm:"not null" json:"score"`
	Questions         string    `gorm:"type:text;not null" json:"questions"`
	Comment           string    `gorm:"type:text;not null" json:"comment"`
	StudentTrainingID uint      `gorm:"column:student_training_id;not null" json:"student_training_id"`
	CreatedAt         time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt         time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	StudentTraining StudentTraining `gorm:"foreignKey:StudentTrainingID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"student_training,omitempty"`
}

// TableName specifies the table name for StudentEvaluateCompany model
func (StudentEvaluateCompany) TableName() string {
	return "student_evaluate_companies"
}

// HasEvaluated checks if evaluation exists for a student training ID
func (StudentEvaluateCompany) HasEvaluated(db *gorm.DB, studentTrainingID uint) (bool, error) {
	var count int64
	err := db.Model(&StudentEvaluateCompany{}).Where("student_training_id = ?", studentTrainingID).Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// GetEvaluationWithCompany gets evaluation with company information for a student training ID
func (StudentEvaluateCompany) GetEvaluationWithCompany(db *gorm.DB, studentTrainingID uint) (*StudentEvaluateCompany, error) {
	var evaluation StudentEvaluateCompany
	err := db.Preload("StudentTraining.Company").
		Where("student_training_id = ?", studentTrainingID).
		First(&evaluation).Error
	if err != nil {
		return nil, err
	}
	return &evaluation, nil
}