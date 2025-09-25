package routes

import (
	"backend-go/internal/config"
	"backend-go/internal/handlers"
	"backend-go/internal/middleware"
	"backend-go/internal/services"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func Setup(app *fiber.App, db *gorm.DB, cfg *config.Config) {
	// Initialize logger
	var logger *services.Logger
	if cfg.Environment == "production" {
		logger = services.ProductionLogger()
	} else {
		logger = services.DefaultLogger()
	}
	
	// Initialize global logger
	services.InitGlobalLogger(services.LoggerConfig{
		Level:        services.INFO,
		ServiceName:  "backend-go",
		EnableCaller: cfg.Environment != "production",
	})

	// Add logging middleware
	app.Use(middleware.StructuredLogger(logger))
	app.Use(middleware.SecurityLogger(logger))
	app.Use(middleware.MetricsLogger(logger))
	app.Use(middleware.ErrorLogger(logger))

	// API v1 routes
	api := app.Group("/api/v1")

	// Basic test endpoint
	api.Get("/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "API is working",
			"version": "1.0.0",
		})
	})

	// Simple authentication endpoints (temporary fix)
	simpleAuthHandler := handlers.NewSimpleAuthHandler(db)
	api.Post("/simple-login", simpleAuthHandler.SimpleLogin)
	api.Post("/simple-register", simpleAuthHandler.SimpleRegister)

	// Health check and monitoring endpoints
	setupHealthRoutes(api, db, cfg, logger)

	// Setup authentication routes
	setupAuthRoutes(api, db, cfg)
	
	// Setup student authentication routes
	setupStudentAuthRoutes(api, db, cfg)

	// Setup notification routes (disabled for now)
	// setupNotificationRoutes(api, db, cfg)

	// Setup user management routes
	// setupUserRoutes(api, db, cfg) // Disabled - needs model alignment

	// Setup student management routes
	setupStudentRoutes(api, db, cfg)

	// Setup company management routes
	setupCompanyRoutes(api, db, cfg)

	// Setup dashboard routes
	setupDashboardRoutes(api, db, cfg)

	// Setup analytics routes
	setupAnalyticsRoutes(api, db, cfg)

	// Setup visitor management routes
	setupVisitorRoutes(api, db, cfg)

	// Setup PDF generation routes
	setupPDFRoutes(api, db, cfg)

	// Setup approval and evaluation routes
	setupApprovalRoutes(api, db, cfg)
	setupEvaluationRoutes(api, db, cfg)

	// TODO: Add more route groups as they are implemented
	// etc.
}

// setupHealthRoutes sets up health check and monitoring routes
func setupHealthRoutes(api fiber.Router, db *gorm.DB, cfg *config.Config, logger *services.Logger) {
	healthHandler := handlers.NewHealthHandler(db, cfg, logger)

	// Health check routes (no auth required)
	api.Get("/health", healthHandler.Health)
	api.Head("/health", healthHandler.HealthHead)
	api.Get("/health/detailed", healthHandler.HealthDetailed)
	
	// Monitoring endpoints (no auth required for infrastructure)
	api.Get("/metrics", healthHandler.Metrics)
	api.Get("/ready", healthHandler.Ready)
	api.Get("/live", healthHandler.Live)
}

