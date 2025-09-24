package main

import (
	"log"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// Demo Models
type User struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	Email     string    `json:"email" gorm:"unique"`
	Password  string    `json:"password"`
	FirstName string    `json:"first_name"`
	LastName  string    `json:"last_name"`
	Role      string    `json:"role"`
	StudentID *string   `json:"student_id,omitempty" gorm:"unique"`
	IsActive  bool      `json:"is_active" gorm:"default:true"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Company struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name" gorm:"not null"`
	NameTH      string    `json:"name_th"`
	Address     string    `json:"address"`
	Phone       string    `json:"phone"`
	Email       string    `json:"email"`
	Website     string    `json:"website"`
	Industry    string    `json:"industry"`
	Description string    `json:"description" gorm:"type:text"`
	IsActive    bool      `json:"is_active" gorm:"default:true"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Student struct {
	ID        uint      `json:"id" gorm:"primaryKey"`
	UserID    uint      `json:"user_id"`
	User      User      `json:"user" gorm:"foreignKey:UserID"`
	StudentID string    `json:"student_id" gorm:"unique"`
	Major     string    `json:"major"`
	Year      int       `json:"year"`
	GPA       float64   `json:"gpa"`
	Status    string    `json:"status" gorm:"default:active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Internship struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	StudentID   uint      `json:"student_id"`
	Student     Student   `json:"student" gorm:"foreignKey:StudentID"`
	CompanyID   uint      `json:"company_id"`
	Company     Company   `json:"company" gorm:"foreignKey:CompanyID"`
	Position    string    `json:"position"`
	StartDate   time.Time `json:"start_date"`
	EndDate     time.Time `json:"end_date"`
	Status      string    `json:"status" gorm:"default:pending"`
	Description string    `json:"description" gorm:"type:text"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

var db *gorm.DB

func main() {
	// Initialize database
	var err error
	db, err = gorm.Open(sqlite.Open("internship.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Create Fiber app
	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			message := "Internal Server Error"

			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
				message = e.Message
			}

			return c.Status(code).JSON(fiber.Map{
				"error":   message,
				"code":    code,
				"success": false,
			})
		},
	})

	// CORS middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:3000,http://localhost:5173",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization, X-Request-ID",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS, HEAD",
	}))

	// Basic health check endpoint
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"message": "Demo Server is running with real data",
			"version": "1.0.0-demo",
			"time":    time.Now().Format("2006-01-02 15:04:05"),
		})
	})

	// API v1 routes
	api := app.Group("/api/v1")

	// Test endpoint
	api.Get("/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "Demo API is working with real data",
			"version": "1.0.0-demo",
			"backend": "Go Fiber with SQLite",
			"features": []string{
				"User Management",
				"Company Management", 
				"Student Management",
				"Internship Management",
				"Real Demo Data",
			},
		})
	})

	// Authentication endpoints
	api.Post("/login", handleLogin)
	api.Post("/student-login", handleStudentLogin)
	api.Post("/register", handleRegister)

	// User endpoints
	api.Get("/users", getUsers)
	api.Get("/users/:id", getUser)

	// Student endpoints
	api.Get("/students", getStudents)
	api.Get("/students/:id", getStudent)

	// Company endpoints
	api.Get("/companies", getCompanies)
	api.Get("/companies/:id", getCompany)

	// Internship endpoints
	api.Get("/internships", getInternships)
	api.Get("/internships/:id", getInternship)
	api.Post("/internships", createInternship)
	api.Put("/internships/:id", updateInternship)

	// Dashboard endpoints
	api.Get("/dashboard/stats", getDashboardStats)
	api.Get("/dashboard/student/:id", getStudentDashboard)

	// Start server
	port := "8080"
	log.Printf("🎬 Demo server starting on port %s", port)
	log.Printf("🌐 Health check: http://localhost:%s/health", port)
	log.Printf("🔗 API test: http://localhost:%s/api/v1/test", port)
	log.Printf("📊 Dashboard: http://localhost:3000")

	if err := app.Listen(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

// Authentication handlers
func handleLogin(c *fiber.Ctx) error {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   "Invalid request body",
			"success": false,
		})
	}

	var user User
	if err := db.Where("email = ? AND is_active = ?", req.Email, true).First(&user).Error; err != nil {
		return c.Status(401).JSON(fiber.Map{
			"error":   "Invalid email or password",
			"success": false,
		})
	}

	// In real app, verify password hash
	// For demo, accept any password
	return c.JSON(fiber.Map{
		"success": true,
		"message": "Login successful",
		"user": fiber.Map{
			"id":         user.ID,
			"email":      user.Email,
			"first_name": user.FirstName,
			"last_name":  user.LastName,
			"role":       user.Role,
			"student_id": user.StudentID,
		},
		"token": "demo-jwt-token-" + strconv.Itoa(int(user.ID)),
	})
}

func handleStudentLogin(c *fiber.Ctx) error {
	var req struct {
		StudentID string `json:"student_id"`
		Password  string `json:"password"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   "Invalid request body",
			"success": false,
		})
	}

	var user User
	if err := db.Where("student_id = ? AND is_active = ?", req.StudentID, true).First(&user).Error; err != nil {
		return c.Status(401).JSON(fiber.Map{
			"error":   "Invalid student ID or password",
			"success": false,
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Student login successful",
		"user": fiber.Map{
			"id":         user.ID,
			"email":      user.Email,
			"first_name": user.FirstName,
			"last_name":  user.LastName,
			"role":       user.Role,
			"student_id": user.StudentID,
		},
		"token": "demo-jwt-token-student-" + strconv.Itoa(int(user.ID)),
	})
}

