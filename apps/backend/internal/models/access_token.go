package models

import (
	"time"

	"gorm.io/gorm"
)

// AccessToken represents the access_tokens table for enhanced token management
type AccessToken struct {
	ID            uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	TokenableType string    `gorm:"column:tokenable_type;not null;size:50" json:"tokenable_type"` // "User" or "SuperAdmin"
	TokenableID   string    `gorm:"column:tokenable_id;not null;size:50" json:"tokenable_id"`     // student_id or admin id
	Name          string    `gorm:"default:'auth_token';size:100" json:"name"`
	Token         string    `gorm:"uniqueIndex;not null;size:500" json:"token"`
	Abilities     string    `gorm:"type:json" json:"abilities"`     // JSON array of abilities/permissions
	ExpiresAt     time.Time `gorm:"column:expires_at;not null" json:"expires_at"`
	LastUsedAt    *time.Time `gorm:"column:last_used_at" json:"last_used_at"`
	CreatedAt     time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt     time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

// TableName specifies the table name for AccessToken model
func (AccessToken) TableName() string {
	return "access_tokens"
}

// IsExpired checks if the token has expired
func (at *AccessToken) IsExpired() bool {
	return time.Now().After(at.ExpiresAt)
}

// UpdateLastUsed updates the last used timestamp
func (at *AccessToken) UpdateLastUsed(db *gorm.DB) error {
	now := time.Now()
	at.LastUsedAt = &now
	return db.Model(at).Update("last_used_at", now).Error
}

// Revoke marks the token as expired
func (at *AccessToken) Revoke(db *gorm.DB) error {
	at.ExpiresAt = time.Now().Add(-time.Hour) // Set to past time
	return db.Model(at).Update("expires_at", at.ExpiresAt).Error
}