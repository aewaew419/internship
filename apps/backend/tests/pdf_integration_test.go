package tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"

	"backend-go/internal/config"
	"backend-go/internal/database"
	"backend-go/internal/models"
	"backend-go/internal/routes"
	"backend-go/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	"gorm.io/gorm"
)

type PDFIntegrationTestSuite struct {
	suite.Suite
	app        *fiber.App
	db         *gorm.DB
	cfg        *config.Config
	authToken  string
	testUser   models.User
	testStudent models.Student
	testCompany models.Company
	testTraining models.StudentTraining
}

func (suite *PDFIntegrationTestSuite) SetupSuite() {
	// Load test configuration
	suite.cfg = config.Load()

	// Setup test database
	db, err := database.Connect(suite.cfg.DatabaseURL)
	suite.Require().NoError(err)
	suite.db = db

	// Auto migrate tables
	err = database.AutoMigrate(db)
	suite.Require().NoError(err)

	// Create Fiber app
	suite.app = fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		},
	})

	// Setup routes
	routes.Setup(suite.app, db, suite.cfg)

	// Create test data
	suite.createTestData()

	// Create uploads/pdf directory
	err = os.MkdirAll("uploads/pdf", 0755)
	suite.Require().NoError(err)
}

func (suite *PDFIntegrationTestSuite) TearDownSuite() {
	// Clean up test data
	suite.cleanupTestData()

	// Clean up PDF files
	os.RemoveAll("uploads/pdf")

	// Close database connection
	sqlDB, _ := suite.db.DB()
	sqlDB.Close()
}

func (suite *PDFIntegrationTestSuite) createTestData() {
	// Create test role
	role := models.Role{
		Name: "admin",
	}
	suite.db.Create(&role)

	// Create test user
	suite.testUser = models.User{
		FullName: stringPtr("Test Admin"),
		Email:    "admin@test.com",
		Password: "password123",
		RoleID:   role.ID,
	}
	suite.db.Create(&suite.testUser)

	// Create test campus
	campus := models.Campus{
		CampusNameEN: "Test Campus",
		CampusNameTH: "วิทยาเขตทดสอบ",
	}
	suite.db.Create(&campus)

	// Create test faculty
	faculty := models.Faculty{
		FacultyNameEN: "Faculty of Information Technology",
		FacultyNameTH: "คณะเทคโนโลยีสารสนเทศ",
		CampusID:      campus.ID,
	}
	suite.db.Create(&faculty)

	// Create test program
	program := models.Program{
		ProgramNameEN: "Bachelor of Science",
		ProgramNameTH: "วิทยาศาสตรบัณฑิต",
		FacultyID:     faculty.ID,
	}
	suite.db.Create(&program)

	// Create test curriculum
	curriculum := models.Curriculum{
		CurriculumNameEN: "IT Curriculum 2023",
		CurriculumNameTH: "หลักสูตร IT 2566",
		ProgramID:        program.ID,
	}
	suite.db.Create(&curriculum)

	// Create test major
	major := models.Major{
		MajorNameEN:  "Information Technology",
		MajorNameTH:  "เทคโนโลยีสารสนเทศ",
		CurriculumID: curriculum.ID,
	}
	suite.db.Create(&major)

	// Create test student user
	studentUser := models.User{
		FullName: stringPtr("Test Student"),
		Email:    "student@test.com",
		Password: "password123",
		RoleID:   role.ID,
	}
	suite.db.Create(&studentUser)

	// Create test student
	suite.testStudent = models.Student{
		UserID:       studentUser.ID,
		Name:         "Test",
		Surname:      "Student",
		StudentID:    "65130001",
		GPAX:         3.50,
		Email:        "student@test.com",
		MajorID:      &major.ID,
		ProgramID:    &program.ID,
		CurriculumID: &curriculum.ID,
		FacultyID:    &faculty.ID,
		CampusID:     campus.ID,
	}
	suite.db.Create(&suite.testStudent)

	// Create test company
	suite.testCompany = models.Company{
		CompanyRegisterNumber: "1234567890",
		CompanyNameEn:         "Test Company Ltd.",
		CompanyNameTh:         "บริษัท ทดสอบ จำกัด",
		CompanyAddress:        "123 Test Street, Bangkok",
		CompanyEmail:          "contact@testcompany.com",
		CompanyPhoneNumber:    "02-123-4567",
		CompanyType:          "Technology",
	}
	suite.db.Create(&suite.testCompany)

	// Create test course
	course := models.Course{
		CurriculumID: curriculum.ID,
		Code:         "IT499",
		Name:         "Cooperative Education",
		Credits:      6,
		Description:  "Cooperative Education Program",
	}
	suite.db.Create(&course)

	courseSection := models.CourseSection{
		CourseID:    course.ID,
		Section:     "1",
		Semester:    "1",
		Year:        2024,
		MaxStudents: 30,
	}
	suite.db.Create(&courseSection)

	// Create test student enrollment
	studentEnroll := models.StudentEnroll{
		StudentID:       suite.testStudent.ID,
		CourseSectionID: courseSection.ID,
		EnrollDate:      time.Now(),
	}
	suite.db.Create(&studentEnroll)

	// Create test student training
	suite.testTraining = models.StudentTraining{
		StudentEnrollID:        studentEnroll.ID,
		StartDate:              time.Now().AddDate(0, 0, 7),
		EndDate:                time.Now().AddDate(0, 4, 7),
		Coordinator:            "John Coordinator",
		CoordinatorPhoneNumber: "02-111-2222",
		CoordinatorEmail:       "coordinator@testcompany.com",
		Supervisor:             "Jane Supervisor",
		SupervisorPhoneNumber:  "02-333-4444",
		SupervisorEmail:        "supervisor@testcompany.com",
		Department:             "IT Department",
		Position:               "Software Developer Intern",
		JobDescription:         "Develop and maintain web applications",
		DocumentLanguage:       models.DocumentLanguageTH,
		CompanyID:              &suite.testCompany.ID,
	}
	suite.db.Create(&suite.testTraining)

	// Generate auth token
	jwtService := services.NewJWTService(suite.cfg.JWTSecret)
	token, err := jwtService.GenerateToken(suite.testUser.ID, suite.testUser.Email, suite.testUser.RoleID)
	suite.Require().NoError(err)
	suite.authToken = token
}

