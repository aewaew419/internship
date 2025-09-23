package models

import (
	"time"

	"gorm.io/gorm"
)

// Permission represents the permissions table
type Permission struct {
	ID          uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	Name        string         `gorm:"uniqueIndex;not null" json:"name" validate:"required"`
	Description *string        `json:"description"`
	Resource    string         `json:"resource" validate:"required"`
	Action      string         `json:"action" validate:"required"`
	IsActive    *bool          `json:"is_active" gorm:"default:true"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `json:"deleted_at" gorm:"index"`

	// Relationships
	Roles []Role `gorm:"many2many:role_permissions;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"roles,omitempty"`
}

// TableName specifies the table name for Permission model
func (Permission) TableName() string {
	return "permissions"
}

// BeforeCreate hook
func (p *Permission) BeforeCreate(tx *gorm.DB) error {
	if p.IsActive == nil {
		isActive := true
		p.IsActive = &isActive
	}
	return nil
}

// BeforeDelete hook to clean up role permissions when permission is deleted
func (p *Permission) BeforeDelete(tx *gorm.DB) error {
	// Delete all role permissions for this permission
	return tx.Exec("DELETE FROM role_permissions WHERE permission_id = ?", p.ID).Error
}

// IsActivePermission checks if the permission is active
func (p *Permission) IsActivePermission() bool {
	if p.IsActive == nil {
		return true
	}
	return *p.IsActive
}

// GetFullPermissionName returns the full permission name (resource:action)
func (p *Permission) GetFullPermissionName() string {
	return p.Resource + ":" + p.Action
}

// PermissionCreateRequest represents the request structure for creating a permission
type PermissionCreateRequest struct {
	Name        string  `json:"name" validate:"required"`
	Description *string `json:"description"`
	Resource    string  `json:"resource" validate:"required"`
	Action      string  `json:"action" validate:"required"`
	IsActive    *bool   `json:"is_active"`
}

// PermissionUpdateRequest represents the request structure for updating a permission
type PermissionUpdateRequest struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
	Resource    *string `json:"resource"`
	Action      *string `json:"action"`
	IsActive    *bool   `json:"is_active"`
}

// PermissionResponse represents the response structure for permission data
type PermissionResponse struct {
	ID          uint      `json:"id"`
	Name        string    `json:"name"`
	Description *string   `json:"description"`
	Resource    string    `json:"resource"`
	Action      string    `json:"action"`
	FullName    string    `json:"full_name"`
	IsActive    bool      `json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	RoleCount   int64     `json:"role_count,omitempty"`
}

// ToResponse converts Permission to PermissionResponse
func (p *Permission) ToResponse() PermissionResponse {
	isActive := true
	if p.IsActive != nil {
		isActive = *p.IsActive
	}

	return PermissionResponse{
		ID:          p.ID,
		Name:        p.Name,
		Description: p.Description,
		Resource:    p.Resource,
		Action:      p.Action,
		FullName:    p.GetFullPermissionName(),
		IsActive:    isActive,
		CreatedAt:   p.CreatedAt,
		UpdatedAt:   p.UpdatedAt,
	}
}

// PermissionListRequest represents the request structure for listing permissions
type PermissionListRequest struct {
	Page     int    `json:"page" query:"page" validate:"min=1"`
	Limit    int    `json:"limit" query:"limit" validate:"min=1,max=100"`
	Search   string `json:"search" query:"search"`
	Resource string `json:"resource" query:"resource"`
	Action   string `json:"action" query:"action"`
	IsActive *bool  `json:"is_active" query:"is_active"`
	SortBy   string `json:"sort_by" query:"sort_by"`
	SortDir  string `json:"sort_dir" query:"sort_dir" validate:"oneof=asc desc"`
}

// PermissionListResponse represents the response structure for permission list
type PermissionListResponse struct {
	Data       []PermissionResponse `json:"data"`
	Total      int64                `json:"total"`
	Page       int                  `json:"page"`
	Limit      int                  `json:"limit"`
	TotalPages int                  `json:"total_pages"`
}

// PermissionStatsResponse represents permission statistics
type PermissionStatsResponse struct {
	TotalPermissions     int64            `json:"total_permissions"`
	ActivePermissions    int64            `json:"active_permissions"`
	TotalRoles           int64            `json:"total_roles"`
	PermissionsByResource map[string]int64 `json:"permissions_by_resource"`
	PermissionsByAction   map[string]int64 `json:"permissions_by_action"`
}