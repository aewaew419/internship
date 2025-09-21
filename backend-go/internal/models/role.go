package models

import "gorm.io/gorm"

// Role represents the roles table
type Role struct {
	ID   uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	Name string `gorm:"uniqueIndex;not null" json:"name"`

	// Relationships
	Users       []User       `gorm:"foreignKey:RoleID" json:"users,omitempty"`
	Permissions []Permission `gorm:"many2many:role_permissions;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"permissions,omitempty"`
}

// TableName specifies the table name for Role model
func (Role) TableName() string {
	return "roles"
}

// RolePermission represents the many-to-many relationship between roles and permissions
type RolePermission struct {
	RoleID       uint `gorm:"primaryKey" json:"role_id"`
	PermissionID uint `gorm:"primaryKey" json:"permission_id"`

	// Relationships
	Role       Role       `gorm:"foreignKey:RoleID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"role,omitempty"`
	Permission Permission `gorm:"foreignKey:PermissionID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"permission,omitempty"`
}

// TableName specifies the table name for RolePermission model
func (RolePermission) TableName() string {
	return "role_permissions"
}

// BeforeDelete hook to clean up role permissions when role is deleted
func (r *Role) BeforeDelete(tx *gorm.DB) error {
	// Delete all role permissions for this role
	return tx.Where("role_id = ?", r.ID).Delete(&RolePermission{}).Error
}