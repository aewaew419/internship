package models

import (
	"time"
)

// CompanyPicture represents the company_pictures table
type CompanyPicture struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Picture   *string   `json:"picture"`
	CompanyID uint      `gorm:"column:company_id;not null" json:"company_id"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	Company Company `gorm:"foreignKey:CompanyID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"company,omitempty"`
}

// TableName specifies the table name for CompanyPicture model
func (CompanyPicture) TableName() string {
	return "company_pictures"
}