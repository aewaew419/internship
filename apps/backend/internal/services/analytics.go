package services

import (
	"fmt"
	"time"

	"backend-go/internal/models"
	"gorm.io/gorm"
)

// AnalyticsService handles analytics and reporting operations
type AnalyticsService struct {
	db *gorm.DB
}

// NewAnalyticsService creates a new analytics service instance
func NewAnalyticsService(db *gorm.DB) *AnalyticsService {
	return &AnalyticsService{
		db: db,
	}
}

// AnalyticsRequest represents the request for analytics data
type AnalyticsRequest struct {
	StartDate   time.Time `json:"start_date"`
	EndDate     time.Time `json:"end_date"`
	GroupBy     string    `json:"group_by"` // month, week, day
	FilterBy    string    `json:"filter_by"`
	FilterValue string    `json:"filter_value"`
}

// AnalyticsResponse represents comprehensive analytics data
type AnalyticsResponse struct {
	TotalInternships    int64                 `json:"total_internships"`
	ApprovalRate        float64               `json:"approval_rate"`
	CompletionRate      float64               `json:"completion_rate"`
	TopCompanies        []CompanyStats        `json:"top_companies"`
	MonthlyTrends       []MonthlyTrendData    `json:"monthly_trends"`
	FacultyDistribution []FacultyStatsData    `json:"faculty_distribution"`
	StatusDistribution  []StatusData          `json:"status_distribution"`
	EvaluationMetrics   EvaluationMetrics     `json:"evaluation_metrics"`
}

// CompanyStats represents company statistics
type CompanyStats struct {
	CompanyID       uint    `json:"company_id"`
	CompanyName     string  `json:"company_name"`
	StudentCount    int64   `json:"student_count"`
	SuccessRate     float64 `json:"success_rate"`
	AverageRating   float64 `json:"average_rating"`
}

// MonthlyTrendData represents monthly trend statistics
type MonthlyTrendData struct {
	Month           string `json:"month"`
	InternshipCount int64  `json:"internship_count"`
	ApprovalCount   int64  `json:"approval_count"`
	CompletionCount int64  `json:"completion_count"`
}

// FacultyStatsData represents faculty-based statistics
type FacultyStatsData struct {
	FacultyID       uint   `json:"faculty_id"`
	FacultyName     string `json:"faculty_name"`
	StudentCount    int64  `json:"student_count"`
	InternshipCount int64  `json:"internship_count"`
	SuccessRate     float64 `json:"success_rate"`
}

// StatusData represents status-based statistics
type StatusData struct {
	Status string `json:"status"`
	Count  int64  `json:"count"`
	Percentage float64 `json:"percentage"`
}

// EvaluationMetrics represents evaluation-related metrics
type EvaluationMetrics struct {
	TotalEvaluations     int64   `json:"total_evaluations"`
	CompletedEvaluations int64   `json:"completed_evaluations"`
	PendingEvaluations   int64   `json:"pending_evaluations"`
	OverdueEvaluations   int64   `json:"overdue_evaluations"`
	CompletionRate       float64 `json:"completion_rate"`
	AverageScore         float64 `json:"average_score"`
}

// GetInternshipAnalytics retrieves comprehensive internship analytics
func (s *AnalyticsService) GetInternshipAnalytics(req AnalyticsRequest) (*AnalyticsResponse, error) {
	response := &AnalyticsResponse{}

	// Set default date range if not provided
	if req.StartDate.IsZero() {
		req.StartDate = time.Now().AddDate(-1, 0, 0) // 1 year ago
	}
	if req.EndDate.IsZero() {
		req.EndDate = time.Now()
	}

	// Get total internships
	var totalInternships int64
	err := s.db.Model(&models.StudentTraining{}).
		Where("created_at BETWEEN ? AND ?", req.StartDate, req.EndDate).
		Count(&totalInternships).Error
	if err != nil {
		return nil, fmt.Errorf("failed to count total internships: %w", err)
	}
	response.TotalInternships = totalInternships

	// Get approval rate
	approvalRate, err := s.calculateApprovalRate(req.StartDate, req.EndDate)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate approval rate: %w", err)
	}
	response.ApprovalRate = approvalRate

	// Get completion rate
	completionRate, err := s.calculateCompletionRate(req.StartDate, req.EndDate)
	if err != nil {
		return nil, fmt.Errorf("failed to calculate completion rate: %w", err)
	}
	response.CompletionRate = completionRate

	// Get top companies
	topCompanies, err := s.getTopCompanies(req.StartDate, req.EndDate, 10)
	if err != nil {
		return nil, fmt.Errorf("failed to get top companies: %w", err)
	}
	response.TopCompanies = topCompanies

	// Get monthly trends
	monthlyTrends, err := s.getMonthlyTrends(req.StartDate, req.EndDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get monthly trends: %w", err)
	}
	response.MonthlyTrends = monthlyTrends

	// Get faculty distribution
	facultyDistribution, err := s.getFacultyDistribution(req.StartDate, req.EndDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get faculty distribution: %w", err)
	}
	response.FacultyDistribution = facultyDistribution

	// Get status distribution
	statusDistribution, err := s.getStatusDistribution(req.StartDate, req.EndDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get status distribution: %w", err)
	}
	response.StatusDistribution = statusDistribution

	// Get evaluation metrics
	evaluationMetrics, err := s.getEvaluationMetrics(req.StartDate, req.EndDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get evaluation metrics: %w", err)
	}
	response.EvaluationMetrics = evaluationMetrics

	return response, nil
}

