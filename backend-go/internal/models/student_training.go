package models

import (
	"time"

	"gorm.io/gorm"
)

// DocumentLanguage represents the document language enum
type DocumentLanguage string

const (
	DocumentLanguageTH DocumentLanguage = "th"
	DocumentLanguageEN DocumentLanguage = "en"
)

// StudentTraining represents the student_trainings table
type StudentTraining struct {
	ID                       uint             `gorm:"primaryKey;autoIncrement" json:"id"`
	StudentEnrollID          uint             `gorm:"column:student_enroll_id;not null" json:"student_enroll_id"`
	StartDate                time.Time        `gorm:"column:start_date;not null" json:"start_date"`
	EndDate                  time.Time        `gorm:"column:end_date;not null" json:"end_date"`
	Coordinator              string           `gorm:"not null" json:"coordinator"`
	CoordinatorPhoneNumber   string           `gorm:"column:coordinator_phone_number" json:"coordinator_phone_number"`
	CoordinatorEmail         string           `gorm:"column:coordinator_email" json:"coordinator_email"`
	Supervisor               string           `gorm:"not null" json:"supervisor"`
	SupervisorPhoneNumber    string           `gorm:"column:supervisor_phone_number" json:"supervisor_phone_number"`
	SupervisorEmail          string           `gorm:"column:supervisor_email" json:"supervisor_email"`
	Department               string           `gorm:"not null" json:"department"`
	Position                 string           `gorm:"not null" json:"position"`
	JobDescription           string           `gorm:"column:job_description;type:text" json:"job_description"`
	DocumentLanguage         DocumentLanguage `gorm:"column:document_language;type:enum('th','en');default:'th'" json:"document_language"`
	CompanyID                *uint            `gorm:"column:company_id" json:"company_id"`
	CreatedAt                time.Time        `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt                time.Time        `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	StudentEnroll           StudentEnroll             `gorm:"foreignKey:StudentEnrollID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"student_enroll,omitempty"`
	Company                 *Company                  `gorm:"foreignKey:CompanyID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL" json:"company,omitempty"`
	StudentEvaluateCompany  []StudentEvaluateCompany  `gorm:"foreignKey:StudentTrainingID" json:"student_evaluate_company,omitempty"`
	VisitorEvaluateCompany  []VisitorEvaluateCompany  `gorm:"foreignKey:StudentTrainingID" json:"visitor_evaluate_company,omitempty"`
}

// TableName specifies the table name for StudentTraining model
func (StudentTraining) TableName() string {
	return "student_trainings"
}

// BeforeDelete hook to clean up related records when student training is deleted
func (st *StudentTraining) BeforeDelete(tx *gorm.DB) error {
	// Delete all student evaluations for this training
	if err := tx.Where("student_training_id = ?", st.ID).Delete(&StudentEvaluateCompany{}).Error; err != nil {
		return err
	}

	// Delete all visitor evaluations for this training
	if err := tx.Where("student_training_id = ?", st.ID).Delete(&VisitorEvaluateCompany{}).Error; err != nil {
		return err
	}

	return nil
}