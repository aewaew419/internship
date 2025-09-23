package models

import (
	"time"

	"gorm.io/gorm"
)

// Visitor represents a company visitor in the system
type Visitor struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	Name      string         `json:"name" gorm:"not null" validate:"required"`
	Email     *string        `json:"email" gorm:"uniqueIndex"`
	Phone     *string        `json:"phone"`
	Company   *string        `json:"company"`
	Position  *string        `json:"position"`
	Expertise *string        `json:"expertise"`
	IsActive  *bool          `json:"is_active" gorm:"default:true"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at" gorm:"index"`

	// Relationships
	Trainings    []VisitorTraining         `json:"trainings,omitempty" gorm:"foreignKey:VisitorID"`
	Schedules    []VisitorSchedule         `json:"schedules,omitempty" gorm:"foreignKey:VisitorID"`
	StudentEvals []VisitorEvaluateStudent  `json:"student_evaluations,omitempty" gorm:"foreignKey:VisitorID"`
	CompanyEvals []VisitorEvaluateCompany  `json:"company_evaluations,omitempty" gorm:"foreignKey:VisitorID"`
	Pictures     []VisitsPicture          `json:"pictures,omitempty" gorm:"foreignKey:VisitorID"`
}

// TableName specifies the table name for the Visitor model
func (Visitor) TableName() string {
	return "visitors"
}

// BeforeCreate hook
func (v *Visitor) BeforeCreate(tx *gorm.DB) error {
	if v.IsActive == nil {
		isActive := true
		v.IsActive = &isActive
	}
	return nil
}

// GetFullName returns the visitor's full name
func (v *Visitor) GetFullName() string {
	return v.Name
}

// IsActiveVisitor checks if the visitor is active
func (v *Visitor) IsActiveVisitor() bool {
	if v.IsActive == nil {
		return true
	}
	return *v.IsActive
}

// GetCompanyInfo returns company information
func (v *Visitor) GetCompanyInfo() string {
	if v.Company != nil && v.Position != nil {
		return *v.Position + " at " + *v.Company
	}
	if v.Company != nil {
		return *v.Company
	}
	if v.Position != nil {
		return *v.Position
	}
	return "No company information"
}

// VisitorCreateRequest represents the request structure for creating a visitor
type VisitorCreateRequest struct {
	Name      string  `json:"name" validate:"required"`
	Email     *string `json:"email" validate:"omitempty,email"`
	Phone     *string `json:"phone"`
	Company   *string `json:"company"`
	Position  *string `json:"position"`
	Expertise *string `json:"expertise"`
	IsActive  *bool   `json:"is_active"`
}

// VisitorUpdateRequest represents the request structure for updating a visitor
type VisitorUpdateRequest struct {
	Name      *string `json:"name"`
	Email     *string `json:"email" validate:"omitempty,email"`
	Phone     *string `json:"phone"`
	Company   *string `json:"company"`
	Position  *string `json:"position"`
	Expertise *string `json:"expertise"`
	IsActive  *bool   `json:"is_active"`
}

// VisitorResponse represents the response structure for visitor data
type VisitorResponse struct {
	ID        uint      `json:"id"`
	Name      string    `json:"name"`
	Email     *string   `json:"email"`
	Phone     *string   `json:"phone"`
	Company   *string   `json:"company"`
	Position  *string   `json:"position"`
	Expertise *string   `json:"expertise"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ToResponse converts Visitor to VisitorResponse
func (v *Visitor) ToResponse() VisitorResponse {
	isActive := true
	if v.IsActive != nil {
		isActive = *v.IsActive
	}

	return VisitorResponse{
		ID:        v.ID,
		Name:      v.Name,
		Email:     v.Email,
		Phone:     v.Phone,
		Company:   v.Company,
		Position:  v.Position,
		Expertise: v.Expertise,
		IsActive:  isActive,
		CreatedAt: v.CreatedAt,
		UpdatedAt: v.UpdatedAt,
	}
}

// VisitorListRequest represents the request structure for listing visitors
type VisitorListRequest struct {
	Page     int    `json:"page" query:"page" validate:"min=1"`
	Limit    int    `json:"limit" query:"limit" validate:"min=1,max=100"`
	Search   string `json:"search" query:"search"`
	Company  string `json:"company" query:"company"`
	IsActive *bool  `json:"is_active" query:"is_active"`
	SortBy   string `json:"sort_by" query:"sort_by"`
	SortDir  string `json:"sort_dir" query:"sort_dir" validate:"oneof=asc desc"`
}

// VisitorListResponse represents the response structure for visitor list
type VisitorListResponse struct {
	Data       []VisitorResponse `json:"data"`
	Total      int64             `json:"total"`
	Page       int               `json:"page"`
	Limit      int               `json:"limit"`
	TotalPages int               `json:"total_pages"`
}

// VisitorStatsResponse represents visitor statistics
type VisitorStatsResponse struct {
	TotalVisitors   int64 `json:"total_visitors"`
	ActiveVisitors  int64 `json:"active_visitors"`
	TotalCompanies  int64 `json:"total_companies"`
	TotalTrainings  int64 `json:"total_trainings"`
	TotalSchedules  int64 `json:"total_schedules"`
	TotalEvaluations int64 `json:"total_evaluations"`
}