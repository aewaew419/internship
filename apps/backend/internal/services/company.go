package services

import (
	"errors"
	"fmt"

	"backend-go/internal/models"
	"gorm.io/gorm"
)

// CompanyService handles company management operations
type CompanyService struct {
	db *gorm.DB
}

// NewCompanyService creates a new company service instance
func NewCompanyService(db *gorm.DB) *CompanyService {
	return &CompanyService{
		db: db,
	}
}

// CompanyListRequest represents the request for listing companies
type CompanyListRequest struct {
	Page         int    `json:"page"`
	Limit        int    `json:"limit"`
	Search       string `json:"search"`
	CompanyType  string `json:"company_type"`
	SortBy       string `json:"sort_by"`
	SortDesc     bool   `json:"sort_desc"`
	ActiveOnly   bool   `json:"active_only"`
}

// CompanyListResponse represents the response for listing companies
type CompanyListResponse struct {
	Data       []models.Company `json:"data"`
	Total      int64            `json:"total"`
	Page       int              `json:"page"`
	Limit      int              `json:"limit"`
	TotalPages int              `json:"total_pages"`
}

// CreateCompanyRequest represents the request for creating a company
type CreateCompanyRequest struct {
	CompanyRegisterNumber string `json:"company_register_number" validate:"required"`
	CompanyNameEn         string `json:"company_name_en" validate:"required"`
	CompanyNameTh         string `json:"company_name_th" validate:"required"`
	CompanyAddress        string `json:"company_address" validate:"required"`
	CompanyMap            string `json:"company_map"`
	CompanyEmail          string `json:"company_email" validate:"omitempty,email"`
	CompanyPhoneNumber    string `json:"company_phone_number"`
	CompanyType           string `json:"company_type"`
}

// UpdateCompanyRequest represents the request for updating a company
type UpdateCompanyRequest struct {
	CompanyRegisterNumber *string `json:"company_register_number"`
	CompanyNameEn         *string `json:"company_name_en"`
	CompanyNameTh         *string `json:"company_name_th"`
	CompanyAddress        *string `json:"company_address"`
	CompanyMap            *string `json:"company_map"`
	CompanyEmail          *string `json:"company_email" validate:"omitempty,email"`
	CompanyPhoneNumber    *string `json:"company_phone_number"`
	CompanyType           *string `json:"company_type"`
}

// GetCompanies retrieves companies with pagination, search, and filtering
func (s *CompanyService) GetCompanies(req CompanyListRequest) (*CompanyListResponse, error) {
	var companies []models.Company
	var total int64

	// Build query with preloads
	query := s.db.Model(&models.Company{}).
		Preload("CompanyPictures")

	// Apply search filter
	if req.Search != "" {
		searchTerm := "%" + req.Search + "%"
		query = query.Where("company_name_en LIKE ? OR company_name_th LIKE ? OR company_register_number LIKE ?", 
			searchTerm, searchTerm, searchTerm)
	}

	// Apply filters
	if req.CompanyType != "" {
		query = query.Where("company_type = ?", req.CompanyType)
	}

	// Count total records
	if err := query.Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count companies: %w", err)
	}

	// Apply sorting
	sortBy := "created_at"
	if req.SortBy != "" {
		allowedSortFields := []string{"id", "company_name_en", "company_name_th", "company_type", "created_at", "updated_at"}
		for _, field := range allowedSortFields {
			if req.SortBy == field {
				sortBy = req.SortBy
				break
			}
		}
	}

	sortOrder := "ASC"
	if req.SortDesc {
		sortOrder = "DESC"
	}
	query = query.Order(fmt.Sprintf("%s %s", sortBy, sortOrder))

	// Apply pagination
	if req.Limit <= 0 {
		req.Limit = 10
	}
	if req.Limit > 100 {
		req.Limit = 100
	}
	if req.Page <= 0 {
		req.Page = 1
	}

	offset := (req.Page - 1) * req.Limit
	if err := query.Offset(offset).Limit(req.Limit).Find(&companies).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch companies: %w", err)
	}

	totalPages := int((total + int64(req.Limit) - 1) / int64(req.Limit))

	return &CompanyListResponse{
		Data:       companies,
		Total:      total,
		Page:       req.Page,
		Limit:      req.Limit,
		TotalPages: totalPages,
	}, nil
}