// setupNotificationRoutes sets up notification routes
func setupNotificationRoutes(api fiber.Router, db *gorm.DB, cfg *config.Config) {
	// Initialize services
	jwtConfig := &services.JWTConfig{
		SecretKey: cfg.JWTSecret,
	}
	jwtService := services.NewJWTService(jwtConfig, db)
	
	// Push notification handler (existing)
	pushNotificationHandler := handlers.NewNotificationHandler(db, cfg)
	
	// Notification system handler (new)
	notificationService := services.NewNotificationService(db)
	notificationSystemHandler := handlers.NewNotificationSystemHandler(notificationService)

	// Authentication middleware
	authMiddleware := middleware.AuthMiddleware(jwtService)

	// Push notification routes (existing - all require authentication)
	pushNotifications := api.Group("/push-notifications", authMiddleware)
	pushNotifications.Post("/register-token", pushNotificationHandler.RegisterToken)
	pushNotifications.Delete("/unregister-token", pushNotificationHandler.UnregisterToken)
	pushNotifications.Post("/send", pushNotificationHandler.SendNotification)
	pushNotifications.Post("/send-to-user/:userId", pushNotificationHandler.SendToUser)
	pushNotifications.Get("/history", pushNotificationHandler.GetNotificationHistory)
	pushNotifications.Get("/settings", pushNotificationHandler.GetSettings)
	pushNotifications.Put("/settings", pushNotificationHandler.UpdateSettings)
	
	// Notification system routes (new - all require authentication)
	notifications := api.Group("/notifications", authMiddleware)
	notifications.Get("/", notificationSystemHandler.GetNotifications)                    // GET /api/v1/notifications
	notifications.Get("/unread-count", notificationSystemHandler.GetUnreadCount)         // GET /api/v1/notifications/unread-count
	notifications.Get("/stats", notificationSystemHandler.GetNotificationStats)          // GET /api/v1/notifications/stats
	notifications.Put("/:id/read", notificationSystemHandler.MarkAsRead)                 // PUT /api/v1/notifications/:id/read
	notifications.Post("/mark-all-read", notificationSystemHandler.MarkAllAsRead)        // POST /api/v1/notifications/mark-all-read
	notifications.Delete("/:id", notificationSystemHandler.DeleteNotification)          // DELETE /api/v1/notifications/:id
	
	// Admin-only notification routes
	notifications.Post("/", notificationSystemHandler.SendNotification)                 // POST /api/v1/notifications (Admin)
	notifications.Post("/bulk", notificationSystemHandler.SendBulkNotifications)        // POST /api/v1/notifications/bulk (Admin)
}

// setupAuthRoutes sets up authentication-related routes
func setupAuthRoutes(api fiber.Router, db *gorm.DB, cfg *config.Config) {
	// Initialize services
	jwtConfig := &services.JWTConfig{
		SecretKey: cfg.JWTSecret,
	}
	jwtService := services.NewJWTService(jwtConfig, db)
	authService := services.NewAuthService(db, jwtService)
	authHandler := handlers.NewAuthHandler(authService)

	// Public authentication routes (no auth required)
	api.Post("/login", authHandler.Login)
	api.Post("/register", authHandler.Register)
	api.Post("/refresh-token", authHandler.RefreshToken)
	api.Post("/request-password-reset", authHandler.RequestPasswordReset)
	api.Post("/reset-password", authHandler.ResetPassword)

	// Protected authentication routes (auth required)
	authMiddleware := middleware.AuthMiddleware(jwtService)
	api.Get("/me", authMiddleware, authHandler.Me)
	api.Post("/change-password", authMiddleware, authHandler.ChangePassword)
	api.Post("/logout", authMiddleware, authHandler.Logout)
}

// setupUserRoutes sets up user management routes - DISABLED
// func setupUserRoutes(api fiber.Router, db *gorm.DB, cfg *config.Config) {
// 	// Initialize services
// 	jwtConfig := &services.JWTConfig{
// 		SecretKey: cfg.JWTSecret,
// 	}
// 	jwtService := services.NewJWTService(jwtConfig, db)
// 	userService := services.NewUserService(db)
// 	userHandler := handlers.NewUserHandler(userService)

// 	// Authentication middleware
// 	authMiddleware := middleware.AuthMiddleware(jwtService)

// 	// User management routes (all require authentication)
// 	users := api.Group("/users", authMiddleware)
	
