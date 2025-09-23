package handlers

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"backend-go/internal/models"
	"backend-go/internal/services"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// PDFHandler handles PDF generation requests
type PDFHandler struct {
	db         *gorm.DB
	pdfService *services.PDFService
}

// NewPDFHandler creates a new PDF handler
func NewPDFHandler(db *gorm.DB, pdfService *services.PDFService) *PDFHandler {
	return &PDFHandler{
		db:         db,
		pdfService: pdfService,
	}
}

// GenerateReportRequest represents the request body for report generation
type GenerateReportRequest struct {
	ReportType  services.ReportType `json:"report_type" validate:"required"`
	Title       string              `json:"title"`
	StudentIDs  []uint              `json:"student_ids,omitempty"`
	CompanyIDs  []uint              `json:"company_ids,omitempty"`
	TrainingIDs []uint              `json:"training_ids,omitempty"`
	ScheduleIDs []uint              `json:"schedule_ids,omitempty"`
	StartDate   *time.Time          `json:"start_date,omitempty"`
	EndDate     *time.Time          `json:"end_date,omitempty"`
}

// GenerateLetterRequest represents the request body for letter generation
type GenerateLetterRequest struct {
	LetterType   services.LetterType        `json:"letter_type" validate:"required"`
	StudentID    uint                       `json:"student_id" validate:"required"`
	TrainingID   *uint                      `json:"training_id,omitempty"`
	InstructorID *uint                      `json:"instructor_id,omitempty"`
	Recipient    string                     `json:"recipient" validate:"required"`
	Subject      string                     `json:"subject,omitempty"`
	Content      string                     `json:"content,omitempty"`
	Language     models.DocumentLanguage    `json:"language"`
}

// GenerateReport generates a PDF report
func (h *PDFHandler) GenerateReport(c *fiber.Ctx) error {
	var req GenerateReportRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Get current user from context (assuming JWT middleware sets this)
	userID := c.Locals("user_id")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "User not authenticated",
		})
	}

	// Get user details
	var user models.User
	if err := h.db.First(&user, userID).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get user details",
		})
	}

	// Prepare report data based on report type
	reportData := services.ReportData{
		Title:       req.Title,
		GeneratedAt: time.Now(),
		GeneratedBy: user.GetFullName(),
	}

	switch req.ReportType {
	case services.ReportTypeStudentList:
		students, err := h.getStudentsForReport(req.StudentIDs, req.StartDate, req.EndDate)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to fetch students",
			})
		}
		reportData.Students = students

	case services.ReportTypeInternshipSummary:
		trainings, err := h.getTrainingsForReport(req.TrainingIDs, req.StartDate, req.EndDate)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to fetch trainings",
			})
		}
		reportData.Trainings = trainings

	case services.ReportTypeVisitorSchedule:
		schedules, err := h.getSchedulesForReport(req.ScheduleIDs, req.StartDate, req.EndDate)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to fetch schedules",
			})
		}
		reportData.Schedules = schedules

	case services.ReportTypeCompanyEvaluation:
		companies, err := h.getCompaniesForReport(req.CompanyIDs)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to fetch companies",
			})
		}
		reportData.Companies = companies

	default:
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Unsupported report type",
		})
	}

	// Generate PDF
	filename, err := h.pdfService.GenerateReport(req.ReportType, reportData)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": fmt.Sprintf("Failed to generate PDF: %v", err),
		})
	}

	return c.JSON(fiber.Map{
		"message":  "Report generated successfully",
		"filename": filename,
		"download_url": fmt.Sprintf("/api/v1/pdf/download/%s", filename),
	})
}

// GenerateLetter generates a PDF letter
func (h *PDFHandler) GenerateLetter(c *fiber.Ctx) error {
	var req GenerateLetterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	// Get current user from context
	userID := c.Locals("user_id")
	if userID == nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "User not authenticated",
		})
	}

	// Get user details
	var user models.User
	if err := h.db.First(&user, userID).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to get user details",
		})
	}

	// Get student details
	var student models.Student
	if err := h.db.Preload("User").Preload("Major").Preload("Program").
		Preload("Faculty").Preload("Campus").First(&student, req.StudentID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "Student not found",
		})
	}

	// Prepare letter data
	letterData := services.LetterData{
		Student:     student,
		Recipient:   req.Recipient,
		Subject:     req.Subject,
		Content:     req.Content,
		Language:    req.Language,
		GeneratedAt: time.Now(),
		GeneratedBy: user.GetFullName(),
	}

	// Get training details if provided
	if req.TrainingID != nil {
		var training models.StudentTraining
		if err := h.db.Preload("Company").Preload("StudentEnroll.Student").
			First(&training, *req.TrainingID).Error; err != nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Training not found",
			})
		}
		letterData.Training = &training
		letterData.Company = training.Company
	}

	// Get instructor details if provided
	if req.InstructorID != nil {
		var instructor models.Instructor
		if err := h.db.Preload("User").First(&instructor, *req.InstructorID).Error; err != nil {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Instructor not found",
			})
		}
		letterData.Instructor = &instructor
	}

	// Set default language if not provided
	if letterData.Language == "" {
		letterData.Language = models.DocumentLanguageTH
	}

	// Generate PDF
	filename, err := h.pdfService.GenerateLetter(req.LetterType, letterData)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": fmt.Sprintf("Failed to generate PDF: %v", err),
		})
	}

	return c.JSON(fiber.Map{
		"message":  "Letter generated successfully",
		"filename": filename,
		"download_url": fmt.Sprintf("/api/v1/pdf/download/%s", filename),
	})
}

