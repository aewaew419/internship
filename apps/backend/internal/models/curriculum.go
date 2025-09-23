package models

import (
	"time"

	"gorm.io/gorm"
)

// Curriculum represents the curriculums table
type Curriculum struct {
	ID               uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	CurriculumNameEN string `gorm:"column:curriculum_name_en;not null" json:"curriculum_name_en"`
	CurriculumNameTH string `gorm:"column:curriculum_name_th;not null" json:"curriculum_name_th"`
	ProgramID        uint   `gorm:"column:program_id;not null" json:"program_id"`
	CreatedAt        time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt        time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	Program  Program   `gorm:"foreignKey:ProgramID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"program,omitempty"`
	Majors   []Major   `gorm:"foreignKey:CurriculumID" json:"majors,omitempty"`
	Students []Student `gorm:"foreignKey:CurriculumID" json:"students,omitempty"`
}

// TableName specifies the table name for Curriculum model
func (Curriculum) TableName() string {
	return "curriculums"
}

// BeforeDelete hook to prevent deletion if there are related records
func (c *Curriculum) BeforeDelete(tx *gorm.DB) error {
	// Check if there are any majors associated with this curriculum
	var majorCount int64
	if err := tx.Model(&Major{}).Where("curriculum_id = ?", c.ID).Count(&majorCount).Error; err != nil {
		return err
	}
	if majorCount > 0 {
		return gorm.ErrForeignKeyViolated
	}

	// Check if there are any students associated with this curriculum
	var studentCount int64
	if err := tx.Model(&Student{}).Where("curriculum_id = ?", c.ID).Count(&studentCount).Error; err != nil {
		return err
	}
	if studentCount > 0 {
		return gorm.ErrForeignKeyViolated
	}

	return nil
}