// 	// Basic CRUD operations
// 	users.Get("/", userHandler.GetUsers)           // GET /api/v1/users
// 	users.Get("/stats", userHandler.GetUserStats)  // GET /api/v1/users/stats
// 	users.Get("/:id", userHandler.GetUser)         // GET /api/v1/users/:id
// 	users.Post("/", userHandler.CreateUser)        // POST /api/v1/users
// 	users.Put("/:id", userHandler.UpdateUser)      // PUT /api/v1/users/:id
// 	users.Delete("/:id", userHandler.DeleteUser)   // DELETE /api/v1/users/:id
	
// 	// Bulk operations
// 	users.Delete("/bulk", userHandler.BulkDeleteUsers)        // DELETE /api/v1/users/bulk
// 	users.Post("/bulk-excel", userHandler.BulkCreateFromExcel) // POST /api/v1/users/bulk-excel
// }

// setupStudentRoutes sets up student management routes
func setupStudentRoutes(api fiber.Router, db *gorm.DB, cfg *config.Config) {
	// Initialize services
	jwtConfig := &services.JWTConfig{
		SecretKey: cfg.JWTSecret,
	}
	jwtService := services.NewJWTService(jwtConfig, db)
	studentService := services.NewStudentService(db)
	studentHandler := handlers.NewStudentHandler(studentService)

	// Authentication middleware
	authMiddleware := middleware.AuthMiddleware(jwtService)

	// Student management routes (all require authentication)
	students := api.Group("/students", authMiddleware)
	
	// Basic CRUD operations
	students.Get("/", studentHandler.GetStudents)           // GET /api/v1/students
	students.Get("/stats", studentHandler.GetStudentStats)  // GET /api/v1/students/stats
	students.Get("/analytics", studentHandler.GetStudentAnalytics) // GET /api/v1/students/analytics
	students.Get("/:id", studentHandler.GetStudent)         // GET /api/v1/students/:id
	students.Post("/", studentHandler.CreateStudent)        // POST /api/v1/students
	students.Put("/:id", studentHandler.UpdateStudent)      // PUT /api/v1/students/:id
	students.Delete("/:id", studentHandler.DeleteStudent)   // DELETE /api/v1/students/:id
	
	// Advanced operations
	students.Post("/search", studentHandler.AdvancedSearch)               // POST /api/v1/students/search
	students.Delete("/bulk", studentHandler.BulkDeleteStudents)           // DELETE /api/v1/students/bulk
	
	// Enrollment management
	students.Post("/enroll", studentHandler.EnrollStudent)                    // POST /api/v1/students/enroll
	students.Put("/enrollments/:id", studentHandler.UpdateEnrollment)         // PUT /api/v1/students/enrollments/:id
	students.Get("/:id/enrollments", studentHandler.GetStudentEnrollments)    // GET /api/v1/students/:id/enrollments
}

// setupCompanyRoutes sets up company management routes
func setupCompanyRoutes(api fiber.Router, db *gorm.DB, cfg *config.Config) {
	// Initialize services
	jwtConfig := &services.JWTConfig{
		SecretKey: cfg.JWTSecret,
	}
	jwtService := services.NewJWTService(jwtConfig, db)
	companyService := services.NewCompanyService(db)
	companyHandler := handlers.NewCompanyHandler(companyService)

	// Authentication middleware
	authMiddleware := middleware.AuthMiddleware(jwtService)

	// Company management routes (all require authentication)
	companies := api.Group("/companies", authMiddleware)
	
	// Basic CRUD operations
	companies.Get("/", companyHandler.GetCompanies)         // GET /api/v1/companies
	companies.Get("/stats", companyHandler.GetCompanyStats) // GET /api/v1/companies/stats
	companies.Get("/analytics", companyHandler.GetCompanyAnalytics) // GET /api/v1/companies/analytics
	companies.Get("/performance", companyHandler.GetCompanyPerformanceMetrics) // GET /api/v1/companies/performance
	companies.Get("/:id", companyHandler.GetCompany)        // GET /api/v1/companies/:id
	companies.Post("/", companyHandler.CreateCompany)       // POST /api/v1/companies
	companies.Put("/:id", companyHandler.UpdateCompany)     // PUT /api/v1/companies/:id
	companies.Delete("/:id", companyHandler.DeleteCompany)  // DELETE /api/v1/companies/:id
	
	// Advanced operations
	companies.Post("/search", companyHandler.AdvancedCompanySearch) // POST /api/v1/companies/search
}

