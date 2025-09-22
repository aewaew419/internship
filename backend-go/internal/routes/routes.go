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
	// API v1 routes
	api := app.Group("/api/v1")

	// Basic test endpoint
	api.Get("/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "API is working",
			"version": "1.0.0",
		})
	})

	// Setup authentication routes
	setupAuthRoutes(api, db, cfg)

	// Setup user management routes
	setupUserRoutes(api, db, cfg)

	// Setup student management routes
	setupStudentRoutes(api, db, cfg)

	// Setup instructor management routes
	setupInstructorRoutes(api, db, cfg)

	// Setup course management routes
	setupCourseRoutes(api, db, cfg)

	// TODO: Add more route groups as they are implemented
	// etc.
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

// setupInstructorRoutes sets up instructor management routes
func setupInstructorRoutes(api fiber.Router, db *gorm.DB, cfg *config.Config) {
	// Initialize services
	jwtService := services.NewJWTService(cfg.JWTSecret)
	instructorService := services.NewInstructorService(db)
	instructorHandler := handlers.NewInstructorHandler(instructorService)

	// Authentication middleware
	authMiddleware := middleware.AuthMiddleware(jwtService)

	// Instructor management routes (all require authentication)
	instructors := api.Group("/instructors", authMiddleware)
	
	// Basic CRUD operations
	instructors.Get("/", instructorHandler.GetInstructors)           // GET /api/v1/instructors
	instructors.Get("/stats", instructorHandler.GetInstructorStats)  // GET /api/v1/instructors/stats
	instructors.Get("/:id", instructorHandler.GetInstructor)         // GET /api/v1/instructors/:id
	instructors.Post("/", instructorHandler.CreateInstructor)        // POST /api/v1/instructors
	instructors.Put("/:id", instructorHandler.UpdateInstructor)      // PUT /api/v1/instructors/:id
	instructors.Delete("/:id", instructorHandler.DeleteInstructor)   // DELETE /api/v1/instructors/:id
	
	// Course assignment management
	instructors.Post("/assign-course", instructorHandler.AssignInstructorToCourse)                    // POST /api/v1/instructors/assign-course
	instructors.Put("/course-assignments/:id", instructorHandler.UpdateCourseAssignment)              // PUT /api/v1/instructors/course-assignments/:id
	instructors.Delete("/course-assignments/:id", instructorHandler.RemoveCourseAssignment)           // DELETE /api/v1/instructors/course-assignments/:id
	instructors.Get("/:id/course-assignments", instructorHandler.GetInstructorCourseAssignments)      // GET /api/v1/instructors/:id/course-assignments
	
	// Grade management
	instructors.Post("/manage-grade", instructorHandler.ManageInstructorGrade)                        // POST /api/v1/instructors/manage-grade
	
	// Training attendance
	instructors.Post("/record-attendance", instructorHandler.RecordTrainingAttendance)                // POST /api/v1/instructors/record-attendance
}

// setupCourseRoutes sets up course management routes
func setupCourseRoutes(api fiber.Router, db *gorm.DB, cfg *config.Config) {
	// Initialize services
	jwtService := services.NewJWTService(cfg.JWTSecret)
	courseService := services.NewCourseService(db)
	courseHandler := handlers.NewCourseHandler(courseService)

	// Authentication middleware
	authMiddleware := middleware.AuthMiddleware(jwtService)

	// Course management routes (all require authentication)
	courses := api.Group("/courses", authMiddleware)
	
	// Basic CRUD operations for courses
	courses.Get("/", courseHandler.GetCourses)           // GET /api/v1/courses
	courses.Get("/:id", courseHandler.GetCourse)         // GET /api/v1/courses/:id
	courses.Post("/", courseHandler.CreateCourse)        // POST /api/v1/courses
	courses.Put("/:id", courseHandler.UpdateCourse)      // PUT /api/v1/courses/:id
	courses.Delete("/:id", courseHandler.DeleteCourse)   // DELETE /api/v1/courses/:id
	
	// Instructor assignment management
	courses.Post("/assign-instructor", courseHandler.AssignInstructorToCourse)                    // POST /api/v1/courses/assign-instructor
	courses.Put("/instructor-assignments/:id", courseHandler.UpdateInstructorAssignment)          // PUT /api/v1/courses/instructor-assignments/:id
	courses.Delete("/instructor-assignments/:id", courseHandler.RemoveInstructorFromCourse)       // DELETE /api/v1/courses/instructor-assignments/:id
	
	// Committee management
	courses.Post("/assign-committee", courseHandler.AssignCommitteeMember)                        // POST /api/v1/courses/assign-committee
	courses.Put("/committee-assignments/:id", courseHandler.UpdateCommitteeAssignment)            // PUT /api/v1/courses/committee-assignments/:id
	courses.Delete("/committee-assignments/:id", courseHandler.RemoveCommitteeMember)             // DELETE /api/v1/courses/committee-assignments/:id
	
	// Student enrollment status management
	courses.Put("/enrollments/:id", courseHandler.UpdateStudentEnrollmentStatus)                  // PUT /api/v1/courses/enrollments/:id

	// Course sections management
	courseSections := api.Group("/course-sections", authMiddleware)
	
	// Basic CRUD operations for course sections
	courseSections.Get("/", courseHandler.GetCourseSections)           // GET /api/v1/course-sections
	courseSections.Get("/:id", courseHandler.GetCourseSection)         // GET /api/v1/course-sections/:id
	courseSections.Post("/", courseHandler.CreateCourseSection)        // POST /api/v1/course-sections
	courseSections.Put("/:id", courseHandler.UpdateCourseSection)      // PUT /api/v1/course-sections/:id
	courseSections.Delete("/:id", courseHandler.DeleteCourseSection)   // DELETE /api/v1/course-sections/:id

	// Student enrollment statuses management
	enrollmentStatuses := api.Group("/student-enrollment-statuses", authMiddleware)
	
	// Basic CRUD operations for student enrollment statuses
	enrollmentStatuses.Get("/", courseHandler.GetStudentEnrollmentStatuses)                       // GET /api/v1/student-enrollment-statuses
	enrollmentStatuses.Post("/", courseHandler.CreateStudentEnrollmentStatus)                     // POST /api/v1/student-enrollment-statuses
	enrollmentStatuses.Put("/:id", courseHandler.UpdateStudentEnrollmentStatusRecord)             // PUT /api/v1/student-enrollment-statuses/:id
}