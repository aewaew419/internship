package models

import (
	"time"

	"gorm.io/gorm"
)

// Campus represents the campuses table
type Campus struct {
	ID           uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Name         string    `gorm:"not null" json:"name"`
	Code         string    `gorm:"uniqueIndex;not null" json:"code"`
	Address      *string   `json:"address"`
	Phone        *string   `json:"phone"`
	Email        *string   `json:"email"`
	CampusNameEN *string   `gorm:"column:campus_name_en" json:"campus_name_en"`
	CampusNameTH *string   `gorm:"column:campus_name_th" json:"campus_name_th"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	Faculties []Faculty `gorm:"foreignKey:CampusID" json:"faculties,omitempty"`
	Students  []Student `gorm:"foreignKey:CampusID" json:"students,omitempty"`
}

// TableName specifies the table name for Campus model
func (Campus) TableName() string {
	return "campuses"
}

// BeforeDelete hook to prevent deletion if there are related records
func (c *Campus) BeforeDelete(tx *gorm.DB) error {
	// Check if there are any faculties associated with this campus
	var facultyCount int64
	if err := tx.Model(&Faculty{}).Where("campus_id = ?", c.ID).Count(&facultyCount).Error; err != nil {
		return err
	}
	if facultyCount > 0 {
		return gorm.ErrForeignKeyViolated
	}

	// Check if there are any students associated with this campus
	var studentCount int64
	if err := tx.Model(&Student{}).Where("campus_id = ?", c.ID).Count(&studentCount).Error; err != nil {
		return err
	}
	if studentCount > 0 {
		return gorm.ErrForeignKeyViolated
	}

	return nil
}