package services

import (
	"fmt"
	"time"

	"backend-go/internal/models"
	"gorm.io/gorm"
)

// DashboardService handles dashboard data operations
type DashboardService struct {
	db *gorm.DB
}

// NewDashboardService creates a new dashboard service instance
func NewDashboardService(db *gorm.DB) *DashboardService {
	return &DashboardService{
		db: db,
	}
}

// StudentDashboardData represents student dashboard information
type StudentDashboardData struct {
	StudentInfo       *models.Student                    `json:"student_info"`
	CurrentEnrollment *models.StudentEnroll              `json:"current_enrollment"`
	InternshipStatus  *models.InternshipApproval         `json:"internship_status"`
	TrainingInfo      *models.StudentTraining            `json:"training_info"`
	EvaluationStatus  []models.EvaluationStatusTracker   `json:"evaluation_status"`
	RecentActivities  []DashboardActivity                `json:"recent_activities"`
	Notifications     []DashboardNotification            `json:"notifications"`
}

// InstructorDashboardData represents instructor dashboard information
type InstructorDashboardData struct {
	InstructorInfo      *models.Instructor              `json:"instructor_info"`
	PendingApprovals    []models.InternshipApproval     `json:"pending_approvals"`
	AssignedEvaluations []models.EvaluationStatusTracker `json:"assigned_evaluations"`
	StudentCount        int64                           `json:"student_count"`
	RecentActivities    []DashboardActivity             `json:"recent_activities"`
	Statistics          InstructorStats                 `json:"statistics"`
}

// AdminDashboardData represents admin dashboard information
type AdminDashboardData struct {
	OverallStats     AdminOverallStats   `json:"overall_stats"`
	RecentActivities []DashboardActivity `json:"recent_activities"`
	SystemHealth     SystemHealthStatus  `json:"system_health"`
	Charts           AdminChartData      `json:"charts"`
}

