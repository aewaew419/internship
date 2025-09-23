package models

import (
	"time"

	"gorm.io/gorm"
)

// Instructor represents the instructors table
type Instructor struct {
	ID         uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID     uint   `gorm:"column:user_id;uniqueIndex;not null" json:"user_id"`
	StaffID    string `gorm:"column:staff_id;uniqueIndex;not null" json:"staff_id"`
	Name       string `gorm:"not null" json:"name"`
	MiddleName string `gorm:"column:middle_name" json:"middle_name"`
	Surname    string `gorm:"not null" json:"surname"`
	FacultyID  uint   `gorm:"column:faculty_id;not null" json:"faculty_id"`
	ProgramID  uint   `gorm:"column:program_id;not null" json:"program_id"`
	CreatedAt  time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt  time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	User    User    `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"user,omitempty"`
	Faculty Faculty `gorm:"foreignKey:FacultyID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"faculty,omitempty"`
	Program Program `gorm:"foreignKey:ProgramID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"program,omitempty"`

	// Course relationships
	CourseInstructors []CourseInstructor `gorm:"foreignKey:InstructorID" json:"course_instructors,omitempty"`
	CourseSections    []CourseSection    `gorm:"many2many:course_instructors;foreignKey:ID;joinForeignKey:InstructorID;References:ID;joinReferences:CourseSectionID" json:"course_sections,omitempty"`
	CourseCommittees  []CourseSection    `gorm:"many2many:course_committees;foreignKey:ID;joinForeignKey:InstructorID;References:ID;joinReferences:CourseSectionID" json:"course_committees,omitempty"`

	// Student enrollment statuses
	StudentEnrollStatuses []StudentEnrollStatus `gorm:"foreignKey:InstructorID" json:"student_enroll_statuses,omitempty"`
}

// TableName specifies the table name for Instructor model
func (Instructor) TableName() string {
	return "instructors"
}

// GetFullName returns the full name of the instructor
func (i *Instructor) GetFullName() string {
	fullName := i.Name
	if i.MiddleName != "" {
		fullName += " " + i.MiddleName
	}
	fullName += " " + i.Surname
	return fullName
}

// BeforeDelete hook to clean up related records when instructor is deleted
func (i *Instructor) BeforeDelete(tx *gorm.DB) error {
	// Delete all course instructor assignments for this instructor
	if err := tx.Where("instructor_id = ?", i.ID).Delete(&CourseInstructor{}).Error; err != nil {
		return err
	}

	// Delete all course committee assignments for this instructor
	if err := tx.Where("instructor_id = ?", i.ID).Delete(&CourseCommittee{}).Error; err != nil {
		return err
	}

	// Update student enroll statuses to remove instructor reference
	if err := tx.Model(&StudentEnrollStatus{}).Where("instructor_id = ?", i.ID).Update("instructor_id", nil).Error; err != nil {
		return err
	}

	return nil
}

// InstructorResponse represents the response structure for instructor data
type InstructorResponse struct {
	ID         uint      `json:"id"`
	UserID     uint      `json:"user_id"`
	StaffID    string    `json:"staff_id"`
	Name       string    `json:"name"`
	MiddleName string    `json:"middle_name"`
	Surname    string    `json:"surname"`
	FullName   string    `json:"full_name"`
	FacultyID  uint      `json:"faculty_id"`
	ProgramID  uint      `json:"program_id"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

// ToResponse converts Instructor to InstructorResponse
func (i *Instructor) ToResponse() InstructorResponse {
	return InstructorResponse{
		ID:         i.ID,
		UserID:     i.UserID,
		StaffID:    i.StaffID,
		Name:       i.Name,
		MiddleName: i.MiddleName,
		Surname:    i.Surname,
		FullName:   i.GetFullName(),
		FacultyID:  i.FacultyID,
		ProgramID:  i.ProgramID,
		CreatedAt:  i.CreatedAt,
		UpdatedAt:  i.UpdatedAt,
	}
}