// GetApprovalAnalytics retrieves approval-specific analytics
func (s *AnalyticsService) GetApprovalAnalytics(req AnalyticsRequest) (map[string]interface{}, error) {
	analytics := make(map[string]interface{})

	// Approval statistics by status
	var approvalStats []struct {
		Status string `json:"status"`
		Count  int64  `json:"count"`
	}
	
	query := s.db.Model(&models.InternshipApproval{})
	if !req.StartDate.IsZero() && !req.EndDate.IsZero() {
		query = query.Where("created_at BETWEEN ? AND ?", req.StartDate, req.EndDate)
	}
	
	err := query.Select("status, COUNT(*) as count").
		Group("status").
		Scan(&approvalStats).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get approval statistics: %w", err)
	}
	analytics["by_status"] = approvalStats

	// Average approval time
	var avgApprovalTime float64
	err = s.db.Raw(`
		SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, advisor_approved_at)) as avg_hours
		FROM internship_approvals 
		WHERE advisor_approved_at IS NOT NULL
		AND created_at BETWEEN ? AND ?
	`, req.StartDate, req.EndDate).Scan(&avgApprovalTime).Error
	if err != nil {
		return nil, fmt.Errorf("failed to calculate average approval time: %w", err)
	}
	analytics["average_approval_time_hours"] = avgApprovalTime

	// Approval trends by month
	var approvalTrends []struct {
		Month string `json:"month"`
		Count int64  `json:"count"`
	}
	err = s.db.Raw(`
		SELECT 
			DATE_FORMAT(created_at, '%Y-%m') as month,
			COUNT(*) as count
		FROM internship_approvals 
		WHERE created_at BETWEEN ? AND ?
		GROUP BY DATE_FORMAT(created_at, '%Y-%m')
		ORDER BY month
	`, req.StartDate, req.EndDate).Scan(&approvalTrends).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get approval trends: %w", err)
	}
	analytics["monthly_trends"] = approvalTrends

	return analytics, nil
}

// GetCompanyAnalytics retrieves company-specific analytics
func (s *AnalyticsService) GetCompanyAnalytics(req AnalyticsRequest) (map[string]interface{}, error) {
	analytics := make(map[string]interface{})

	// Company performance metrics
	var companyMetrics []struct {
		CompanyID     uint    `json:"company_id"`
		CompanyName   string  `json:"company_name"`
		StudentCount  int64   `json:"student_count"`
		SuccessRate   float64 `json:"success_rate"`
		AverageRating float64 `json:"average_rating"`
	}

	err := s.db.Raw(`
		SELECT 
			c.id as company_id,
			c.company_name_en as company_name,
			COUNT(st.id) as student_count,
			COALESCE(
				(SUM(CASE WHEN st.end_date <= NOW() THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(st.id), 0)),
				0
			) as success_rate,
			COALESCE(AVG(CASE WHEN sec.id IS NOT NULL THEN 4.0 ELSE 3.0 END), 3.0) as average_rating
		FROM companies c
		LEFT JOIN student_trainings st ON c.id = st.company_id
		LEFT JOIN student_evaluate_companies sec ON st.id = sec.student_training_id
		WHERE st.created_at BETWEEN ? AND ?
		GROUP BY c.id, c.company_name_en
		HAVING student_count > 0
		ORDER BY student_count DESC, success_rate DESC
		LIMIT 20
	`, req.StartDate, req.EndDate).Scan(&companyMetrics).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get company metrics: %w", err)
	}
	analytics["company_performance"] = companyMetrics

	// Company type distribution
	var typeDistribution []struct {
		CompanyType  string `json:"company_type"`
		Count        int64  `json:"count"`
		StudentCount int64  `json:"student_count"`
	}
	err = s.db.Raw(`
		SELECT 
			c.company_type,
			COUNT(DISTINCT c.id) as count,
			COUNT(st.id) as student_count
		FROM companies c
		LEFT JOIN student_trainings st ON c.id = st.company_id
		WHERE st.created_at BETWEEN ? AND ?
		GROUP BY c.company_type
		ORDER BY student_count DESC
	`, req.StartDate, req.EndDate).Scan(&typeDistribution).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get company type distribution: %w", err)
	}
	analytics["type_distribution"] = typeDistribution

	return analytics, nil
}

