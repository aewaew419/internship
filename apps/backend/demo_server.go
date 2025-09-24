package main

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

// Demo Data Structures
type User struct {
	ID        int    `json:"id"`
	Email     string `json:"email"`
	Password  string `json:"password"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Role      string `json:"role"`
	StudentID string `json:"studentId,omitempty"`
	IsActive  bool   `json:"isActive"`
}

type Company struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	NameTH      string `json:"nameTH"`
	Address     string `json:"address"`
	Phone       string `json:"phone"`
	Email       string `json:"email"`
	Website     string `json:"website"`
	Industry    string `json:"industry"`
	Description string `json:"description"`
	IsActive    bool   `json:"isActive"`
}

type Student struct {
	ID        int     `json:"id"`
	UserID    int     `json:"userId"`
	StudentID string  `json:"studentId"`
	Major     string  `json:"major"`
	Year      int     `json:"year"`
	GPA       float64 `json:"gpa"`
	Status    string  `json:"status"`
}

type Internship struct {
	ID          int    `json:"id"`
	StudentID   int    `json:"studentId"`
	CompanyID   int    `json:"companyId"`
	Position    string `json:"position"`
	StartDate   string `json:"startDate"`
	EndDate     string `json:"endDate"`
	Status      string `json:"status"`
	Description string `json:"description"`
}

type DemoData struct {
	Users       []User       `json:"users"`
	Companies   []Company    `json:"companies"`
	Students    []Student    `json:"students"`
	Internships []Internship `json:"internships"`
}

var demoData DemoData

func main() {
	// Load demo data
	loadDemoData()

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

	// CORS middleware - Allow all origins for demo
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization, X-Request-ID",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS, HEAD",
		AllowCredentials: false, // Set to false when using AllowOrigins: "*"
	}))

	// Basic health check endpoint
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"status":  "ok",
			"message": "🎬 Demo Server is running with real data",
			"version": "1.0.0-demo",
			"time":    time.Now().Format("2006-01-02 15:04:05"),
			"data": fiber.Map{
				"users":       len(demoData.Users),
				"companies":   len(demoData.Companies),
				"students":    len(demoData.Students),
				"internships": len(demoData.Internships),
			},
		})
	})

	// API v1 routes
	api := app.Group("/api/v1")

	// Test endpoint
	api.Get("/test", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "🎬 Demo API is working with real data",
			"version": "1.0.0-demo",
			"backend": "Go Fiber with JSON data",
			"features": []string{
				"User Management",
				"Company Management",
				"Student Management",
				"Internship Management",
				"Real Demo Data",
				"Thai Language Support",
			},
			"data_summary": fiber.Map{
				"users":       len(demoData.Users),
				"companies":   len(demoData.Companies),
				"students":    len(demoData.Students),
				"internships": len(demoData.Internships),
			},
		})
	})

	// Authentication endpoints
	api.Post("/login", handleLogin)
	api.Post("/auth/student-login", handleStudentLogin)
	api.Post("/auth/staff-login", handleStaffLogin)
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
	api.Get("/dashboard/admin", getAdminDashboard)
	api.Get("/dashboard/instructor/:id", getInstructorDashboard)

	// Start server
	port := "8080"
	log.Printf("🎬 Demo server starting on port %s", port)
	log.Printf("🌐 Health check: http://localhost:%s/health", port)
	log.Printf("🔗 API test: http://localhost:%s/api/v1/test", port)
	log.Printf("📊 Frontend: http://localhost:3000")
	log.Printf("👥 Demo accounts loaded: %d users", len(demoData.Users))

	if err := app.Listen(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func loadDemoData() {
	data, err := ioutil.ReadFile("demo_data.json")
	if err != nil {
		log.Fatal("Failed to read demo data:", err)
	}

	if err := json.Unmarshal(data, &demoData); err != nil {
		log.Fatal("Failed to parse demo data:", err)
	}

	log.Printf("📊 Demo data loaded: %d users, %d companies, %d students, %d internships",
		len(demoData.Users), len(demoData.Companies), len(demoData.Students), len(demoData.Internships))
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

	// Find user by email
	for _, user := range demoData.Users {
		if user.Email == req.Email && user.IsActive {
			// In demo, accept any password
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
				"token": "demo-jwt-token-" + strconv.Itoa(user.ID),
			})
		}
	}

	return c.Status(401).JSON(fiber.Map{
		"error":   "Invalid email or password",
		"success": false,
	})
}

func handleStudentLogin(c *fiber.Ctx) error {
	var req struct {
		StudentID string `json:"studentId"`
		Password  string `json:"password"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   "Invalid request body",
			"success": false,
		})
	}

	// Find user by student ID
	for _, user := range demoData.Users {
		if user.StudentID == req.StudentID && user.IsActive {
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
				"token": "demo-jwt-token-student-" + strconv.Itoa(user.ID),
			})
		}
	}

	return c.Status(401).JSON(fiber.Map{
		"error":   "Invalid student ID or password",
		"success": false,
	})
}

