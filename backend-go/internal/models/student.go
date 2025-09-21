package models

import (
	"time"

	"gorm.io/gorm"
)

// Student represents the students table
type Student struct {
	ID           uint    `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID       uint    `gorm:"column:user_id;uniqueIndex;not null" json:"user_id"`
	Name         string  `gorm:"not null" json:"name"`
	MiddleName   string  `gorm:"column:middle_name" json:"middle_name"`
	Surname      string  `gorm:"not null" json:"surname"`
	StudentID    string  `gorm:"column:student_id;uniqueIndex;not null" json:"student_id"`
	GPAX         float64 `gorm:"column:gpax;default:0.0" json:"gpax"`
	PhoneNumber  string  `gorm:"column:phone_number" json:"phone_number"`
	Email        string  `json:"email"`
	Picture      string  `json:"picture"`
	MajorID      *uint   `gorm:"column:major_id" json:"major_id"`
	ProgramID    *uint   `gorm:"column:program_id" json:"program_id"`
	CurriculumID *uint   `gorm:"column:curriculum_id" json:"curriculum_id"`
	FacultyID    *uint   `gorm:"column:faculty_id" json:"faculty_id"`
	CampusID     uint    `gorm:"column:campus_id;not null" json:"campus_id"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	User       User        `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"user,omitempty"`
	Major      *Major      `gorm:"foreignKey:MajorID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL" json:"major,omitempty"`
	Program    *Program    `gorm:"foreignKey:ProgramID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL" json:"program,omitempty"`
	Curriculum *Curriculum `gorm:"foreignKey:CurriculumID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL" json:"curriculum,omitempty"`
	Faculty    *Faculty    `gorm:"foreignKey:FacultyID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL" json:"faculty,omitempty"`
	Campus     Campus      `gorm:"foreignKey:CampusID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"campus,omitempty"`

	// Course enrollments
	StudentEnrolls []StudentEnroll `gorm:"foreignKey:StudentID" json:"student_enrolls,omitempty"`
	CourseSections []CourseSection `gorm:"many2many:student_enrolls;foreignKey:ID;joinForeignKey:StudentID;References:ID;joinReferences:CourseSectionID" json:"course_sections,omitempty"`
}

// TableName specifies the table name for Student model
func (Student) TableName() string {
	return "students"
}

// GetFullName returns the full name of the student
func (s *Student) GetFullName() string {
	fullName := s.Name
	if s.MiddleName != "" {
		fullName += " " + s.MiddleName
	}
	fullName += " " + s.Surname
	return fullName
}

// BeforeDelete hook to clean up related records when student is deleted
func (s *Student) BeforeDelete(tx *gorm.DB) error {
	// Delete all student enrollments for this student
	if err := tx.Where("student_id = ?", s.ID).Delete(&StudentEnroll{}).Error; err != nil {
		return err
	}
	return nil
}