// setupDashboardRoutes sets up dashboard routes
func setupDashboardRoutes(api fiber.Router, db *gorm.DB, cfg *config.Config) {
	// Initialize services
	jwtConfig := &services.JWTConfig{
		SecretKey: cfg.JWTSecret,
	}
	jwtService := services.NewJWTService(jwtConfig, db)
	dashboardService := services.NewDashboardService(db)
	dashboardHandler := handlers.NewDashboardHandler(dashboardService)

	// Authentication middleware
	authMiddleware := middleware.AuthMiddleware(jwtService)

	// Dashboard routes (all require authentication)
	dashboard := api.Group("/dashboard", authMiddleware)
	
	dashboard.Get("/student/:id", dashboardHandler.GetStudentDashboard)       // GET /api/v1/dashboard/student/:id
	dashboard.Get("/instructor/:id", dashboardHandler.GetInstructorDashboard) // GET /api/v1/dashboard/instructor/:id
	dashboard.Get("/admin", dashboardHandler.GetAdminDashboard)               // GET /api/v1/dashboard/admin
}

// setupAnalyticsRoutes sets up analytics and reporting routes
func setupAnalyticsRoutes(api fiber.Router, db *gorm.DB, cfg *config.Config) {
	// Initialize services
	jwtConfig := &services.JWTConfig{
		SecretKey: cfg.JWTSecret,
	}
	jwtService := services.NewJWTService(jwtConfig, db)
	analyticsService := services.NewAnalyticsService(db)
	analyticsHandler := handlers.NewAnalyticsHandler(analyticsService)

	// Authentication middleware
	authMiddleware := middleware.AuthMiddleware(jwtService)

	// Analytics routes (all require authentication)
	analytics := api.Group("/analytics", authMiddleware)
	
	analytics.Get("/stats", analyticsHandler.GetAnalyticsStats)                    // GET /api/v1/analytics/stats
	analytics.Get("/internships", analyticsHandler.GetInternshipAnalytics)        // GET /api/v1/analytics/internships
	analytics.Get("/approvals", analyticsHandler.GetApprovalAnalytics)            // GET /api/v1/analytics/approvals
	analytics.Get("/companies", analyticsHandler.GetCompanyAnalytics)             // GET /api/v1/analytics/companies
	analytics.Get("/report-types", analyticsHandler.GetReportTypes)               // GET /api/v1/analytics/report-types
	analytics.Post("/reports", analyticsHandler.GenerateReport)                   // POST /api/v1/analytics/reports
	analytics.Post("/custom", analyticsHandler.GetCustomAnalytics)                // POST /api/v1/analytics/custom
}

