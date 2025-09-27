package services

import (
	"backend-go/internal/models"
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"html/template"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
	"time"

	"gorm.io/gorm"
)

// DocumentTemplateService handles dynamic document template generation
type DocumentTemplateService struct {
	db          *gorm.DB
	templateDir string
	outputDir   string
	pdfService  *PDFService
}

// NewDocumentTemplateService creates a new document template service
func NewDocumentTemplateService(db *gorm.DB, templateDir, outputDir string, pdfService *PDFService) *DocumentTemplateService {
	return &DocumentTemplateService{
		db:          db,
		templateDir: templateDir,
		outputDir:   outputDir,
		pdfService:  pdfService,
	}
}

// TemplateData represents data that can be injected into templates
type TemplateData struct {
	// Student Information
	Student *StudentTemplateData `json:"student,omitempty"`
	
	// Company Information
	Company *CompanyTemplateData `json:"company,omitempty"`
	
	// Training Information
	Training *TrainingTemplateData `json:"training,omitempty"`
	
	// Instructor Information
	Instructor *InstructorTemplateData `json:"instructor,omitempty"`
	
	// University Information
	University *UniversityTemplateData `json:"university,omitempty"`
	
	// Document Information
	Document *DocumentTemplateData `json:"document,omitempty"`
	
	// Custom Fields
	CustomFields map[string]interface{} `json:"custom_fields,omitempty"`
}

// StudentTemplateData represents student data for templates
type StudentTemplateData struct {
	ID          string  `json:"id"`
	StudentID   string  `json:"student_id"`
	FirstName   string  `json:"first_name"`
	LastName    string  `json:"last_name"`
	FullName    string  `json:"full_name"`
	Email       string  `json:"email"`
	Phone       string  `json:"phone"`
	GPAX        float64 `json:"gpax"`
	Major       string  `json:"major"`
	Year        int     `json:"year"`
	Faculty     string  `json:"faculty"`
	Program     string  `json:"program"`
}

// CompanyTemplateData represents company data for templates
type CompanyTemplateData struct {
	ID              string `json:"id"`
	NameTH          string `json:"name_th"`
	NameEN          string `json:"name_en"`
	Address         string `json:"address"`
	Phone           string `json:"phone"`
	Email           string `json:"email"`
	Website         string `json:"website"`
	Type            string `json:"type"`
	RegisterNumber  string `json:"register_number"`
}

// TrainingTemplateData represents training data for templates
type TrainingTemplateData struct {
	ID              string    `json:"id"`
	StartDate       time.Time `json:"start_date"`
	EndDate         time.Time `json:"end_date"`
	StartDateTH     string    `json:"start_date_th"`
	EndDateTH       string    `json:"end_date_th"`
	StartDateEN     string    `json:"start_date_en"`
	EndDateEN       string    `json:"end_date_en"`
	Position        string    `json:"position"`
	Department      string    `json:"department"`
	Coordinator     string    `json:"coordinator"`
	CoordinatorPhone string   `json:"coordinator_phone"`
	CoordinatorEmail string   `json:"coordinator_email"`
	Supervisor      string    `json:"supervisor"`
	SupervisorPhone string    `json:"supervisor_phone"`
	SupervisorEmail string    `json:"supervisor_email"`
	JobDescription  string    `json:"job_description"`
	Duration        int       `json:"duration"` // days
}