func handleStaffLogin(c *fiber.Ctx) error {
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

	// Find staff/instructor/admin by email
	for _, user := range demoData.Users {
		if user.Email == req.Email && user.IsActive && 
		   (user.Role == "staff" || user.Role == "instructor" || user.Role == "admin") {
			return c.JSON(fiber.Map{
				"success": true,
				"message": "Staff login successful",
				"user": fiber.Map{
					"id":         user.ID,
					"email":      user.Email,
					"first_name": user.FirstName,
					"last_name":  user.LastName,
					"role":       user.Role,
				},
				"token": "demo-jwt-token-staff-" + strconv.Itoa(user.ID),
			})
		}
	}

	return c.Status(401).JSON(fiber.Map{
		"error":   "Invalid email or password",
		"success": false,
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
	// Remove passwords from response
	var users []fiber.Map
	for _, user := range demoData.Users {
		if user.IsActive {
			users = append(users, fiber.Map{
				"id":         user.ID,
				"email":      user.Email,
				"first_name": user.FirstName,
				"last_name":  user.LastName,
				"role":       user.Role,
				"student_id": user.StudentID,
				"is_active":  user.IsActive,
			})
		}
	}

	return c.JSON(fiber.Map{
		"success": true,
		"users":   users,
		"total":   len(users),
	})
}

func getUser(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   "Invalid user ID",
			"success": false,
		})
	}

	for _, user := range demoData.Users {
		if user.ID == id && user.IsActive {
			return c.JSON(fiber.Map{
				"success": true,
				"user": fiber.Map{
					"id":         user.ID,
					"email":      user.Email,
					"first_name": user.FirstName,
					"last_name":  user.LastName,
					"role":       user.Role,
					"student_id": user.StudentID,
					"is_active":  user.IsActive,
				},
			})
		}
	}

	return c.Status(404).JSON(fiber.Map{
		"error":   "User not found",
		"success": false,
	})
}

// Student handlers
func getStudents(c *fiber.Ctx) error {
	var students []fiber.Map
	for _, student := range demoData.Students {
		// Find user data
		var user User
		for _, u := range demoData.Users {
			if u.ID == student.UserID {
				user = u
				break
			}
		}

		students = append(students, fiber.Map{
			"id":         student.ID,
			"user_id":    student.UserID,
			"student_id": student.StudentID,
			"major":      student.Major,
			"year":       student.Year,
			"gpa":        student.GPA,
			"status":     student.Status,
			"user": fiber.Map{
				"id":         user.ID,
				"email":      user.Email,
				"first_name": user.FirstName,
				"last_name":  user.LastName,
				"role":       user.Role,
			},
		})
	}

	return c.JSON(fiber.Map{
		"success":  true,
		"students": students,
		"total":    len(students),
	})
}