func handleRegister(c *fiber.Ctx) error {
	return c.Status(501).JSON(fiber.Map{
		"error":   "Registration not implemented in demo",
		"success": false,
		"message": "Use existing demo accounts",
	})
}

// User handlers
func getUsers(c *fiber.Ctx) error {
	var users []User
	if err := db.Where("is_active = ?", true).Find(&users).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   "Failed to fetch users",
			"success": false,
		})
	}

	// Remove password from response
	for i := range users {
		users[i].Password = ""
	}

	return c.JSON(fiber.Map{
		"success": true,
		"users":   users,
		"total":   len(users),
	})
}

func getUser(c *fiber.Ctx) error {
	id := c.Params("id")
	var user User
	if err := db.Where("id = ? AND is_active = ?", id, true).First(&user).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error":   "User not found",
			"success": false,
		})
	}

	user.Password = "" // Remove password
	return c.JSON(fiber.Map{
		"success": true,
		"user":    user,
	})
}

// Student handlers
func getStudents(c *fiber.Ctx) error {
	var students []Student
	if err := db.Preload("User").Find(&students).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   "Failed to fetch students",
			"success": false,
		})
	}

	// Remove password from user data
	for i := range students {
		students[i].User.Password = ""
	}

	return c.JSON(fiber.Map{
		"success":  true,
		"students": students,
		"total":    len(students),
	})
}

func getStudent(c *fiber.Ctx) error {
	id := c.Params("id")
	var student Student
	if err := db.Preload("User").Where("id = ?", id).First(&student).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error":   "Student not found",
			"success": false,
		})
	}

	student.User.Password = ""
	return c.JSON(fiber.Map{
		"success": true,
		"student": student,
	})
}

// Company handlers
func getCompanies(c *fiber.Ctx) error {
	var companies []Company
	if err := db.Where("is_active = ?", true).Find(&companies).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   "Failed to fetch companies",
			"success": false,
		})
	}

	return c.JSON(fiber.Map{
		"success":   true,
		"companies": companies,
		"total":     len(companies),
	})
}

func getCompany(c *fiber.Ctx) error {
	id := c.Params("id")
	var company Company
	if err := db.Where("id = ? AND is_active = ?", id, true).First(&company).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error":   "Company not found",
			"success": false,
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"company": company,
	})
}

