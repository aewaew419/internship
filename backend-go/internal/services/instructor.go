package services

import (
	"errors"
	"fmt"

	"backend-go/internal/models"
	"gorm.io/gorm"
)

// InstructorServiceInterface defines the interface for instructor service
type InstructorServiceInterface interface {
	GetInstructors(req InstructorListRequest) (*InstructorListResponse, error)
	GetInstructorByID(id uint) (*models.Instructor, error)
	CreateInstructor(req CreateInstructorRequest) (*models.Instructor, error)
	UpdateInstructor(id uint, req UpdateInstructorRequest) (*models.Instructor, error)
	DeleteInstructor(id uint) error
	AssignInstructorToCourse(req CourseAssignmentRequest) (*models.CourseInstructor, error)
	UpdateCourseAssignment(id uint, req UpdateCourseAssignmentRequest) (*models.CourseInstructor, error)
	RemoveCourseAssignment(id uint) error
	GetInstructorCourseAssignments(instructorID uint) ([]models.CourseInstructor, error)
	ManageInstructorGrade(req InstructorGradeRequest) (*models.StudentEnrollStatus, error)
	RecordTrainingAttendance(req TrainingAttendanceRequest) error
	GetInstructorStats() (map[string]interface{}, error)
}

// InstructorService handles instructor management operations
type InstructorService struct {
	db *gorm.DB
}

// NewInstructorService creates a new instructor service instance
func NewInstructorService(db *gorm.DB) *InstructorService {
	return &InstructorService{
		db: db,
	}
}

// InstructorListRequest represents the request for listing instructors
type InstructorListRequest struct {
	Page      int    `json:"page"`
	Limit     int    `json:"limit"`
	Search    string `json:"search"`
	FacultyID *uint  `json:"faculty_id"`
	ProgramID *uint  `json:"program_id"`
	SortBy    string `json:"sort_by"`
	SortDesc  bool   `json:"sort_desc"`
}

// InstructorListResponse represents the response for listing instructors
type InstructorListResponse struct {
	Data       []models.Instructor `json:"data"`
	Total      int64               `json:"total"`
	Page       int                 `json:"page"`
	Limit      int                 `json:"limit"`
	TotalPages int                 `json:"total_pages"`
}

// CreateInstructorRequest represents the request for creating an instructor
type CreateInstructorRequest struct {
	UserID     uint   `json:"user_id" validate:"required"`
	StaffID    string `json:"staff_id" validate:"required"`
	Name       string `json:"name" validate:"required"`
	MiddleName string `json:"middle_name"`
	Surname    string `json:"surname" validate:"required"`
	FacultyID  uint   `json:"faculty_id" validate:"required"`
	ProgramID  uint   `json:"program_id" validate:"required"`
}

// UpdateInstructorRequest represents the request for updating an instructor
type UpdateInstructorRequest struct {
	StaffID    *string `json:"staff_id"`
	Name       *string `json:"name"`
	MiddleName *string `json:"middle_name"`
	Surname    *string `json:"surname"`
	FacultyID  *uint   `json:"faculty_id"`
	ProgramID  *uint   `json:"program_id"`
}

// CourseAssignmentRequest represents the request for assigning instructor to course
type CourseAssignmentRequest struct {
	InstructorID    uint   `json:"instructor_id" validate:"required"`
	CourseSectionID uint   `json:"course_section_id" validate:"required"`
	Role            string `json:"role" validate:"required,oneof=instructor assistant coordinator"`
}

// UpdateCourseAssignmentRequest represents the request for updating course assignment
type UpdateCourseAssignmentRequest struct {
	Role *string `json:"role" validate:"omitempty,oneof=instructor assistant coordinator"`
}

// InstructorGradeRequest represents the request for managing instructor grades
type InstructorGradeRequest struct {
	InstructorID        uint    `json:"instructor_id" validate:"required"`
	StudentEnrollID     uint    `json:"student_enroll_id" validate:"required"`
	Grade               *string `json:"grade"`
	GradePoints         *float64 `json:"grade_points"`
	Status              string  `json:"status" validate:"required,oneof=enrolled passed failed withdrawn incomplete"`
	CompletionDate      *string `json:"completion_date"`
	Notes               *string `json:"notes"`
}

// TrainingAttendanceRequest represents the request for managing training attendance
type TrainingAttendanceRequest struct {
	InstructorID     uint   `json:"instructor_id" validate:"required"`
	StudentTrainingID uint   `json:"student_training_id" validate:"required"`
	AttendanceStatus string `json:"attendance_status" validate:"required,oneof=present absent excused late"`
	AttendanceDate   string `json:"attendance_date" validate:"required"`
	Notes            *string `json:"notes"`
}

