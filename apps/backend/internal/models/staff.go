package models

import (
	"time"
)

// Staff represents the staffs table
type Staff struct {
	ID        uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    uint   `gorm:"column:user_id;uniqueIndex;not null" json:"user_id"`
	StaffID   string `gorm:"column:staff_id;uniqueIndex;not null" json:"staff_id"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	User User `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"user,omitempty"`
}

// TableName specifies the table name for Staff model
func (Staff) TableName() string {
	return "staffs"
}