// Helper methods
func (s *AnalyticsService) calculateApprovalRate(startDate, endDate time.Time) (float64, error) {
	var totalApprovals, approvedCount int64

	err := s.db.Model(&models.InternshipApproval{}).
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Count(&totalApprovals).Error
	if err != nil {
		return 0, err
	}

	if totalApprovals == 0 {
		return 0, nil
	}

	err = s.db.Model(&models.InternshipApproval{}).
		Where("created_at BETWEEN ? AND ? AND status = ?", startDate, endDate, "approve").
		Count(&approvedCount).Error
	if err != nil {
		return 0, err
	}

	return float64(approvedCount) / float64(totalApprovals) * 100, nil
}

func (s *AnalyticsService) calculateCompletionRate(startDate, endDate time.Time) (float64, error) {
	var totalTrainings, completedCount int64

	err := s.db.Model(&models.StudentTraining{}).
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Count(&totalTrainings).Error
	if err != nil {
		return 0, err
	}

	if totalTrainings == 0 {
		return 0, nil
	}

	err = s.db.Model(&models.StudentTraining{}).
		Where("created_at BETWEEN ? AND ? AND end_date <= ?", startDate, endDate, time.Now()).
		Count(&completedCount).Error
	if err != nil {
		return 0, err
	}

	return float64(completedCount) / float64(totalTrainings) * 100, nil
}

func (s *AnalyticsService) getTopCompanies(startDate, endDate time.Time, limit int) ([]CompanyStats, error) {
	var companies []CompanyStats

	err := s.db.Raw(`
		SELECT 
			c.id as company_id,
			c.company_name_en as company_name,
			COUNT(st.id) as student_count,
			COALESCE(
				(SUM(CASE WHEN st.end_date <= NOW() THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(st.id), 0)),
				0
			) as success_rate,
			COALESCE(AVG(CASE WHEN sec.id IS NOT NULL THEN 4.0 ELSE 3.0 END), 3.0) as average_rating
		FROM companies c
		LEFT JOIN student_trainings st ON c.id = st.company_id
		LEFT JOIN student_evaluate_companies sec ON st.id = sec.student_training_id
		WHERE st.created_at BETWEEN ? AND ?
		GROUP BY c.id, c.company_name_en
		HAVING student_count > 0
		ORDER BY student_count DESC, success_rate DESC
		LIMIT ?
	`, startDate, endDate, limit).Scan(&companies).Error

	return companies, err
}

func (s *AnalyticsService) getMonthlyTrends(startDate, endDate time.Time) ([]MonthlyTrendData, error) {
	var trends []MonthlyTrendData

	err := s.db.Raw(`
		SELECT 
			DATE_FORMAT(st.created_at, '%Y-%m') as month,
			COUNT(st.id) as internship_count,
			COUNT(ia.id) as approval_count,
			SUM(CASE WHEN st.end_date <= NOW() THEN 1 ELSE 0 END) as completion_count
		FROM student_trainings st
		LEFT JOIN student_enrolls se ON st.student_enroll_id = se.id
		LEFT JOIN internship_approvals ia ON se.id = ia.student_enroll_id
		WHERE st.created_at BETWEEN ? AND ?
		GROUP BY DATE_FORMAT(st.created_at, '%Y-%m')
		ORDER BY month
	`, startDate, endDate).Scan(&trends).Error

	return trends, err
}

