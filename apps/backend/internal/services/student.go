package services

import (
	"errors"
	"fmt"

	"backend-go/internal/models"
	"gorm.io/gorm"
)

// StudentService handles student management operations
type StudentService struct {
	db *gorm.DB
}

// NewStudentService creates a new student service instance
func NewStudentService(db *gorm.DB) *StudentService {
	return &StudentService{
		db: db,
	}
}

// StudentListRequest represents the request for listing students
type StudentListRequest struct {
	Page       int    `json:"page"`
	Limit      int    `json:"limit"`
	Search     string `json:"search"`
	MajorID    *uint  `json:"major_id"`
	ProgramID  *uint  `json:"program_id"`
	FacultyID  *uint  `json:"faculty_id"`
	CampusID   *uint  `json:"campus_id"`
	SortBy     string `json:"sort_by"`
	SortDesc   bool   `json:"sort_desc"`
}

// StudentListResponse represents the response for listing students
type StudentListResponse struct {
	Data       []models.Student `json:"data"`
	Total      int64            `json:"total"`
	Page       int              `json:"page"`
	Limit      int              `json:"limit"`
	TotalPages int              `json:"total_pages"`
}

// CreateStudentRequest represents the request for creating a student
type CreateStudentRequest struct {
	Name         string  `json:"name" validate:"required"`
	MiddleName   string  `json:"middle_name"`
	Surname      string  `json:"surname" validate:"required"`
	StudentID    string  `json:"student_id" validate:"required"`
	GPAX         float64 `json:"gpax"`
	PhoneNumber  string  `json:"phone_number"`
	Email        string  `json:"email" validate:"omitempty,email"`
	Picture      string  `json:"picture"`
	MajorID      *uint   `json:"major_id"`
	ProgramID    *uint   `json:"program_id"`
	CurriculumID *uint   `json:"curriculum_id"`
	FacultyID    *uint   `json:"faculty_id"`
	CampusID     uint    `json:"campus_id" validate:"required"`
}

// UpdateStudentRequest represents the request for updating a student
type UpdateStudentRequest struct {
	Name         *string  `json:"name"`
	MiddleName   *string  `json:"middle_name"`
	Surname      *string  `json:"surname"`
	StudentID    *string  `json:"student_id"`
	GPAX         *float64 `json:"gpax"`
	PhoneNumber  *string  `json:"phone_number"`
	Email        *string  `json:"email" validate:"omitempty,email"`
	Picture      *string  `json:"picture"`
	MajorID      *uint    `json:"major_id"`
	ProgramID    *uint    `json:"program_id"`
	CurriculumID *uint    `json:"curriculum_id"`
	FacultyID    *uint    `json:"faculty_id"`
	CampusID     *uint    `json:"campus_id"`
}

// StudentEnrollmentRequest represents the request for student enrollment
type StudentEnrollmentRequest struct {
	StudentID       uint   `json:"student_id" validate:"required"`
	CourseSectionID uint   `json:"course_section_id" validate:"required"`
	Status          string `json:"status"`
}

// UpdateEnrollmentRequest represents the request for updating enrollment
type UpdateEnrollmentRequest struct {
	Status      *string  `json:"status"`
	Grade       *string  `json:"grade"`
	GradePoints *float64 `json:"grade_points"`
}

// GetStudents retrieves students with pagination, search, and filtering
func (s *StudentService) GetStudents(req StudentListRequest) (*StudentListResponse, error) {
	var students []models.Student
	var total int64

	// Build query with preloads
	query := s.db.Model(&models.Student{}).
		Preload("User").
		Preload("Major").
		Preload("Program").
		Preload("Curriculum").
		Preload("Faculty").
		Preload("Campus")

	// Apply search filter
	if req.Search != "" {
		searchTerm := "%" + req.Search + "%"
		query = query.Where("name LIKE ? OR surname LIKE ? OR student_id LIKE ? OR email LIKE ?", 
			searchTerm, searchTerm, searchTerm, searchTerm)
	}

	// Apply filters
	if req.MajorID != nil {
		query = query.Where("major_id = ?", *req.MajorID)
	}
	if req.ProgramID != nil {
		query = query.Where("program_id = ?", *req.ProgramID)
	}
	if req.FacultyID != nil {
		query = query.Where("faculty_id = ?", *req.FacultyID)
	}
	if req.CampusID != nil {
		query = query.Where("campus_id = ?", *req.CampusID)
	}

	// Count total records
	if err := query.Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count students: %w", err)
	}

	// Apply sorting
	sortBy := "created_at"
	if req.SortBy != "" {
		// Validate sort field to prevent SQL injection
		allowedSortFields := []string{"id", "name", "surname", "student_id", "gpax", "created_at", "updated_at"}
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

	// Apply pagination
	if req.Limit <= 0 {
		req.Limit = 10
	}
	if req.Limit > 100 {
		req.Limit = 100 // Max limit to prevent abuse
	}
	if req.Page <= 0 {
		req.Page = 1
	}

	offset := (req.Page - 1) * req.Limit
	if err := query.Offset(offset).Limit(req.Limit).Find(&students).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch students: %w", err)
	}

	totalPages := int((total + int64(req.Limit) - 1) / int64(req.Limit))

	return &StudentListResponse{
		Data:       students,
		Total:      total,
		Page:       req.Page,
		Limit:      req.Limit,
		TotalPages: totalPages,
	}, nil
}