// DownloadPDF serves the generated PDF file for download
func (h *PDFHandler) DownloadPDF(c *fiber.Ctx) error {
	filename := c.Params("filename")
	if filename == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Filename is required",
		})
	}

	// Construct file path (assuming PDFService output directory)
	filePath := filepath.Join("uploads", "pdf", filename)

	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "File not found",
		})
	}

	// Set headers for PDF download
	c.Set("Content-Type", "application/pdf")
	c.Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))

	return c.SendFile(filePath)
}

// ListPDFs lists all generated PDF files
func (h *PDFHandler) ListPDFs(c *fiber.Ctx) error {
	// Get query parameters for pagination
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	// Read PDF directory
	pdfDir := filepath.Join("uploads", "pdf")
	files, err := os.ReadDir(pdfDir)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to read PDF directory",
		})
	}

	// Filter PDF files and get file info
	var pdfFiles []fiber.Map
	for _, file := range files {
		if !file.IsDir() && filepath.Ext(file.Name()) == ".pdf" {
			info, err := file.Info()
			if err != nil {
				continue
			}

			pdfFiles = append(pdfFiles, fiber.Map{
				"filename":    file.Name(),
				"size":        info.Size(),
				"modified_at": info.ModTime(),
				"download_url": fmt.Sprintf("/api/v1/pdf/download/%s", file.Name()),
			})
		}
	}

	// Apply pagination
	total := len(pdfFiles)
	start := (page - 1) * limit
	end := start + limit

	if start > total {
		start = total
	}
	if end > total {
		end = total
	}

	paginatedFiles := pdfFiles[start:end]

	return c.JSON(fiber.Map{
		"data": paginatedFiles,
		"pagination": fiber.Map{
			"page":        page,
			"limit":       limit,
			"total":       total,
			"total_pages": (total + limit - 1) / limit,
		},
	})
}

// DeletePDF deletes a generated PDF file
func (h *PDFHandler) DeletePDF(c *fiber.Ctx) error {
	filename := c.Params("filename")
	if filename == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Filename is required",
		})
	}

	// Construct file path
	filePath := filepath.Join("uploads", "pdf", filename)

	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"error": "File not found",
		})
	}

	// Delete file
	if err := os.Remove(filePath); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete file",
		})
	}

	return c.JSON(fiber.Map{
		"message": "PDF deleted successfully",
	})
}

// Helper methods for fetching data

func (h *PDFHandler) getStudentsForReport(studentIDs []uint, startDate, endDate *time.Time) ([]models.Student, error) {
	query := h.db.Preload("User").Preload("Major").Preload("Program").
		Preload("Faculty").Preload("Campus")

	if len(studentIDs) > 0 {
		query = query.Where("id IN ?", studentIDs)
	}

	if startDate != nil {
		query = query.Where("created_at >= ?", *startDate)
	}

	if endDate != nil {
		query = query.Where("created_at <= ?", *endDate)
	}

	var students []models.Student
	err := query.Find(&students).Error
	return students, err
}

func (h *PDFHandler) getTrainingsForReport(trainingIDs []uint, startDate, endDate *time.Time) ([]models.StudentTraining, error) {
	query := h.db.Preload("Company").Preload("StudentEnroll.Student")

	if len(trainingIDs) > 0 {
		query = query.Where("id IN ?", trainingIDs)
	}

	if startDate != nil {
		query = query.Where("start_date >= ?", *startDate)
	}

	if endDate != nil {
		query = query.Where("end_date <= ?", *endDate)
	}

	var trainings []models.StudentTraining
	err := query.Find(&trainings).Error
	return trainings, err
}

func (h *PDFHandler) getSchedulesForReport(scheduleIDs []uint, startDate, endDate *time.Time) ([]models.VisitorSchedule, error) {
	query := h.db.Preload("Training.Visitor").Preload("Training.StudentEnroll.Student")

	if len(scheduleIDs) > 0 {
		query = query.Where("id IN ?", scheduleIDs)
	}

	if startDate != nil && endDate != nil {
		query = query.Where("visit_at BETWEEN ? AND ?", *startDate, *endDate)
	} else if startDate != nil {
		query = query.Where("visit_at >= ?", *startDate)
	} else if endDate != nil {
		query = query.Where("visit_at <= ?", *endDate)
	}

	var schedules []models.VisitorSchedule
	err := query.Find(&schedules).Error
	return schedules, err
}

func (h *PDFHandler) getCompaniesForReport(companyIDs []uint) ([]models.Company, error) {
	query := h.db.Model(&models.Company{})

	if len(companyIDs) > 0 {
		query = query.Where("id IN ?", companyIDs)
	}

	var companies []models.Company
	err := query.Find(&companies).Error
	return companies, err
}