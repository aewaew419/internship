package services

import (
	"errors"
	"fmt"
	"mime/multipart"
	"time"

	"backend-go/internal/models"
	"gorm.io/gorm"
)

// VisitorServiceInterface defines the interface for visitor service
type VisitorServiceInterface interface {
	// Visitor Training methods
	GetVisitorTrainings(req VisitorTrainingListRequest) (*VisitorTrainingListResponse, error)
	GetVisitorTrainingByID(id uint) (*models.VisitorTraining, error)
	CreateVisitorTraining(req CreateVisitorTrainingRequest) (*models.VisitorTraining, error)
	UpdateVisitorTraining(id uint, req UpdateVisitorTrainingRequest) (*models.VisitorTraining, error)
	DeleteVisitorTraining(id uint) error

	// Visitor Schedule methods
	GetVisitorSchedules(req VisitorScheduleListRequest) (*VisitorScheduleListResponse, error)
	GetVisitorScheduleByID(id uint) (*models.VisitorSchedule, error)
	CreateVisitorSchedule(req CreateVisitorScheduleRequest) (*models.VisitorSchedule, error)
	UpdateVisitorSchedule(id uint, req UpdateVisitorScheduleRequest) (*models.VisitorSchedule, error)
	DeleteVisitorSchedule(id uint) error

	// Visitor Evaluate Student methods
	GetVisitorEvaluateStudents(visitorTrainingID uint) ([]models.VisitorEvaluateStudent, error)
	GetVisitorEvaluateStudentByID(id uint) (*models.VisitorEvaluateStudent, error)
	CreateVisitorEvaluateStudent(req CreateVisitorEvaluateStudentRequest) (*models.VisitorEvaluateStudent, error)
	UpdateVisitorEvaluateStudent(id uint, req UpdateVisitorEvaluateStudentRequest) (*models.VisitorEvaluateStudent, error)
	DeleteVisitorEvaluateStudent(id uint) error

	// Visitor Evaluate Company methods
	GetVisitorEvaluateCompanies(visitorTrainingID uint) ([]models.VisitorEvaluateCompany, error)
	GetVisitorEvaluateCompanyByID(id uint) (*models.VisitorEvaluateCompany, error)
	CreateVisitorEvaluateCompany(req CreateVisitorEvaluateCompanyRequest) (*models.VisitorEvaluateCompany, error)
	UpdateVisitorEvaluateCompany(id uint, req UpdateVisitorEvaluateCompanyRequest) (*models.VisitorEvaluateCompany, error)
	DeleteVisitorEvaluateCompany(id uint) error

	// Visit Photo methods
	GetVisitPhotos(visitorScheduleID uint) ([]models.VisitsPicture, error)
	GetVisitPhotoByID(id uint) (*models.VisitsPicture, error)
	CreateVisitPhoto(visitorScheduleID uint, photoNo int, fileURL string) (*models.VisitsPicture, error)
	UpdateVisitPhoto(id uint, fileURL string) (*models.VisitsPicture, error)
	DeleteVisitPhoto(id uint) error
}

// VisitorService handles visitor management operations
type VisitorService struct {
	db *gorm.DB
}

// NewVisitorService creates a new visitor service instance
func NewVisitorService(db *gorm.DB) *VisitorService {
	return &VisitorService{
		db: db,
	}
}

// Request/Response types
type VisitorTrainingListRequest struct {
	Page                int    `json:"page"`
	Limit               int    `json:"limit"`
	Search              string `json:"search"`
	StudentEnrollID     *uint  `json:"student_enroll_id"`
	VisitorInstructorID *uint  `json:"visitor_instructor_id"`
	SortBy              string `json:"sort_by"`
	SortDesc            bool   `json:"sort_desc"`
}

type VisitorTrainingListResponse struct {
	Data       []models.VisitorTraining `json:"data"`
	Total      int64                    `json:"total"`
	Page       int                      `json:"page"`
	Limit      int                      `json:"limit"`
	TotalPages int                      `json:"total_pages"`
}

type CreateVisitorTrainingRequest struct {
	StudentEnrollID     uint `json:"student_enroll_id" validate:"required"`
	VisitorInstructorID uint `json:"visitor_instructor_id" validate:"required"`
}

type UpdateVisitorTrainingRequest struct {
	VisitorInstructorID *uint `json:"visitor_instructor_id"`
}

