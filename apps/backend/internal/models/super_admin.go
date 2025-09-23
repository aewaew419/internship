package models

import (
	"fmt"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// AdminRole represents the role of a super admin
type AdminRole string

const (
	AdminRoleSuperAdmin   AdminRole = "super_admin"
	AdminRoleSystemAdmin  AdminRole = "system_admin"
	AdminRoleContentAdmin AdminRole = "content_admin"
)

// SuperAdmin represents the super_admins table
type SuperAdmin struct {
	ID                uint       `gorm:"primaryKey;autoIncrement" json:"id"`
	Email             string     `gorm:"uniqueIndex;not null;size:255" json:"email"`
	Password          string     `gorm:"not null;size:255" json:"-"`
	FullName          string     `gorm:"column:full_name;not null;size:255" json:"full_name"`
	Role              AdminRole  `gorm:"type:enum('super_admin','system_admin','content_admin');default:'system_admin'" json:"role"`
	Permissions       string     `gorm:"type:json" json:"permissions"` // JSON array of permissions
	TwoFactorEnabled  bool       `gorm:"column:two_factor_enabled;default:false" json:"two_factor_enabled"`
	TwoFactorSecret   *string    `gorm:"column:two_factor_secret;size:255" json:"-"`
	LastLoginAt       *time.Time `gorm:"column:last_login_at" json:"last_login_at"`
	CreatedAt         time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt         time.Time  `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	AccessTokens []AccessToken `gorm:"polymorphic:Tokenable;polymorphicValue:SuperAdmin" json:"access_tokens,omitempty"`
	SecurityLogs []SecurityLog `gorm:"polymorphic:User;polymorphicValue:SuperAdmin" json:"security_logs,omitempty"`
}

// TableName specifies the table name for SuperAdmin model
func (SuperAdmin) TableName() string {
	return "super_admins"
}

// BeforeCreate hook to hash password before creating super admin
func (sa *SuperAdmin) BeforeCreate(tx *gorm.DB) error {
	if sa.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(sa.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		sa.Password = string(hashedPassword)
	}
	return nil
}

// BeforeUpdate hook to hash password before updating super admin if password is changed
func (sa *SuperAdmin) BeforeUpdate(tx *gorm.DB) error {
	if tx.Statement.Changed("Password") && sa.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(sa.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		sa.Password = string(hashedPassword)
	}
	return nil
}

// CheckPassword verifies if the provided password matches the super admin's password
func (sa *SuperAdmin) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(sa.Password), []byte(password))
	return err == nil
}

// HasPermission checks if the super admin has a specific permission
func (sa *SuperAdmin) HasPermission(permission string) bool {
	// This would need to parse the JSON permissions and check
	// For now, return true for super_admin role
	return sa.Role == AdminRoleSuperAdmin
}

// GetIdentifier returns a string identifier for polymorphic relationships
func (sa *SuperAdmin) GetIdentifier() string {
	return fmt.Sprintf("%d", sa.ID)
}

// UpdateLastLogin updates the last login timestamp
func (sa *SuperAdmin) UpdateLastLogin(db *gorm.DB) error {
	now := time.Now()
	sa.LastLoginAt = &now
	return db.Model(sa).Update("last_login_at", now).Error
}

// IsTwoFactorEnabled checks if two-factor authentication is enabled
func (sa *SuperAdmin) IsTwoFactorEnabled() bool {
	return sa.TwoFactorEnabled && sa.TwoFactorSecret != nil
}

// GetPermissions parses and returns the permissions as a slice
func (sa *SuperAdmin) GetPermissions() []string {
	// This would need to parse the JSON permissions
	// For now, return basic permissions based on role
	switch sa.Role {
	case AdminRoleSuperAdmin:
		return []string{"*"} // All permissions
	case AdminRoleSystemAdmin:
		return []string{"users.read", "users.write", "system.read", "system.write"}
	case AdminRoleContentAdmin:
		return []string{"content.read", "content.write", "users.read"}
	default:
		return []string{}
	}
}