func (suite *PDFIntegrationTestSuite) cleanupTestData() {
	// Delete in reverse order of creation
	suite.db.Unscoped().Delete(&suite.testTraining)
	suite.db.Unscoped().Where("student_id = ?", suite.testStudent.ID).Delete(&models.StudentEnroll{})
	suite.db.Unscoped().Where("code = ?", "IT499").Delete(&models.CourseSection{})
	suite.db.Unscoped().Where("code = ?", "IT499").Delete(&models.Course{})
	suite.db.Unscoped().Delete(&suite.testCompany)
	suite.db.Unscoped().Delete(&suite.testStudent)
	suite.db.Unscoped().Where("email IN ?", []string{"admin@test.com", "student@test.com"}).Delete(&models.User{})
	suite.db.Unscoped().Where("curriculum_name_en = ?", "IT Curriculum 2023").Delete(&models.Curriculum{})
	suite.db.Unscoped().Where("program_name_en = ?", "Bachelor of Science").Delete(&models.Program{})
	suite.db.Unscoped().Where("major_name_en = ?", "Information Technology").Delete(&models.Major{})
	suite.db.Unscoped().Where("faculty_name_en = ?", "Faculty of Information Technology").Delete(&models.Faculty{})
	suite.db.Unscoped().Where("campus_name_en = ?", "Test Campus").Delete(&models.Campus{})
	suite.db.Unscoped().Where("name = ?", "admin").Delete(&models.Role{})
}

