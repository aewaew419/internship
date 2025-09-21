package models

import (
	"time"

	"gorm.io/gorm"
)

// Program represents the programs table
type Program struct {
	ID            uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	ProgramNameEN string `gorm:"column:program_name_en;not null" json:"program_name_en"`
	ProgramNameTH string `gorm:"column:program_name_th;not null" json:"program_name_th"`
	FacultyID     uint   `gorm:"column:faculty_id;not null" json:"faculty_id"`
	CreatedAt     time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt     time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	Faculty     Faculty      `gorm:"foreignKey:FacultyID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"faculty,omitempty"`
	Curriculums []Curriculum `gorm:"foreignKey:ProgramID" json:"curriculums,omitempty"`
	Students    []Student    `gorm:"foreignKey:ProgramID" json:"students,omitempty"`
	Instructors []Instructor `gorm:"foreignKey:ProgramID" json:"instructors,omitempty"`
}

// TableName specifies the table name for Program model
func (Program) TableName() string {
	return "programs"
}

// BeforeDelete hook to prevent deletion if there are related records
func (p *Program) BeforeDelete(tx *gorm.DB) error {
	// Check if there are any curriculums associated with this program
	var curriculumCount int64
	if err := tx.Model(&Curriculum{}).Where("program_id = ?", p.ID).Count(&curriculumCount).Error; err != nil {
		return err
	}
	if curriculumCount > 0 {
		return gorm.ErrForeignKeyViolated
	}

	// Check if there are any students associated with this program
	var studentCount int64
	if err := tx.Model(&Student{}).Where("program_id = ?", p.ID).Count(&studentCount).Error; err != nil {
		return err
	}
	if studentCount > 0 {
		return gorm.ErrForeignKeyViolated
	}

	// Check if there are any instructors associated with this program
	var instructorCount int64
	if err := tx.Model(&Instructor{}).Where("program_id = ?", p.ID).Count(&instructorCount).Error; err != nil {
		return err
	}
	if instructorCount > 0 {
		return gorm.ErrForeignKeyViolated
	}

	return nil
}