type VisitorScheduleListRequest struct {
	Page              int    `json:"page"`
	Limit             int    `json:"limit"`
	VisitorTrainingID *uint  `json:"visitor_training_id"`
	VisitNo           *int   `json:"visit_no"`
	SortBy            string `json:"sort_by"`
	SortDesc          bool   `json:"sort_desc"`
}

type VisitorScheduleListResponse struct {
	Data       []models.VisitorSchedule `json:"data"`
	Total      int64                    `json:"total"`
	Page       int                      `json:"page"`
	Limit      int                      `json:"limit"`
	TotalPages int                      `json:"total_pages"`
}

type CreateVisitorScheduleRequest struct {
	VisitorTrainingID uint       `json:"visitor_training_id" validate:"required"`
	VisitNo           int        `json:"visit_no" validate:"required,min=1,max=4"`
	VisitAt           *time.Time `json:"visit_at"`
	Comment           *string    `json:"comment"`
}

type UpdateVisitorScheduleRequest struct {
	VisitAt *time.Time `json:"visit_at"`
	Comment *string    `json:"comment"`
}

type CreateVisitorEvaluateStudentRequest struct {
	VisitorTrainingID uint   `json:"visitor_training_id" validate:"required"`
	Score             int    `json:"score" validate:"required,min=0,max=100"`
	Questions         string `json:"questions" validate:"required"`
	Comment           string `json:"comment" validate:"required"`
}

type UpdateVisitorEvaluateStudentRequest struct {
	Score     *int    `json:"score" validate:"omitempty,min=0,max=100"`
	Questions *string `json:"questions"`
	Comment   *string `json:"comment"`
}

type CreateVisitorEvaluateCompanyRequest struct {
	VisitorTrainingID uint   `json:"visitor_training_id" validate:"required"`
	StudentTrainingID *uint  `json:"student_training_id"`
	Score             int    `json:"score" validate:"required,min=0,max=100"`
	Questions         string `json:"questions" validate:"required"`
	Comment           string `json:"comment" validate:"required"`
}

type UpdateVisitorEvaluateCompanyRequest struct {
	StudentTrainingID *uint   `json:"student_training_id"`
	Score             *int    `json:"score" validate:"omitempty,min=0,max=100"`
	Questions         *string `json:"questions"`
	Comment           *string `json:"comment"`
}

type UploadVisitPhotoRequest struct {
	VisitorScheduleID uint                  `json:"visitor_schedule_id" validate:"required"`
	PhotoNo           int                   `json:"photo_no" validate:"required,min=1"`
	File              *multipart.FileHeader `json:"file" validate:"required"`
}

// Visitor Training methods
func (s *VisitorService) GetVisitorTrainings(req VisitorTrainingListRequest) (*VisitorTrainingListResponse, error) {
	var trainings []models.VisitorTraining
	var total int64

	query := s.db.Model(&models.VisitorTraining{}).
		Preload("StudentEnroll.Student.User").
		Preload("StudentEnroll.CourseSection.Course").
		Preload("Visitor.User").
		Preload("Schedules").
		Preload("EvaluateStudent").
		Preload("EvaluateCompany")

	if req.StudentEnrollID != nil {
		query = query.Where("student_enroll_id = ?", *req.StudentEnrollID)
	}
	if req.VisitorInstructorID != nil {
		query = query.Where("visitor_instructor_id = ?", *req.VisitorInstructorID)
	}

	if req.Search != "" {
		searchTerm := "%" + req.Search + "%"
		query = query.Joins("JOIN student_enrolls ON visitor_trainings.student_enroll_id = student_enrolls.id").
			Joins("JOIN students ON student_enrolls.student_id = students.id").
			Joins("JOIN users ON students.user_id = users.id").
			Where("users.name LIKE ? OR users.email LIKE ? OR students.student_id LIKE ?",
				searchTerm, searchTerm, searchTerm)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count visitor trainings: %w", err)
	}

	sortBy := "created_at"
	if req.SortBy != "" {
		allowedSortFields := []string{"id", "created_at", "updated_at"}
		for _, field := range allowedSortFields {
			if req.SortBy == field {
				sortBy = req.SortBy
				break
			}
		}
	}

	sortOrder := "ASC"
	if req.SortDesc {
		sortOrder = "DESC"
	}
	query = query.Order(fmt.Sprintf("%s %s", sortBy, sortOrder))

	if req.Limit <= 0 {
		req.Limit = 10
	}
	if req.Limit > 100 {
		req.Limit = 100
	}
	if req.Page <= 0 {
		req.Page = 1
	}

	offset := (req.Page - 1) * req.Limit
	if err := query.Offset(offset).Limit(req.Limit).Find(&trainings).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch visitor trainings: %w", err)
	}

	totalPages := int((total + int64(req.Limit) - 1) / int64(req.Limit))

	return &VisitorTrainingListResponse{
		Data:       trainings,
		Total:      total,
		Page:       req.Page,
		Limit:      req.Limit,
		TotalPages: totalPages,
	}, nil
}

