package models

import (
	"time"
)

// CourseInstructor represents the course_instructors table (many-to-many relationship between instructors and course sections)
type CourseInstructor struct {
	ID              uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	InstructorID    uint   `gorm:"column:instructor_id;not null" json:"instructor_id"`
	CourseSectionID uint   `gorm:"column:course_section_id;not null" json:"course_section_id"`
	Role            string `gorm:"default:instructor" json:"role"` // instructor, assistant, coordinator
	CreatedAt       time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt       time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	Instructor    Instructor    `gorm:"foreignKey:InstructorID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"instructor,omitempty"`
	CourseSection CourseSection `gorm:"foreignKey:CourseSectionID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"course_section,omitempty"`
}

// TableName specifies the table name for CourseInstructor model
func (CourseInstructor) TableName() string {
	return "course_instructors"
}