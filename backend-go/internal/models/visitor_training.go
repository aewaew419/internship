package models

import (
	"time"

	"gorm.io/gorm"
)

// VisitorTraining represents the visitor_trainings table
type VisitorTraining struct {
	ID                  uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	StudentEnrollID     uint      `gorm:"column:student_enroll_id;not null" json:"student_enroll_id"`
	VisitorInstructorID uint      `gorm:"column:visitor_instructor_id;not null" json:"visitor_instructor_id"`
	CreatedAt           time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt           time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	StudentEnroll        StudentEnroll          `gorm:"foreignKey:StudentEnrollID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"student_enroll,omitempty"`
	Visitor              Instructor             `gorm:"foreignKey:VisitorInstructorID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"visitor,omitempty"`
	Schedules            []VisitorSchedule      `gorm:"foreignKey:VisitorTrainingID" json:"schedules,omitempty"`
	EvaluateCompany      []VisitorEvaluateCompany `gorm:"foreignKey:VisitorTrainingID" json:"evaluate_company,omitempty"`
	EvaluateStudent      []VisitorEvaluateStudent `gorm:"foreignKey:VisitorTrainingID" json:"evaluate_student,omitempty"`
}

// TableName specifies the table name for VisitorTraining model
func (VisitorTraining) TableName() string {
	return "visitor_trainings"
}

// BeforeDelete hook to clean up related records when visitor training is deleted
func (vt *VisitorTraining) BeforeDelete(tx *gorm.DB) error {
	// Delete all visitor schedules for this training
	if err := tx.Where("visitor_training_id = ?", vt.ID).Delete(&VisitorSchedule{}).Error; err != nil {
		return err
	}

	// Delete all visitor evaluations for companies
	if err := tx.Where("visitor_training_id = ?", vt.ID).Delete(&VisitorEvaluateCompany{}).Error; err != nil {
		return err
	}

	// Delete all visitor evaluations for students
	if err := tx.Where("visitor_training_id = ?", vt.ID).Delete(&VisitorEvaluateStudent{}).Error; err != nil {
		return err
	}

	return nil
}