func getStudent(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   "Invalid student ID",
			"success": false,
		})
	}

	for _, student := range demoData.Students {
		if student.ID == id {
			// Find user data
			var user User
			for _, u := range demoData.Users {
				if u.ID == student.UserID {
					user = u
					break
				}
			}

			return c.JSON(fiber.Map{
				"success": true,
				"student": fiber.Map{
					"id":         student.ID,
					"user_id":    student.UserID,
					"student_id": student.StudentID,
					"major":      student.Major,
					"year":       student.Year,
					"gpa":        student.GPA,
					"status":     student.Status,
					"user": fiber.Map{
						"id":         user.ID,
						"email":      user.Email,
						"first_name": user.FirstName,
						"last_name":  user.LastName,
						"role":       user.Role,
					},
				},
			})
		}
	}

	return c.Status(404).JSON(fiber.Map{
		"error":   "Student not found",
		"success": false,
	})
}

// Company handlers
func getCompanies(c *fiber.Ctx) error {
	var companies []Company
	for _, company := range demoData.Companies {
		if company.IsActive {
			companies = append(companies, company)
		}
	}

	return c.JSON(fiber.Map{
		"success":   true,
		"companies": companies,
		"total":     len(companies),
	})
}

func getCompany(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   "Invalid company ID",
			"success": false,
		})
	}

	for _, company := range demoData.Companies {
		if company.ID == id && company.IsActive {
			return c.JSON(fiber.Map{
				"success": true,
				"company": company,
			})
		}
	}

	return c.Status(404).JSON(fiber.Map{
		"error":   "Company not found",
		"success": false,
	})
}

// Internship handlers
func getInternships(c *fiber.Ctx) error {
	var internships []fiber.Map
	for _, internship := range demoData.Internships {
		// Find student and company data
		var student Student
		var company Company
		
		for _, s := range demoData.Students {
			if s.ID == internship.StudentID {
				student = s
				break
			}
		}
		
		for _, co := range demoData.Companies {
			if co.ID == internship.CompanyID {
				company = co
				break
			}
		}

		// Find user data for student
		var user User
		for _, u := range demoData.Users {
			if u.ID == student.UserID {
				user = u
				break
			}
		}

		internships = append(internships, fiber.Map{
			"id":          internship.ID,
			"student_id":  internship.StudentID,
			"company_id":  internship.CompanyID,
			"position":    internship.Position,
			"start_date":  internship.StartDate,
			"end_date":    internship.EndDate,
			"status":      internship.Status,
			"description": internship.Description,
			"student": fiber.Map{
				"id":         student.ID,
				"student_id": student.StudentID,
				"major":      student.Major,
				"year":       student.Year,
				"gpa":        student.GPA,
				"user": fiber.Map{
					"first_name": user.FirstName,
					"last_name":  user.LastName,
				},
			},
			"company": fiber.Map{
				"id":       company.ID,
				"name":     company.Name,
				"name_th":  company.NameTH,
				"industry": company.Industry,
			},
		})
	}

	return c.JSON(fiber.Map{
		"success":     true,
		"internships": internships,
		"total":       len(internships),
	})
}

func getInternship(c *fiber.Ctx) error {
	id, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   "Invalid internship ID",
			"success": false,
		})
	}

	for _, internship := range demoData.Internships {
		if internship.ID == id {
			// Find student and company data (similar to getInternships)
			// ... (implementation similar to above)
			
			return c.JSON(fiber.Map{
				"success":    true,
				"internship": internship,
			})
		}
	}

	return c.Status(404).JSON(fiber.Map{
		"error":   "Internship not found",
		"success": false,
	})
}

func createInternship(c *fiber.Ctx) error {
	return c.Status(501).JSON(fiber.Map{
		"error":   "Create internship not implemented in demo",
		"success": false,
		"message": "Demo data is read-only",
	})
}

func updateInternship(c *fiber.Ctx) error {
	return c.Status(501).JSON(fiber.Map{
		"error":   "Update internship not implemented in demo",
		"success": false,
		"message": "Demo data is read-only",
	})
}