// GetStudentByID retrieves a student by ID
func (s *StudentService) GetStudentByID(id uint) (*models.Student, error) {
	var student models.Student
	err := s.db.Preload("User").
		Preload("Major").
		Preload("Program").
		Preload("Curriculum").
		Preload("Faculty").
		Preload("Campus").
		Preload("StudentEnrolls.CourseSection.Course").
		First(&student, id).Error
	
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("student not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	return &student, nil
}

// CreateStudent creates a new student
func (s *StudentService) CreateStudent(req CreateStudentRequest) (*models.Student, error) {
	// Check if student ID already exists
	var existingStudent models.Student
	err := s.db.Where("student_id = ?", req.StudentID).First(&existingStudent).Error
	if err == nil {
		return nil, errors.New("student with this student ID already exists")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Validate campus exists
	var campus models.Campus
	err = s.db.First(&campus, req.CampusID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("invalid campus")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Validate optional foreign keys
	if req.MajorID != nil {
		var major models.Major
		err = s.db.First(&major, *req.MajorID).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errors.New("invalid major")
			}
			return nil, fmt.Errorf("database error: %w", err)
		}
	}

	if req.ProgramID != nil {
		var program models.Program
		err = s.db.First(&program, *req.ProgramID).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errors.New("invalid program")
			}
			return nil, fmt.Errorf("database error: %w", err)
		}
	}

	if req.CurriculumID != nil {
		var curriculum models.Curriculum
		err = s.db.First(&curriculum, *req.CurriculumID).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errors.New("invalid curriculum")
			}
			return nil, fmt.Errorf("database error: %w", err)
		}
	}

	if req.FacultyID != nil {
		var faculty models.Faculty
		err = s.db.First(&faculty, *req.FacultyID).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errors.New("invalid faculty")
			}
			return nil, fmt.Errorf("database error: %w", err)
		}
	}

	// Create new student
	student := models.Student{
		Name:         req.Name,
		MiddleName:   req.MiddleName,
		Surname:      req.Surname,
		StudentID:    req.StudentID,
		GPAX:         req.GPAX,
		PhoneNumber:  req.PhoneNumber,
		Email:        req.Email,
		Picture:      req.Picture,
		MajorID:      req.MajorID,
		ProgramID:    req.ProgramID,
		CurriculumID: req.CurriculumID,
		FacultyID:    req.FacultyID,
		CampusID:     req.CampusID,
	}

	err = s.db.Create(&student).Error
	if err != nil {
		return nil, fmt.Errorf("failed to create student: %w", err)
	}

	// Load relationships
	err = s.db.Preload("User").
		Preload("Major").
		Preload("Program").
		Preload("Curriculum").
		Preload("Faculty").
		Preload("Campus").
		First(&student, student.ID).Error
	if err != nil {
		return nil, fmt.Errorf("failed to load student data: %w", err)
	}

	return &student, nil
}

