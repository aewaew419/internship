package models

import (
	"time"

	"gorm.io/gorm"
)

// Role represents the roles table
type Role struct {
	ID          uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	Name        string         `gorm:"uniqueIndex;not null" json:"name" validate:"required"`
	Description *string        `json:"description"`
	IsActive    *bool          `json:"is_active" gorm:"default:true"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at" gorm:"index"`

	// Relationships
	Users       []User       `gorm:"foreignKey:RoleID" json:"users,omitempty"`
	Permissions []Permission `gorm:"many2many:role_permissions;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"permissions,omitempty"`
}

// TableName specifies the table name for Role model
func (Role) TableName() string {
	return "roles"
}

// BeforeCreate hook
func (r *Role) BeforeCreate(tx *gorm.DB) error {
	if r.IsActive == nil {
		isActive := true
		r.IsActive = &isActive
	}
	return nil
}

// BeforeDelete hook to clean up role permissions when role is deleted
func (r *Role) BeforeDelete(tx *gorm.DB) error {
	// Delete all role permissions for this role
	return tx.Exec("DELETE FROM role_permissions WHERE role_id = ?", r.ID).Error
}

// IsActiveRole checks if the role is active
func (r *Role) IsActiveRole() bool {
	if r.IsActive == nil {
		return true
	}
	return *r.IsActive
}

// RoleCreateRequest represents the request structure for creating a role
type RoleCreateRequest struct {
	Name        string  `json:"name" validate:"required"`
	Description *string `json:"description"`
	IsActive    *bool   `json:"is_active"`
}

// RoleUpdateRequest represents the request structure for updating a role
type RoleUpdateRequest struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
	IsActive    *bool   `json:"is_active"`
}

// RoleResponse represents the response structure for role data
type RoleResponse struct {
	ID          uint      `json:"id"`
	Name        string    `json:"name"`
	Description *string   `json:"description"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	UserCount   int64     `json:"user_count,omitempty"`
	PermissionCount int64 `json:"permission_count,omitempty"`
}

// ToResponse converts Role to RoleResponse
func (r *Role) ToResponse() RoleResponse {
	isActive := true
	if r.IsActive != nil {
		isActive = *r.IsActive
	}

	return RoleResponse{
		ID:          r.ID,
		Name:        r.Name,
		Description: r.Description,
		IsActive:    isActive,
		CreatedAt:   r.CreatedAt,
		UpdatedAt:   r.UpdatedAt,
	}
}

// RoleListRequest represents the request structure for listing roles
type RoleListRequest struct {
	Page     int    `json:"page" query:"page" validate:"min=1"`
	Limit    int    `json:"limit" query:"limit" validate:"min=1,max=100"`
	Search   string `json:"search" query:"search"`
	IsActive *bool  `json:"is_active" query:"is_active"`
	SortBy   string `json:"sort_by" query:"sort_by"`
	SortDir  string `json:"sort_dir" query:"sort_dir" validate:"oneof=asc desc"`
}

// RoleListResponse represents the response structure for role list
type RoleListResponse struct {
	Data       []RoleResponse `json:"data"`
	Total      int64          `json:"total"`
	Page       int            `json:"page"`
	Limit      int            `json:"limit"`
	TotalPages int            `json:"total_pages"`
}

// RoleStatsResponse represents role statistics
type RoleStatsResponse struct {
	TotalRoles       int64            `json:"total_roles"`
	ActiveRoles      int64            `json:"active_roles"`
	TotalUsers       int64            `json:"total_users"`
	TotalPermissions int64            `json:"total_permissions"`
	UsersByRole      map[string]int64 `json:"users_by_role"`
}