// DashboardActivity represents a dashboard activity item
type DashboardActivity struct {
	ID          uint      `json:"id"`
	Type        string    `json:"type"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	UserID      uint      `json:"user_id"`
	UserName    string    `json:"user_name"`
	CreatedAt   time.Time `json:"created_at"`
	Status      string    `json:"status"`
}

// DashboardNotification represents a dashboard notification
type DashboardNotification struct {
	ID        uint      `json:"id"`
	Type      string    `json:"type"`
	Title     string    `json:"title"`
	Message   string    `json:"message"`
	IsRead    bool      `json:"is_read"`
	Priority  string    `json:"priority"`
	CreatedAt time.Time `json:"created_at"`
}

// InstructorStats represents instructor statistics
type InstructorStats struct {
	TotalStudents       int64 `json:"total_students"`
	PendingApprovals    int64 `json:"pending_approvals"`
	CompletedApprovals  int64 `json:"completed_approvals"`
	PendingEvaluations  int64 `json:"pending_evaluations"`
	CompletedEvaluations int64 `json:"completed_evaluations"`
}

// AdminOverallStats represents admin overall statistics
type AdminOverallStats struct {
	TotalStudents      int64 `json:"total_students"`
	TotalCompanies     int64 `json:"total_companies"`
	TotalInstructors   int64 `json:"total_instructors"`
	ActiveInternships  int64 `json:"active_internships"`
	PendingApprovals   int64 `json:"pending_approvals"`
	CompletedTrainings int64 `json:"completed_trainings"`
}

// SystemHealthStatus represents system health information
type SystemHealthStatus struct {
	DatabaseStatus    string    `json:"database_status"`
	LastBackup        time.Time `json:"last_backup"`
	ActiveUsers       int64     `json:"active_users"`
	SystemUptime      string    `json:"system_uptime"`
	MemoryUsage       float64   `json:"memory_usage"`
	DiskUsage         float64   `json:"disk_usage"`
}

// AdminChartData represents chart data for admin dashboard
type AdminChartData struct {
	InternshipsByMonth    []MonthlyData `json:"internships_by_month"`
	ApprovalsByStatus     []DashboardStatusData  `json:"approvals_by_status"`
	StudentsByFaculty     []FacultyData `json:"students_by_faculty"`
	CompaniesByType       []TypeData    `json:"companies_by_type"`
}

// MonthlyData represents monthly statistics
type MonthlyData struct {
	Month string `json:"month"`
	Count int64  `json:"count"`
}

// DashboardStatusData represents status-based statistics for dashboard
type DashboardStatusData struct {
	Status string `json:"status"`
	Count  int64  `json:"count"`
}

// FacultyData represents faculty-based statistics
type FacultyData struct {
	FacultyName string `json:"faculty_name"`
	Count       int64  `json:"count"`
}

// TypeData represents type-based statistics
type TypeData struct {
	Type  string `json:"type"`
	Count int64  `json:"count"`
}

// GetStudentDashboard retrieves dashboard data for a student
func (s *DashboardService) GetStudentDashboard(studentID uint) (*StudentDashboardData, error) {
	// Get student info
	var student models.Student
	err := s.db.Preload("User").
		Preload("Major").
		Preload("Program").
		Preload("Faculty").
		First(&student, studentID).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get student info: %w", err)
	}

	// Get current enrollment
	var currentEnrollment models.StudentEnroll
	err = s.db.Where("student_id = ? AND status = ?", studentID, "enrolled").
		Preload("CourseSection.Course").
		First(&currentEnrollment).Error
	if err != nil && err != gorm.ErrRecordNotFound {
		return nil, fmt.Errorf("failed to get current enrollment: %w", err)
	}

	// Get internship status
	var internshipStatus models.InternshipApproval
	if currentEnrollment.ID != 0 {
		err = s.db.Where("student_enroll_id = ?", currentEnrollment.ID).
			Preload("Advisor").
			First(&internshipStatus).Error
		if err != nil && err != gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("failed to get internship status: %w", err)
		}
	}

	// Get training info
	var trainingInfo models.StudentTraining
	if currentEnrollment.ID != 0 {
		err = s.db.Where("student_enroll_id = ?", currentEnrollment.ID).
			Preload("Company").
			First(&trainingInfo).Error
		if err != nil && err != gorm.ErrRecordNotFound {
			return nil, fmt.Errorf("failed to get training info: %w", err)
		}
	}

	// Get evaluation status
	var evaluationStatus []models.EvaluationStatusTracker
	if trainingInfo.ID != 0 {
		err = s.db.Where("student_training_id = ?", trainingInfo.ID).
			Find(&evaluationStatus).Error
		if err != nil {
			return nil, fmt.Errorf("failed to get evaluation status: %w", err)
		}
	}

	// Get recent activities
	recentActivities, err := s.getStudentRecentActivities(studentID)
	if err != nil {
		return nil, fmt.Errorf("failed to get recent activities: %w", err)
	}

	// Get notifications
	notifications, err := s.getStudentNotifications(studentID)
	if err != nil {
		return nil, fmt.Errorf("failed to get notifications: %w", err)
	}

	dashboardData := &StudentDashboardData{
		StudentInfo:       &student,
		RecentActivities:  recentActivities,
		Notifications:     notifications,
		EvaluationStatus:  evaluationStatus,
	}

	if currentEnrollment.ID != 0 {
		dashboardData.CurrentEnrollment = &currentEnrollment
	}
	if internshipStatus.ID != 0 {
		dashboardData.InternshipStatus = &internshipStatus
	}
	if trainingInfo.ID != 0 {
		dashboardData.TrainingInfo = &trainingInfo
	}

	return dashboardData, nil
}

// GetInstructorDashboard retrieves dashboard data for an instructor
func (s *DashboardService) GetInstructorDashboard(instructorID uint) (*InstructorDashboardData, error) {
	// Get instructor info
	var instructor models.Instructor
	err := s.db.Preload("User").
		Preload("Faculty").
		Preload("Program").
		First(&instructor, instructorID).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get instructor info: %w", err)
	}

	// Get pending approvals
	var pendingApprovals []models.InternshipApproval
	err = s.db.Where("advisor_id = ? AND status IN ?", instructorID, 
		[]string{"registered", "pending"}).
		Preload("StudentEnroll.Student").
		Preload("StudentEnroll.CourseSection.Course").
		Find(&pendingApprovals).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get pending approvals: %w", err)
	}

	// Get assigned evaluations
	var assignedEvaluations []models.EvaluationStatusTracker
	err = s.db.Where("evaluator_id = ? AND status IN ?", instructor.UserID,
		[]string{"pending", "in_progress"}).
		Preload("StudentTraining.StudentEnroll.Student").
		Find(&assignedEvaluations).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get assigned evaluations: %w", err)
	}

	// Get student count
	var studentCount int64
	err = s.db.Table("internship_approvals").
		Where("advisor_id = ?", instructorID).
		Count(&studentCount).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get student count: %w", err)
	}

	// Get statistics
	stats, err := s.getInstructorStats(instructorID)
	if err != nil {
		return nil, fmt.Errorf("failed to get instructor stats: %w", err)
	}

	// Get recent activities
	recentActivities, err := s.getInstructorRecentActivities(instructorID)
	if err != nil {
		return nil, fmt.Errorf("failed to get recent activities: %w", err)
	}

	return &InstructorDashboardData{
		InstructorInfo:      &instructor,
		PendingApprovals:    pendingApprovals,
		AssignedEvaluations: assignedEvaluations,
		StudentCount:        studentCount,
		Statistics:          *stats,
		RecentActivities:    recentActivities,
	}, nil
}

// GetAdminDashboard retrieves dashboard data for admin
func (s *DashboardService) GetAdminDashboard() (*AdminDashboardData, error) {
	// Get overall stats
	overallStats, err := s.getAdminOverallStats()
	if err != nil {
		return nil, fmt.Errorf("failed to get overall stats: %w", err)
	}

	// Get recent activities
	recentActivities, err := s.getAdminRecentActivities()
	if err != nil {
		return nil, fmt.Errorf("failed to get recent activities: %w", err)
	}

	// Get system health
	systemHealth, err := s.getSystemHealth()
	if err != nil {
		return nil, fmt.Errorf("failed to get system health: %w", err)
	}

	// Get chart data
	chartData, err := s.getAdminChartData()
	if err != nil {
		return nil, fmt.Errorf("failed to get chart data: %w", err)
	}

	return &AdminDashboardData{
		OverallStats:     *overallStats,
		RecentActivities: recentActivities,
		SystemHealth:     *systemHealth,
		Charts:           *chartData,
	}, nil
}

// Helper methods
func (s *DashboardService) getStudentRecentActivities(studentID uint) ([]DashboardActivity, error) {
	var activities []DashboardActivity
	
	// Get recent approval activities
	var approvals []models.InternshipApproval
	err := s.db.Joins("JOIN student_enrolls ON internship_approvals.student_enroll_id = student_enrolls.id").
		Where("student_enrolls.student_id = ?", studentID).
		Order("internship_approvals.updated_at DESC").
		Limit(10).
		Preload("StudentEnroll.Student").
		Find(&approvals).Error
	
	if err != nil {
		return nil, err
	}
	
	for _, approval := range approvals {
		activities = append(activities, DashboardActivity{
			ID:          approval.ID,
			Type:        "approval",
			Title:       "Internship Approval Update",
			Description: fmt.Sprintf("Status changed to: %s", approval.GetStatusDisplayText()),
			UserID:      approval.StudentEnroll.StudentID,
			UserName:    approval.StudentEnroll.Student.GetFullName(),
			CreatedAt:   approval.UpdatedAt,
			Status:      string(approval.Status),
		})
	}
	
	// Get recent evaluation activities
	var evaluations []models.EvaluationStatusTracker
	err = s.db.Joins("JOIN student_trainings ON evaluation_status_trackers.student_training_id = student_trainings.id").
		Joins("JOIN student_enrolls ON student_trainings.student_enroll_id = student_enrolls.id").
		Where("student_enrolls.student_id = ?", studentID).
		Order("evaluation_status_trackers.updated_at DESC").
		Limit(5).
		Find(&evaluations).Error
	
	if err != nil {
		return nil, err
	}
	
	for _, eval := range evaluations {
		activities = append(activities, DashboardActivity{
			ID:          eval.ID,
			Type:        "evaluation",
			Title:       "Evaluation Update",
			Description: fmt.Sprintf("Evaluation %s: %s", eval.EvaluationType, eval.Status),
			UserID:      studentID,
			CreatedAt:   eval.UpdatedAt,
			Status:      string(eval.Status),
		})
	}
	
	return activities, nil
}

func (s *DashboardService) getStudentNotifications(studentID uint) ([]DashboardNotification, error) {
	var notifications []DashboardNotification
	
	// Get pending approvals notifications
	var pendingApprovals []models.InternshipApproval
	err := s.db.Joins("JOIN student_enrolls ON internship_approvals.student_enroll_id = student_enrolls.id").
		Where("student_enrolls.student_id = ? AND internship_approvals.status IN ?", 
			studentID, []string{"registered", "pending"}).
		Find(&pendingApprovals).Error
	
	if err != nil {
		return nil, err
	}
	
	for _, approval := range pendingApprovals {
		notifications = append(notifications, DashboardNotification{
			ID:       approval.ID,
			Type:     "approval_pending",
			Title:    "Approval Pending",
			Message:  "Your internship application is pending approval",
			IsRead:   false,
			Priority: "high",
			CreatedAt: approval.CreatedAt,
		})
	}
	
	// Get overdue evaluations notifications
	var overdueEvals []models.EvaluationStatusTracker
	err = s.db.Joins("JOIN student_trainings ON evaluation_status_trackers.student_training_id = student_trainings.id").
		Joins("JOIN student_enrolls ON student_trainings.student_enroll_id = student_enrolls.id").
		Where("student_enrolls.student_id = ? AND evaluation_status_trackers.due_date < ? AND evaluation_status_trackers.status != ?", 
			studentID, time.Now(), "completed").
		Find(&overdueEvals).Error
	
	if err != nil {
		return nil, err
	}
	
	for _, eval := range overdueEvals {
		notifications = append(notifications, DashboardNotification{
			ID:       eval.ID,
			Type:     "evaluation_overdue",
			Title:    "Evaluation Overdue",
			Message:  fmt.Sprintf("Your %s evaluation is overdue", eval.EvaluationType),
			IsRead:   false,
			Priority: "urgent",
			CreatedAt: eval.CreatedAt,
		})
	}
	
	return notifications, nil
}

func (s *DashboardService) getInstructorStats(instructorID uint) (*InstructorStats, error) {
	stats := &InstructorStats{}

	// Count total students
	err := s.db.Table("internship_approvals").
		Where("advisor_id = ?", instructorID).
		Count(&stats.TotalStudents).Error
	if err != nil {
		return nil, err
	}

	// Count pending approvals
	err = s.db.Table("internship_approvals").
		Where("advisor_id = ? AND status IN ?", instructorID, []string{"registered", "pending"}).
		Count(&stats.PendingApprovals).Error
	if err != nil {
		return nil, err
	}

	// Count completed approvals
	err = s.db.Table("internship_approvals").
		Where("advisor_id = ? AND status = ?", instructorID, "approve").
		Count(&stats.CompletedApprovals).Error
	if err != nil {
		return nil, err
	}

	return stats, nil
}

func (s *DashboardService) getInstructorRecentActivities(instructorID uint) ([]DashboardActivity, error) {
	var activities []DashboardActivity
	
	// Get recent approval activities by this instructor
	var approvals []models.InternshipApproval
	err := s.db.Where("advisor_id = ?", instructorID).
		Order("updated_at DESC").
		Limit(15).
		Preload("StudentEnroll.Student").
		Find(&approvals).Error
	
	if err != nil {
		return nil, err
	}
	
	for _, approval := range approvals {
		activities = append(activities, DashboardActivity{
			ID:          approval.ID,
			Type:        "approval_action",
			Title:       "Approval Action",
			Description: fmt.Sprintf("Reviewed %s's application - %s", 
				approval.StudentEnroll.Student.GetFullName(), approval.GetStatusDisplayText()),
			UserID:      approval.StudentEnroll.StudentID,
			UserName:    approval.StudentEnroll.Student.GetFullName(),
			CreatedAt:   approval.UpdatedAt,
			Status:      string(approval.Status),
		})
	}
	
	// Get recent evaluation assignments
	var instructor models.Instructor
	err = s.db.First(&instructor, instructorID).Error
	if err != nil {
		return nil, err
	}
	
	var evaluations []models.EvaluationStatusTracker
	err = s.db.Where("evaluator_id = ?", instructor.UserID).
		Order("updated_at DESC").
		Limit(10).
		Preload("StudentTraining.StudentEnroll.Student").
		Find(&evaluations).Error
	
	if err != nil {
		return nil, err
	}
	
	for _, eval := range evaluations {
		activities = append(activities, DashboardActivity{
			ID:          eval.ID,
			Type:        "evaluation_assigned",
			Title:       "Evaluation Assignment",
			Description: fmt.Sprintf("Assigned to evaluate %s - %s", 
				eval.StudentTraining.StudentEnroll.Student.GetFullName(), eval.EvaluationType),
			UserID:      eval.StudentTraining.StudentEnroll.StudentID,
			UserName:    eval.StudentTraining.StudentEnroll.Student.GetFullName(),
			CreatedAt:   eval.CreatedAt,
			Status:      string(eval.Status),
		})
	}
	
	return activities, nil
}

func (s *DashboardService) getAdminOverallStats() (*AdminOverallStats, error) {
	stats := &AdminOverallStats{}

	// Count total students
	err := s.db.Model(&models.Student{}).Count(&stats.TotalStudents).Error
	if err != nil {
		return nil, err
	}

	// Count total companies
	err = s.db.Model(&models.Company{}).Count(&stats.TotalCompanies).Error
	if err != nil {
		return nil, err
	}

	// Count total instructors
	err = s.db.Model(&models.Instructor{}).Count(&stats.TotalInstructors).Error
	if err != nil {
		return nil, err
	}

	// Count active internships
	err = s.db.Model(&models.StudentTraining{}).
		Where("end_date > ?", time.Now()).
		Count(&stats.ActiveInternships).Error
	if err != nil {
		return nil, err
	}

	// Count pending approvals
	err = s.db.Model(&models.InternshipApproval{}).
		Where("status IN ?", []string{"registered", "pending", "t.approved", "c.approved"}).
		Count(&stats.PendingApprovals).Error
	if err != nil {
		return nil, err
	}

	// Count completed trainings
	err = s.db.Model(&models.StudentTraining{}).
		Where("end_date < ?", time.Now()).
		Count(&stats.CompletedTrainings).Error
	if err != nil {
		return nil, err
	}

	return stats, nil
}

func (s *DashboardService) getAdminRecentActivities() ([]DashboardActivity, error) {
	var activities []DashboardActivity
	
	// Get recent system activities from security logs
	var securityLogs []models.SecurityLog
	err := s.db.Where("action IN ?", []string{"login", "approval_created", "evaluation_completed"}).
		Order("created_at DESC").
		Limit(20).
		Find(&securityLogs).Error
	
	if err != nil {
		return nil, err
	}
	
	for _, log := range securityLogs {
		var title, description string
		switch log.Action {
		case "login":
			title = "User Login"
			description = fmt.Sprintf("User %s logged in from %s", log.UserID, log.IPAddress)
		case "approval_created":
			title = "New Approval Request"
			description = "New internship approval request submitted"
		case "evaluation_completed":
			title = "Evaluation Completed"
			description = "Evaluation has been completed"
		default:
			title = "System Activity"
			description = fmt.Sprintf("Action: %s", log.Action)
		}
		
		activities = append(activities, DashboardActivity{
			ID:          log.ID,
			Type:        "system_activity",
			Title:       title,
			Description: description,
			UserID:      0, // System activity
			UserName:    "System",
			CreatedAt:   log.CreatedAt,
			Status:      "completed",
		})
	}
	
	// Get recent approvals for admin overview
	var recentApprovals []models.InternshipApproval
	err = s.db.Order("created_at DESC").
		Limit(10).
		Preload("StudentEnroll.Student").
		Find(&recentApprovals).Error
	
	if err != nil {
		return nil, err
	}
	
	for _, approval := range recentApprovals {
		activities = append(activities, DashboardActivity{
			ID:          approval.ID,
			Type:        "approval_system",
			Title:       "Internship Application",
			Description: fmt.Sprintf("%s submitted internship application - %s", 
				approval.StudentEnroll.Student.GetFullName(), approval.GetStatusDisplayText()),
			UserID:      approval.StudentEnroll.StudentID,
			UserName:    approval.StudentEnroll.Student.GetFullName(),
			CreatedAt:   approval.CreatedAt,
			Status:      string(approval.Status),
		})
	}
	
	return activities, nil
}

func (s *DashboardService) getSystemHealth() (*SystemHealthStatus, error) {
	health := &SystemHealthStatus{
		DatabaseStatus: "healthy",
		LastBackup:     time.Now().Add(-24 * time.Hour),
		SystemUptime:   "99.9%",
		MemoryUsage:    65.5,
		DiskUsage:      45.2,
	}

	// Count active users (users who logged in within last 24 hours)
	err := s.db.Model(&models.User{}).
		Where("last_login_at > ?", time.Now().Add(-24*time.Hour)).
		Count(&health.ActiveUsers).Error
	if err != nil {
		return nil, err
	}

	return health, nil
}

func (s *DashboardService) getAdminChartData() (*AdminChartData, error) {
	chartData := &AdminChartData{}

	// Get internships by month (last 12 months)
	var monthlyData []MonthlyData
	err := s.db.Raw(`
		SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count
		FROM student_trainings 
		WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
		GROUP BY DATE_FORMAT(created_at, '%Y-%m')
		ORDER BY month
	`).Scan(&monthlyData).Error
	if err != nil {
		return nil, err
	}
	chartData.InternshipsByMonth = monthlyData

	// Get approvals by status
	var statusData []DashboardStatusData
	err = s.db.Model(&models.InternshipApproval{}).
		Select("status, COUNT(*) as count").
		Group("status").
		Scan(&statusData).Error
	if err != nil {
		return nil, err
	}
	chartData.ApprovalsByStatus = statusData

	// Get students by faculty
	var facultyData []FacultyData
	err = s.db.Raw(`
		SELECT f.name as faculty_name, COUNT(*) as count
		FROM students s
		LEFT JOIN faculties f ON s.faculty_id = f.id
		GROUP BY s.faculty_id, f.name
		ORDER BY count DESC
	`).Scan(&facultyData).Error
	if err != nil {
		return nil, err
	}
	chartData.StudentsByFaculty = facultyData

	// Get companies by type
	var typeData []TypeData
	err = s.db.Model(&models.Company{}).
		Select("company_type as type, COUNT(*) as count").
		Group("company_type").
		Scan(&typeData).Error
	if err != nil {
		return nil, err
	}
	chartData.CompaniesByType = typeData

	return chartData, nil
}