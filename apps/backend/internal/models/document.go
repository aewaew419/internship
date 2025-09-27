package models

import (
	"time"

	"gorm.io/gorm"
)

// DocumentType represents the document type enum
type DocumentType string

const (
	DocTypeApplication     DocumentType = "application"
	DocTypeContract        DocumentType = "contract"
	DocTypeEvaluation      DocumentType = "evaluation"
	DocTypeReport          DocumentType = "report"
	DocTypeCertificate     DocumentType = "certificate"
	DocTypeRecommendation  DocumentType = "recommendation"
	DocTypeInsurance       DocumentType = "insurance"
	DocTypeOther           DocumentType = "other"
)

// DocumentStatus represents the document status enum
type DocumentStatus string

const (
	DocStatusDraft     DocumentStatus = "draft"
	DocStatusPending   DocumentStatus = "pending"
	DocStatusApproved  DocumentStatus = "approved"
	DocStatusRejected  DocumentStatus = "rejected"
	DocStatusRevision  DocumentStatus = "revision"
	DocStatusArchived  DocumentStatus = "archived"
)

// Document represents the documents table
type Document struct {
	ID                uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	Title             string         `gorm:"not null" json:"title"`
	Description       string         `gorm:"type:text" json:"description"`
	DocumentType      DocumentType   `gorm:"not null" json:"document_type"`
	Status            DocumentStatus `gorm:"not null;default:draft" json:"status"`
	FilePath          string         `gorm:"not null" json:"file_path"`
	FileName          string         `gorm:"not null" json:"file_name"`
	FileSize          int64          `json:"file_size"`
	MimeType          string         `json:"mime_type"`
	Version           int            `gorm:"default:1" json:"version"`
	StudentTrainingID *uint          `gorm:"column:student_training_id" json:"student_training_id"`
	UploadedByID      uint           `gorm:"column:uploaded_by_id;not null" json:"uploaded_by_id"`
	ApprovedByID      *uint          `gorm:"column:approved_by_id" json:"approved_by_id"`
	ApprovedAt        *time.Time     `gorm:"column:approved_at" json:"approved_at"`
	DueDate           *time.Time     `gorm:"column:due_date" json:"due_date"`
	SubmittedAt       *time.Time     `gorm:"column:submitted_at" json:"submitted_at"`
	CreatedAt         time.Time      `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt         time.Time      `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	StudentTraining *StudentTraining `gorm:"foreignKey:StudentTrainingID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL" json:"student_training,omitempty"`
	UploadedBy      User             `gorm:"foreignKey:UploadedByID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"uploaded_by,omitempty"`
	ApprovedBy      *User            `gorm:"foreignKey:ApprovedByID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL" json:"approved_by,omitempty"`
	Approvals       []DocumentApproval `gorm:"foreignKey:DocumentID" json:"approvals,omitempty"`
	Comments        []DocumentComment  `gorm:"foreignKey:DocumentID" json:"comments,omitempty"`
}

// TableName specifies the table name for Document model
func (Document) TableName() string {
	return "documents"
}

// DocumentApproval represents the document_approvals table
type DocumentApproval struct {
	ID           uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	DocumentID   uint           `gorm:"not null" json:"document_id"`
	ApproverID   uint           `gorm:"not null" json:"approver_id"`
	Status       DocumentStatus `gorm:"not null" json:"status"`
	Comments     string         `gorm:"type:text" json:"comments"`
	ApprovedAt   time.Time      `gorm:"autoCreateTime" json:"approved_at"`
	CreatedAt    time.Time      `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time      `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	Document Document `gorm:"foreignKey:DocumentID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"document,omitempty"`
	Approver User     `gorm:"foreignKey:ApproverID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"approver,omitempty"`
}

// TableName specifies the table name for DocumentApproval model
func (DocumentApproval) TableName() string {
	return "document_approvals"
}

// DocumentComment represents the document_comments table
type DocumentComment struct {
	ID         uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	DocumentID uint      `gorm:"not null" json:"document_id"`
	UserID     uint      `gorm:"not null" json:"user_id"`
	Comment    string    `gorm:"type:text;not null" json:"comment"`
	CreatedAt  time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt  time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	Document Document `gorm:"foreignKey:DocumentID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"document,omitempty"`
	User     User     `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"user,omitempty"`
}

// TableName specifies the table name for DocumentComment model
func (DocumentComment) TableName() string {
	return "document_comments"
}

// DocumentTemplate represents the document_templates table
type DocumentTemplate struct {
	ID           uint         `gorm:"primaryKey;autoIncrement" json:"id"`
	Name         string       `gorm:"not null" json:"name"`
	Description  string       `gorm:"type:text" json:"description"`
	DocumentType DocumentType `gorm:"not null" json:"document_type"`
	TemplatePath string       `gorm:"not null" json:"template_path"`
	IsActive     bool         `gorm:"default:true" json:"is_active"`
	CreatedAt    time.Time    `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time    `gorm:"autoUpdateTime" json:"updated_at"`
}

// TableName specifies the table name for DocumentTemplate model
func (DocumentTemplate) TableName() string {
	return "document_templates"
}

// BeforeDelete hook to clean up related records when document is deleted
func (d *Document) BeforeDelete(tx *gorm.DB) error {
	// Delete all document approvals
	if err := tx.Where("document_id = ?", d.ID).Delete(&DocumentApproval{}).Error; err != nil {
		return err
	}

	// Delete all document comments
	if err := tx.Where("document_id = ?", d.ID).Delete(&DocumentComment{}).Error; err != nil {
		return err
	}

	return nil
}

// GetStatusDisplayText returns Thai display text for document status
func (d *Document) GetStatusDisplayText() string {
	statusTexts := map[DocumentStatus]string{
		DocStatusDraft:     "ร่าง",
		DocStatusPending:   "รอการอนุมัติ",
		DocStatusApproved:  "อนุมัติแล้ว",
		DocStatusRejected:  "ปฏิเสธ",
		DocStatusRevision:  "ต้องแก้ไข",
		DocStatusArchived:  "เก็บถาวร",
	}

	if text, exists := statusTexts[d.Status]; exists {
		return text
	}
	return string(d.Status)
}

// GetTypeDisplayText returns Thai display text for document type
func (d *Document) GetTypeDisplayText() string {
	typeTexts := map[DocumentType]string{
		DocTypeApplication:    "ใบสมัคร",
		DocTypeContract:       "สัญญา",
		DocTypeEvaluation:     "การประเมิน",
		DocTypeReport:         "รายงาน",
		DocTypeCertificate:    "ใบรับรอง",
		DocTypeRecommendation: "หนังสือแนะนำ",
		DocTypeInsurance:      "ประกันภัย",
		DocTypeOther:          "อื่นๆ",
	}

	if text, exists := typeTexts[d.DocumentType]; exists {
		return text
	}
	return string(d.DocumentType)
}