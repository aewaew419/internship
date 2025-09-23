package models

import (
	"time"

	"gorm.io/gorm"
)

// InstructorCourse represents the many-to-many relationship between instructors and courses
type InstructorCourse struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	InstructorID uint           `json:"instructor_id" gorm:"not null"`
	CourseID     uint           `json:"course_id" gorm:"not null"`
	Role         string         `json:"role" gorm:"default:'instructor'" validate:"oneof=instructor assistant coordinator"`
	StartDate    *time.Time     `json:"start_date"`
	EndDate      *time.Time     `json:"end_date"`
	IsActive     *bool          `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"deleted_at" gorm:"index"`

	// Relationships
	Instructor Instructor `json:"instructor,omitempty" gorm:"foreignKey:InstructorID"`
	Course     Course     `json:"course,omitempty" gorm:"foreignKey:CourseID"`
}

// TableName specifies the table name for the InstructorCourse model
func (InstructorCourse) TableName() string {
	return "instructor_courses"
}

// BeforeCreate hook
func (ic *InstructorCourse) BeforeCreate(tx *gorm.DB) error {
	if ic.IsActive == nil {
		isActive := true
		ic.IsActive = &isActive
	}
	if ic.Role == "" {
		ic.Role = "instructor"
	}
	return nil
}

// IsActiveAssignment checks if the instructor-course assignment is active
func (ic *InstructorCourse) IsActiveAssignment() bool {
	if ic.IsActive == nil {
		return true
	}
	return *ic.IsActive
}

// IsCurrentAssignment checks if the assignment is currently active based on dates
func (ic *InstructorCourse) IsCurrentAssignment() bool {
	now := time.Now()
	
	// If no start date, consider it active
	if ic.StartDate != nil && ic.StartDate.After(now) {
		return false
	}
	
	// If no end date, consider it active
	if ic.EndDate != nil && ic.EndDate.Before(now) {
		return false
	}
	
	return ic.IsActiveAssignment()
}

// GetRoleDescription returns a human-readable role description
func (ic *InstructorCourse) GetRoleDescription() string {
	switch ic.Role {
	case "instructor":
		return "Primary Instructor"
	case "assistant":
		return "Teaching Assistant"
	case "coordinator":
		return "Course Coordinator"
	default:
		return "Instructor"
	}
}

// InstructorCourseCreateRequest represents the request structure for creating an instructor-course assignment
type InstructorCourseCreateRequest struct {
	InstructorID uint       `json:"instructor_id" validate:"required"`
	CourseID     uint       `json:"course_id" validate:"required"`
	Role         string     `json:"role" validate:"oneof=instructor assistant coordinator"`
	StartDate    *time.Time `json:"start_date"`
	EndDate      *time.Time `json:"end_date"`
	IsActive     *bool      `json:"is_active"`
}

// InstructorCourseUpdateRequest represents the request structure for updating an instructor-course assignment
type InstructorCourseUpdateRequest struct {
	Role      *string    `json:"role" validate:"omitempty,oneof=instructor assistant coordinator"`
	StartDate *time.Time `json:"start_date"`
	EndDate   *time.Time `json:"end_date"`
	IsActive  *bool      `json:"is_active"`
}

// InstructorCourseResponse represents the response structure for instructor-course assignment data
type InstructorCourseResponse struct {
	ID           uint                 `json:"id"`
	InstructorID uint                 `json:"instructor_id"`
	CourseID     uint                 `json:"course_id"`
	Role         string               `json:"role"`
	RoleDescription string            `json:"role_description"`
	StartDate    *time.Time           `json:"start_date"`
	EndDate      *time.Time           `json:"end_date"`
	IsActive     bool                 `json:"is_active"`
	IsCurrentAssignment bool          `json:"is_current_assignment"`
	CreatedAt    time.Time            `json:"created_at"`
	UpdatedAt    time.Time            `json:"updated_at"`
	Instructor   *InstructorResponse  `json:"instructor,omitempty"`
	Course       *CourseResponse      `json:"course,omitempty"`
}

// ToResponse converts InstructorCourse to InstructorCourseResponse
func (ic *InstructorCourse) ToResponse() InstructorCourseResponse {
	isActive := true
	if ic.IsActive != nil {
		isActive = *ic.IsActive
	}

	response := InstructorCourseResponse{
		ID:                  ic.ID,
		InstructorID:        ic.InstructorID,
		CourseID:            ic.CourseID,
		Role:                ic.Role,
		RoleDescription:     ic.GetRoleDescription(),
		StartDate:           ic.StartDate,
		EndDate:             ic.EndDate,
		IsActive:            isActive,
		IsCurrentAssignment: ic.IsCurrentAssignment(),
		CreatedAt:           ic.CreatedAt,
		UpdatedAt:           ic.UpdatedAt,
	}

	// Include related data if loaded
	if ic.Instructor.ID != 0 {
		instructorResponse := ic.Instructor.ToResponse()
		response.Instructor = &instructorResponse
	}

	if ic.Course.ID != 0 {
		courseResponse := ic.Course.ToResponse()
		response.Course = &courseResponse
	}

	return response
}

// InstructorCourseListRequest represents the request structure for listing instructor-course assignments
type InstructorCourseListRequest struct {
	Page         int    `json:"page" query:"page" validate:"min=1"`
	Limit        int    `json:"limit" query:"limit" validate:"min=1,max=100"`
	InstructorID *uint  `json:"instructor_id" query:"instructor_id"`
	CourseID     *uint  `json:"course_id" query:"course_id"`
	Role         string `json:"role" query:"role"`
	IsActive     *bool  `json:"is_active" query:"is_active"`
	CurrentOnly  *bool  `json:"current_only" query:"current_only"`
	SortBy       string `json:"sort_by" query:"sort_by"`
	SortDir      string `json:"sort_dir" query:"sort_dir" validate:"oneof=asc desc"`
}

// InstructorCourseListResponse represents the response structure for instructor-course assignment list
type InstructorCourseListResponse struct {
	Data       []InstructorCourseResponse `json:"data"`
	Total      int64                      `json:"total"`
	Page       int                        `json:"page"`
	Limit      int                        `json:"limit"`
	TotalPages int                        `json:"total_pages"`
}

// InstructorCourseStatsResponse represents instructor-course assignment statistics
type InstructorCourseStatsResponse struct {
	TotalAssignments    int64 `json:"total_assignments"`
	ActiveAssignments   int64 `json:"active_assignments"`
	CurrentAssignments  int64 `json:"current_assignments"`
	InstructorCount     int64 `json:"instructor_count"`
	CourseCount         int64 `json:"course_count"`
	AssignmentsByRole   map[string]int64 `json:"assignments_by_role"`
}

// CourseInstructorRole represents the possible roles for course instructors
type CourseInstructorRole string

const (
	CourseInstructorRoleInstructor  CourseInstructorRole = "instructor"
	CourseInstructorRoleAssistant   CourseInstructorRole = "assistant"
	CourseInstructorRoleCoordinator CourseInstructorRole = "coordinator"
)

// GetAllCourseInstructorRoles returns all possible course instructor roles
func GetAllCourseInstructorRoles() []CourseInstructorRole {
	return []CourseInstructorRole{
		CourseInstructorRoleInstructor,
		CourseInstructorRoleAssistant,
		CourseInstructorRoleCoordinator,
	}
}

// String returns the string representation of the role
func (r CourseInstructorRole) String() string {
	return string(r)
}

// IsValid checks if the role is valid
func (r CourseInstructorRole) IsValid() bool {
	for _, role := range GetAllCourseInstructorRoles() {
		if r == role {
			return true
		}
	}
	return false
}