package models

import (
	"time"

	"gorm.io/gorm"
)

// Company represents the companies table
type Company struct {
	ID                     uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	CompanyRegisterNumber  string `gorm:"column:company_register_number;not null" json:"company_register_number"`
	CompanyNameEn          string `gorm:"column:company_name_en;not null" json:"company_name_en"`
	CompanyNameTh          string `gorm:"column:company_name_th;not null" json:"company_name_th"`
	CompanyAddress         string `gorm:"column:company_address;not null" json:"company_address"`
	CompanyMap             string `gorm:"column:company_map" json:"company_map"`
	CompanyEmail           string `gorm:"column:company_email" json:"company_email"`
	CompanyPhoneNumber     string `gorm:"column:company_phone_number" json:"company_phone_number"`
	CompanyType            string `gorm:"column:company_type" json:"company_type"`
	CreatedAt              time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt              time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	CompanyPictures []CompanyPicture `gorm:"foreignKey:CompanyID" json:"company_pictures,omitempty"`
	StudentTrainings []StudentTraining `gorm:"foreignKey:CompanyID" json:"student_trainings,omitempty"`
}

// TableName specifies the table name for Company model
func (Company) TableName() string {
	return "companies"
}

// BeforeDelete hook to clean up related records when company is deleted
func (c *Company) BeforeDelete(tx *gorm.DB) error {
	// Delete all company pictures for this company
	if err := tx.Where("company_id = ?", c.ID).Delete(&CompanyPicture{}).Error; err != nil {
		return err
	}

	// Update student trainings to remove company reference
	if err := tx.Model(&StudentTraining{}).Where("company_id = ?", c.ID).Update("company_id", nil).Error; err != nil {
		return err
	}

	return nil
}