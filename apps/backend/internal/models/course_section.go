package models

import (
	"time"

	"gorm.io/gorm"
)

// CourseSection represents the course_sections table
type CourseSection struct {
	ID        uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	CourseID  uint   `gorm:"column:course_id;not null" json:"course_id"`
	Section   string `gorm:"not null" json:"section"`
	Semester  string `gorm:"not null" json:"semester"`
	Year      int    `gorm:"not null" json:"year"`
	MaxStudents int  `gorm:"column:max_students;default:30" json:"max_students"`
	Schedule  string `json:"schedule"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	Course Course `gorm:"foreignKey:CourseID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"course,omitempty"`
	
	// Student enrollments
	StudentEnrolls []StudentEnroll `gorm:"foreignKey:CourseSectionID" json:"student_enrolls,omitempty"`
	Students       []Student       `gorm:"many2many:student_enrolls;foreignKey:ID;joinForeignKey:CourseSectionID;References:ID;joinReferences:StudentID" json:"students,omitempty"`
	
	// Instructor assignments
	CourseInstructors []CourseInstructor `gorm:"foreignKey:CourseSectionID" json:"course_instructors,omitempty"`
	Instructors       []Instructor       `gorm:"many2many:course_instructors;foreignKey:ID;joinForeignKey:CourseSectionID;References:ID;joinReferences:InstructorID" json:"instructors,omitempty"`
	
	// Committee assignments
	CourseCommittees []CourseCommittee `gorm:"foreignKey:CourseSectionID" json:"course_committees,omitempty"`
	CommitteeMembers []Instructor      `gorm:"many2many:course_committees;foreignKey:ID;joinForeignKey:CourseSectionID;References:ID;joinReferences:InstructorID" json:"committee_members,omitempty"`
}

// TableName specifies the table name for CourseSection model
func (CourseSection) TableName() string {
	return "course_sections"
}

// BeforeDelete hook to clean up related records when course section is deleted
func (cs *CourseSection) BeforeDelete(tx *gorm.DB) error {
	// Delete all student enrollments for this course section
	if err := tx.Where("course_section_id = ?", cs.ID).Delete(&StudentEnroll{}).Error; err != nil {
		return err
	}

	// Delete all course instructor assignments for this course section
	if err := tx.Where("course_section_id = ?", cs.ID).Delete(&CourseInstructor{}).Error; err != nil {
		return err
	}

	// Delete all course committee assignments for this course section
	if err := tx.Where("course_section_id = ?", cs.ID).Delete(&CourseCommittee{}).Error; err != nil {
		return err
	}

	return nil
}