// setupVisitorRoutes sets up visitor management routes
func setupVisitorRoutes(api fiber.Router, db *gorm.DB, cfg *config.Config) {
	// Initialize services
	jwtConfig := &services.JWTConfig{
		SecretKey: cfg.JWTSecret,
	}
	jwtService := services.NewJWTService(jwtConfig, db)
	visitorService := services.NewVisitorService(db)
	visitorHandler := handlers.NewVisitorHandler(visitorService)

	// Authentication middleware
	authMiddleware := middleware.AuthMiddleware(jwtService)

	// Visitor Training routes
	visitorTrainings := api.Group("/visitor-trainings", authMiddleware)
	visitorTrainings.Get("/", visitorHandler.GetVisitorTrainings)                                    // GET /api/v1/visitor-trainings
	visitorTrainings.Get("/:id", visitorHandler.GetVisitorTraining)                                  // GET /api/v1/visitor-trainings/:id
	visitorTrainings.Post("/", visitorHandler.CreateVisitorTraining)                                 // POST /api/v1/visitor-trainings
	visitorTrainings.Put("/:id", visitorHandler.UpdateVisitorTraining)                               // PUT /api/v1/visitor-trainings/:id
	visitorTrainings.Delete("/:id", visitorHandler.DeleteVisitorTraining)                            // DELETE /api/v1/visitor-trainings/:id
	
	// Visitor Training nested routes for evaluations
	visitorTrainings.Get("/:training_id/evaluate-students", visitorHandler.GetVisitorEvaluateStudents)   // GET /api/v1/visitor-trainings/:training_id/evaluate-students
	visitorTrainings.Get("/:training_id/evaluate-companies", visitorHandler.GetVisitorEvaluateCompanies) // GET /api/v1/visitor-trainings/:training_id/evaluate-companies

	// Visitor Schedule routes
	visitorSchedules := api.Group("/visitor-schedules", authMiddleware)
	visitorSchedules.Get("/", visitorHandler.GetVisitorSchedules)                                    // GET /api/v1/visitor-schedules
	visitorSchedules.Get("/:id", visitorHandler.GetVisitorSchedule)                                  // GET /api/v1/visitor-schedules/:id
	visitorSchedules.Post("/", visitorHandler.CreateVisitorSchedule)                                 // POST /api/v1/visitor-schedules
	visitorSchedules.Put("/:id", visitorHandler.UpdateVisitorSchedule)                               // PUT /api/v1/visitor-schedules/:id
	visitorSchedules.Delete("/:id", visitorHandler.DeleteVisitorSchedule)                            // DELETE /api/v1/visitor-schedules/:id
	
	// Visitor Schedule nested routes for photos
	visitorSchedules.Get("/:schedule_id/photos", visitorHandler.GetVisitPhotos)                      // GET /api/v1/visitor-schedules/:schedule_id/photos
	visitorSchedules.Post("/:schedule_id/photos", visitorHandler.UploadVisitPhoto)                   // POST /api/v1/visitor-schedules/:schedule_id/photos

	// Visitor Evaluate Student routes
	visitorEvaluateStudents := api.Group("/visitor-evaluate-students", authMiddleware)
	visitorEvaluateStudents.Get("/:id", visitorHandler.GetVisitorEvaluateStudent)                    // GET /api/v1/visitor-evaluate-students/:id
	visitorEvaluateStudents.Post("/", visitorHandler.CreateVisitorEvaluateStudent)                   // POST /api/v1/visitor-evaluate-students
	visitorEvaluateStudents.Put("/:id", visitorHandler.UpdateVisitorEvaluateStudent)                 // PUT /api/v1/visitor-evaluate-students/:id
	visitorEvaluateStudents.Delete("/:id", visitorHandler.DeleteVisitorEvaluateStudent)              // DELETE /api/v1/visitor-evaluate-students/:id

	// Visitor Evaluate Company routes
	visitorEvaluateCompanies := api.Group("/visitor-evaluate-companies", authMiddleware)
	visitorEvaluateCompanies.Get("/:id", visitorHandler.GetVisitorEvaluateCompany)                   // GET /api/v1/visitor-evaluate-companies/:id
	visitorEvaluateCompanies.Post("/", visitorHandler.CreateVisitorEvaluateCompany)                  // POST /api/v1/visitor-evaluate-companies
	visitorEvaluateCompanies.Put("/:id", visitorHandler.UpdateVisitorEvaluateCompany)                // PUT /api/v1/visitor-evaluate-companies/:id
	visitorEvaluateCompanies.Delete("/:id", visitorHandler.DeleteVisitorEvaluateCompany)             // DELETE /api/v1/visitor-evaluate-companies/:id

	// Visit Photo routes
	visitPhotos := api.Group("/visit-photos", authMiddleware)
	visitPhotos.Get("/:id", visitorHandler.GetVisitPhoto)                                            // GET /api/v1/visit-photos/:id
	visitPhotos.Put("/:id", visitorHandler.UpdateVisitPhoto)                                         // PUT /api/v1/visit-photos/:id
	visitPhotos.Delete("/:id", visitorHandler.DeleteVisitPhoto)                                      // DELETE /api/v1/visit-photos/:id
}

