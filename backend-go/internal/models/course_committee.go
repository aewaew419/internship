package models

import (
	"time"
)

// CourseCommittee represents the course_committees table (many-to-many relationship between instructors and course sections for committee assignments)
type CourseCommittee struct {
	ID              uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	InstructorID    uint   `gorm:"column:instructor_id;not null" json:"instructor_id"`
	CourseSectionID uint   `gorm:"column:course_section_id;not null" json:"course_section_id"`
	Role            string `gorm:"default:member" json:"role"` // chair, member, secretary
	CreatedAt       time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt       time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	Instructor    Instructor    `gorm:"foreignKey:InstructorID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"instructor,omitempty"`
	CourseSection CourseSection `gorm:"foreignKey:CourseSectionID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"course_section,omitempty"`
}

// TableName specifies the table name for CourseCommittee model
func (CourseCommittee) TableName() string {
	return "course_committees"
}