func (s *AnalyticsService) getFacultyDistribution(startDate, endDate time.Time) ([]FacultyStatsData, error) {
	var facultyStats []FacultyStatsData

	err := s.db.Raw(`
		SELECT 
			f.id as faculty_id,
			f.name as faculty_name,
			COUNT(DISTINCT s.id) as student_count,
			COUNT(st.id) as internship_count,
			COALESCE(
				(SUM(CASE WHEN st.end_date <= NOW() THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(st.id), 0)),
				0
			) as success_rate
		FROM faculties f
		LEFT JOIN students s ON f.id = s.faculty_id
		LEFT JOIN student_enrolls se ON s.id = se.student_id
		LEFT JOIN student_trainings st ON se.id = st.student_enroll_id
		WHERE st.created_at BETWEEN ? AND ?
		GROUP BY f.id, f.name
		HAVING internship_count > 0
		ORDER BY internship_count DESC
	`, startDate, endDate).Scan(&facultyStats).Error

	return facultyStats, err
}

func (s *AnalyticsService) getStatusDistribution(startDate, endDate time.Time) ([]StatusData, error) {
	var statusStats []StatusData
	var total int64

	// Get total count
	err := s.db.Model(&models.InternshipApproval{}).
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Count(&total).Error
	if err != nil {
		return nil, err
	}

	// Get status distribution
	var rawStats []struct {
		Status string `json:"status"`
		Count  int64  `json:"count"`
	}

	err = s.db.Model(&models.InternshipApproval{}).
		Select("status, COUNT(*) as count").
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Group("status").
		Scan(&rawStats).Error
	if err != nil {
		return nil, err
	}

	// Calculate percentages
	for _, stat := range rawStats {
		percentage := float64(0)
		if total > 0 {
			percentage = float64(stat.Count) / float64(total) * 100
		}

		statusStats = append(statusStats, StatusData{
			Status:     stat.Status,
			Count:      stat.Count,
			Percentage: percentage,
		})
	}

	return statusStats, nil
}

func (s *AnalyticsService) getEvaluationMetrics(startDate, endDate time.Time) (EvaluationMetrics, error) {
	var metrics EvaluationMetrics

	// Total evaluations
	err := s.db.Model(&models.EvaluationStatusTracker{}).
		Where("created_at BETWEEN ? AND ?", startDate, endDate).
		Count(&metrics.TotalEvaluations).Error
	if err != nil {
		return metrics, err
	}

	// Completed evaluations
	err = s.db.Model(&models.EvaluationStatusTracker{}).
		Where("created_at BETWEEN ? AND ? AND status = ?", startDate, endDate, "completed").
		Count(&metrics.CompletedEvaluations).Error
	if err != nil {
		return metrics, err
	}

	// Pending evaluations
	err = s.db.Model(&models.EvaluationStatusTracker{}).
		Where("created_at BETWEEN ? AND ? AND status = ?", startDate, endDate, "pending").
		Count(&metrics.PendingEvaluations).Error
	if err != nil {
		return metrics, err
	}

	// Overdue evaluations
	err = s.db.Model(&models.EvaluationStatusTracker{}).
		Where("created_at BETWEEN ? AND ? AND due_date < ? AND status != ?", 
			startDate, endDate, time.Now(), "completed").
		Count(&metrics.OverdueEvaluations).Error
	if err != nil {
		return metrics, err
	}

	// Calculate completion rate
	if metrics.TotalEvaluations > 0 {
		metrics.CompletionRate = float64(metrics.CompletedEvaluations) / float64(metrics.TotalEvaluations) * 100
	}

	// Average score (placeholder - would need actual evaluation scores)
	metrics.AverageScore = 3.5 // Default value

	return metrics, nil
}

// AnalyticsReportType represents different types of analytics reports
type AnalyticsReportType string

const (
	AnalyticsReportTypeInternship AnalyticsReportType = "internship"
	AnalyticsReportTypeApproval   AnalyticsReportType = "approval"
	AnalyticsReportTypeCompany    AnalyticsReportType = "company"
	AnalyticsReportTypeStudent    AnalyticsReportType = "student"
	AnalyticsReportTypeEvaluation AnalyticsReportType = "evaluation"
)

// ReportFormat represents different report formats
type ReportFormat string

const (
	ReportFormatPDF   ReportFormat = "pdf"
	ReportFormatExcel ReportFormat = "excel"
	ReportFormatCSV   ReportFormat = "csv"
)

// ReportRequest represents a report generation request
type ReportRequest struct {
	Type      AnalyticsReportType `json:"type" validate:"required"`
	Format    ReportFormat        `json:"format" validate:"required"`
	StartDate time.Time           `json:"start_date"`
	EndDate   time.Time           `json:"end_date"`
	Filters   map[string]interface{} `json:"filters"`
	Title     string              `json:"title"`
}

