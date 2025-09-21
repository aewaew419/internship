package models

import "gorm.io/gorm"

// Permission represents the permissions table
type Permission struct {
	ID   uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	Name string `gorm:"uniqueIndex;not null" json:"name"`

	// Relationships
	Roles []Role `gorm:"many2many:role_permissions;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"roles,omitempty"`
}

// TableName specifies the table name for Permission model
func (Permission) TableName() string {
	return "permissions"
}

// BeforeDelete hook to clean up role permissions when permission is deleted
func (p *Permission) BeforeDelete(tx *gorm.DB) error {
	// Delete all role permissions for this permission
	return tx.Where("permission_id = ?", p.ID).Delete(&RolePermission{}).Error
}