// Internship handlers
func getInternships(c *fiber.Ctx) error {
	var internships []Internship
	if err := db.Preload("Student.User").Preload("Company").Find(&internships).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   "Failed to fetch internships",
			"success": false,
		})
	}

	// Remove password from user data
	for i := range internships {
		internships[i].Student.User.Password = ""
	}

	return c.JSON(fiber.Map{
		"success":     true,
		"internships": internships,
		"total":       len(internships),
	})
}

func getInternship(c *fiber.Ctx) error {
	id := c.Params("id")
	var internship Internship
	if err := db.Preload("Student.User").Preload("Company").Where("id = ?", id).First(&internship).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error":   "Internship not found",
			"success": false,
		})
	}

	internship.Student.User.Password = ""
	return c.JSON(fiber.Map{
		"success":    true,
		"internship": internship,
	})
}

func createInternship(c *fiber.Ctx) error {
	var internship Internship
	if err := c.BodyParser(&internship); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   "Invalid request body",
			"success": false,
		})
	}

	internship.CreatedAt = time.Now()
	internship.UpdatedAt = time.Now()

	if err := db.Create(&internship).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   "Failed to create internship",
			"success": false,
		})
	}

	return c.Status(201).JSON(fiber.Map{
		"success":    true,
		"message":    "Internship created successfully",
		"internship": internship,
	})
}

func updateInternship(c *fiber.Ctx) error {
	id := c.Params("id")
	var internship Internship

	if err := db.Where("id = ?", id).First(&internship).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error":   "Internship not found",
			"success": false,
		})
	}

	var updates map[string]interface{}
	if err := c.BodyParser(&updates); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   "Invalid request body",
			"success": false,
		})
	}

	updates["updated_at"] = time.Now()

	if err := db.Model(&internship).Updates(updates).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{
			"error":   "Failed to update internship",
			"success": false,
		})
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "Internship updated successfully",
	})
}

// Dashboard handlers
func getDashboardStats(c *fiber.Ctx) error {
	var stats struct {
		TotalUsers       int64 `json:"total_users"`
		TotalStudents    int64 `json:"total_students"`
		TotalCompanies   int64 `json:"total_companies"`
		TotalInternships int64 `json:"total_internships"`
		PendingApprovals int64 `json:"pending_approvals"`
		ActiveInternships int64 `json:"active_internships"`
	}

	db.Model(&User{}).Where("is_active = ?", true).Count(&stats.TotalUsers)
	db.Model(&Student{}).Count(&stats.TotalStudents)
	db.Model(&Company{}).Where("is_active = ?", true).Count(&stats.TotalCompanies)
	db.Model(&Internship{}).Count(&stats.TotalInternships)
	db.Model(&Internship{}).Where("status = ?", "pending").Count(&stats.PendingApprovals)
	db.Model(&Internship{}).Where("status IN ?", []string{"approved", "in_progress"}).Count(&stats.ActiveInternships)

	return c.JSON(fiber.Map{
		"success": true,
		"stats":   stats,
	})
}

func getStudentDashboard(c *fiber.Ctx) error {
	studentID := c.Params("id")
	
	var student Student
	if err := db.Preload("User").Where("id = ?", studentID).First(&student).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{
			"error":   "Student not found",
			"success": false,
		})
	}

	var internships []Internship
	db.Preload("Company").Where("student_id = ?", studentID).Find(&internships)

	student.User.Password = ""

	return c.JSON(fiber.Map{
		"success": true,
		"student": student,
		"internships": internships,
		"stats": fiber.Map{
			"total_applications": len(internships),
			"pending_applications": countByStatus(internships, "pending"),
			"approved_applications": countByStatus(internships, "approved"),
			"active_internships": countByStatus(internships, "in_progress"),
		},
	})
}

func countByStatus(internships []Internship, status string) int {
	count := 0
	for _, internship := range internships {
		if internship.Status == status {
			count++
		}
	}
	return count
}