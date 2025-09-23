package models

import (
	"time"

	"gorm.io/gorm"
)

// StudentEnroll represents the student_enrolls table (many-to-many relationship between students and course sections)
type StudentEnroll struct {
	ID              uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	StudentID       uint      `gorm:"column:student_id;not null" json:"student_id"`
	CourseSectionID uint      `gorm:"column:course_section_id;not null" json:"course_section_id"`
	EnrollDate      time.Time `gorm:"column:enroll_date;default:CURRENT_TIMESTAMP" json:"enroll_date"`
	Status          string    `gorm:"default:enrolled" json:"status"` // enrolled, dropped, completed
	Grade           *string   `json:"grade"`
	GradePoints     *float64  `gorm:"column:grade_points" json:"grade_points"`
	CreatedAt       time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt       time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	Student       Student       `gorm:"foreignKey:StudentID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"student,omitempty"`
	CourseSection CourseSection `gorm:"foreignKey:CourseSectionID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"course_section,omitempty"`
}

// TableName specifies the table name for StudentEnroll model
func (StudentEnroll) TableName() string {
	return "student_enrolls"
}

// BeforeCreate hook to set default enroll date
func (se *StudentEnroll) BeforeCreate(tx *gorm.DB) error {
	if se.EnrollDate.IsZero() {
		se.EnrollDate = time.Now()
	}
	return nil
}