func (suite *PDFIntegrationTestSuite) TestGenerateStudentListReport() {
	// Prepare request body
	requestBody := map[string]interface{}{
		"report_type": "student_list",
		"title":       "Student List Report",
		"student_ids": []uint{suite.testStudent.ID},
	}

	body, err := json.Marshal(requestBody)
	suite.Require().NoError(err)

	// Create request
	req := httptest.NewRequest("POST", "/api/v1/pdf/reports", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+suite.authToken)

	// Execute request
	resp, err := suite.app.Test(req, -1)
	suite.Require().NoError(err)

	// Assert response
	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)

	// Parse response
	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	suite.Require().NoError(err)

	// Check response structure
	assert.Contains(suite.T(), response, "message")
	assert.Contains(suite.T(), response, "filename")
	assert.Contains(suite.T(), response, "download_url")

	// Check if file was created
	filename := response["filename"].(string)
	filePath := filepath.Join("uploads/pdf", filename)
	_, err = os.Stat(filePath)
	assert.NoError(suite.T(), err, "PDF file should be created")

	// Clean up
	os.Remove(filePath)
}

func (suite *PDFIntegrationTestSuite) TestGenerateInternshipSummaryReport() {
	// Prepare request body
	requestBody := map[string]interface{}{
		"report_type":  "internship_summary",
		"title":        "Internship Summary Report",
		"training_ids": []uint{suite.testTraining.ID},
	}

	body, err := json.Marshal(requestBody)
	suite.Require().NoError(err)

	// Create request
	req := httptest.NewRequest("POST", "/api/v1/pdf/reports", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+suite.authToken)

	// Execute request
	resp, err := suite.app.Test(req, -1)
	suite.Require().NoError(err)

	// Assert response
	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)

	// Parse response
	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	suite.Require().NoError(err)

	// Check response structure
	assert.Contains(suite.T(), response, "message")
	assert.Contains(suite.T(), response, "filename")

	// Check if file was created
	filename := response["filename"].(string)
	filePath := filepath.Join("uploads/pdf", filename)
	_, err = os.Stat(filePath)
	assert.NoError(suite.T(), err, "PDF file should be created")

	// Clean up
	os.Remove(filePath)
}

func (suite *PDFIntegrationTestSuite) TestGenerateCoopRequestLetter() {
	// Prepare request body
	requestBody := map[string]interface{}{
		"letter_type": "coop_request",
		"student_id":  suite.testStudent.ID,
		"training_id": suite.testTraining.ID,
		"recipient":   "HR Manager",
		"language":    "th",
	}

	body, err := json.Marshal(requestBody)
	suite.Require().NoError(err)

	// Create request
	req := httptest.NewRequest("POST", "/api/v1/pdf/letters", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+suite.authToken)

	// Execute request
	resp, err := suite.app.Test(req, -1)
	suite.Require().NoError(err)

	// Assert response
	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)

	// Parse response
	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	suite.Require().NoError(err)

	// Check response structure
	assert.Contains(suite.T(), response, "message")
	assert.Contains(suite.T(), response, "filename")

	// Check if file was created
	filename := response["filename"].(string)
	filePath := filepath.Join("uploads/pdf", filename)
	_, err = os.Stat(filePath)
	assert.NoError(suite.T(), err, "PDF file should be created")

	// Clean up
	os.Remove(filePath)
}

func (suite *PDFIntegrationTestSuite) TestGenerateReferralLetter() {
	// Prepare request body
	requestBody := map[string]interface{}{
		"letter_type": "referral",
		"student_id":  suite.testStudent.ID,
		"training_id": suite.testTraining.ID,
		"recipient":   "Company Manager",
		"language":    "en",
	}

	body, err := json.Marshal(requestBody)
	suite.Require().NoError(err)

	// Create request
	req := httptest.NewRequest("POST", "/api/v1/pdf/letters", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+suite.authToken)

	// Execute request
	resp, err := suite.app.Test(req, -1)
	suite.Require().NoError(err)

	// Assert response
	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)

	// Parse response
	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	suite.Require().NoError(err)

	// Check response structure
	assert.Contains(suite.T(), response, "message")
	assert.Contains(suite.T(), response, "filename")

	// Check if file was created
	filename := response["filename"].(string)
	filePath := filepath.Join("uploads/pdf", filename)
	_, err = os.Stat(filePath)
	assert.NoError(suite.T(), err, "PDF file should be created")

	// Clean up
	os.Remove(filePath)
}

