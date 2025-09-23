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

	// Health check and monitoring endpoints
	setupHealthRoutes(api, db, cfg, logger)

	// Setup authentication routes
	setupAuthRoutes(api, db, cfg)

	// Setup notification routes
	setupNotificationRoutes(api, db, cfg)

	// Setup user management routes
	setupUserRoutes(api, db, cfg)

	// Setup student management routes
	setupStudentRoutes(api, db, cfg)

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

// setupNotificationRoutes sets up push notification routes
func setupNotificationRoutes(api fiber.Router, db *gorm.DB, cfg *config.Config) {
	// Initialize services
	jwtService := services.NewJWTService(cfg.JWTSecret)
	notificationHandler := handlers.NewNotificationHandler(db, cfg)

	// Authentication middleware
	authMiddleware := middleware.AuthMiddleware(jwtService)

	// Notification routes (all require authentication)
	notifications := api.Group("/notifications", authMiddleware)
	
	notifications.Post("/register-token", notificationHandler.RegisterToken)
	notifications.Delete("/unregister-token", notificationHandler.UnregisterToken)
	notifications.Post("/send", notificationHandler.SendNotification)
	notifications.Post("/send-to-user/:userId", notificationHandler.SendToUser)
	notifications.Get("/history", notificationHandler.GetNotificationHistory)
	notifications.Put("/:id/read", notificationHandler.MarkAsRead)
	notifications.Get("/settings", notificationHandler.GetSettings)
	notifications.Put("/settings", notificationHandler.UpdateSettings)
}

// setupAuthRoutes sets up authentication-related routes
func setupAuthRoutes(api fiber.Router, db *gorm.DB, cfg *config.Config) {
	// Initialize services
	jwtService := services.NewJWTService(cfg.JWTSecret)
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

// setupUserRoutes sets up user management routes
func setupUserRoutes(api fiber.Router, db *gorm.DB, cfg *config.Config) {
	// Initialize services
	jwtService := services.NewJWTService(cfg.JWTSecret)
	userService := services.NewUserService(db)
	userHandler := handlers.NewUserHandler(userService)

	// Authentication middleware
	authMiddleware := middleware.AuthMiddleware(jwtService)

	// User management routes (all require authentication)
	users := api.Group("/users", authMiddleware)
	
	// Basic CRUD operations
	users.Get("/", userHandler.GetUsers)           // GET /api/v1/users
	users.Get("/stats", userHandler.GetUserStats)  // GET /api/v1/users/stats
	users.Get("/:id", userHandler.GetUser)         // GET /api/v1/users/:id
	users.Post("/", userHandler.CreateUser)        // POST /api/v1/users
	users.Put("/:id", userHandler.UpdateUser)      // PUT /api/v1/users/:id
	users.Delete("/:id", userHandler.DeleteUser)   // DELETE /api/v1/users/:id
	
	// Bulk operations
	users.Delete("/bulk", userHandler.BulkDeleteUsers)        // DELETE /api/v1/users/bulk
	users.Post("/bulk-excel", userHandler.BulkCreateFromExcel) // POST /api/v1/users/bulk-excel
}

// setupStudentRoutes sets up student management routes
func setupStudentRoutes(api fiber.Router, db *gorm.DB, cfg *config.Config) {
	// Initialize services
	jwtService := services.NewJWTService(cfg.JWTSecret)
	studentService := services.NewStudentService(db)
	studentHandler := handlers.NewStudentHandler(studentService)

	// Authentication middleware
	authMiddleware := middleware.AuthMiddleware(jwtService)

	// Student management routes (all require authentication)
	students := api.Group("/students", authMiddleware)
	
	// Basic CRUD operations
	students.Get("/", studentHandler.GetStudents)           // GET /api/v1/students
	students.Get("/stats", studentHandler.GetStudentStats)  // GET /api/v1/students/stats
	students.Get("/:id", studentHandler.GetStudent)         // GET /api/v1/students/:id
	students.Post("/", studentHandler.CreateStudent)        // POST /api/v1/students
	students.Put("/:id", studentHandler.UpdateStudent)      // PUT /api/v1/students/:id
	students.Delete("/:id", studentHandler.DeleteStudent)   // DELETE /api/v1/students/:id
	
	// Enrollment management
	students.Post("/enroll", studentHandler.EnrollStudent)                    // POST /api/v1/students/enroll
	students.Put("/enrollments/:id", studentHandler.UpdateEnrollment)         // PUT /api/v1/students/enrollments/:id
	students.Get("/:id/enrollments", studentHandler.GetStudentEnrollments)    // GET /api/v1/students/:id/enrollments
}

// setupVisitorRoutes sets up visitor management routes
func setupVisitorRoutes(api fiber.Router, db *gorm.DB, cfg *config.Config) {
	// Initialize services
	jwtService := services.NewJWTService(cfg.JWTSecret)
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
	jwtService := services.NewJWTService(cfg.JWTSecret)
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
	jwtService := services.NewJWTService(cfg.JWTSecret)
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
	jwtService := services.NewJWTService(cfg.JWTSecret)
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