// GenerateReport generates a report based on the request
func (s *AnalyticsService) GenerateReport(req ReportRequest) ([]byte, string, error) {
	// Set default dates if not provided
	if req.StartDate.IsZero() {
		req.StartDate = time.Now().AddDate(-1, 0, 0)
	}
	if req.EndDate.IsZero() {
		req.EndDate = time.Now()
	}

	// Set default title if not provided
	if req.Title == "" {
		req.Title = fmt.Sprintf("%s Report - %s to %s", 
			string(req.Type), 
			req.StartDate.Format("2006-01-02"), 
			req.EndDate.Format("2006-01-02"))
	}

	switch req.Type {
	case AnalyticsReportTypeInternship:
		return s.generateInternshipReport(req)
	case AnalyticsReportTypeApproval:
		return s.generateApprovalReport(req)
	case AnalyticsReportTypeCompany:
		return s.generateCompanyReport(req)
	case AnalyticsReportTypeStudent:
		return s.generateStudentReport(req)
	case AnalyticsReportTypeEvaluation:
		return s.generateEvaluationReport(req)
	default:
		return nil, "", fmt.Errorf("unsupported report type: %s", req.Type)
	}
}

// generateInternshipReport generates internship summary report
func (s *AnalyticsService) generateInternshipReport(req ReportRequest) ([]byte, string, error) {
	// Get analytics data
	analyticsReq := AnalyticsRequest{
		StartDate: req.StartDate,
		EndDate:   req.EndDate,
	}
	
	analytics, err := s.GetInternshipAnalytics(analyticsReq)
	if err != nil {
		return nil, "", fmt.Errorf("failed to get analytics data: %w", err)
	}

	switch req.Format {
	case ReportFormatCSV:
		return s.generateCSVReport(analytics, req.Title)
	case ReportFormatPDF:
		return s.generatePDFReport(analytics, req.Title)
	case ReportFormatExcel:
		return s.generateExcelReport(analytics, req.Title)
	default:
		return nil, "", fmt.Errorf("unsupported report format: %s", req.Format)
	}
}

// generateApprovalReport generates approval workflow report
func (s *AnalyticsService) generateApprovalReport(req ReportRequest) ([]byte, string, error) {
	analyticsReq := AnalyticsRequest{
		StartDate: req.StartDate,
		EndDate:   req.EndDate,
	}
	
	analytics, err := s.GetApprovalAnalytics(analyticsReq)
	if err != nil {
		return nil, "", fmt.Errorf("failed to get approval analytics: %w", err)
	}

	// Convert to CSV format (simplified implementation)
	return s.generateSimpleCSV(analytics, "Approval Report")
}

// generateCompanyReport generates company performance report
func (s *AnalyticsService) generateCompanyReport(req ReportRequest) ([]byte, string, error) {
	analyticsReq := AnalyticsRequest{
		StartDate: req.StartDate,
		EndDate:   req.EndDate,
	}
	
	analytics, err := s.GetCompanyAnalytics(analyticsReq)
	if err != nil {
		return nil, "", fmt.Errorf("failed to get company analytics: %w", err)
	}

	return s.generateSimpleCSV(analytics, "Company Report")
}

// generateStudentReport generates student statistics report
func (s *AnalyticsService) generateStudentReport(req ReportRequest) ([]byte, string, error) {
	// Get student data
	var students []struct {
		StudentID   string  `json:"student_id"`
		Name        string  `json:"name"`
		Faculty     string  `json:"faculty"`
		Major       string  `json:"major"`
		GPAX        float64 `json:"gpax"`
		CompanyName string  `json:"company_name"`
		Status      string  `json:"status"`
	}

	err := s.db.Raw(`
		SELECT 
			s.student_id,
			CONCAT(s.name, ' ', s.surname) as name,
			f.name as faculty,
			m.name as major,
			s.gpax,
			c.company_name_en as company_name,
			COALESCE(ia.status, 'not_applied') as status
		FROM students s
		LEFT JOIN faculties f ON s.faculty_id = f.id
		LEFT JOIN majors m ON s.major_id = m.id
		LEFT JOIN student_enrolls se ON s.id = se.student_id
		LEFT JOIN student_trainings st ON se.id = st.student_enroll_id
		LEFT JOIN companies c ON st.company_id = c.id
		LEFT JOIN internship_approvals ia ON se.id = ia.student_enroll_id
		WHERE s.created_at BETWEEN ? AND ?
		ORDER BY s.student_id
	`, req.StartDate, req.EndDate).Scan(&students).Error
	if err != nil {
		return nil, "", fmt.Errorf("failed to get student data: %w", err)
	}

	return s.generateSimpleCSV(map[string]interface{}{"students": students}, "Student Report")
}

