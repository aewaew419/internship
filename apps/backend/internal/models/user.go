package models

import (
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// UserStatus represents the status of a user
type UserStatus string

const (
	UserStatusActive    UserStatus = "active"
	UserStatusInactive  UserStatus = "inactive"
	UserStatusSuspended UserStatus = "suspended"
)

// User represents the enhanced users table with student_id as primary key
type User struct {
	StudentID       string     `gorm:"primaryKey;column:student_id;size:20" json:"student_id"`
	Email           string     `gorm:"uniqueIndex;not null;size:255" json:"email"`
	Password        string     `gorm:"not null;size:255" json:"-"`
	FullName        string     `gorm:"column:full_name;not null;size:255" json:"full_name"`
	Status          UserStatus `gorm:"type:enum('active','inactive','suspended');default:'active'" json:"status"`
	EmailVerifiedAt *time.Time `gorm:"column:email_verified_at" json:"email_verified_at"`
	LastLoginAt     *time.Time `gorm:"column:last_login_at" json:"last_login_at"`
	CreatedAt       time.Time  `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt       time.Time  `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	Student      *Student      `gorm:"foreignKey:StudentID;references:StudentID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"student,omitempty"`
	AccessTokens []AccessToken `gorm:"polymorphic:Tokenable;polymorphicValue:User" json:"access_tokens,omitempty"`
	SecurityLogs []SecurityLog `gorm:"polymorphic:User;polymorphicValue:User" json:"security_logs,omitempty"`
}

// TableName specifies the table name for User model
func (User) TableName() string {
	return "users"
}

// BeforeCreate hook to hash password before creating user
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		u.Password = string(hashedPassword)
	}
	return nil
}

// BeforeUpdate hook to hash password before updating user if password is changed
func (u *User) BeforeUpdate(tx *gorm.DB) error {
	if tx.Statement.Changed("Password") && u.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
		if err != nil {
			return err
		}
		u.Password = string(hashedPassword)
	}
	return nil
}

// CheckPassword verifies if the provided password matches the user's password
func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
	return err == nil
}

// GetFullName returns the full name or email if full name is not set
func (u *User) GetFullName() string {
	if u.FullName != "" {
		return u.FullName
	}
	return u.Email
}

// IsActive checks if the user account is active
func (u *User) IsActive() bool {
	return u.Status == UserStatusActive
}

// IsEmailVerified checks if the user's email is verified
func (u *User) IsEmailVerified() bool {
	return u.EmailVerifiedAt != nil
}

// UpdateLastLogin updates the last login timestamp
func (u *User) UpdateLastLogin(db *gorm.DB) error {
	now := time.Now()
	u.LastLoginAt = &now
	return db.Model(u).Update("last_login_at", now).Error
}

// GetIdentifier returns the student ID as identifier for polymorphic relationships
func (u *User) GetIdentifier() string {
	return u.StudentID
}