func (s *VisitorService) GetVisitorTrainingByID(id uint) (*models.VisitorTraining, error) {
	var training models.VisitorTraining
	err := s.db.Preload("StudentEnroll.Student.User").
		Preload("StudentEnroll.CourseSection.Course").
		Preload("Visitor.User").
		Preload("Schedules.Photos").
		Preload("EvaluateStudent").
		Preload("EvaluateCompany").
		First(&training, id).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("visitor training not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	return &training, nil
}

func (s *VisitorService) CreateVisitorTraining(req CreateVisitorTrainingRequest) (*models.VisitorTraining, error) {
	var studentEnroll models.StudentEnroll
	if err := s.db.First(&studentEnroll, req.StudentEnrollID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("student enrollment not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	var instructor models.Instructor
	if err := s.db.First(&instructor, req.VisitorInstructorID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("visitor instructor not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	var existingTraining models.VisitorTraining
	if err := s.db.Where("student_enroll_id = ?", req.StudentEnrollID).First(&existingTraining).Error; err == nil {
		return nil, errors.New("visitor training already exists for this student enrollment")
	}

	training := models.VisitorTraining{
		StudentEnrollID:     req.StudentEnrollID,
		VisitorInstructorID: req.VisitorInstructorID,
	}

	if err := s.db.Create(&training).Error; err != nil {
		return nil, fmt.Errorf("failed to create visitor training: %w", err)
	}

	return s.GetVisitorTrainingByID(training.ID)
}

func (s *VisitorService) UpdateVisitorTraining(id uint, req UpdateVisitorTrainingRequest) (*models.VisitorTraining, error) {
	var training models.VisitorTraining
	if err := s.db.First(&training, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("visitor training not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	if req.VisitorInstructorID != nil {
		var instructor models.Instructor
		if err := s.db.First(&instructor, *req.VisitorInstructorID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errors.New("visitor instructor not found")
			}
			return nil, fmt.Errorf("database error: %w", err)
		}
		training.VisitorInstructorID = *req.VisitorInstructorID
	}

	if err := s.db.Save(&training).Error; err != nil {
		return nil, fmt.Errorf("failed to update visitor training: %w", err)
	}

	return s.GetVisitorTrainingByID(training.ID)
}

func (s *VisitorService) DeleteVisitorTraining(id uint) error {
	var training models.VisitorTraining
	if err := s.db.First(&training, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("visitor training not found")
		}
		return fmt.Errorf("database error: %w", err)
	}

	if err := s.db.Delete(&training).Error; err != nil {
		return fmt.Errorf("failed to delete visitor training: %w", err)
	}

	return nil
}

// Visitor Schedule methods
func (s *VisitorService) GetVisitorSchedules(req VisitorScheduleListRequest) (*VisitorScheduleListResponse, error) {
	var schedules []models.VisitorSchedule
	var total int64

	query := s.db.Model(&models.VisitorSchedule{}).
		Preload("Training.StudentEnroll.Student.User").
		Preload("Training.Visitor.User").
		Preload("Photos")

	if req.VisitorTrainingID != nil {
		query = query.Where("visitor_training_id = ?", *req.VisitorTrainingID)
	}
	if req.VisitNo != nil {
		query = query.Where("visit_no = ?", *req.VisitNo)
	}

	if err := query.Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count visitor schedules: %w", err)
	}

	sortBy := "visit_no"
	if req.SortBy != "" {
		allowedSortFields := []string{"id", "visit_no", "visit_at", "created_at", "updated_at"}
		for _, field := range allowedSortFields {
			if req.SortBy == field {
				sortBy = req.SortBy
				break
			}
		}
	}

	sortOrder := "ASC"
	if req.SortDesc {
		sortOrder = "DESC"
	}
	query = query.Order(fmt.Sprintf("%s %s", sortBy, sortOrder))

	if req.Limit <= 0 {
		req.Limit = 10
	}
	if req.Limit > 100 {
		req.Limit = 100
	}
	if req.Page <= 0 {
		req.Page = 1
	}

	offset := (req.Page - 1) * req.Limit
	if err := query.Offset(offset).Limit(req.Limit).Find(&schedules).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch visitor schedules: %w", err)
	}

	totalPages := int((total + int64(req.Limit) - 1) / int64(req.Limit))

	return &VisitorScheduleListResponse{
		Data:       schedules,
		Total:      total,
		Page:       req.Page,
		Limit:      req.Limit,
		TotalPages: totalPages,
	}, nil
}

func (s *VisitorService) GetVisitorScheduleByID(id uint) (*models.VisitorSchedule, error) {
	var schedule models.VisitorSchedule
	err := s.db.Preload("Training.StudentEnroll.Student.User").
		Preload("Training.Visitor.User").
		Preload("Photos").
		First(&schedule, id).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("visitor schedule not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	return &schedule, nil
}

func (s *VisitorService) CreateVisitorSchedule(req CreateVisitorScheduleRequest) (*models.VisitorSchedule, error) {
	// Verify visitor training exists
	var training models.VisitorTraining
	if err := s.db.First(&training, req.VisitorTrainingID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("visitor training not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Check if schedule with same visit_no already exists for this training
	var existingSchedule models.VisitorSchedule
	if err := s.db.Where("visitor_training_id = ? AND visit_no = ?", req.VisitorTrainingID, req.VisitNo).First(&existingSchedule).Error; err == nil {
		return nil, errors.New("visitor schedule with this visit number already exists for this training")
	}

	schedule := models.VisitorSchedule{
		VisitorTrainingID: req.VisitorTrainingID,
		VisitNo:           req.VisitNo,
		VisitAt:           req.VisitAt,
		Comment:           req.Comment,
	}

	if err := s.db.Create(&schedule).Error; err != nil {
		return nil, fmt.Errorf("failed to create visitor schedule: %w", err)
	}

	return s.GetVisitorScheduleByID(schedule.ID)
}

func (s *VisitorService) UpdateVisitorSchedule(id uint, req UpdateVisitorScheduleRequest) (*models.VisitorSchedule, error) {
	var schedule models.VisitorSchedule
	if err := s.db.First(&schedule, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("visitor schedule not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	if req.VisitAt != nil {
		schedule.VisitAt = req.VisitAt
	}
	if req.Comment != nil {
		schedule.Comment = req.Comment
	}

	if err := s.db.Save(&schedule).Error; err != nil {
		return nil, fmt.Errorf("failed to update visitor schedule: %w", err)
	}

	return s.GetVisitorScheduleByID(schedule.ID)
}

func (s *VisitorService) DeleteVisitorSchedule(id uint) error {
	var schedule models.VisitorSchedule
	if err := s.db.First(&schedule, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("visitor schedule not found")
		}
		return fmt.Errorf("database error: %w", err)
	}

	if err := s.db.Delete(&schedule).Error; err != nil {
		return fmt.Errorf("failed to delete visitor schedule: %w", err)
	}

	return nil
}

// Visitor Evaluate Student methods
func (s *VisitorService) GetVisitorEvaluateStudents(visitorTrainingID uint) ([]models.VisitorEvaluateStudent, error) {
	var evaluations []models.VisitorEvaluateStudent
	err := s.db.Where("visitor_training_id = ?", visitorTrainingID).
		Preload("Training.StudentEnroll.Student.User").
		Preload("Training.Visitor.User").
		Find(&evaluations).Error

	if err != nil {
		return nil, fmt.Errorf("failed to fetch visitor evaluate students: %w", err)
	}

	return evaluations, nil
}

func (s *VisitorService) GetVisitorEvaluateStudentByID(id uint) (*models.VisitorEvaluateStudent, error) {
	var evaluation models.VisitorEvaluateStudent
	err := s.db.Preload("Training.StudentEnroll.Student.User").
		Preload("Training.Visitor.User").
		First(&evaluation, id).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("visitor evaluate student not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	return &evaluation, nil
}

func (s *VisitorService) CreateVisitorEvaluateStudent(req CreateVisitorEvaluateStudentRequest) (*models.VisitorEvaluateStudent, error) {
	// Verify visitor training exists
	var training models.VisitorTraining
	if err := s.db.First(&training, req.VisitorTrainingID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("visitor training not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	evaluation := models.VisitorEvaluateStudent{
		VisitorTrainingID: req.VisitorTrainingID,
		Score:             req.Score,
		Questions:         req.Questions,
		Comment:           req.Comment,
	}

	if err := s.db.Create(&evaluation).Error; err != nil {
		return nil, fmt.Errorf("failed to create visitor evaluate student: %w", err)
	}

	return s.GetVisitorEvaluateStudentByID(evaluation.ID)
}

func (s *VisitorService) UpdateVisitorEvaluateStudent(id uint, req UpdateVisitorEvaluateStudentRequest) (*models.VisitorEvaluateStudent, error) {
	var evaluation models.VisitorEvaluateStudent
	if err := s.db.First(&evaluation, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("visitor evaluate student not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	if req.Score != nil {
		evaluation.Score = *req.Score
	}
	if req.Questions != nil {
		evaluation.Questions = *req.Questions
	}
	if req.Comment != nil {
		evaluation.Comment = *req.Comment
	}

	if err := s.db.Save(&evaluation).Error; err != nil {
		return nil, fmt.Errorf("failed to update visitor evaluate student: %w", err)
	}

	return s.GetVisitorEvaluateStudentByID(evaluation.ID)
}

func (s *VisitorService) DeleteVisitorEvaluateStudent(id uint) error {
	var evaluation models.VisitorEvaluateStudent
	if err := s.db.First(&evaluation, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("visitor evaluate student not found")
		}
		return fmt.Errorf("database error: %w", err)
	}

	if err := s.db.Delete(&evaluation).Error; err != nil {
		return fmt.Errorf("failed to delete visitor evaluate student: %w", err)
	}

	return nil
}

// Visitor Evaluate Company methods
func (s *VisitorService) GetVisitorEvaluateCompanies(visitorTrainingID uint) ([]models.VisitorEvaluateCompany, error) {
	var evaluations []models.VisitorEvaluateCompany
	err := s.db.Where("visitor_training_id = ?", visitorTrainingID).
		Preload("VisitorTraining.StudentEnroll.Student.User").
		Preload("VisitorTraining.Visitor.User").
		Preload("StudentTraining").
		Find(&evaluations).Error

	if err != nil {
		return nil, fmt.Errorf("failed to fetch visitor evaluate companies: %w", err)
	}

	return evaluations, nil
}

func (s *VisitorService) GetVisitorEvaluateCompanyByID(id uint) (*models.VisitorEvaluateCompany, error) {
	var evaluation models.VisitorEvaluateCompany
	err := s.db.Preload("VisitorTraining.StudentEnroll.Student.User").
		Preload("VisitorTraining.Visitor.User").
		Preload("StudentTraining").
		First(&evaluation, id).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("visitor evaluate company not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	return &evaluation, nil
}

func (s *VisitorService) CreateVisitorEvaluateCompany(req CreateVisitorEvaluateCompanyRequest) (*models.VisitorEvaluateCompany, error) {
	// Verify visitor training exists
	var training models.VisitorTraining
	if err := s.db.First(&training, req.VisitorTrainingID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("visitor training not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Verify student training exists if provided
	if req.StudentTrainingID != nil {
		var studentTraining models.StudentTraining
		if err := s.db.First(&studentTraining, *req.StudentTrainingID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errors.New("student training not found")
			}
			return nil, fmt.Errorf("database error: %w", err)
		}
	}

	evaluation := models.VisitorEvaluateCompany{
		VisitorTrainingID: req.VisitorTrainingID,
		StudentTrainingID: req.StudentTrainingID,
		Score:             req.Score,
		Questions:         req.Questions,
		Comment:           req.Comment,
	}

	if err := s.db.Create(&evaluation).Error; err != nil {
		return nil, fmt.Errorf("failed to create visitor evaluate company: %w", err)
	}

	return s.GetVisitorEvaluateCompanyByID(evaluation.ID)
}

func (s *VisitorService) UpdateVisitorEvaluateCompany(id uint, req UpdateVisitorEvaluateCompanyRequest) (*models.VisitorEvaluateCompany, error) {
	var evaluation models.VisitorEvaluateCompany
	if err := s.db.First(&evaluation, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("visitor evaluate company not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	if req.StudentTrainingID != nil {
		var studentTraining models.StudentTraining
		if err := s.db.First(&studentTraining, *req.StudentTrainingID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errors.New("student training not found")
			}
			return nil, fmt.Errorf("database error: %w", err)
		}
		evaluation.StudentTrainingID = req.StudentTrainingID
	}

	if req.Score != nil {
		evaluation.Score = *req.Score
	}
	if req.Questions != nil {
		evaluation.Questions = *req.Questions
	}
	if req.Comment != nil {
		evaluation.Comment = *req.Comment
	}

	if err := s.db.Save(&evaluation).Error; err != nil {
		return nil, fmt.Errorf("failed to update visitor evaluate company: %w", err)
	}

	return s.GetVisitorEvaluateCompanyByID(evaluation.ID)
}

func (s *VisitorService) DeleteVisitorEvaluateCompany(id uint) error {
	var evaluation models.VisitorEvaluateCompany
	if err := s.db.First(&evaluation, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("visitor evaluate company not found")
		}
		return fmt.Errorf("database error: %w", err)
	}

	if err := s.db.Delete(&evaluation).Error; err != nil {
		return fmt.Errorf("failed to delete visitor evaluate company: %w", err)
	}

	return nil
}

// Visit Photo methods
func (s *VisitorService) GetVisitPhotos(visitorScheduleID uint) ([]models.VisitsPicture, error) {
	var photos []models.VisitsPicture
	err := s.db.Where("visitor_schedule_id = ?", visitorScheduleID).
		Preload("Schedule.Training.StudentEnroll.Student.User").
		Order("photo_no ASC").
		Find(&photos).Error

	if err != nil {
		return nil, fmt.Errorf("failed to fetch visit photos: %w", err)
	}

	return photos, nil
}

func (s *VisitorService) GetVisitPhotoByID(id uint) (*models.VisitsPicture, error) {
	var photo models.VisitsPicture
	err := s.db.Preload("Schedule.Training.StudentEnroll.Student.User").
		First(&photo, id).Error

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("visit photo not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	return &photo, nil
}

func (s *VisitorService) CreateVisitPhoto(visitorScheduleID uint, photoNo int, fileURL string) (*models.VisitsPicture, error) {
	// Verify visitor schedule exists
	var schedule models.VisitorSchedule
	if err := s.db.First(&schedule, visitorScheduleID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("visitor schedule not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Check if photo with same photo_no already exists for this schedule
	var existingPhoto models.VisitsPicture
	if err := s.db.Where("visitor_schedule_id = ? AND photo_no = ?", visitorScheduleID, photoNo).First(&existingPhoto).Error; err == nil {
		return nil, errors.New("photo with this number already exists for this schedule")
	}

	photo := models.VisitsPicture{
		VisitorScheduleID: visitorScheduleID,
		PhotoNo:           photoNo,
		FileURL:           fileURL,
	}

	if err := s.db.Create(&photo).Error; err != nil {
		return nil, fmt.Errorf("failed to create visit photo: %w", err)
	}

	return s.GetVisitPhotoByID(photo.ID)
}

func (s *VisitorService) UpdateVisitPhoto(id uint, fileURL string) (*models.VisitsPicture, error) {
	var photo models.VisitsPicture
	if err := s.db.First(&photo, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("visit photo not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	photo.FileURL = fileURL

	if err := s.db.Save(&photo).Error; err != nil {
		return nil, fmt.Errorf("failed to update visit photo: %w", err)
	}

	return s.GetVisitPhotoByID(photo.ID)
}

func (s *VisitorService) DeleteVisitPhoto(id uint) error {
	var photo models.VisitsPicture
	if err := s.db.First(&photo, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("visit photo not found")
		}
		return fmt.Errorf("database error: %w", err)
	}

	if err := s.db.Delete(&photo).Error; err != nil {
		return fmt.Errorf("failed to delete visit photo: %w", err)
	}

	return nil
}