// Dashboard handlers
func getDashboardStats(c *fiber.Ctx) error {
	pendingCount := 0
	activeCount := 0
	
	for _, internship := range demoData.Internships {
		if internship.Status == "pending" {
			pendingCount++
		} else if internship.Status == "approved" || internship.Status == "in_progress" {
			activeCount++
		}
	}

	return c.JSON(fiber.Map{
		"success": true,
		"stats": fiber.Map{
			"total_users":         len(demoData.Users),
			"total_students":      len(demoData.Students),
			"total_companies":     len(demoData.Companies),
			"total_internships":   len(demoData.Internships),
			"pending_approvals":   pendingCount,
			"active_internships":  activeCount,
		},
	})
}

func getStudentDashboard(c *fiber.Ctx) error {
	studentID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   "Invalid student ID",
			"success": false,
		})
	}

	// Find student
	var student Student
	var found bool
	for _, s := range demoData.Students {
		if s.ID == studentID {
			student = s
			found = true
			break
		}
	}

	if !found {
		return c.Status(404).JSON(fiber.Map{
			"error":   "Student not found",
			"success": false,
		})
	}

	// Find student's internships
	var internships []Internship
	for _, internship := range demoData.Internships {
		if internship.StudentID == studentID {
			internships = append(internships, internship)
		}
	}

	// Count by status
	pendingCount := 0
	approvedCount := 0
	activeCount := 0
	
	for _, internship := range internships {
		switch internship.Status {
		case "pending":
			pendingCount++
		case "approved":
			approvedCount++
		case "in_progress":
			activeCount++
		}
	}

	return c.JSON(fiber.Map{
		"success": true,
		"student": student,
		"internships": internships,
		"stats": fiber.Map{
			"total_applications":   len(internships),
			"pending_applications": pendingCount,
			"approved_applications": approvedCount,
			"active_internships":   activeCount,
		},
	})
}

func getAdminDashboard(c *fiber.Ctx) error {
	// Calculate various statistics
	stats := make(map[string]interface{})
	
	// User statistics
	usersByRole := make(map[string]int)
	for _, user := range demoData.Users {
		if user.IsActive {
			usersByRole[user.Role]++
		}
	}
	
	// Internship statistics
	internshipsByStatus := make(map[string]int)
	for _, internship := range demoData.Internships {
		internshipsByStatus[internship.Status]++
	}
	
	// Company statistics
	companiesByIndustry := make(map[string]int)
	for _, company := range demoData.Companies {
		if company.IsActive {
			companiesByIndustry[company.Industry]++
		}
	}

	stats["users_by_role"] = usersByRole
	stats["internships_by_status"] = internshipsByStatus
	stats["companies_by_industry"] = companiesByIndustry
	stats["total_users"] = len(demoData.Users)
	stats["total_students"] = len(demoData.Students)
	stats["total_companies"] = len(demoData.Companies)
	stats["total_internships"] = len(demoData.Internships)

	return c.JSON(fiber.Map{
		"success": true,
		"stats":   stats,
	})
}

func getInstructorDashboard(c *fiber.Ctx) error {
	instructorID, err := strconv.Atoi(c.Params("id"))
	if err != nil {
		return c.Status(400).JSON(fiber.Map{
			"error":   "Invalid instructor ID",
			"success": false,
		})
	}

	// Find instructor
	var instructor User
	var found bool
	for _, user := range demoData.Users {
		if user.ID == instructorID && (user.Role == "instructor" || user.Role == "admin") {
			instructor = user
			found = true
			break
		}
	}

	if !found {
		return c.Status(404).JSON(fiber.Map{
			"error":   "Instructor not found",
			"success": false,
		})
	}

	// For demo, show all internships that need supervision
	var supervisedInternships []Internship
	for _, internship := range demoData.Internships {
		if internship.Status == "approved" || internship.Status == "in_progress" {
			supervisedInternships = append(supervisedInternships, internship)
		}
	}

	return c.JSON(fiber.Map{
		"success": true,
		"instructor": fiber.Map{
			"id":         instructor.ID,
			"first_name": instructor.FirstName,
			"last_name":  instructor.LastName,
			"role":       instructor.Role,
		},
		"supervised_internships": supervisedInternships,
		"stats": fiber.Map{
			"total_supervised": len(supervisedInternships),
			"pending_visits":   2, // Mock data
			"completed_visits": 3, // Mock data
		},
	})
}