// UpdateStudent updates an existing student
func (s *StudentService) UpdateStudent(id uint, req UpdateStudentRequest) (*models.Student, error) {
	var student models.Student
	err := s.db.First(&student, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("student not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Check if student ID is being updated and if it already exists
	if req.StudentID != nil && *req.StudentID != student.StudentID {
		var existingStudent models.Student
		err := s.db.Where("student_id = ? AND id != ?", *req.StudentID, id).First(&existingStudent).Error
		if err == nil {
			return nil, errors.New("student with this student ID already exists")
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("database error: %w", err)
		}
	}

	// Validate optional foreign keys if being updated
	if req.CampusID != nil {
		var campus models.Campus
		err = s.db.First(&campus, *req.CampusID).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errors.New("invalid campus")
			}
			return nil, fmt.Errorf("database error: %w", err)
		}
	}

	if req.MajorID != nil {
		var major models.Major
		err = s.db.First(&major, *req.MajorID).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errors.New("invalid major")
			}
			return nil, fmt.Errorf("database error: %w", err)
		}
	}

	if req.ProgramID != nil {
		var program models.Program
		err = s.db.First(&program, *req.ProgramID).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errors.New("invalid program")
			}
			return nil, fmt.Errorf("database error: %w", err)
		}
	}

	if req.CurriculumID != nil {
		var curriculum models.Curriculum
		err = s.db.First(&curriculum, *req.CurriculumID).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errors.New("invalid curriculum")
			}
			return nil, fmt.Errorf("database error: %w", err)
		}
	}

	if req.FacultyID != nil {
		var faculty models.Faculty
		err = s.db.First(&faculty, *req.FacultyID).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errors.New("invalid faculty")
			}
			return nil, fmt.Errorf("database error: %w", err)
		}
	}

	// Update fields
	if req.Name != nil {
		student.Name = *req.Name
	}
	if req.MiddleName != nil {
		student.MiddleName = *req.MiddleName
	}
	if req.Surname != nil {
		student.Surname = *req.Surname
	}
	if req.StudentID != nil {
		student.StudentID = *req.StudentID
	}
	if req.GPAX != nil {
		student.GPAX = *req.GPAX
	}
	if req.PhoneNumber != nil {
		student.PhoneNumber = *req.PhoneNumber
	}
	if req.Email != nil {
		student.Email = *req.Email
	}
	if req.Picture != nil {
		student.Picture = *req.Picture
	}
	if req.MajorID != nil {
		student.MajorID = req.MajorID
	}
	if req.ProgramID != nil {
		student.ProgramID = req.ProgramID
	}
	if req.CurriculumID != nil {
		student.CurriculumID = req.CurriculumID
	}
	if req.FacultyID != nil {
		student.FacultyID = req.FacultyID
	}
	if req.CampusID != nil {
		student.CampusID = *req.CampusID
	}

	err = s.db.Save(&student).Error
	if err != nil {
		return nil, fmt.Errorf("failed to update student: %w", err)
	}

	// Load relationships
	err = s.db.Preload("User").
		Preload("Major").
		Preload("Program").
		Preload("Curriculum").
		Preload("Faculty").
		Preload("Campus").
		First(&student, student.ID).Error
	if err != nil {
		return nil, fmt.Errorf("failed to load student data: %w", err)
	}

	return &student, nil
}

// DeleteStudent deletes a student by ID
func (s *StudentService) DeleteStudent(id uint) error {
	var student models.Student
	err := s.db.First(&student, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("student not found")
		}
		return fmt.Errorf("database error: %w", err)
	}

	err = s.db.Delete(&student).Error
	if err != nil {
		return fmt.Errorf("failed to delete student: %w", err)
	}

	return nil
}