// GetCompanyByID retrieves a company by ID
func (s *CompanyService) GetCompanyByID(id uint) (*models.Company, error) {
	var company models.Company
	err := s.db.Preload("CompanyPictures").
		Preload("StudentTrainings").
		First(&company, id).Error
	
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("company not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	return &company, nil
}

// CreateCompany creates a new company
func (s *CompanyService) CreateCompany(req CreateCompanyRequest) (*models.Company, error) {
	// Check if company register number already exists
	var existingCompany models.Company
	err := s.db.Where("company_register_number = ?", req.CompanyRegisterNumber).First(&existingCompany).Error
	if err == nil {
		return nil, errors.New("company with this register number already exists")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Create new company
	company := models.Company{
		CompanyRegisterNumber: req.CompanyRegisterNumber,
		CompanyNameEn:         req.CompanyNameEn,
		CompanyNameTh:         req.CompanyNameTh,
		CompanyAddress:        req.CompanyAddress,
		CompanyMap:            req.CompanyMap,
		CompanyEmail:          req.CompanyEmail,
		CompanyPhoneNumber:    req.CompanyPhoneNumber,
		CompanyType:           req.CompanyType,
	}

	err = s.db.Create(&company).Error
	if err != nil {
		return nil, fmt.Errorf("failed to create company: %w", err)
	}

	return &company, nil
}

// UpdateCompany updates an existing company
func (s *CompanyService) UpdateCompany(id uint, req UpdateCompanyRequest) (*models.Company, error) {
	var company models.Company
	err := s.db.First(&company, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("company not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Check if register number is being updated and if it already exists
	if req.CompanyRegisterNumber != nil && *req.CompanyRegisterNumber != company.CompanyRegisterNumber {
		var existingCompany models.Company
		err := s.db.Where("company_register_number = ? AND id != ?", *req.CompanyRegisterNumber, id).First(&existingCompany).Error
		if err == nil {
			return nil, errors.New("company with this register number already exists")
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("database error: %w", err)
		}
	}

	// Update fields
	if req.CompanyRegisterNumber != nil {
		company.CompanyRegisterNumber = *req.CompanyRegisterNumber
	}
	if req.CompanyNameEn != nil {
		company.CompanyNameEn = *req.CompanyNameEn
	}
	if req.CompanyNameTh != nil {
		company.CompanyNameTh = *req.CompanyNameTh
	}
	if req.CompanyAddress != nil {
		company.CompanyAddress = *req.CompanyAddress
	}
	if req.CompanyMap != nil {
		company.CompanyMap = *req.CompanyMap
	}
	if req.CompanyEmail != nil {
		company.CompanyEmail = *req.CompanyEmail
	}
	if req.CompanyPhoneNumber != nil {
		company.CompanyPhoneNumber = *req.CompanyPhoneNumber
	}
	if req.CompanyType != nil {
		company.CompanyType = *req.CompanyType
	}

	err = s.db.Save(&company).Error
	if err != nil {
		return nil, fmt.Errorf("failed to update company: %w", err)
	}

	return &company, nil
}

// DeleteCompany deletes a company by ID
func (s *CompanyService) DeleteCompany(id uint) error {
	var company models.Company
	err := s.db.First(&company, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("company not found")
		}
		return fmt.Errorf("database error: %w", err)
	}

	// Check if company has active student trainings
	var trainingCount int64
	err = s.db.Model(&models.StudentTraining{}).Where("company_id = ?", id).Count(&trainingCount).Error
	if err != nil {
		return fmt.Errorf("database error: %w", err)
	}

	if trainingCount > 0 {
		return errors.New("cannot delete company with active student trainings")
	}

	err = s.db.Delete(&company).Error
	if err != nil {
		return fmt.Errorf("failed to delete company: %w", err)
	}

	return nil
}

// CompanySearchRequest represents advanced search request for companies
type CompanySearchRequest struct {
	Query         string   `json:"query"`
	CompanyTypes  []string `json:"company_types"`
	HasTrainings  *bool    `json:"has_trainings"`
	MinStudents   *int     `json:"min_students"`
	MaxStudents   *int     `json:"max_students"`
	ActiveOnly    bool     `json:"active_only"`
	TrainingYear  *int     `json:"training_year"`
}

// CompanyPerformanceMetrics represents company performance data
type CompanyPerformanceMetrics struct {
	CompanyID          uint    `json:"company_id"`
	CompanyName        string  `json:"company_name"`
	TotalStudents      int64   `json:"total_students"`
	ActiveStudents     int64   `json:"active_students"`
	CompletedStudents  int64   `json:"completed_students"`
	AverageRating      float64 `json:"average_rating"`
	SuccessRate        float64 `json:"success_rate"`
	LastTrainingDate   string  `json:"last_training_date"`
}

// AdvancedCompanySearch performs advanced search with multiple filters
func (s *CompanyService) AdvancedCompanySearch(req CompanySearchRequest) ([]models.Company, error) {
	query := s.db.Model(&models.Company{}).
		Preload("CompanyPictures")

	// Text search
	if req.Query != "" {
		searchTerm := "%" + req.Query + "%"
		query = query.Where("company_name_en LIKE ? OR company_name_th LIKE ? OR company_register_number LIKE ? OR company_address LIKE ?",
			searchTerm, searchTerm, searchTerm, searchTerm)
	}

	// Filter by company types
	if len(req.CompanyTypes) > 0 {
		query = query.Where("company_type IN ?", req.CompanyTypes)
	}

	// Filter by training status
	if req.HasTrainings != nil {
		if *req.HasTrainings {
			query = query.Joins("JOIN student_trainings ON companies.id = student_trainings.company_id")
		} else {
			query = query.Where("id NOT IN (SELECT DISTINCT company_id FROM student_trainings WHERE company_id IS NOT NULL)")
		}
	}

	// Filter by student count range
	if req.MinStudents != nil || req.MaxStudents != nil {
		subQuery := s.db.Table("student_trainings").
			Select("company_id, COUNT(*) as student_count").
			Group("company_id")

		if req.MinStudents != nil {
			subQuery = subQuery.Having("student_count >= ?", *req.MinStudents)
		}
		if req.MaxStudents != nil {
			subQuery = subQuery.Having("student_count <= ?", *req.MaxStudents)
		}

		query = query.Where("id IN (?)", subQuery)
	}

	// Filter by training year
	if req.TrainingYear != nil {
		query = query.Joins("JOIN student_trainings ON companies.id = student_trainings.company_id").
			Where("YEAR(student_trainings.start_date) = ?", *req.TrainingYear)
	}

	var companies []models.Company
	err := query.Distinct().Find(&companies).Error
	if err != nil {
		return nil, fmt.Errorf("failed to perform advanced company search: %w", err)
	}

	return companies, nil
}

// GetCompanyPerformanceMetrics returns performance metrics for all companies
func (s *CompanyService) GetCompanyPerformanceMetrics() ([]CompanyPerformanceMetrics, error) {
	var metrics []CompanyPerformanceMetrics

	err := s.db.Raw(`
		SELECT 
			c.id as company_id,
			c.company_name_en as company_name,
			COUNT(st.id) as total_students,
			SUM(CASE WHEN st.end_date > NOW() THEN 1 ELSE 0 END) as active_students,
			SUM(CASE WHEN st.end_date <= NOW() THEN 1 ELSE 0 END) as completed_students,
			COALESCE(AVG(CASE WHEN sec.id IS NOT NULL THEN 4.0 ELSE 3.0 END), 3.0) as average_rating,
			COALESCE(
				(SUM(CASE WHEN st.end_date <= NOW() THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(st.id), 0)),
				0
			) as success_rate,
			MAX(st.start_date) as last_training_date
		FROM companies c
		LEFT JOIN student_trainings st ON c.id = st.company_id
		LEFT JOIN student_enrolls se ON st.student_enroll_id = se.id
		LEFT JOIN student_evaluate_companies sec ON st.id = sec.student_training_id
		GROUP BY c.id, c.company_name_en
		ORDER BY total_students DESC, success_rate DESC
	`).Scan(&metrics).Error

	if err != nil {
		return nil, fmt.Errorf("failed to get company performance metrics: %w", err)
	}

	return metrics, nil
}

// GetCompanyAnalytics returns detailed company analytics
func (s *CompanyService) GetCompanyAnalytics() (map[string]interface{}, error) {
	analytics := make(map[string]interface{})

	// Basic counts
	var totalCompanies int64
	err := s.db.Model(&models.Company{}).Count(&totalCompanies).Error
	if err != nil {
		return nil, fmt.Errorf("failed to count total companies: %w", err)
	}
	analytics["total_companies"] = totalCompanies

	// Active partnerships (companies with trainings in last 2 years)
	var activePartnerships int64
	err = s.db.Model(&models.Company{}).
		Joins("JOIN student_trainings ON companies.id = student_trainings.company_id").
		Where("student_trainings.start_date >= DATE_SUB(NOW(), INTERVAL 2 YEAR)").
		Distinct("companies.id").
		Count(&activePartnerships).Error
	if err != nil {
		return nil, fmt.Errorf("failed to count active partnerships: %w", err)
	}
	analytics["active_partnerships"] = activePartnerships

	// Companies by type with detailed stats
	var typeStats []struct {
		CompanyType       string `json:"company_type"`
		Count             int64  `json:"count"`
		ActiveCount       int64  `json:"active_count"`
		TotalStudents     int64  `json:"total_students"`
		AverageStudents   float64 `json:"average_students"`
	}

	err = s.db.Raw(`
		SELECT 
			c.company_type,
			COUNT(DISTINCT c.id) as count,
			COUNT(DISTINCT CASE WHEN st.start_date >= DATE_SUB(NOW(), INTERVAL 2 YEAR) THEN c.id END) as active_count,
			COUNT(st.id) as total_students,
			COALESCE(COUNT(st.id) / NULLIF(COUNT(DISTINCT c.id), 0), 0) as average_students
		FROM companies c
		LEFT JOIN student_trainings st ON c.id = st.company_id
		GROUP BY c.company_type
		ORDER BY count DESC
	`).Scan(&typeStats).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get company type statistics: %w", err)
	}
	analytics["by_type"] = typeStats

	// Top performing companies
	performanceMetrics, err := s.GetCompanyPerformanceMetrics()
	if err != nil {
		return nil, fmt.Errorf("failed to get performance metrics: %w", err)
	}
	
	// Get top 10 companies
	topCompanies := performanceMetrics
	if len(topCompanies) > 10 {
		topCompanies = topCompanies[:10]
	}
	analytics["top_companies"] = topCompanies

	// Partnership trends (monthly for last 12 months)
	var partnershipTrends []struct {
		Month string `json:"month"`
		Count int64  `json:"count"`
	}
	err = s.db.Raw(`
		SELECT 
			DATE_FORMAT(st.start_date, '%Y-%m') as month,
			COUNT(DISTINCT st.company_id) as count
		FROM student_trainings st
		WHERE st.start_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
		  AND st.company_id IS NOT NULL
		GROUP BY DATE_FORMAT(st.start_date, '%Y-%m')
		ORDER BY month
	`).Scan(&partnershipTrends).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get partnership trends: %w", err)
	}
	analytics["partnership_trends"] = partnershipTrends

	return analytics, nil
}

// GetCompanyStats returns company statistics (legacy method)
func (s *CompanyService) GetCompanyStats() (map[string]interface{}, error) {
	return s.GetCompanyAnalytics()
}