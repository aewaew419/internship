package models

import (
	"time"

	"gorm.io/gorm"
)

// Major represents the majors table
type Major struct {
	ID          uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	MajorNameEN string `gorm:"column:major_name_en;not null" json:"major_name_en"`
	MajorNameTH string `gorm:"column:major_name_th;not null" json:"major_name_th"`
	CurriculumID uint   `gorm:"column:curriculum_id;not null" json:"curriculum_id"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	Curriculum Curriculum `gorm:"foreignKey:CurriculumID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"curriculum,omitempty"`
	Students   []Student  `gorm:"foreignKey:MajorID" json:"students,omitempty"`
}

// TableName specifies the table name for Major model
func (Major) TableName() string {
	return "majors"
}

// BeforeDelete hook to prevent deletion if there are related records
func (m *Major) BeforeDelete(tx *gorm.DB) error {
	// Check if there are any students associated with this major
	var studentCount int64
	if err := tx.Model(&Student{}).Where("major_id = ?", m.ID).Count(&studentCount).Error; err != nil {
		return err
	}
	if studentCount > 0 {
		return gorm.ErrForeignKeyViolated
	}

	return nil
}