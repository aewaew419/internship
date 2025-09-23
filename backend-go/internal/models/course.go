package models

import (
	"time"

	"gorm.io/gorm"
)

// Course represents the courses table
type Course struct {
	ID            uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	CurriculumID  uint   `gorm:"column:curriculum_id;not null" json:"curriculum_id"`
	Code          string `gorm:"uniqueIndex;not null" json:"code"`
	Name          string `gorm:"not null" json:"name"`
	Credits       int    `gorm:"not null" json:"credits"`
	Description   string `json:"description"`
	Prerequisites string `json:"prerequisites"`
	CreatedAt     time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt     time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	Curriculum Curriculum      `gorm:"foreignKey:CurriculumID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"curriculum,omitempty"`
	Sections   []CourseSection `gorm:"foreignKey:CourseID" json:"sections,omitempty"`
}

// TableName specifies the table name for Course model
func (Course) TableName() string {
	return "courses"
}

// BeforeDelete hook to prevent deletion if there are related records
func (c *Course) BeforeDelete(tx *gorm.DB) error {
	// Check if there are any course sections associated with this course
	var sectionCount int64
	if err := tx.Model(&CourseSection{}).Where("course_id = ?", c.ID).Count(&sectionCount).Error; err != nil {
		return err
	}
	if sectionCount > 0 {
		return gorm.ErrForeignKeyViolated
	}

	return nil
}

// CourseResponse represents the response structure for course data
type CourseResponse struct {
	ID            uint      `json:"id"`
	CurriculumID  uint      `json:"curriculum_id"`
	Code          string    `json:"code"`
	Name          string    `json:"name"`
	Credits       int       `json:"credits"`
	Description   string    `json:"description"`
	Prerequisites string    `json:"prerequisites"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// ToResponse converts Course to CourseResponse
func (c *Course) ToResponse() CourseResponse {
	return CourseResponse{
		ID:            c.ID,
		CurriculumID:  c.CurriculumID,
		Code:          c.Code,
		Name:          c.Name,
		Credits:       c.Credits,
		Description:   c.Description,
		Prerequisites: c.Prerequisites,
		CreatedAt:     c.CreatedAt,
		UpdatedAt:     c.UpdatedAt,
	}
}