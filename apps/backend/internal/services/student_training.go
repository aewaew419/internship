package services

import (
	"backend-go/internal/models"
	"database/sql"
	"errors"
	"time"

	"gorm.io/gorm"
)

// StudentTrainingService handles student training business logic
type StudentTrainingService struct {
	db *gorm.DB
}

// NewStudentTrainingService creates a new student training service
func NewStudentTrainingService(db *gorm.DB) *StudentTrainingService {
	return &StudentTrainingService{
		db: db,
	}
}

// StudentTrainingListRequest represents the request for listing student trainings
type StudentTrainingListRequest struct {
	Page            int    `json:"page"`
	Limit           int    `json:"limit"`
	Search          string `json:"search"`
	StudentEnrollID *uint  `json:"student_enroll_id"`
	CompanyID       *uint  `json:"company_id"`
	SortBy          string `json:"sort_by"`
	SortDesc        bool   `json:"sort_desc"`
}

// CreateStudentTrainingRequest represents the request for creating a student training
type CreateStudentTrainingRequest struct {
	StudentEnrollID          uint                         `json:"student_enroll_id" validate:"required"`
	StartDate                time.Time                    `json:"start_date" validate:"required"`
	EndDate                  time.Time                    `json:"end_date" validate:"required"`
	Coordinator              string                       `json:"coordinator" validate:"required"`
	CoordinatorPhoneNumber   string                       `json:"coordinator_phone_number"`
	CoordinatorEmail         string                       `json:"coordinator_email" validate:"omitempty,email"`
	Supervisor               string                       `json:"supervisor" validate:"required"`
	SupervisorPhoneNumber    string                       `json:"supervisor_phone_number"`
	SupervisorEmail          string                       `json:"supervisor_email" validate:"omitempty,email"`
	Department               string                       `json:"department" validate:"required"`
	Position                 string                       `json:"position" validate:"required"`
	JobDescription           string                       `json:"job_description"`
	DocumentLanguage         models.DocumentLanguage      `json:"document_language" validate:"omitempty,oneof=th en"`
	CompanyID                *uint                        `json:"company_id"`
}

// UpdateStudentTrainingRequest represents the request for updating a student training
type UpdateStudentTrainingRequest struct {
	StartDate                *time.Time                   `json:"start_date"`
	EndDate                  *time.Time                   `json:"end_date"`
	Coordinator              *string                      `json:"coordinator"`
	CoordinatorPhoneNumber   *string                      `json:"coordinator_phone_number"`
	CoordinatorEmail         *string                      `json:"coordinator_email" validate:"omitempty,email"`
	Supervisor               *string                      `json:"supervisor"`
	SupervisorPhoneNumber    *string                      `json:"supervisor_phone_number"`
	SupervisorEmail          *string                      `json:"supervisor_email" validate:"omitempty,email"`
	Department               *string                      `json:"department"`
	Position                 *string                      `json:"position"`
	JobDescription           *string                      `json:"job_description"`
	DocumentLanguage         *models.DocumentLanguage     `json:"document_language" validate:"omitempty,oneof=th en"`
	CompanyID                *uint                        `json:"company_id"`
}

// StudentTrainingListResponse represents the response for listing student trainings
type StudentTrainingListResponse struct {
	Data       []models.StudentTraining `json:"data"`
	Total      int64                    `json:"total"`
	Page       int                      `json:"page"`
	Limit      int                      `json:"limit"`
	TotalPages int                      `json:"total_pages"`
}

// StudentTrainingStatsResponse represents student training statistics
type StudentTrainingStatsResponse struct {
	TotalTrainings     int64 `json:"total_trainings"`
	ActiveTrainings    int64 `json:"active_trainings"`
	CompletedTrainings int64 `json:"completed_trainings"`
	TotalCompanies     int64 `json:"total_companies"`
	AverageRating      float64 `json:"average_rating"`
}

