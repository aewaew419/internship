package models

import (
	"time"

	"gorm.io/gorm"
)

// Faculty represents the faculties table
type Faculty struct {
	ID            uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Name          string    `gorm:"not null" json:"name"`
	Code          string    `gorm:"uniqueIndex;not null" json:"code"`
	Dean          *string   `json:"dean"`
	FacultyNameEN *string   `gorm:"column:faculty_name_en" json:"faculty_name_en"`
	FacultyNameTH *string   `gorm:"column:faculty_name_th" json:"faculty_name_th"`
	CampusID      uint      `gorm:"column:campus_id;not null" json:"campus_id"`
	CreatedAt     time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt     time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	Campus      Campus       `gorm:"foreignKey:CampusID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"campus,omitempty"`
	Programs    []Program    `gorm:"foreignKey:FacultyID" json:"programs,omitempty"`
	Students    []Student    `gorm:"foreignKey:FacultyID" json:"students,omitempty"`
	Instructors []Instructor `gorm:"foreignKey:FacultyID" json:"instructors,omitempty"`
}

// TableName specifies the table name for Faculty model
func (Faculty) TableName() string {
	return "faculties"
}

// BeforeDelete hook to prevent deletion if there are related records
func (f *Faculty) BeforeDelete(tx *gorm.DB) error {
	// Check if there are any programs associated with this faculty
	var programCount int64
	if err := tx.Model(&Program{}).Where("faculty_id = ?", f.ID).Count(&programCount).Error; err != nil {
		return err
	}
	if programCount > 0 {
		return gorm.ErrForeignKeyViolated
	}

	// Check if there are any students associated with this faculty
	var studentCount int64
	if err := tx.Model(&Student{}).Where("faculty_id = ?", f.ID).Count(&studentCount).Error; err != nil {
		return err
	}
	if studentCount > 0 {
		return gorm.ErrForeignKeyViolated
	}

	// Check if there are any instructors associated with this faculty
	var instructorCount int64
	if err := tx.Model(&Instructor{}).Where("faculty_id = ?", f.ID).Count(&instructorCount).Error; err != nil {
		return err
	}
	if instructorCount > 0 {
		return gorm.ErrForeignKeyViolated
	}

	return nil
}