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
	UserID       uint    `json:"user_id" validate:"required"`
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
	// Check if user exists
	var user models.User
	err := s.db.First(&user, req.UserID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Check if student ID already exists
	var existingStudent models.Student
	err = s.db.Where("student_id = ?", req.StudentID).First(&existingStudent).Error
	if err == nil {
		return nil, errors.New("student with this student ID already exists")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Check if user is already a student
	err = s.db.Where("user_id = ?", req.UserID).First(&existingStudent).Error
	if err == nil {
		return nil, errors.New("user is already a student")
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
		UserID:       req.UserID,
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

// GetStudentStats returns student statistics
func (s *StudentService) GetStudentStats() (map[string]interface{}, error) {
	var totalStudents int64
	err := s.db.Model(&models.Student{}).Count(&totalStudents).Error
	if err != nil {
		return nil, fmt.Errorf("failed to count total students: %w", err)
	}

	// Count students by major
	var majorStats []struct {
		MajorID   *uint  `json:"major_id"`
		MajorName string `json:"major_name"`
		Count     int64  `json:"count"`
	}

	err = s.db.Table("students").
		Select("students.major_id, majors.name as major_name, COUNT(*) as count").
		Joins("LEFT JOIN majors ON students.major_id = majors.id").
		Group("students.major_id, majors.name").
		Scan(&majorStats).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get major statistics: %w", err)
	}

	// Count students by faculty
	var facultyStats []struct {
		FacultyID   *uint  `json:"faculty_id"`
		FacultyName string `json:"faculty_name"`
		Count       int64  `json:"count"`
	}

	err = s.db.Table("students").
		Select("students.faculty_id, faculties.name as faculty_name, COUNT(*) as count").
		Joins("LEFT JOIN faculties ON students.faculty_id = faculties.id").
		Group("students.faculty_id, faculties.name").
		Scan(&facultyStats).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get faculty statistics: %w", err)
	}

	return map[string]interface{}{
		"total_students": totalStudents,
		"by_major":       majorStats,
		"by_faculty":     facultyStats,
	}, nil
}