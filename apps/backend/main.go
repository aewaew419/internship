package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	_ "github.com/lib/pq"
)

type Database struct {
	*sql.DB
}

type User struct {
	ID        int    `json:"id"`
	UUID      string `json:"uuid"`
	Email     string `json:"email"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Role      string `json:"role"`
	StudentID string `json:"student_id,omitempty"`
	IsActive  bool   `json:"is_active"`
	CreatedAt string `json:"created_at"`
}

type Student struct {
	ID        int     `json:"id"`
	UUID      string  `json:"uuid"`
	UserID    int     `json:"user_id"`
	StudentID string  `json:"student_id"`
	Major     string  `json:"major"`
	Year      int     `json:"year"`
	GPA       float64 `json:"gpa"`
	Status    string  `json:"status"`
	User      *User   `json:"user,omitempty"`
}

type Company struct {
	ID          int    `json:"id"`
	UUID        string `json:"uuid"`
	Name        string `json:"name"`
	NameTh      string `json:"name_th"`
	Address     string `json:"address"`
	Phone       string `json:"phone"`
	Email       string `json:"email"`
	Website     string `json:"website"`
	Industry    string `json:"industry"`
	Description string `json:"description"`
	IsActive    bool   `json:"is_active"`
}

type Internship struct {
	ID          int      `json:"id"`
	UUID        string   `json:"uuid"`
	StudentID   int      `json:"student_id"`
	CompanyID   int      `json:"company_id"`
	Position    string   `json:"position"`
	StartDate   string   `json:"start_date"`
	EndDate     string   `json:"end_date"`
	Status      string   `json:"status"`
	Description string   `json:"description"`
	Student     *Student `json:"student,omitempty"`
	Company     *Company `json:"company,omitempty"`
}

type Response struct {
	Success   bool        `json:"success"`
	Message   string      `json:"message"`
	Data      interface{} `json:"data,omitempty"`
	Timestamp time.Time   `json:"timestamp"`
}

var db *Database

func initDB() {
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbName := os.Getenv("DB_NAME")
	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")

	if dbHost == "" {
		dbHost = "localhost"
	}
	if dbPort == "" {
		dbPort = "5432"
	}

	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbPort, dbUser, dbPassword, dbName)

	var err error
	sqlDB, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Test connection
	if err = sqlDB.Ping(); err != nil {
		log.Fatal("Failed to ping database:", err)
	}

	db = &Database{sqlDB}
	log.Printf("✅ Connected to PostgreSQL database: %s@%s:%s/%s", dbUser, dbHost, dbPort, dbName)
}

func enableCORS(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
}

func sendResponse(w http.ResponseWriter, success bool, message string, data interface{}) {
	enableCORS(w)
	w.Header().Set("Content-Type", "application/json")

	response := Response{
		Success:   success,
		Message:   message,
		Data:      data,
		Timestamp: time.Now(),
	}

	if !success {
		w.WriteHeader(http.StatusBadRequest)
	}

	json.NewEncoder(w).Encode(response)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)
	
	// Test database connection
	err := db.Ping()
	if err != nil {
		sendResponse(w, false, "Database connection failed", nil)
		return
	}

	sendResponse(w, true, "Internship Management System API is healthy", map[string]string{
		"database": "connected",
		"status":   "running",
	})
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)

	if r.Method == "OPTIONS" {
		return
	}

	if r.Method != "POST" {
		sendResponse(w, false, "Method not allowed", nil)
		return
	}

	var loginData struct {
		StudentID string `json:"student_id"`
		Password  string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&loginData); err != nil {
		sendResponse(w, false, "Invalid JSON format", nil)
		return
	}

	// Query user from database
	var user User
	var hashedPassword string
	query := `
		SELECT id, uuid, email, password, first_name, last_name, role, student_id, is_active, created_at
		FROM users 
		WHERE student_id = $1 AND is_active = true
	`

	err := db.QueryRow(query, loginData.StudentID).Scan(
		&user.ID, &user.UUID, &user.Email, &hashedPassword,
		&user.FirstName, &user.LastName, &user.Role,
		&user.StudentID, &user.IsActive, &user.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			sendResponse(w, false, "รหัสนักศึกษาหรือรหัสผ่านไม่ถูกต้อง", nil)
		} else {
			log.Printf("Database error: %v", err)
			sendResponse(w, false, "เกิดข้อผิดพลาดในระบบ", nil)
		}
		return
	}

	// For demo purposes, accept simple password
	if loginData.Password != "password123" {
		sendResponse(w, false, "รหัสนักศึกษาหรือรหัสผ่านไม่ถูกต้อง", nil)
		return
	}

	sendResponse(w, true, "เข้าสู่ระบบสำเร็จ", map[string]interface{}{
		"user":  user,
		"token": fmt.Sprintf("demo_token_%s", user.StudentID),
	})
}

func studentsHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)

	query := `
		SELECT s.id, s.uuid, s.user_id, s.student_id, s.major, s.year, s.gpa, s.status,
		       u.id, u.uuid, u.email, u.first_name, u.last_name, u.role, u.student_id, u.is_active, u.created_at
		FROM students s
		JOIN users u ON s.user_id = u.id
		WHERE s.status = 'active'
		ORDER BY s.student_id
	`

	rows, err := db.Query(query)
	if err != nil {
		log.Printf("Database error: %v", err)
		sendResponse(w, false, "เกิดข้อผิดพลาดในการดึงข้อมูล", nil)
		return
	}
	defer rows.Close()

	var students []Student
	for rows.Next() {
		var student Student
		var user User

		err := rows.Scan(
			&student.ID, &student.UUID, &student.UserID, &student.StudentID,
			&student.Major, &student.Year, &student.GPA, &student.Status,
			&user.ID, &user.UUID, &user.Email, &user.FirstName,
			&user.LastName, &user.Role, &user.StudentID, &user.IsActive, &user.CreatedAt,
		)
		if err != nil {
			log.Printf("Scan error: %v", err)
			continue
		}

		student.User = &user
		students = append(students, student)
	}

	sendResponse(w, true, "ดึงข้อมูลนักศึกษาสำเร็จ", students)
}

func companiesHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)

	query := `
		SELECT id, uuid, name, name_th, address, phone, email, website, industry, description, is_active
		FROM companies
		WHERE is_active = true
		ORDER BY name
	`

	rows, err := db.Query(query)
	if err != nil {
		log.Printf("Database error: %v", err)
		sendResponse(w, false, "เกิดข้อผิดพลาดในการดึงข้อมูล", nil)
		return
	}
	defer rows.Close()

	var companies []Company
	for rows.Next() {
		var company Company
		err := rows.Scan(
			&company.ID, &company.UUID, &company.Name, &company.NameTh,
			&company.Address, &company.Phone, &company.Email, &company.Website,
			&company.Industry, &company.Description, &company.IsActive,
		)
		if err != nil {
			log.Printf("Scan error: %v", err)
			continue
		}
		companies = append(companies, company)
	}

	sendResponse(w, true, "ดึงข้อมูลบริษัทสำเร็จ", companies)
}

func internshipsHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w)

	query := `
		SELECT i.id, i.uuid, i.student_id, i.company_id, i.position, 
		       i.start_date, i.end_date, i.status, i.description,
		       s.id, s.uuid, s.student_id, s.major, s.year, s.gpa,
		       u.first_name, u.last_name,
		       c.id, c.uuid, c.name, c.name_th, c.industry
		FROM internships i
		JOIN students s ON i.student_id = s.id
		JOIN users u ON s.user_id = u.id
		JOIN companies c ON i.company_id = c.id
		ORDER BY i.created_at DESC
	`

	rows, err := db.Query(query)
	if err != nil {
		log.Printf("Database error: %v", err)
		sendResponse(w, false, "เกิดข้อผิดพลาดในการดึงข้อมูล", nil)
		return
	}
	defer rows.Close()

	var internships []Internship
	for rows.Next() {
		var internship Internship
		var student Student
		var user User
		var company Company

		err := rows.Scan(
			&internship.ID, &internship.UUID, &internship.StudentID, &internship.CompanyID,
			&internship.Position, &internship.StartDate, &internship.EndDate,
			&internship.Status, &internship.Description,
			&student.ID, &student.UUID, &student.StudentID, &student.Major,
			&student.Year, &student.GPA, &user.FirstName, &user.LastName,
			&company.ID, &company.UUID, &company.Name, &company.NameTh, &company.Industry,
		)
		if err != nil {
			log.Printf("Scan error: %v", err)
			continue
		}

		user.FirstName = user.FirstName
		user.LastName = user.LastName
		student.User = &user
		internship.Student = &student
		internship.Company = &company

		internships = append(internships, internship)
	}

	sendResponse(w, true, "ดึงข้อมูลการฝึกงานสำเร็จ", internships)
}

func main() {
	// Initialize database
	initDB()
	defer db.Close()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Routes
	http.HandleFunc("/health", healthHandler)
	http.HandleFunc("/api/v1/login", loginHandler)
	http.HandleFunc("/api/v1/students", studentsHandler)
	http.HandleFunc("/api/v1/companies", companiesHandler)
	http.HandleFunc("/api/v1/internships", internshipsHandler)

	fmt.Printf("🚀 Backend server starting on port %s\n", port)
	fmt.Println("📊 Available endpoints:")
	fmt.Println("   GET  /health")
	fmt.Println("   POST /api/v1/login")
	fmt.Println("   GET  /api/v1/students")
	fmt.Println("   GET  /api/v1/companies")
	fmt.Println("   GET  /api/v1/internships")
	fmt.Printf("🗄️ Database: Connected to PostgreSQL\n")

	log.Fatal(http.ListenAndServe(":"+port, nil))
}