// GetInstructors retrieves instructors with pagination, search, and filtering
func (s *InstructorService) GetInstructors(req InstructorListRequest) (*InstructorListResponse, error) {
	var instructors []models.Instructor
	var total int64

	// Build query
	query := s.db.Model(&models.Instructor{}).
		Preload("User").
		Preload("Faculty").
		Preload("Program")

	// Apply search filter
	if req.Search != "" {
		searchTerm := "%" + req.Search + "%"
		query = query.Where("name LIKE ? OR middle_name LIKE ? OR surname LIKE ? OR staff_id LIKE ?", 
			searchTerm, searchTerm, searchTerm, searchTerm)
	}

	// Apply faculty filter
	if req.FacultyID != nil {
		query = query.Where("faculty_id = ?", *req.FacultyID)
	}

	// Apply program filter
	if req.ProgramID != nil {
		query = query.Where("program_id = ?", *req.ProgramID)
	}

	// Count total records
	if err := query.Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count instructors: %w", err)
	}

	// Apply sorting
	sortBy := "created_at"
	if req.SortBy != "" {
		// Validate sort field to prevent SQL injection
		allowedSortFields := []string{"id", "name", "surname", "staff_id", "faculty_id", "program_id", "created_at", "updated_at"}
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
	if err := query.Offset(offset).Limit(req.Limit).Find(&instructors).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch instructors: %w", err)
	}

	totalPages := int((total + int64(req.Limit) - 1) / int64(req.Limit))

	return &InstructorListResponse{
		Data:       instructors,
		Total:      total,
		Page:       req.Page,
		Limit:      req.Limit,
		TotalPages: totalPages,
	}, nil
}

