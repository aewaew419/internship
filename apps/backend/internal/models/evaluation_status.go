package models

import (
	"time"

	"gorm.io/gorm"
)

// EvaluationStatus represents the evaluation status enum
type EvaluationStatus string

const (
	EvalStatusPending    EvaluationStatus = "pending"
	EvalStatusInProgress EvaluationStatus = "in_progress"
	EvalStatusCompleted  EvaluationStatus = "completed"
	EvalStatusOverdue    EvaluationStatus = "overdue"
)

// EvaluationType represents the type of evaluation
type EvaluationType string

const (
	EvalTypeStudentCompany  EvaluationType = "student_company"
	EvalTypeVisitorStudent  EvaluationType = "visitor_student"
	EvalTypeVisitorCompany  EvaluationType = "visitor_company"
)

// EvaluationStatusTracker tracks the status of various evaluations
type EvaluationStatusTracker struct {
	ID                uint             `gorm:"primaryKey;autoIncrement" json:"id"`
	StudentTrainingID uint             `gorm:"column:student_training_id;not null" json:"student_training_id"`
	EvaluationType    EvaluationType   `gorm:"not null" json:"evaluation_type"`
	Status            EvaluationStatus `gorm:"not null;default:pending" json:"status"`
	EvaluatorID       *uint            `gorm:"column:evaluator_id" json:"evaluator_id"`
	DueDate           *time.Time       `gorm:"column:due_date" json:"due_date"`
	CompletedAt       *time.Time       `gorm:"column:completed_at" json:"completed_at"`
	Remarks           string           `gorm:"type:text" json:"remarks"`
	CreatedAt         time.Time        `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt         time.Time        `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	StudentTraining StudentTraining `gorm:"foreignKey:StudentTrainingID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"student_training,omitempty"`
	Evaluator       *User           `gorm:"foreignKey:EvaluatorID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL" json:"evaluator,omitempty"`
}

// TableName specifies the table name for EvaluationStatusTracker model
func (EvaluationStatusTracker) TableName() string {
	return "evaluation_status_trackers"
}

// IsOverdue checks if the evaluation is overdue
func (est *EvaluationStatusTracker) IsOverdue() bool {
	if est.DueDate == nil || est.Status == EvalStatusCompleted {
		return false
	}
	return time.Now().After(*est.DueDate)
}

// MarkAsCompleted marks the evaluation as completed
func (est *EvaluationStatusTracker) MarkAsCompleted(db *gorm.DB) error {
	now := time.Now()
	est.Status = EvalStatusCompleted
	est.CompletedAt = &now
	return db.Save(est).Error
}

// UpdateStatus updates the evaluation status
func (est *EvaluationStatusTracker) UpdateStatus(db *gorm.DB, status EvaluationStatus, remarks string) error {
	est.Status = status
	est.Remarks = remarks
	
	if status == EvalStatusCompleted && est.CompletedAt == nil {
		now := time.Now()
		est.CompletedAt = &now
	}
	
	return db.Save(est).Error
}

// GetEvaluationsByStudentTraining gets all evaluations for a student training
func GetEvaluationsByStudentTraining(db *gorm.DB, studentTrainingID uint) ([]EvaluationStatusTracker, error) {
	var evaluations []EvaluationStatusTracker
	err := db.Where("student_training_id = ?", studentTrainingID).
		Preload("Evaluator").
		Find(&evaluations).Error
	
	return evaluations, err
}

// GetEvaluationsByType gets evaluations by type and status
func GetEvaluationsByType(db *gorm.DB, evalType EvaluationType, status *EvaluationStatus) ([]EvaluationStatusTracker, error) {
	query := db.Where("evaluation_type = ?", evalType)
	
	if status != nil {
		query = query.Where("status = ?", *status)
	}
	
	var evaluations []EvaluationStatusTracker
	err := query.Preload("StudentTraining").
		Preload("StudentTraining.StudentEnroll").
		Preload("StudentTraining.StudentEnroll.Student").
		Preload("Evaluator").
		Find(&evaluations).Error
	
	return evaluations, err
}

// GetOverdueEvaluations gets all overdue evaluations
func GetOverdueEvaluations(db *gorm.DB) ([]EvaluationStatusTracker, error) {
	var evaluations []EvaluationStatusTracker
	err := db.Where("due_date < ? AND status != ?", time.Now(), EvalStatusCompleted).
		Preload("StudentTraining").
		Preload("StudentTraining.StudentEnroll").
		Preload("StudentTraining.StudentEnroll.Student").
		Preload("Evaluator").
		Find(&evaluations).Error
	
	return evaluations, err
}

// CreateEvaluationTracker creates a new evaluation tracker
func CreateEvaluationTracker(db *gorm.DB, studentTrainingID uint, evalType EvaluationType, evaluatorID *uint, dueDate *time.Time) (*EvaluationStatusTracker, error) {
	tracker := &EvaluationStatusTracker{
		StudentTrainingID: studentTrainingID,
		EvaluationType:    evalType,
		Status:            EvalStatusPending,
		EvaluatorID:       evaluatorID,
		DueDate:           dueDate,
	}

	err := db.Create(tracker).Error
	if err != nil {
		return nil, err
	}

	return tracker, nil
}

// GetEvaluationStats gets evaluation statistics
func GetEvaluationStats(db *gorm.DB) (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Count by status
	var statusCounts []struct {
		Status EvaluationStatus `json:"status"`
		Count  int64            `json:"count"`
	}
	
	err := db.Model(&EvaluationStatusTracker{}).
		Select("status, COUNT(*) as count").
		Group("status").
		Find(&statusCounts).Error
	
	if err != nil {
		return nil, err
	}
	
	stats["by_status"] = statusCounts

	// Count by type
	var typeCounts []struct {
		EvaluationType EvaluationType `json:"evaluation_type"`
		Count          int64          `json:"count"`
	}
	
	err = db.Model(&EvaluationStatusTracker{}).
		Select("evaluation_type, COUNT(*) as count").
		Group("evaluation_type").
		Find(&typeCounts).Error
	
	if err != nil {
		return nil, err
	}
	
	stats["by_type"] = typeCounts

	// Count overdue
	var overdueCount int64
	err = db.Model(&EvaluationStatusTracker{}).
		Where("due_date < ? AND status != ?", time.Now(), EvalStatusCompleted).
		Count(&overdueCount).Error
	
	if err != nil {
		return nil, err
	}
	
	stats["overdue_count"] = overdueCount

	return stats, nil
}