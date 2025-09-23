package tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http/httptest"
	"testing"

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

type InstructorIntegrationTestSuite struct {
	suite.Suite
	app        *fiber.App
	db         *gorm.DB
	cfg        *config.Config
	jwtService *services.JWTService
	
	// Test data
	testUser       *models.User
	testRole       *models.Role
	testFaculty    *models.Faculty
	testProgram    *models.Program
	testInstructor *models.Instructor
	testCourse     *models.Course
	testSection    *models.CourseSection
	authToken      string
}

func (suite *InstructorIntegrationTestSuite) SetupSuite() {
	// Setup test configuration
	suite.cfg = &config.Config{
		JWTSecret:   "test-secret-key-for-instructor-tests",
		DatabaseURL: "root:password@tcp(localhost:3306)/internship_test?charset=utf8mb4&parseTime=True&loc=Local",
	}

	// Setup test database
	var err error
	suite.db, err = database.Connect(suite.cfg.DatabaseURL)
	suite.Require().NoError(err)

	// Auto migrate tables
	err = suite.db.AutoMigrate(
		&models.Role{},
		&models.User{},
		&models.Campus{},
		&models.Faculty{},
		&models.Program{},
		&models.Curriculum{},
		&models.Instructor{},
		&models.Course{},
		&models.CourseSection{},
		&models.CourseInstructor{},
		&models.Student{},
		&models.StudentEnroll{},
		&models.StudentEnrollStatus{},
		&models.StudentTraining{},
	)
	suite.Require().NoError(err)

	// Setup JWT service
	suite.jwtService = services.NewJWTService(suite.cfg.JWTSecret)

	// Setup Fiber app
	suite.app = fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		},
	})

	// Setup routes
	routes.Setup(suite.app, suite.db, suite.cfg)
}

func (suite *InstructorIntegrationTestSuite) SetupTest() {
	// Clean up database
	suite.db.Exec("DELETE FROM course_instructors")
	suite.db.Exec("DELETE FROM student_enroll_statuses")
	suite.db.Exec("DELETE FROM student_trainings")
	suite.db.Exec("DELETE FROM course_sections")
	suite.db.Exec("DELETE FROM courses")
	suite.db.Exec("DELETE FROM curriculums")
	suite.db.Exec("DELETE FROM instructors")
	suite.db.Exec("DELETE FROM students")
	suite.db.Exec("DELETE FROM programs")
	suite.db.Exec("DELETE FROM faculties")
	suite.db.Exec("DELETE FROM campuses")
	suite.db.Exec("DELETE FROM users")
	suite.db.Exec("DELETE FROM roles")

	// Create test role
	suite.testRole = &models.Role{
		Name: "instructor",
	}
	err := suite.db.Create(suite.testRole).Error
	suite.Require().NoError(err)

	// Create test user
	suite.testUser = &models.User{
		FullName: stringPtr("Test User"),
		Email:    "test@example.com",
		Password: "hashedpassword",
		RoleID:   suite.testRole.ID,
	}
	err = suite.db.Create(suite.testUser).Error
	suite.Require().NoError(err)

	// Create test campus
	testCampus := &models.Campus{
		CampusNameEN: "Test Campus",
		CampusNameTH: "วิทยาเขตทดสอบ",
	}
	err = suite.db.Create(testCampus).Error
	suite.Require().NoError(err)

	// Create test faculty
	suite.testFaculty = &models.Faculty{
		FacultyNameEN: "Test Faculty",
		FacultyNameTH: "คณะทดสอบ",
		CampusID:      testCampus.ID,
	}
	err = suite.db.Create(suite.testFaculty).Error
	suite.Require().NoError(err)

	// Create test program
	suite.testProgram = &models.Program{
		ProgramNameEN: "Test Program",
		ProgramNameTH: "หลักสูตรทดสอบ",
		FacultyID:     suite.testFaculty.ID,
	}
	err = suite.db.Create(suite.testProgram).Error
	suite.Require().NoError(err)

	// Create test curriculum
	testCurriculum := &models.Curriculum{
		CurriculumNameEN: "Test Curriculum",
		CurriculumNameTH: "หลักสูตรทดสอบ",
		ProgramID:        suite.testProgram.ID,
		Year:             2024,
	}
	err = suite.db.Create(testCurriculum).Error
	suite.Require().NoError(err)

	// Create test course
	suite.testCourse = &models.Course{
		CurriculumID: testCurriculum.ID,
		Code:         "TEST101",
		Name:         "Test Course",
		Description:  "Test Course Description",
		Credits:      3,
	}
	err = suite.db.Create(suite.testCourse).Error
	suite.Require().NoError(err)

	// Create test course section
	suite.testSection = &models.CourseSection{
		CourseID:    suite.testCourse.ID,
		Section:     "01",
		Semester:    "1",
		Year:        2024,
		MaxStudents: uintPtr(30),
	}
	err = suite.db.Create(suite.testSection).Error
	suite.Require().NoError(err)

	// Generate auth token
	suite.authToken, err = suite.jwtService.GenerateToken(suite.testUser.ID, suite.testUser.RoleID)
	suite.Require().NoError(err)
}