// setupPDFRoutes sets up PDF generation routes
func setupPDFRoutes(api fiber.Router, db *gorm.DB, cfg *config.Config) {
	// Initialize services
	jwtConfig := &services.JWTConfig{
		SecretKey: cfg.JWTSecret,
	}
	jwtService := services.NewJWTService(jwtConfig, db)
	pdfService := services.NewPDFService("uploads/pdf")
	pdfHandler := handlers.NewPDFHandler(db, pdfService)

	// Authentication middleware
	authMiddleware := middleware.AuthMiddleware(jwtService)

	// PDF generation routes (all require authentication)
	pdf := api.Group("/pdf", authMiddleware)
	
	// Report generation
	pdf.Post("/reports", pdfHandler.GenerateReport)           // POST /api/v1/pdf/reports
	
	// Letter generation
	pdf.Post("/letters", pdfHandler.GenerateLetter)           // POST /api/v1/pdf/letters
	
	// File management
	pdf.Get("/list", pdfHandler.ListPDFs)                     // GET /api/v1/pdf/list
	pdf.Get("/download/:filename", pdfHandler.DownloadPDF)    // GET /api/v1/pdf/download/:filename
	pdf.Delete("/:filename", pdfHandler.DeletePDF)            // DELETE /api/v1/pdf/:filename
}

// setupApprovalRoutes sets up internship approval workflow routes
func setupApprovalRoutes(api fiber.Router, db *gorm.DB, cfg *config.Config) {
	// Initialize services
	jwtConfig := &services.JWTConfig{
		SecretKey: cfg.JWTSecret,
	}
	jwtService := services.NewJWTService(jwtConfig, db)
	approvalHandler := handlers.NewApprovalHandler(db)

	// Authentication middleware
	authMiddleware := middleware.AuthMiddleware(jwtService)

	// Approval routes (all require authentication)
	approvals := api.Group("/approvals", authMiddleware)
	
	// Status and information routes
	approvals.Get("/status/:studentEnrollId", approvalHandler.GetApprovalStatus)           // GET /api/v1/approvals/status/:studentEnrollId
	approvals.Get("/committee-voting/:studentEnrollId", approvalHandler.GetCommitteeVotingData) // GET /api/v1/approvals/committee-voting/:studentEnrollId
	approvals.Get("/statuses", approvalHandler.GetApprovalStatuses)                       // GET /api/v1/approvals/statuses
	approvals.Get("/", approvalHandler.GetApprovalsByStatus)                              // GET /api/v1/approvals?status=registered&page=1&limit=10
	
	// Action routes
	approvals.Post("/", approvalHandler.CreateApprovalRecord)                             // POST /api/v1/approvals
	approvals.Post("/advisor/:studentEnrollId", approvalHandler.AdvisorApproval)          // POST /api/v1/approvals/advisor/:studentEnrollId
	approvals.Post("/committee-vote/:studentEnrollId", approvalHandler.CommitteeMemberVote) // POST /api/v1/approvals/committee-vote/:studentEnrollId
	approvals.Put("/status/:studentEnrollId", approvalHandler.UpdateApprovalStatus)       // PUT /api/v1/approvals/status/:studentEnrollId
}