// GetStudentTrainings retrieves student trainings with pagination and filtering
func (s *StudentTrainingService) GetStudentTrainings(req StudentTrainingListRequest) (*StudentTrainingListResponse, error) {
	var trainings []models.StudentTraining
	var total int64

	// Build query
	query := s.db.Model(&models.StudentTraining{}).
		Preload("StudentEnroll").
		Preload("StudentEnroll.Student").
		Preload("StudentEnroll.CourseSection").
		Preload("Company")

	// Apply filters
	if req.StudentEnrollID != nil {
		query = query.Where("student_enroll_id = ?", *req.StudentEnrollID)
	}

	if req.CompanyID != nil {
		query = query.Where("company_id = ?", *req.CompanyID)
	}

	if req.Search != "" {
		query = query.Where("position ILIKE ? OR department ILIKE ? OR coordinator ILIKE ? OR supervisor ILIKE ?",
			"%"+req.Search+"%", "%"+req.Search+"%", "%"+req.Search+"%", "%"+req.Search+"%")
	}

	// Get total count
	if err := query.Count(&total).Error; err != nil {
		return nil, err
	}

	// Apply sorting
	orderBy := "created_at DESC"
	if req.SortBy != "" {
		direction := "ASC"
		if req.SortDesc {
			direction = "DESC"
		}
		orderBy = req.SortBy + " " + direction
	}
	query = query.Order(orderBy)

	// Apply pagination
	offset := (req.Page - 1) * req.Limit
	if err := query.Offset(offset).Limit(req.Limit).Find(&trainings).Error; err != nil {
		return nil, err
	}

	totalPages := int((total + int64(req.Limit) - 1) / int64(req.Limit))

	return &StudentTrainingListResponse{
		Data:       trainings,
		Total:      total,
		Page:       req.Page,
		Limit:      req.Limit,
		TotalPages: totalPages,
	}, nil
}

// GetStudentTrainingByID retrieves a student training by ID
func (s *StudentTrainingService) GetStudentTrainingByID(id uint) (*models.StudentTraining, error) {
	var training models.StudentTraining
	err := s.db.Preload("StudentEnroll").
		Preload("StudentEnroll.Student").
		Preload("StudentEnroll.CourseSection").
		Preload("Company").
		Preload("StudentEvaluateCompany").
		Preload("VisitorEvaluateCompany").
		First(&training, id).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("student training not found")
		}
		return nil, err
	}

	return &training, nil
}

// CreateStudentTraining creates a new student training
func (s *StudentTrainingService) CreateStudentTraining(req CreateStudentTrainingRequest) (*models.StudentTraining, error) {
	// Check if student enrollment exists
	var studentEnroll models.StudentEnroll
	if err := s.db.First(&studentEnroll, req.StudentEnrollID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("student enrollment not found")
		}
		return nil, err
	}

	// Check if company exists (if provided)
	if req.CompanyID != nil {
		var company models.Company
		if err := s.db.First(&company, *req.CompanyID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errors.New("company not found")
			}
			return nil, err
		}
	}

	// Check if student training already exists for this enrollment
	var existingTraining models.StudentTraining
	if err := s.db.Where("student_enroll_id = ?", req.StudentEnrollID).First(&existingTraining).Error; err == nil {
		return nil, errors.New("student training already exists for this enrollment")
	}

	// Set default document language if not provided
	documentLanguage := req.DocumentLanguage
	if documentLanguage == "" {
		documentLanguage = models.DocumentLanguageTH
	}

	// Create student training
	training := &models.StudentTraining{
		StudentEnrollID:          req.StudentEnrollID,
		StartDate:                req.StartDate,
		EndDate:                  req.EndDate,
		Coordinator:              req.Coordinator,
		CoordinatorPhoneNumber:   req.CoordinatorPhoneNumber,
		CoordinatorEmail:         req.CoordinatorEmail,
		Supervisor:               req.Supervisor,
		SupervisorPhoneNumber:    req.SupervisorPhoneNumber,
		SupervisorEmail:          req.SupervisorEmail,
		Department:               req.Department,
		Position:                 req.Position,
		JobDescription:           req.JobDescription,
		DocumentLanguage:         documentLanguage,
		CompanyID:                req.CompanyID,
	}

	if err := s.db.Create(training).Error; err != nil {
		return nil, err
	}

	// Load relationships
	if err := s.db.Preload("StudentEnroll").
		Preload("StudentEnroll.Student").
		Preload("Company").
		First(training, training.ID).Error; err != nil {
		return nil, err
	}

	return training, nil
}

