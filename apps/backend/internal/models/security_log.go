package models

import (
	"time"
)

// SecurityAction represents different types of security actions
type SecurityAction string

const (
	SecurityActionLogin          SecurityAction = "login"
	SecurityActionLogout         SecurityAction = "logout"
	SecurityActionFailedLogin    SecurityAction = "failed_login"
	SecurityActionPasswordChange SecurityAction = "password_change"
	SecurityActionTokenRefresh   SecurityAction = "token_refresh"
	SecurityActionTokenRevoke    SecurityAction = "token_revoke"
	SecurityActionAccountLocked  SecurityAction = "account_locked"
	SecurityActionSuspiciousActivity SecurityAction = "suspicious_activity"
)

// SecurityLog represents the security_logs table for audit trail
type SecurityLog struct {
	ID        uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	UserType  string         `gorm:"column:user_type;not null;size:50" json:"user_type"` // "User" or "SuperAdmin"
	UserID    string         `gorm:"column:user_id;not null;size:50" json:"user_id"`     // student_id or admin id
	Action    SecurityAction `gorm:"not null;size:50" json:"action"`
	IPAddress string         `gorm:"column:ip_address;not null;size:45" json:"ip_address"` // IPv6 compatible
	UserAgent *string        `gorm:"column:user_agent;size:500" json:"user_agent"`
	Metadata  string         `gorm:"type:json" json:"metadata"` // Additional security-related data
	CreatedAt time.Time      `gorm:"autoCreateTime" json:"created_at"`
}

// TableName specifies the table name for SecurityLog model
func (SecurityLog) TableName() string {
	return "security_logs"
}

// SecurityLogMetadata represents the structure for metadata JSON
type SecurityLogMetadata struct {
	DeviceType    string `json:"device_type,omitempty"`
	Browser       string `json:"browser,omitempty"`
	OS            string `json:"os,omitempty"`
	Location      string `json:"location,omitempty"`
	FailureReason string `json:"failure_reason,omitempty"`
	TokenID       uint   `json:"token_id,omitempty"`
	SessionID     string `json:"session_id,omitempty"`
}