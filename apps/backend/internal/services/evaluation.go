package services

import (
	"backend-go/internal/models"
	"errors"
	"time"

	"gorm.io/gorm"
)

// EvaluationService handles evaluation status tracking operations
type EvaluationService struct {
	db                  *gorm.DB
	notificationService *NotificationService
}

// NewEvaluationService creates a new evaluation service
func NewEvaluationService(db *gorm.DB) *EvaluationService {
	return &EvaluationService{
		db:                  db,
		notificationService: NewNotificationService(db),
	}
}

// EvaluationSummary represents a summary of evaluations for a student training
type EvaluationSummary struct {
	StudentTrainingID uint                                `json:"student_training_id"`
	StudentName       string                              `json:"student_name"`
	CompanyName       string                              `json:"company_name"`
	Evaluations       []models.EvaluationStatusTracker    `json:"evaluations"`
	OverallStatus     string                              `json:"overall_status"`
	CompletionRate    float64                             `json:"completion_rate"`
}

// GetEvaluationSummary gets evaluation summary for a student training
func (s *EvaluationService) GetEvaluationSummary(studentTrainingID uint) (*EvaluationSummary, error) {
	// Get student training with related data
	var studentTraining models.StudentTraining
	err := s.db.Preload("StudentEnroll").
		Preload("StudentEnroll.Student").
		Preload("Company").
		Where("id = ?", studentTrainingID).
		First(&studentTraining).Error
	
	if err != nil {
		return nil, err
	}

	// Get all evaluations for this training
	evaluations, err := models.GetEvaluationsByStudentTraining(s.db, studentTrainingID)
	if err != nil {
		return nil, err
	}

	// Calculate completion rate
	completedCount := 0
	for _, eval := range evaluations {
		if eval.Status == models.EvalStatusCompleted {
			completedCount++
		}
	}
	
	completionRate := 0.0
	if len(evaluations) > 0 {
		completionRate = float64(completedCount) / float64(len(evaluations)) * 100
	}

	// Determine overall status
	overallStatus := s.determineOverallStatus(evaluations)

	return &EvaluationSummary{
		StudentTrainingID: studentTrainingID,
		StudentName:       studentTraining.StudentEnroll.Student.GetFullName(),
		CompanyName:       studentTraining.Company.CompanyNameTh,
		Evaluations:       evaluations,
		OverallStatus:     overallStatus,
		CompletionRate:    completionRate,
	}, nil
}

// CreateEvaluationTrackers creates evaluation trackers for a new student training
func (s *EvaluationService) CreateEvaluationTrackers(studentTrainingID uint) error {
	// Create student-company evaluation tracker
	_, err := models.CreateEvaluationTracker(
		s.db,
		studentTrainingID,
		models.EvalTypeStudentCompany,
		nil, // Student will be the evaluator
		nil, // No specific due date
	)
	if err != nil {
		return err
	}

	// Create visitor-student evaluation tracker
	_, err = models.CreateEvaluationTracker(
		s.db,
		studentTrainingID,
		models.EvalTypeVisitorStudent,
		nil, // Visitor will be assigned later
		nil, // Due date will be set when visitor is assigned
	)
	if err != nil {
		return err
	}

	// Create visitor-company evaluation tracker
	_, err = models.CreateEvaluationTracker(
		s.db,
		studentTrainingID,
		models.EvalTypeVisitorCompany,
		nil, // Visitor will be assigned later
		nil, // Due date will be set when visitor is assigned
	)
	
	return err
}

// UpdateEvaluationStatus updates the status of an evaluation
func (s *EvaluationService) UpdateEvaluationStatus(evaluationID uint, status models.EvaluationStatus, remarks string) error {
	var evaluation models.EvaluationStatusTracker
	err := s.db.First(&evaluation, evaluationID).Error
	if err != nil {
		return err
	}

	return evaluation.UpdateStatus(s.db, status, remarks)
}

// AssignEvaluator assigns an evaluator to an evaluation
func (s *EvaluationService) AssignEvaluator(evaluationID uint, evaluatorID uint, dueDate *time.Time) error {
	var evaluation models.EvaluationStatusTracker
	err := s.db.First(&evaluation, evaluationID).Error
	if err != nil {
		return err
	}

	evaluation.EvaluatorID = &evaluatorID
	evaluation.DueDate = dueDate
	
	if evaluation.Status == models.EvalStatusPending {
		evaluation.Status = models.EvalStatusInProgress
	}

	return s.db.Save(&evaluation).Error
}