// UpdateStudentTraining updates an existing student training
func (s *StudentTrainingService) UpdateStudentTraining(id uint, req UpdateStudentTrainingRequest) (*models.StudentTraining, error) {
	var training models.StudentTraining
	if err := s.db.First(&training, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("student training not found")
		}
		return nil, err
	}

	// Check if company exists (if provided)
	if req.CompanyID != nil {
		var company models.Company
		if err := s.db.First(&company, *req.CompanyID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errors.New("company not found")
			}
			return nil, err
		}
	}

	// Update fields
	if req.StartDate != nil {
		training.StartDate = *req.StartDate
	}
	if req.EndDate != nil {
		training.EndDate = *req.EndDate
	}
	if req.Coordinator != nil {
		training.Coordinator = *req.Coordinator
	}
	if req.CoordinatorPhoneNumber != nil {
		training.CoordinatorPhoneNumber = *req.CoordinatorPhoneNumber
	}
	if req.CoordinatorEmail != nil {
		training.CoordinatorEmail = *req.CoordinatorEmail
	}
	if req.Supervisor != nil {
		training.Supervisor = *req.Supervisor
	}
	if req.SupervisorPhoneNumber != nil {
		training.SupervisorPhoneNumber = *req.SupervisorPhoneNumber
	}
	if req.SupervisorEmail != nil {
		training.SupervisorEmail = *req.SupervisorEmail
	}
	if req.Department != nil {
		training.Department = *req.Department
	}
	if req.Position != nil {
		training.Position = *req.Position
	}
	if req.JobDescription != nil {
		training.JobDescription = *req.JobDescription
	}
	if req.DocumentLanguage != nil {
		training.DocumentLanguage = *req.DocumentLanguage
	}
	if req.CompanyID != nil {
		training.CompanyID = req.CompanyID
	}

	if err := s.db.Save(&training).Error; err != nil {
		return nil, err
	}

	// Load relationships
	if err := s.db.Preload("StudentEnroll").
		Preload("StudentEnroll.Student").
		Preload("Company").
		First(&training, training.ID).Error; err != nil {
		return nil, err
	}

	return &training, nil
}

// DeleteStudentTraining deletes a student training
func (s *StudentTrainingService) DeleteStudentTraining(id uint) error {
	var training models.StudentTraining
	if err := s.db.First(&training, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("student training not found")
		}
		return err
	}

	return s.db.Delete(&training).Error
}

// GetStudentTrainingStats retrieves student training statistics
func (s *StudentTrainingService) GetStudentTrainingStats() (*StudentTrainingStatsResponse, error) {
	var stats StudentTrainingStatsResponse

	// Total trainings
	if err := s.db.Model(&models.StudentTraining{}).Count(&stats.TotalTrainings).Error; err != nil {
		return nil, err
	}

	// Active trainings (ongoing)
	now := time.Now()
	if err := s.db.Model(&models.StudentTraining{}).
		Where("start_date <= ? AND end_date >= ?", now, now).
		Count(&stats.ActiveTrainings).Error; err != nil {
		return nil, err
	}

	// Completed trainings
	if err := s.db.Model(&models.StudentTraining{}).
		Where("end_date < ?", now).
		Count(&stats.CompletedTrainings).Error; err != nil {
		return nil, err
	}

	// Total companies with trainings
	if err := s.db.Model(&models.StudentTraining{}).
		Distinct("company_id").
		Where("company_id IS NOT NULL").
		Count(&stats.TotalCompanies).Error; err != nil {
		return nil, err
	}

	// Average rating from student evaluations
	var avgRating sql.NullFloat64
	if err := s.db.Model(&models.StudentEvaluateCompany{}).
		Select("AVG(score)").
		Scan(&avgRating).Error; err != nil {
		return nil, err
	}
	if avgRating.Valid {
		stats.AverageRating = avgRating.Float64
	}

	return &stats, nil
}