// setupEvaluationRoutes sets up evaluation status tracking routes
func setupEvaluationRoutes(api fiber.Router, db *gorm.DB, cfg *config.Config) {
	// Initialize services
	jwtConfig := &services.JWTConfig{
		SecretKey: cfg.JWTSecret,
	}
	jwtService := services.NewJWTService(jwtConfig, db)
	evaluationHandler := handlers.NewEvaluationHandler(db)

	// Authentication middleware
	authMiddleware := middleware.AuthMiddleware(jwtService)

	// Evaluation routes (all require authentication)
	evaluations := api.Group("/evaluations", authMiddleware)
	
	// Information and status routes
	evaluations.Get("/summary/:studentTrainingId", evaluationHandler.GetEvaluationSummary)     // GET /api/v1/evaluations/summary/:studentTrainingId
	evaluations.Get("/", evaluationHandler.GetEvaluationsByType)                              // GET /api/v1/evaluations?type=student_company&status=pending&page=1&limit=10
	evaluations.Get("/overdue", evaluationHandler.GetOverdueEvaluations)                      // GET /api/v1/evaluations/overdue
	evaluations.Get("/stats", evaluationHandler.GetEvaluationStats)                          // GET /api/v1/evaluations/stats
	evaluations.Get("/student/:studentTrainingId/status", evaluationHandler.CheckStudentEvaluationStatus) // GET /api/v1/evaluations/student/:studentTrainingId/status
	evaluations.Get("/instructor/:instructorId/assignments", evaluationHandler.GetInstructorAssignments) // GET /api/v1/evaluations/instructor/:instructorId/assignments
	evaluations.Get("/types", evaluationHandler.GetEvaluationTypes)                          // GET /api/v1/evaluations/types
	evaluations.Get("/statuses", evaluationHandler.GetEvaluationStatuses)                    // GET /api/v1/evaluations/statuses
	
	// Action routes
	evaluations.Post("/trackers", evaluationHandler.CreateEvaluationTrackers)               // POST /api/v1/evaluations/trackers
	evaluations.Post("/complete", evaluationHandler.MarkEvaluationCompleted)                // POST /api/v1/evaluations/complete
	evaluations.Post("/update-overdue", evaluationHandler.UpdateOverdueEvaluations)         // POST /api/v1/evaluations/update-overdue
	evaluations.Put("/:id/status", evaluationHandler.UpdateEvaluationStatus)               // PUT /api/v1/evaluations/:id/status
	evaluations.Put("/:id/assign", evaluationHandler.AssignEvaluator)                      // PUT /api/v1/evaluations/:id/assign
}

// setupStudentAuthRoutes sets up student-specific authentication routes
func setupStudentAuthRoutes(api fiber.Router, db *gorm.DB, cfg *config.Config) {
	// Initialize services
	jwtConfig := &services.JWTConfig{
		SecretKey: cfg.JWTSecret,
	}
	jwtService := services.NewJWTService(jwtConfig, db)
	authService := services.NewAuthService(db, jwtService)
	studentIdValidation := services.NewStudentIdValidationService(db)
	passwordSecurity := services.NewPasswordSecurityService()
	studentAuthHandler := handlers.NewStudentAuthHandler(authService, studentIdValidation, passwordSecurity)

	// Student authentication routes (no auth required)
	studentAuth := api.Group("/auth/student")
	
	studentAuth.Post("/login", studentAuthHandler.StudentLogin)                    // POST /api/v1/auth/student/login
	studentAuth.Post("/register", studentAuthHandler.StudentRegister)             // POST /api/v1/auth/student/register
	studentAuth.Post("/forgot-password", studentAuthHandler.StudentForgotPassword) // POST /api/v1/auth/student/forgot-password
	studentAuth.Post("/reset-password", studentAuthHandler.StudentResetPassword)   // POST /api/v1/auth/student/reset-password

	// Protected student authentication routes (auth required)
	authMiddleware := middleware.AuthMiddleware(jwtService)
	studentAuth.Post("/change-password", authMiddleware, studentAuthHandler.StudentChangePassword) // POST /api/v1/auth/student/change-password
	studentAuth.Post("/logout", authMiddleware, studentAuthHandler.StudentLogout)                  // POST /api/v1/auth/student/logout
}