func (suite *InstructorIntegrationTestSuite) TearDownSuite() {
	// Clean up database
	suite.db.Exec("DELETE FROM course_instructors")
	suite.db.Exec("DELETE FROM student_enroll_statuses")
	suite.db.Exec("DELETE FROM student_trainings")
	suite.db.Exec("DELETE FROM course_sections")
	suite.db.Exec("DELETE FROM courses")
	suite.db.Exec("DELETE FROM curriculums")
	suite.db.Exec("DELETE FROM instructors")
	suite.db.Exec("DELETE FROM students")
	suite.db.Exec("DELETE FROM programs")
	suite.db.Exec("DELETE FROM faculties")
	suite.db.Exec("DELETE FROM campuses")
	suite.db.Exec("DELETE FROM users")
	suite.db.Exec("DELETE FROM roles")
}

func (suite *InstructorIntegrationTestSuite) TestCreateInstructor() {
	// Create another user for instructor
	user := &models.User{
		FullName: stringPtr("Instructor User"),
		Email:    "instructor@example.com",
		Password: "hashedpassword",
		RoleID:   suite.testRole.ID,
	}
	err := suite.db.Create(user).Error
	suite.Require().NoError(err)

	requestBody := map[string]interface{}{
		"user_id":     user.ID,
		"staff_id":    "STAFF001",
		"name":        "John",
		"middle_name": "Michael",
		"surname":     "Doe",
		"faculty_id":  suite.testFaculty.ID,
		"program_id":  suite.testProgram.ID,
	}

	body, _ := json.Marshal(requestBody)
	req := httptest.NewRequest("POST", "/api/v1/instructors", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+suite.authToken)

	resp, err := suite.app.Test(req)
	suite.Require().NoError(err)
	suite.Equal(201, resp.StatusCode)

	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	suite.Require().NoError(err)

	suite.Equal("Instructor created successfully", response["message"])
	suite.NotNil(response["data"])

	// Verify instructor was created in database
	var instructor models.Instructor
	err = suite.db.Where("staff_id = ?", "STAFF001").First(&instructor).Error
	suite.Require().NoError(err)
	suite.Equal("John", instructor.Name)
	suite.Equal("Doe", instructor.Surname)
}

func (suite *InstructorIntegrationTestSuite) TestGetInstructors() {
	// Create test instructor
	suite.createTestInstructor()

	req := httptest.NewRequest("GET", "/api/v1/instructors", nil)
	req.Header.Set("Authorization", "Bearer "+suite.authToken)

	resp, err := suite.app.Test(req)
	suite.Require().NoError(err)
	suite.Equal(200, resp.StatusCode)

	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	suite.Require().NoError(err)

	suite.Equal("Instructors retrieved successfully", response["message"])
	suite.NotNil(response["data"])

	data := response["data"].(map[string]interface{})
	suite.Equal(float64(1), data["total"])
	suite.NotEmpty(data["data"])
}

func (suite *InstructorIntegrationTestSuite) TestGetInstructor() {
	// Create test instructor
	suite.createTestInstructor()

	req := httptest.NewRequest("GET", fmt.Sprintf("/api/v1/instructors/%d", suite.testInstructor.ID), nil)
	req.Header.Set("Authorization", "Bearer "+suite.authToken)

	resp, err := suite.app.Test(req)
	suite.Require().NoError(err)
	suite.Equal(200, resp.StatusCode)

	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	suite.Require().NoError(err)

	suite.Equal("Instructor retrieved successfully", response["message"])
	suite.NotNil(response["data"])

	instructor := response["data"].(map[string]interface{})
	suite.Equal("STAFF001", instructor["staff_id"])
	suite.Equal("John", instructor["name"])
}

func (suite *InstructorIntegrationTestSuite) TestUpdateInstructor() {
	// Create test instructor
	suite.createTestInstructor()

	requestBody := map[string]interface{}{
		"name":    "Jane",
		"surname": "Smith",
	}

	body, _ := json.Marshal(requestBody)
	req := httptest.NewRequest("PUT", fmt.Sprintf("/api/v1/instructors/%d", suite.testInstructor.ID), bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+suite.authToken)

	resp, err := suite.app.Test(req)
	suite.Require().NoError(err)
	suite.Equal(200, resp.StatusCode)

	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	suite.Require().NoError(err)

	suite.Equal("Instructor updated successfully", response["message"])

	// Verify instructor was updated in database
	var instructor models.Instructor
	err = suite.db.First(&instructor, suite.testInstructor.ID).Error
	suite.Require().NoError(err)
	suite.Equal("Jane", instructor.Name)
	suite.Equal("Smith", instructor.Surname)
}