// GetInstructorByID retrieves an instructor by ID
func (s *InstructorService) GetInstructorByID(id uint) (*models.Instructor, error) {
	var instructor models.Instructor
	err := s.db.Preload("User").
		Preload("Faculty").
		Preload("Program").
		Preload("CourseInstructors.CourseSection.Course").
		Preload("CourseSections.Course").
		Preload("CourseCommittees.Course").
		First(&instructor, id).Error
	
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("instructor not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	return &instructor, nil
}

// CreateInstructor creates a new instructor
func (s *InstructorService) CreateInstructor(req CreateInstructorRequest) (*models.Instructor, error) {
	// Check if user exists
	var user models.User
	err := s.db.First(&user, req.UserID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Check if user is already an instructor
	var existingInstructor models.Instructor
	err = s.db.Where("user_id = ?", req.UserID).First(&existingInstructor).Error
	if err == nil {
		return nil, errors.New("user is already an instructor")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Check if staff ID already exists
	err = s.db.Where("staff_id = ?", req.StaffID).First(&existingInstructor).Error
	if err == nil {
		return nil, errors.New("instructor with this staff ID already exists")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Validate faculty exists
	var faculty models.Faculty
	err = s.db.First(&faculty, req.FacultyID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("invalid faculty")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Validate program exists
	var program models.Program
	err = s.db.First(&program, req.ProgramID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("invalid program")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Create new instructor
	instructor := models.Instructor{
		UserID:     req.UserID,
		StaffID:    req.StaffID,
		Name:       req.Name,
		MiddleName: req.MiddleName,
		Surname:    req.Surname,
		FacultyID:  req.FacultyID,
		ProgramID:  req.ProgramID,
	}

	err = s.db.Create(&instructor).Error
	if err != nil {
		return nil, fmt.Errorf("failed to create instructor: %w", err)
	}

	// Reload with relationships
	err = s.db.Preload("User").
		Preload("Faculty").
		Preload("Program").
		First(&instructor, instructor.ID).Error
	if err != nil {
		return nil, fmt.Errorf("failed to reload instructor: %w", err)
	}

	return &instructor, nil
}

// UpdateInstructor updates an existing instructor
func (s *InstructorService) UpdateInstructor(id uint, req UpdateInstructorRequest) (*models.Instructor, error) {
	var instructor models.Instructor
	err := s.db.First(&instructor, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("instructor not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Check if staff ID already exists (if being updated)
	if req.StaffID != nil && *req.StaffID != instructor.StaffID {
		var existingInstructor models.Instructor
		err = s.db.Where("staff_id = ? AND id != ?", *req.StaffID, id).First(&existingInstructor).Error
		if err == nil {
			return nil, errors.New("instructor with this staff ID already exists")
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("database error: %w", err)
		}
	}

	// Validate faculty exists (if being updated)
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

	// Validate program exists (if being updated)
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

	// Update fields
	updates := make(map[string]interface{})
	if req.StaffID != nil {
		updates["staff_id"] = *req.StaffID
	}
	if req.Name != nil {
		updates["name"] = *req.Name
	}
	if req.MiddleName != nil {
		updates["middle_name"] = *req.MiddleName
	}
	if req.Surname != nil {
		updates["surname"] = *req.Surname
	}
	if req.FacultyID != nil {
		updates["faculty_id"] = *req.FacultyID
	}
	if req.ProgramID != nil {
		updates["program_id"] = *req.ProgramID
	}

	err = s.db.Model(&instructor).Updates(updates).Error
	if err != nil {
		return nil, fmt.Errorf("failed to update instructor: %w", err)
	}

	// Reload with relationships
	err = s.db.Preload("User").
		Preload("Faculty").
		Preload("Program").
		First(&instructor, instructor.ID).Error
	if err != nil {
		return nil, fmt.Errorf("failed to reload instructor: %w", err)
	}

	return &instructor, nil
}

// DeleteInstructor deletes an instructor
func (s *InstructorService) DeleteInstructor(id uint) error {
	var instructor models.Instructor
	err := s.db.First(&instructor, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("instructor not found")
		}
		return fmt.Errorf("database error: %w", err)
	}

	err = s.db.Delete(&instructor).Error
	if err != nil {
		return fmt.Errorf("failed to delete instructor: %w", err)
	}

	return nil
}

// AssignInstructorToCourse assigns an instructor to a course section
func (s *InstructorService) AssignInstructorToCourse(req CourseAssignmentRequest) (*models.CourseInstructor, error) {
	// Check if instructor exists
	var instructor models.Instructor
	err := s.db.First(&instructor, req.InstructorID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("instructor not found")
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

	// Check if assignment already exists
	var existingAssignment models.CourseInstructor
	err = s.db.Where("instructor_id = ? AND course_section_id = ?", req.InstructorID, req.CourseSectionID).
		First(&existingAssignment).Error
	if err == nil {
		return nil, errors.New("instructor is already assigned to this course section")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Create assignment
	assignment := models.CourseInstructor{
		InstructorID:    req.InstructorID,
		CourseSectionID: req.CourseSectionID,
		Role:            req.Role,
	}

	err = s.db.Create(&assignment).Error
	if err != nil {
		return nil, fmt.Errorf("failed to create course assignment: %w", err)
	}

	// Reload with relationships
	err = s.db.Preload("Instructor").
		Preload("CourseSection.Course").
		First(&assignment, assignment.ID).Error
	if err != nil {
		return nil, fmt.Errorf("failed to reload assignment: %w", err)
	}

	return &assignment, nil
}

// UpdateCourseAssignment updates an instructor's course assignment
func (s *InstructorService) UpdateCourseAssignment(assignmentID uint, req UpdateCourseAssignmentRequest) (*models.CourseInstructor, error) {
	var assignment models.CourseInstructor
	err := s.db.First(&assignment, assignmentID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("course assignment not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Update fields
	updates := make(map[string]interface{})
	if req.Role != nil {
		updates["role"] = *req.Role
	}

	err = s.db.Model(&assignment).Updates(updates).Error
	if err != nil {
		return nil, fmt.Errorf("failed to update course assignment: %w", err)
	}

	// Reload with relationships
	err = s.db.Preload("Instructor").
		Preload("CourseSection.Course").
		First(&assignment, assignment.ID).Error
	if err != nil {
		return nil, fmt.Errorf("failed to reload assignment: %w", err)
	}

	return &assignment, nil
}

// RemoveCourseAssignment removes an instructor from a course section
func (s *InstructorService) RemoveCourseAssignment(assignmentID uint) error {
	var assignment models.CourseInstructor
	err := s.db.First(&assignment, assignmentID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("course assignment not found")
		}
		return fmt.Errorf("database error: %w", err)
	}

	err = s.db.Delete(&assignment).Error
	if err != nil {
		return fmt.Errorf("failed to remove course assignment: %w", err)
	}

	return nil
}

// GetInstructorCourseAssignments retrieves all course assignments for an instructor
func (s *InstructorService) GetInstructorCourseAssignments(instructorID uint) ([]models.CourseInstructor, error) {
	// Check if instructor exists
	var instructor models.Instructor
	err := s.db.First(&instructor, instructorID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("instructor not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	var assignments []models.CourseInstructor
	err = s.db.Where("instructor_id = ?", instructorID).
		Preload("CourseSection.Course").
		Find(&assignments).Error
	if err != nil {
		return nil, fmt.Errorf("failed to fetch course assignments: %w", err)
	}

	return assignments, nil
}

// ManageInstructorGrade manages grades for students under an instructor
func (s *InstructorService) ManageInstructorGrade(req InstructorGradeRequest) (*models.StudentEnrollStatus, error) {
	// Check if instructor exists
	var instructor models.Instructor
	err := s.db.First(&instructor, req.InstructorID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("instructor not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Check if student enrollment exists
	var enrollment models.StudentEnroll
	err = s.db.First(&enrollment, req.StudentEnrollID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("student enrollment not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// For this implementation, we'll work with the existing StudentEnrollStatus structure
	// In a real implementation, you might need to modify the model or create a separate grading table
	// This is a simplified implementation that just updates the instructor assignment
	var enrollStatus models.StudentEnrollStatus
	err = s.db.Where("instructor_id = ?", req.InstructorID).First(&enrollStatus).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		// Create a basic status record - we need to get the student ID from enrollment
		var student models.Student
		err = s.db.Where("id = (SELECT student_id FROM student_enrolls WHERE id = ?)", req.StudentEnrollID).First(&student).Error
		if err != nil {
			return nil, fmt.Errorf("failed to find student: %w", err)
		}
		
		enrollStatus = models.StudentEnrollStatus{
			StudentID:    student.ID,
			Semester:     "1", // Default values
			Year:         2024,
			Status:       req.Status,
			InstructorID: &req.InstructorID,
		}
		err = s.db.Create(&enrollStatus).Error
		if err != nil {
			return nil, fmt.Errorf("failed to create enrollment status: %w", err)
		}
	} else if err != nil {
		return nil, fmt.Errorf("database error: %w", err)
	} else {
		// Update existing status
		err = s.db.Model(&enrollStatus).Update("status", req.Status).Error
		if err != nil {
			return nil, fmt.Errorf("failed to update enrollment status: %w", err)
		}
	}

	// Reload with relationships
	err = s.db.Preload("Student.User").Preload("Instructor").First(&enrollStatus, enrollStatus.ID).Error
	if err != nil {
		return nil, fmt.Errorf("failed to reload enrollment status: %w", err)
	}

	return &enrollStatus, nil
}

// RecordTrainingAttendance records attendance for instructor training
func (s *InstructorService) RecordTrainingAttendance(req TrainingAttendanceRequest) error {
	// Check if instructor exists
	var instructor models.Instructor
	err := s.db.First(&instructor, req.InstructorID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("instructor not found")
		}
		return fmt.Errorf("database error: %w", err)
	}

	// Check if student training exists
	var training models.StudentTraining
	err = s.db.First(&training, req.StudentTrainingID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("student training not found")
		}
		return fmt.Errorf("database error: %w", err)
	}

	// For now, we'll store this information in a simple way
	// In a real implementation, you might want to create a separate attendance table
	// This is a simplified implementation that updates the training notes
	notes := fmt.Sprintf("Instructor %d attendance: %s on %s", req.InstructorID, req.AttendanceStatus, req.AttendanceDate)
	if req.Notes != nil {
		notes += " - " + *req.Notes
	}

	// Update training with attendance information
	err = s.db.Model(&training).Update("job_description", 
		training.JobDescription + "\n[Attendance] " + notes).Error
	if err != nil {
		return fmt.Errorf("failed to record attendance: %w", err)
	}

	return nil
}

// GetInstructorStats retrieves instructor statistics
func (s *InstructorService) GetInstructorStats() (map[string]interface{}, error) {
	var totalInstructors int64
	var instructorsByFaculty []struct {
		FacultyID   uint   `json:"faculty_id"`
		FacultyName string `json:"faculty_name"`
		Count       int64  `json:"count"`
	}
	var instructorsByProgram []struct {
		ProgramID   uint   `json:"program_id"`
		ProgramName string `json:"program_name"`
		Count       int64  `json:"count"`
	}

	// Count total instructors
	err := s.db.Model(&models.Instructor{}).Count(&totalInstructors).Error
	if err != nil {
		return nil, fmt.Errorf("failed to count instructors: %w", err)
	}

	// Count instructors by faculty
	err = s.db.Model(&models.Instructor{}).
		Select("instructors.faculty_id, faculties.name as faculty_name, COUNT(*) as count").
		Joins("LEFT JOIN faculties ON instructors.faculty_id = faculties.id").
		Group("instructors.faculty_id, faculties.name").
		Scan(&instructorsByFaculty).Error
	if err != nil {
		return nil, fmt.Errorf("failed to count instructors by faculty: %w", err)
	}

	// Count instructors by program
	err = s.db.Model(&models.Instructor{}).
		Select("instructors.program_id, programs.name as program_name, COUNT(*) as count").
		Joins("LEFT JOIN programs ON instructors.program_id = programs.id").
		Group("instructors.program_id, programs.name").
		Scan(&instructorsByProgram).Error
	if err != nil {
		return nil, fmt.Errorf("failed to count instructors by program: %w", err)
	}

	return map[string]interface{}{
		"total_instructors":        totalInstructors,
		"instructors_by_faculty":   instructorsByFaculty,
		"instructors_by_program":   instructorsByProgram,
	}, nil
}