func (suite *PDFIntegrationTestSuite) TestListPDFs() {
	// Create a test PDF file
	testFilename := "test_report.pdf"
	testFilePath := filepath.Join("uploads/pdf", testFilename)
	err := os.WriteFile(testFilePath, []byte("test pdf content"), 0644)
	suite.Require().NoError(err)

	// Create request
	req := httptest.NewRequest("GET", "/api/v1/pdf/list", nil)
	req.Header.Set("Authorization", "Bearer "+suite.authToken)

	// Execute request
	resp, err := suite.app.Test(req, -1)
	suite.Require().NoError(err)

	// Assert response
	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)

	// Parse response
	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	suite.Require().NoError(err)

	// Check response structure
	assert.Contains(suite.T(), response, "data")
	assert.Contains(suite.T(), response, "pagination")

	// Clean up
	os.Remove(testFilePath)
}

func (suite *PDFIntegrationTestSuite) TestDownloadPDF() {
	// Create a test PDF file
	testFilename := "test_download.pdf"
	testFilePath := filepath.Join("uploads/pdf", testFilename)
	testContent := []byte("test pdf content for download")
	err := os.WriteFile(testFilePath, testContent, 0644)
	suite.Require().NoError(err)

	// Create request
	req := httptest.NewRequest("GET", fmt.Sprintf("/api/v1/pdf/download/%s", testFilename), nil)
	req.Header.Set("Authorization", "Bearer "+suite.authToken)

	// Execute request
	resp, err := suite.app.Test(req, -1)
	suite.Require().NoError(err)

	// Assert response
	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)
	assert.Equal(suite.T(), "application/pdf", resp.Header.Get("Content-Type"))
	assert.Contains(suite.T(), resp.Header.Get("Content-Disposition"), testFilename)

	// Clean up
	os.Remove(testFilePath)
}

func (suite *PDFIntegrationTestSuite) TestDeletePDF() {
	// Create a test PDF file
	testFilename := "test_delete.pdf"
	testFilePath := filepath.Join("uploads/pdf", testFilename)
	err := os.WriteFile(testFilePath, []byte("test pdf content"), 0644)
	suite.Require().NoError(err)

	// Create request
	req := httptest.NewRequest("DELETE", fmt.Sprintf("/api/v1/pdf/%s", testFilename), nil)
	req.Header.Set("Authorization", "Bearer "+suite.authToken)

	// Execute request
	resp, err := suite.app.Test(req, -1)
	suite.Require().NoError(err)

	// Assert response
	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)

	// Check if file was deleted
	_, err = os.Stat(testFilePath)
	assert.True(suite.T(), os.IsNotExist(err), "PDF file should be deleted")
}

func (suite *PDFIntegrationTestSuite) TestUnauthorizedAccess() {
	// Test without authorization header
	req := httptest.NewRequest("GET", "/api/v1/pdf/list", nil)
	resp, err := suite.app.Test(req, -1)
	suite.Require().NoError(err)
	assert.Equal(suite.T(), http.StatusUnauthorized, resp.StatusCode)

	// Test with invalid token
	req = httptest.NewRequest("GET", "/api/v1/pdf/list", nil)
	req.Header.Set("Authorization", "Bearer invalid_token")
	resp, err = suite.app.Test(req, -1)
	suite.Require().NoError(err)
	assert.Equal(suite.T(), http.StatusUnauthorized, resp.StatusCode)
}

func TestPDFIntegrationTestSuite(t *testing.T) {
	suite.Run(t, new(PDFIntegrationTestSuite))
}

// Helper function
func stringPtr(s string) *string {
	return &s
}