// MarkEvaluationCompleted marks an evaluation as completed
func (s *EvaluationService) MarkEvaluationCompleted(studentTrainingID uint, evalType models.EvaluationType) error {
	var evaluation models.EvaluationStatusTracker
	err := s.db.Where("student_training_id = ? AND evaluation_type = ?", studentTrainingID, evalType).
		First(&evaluation).Error
	
	if err != nil {
		return err
	}

	return evaluation.MarkAsCompleted(s.db)
}

// GetEvaluationsByType gets evaluations by type and optional status
func (s *EvaluationService) GetEvaluationsByType(evalType models.EvaluationType, status *models.EvaluationStatus, limit, offset int) ([]models.EvaluationStatusTracker, error) {
	query := s.db.Where("evaluation_type = ?", evalType)
	
	if status != nil {
		query = query.Where("status = ?", *status)
	}
	
	var evaluations []models.EvaluationStatusTracker
	err := query.Preload("StudentTraining").
		Preload("StudentTraining.StudentEnroll").
		Preload("StudentTraining.StudentEnroll.Student").
		Preload("StudentTraining.Company").
		Preload("Evaluator").
		Limit(limit).
		Offset(offset).
		Find(&evaluations).Error
	
	return evaluations, err
}

// GetOverdueEvaluations gets all overdue evaluations
func (s *EvaluationService) GetOverdueEvaluations() ([]models.EvaluationStatusTracker, error) {
	return models.GetOverdueEvaluations(s.db)
}

// GetEvaluationStats gets evaluation statistics
func (s *EvaluationService) GetEvaluationStats() (map[string]interface{}, error) {
	return models.GetEvaluationStats(s.db)
}

// CheckStudentEvaluationStatus checks if a student has completed company evaluation
func (s *EvaluationService) CheckStudentEvaluationStatus(studentTrainingID uint) (bool, *time.Time, error) {
	// Check if student evaluation exists
	var evaluation models.StudentEvaluateCompany
	err := s.db.Where("student_training_id = ?", studentTrainingID).First(&evaluation).Error
	
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, nil, nil
		}
		return false, nil, err
	}

	return true, &evaluation.CreatedAt, nil
}

// GetInstructorAssignments gets instructor assignments for evaluation
func (s *EvaluationService) GetInstructorAssignments(instructorID uint) ([]models.EvaluationStatusTracker, error) {
	var evaluations []models.EvaluationStatusTracker
	err := s.db.Where("evaluator_id = ?", instructorID).
		Preload("StudentTraining").
		Preload("StudentTraining.StudentEnroll").
		Preload("StudentTraining.StudentEnroll.Student").
		Preload("StudentTraining.Company").
		Find(&evaluations).Error
	
	return evaluations, err
}

// UpdateOverdueEvaluations updates evaluations that are past due date
func (s *EvaluationService) UpdateOverdueEvaluations() error {
	return s.db.Model(&models.EvaluationStatusTracker{}).
		Where("due_date < ? AND status NOT IN (?)", time.Now(), []models.EvaluationStatus{
			models.EvalStatusCompleted,
			models.EvalStatusOverdue,
		}).
		Update("status", models.EvalStatusOverdue).Error
}

// determineOverallStatus determines the overall status based on individual evaluations
func (s *EvaluationService) determineOverallStatus(evaluations []models.EvaluationStatusTracker) string {
	if len(evaluations) == 0 {
		return "no_evaluations"
	}

	completedCount := 0
	overdueCount := 0
	inProgressCount := 0

	for _, eval := range evaluations {
		switch eval.Status {
		case models.EvalStatusCompleted:
			completedCount++
		case models.EvalStatusOverdue:
			overdueCount++
		case models.EvalStatusInProgress:
			inProgressCount++
		}
	}

	if completedCount == len(evaluations) {
		return "all_completed"
	}
	
	if overdueCount > 0 {
		return "has_overdue"
	}
	
	if inProgressCount > 0 {
		return "in_progress"
	}
	
	return "pending"
}