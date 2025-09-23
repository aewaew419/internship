package models

import (
	"time"
)

// StudentEnrollStatus represents the student_enroll_statuses table
type StudentEnrollStatus struct {
	ID           uint     `gorm:"primaryKey;autoIncrement" json:"id"`
	StudentID    uint     `gorm:"column:student_id;not null" json:"student_id"`
	Semester     string   `gorm:"not null" json:"semester"`
	Year         int      `gorm:"not null" json:"year"`
	Status       string   `gorm:"not null" json:"status"` // active, inactive, graduated, dropped
	GPA          *float64 `gorm:"column:gpa" json:"gpa"`
	Credits      int      `gorm:"default:0" json:"credits"`
	InstructorID *uint    `gorm:"column:instructor_id" json:"instructor_id"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	Student    Student     `gorm:"foreignKey:StudentID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"student,omitempty"`
	Instructor *Instructor `gorm:"foreignKey:InstructorID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL" json:"instructor,omitempty"`
}

// TableName specifies the table name for StudentEnrollStatus model
func (StudentEnrollStatus) TableName() string {
	return "student_enroll_statuses"
}