// generateEvaluationReport generates evaluation status report
func (s *AnalyticsService) generateEvaluationReport(req ReportRequest) ([]byte, string, error) {
	// Get evaluation data
	var evaluations []struct {
		StudentName    string `json:"student_name"`
		CompanyName    string `json:"company_name"`
		EvaluationType string `json:"evaluation_type"`
		Status         string `json:"status"`
		DueDate        string `json:"due_date"`
		CompletedAt    string `json:"completed_at"`
	}

	err := s.db.Raw(`
		SELECT 
			CONCAT(s.name, ' ', s.surname) as student_name,
			c.company_name_en as company_name,
			est.evaluation_type,
			est.status,
			DATE(est.due_date) as due_date,
			DATE(est.completed_at) as completed_at
		FROM evaluation_status_trackers est
		JOIN student_trainings st ON est.student_training_id = st.id
		JOIN student_enrolls se ON st.student_enroll_id = se.id
		JOIN students s ON se.student_id = s.id
		LEFT JOIN companies c ON st.company_id = c.id
		WHERE est.created_at BETWEEN ? AND ?
		ORDER BY est.due_date, s.student_id
	`, req.StartDate, req.EndDate).Scan(&evaluations).Error
	if err != nil {
		return nil, "", fmt.Errorf("failed to get evaluation data: %w", err)
	}

	return s.generateSimpleCSV(map[string]interface{}{"evaluations": evaluations}, "Evaluation Report")
}

// Helper methods for report generation
func (s *AnalyticsService) generateCSVReport(data *AnalyticsResponse, title string) ([]byte, string, error) {
	csv := fmt.Sprintf("%s\n\n", title)
	csv += "Summary Statistics\n"
	csv += fmt.Sprintf("Total Internships,%d\n", data.TotalInternships)
	csv += fmt.Sprintf("Approval Rate,%.2f%%\n", data.ApprovalRate)
	csv += fmt.Sprintf("Completion Rate,%.2f%%\n", data.CompletionRate)
	csv += "\n"

	csv += "Top Companies\n"
	csv += "Company Name,Student Count,Success Rate,Average Rating\n"
	for _, company := range data.TopCompanies {
		csv += fmt.Sprintf("%s,%d,%.2f%%,%.2f\n", 
			company.CompanyName, company.StudentCount, company.SuccessRate, company.AverageRating)
	}

	filename := fmt.Sprintf("internship_report_%s.csv", time.Now().Format("20060102_150405"))
	return []byte(csv), filename, nil
}

func (s *AnalyticsService) generatePDFReport(data *AnalyticsResponse, title string) ([]byte, string, error) {
	// Simplified PDF generation - in a real implementation, you'd use a PDF library
	content := fmt.Sprintf("PDF Report: %s\n\nTotal Internships: %d\nApproval Rate: %.2f%%\nCompletion Rate: %.2f%%", 
		title, data.TotalInternships, data.ApprovalRate, data.CompletionRate)
	
	filename := fmt.Sprintf("internship_report_%s.pdf", time.Now().Format("20060102_150405"))
	return []byte(content), filename, nil
}

func (s *AnalyticsService) generateExcelReport(data *AnalyticsResponse, title string) ([]byte, string, error) {
	// Simplified Excel generation - in a real implementation, you'd use an Excel library
	content := fmt.Sprintf("Excel Report: %s\n\nTotal Internships: %d\nApproval Rate: %.2f%%\nCompletion Rate: %.2f%%", 
		title, data.TotalInternships, data.ApprovalRate, data.CompletionRate)
	
	filename := fmt.Sprintf("internship_report_%s.xlsx", time.Now().Format("20060102_150405"))
	return []byte(content), filename, nil
}

func (s *AnalyticsService) generateSimpleCSV(data map[string]interface{}, title string) ([]byte, string, error) {
	csv := fmt.Sprintf("%s\n\n", title)
	
	// Simple CSV generation for any data structure
	for key, value := range data {
		csv += fmt.Sprintf("%s: %v\n", key, value)
	}
	
	filename := fmt.Sprintf("report_%s.csv", time.Now().Format("20060102_150405"))
	return []byte(csv), filename, nil
}