func (suite *InstructorIntegrationTestSuite) TestDeleteInstructor() {
	// Create test instructor
	suite.createTestInstructor()

	req := httptest.NewRequest("DELETE", fmt.Sprintf("/api/v1/instructors/%d", suite.testInstructor.ID), nil)
	req.Header.Set("Authorization", "Bearer "+suite.authToken)

	resp, err := suite.app.Test(req)
	suite.Require().NoError(err)
	suite.Equal(200, resp.StatusCode)

	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	suite.Require().NoError(err)

	suite.Equal("Instructor deleted successfully", response["message"])

	// Verify instructor was deleted from database
	var instructor models.Instructor
	err = suite.db.First(&instructor, suite.testInstructor.ID).Error
	suite.True(err != nil) // Should return error (not found)
}

func (suite *InstructorIntegrationTestSuite) TestAssignInstructorToCourse() {
	// Create test instructor
	suite.createTestInstructor()

	requestBody := map[string]interface{}{
		"instructor_id":     suite.testInstructor.ID,
		"course_section_id": suite.testSection.ID,
		"role":              "instructor",
	}

	body, _ := json.Marshal(requestBody)
	req := httptest.NewRequest("POST", "/api/v1/instructors/assign-course", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+suite.authToken)

	resp, err := suite.app.Test(req)
	suite.Require().NoError(err)
	suite.Equal(201, resp.StatusCode)

	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	suite.Require().NoError(err)

	suite.Equal("Instructor assigned to course successfully", response["message"])
	suite.NotNil(response["data"])

	// Verify assignment was created in database
	var assignment models.CourseInstructor
	err = suite.db.Where("instructor_id = ? AND course_section_id = ?", suite.testInstructor.ID, suite.testSection.ID).
		First(&assignment).Error
	suite.Require().NoError(err)
	suite.Equal("instructor", assignment.Role)
}

func (suite *InstructorIntegrationTestSuite) TestGetInstructorCourseAssignments() {
	// Create test instructor and assignment
	suite.createTestInstructor()
	suite.createTestCourseAssignment()

	req := httptest.NewRequest("GET", fmt.Sprintf("/api/v1/instructors/%d/course-assignments", suite.testInstructor.ID), nil)
	req.Header.Set("Authorization", "Bearer "+suite.authToken)

	resp, err := suite.app.Test(req)
	suite.Require().NoError(err)
	suite.Equal(200, resp.StatusCode)

	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	suite.Require().NoError(err)

	suite.Equal("Instructor course assignments retrieved successfully", response["message"])
	suite.NotNil(response["data"])

	assignments := response["data"].([]interface{})
	suite.Len(assignments, 1)
}

func (suite *InstructorIntegrationTestSuite) TestGetInstructorStats() {
	// Create test instructor
	suite.createTestInstructor()

	req := httptest.NewRequest("GET", "/api/v1/instructors/stats", nil)
	req.Header.Set("Authorization", "Bearer "+suite.authToken)

	resp, err := suite.app.Test(req)
	suite.Require().NoError(err)
	suite.Equal(200, resp.StatusCode)

	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	suite.Require().NoError(err)

	suite.Equal("Instructor statistics retrieved successfully", response["message"])
	suite.NotNil(response["data"])

	stats := response["data"].(map[string]interface{})
	suite.Equal(float64(1), stats["total_instructors"])
}

// Helper methods
func (suite *InstructorIntegrationTestSuite) createTestInstructor() {
	suite.testInstructor = &models.Instructor{
		UserID:     suite.testUser.ID,
		StaffID:    "STAFF001",
		Name:       "John",
		MiddleName: "Michael",
		Surname:    "Doe",
		FacultyID:  suite.testFaculty.ID,
		ProgramID:  suite.testProgram.ID,
	}
	err := suite.db.Create(suite.testInstructor).Error
	suite.Require().NoError(err)
}

func (suite *InstructorIntegrationTestSuite) createTestCourseAssignment() {
	assignment := &models.CourseInstructor{
		InstructorID:    suite.testInstructor.ID,
		CourseSectionID: suite.testSection.ID,
		Role:            "instructor",
	}
	err := suite.db.Create(assignment).Error
	suite.Require().NoError(err)
}

// Helper functions
func stringPtr(s string) *string {
	return &s
}

func uintPtr(u uint) *uint {
	return &u
}

func TestInstructorIntegrationTestSuite(t *testing.T) {
	suite.Run(t, new(InstructorIntegrationTestSuite))
}