// EnrollStudent enrolls a student in a course section
func (s *StudentService) EnrollStudent(req StudentEnrollmentRequest) (*models.StudentEnroll, error) {
	// Check if student exists
	var student models.Student
	err := s.db.First(&student, req.StudentID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("student not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Check if course section exists
	var courseSection models.CourseSection
	err = s.db.First(&courseSection, req.CourseSectionID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("course section not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Check if student is already enrolled
	var existingEnrollment models.StudentEnroll
	err = s.db.Where("student_id = ? AND course_section_id = ?", req.StudentID, req.CourseSectionID).
		First(&existingEnrollment).Error
	if err == nil {
		return nil, errors.New("student is already enrolled in this course section")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Set default status if not provided
	status := req.Status
	if status == "" {
		status = "enrolled"
	}

	// Create enrollment
	enrollment := models.StudentEnroll{
		StudentID:       req.StudentID,
		CourseSectionID: req.CourseSectionID,
		Status:          status,
	}

	err = s.db.Create(&enrollment).Error
	if err != nil {
		return nil, fmt.Errorf("failed to enroll student: %w", err)
	}

	// Load relationships
	err = s.db.Preload("Student").
		Preload("CourseSection.Course").
		First(&enrollment, enrollment.ID).Error
	if err != nil {
		return nil, fmt.Errorf("failed to load enrollment data: %w", err)
	}

	return &enrollment, nil
}

// UpdateEnrollment updates a student enrollment
func (s *StudentService) UpdateEnrollment(enrollmentID uint, req UpdateEnrollmentRequest) (*models.StudentEnroll, error) {
	var enrollment models.StudentEnroll
	err := s.db.First(&enrollment, enrollmentID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("enrollment not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Update fields
	if req.Status != nil {
		enrollment.Status = *req.Status
	}
	if req.Grade != nil {
		enrollment.Grade = req.Grade
	}
	if req.GradePoints != nil {
		enrollment.GradePoints = req.GradePoints
	}

	err = s.db.Save(&enrollment).Error
	if err != nil {
		return nil, fmt.Errorf("failed to update enrollment: %w", err)
	}

	// Load relationships
	err = s.db.Preload("Student").
		Preload("CourseSection.Course").
		First(&enrollment, enrollment.ID).Error
	if err != nil {
		return nil, fmt.Errorf("failed to load enrollment data: %w", err)
	}

	return &enrollment, nil
}

// GetStudentEnrollments retrieves all enrollments for a student
func (s *StudentService) GetStudentEnrollments(studentID uint) ([]models.StudentEnroll, error) {
	// Check if student exists
	var student models.Student
	err := s.db.First(&student, studentID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("student not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	var enrollments []models.StudentEnroll
	err = s.db.Where("student_id = ?", studentID).
		Preload("CourseSection.Course").
		Find(&enrollments).Error
	if err != nil {
		return nil, fmt.Errorf("failed to fetch enrollments: %w", err)
	}

	return enrollments, nil
}

// BulkDeleteStudentsRequest represents the request for bulk deleting students
type BulkDeleteStudentsRequest struct {
	StudentIDs []uint `json:"student_ids" validate:"required,min=1"`
}

// BulkCreateFromExcelRequest represents the request for bulk creating students from Excel
type BulkCreateFromExcelRequest struct {
	FilePath string `json:"file_path" validate:"required"`
}

// StudentSearchRequest represents advanced search request
type StudentSearchRequest struct {
	Query        string   `json:"query"`
	MajorIDs     []uint   `json:"major_ids"`
	FacultyIDs   []uint   `json:"faculty_ids"`
	ProgramIDs   []uint   `json:"program_ids"`
	CampusIDs    []uint   `json:"campus_ids"`
	GPAXMin      *float64 `json:"gpax_min"`
	GPAXMax      *float64 `json:"gpax_max"`
	HasTraining  *bool    `json:"has_training"`
	TrainingYear *int     `json:"training_year"`
}

// BulkDeleteStudents deletes multiple students
func (s *StudentService) BulkDeleteStudents(req BulkDeleteStudentsRequest) error {
	// Check if any students have active trainings
	var trainingCount int64
	err := s.db.Table("student_trainings").
		Joins("JOIN student_enrolls ON student_trainings.student_enroll_id = student_enrolls.id").
		Where("student_enrolls.student_id IN ?", req.StudentIDs).
		Count(&trainingCount).Error
	if err != nil {
		return fmt.Errorf("failed to check student trainings: %w", err)
	}

	if trainingCount > 0 {
		return errors.New("cannot delete students with active trainings")
	}

	// Delete students
	err = s.db.Where("id IN ?", req.StudentIDs).Delete(&models.Student{}).Error
	if err != nil {
		return fmt.Errorf("failed to bulk delete students: %w", err)
	}

	return nil
}

// AdvancedSearch performs advanced search with multiple filters
func (s *StudentService) AdvancedSearch(req StudentSearchRequest) ([]models.Student, error) {
	query := s.db.Model(&models.Student{}).
		Preload("User").
		Preload("Major").
		Preload("Program").
		Preload("Faculty").
		Preload("Campus")

	// Text search
	if req.Query != "" {
		searchTerm := "%" + req.Query + "%"
		query = query.Where("name LIKE ? OR surname LIKE ? OR student_id LIKE ? OR email LIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm)
	}

	// Filter by majors
	if len(req.MajorIDs) > 0 {
		query = query.Where("major_id IN ?", req.MajorIDs)
	}

	// Filter by faculties
	if len(req.FacultyIDs) > 0 {
		query = query.Where("faculty_id IN ?", req.FacultyIDs)
	}

	// Filter by programs
	if len(req.ProgramIDs) > 0 {
		query = query.Where("program_id IN ?", req.ProgramIDs)
	}

	// Filter by campuses
	if len(req.CampusIDs) > 0 {
		query = query.Where("campus_id IN ?", req.CampusIDs)
	}

	// Filter by GPAX range
	if req.GPAXMin != nil {
		query = query.Where("gpax >= ?", *req.GPAXMin)
	}
	if req.GPAXMax != nil {
		query = query.Where("gpax <= ?", *req.GPAXMax)
	}

	// Filter by training status
	if req.HasTraining != nil {
		if *req.HasTraining {
			query = query.Joins("JOIN student_enrolls ON students.id = student_enrolls.student_id").
				Joins("JOIN student_trainings ON student_enrolls.id = student_trainings.student_enroll_id")
		} else {
			query = query.Where("id NOT IN (SELECT DISTINCT student_enrolls.student_id FROM student_enrolls JOIN student_trainings ON student_enrolls.id = student_trainings.student_enroll_id)")
		}
	}

	// Filter by training year
	if req.TrainingYear != nil {
		query = query.Joins("JOIN student_enrolls ON students.id = student_enrolls.student_id").
			Joins("JOIN student_trainings ON student_enrolls.id = student_trainings.student_enroll_id").
			Where("YEAR(student_trainings.start_date) = ?", *req.TrainingYear)
	}

	var students []models.Student
	err := query.Find(&students).Error
	if err != nil {
		return nil, fmt.Errorf("failed to perform advanced search: %w", err)
	}

	return students, nil
}

// GetStudentAnalytics returns detailed student analytics
func (s *StudentService) GetStudentAnalytics() (map[string]interface{}, error) {
	analytics := make(map[string]interface{})

	// Basic counts
	var totalStudents int64
	err := s.db.Model(&models.Student{}).Count(&totalStudents).Error
	if err != nil {
		return nil, fmt.Errorf("failed to count total students: %w", err)
	}
	analytics["total_students"] = totalStudents

	// Students with active trainings
	var activeTrainings int64
	err = s.db.Table("students").
		Joins("JOIN student_enrolls ON students.id = student_enrolls.student_id").
		Joins("JOIN student_trainings ON student_enrolls.id = student_trainings.student_enroll_id").
		Where("student_trainings.end_date > NOW()").
		Count(&activeTrainings).Error
	if err != nil {
		return nil, fmt.Errorf("failed to count active trainings: %w", err)
	}
	analytics["active_trainings"] = activeTrainings

	// GPAX distribution
	var gpaxStats []struct {
		Range string `json:"range"`
		Count int64  `json:"count"`
	}
	err = s.db.Raw(`
		SELECT 
			CASE 
				WHEN gpax >= 3.5 THEN 'Excellent (3.5-4.0)'
				WHEN gpax >= 3.0 THEN 'Good (3.0-3.49)'
				WHEN gpax >= 2.5 THEN 'Fair (2.5-2.99)'
				WHEN gpax >= 2.0 THEN 'Poor (2.0-2.49)'
				ELSE 'Very Poor (<2.0)'
			END as range,
			COUNT(*) as count
		FROM students 
		WHERE gpax > 0
		GROUP BY range
		ORDER BY MIN(gpax) DESC
	`).Scan(&gpaxStats).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get GPAX statistics: %w", err)
	}
	analytics["gpax_distribution"] = gpaxStats

	// Students by major
	var majorStats []struct {
		MajorID   *uint  `json:"major_id"`
		MajorName string `json:"major_name"`
		Count     int64  `json:"count"`
	}
	err = s.db.Table("students").
		Select("students.major_id, majors.name as major_name, COUNT(*) as count").
		Joins("LEFT JOIN majors ON students.major_id = majors.id").
		Group("students.major_id, majors.name").
		Order("count DESC").
		Scan(&majorStats).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get major statistics: %w", err)
	}
	analytics["by_major"] = majorStats

	// Students by faculty
	var facultyStats []struct {
		FacultyID   *uint  `json:"faculty_id"`
		FacultyName string `json:"faculty_name"`
		Count       int64  `json:"count"`
	}
	err = s.db.Table("students").
		Select("students.faculty_id, faculties.name as faculty_name, COUNT(*) as count").
		Joins("LEFT JOIN faculties ON students.faculty_id = faculties.id").
		Group("students.faculty_id, faculties.name").
		Order("count DESC").
		Scan(&facultyStats).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get faculty statistics: %w", err)
	}
	analytics["by_faculty"] = facultyStats

	// Monthly enrollment trends (last 12 months)
	var enrollmentTrends []struct {
		Month string `json:"month"`
		Count int64  `json:"count"`
	}
	err = s.db.Raw(`
		SELECT 
			DATE_FORMAT(created_at, '%Y-%m') as month,
			COUNT(*) as count
		FROM students 
		WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
		GROUP BY DATE_FORMAT(created_at, '%Y-%m')
		ORDER BY month
	`).Scan(&enrollmentTrends).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get enrollment trends: %w", err)
	}
	analytics["enrollment_trends"] = enrollmentTrends

	return analytics, nil
}

// GetStudentStats returns student statistics (legacy method)
func (s *StudentService) GetStudentStats() (map[string]interface{}, error) {
	return s.GetStudentAnalytics()
}