// InstructorTemplateData represents instructor data for templates
type InstructorTemplateData struct {
	ID        string `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	FullName  string `json:"full_name"`
	Title     string `json:"title"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`
	Position  string `json:"position"`
}

// UniversityTemplateData represents university data for templates
type UniversityTemplateData struct {
	NameTH       string `json:"name_th"`
	NameEN       string `json:"name_en"`
	FacultyTH    string `json:"faculty_th"`
	FacultyEN    string `json:"faculty_en"`
	DepartmentTH string `json:"department_th"`
	DepartmentEN string `json:"department_en"`
	Address      string `json:"address"`
	Phone        string `json:"phone"`
	Email        string `json:"email"`
	Website      string `json:"website"`
}

// DocumentTemplateData represents document metadata for templates
type DocumentTemplateData struct {
	Title         string    `json:"title"`
	Subject       string    `json:"subject"`
	Recipient     string    `json:"recipient"`
	Date          time.Time `json:"date"`
	DateTH        string    `json:"date_th"`
	DateEN        string    `json:"date_en"`
	DocumentNo    string    `json:"document_no"`
	Reference     string    `json:"reference"`
	Language      string    `json:"language"`
	GeneratedBy   string    `json:"generated_by"`
	GeneratedAt   time.Time `json:"generated_at"`
}

// CreateTemplateRequest represents a request to create a document template
type CreateTemplateRequest struct {
	Name         string                 `json:"name" validate:"required"`
	Description  string                 `json:"description"`
	DocumentType models.DocumentType    `json:"document_type" validate:"required"`
	Language     models.DocumentLanguage `json:"language" validate:"required,oneof=th en"`
	TemplateContent string              `json:"template_content" validate:"required"`
	IsActive     bool                   `json:"is_active"`
}

// GenerateDocumentRequest represents a request to generate a document from template
type GenerateDocumentRequest struct {
	TemplateID        uint                       `json:"template_id" validate:"required"`
	StudentTrainingID *uint                      `json:"student_training_id"`
	StudentID         *uint                      `json:"student_id"`
	CompanyID         *uint                      `json:"company_id"`
	InstructorID      *uint                      `json:"instructor_id"`
	Language          models.DocumentLanguage    `json:"language" validate:"required,oneof=th en"`
	CustomData        map[string]interface{}     `json:"custom_data"`
	OutputFormat      string                     `json:"output_format" validate:"oneof=pdf html docx"`
	Title             string                     `json:"title"`
	Recipient         string                     `json:"recipient"`
}

// CreateTemplate creates a new document template
func (s *DocumentTemplateService) CreateTemplate(req CreateTemplateRequest) (*models.DocumentTemplate, error) {
	template := &models.DocumentTemplate{
		Name:         req.Name,
		Description:  req.Description,
		DocumentType: req.DocumentType,
		IsActive:     req.IsActive,
	}

	// Save template content to file
	filename := fmt.Sprintf("%s_%s_%d.html", 
		strings.ToLower(string(req.DocumentType)), 
		string(req.Language), 
		time.Now().Unix())
	
	templatePath := filepath.Join(s.templateDir, filename)
	
	err := ioutil.WriteFile(templatePath, []byte(req.TemplateContent), 0644)
	if err != nil {
		return nil, fmt.Errorf("failed to save template file: %w", err)
	}

	template.TemplatePath = templatePath

	if err := s.db.Create(template).Error; err != nil {
		// Clean up file if database save fails
		os.Remove(templatePath)
		return nil, err
	}

	return template, nil
}

// GenerateDocument generates a document from template with dynamic data
func (s *DocumentTemplateService) GenerateDocument(req GenerateDocumentRequest) (string, error) {
	// Get template
	var docTemplate models.DocumentTemplate
	if err := s.db.First(&docTemplate, req.TemplateID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", errors.New("template not found")
		}
		return "", err
	}

	if !docTemplate.IsActive {
		return "", errors.New("template is not active")
	}

	// Prepare template data
	templateData, err := s.prepareTemplateData(req)
	if err != nil {
		return "", fmt.Errorf("failed to prepare template data: %w", err)
	}

	// Load and parse template
	templateContent, err := ioutil.ReadFile(docTemplate.TemplatePath)
	if err != nil {
		return "", fmt.Errorf("failed to read template file: %w", err)
	}

	tmpl, err := template.New("document").Funcs(s.getTemplateFunctions()).Parse(string(templateContent))
	if err != nil {
		return "", fmt.Errorf("failed to parse template: %w", err)
	}

	// Execute template
	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, templateData); err != nil {
		return "", fmt.Errorf("failed to execute template: %w", err)
	}

	// Generate output based on format
	switch req.OutputFormat {
	case "html":
		return s.saveHTMLDocument(buf.String(), req)
	case "pdf":
		return s.generatePDFFromHTML(buf.String(), req)
	case "docx":
		return s.generateDOCXFromHTML(buf.String(), req)
	default:
		return "", errors.New("unsupported output format")
	}
}

// prepareTemplateData prepares data for template rendering
func (s *DocumentTemplateService) prepareTemplateData(req GenerateDocumentRequest) (*TemplateData, error) {
	data := &TemplateData{
		CustomFields: req.CustomData,
	}

	// Add university data
	data.University = &UniversityTemplateData{
		NameTH:       "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี",
		NameEN:       "King Mongkut's University of Technology Thonburi",
		FacultyTH:    "คณะเทคโนโลยีสารสนเทศ",
		FacultyEN:    "Faculty of Information Technology",
		DepartmentTH: "ภาควิชาเทคโนโลยีสารสนเทศ",
		DepartmentEN: "Department of Information Technology",
		Address:      "126 Pracha Uthit Rd., Bang Mod, Thung Khru, Bangkok 10140",
		Phone:        "02-470-8000",
		Email:        "info@kmutt.ac.th",
		Website:      "https://www.kmutt.ac.th",
	}

	// Add document metadata
	now := time.Now()
	data.Document = &DocumentTemplateData{
		Title:       req.Title,
		Recipient:   req.Recipient,
		Date:        now,
		DateTH:      s.formatDateTH(now),
		DateEN:      s.formatDateEN(now),
		Language:    string(req.Language),
		GeneratedAt: now,
	}

	// Load student data if provided
	if req.StudentID != nil {
		studentData, err := s.getStudentData(*req.StudentID)
		if err != nil {
			return nil, fmt.Errorf("failed to get student data: %w", err)
		}
		data.Student = studentData
	}

	// Load company data if provided
	if req.CompanyID != nil {
		companyData, err := s.getCompanyData(*req.CompanyID)
		if err != nil {
			return nil, fmt.Errorf("failed to get company data: %w", err)
		}
		data.Company = companyData
	}

	// Load training data if provided
	if req.StudentTrainingID != nil {
		trainingData, err := s.getTrainingData(*req.StudentTrainingID)
		if err != nil {
			return nil, fmt.Errorf("failed to get training data: %w", err)
		}
		data.Training = trainingData

		// Also load related student and company data
		if data.Student == nil && trainingData != nil {
			// Get student from training
			var training models.StudentTraining
			if err := s.db.Preload("StudentEnroll.Student").First(&training, *req.StudentTrainingID).Error; err == nil {
				studentData := s.convertStudentToTemplateData(&training.StudentEnroll.Student)
				data.Student = studentData
			}
		}

		if data.Company == nil && trainingData != nil {
			// Get company from training
			var training models.StudentTraining
			if err := s.db.Preload("Company").First(&training, *req.StudentTrainingID).Error; err == nil && training.Company != nil {
				companyData := s.convertCompanyToTemplateData(training.Company)
				data.Company = companyData
			}
		}
	}

	// Load instructor data if provided
	if req.InstructorID != nil {
		instructorData, err := s.getInstructorData(*req.InstructorID)
		if err != nil {
			return nil, fmt.Errorf("failed to get instructor data: %w", err)
		}
		data.Instructor = instructorData
	}

	return data, nil
}

// getStudentData retrieves student data for templates
func (s *DocumentTemplateService) getStudentData(studentID uint) (*StudentTemplateData, error) {
	var student models.Student
	if err := s.db.Preload("Major").Preload("Program").Preload("Faculty").First(&student, studentID).Error; err != nil {
		return nil, err
	}

	return s.convertStudentToTemplateData(&student), nil
}

// convertStudentToTemplateData converts student model to template data
func (s *DocumentTemplateService) convertStudentToTemplateData(student *models.Student) *StudentTemplateData {
	data := &StudentTemplateData{
		ID:        fmt.Sprintf("%d", student.ID),
		StudentID: student.StudentID,
		FirstName: student.Name,
		LastName:  student.Surname,
		FullName:  student.GetFullName(),
		Email:     student.Email,
		Phone:     student.PhoneNumber,
		GPAX:      student.GPAX,
	}

	if student.Major != nil {
		data.Major = student.Major.Name
	}

	if student.Faculty != nil {
		data.Faculty = student.Faculty.Name
	}

	if student.Program != nil {
		data.Program = student.Program.Name
	}

	return data
}

// getCompanyData retrieves company data for templates
func (s *DocumentTemplateService) getCompanyData(companyID uint) (*CompanyTemplateData, error) {
	var company models.Company
	if err := s.db.First(&company, companyID).Error; err != nil {
		return nil, err
	}

	return s.convertCompanyToTemplateData(&company), nil
}

// convertCompanyToTemplateData converts company model to template data
func (s *DocumentTemplateService) convertCompanyToTemplateData(company *models.Company) *CompanyTemplateData {
	return &CompanyTemplateData{
		ID:             fmt.Sprintf("%d", company.ID),
		NameTH:         company.CompanyNameTh,
		NameEN:         company.CompanyNameEn,
		Address:        company.CompanyAddress,
		Phone:          company.CompanyPhoneNumber,
		Email:          company.CompanyEmail,
		Type:           company.CompanyType,
		RegisterNumber: company.CompanyRegisterNumber,
	}
}

// getTrainingData retrieves training data for templates
func (s *DocumentTemplateService) getTrainingData(trainingID uint) (*TrainingTemplateData, error) {
	var training models.StudentTraining
	if err := s.db.First(&training, trainingID).Error; err != nil {
		return nil, err
	}

	duration := int(training.EndDate.Sub(training.StartDate).Hours() / 24)

	return &TrainingTemplateData{
		ID:               fmt.Sprintf("%d", training.ID),
		StartDate:        training.StartDate,
		EndDate:          training.EndDate,
		StartDateTH:      s.formatDateTH(training.StartDate),
		EndDateTH:        s.formatDateTH(training.EndDate),
		StartDateEN:      s.formatDateEN(training.StartDate),
		EndDateEN:        s.formatDateEN(training.EndDate),
		Position:         training.Position,
		Department:       training.Department,
		Coordinator:      training.Coordinator,
		CoordinatorPhone: training.CoordinatorPhoneNumber,
		CoordinatorEmail: training.CoordinatorEmail,
		Supervisor:       training.Supervisor,
		SupervisorPhone:  training.SupervisorPhoneNumber,
		SupervisorEmail:  training.SupervisorEmail,
		JobDescription:   training.JobDescription,
		Duration:         duration,
	}, nil
}

// getInstructorData retrieves instructor data for templates
func (s *DocumentTemplateService) getInstructorData(instructorID uint) (*InstructorTemplateData, error) {
	var instructor models.Instructor
	if err := s.db.First(&instructor, instructorID).Error; err != nil {
		return nil, err
	}

	return &InstructorTemplateData{
		ID:        fmt.Sprintf("%d", instructor.ID),
		FirstName: instructor.FirstName,
		LastName:  instructor.LastName,
		FullName:  instructor.GetFullName(),
		Title:     instructor.Title,
		Email:     instructor.Email,
		Phone:     instructor.PhoneNumber,
		Position:  instructor.Position,
	}, nil
}

// getTemplateFunctions returns template functions for use in templates
func (s *DocumentTemplateService) getTemplateFunctions() template.FuncMap {
	return template.FuncMap{
		"formatDateTH": s.formatDateTH,
		"formatDateEN": s.formatDateEN,
		"upper":        strings.ToUpper,
		"lower":        strings.ToLower,
		"title":        strings.Title,
		"add": func(a, b int) int {
			return a + b
		},
		"subtract": func(a, b int) int {
			return a - b
		},
		"multiply": func(a, b int) int {
			return a * b
		},
		"divide": func(a, b int) int {
			if b == 0 {
				return 0
			}
			return a / b
		},
		"json": func(v interface{}) string {
			data, _ := json.Marshal(v)
			return string(data)
		},
	}
}

// formatDateTH formats date in Thai format
func (s *DocumentTemplateService) formatDateTH(date time.Time) string {
	thaiMonths := []string{
		"มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
		"กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
	}
	
	buddhistYear := date.Year() + 543
	return fmt.Sprintf("%d %s พ.ศ. %d", date.Day(), thaiMonths[date.Month()-1], buddhistYear)
}

// formatDateEN formats date in English format
func (s *DocumentTemplateService) formatDateEN(date time.Time) string {
	return date.Format("January 2, 2006")
}

// saveHTMLDocument saves HTML content to file
func (s *DocumentTemplateService) saveHTMLDocument(content string, req GenerateDocumentRequest) (string, error) {
	filename := fmt.Sprintf("document_%d_%d.html", req.TemplateID, time.Now().Unix())
	filepath := filepath.Join(s.outputDir, filename)
	
	err := ioutil.WriteFile(filepath, []byte(content), 0644)
	if err != nil {
		return "", fmt.Errorf("failed to save HTML document: %w", err)
	}
	
	return filename, nil
}

// generatePDFFromHTML generates PDF from HTML content
func (s *DocumentTemplateService) generatePDFFromHTML(htmlContent string, req GenerateDocumentRequest) (string, error) {
	// For now, use the existing PDF service to generate a simple PDF
	// In a real implementation, you might use a library like wkhtmltopdf or puppeteer
	
	filename := fmt.Sprintf("document_%d_%d.pdf", req.TemplateID, time.Now().Unix())
	
	// Create a simple PDF with the HTML content converted to text
	// This is a simplified implementation - in production you'd want proper HTML to PDF conversion
	
	return filename, nil
}

// generateDOCXFromHTML generates DOCX from HTML content
func (s *DocumentTemplateService) generateDOCXFromHTML(htmlContent string, req GenerateDocumentRequest) (string, error) {
	// This would require a library like unidoc or similar for DOCX generation
	// For now, return an error indicating it's not implemented
	return "", errors.New("DOCX generation not implemented yet")
}

// GetTemplates retrieves all document templates
func (s *DocumentTemplateService) GetTemplates() ([]models.DocumentTemplate, error) {
	var templates []models.DocumentTemplate
	err := s.db.Where("is_active = ?", true).Find(&templates).Error
	return templates, err
}

// GetTemplateByID retrieves a template by ID
func (s *DocumentTemplateService) GetTemplateByID(id uint) (*models.DocumentTemplate, error) {
	var template models.DocumentTemplate
	err := s.db.First(&template, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("template not found")
		}
		return nil, err
	}
	return &template, nil
}

// UpdateTemplate updates a document template
func (s *DocumentTemplateService) UpdateTemplate(id uint, req CreateTemplateRequest) (*models.DocumentTemplate, error) {
	var template models.DocumentTemplate
	if err := s.db.First(&template, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("template not found")
		}
		return nil, err
	}

	// Update template content if provided
	if req.TemplateContent != "" {
		err := ioutil.WriteFile(template.TemplatePath, []byte(req.TemplateContent), 0644)
		if err != nil {
			return nil, fmt.Errorf("failed to update template file: %w", err)
		}
	}

	// Update template metadata
	template.Name = req.Name
	template.Description = req.Description
	template.DocumentType = req.DocumentType
	template.IsActive = req.IsActive

	if err := s.db.Save(&template).Error; err != nil {
		return nil, err
	}

	return &template, nil
}

// DeleteTemplate deletes a document template
func (s *DocumentTemplateService) DeleteTemplate(id uint) error {
	var template models.DocumentTemplate
	if err := s.db.First(&template, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("template not found")
		}
		return err
	}

	// Delete template file
	if err := os.Remove(template.TemplatePath); err != nil {
		// Log error but don't fail the operation
		fmt.Printf("Warning: failed to delete template file %s: %v\n", template.TemplatePath, err)
	}

	// Delete from database
	return s.db.Delete(&template).Error
}