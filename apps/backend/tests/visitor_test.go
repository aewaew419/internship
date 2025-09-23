package tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"
	"time"

	"backend-go/internal/config"
	"backend-go/internal/database"
	"backend-go/internal/models"
	"backend-go/internal/routes"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/suite"
	"gorm.io/gorm"
)

type VisitorTestSuite struct {
	suite.Suite
	app            *fiber.App
	db             *gorm.DB
	cfg            *config.Config
	authToken      string
	testUser       *models.User
	testInstructor *models.Instructor
	testStudent    *models.Student
	testEnroll     *models.StudentEnroll
	testTraining   *models.VisitorTraining
	testSchedule   *models.VisitorSchedule
}

func (suite *VisitorTestSuite) SetupSuite() {
	// Load test configuration
	cfg := config.Load()
	suite.cfg = cfg

	// Connect to test database
	db, err := database.Connect(cfg.DatabaseURL)
	suite.Require().NoError(err)
	suite.db = db

	// Auto-migrate tables
	err = database.AutoMigrate(db)
	suite.Require().NoError(err)

	// Create Fiber app
	suite.app = fiber.New()
	routes.Setup(suite.app, db, cfg)
}

func (suite *VisitorTestSuite) SetupTest() {
	// Clean up database
	suite.cleanupDatabase()

	// Create test data
	suite.createTestData()

	// Get auth token
	suite.authToken = suite.getAuthToken()
}

func (suite *VisitorTestSuite) TearDownTest() {
	suite.cleanupDatabase()
}

func (suite *VisitorTestSuite) TearDownSuite() {
	// Close database connection
	sqlDB, _ := suite.db.DB()
	sqlDB.Close()
}

func (suite *VisitorTestSuite) cleanupDatabase() {
	// Delete in reverse order of dependencies
	suite.db.Exec("DELETE FROM visits_pictures")
	suite.db.Exec("DELETE FROM visitor_evaluate_companies")
	suite.db.Exec("DELETE FROM visitor_evaluate_students")
	suite.db.Exec("DELETE FROM visitor_schedules")
	suite.db.Exec("DELETE FROM visitor_trainings")
	suite.db.Exec("DELETE FROM student_enrolls")
	suite.db.Exec("DELETE FROM students")
	suite.db.Exec("DELETE FROM instructors")
	suite.db.Exec("DELETE FROM users")
	suite.db.Exec("DELETE FROM roles")
	suite.db.Exec("DELETE FROM course_sections")
	suite.db.Exec("DELETE FROM courses")
	suite.db.Exec("DELETE FROM majors")
	suite.db.Exec("DELETE FROM curriculums")
	suite.db.Exec("DELETE FROM programs")
	suite.db.Exec("DELETE FROM faculties")
	suite.db.Exec("DELETE FROM campuses")
}

func (suite *VisitorTestSuite) createTestData() {
	// Create test campus
	campus := &models.Campus{
		CampusNameEN: "Test Campus",
		CampusNameTH: "Test Campus TH",
	}
	suite.db.Create(campus)

	// Create test faculty
	faculty := &models.Faculty{
		FacultyNameEN: "Test Faculty",
		FacultyNameTH: "Test Faculty TH",
		CampusID:      campus.ID,
	}
	suite.db.Create(faculty)

	// Create test program
	program := &models.Program{
		ProgramNameEN: "Test Program",
		ProgramNameTH: "Test Program TH",
		FacultyID:     faculty.ID,
	}
	suite.db.Create(program)

	// Create test curriculum
	curriculum := &models.Curriculum{
		CurriculumNameEN: "Test Curriculum",
		CurriculumNameTH: "Test Curriculum TH",
		ProgramID:        program.ID,
	}
	suite.db.Create(curriculum)

	// Create test major
	major := &models.Major{
		MajorNameEN:  "Test Major",
		MajorNameTH:  "Test Major TH",
		CurriculumID: curriculum.ID,
	}
	suite.db.Create(major)

	// Create test course
	course := &models.Course{
		Code:         "TEST101",
		Name:         "Test Course",
		Credits:      3,
		CurriculumID: curriculum.ID,
	}
	suite.db.Create(course)

	// Create test roles
	adminRole := &models.Role{Name: "admin"}
	suite.db.Create(adminRole)
	studentRole := &models.Role{Name: "student"}
	suite.db.Create(studentRole)

	// Create test course section
	courseSection := &models.CourseSection{
		CourseID: course.ID,
		Section:  "Section 1",
		Year:     2024,
		Semester: "1",
	}
	suite.db.Create(courseSection)

	// Create test user
	fullName := "Test User"
	suite.testUser = &models.User{
		FullName: &fullName,
		Email:    "test@example.com",
		Password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
		RoleID:   adminRole.ID,
	}
	suite.db.Create(suite.testUser)

	// Create test instructor (visitor)
	suite.testInstructor = &models.Instructor{
		UserID:    suite.testUser.ID,
		StaffID:   "INST001",
		Name:      "Test",
		Surname:   "Instructor",
		FacultyID: faculty.ID,
		ProgramID: program.ID,
	}
	suite.db.Create(suite.testInstructor)

	// Create test student user
	studentFullName := "Test Student"
	studentUser := &models.User{
		FullName: &studentFullName,
		Email:    "student@example.com",
		Password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
		RoleID:   studentRole.ID,
	}
	suite.db.Create(studentUser)

	// Create test student
	suite.testStudent = &models.Student{
		UserID:       studentUser.ID,
		StudentID:    "STU001",
		Name:         "Test",
		Surname:      "Student",
		CampusID:     campus.ID,
		FacultyID:    &faculty.ID,
		ProgramID:    &program.ID,
		CurriculumID: &curriculum.ID,
		MajorID:      &major.ID,
	}
	suite.db.Create(suite.testStudent)

	// Create test student enrollment
	suite.testEnroll = &models.StudentEnroll{
		StudentID:       suite.testStudent.ID,
		CourseSectionID: courseSection.ID,
		EnrollDate:      time.Now(),
	}
	suite.db.Create(suite.testEnroll)

	// Create test visitor training
	suite.testTraining = &models.VisitorTraining{
		StudentEnrollID:     suite.testEnroll.ID,
		VisitorInstructorID: suite.testInstructor.ID,
	}
	suite.db.Create(suite.testTraining)

	// Create test visitor schedule
	visitAt := time.Now().Add(24 * time.Hour)
	comment := "Test visit comment"
	suite.testSchedule = &models.VisitorSchedule{
		VisitorTrainingID: suite.testTraining.ID,
		VisitNo:           1,
		VisitAt:           &visitAt,
		Comment:           &comment,
	}
	suite.db.Create(suite.testSchedule)
}

func (suite *VisitorTestSuite) getAuthToken() string {
	loginData := map[string]string{
		"email":    "test@example.com",
		"password": "password",
	}

	jsonData, _ := json.Marshal(loginData)
	req := httptest.NewRequest("POST", "/api/v1/login", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")

	resp, _ := suite.app.Test(req)
	defer resp.Body.Close()

	var response map[string]interface{}
	body, _ := io.ReadAll(resp.Body)
	json.Unmarshal(body, &response)

	data := response["data"].(map[string]interface{})
	return data["token"].(string)
}

// Visitor Training Tests

func (suite *VisitorTestSuite) TestGetVisitorTrainings() {
	req := httptest.NewRequest("GET", "/api/v1/visitor-trainings", nil)
	req.Header.Set("Authorization", "Bearer "+suite.authToken)

	resp, err := suite.app.Test(req)
	suite.NoError(err)
	defer resp.Body.Close()

	suite.Equal(200, resp.StatusCode)

	var response map[string]interface{}
	body, _ := io.ReadAll(resp.Body)
	json.Unmarshal(body, &response)

	suite.Equal("Visitor trainings retrieved successfully", response["message"])
	data := response["data"].(map[string]interface{})
	suite.Greater(data["total"].(float64), float64(0))
}

func (suite *VisitorTestSuite) TestGetVisitorTraining() {
	url := fmt.Sprintf("/api/v1/visitor-trainings/%d", suite.testTraining.ID)
	req := httptest.NewRequest("GET", url, nil)
	req.Header.Set("Authorization", "Bearer "+suite.authToken)

	resp, err := suite.app.Test(req)
	suite.NoError(err)
	defer resp.Body.Close()

	suite.Equal(200, resp.StatusCode)

	var response map[string]interface{}
	body, _ := io.ReadAll(resp.Body)
	json.Unmarshal(body, &response)

	suite.Equal("Visitor training retrieved successfully", response["message"])
	data := response["data"].(map[string]interface{})
	suite.Equal(float64(suite.testTraining.ID), data["id"].(float64))
}

func (suite *VisitorTestSuite) TestCreateVisitorTraining() {
	// Get student role
	var studentRole models.Role
	suite.db.Where("name = ?", "student").First(&studentRole)

	// Create another student enrollment for testing
	studentFullName2 := "Test Student 2"
	studentUser2 := &models.User{
		FullName: &studentFullName2,
		Email:    "student2@example.com",
		Password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
		RoleID:   studentRole.ID,
	}
	suite.db.Create(studentUser2)

	student2 := &models.Student{
		UserID:       studentUser2.ID,
		StudentID:    "STU002",
		Name:         "Test",
		Surname:      "Student2",
		CampusID:     suite.testStudent.CampusID,
		FacultyID:    suite.testStudent.FacultyID,
		ProgramID:    suite.testStudent.ProgramID,
		CurriculumID: suite.testStudent.CurriculumID,
		MajorID:      suite.testStudent.MajorID,
	}
	suite.db.Create(student2)

	enroll2 := &models.StudentEnroll{
		StudentID:       student2.ID,
		CourseSectionID: suite.testEnroll.CourseSectionID,
		EnrollDate:      time.Now(),
	}
	suite.db.Create(enroll2)

	trainingData := map[string]interface{}{
		"student_enroll_id":     enroll2.ID,
		"visitor_instructor_id": suite.testInstructor.ID,
	}

	jsonData, _ := json.Marshal(trainingData)
	req := httptest.NewRequest("POST", "/api/v1/visitor-trainings", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+suite.authToken)

	resp, err := suite.app.Test(req)
	suite.NoError(err)
	defer resp.Body.Close()

	suite.Equal(201, resp.StatusCode)

	var response map[string]interface{}
	body, _ := io.ReadAll(resp.Body)
	json.Unmarshal(body, &response)

	suite.Equal("Visitor training created successfully", response["message"])
	data := response["data"].(map[string]interface{})
	suite.Equal(float64(enroll2.ID), data["student_enroll_id"].(float64))
}

// Visitor Schedule Tests

func (suite *VisitorTestSuite) TestGetVisitorSchedules() {
	req := httptest.NewRequest("GET", "/api/v1/visitor-schedules", nil)
	req.Header.Set("Authorization", "Bearer "+suite.authToken)

	resp, err := suite.app.Test(req)
	suite.NoError(err)
	defer resp.Body.Close()

	suite.Equal(200, resp.StatusCode)

	var response map[string]interface{}
	body, _ := io.ReadAll(resp.Body)
	json.Unmarshal(body, &response)

	suite.Equal("Visitor schedules retrieved successfully", response["message"])
	data := response["data"].(map[string]interface{})
	suite.Greater(data["total"].(float64), float64(0))
}

func (suite *VisitorTestSuite) TestCreateVisitorSchedule() {
	visitAt := time.Now().Add(48 * time.Hour)
	scheduleData := map[string]interface{}{
		"visitor_training_id": suite.testTraining.ID,
		"visit_no":            2,
		"visit_at":            visitAt.Format(time.RFC3339),
		"comment":             "Test schedule comment",
	}

	jsonData, _ := json.Marshal(scheduleData)
	req := httptest.NewRequest("POST", "/api/v1/visitor-schedules", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+suite.authToken)

	resp, err := suite.app.Test(req)
	suite.NoError(err)
	defer resp.Body.Close()

	suite.Equal(201, resp.StatusCode)

	var response map[string]interface{}
	body, _ := io.ReadAll(resp.Body)
	json.Unmarshal(body, &response)

	suite.Equal("Visitor schedule created successfully", response["message"])
	data := response["data"].(map[string]interface{})
	suite.Equal(float64(2), data["visit_no"].(float64))
}

// Visitor Evaluate Student Tests

func (suite *VisitorTestSuite) TestCreateVisitorEvaluateStudent() {
	evaluationData := map[string]interface{}{
		"visitor_training_id": suite.testTraining.ID,
		"score":               85,
		"questions":           "Test evaluation questions",
		"comment":             "Test evaluation comment",
	}

	jsonData, _ := json.Marshal(evaluationData)
	req := httptest.NewRequest("POST", "/api/v1/visitor-evaluate-students", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+suite.authToken)

	resp, err := suite.app.Test(req)
	suite.NoError(err)
	defer resp.Body.Close()

	suite.Equal(201, resp.StatusCode)

	var response map[string]interface{}
	body, _ := io.ReadAll(resp.Body)
	json.Unmarshal(body, &response)

	suite.Equal("Visitor evaluate student created successfully", response["message"])
	data := response["data"].(map[string]interface{})
	suite.Equal(float64(85), data["score"].(float64))
}

// Visitor Evaluate Company Tests

func (suite *VisitorTestSuite) TestCreateVisitorEvaluateCompany() {
	evaluationData := map[string]interface{}{
		"visitor_training_id": suite.testTraining.ID,
		"score":               90,
		"questions":           "Test company evaluation questions",
		"comment":             "Test company evaluation comment",
	}

	jsonData, _ := json.Marshal(evaluationData)
	req := httptest.NewRequest("POST", "/api/v1/visitor-evaluate-companies", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+suite.authToken)

	resp, err := suite.app.Test(req)
	suite.NoError(err)
	defer resp.Body.Close()

	suite.Equal(201, resp.StatusCode)

	var response map[string]interface{}
	body, _ := io.ReadAll(resp.Body)
	json.Unmarshal(body, &response)

	suite.Equal("Visitor evaluate company created successfully", response["message"])
	data := response["data"].(map[string]interface{})
	suite.Equal(float64(90), data["score"].(float64))
}

// Visit Photo Tests

func (suite *VisitorTestSuite) TestUploadVisitPhoto() {
	// Create a test image file
	testImagePath := "test_image.jpg"
	testImageContent := []byte("fake image content")
	err := os.WriteFile(testImagePath, testImageContent, 0644)
	suite.NoError(err)
	defer os.Remove(testImagePath)

	// Create multipart form
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	// Add photo_no field
	writer.WriteField("photo_no", "1")

	// Add file field
	file, err := os.Open(testImagePath)
	suite.NoError(err)
	defer file.Close()

	part, err := writer.CreateFormFile("file", filepath.Base(testImagePath))
	suite.NoError(err)

	_, err = io.Copy(part, file)
	suite.NoError(err)

	writer.Close()

	url := fmt.Sprintf("/api/v1/visitor-schedules/%d/photos", suite.testSchedule.ID)
	req := httptest.NewRequest("POST", url, &buf)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Authorization", "Bearer "+suite.authToken)

	resp, err := suite.app.Test(req)
	suite.NoError(err)
	defer resp.Body.Close()

	suite.Equal(201, resp.StatusCode)

	var response map[string]interface{}
	body, _ := io.ReadAll(resp.Body)
	json.Unmarshal(body, &response)

	suite.Equal("Visit photo uploaded successfully", response["message"])
	data := response["data"].(map[string]interface{})
	suite.Equal(float64(1), data["photo_no"].(float64))
}

func (suite *VisitorTestSuite) TestGetVisitPhotos() {
	// First create a photo
	photo := &models.VisitsPicture{
		VisitorScheduleID: suite.testSchedule.ID,
		PhotoNo:           1,
		FileURL:           "/uploads/visit-photos/test.jpg",
	}
	suite.db.Create(photo)

	url := fmt.Sprintf("/api/v1/visitor-schedules/%d/photos", suite.testSchedule.ID)
	req := httptest.NewRequest("GET", url, nil)
	req.Header.Set("Authorization", "Bearer "+suite.authToken)

	resp, err := suite.app.Test(req)
	suite.NoError(err)
	defer resp.Body.Close()

	suite.Equal(200, resp.StatusCode)

	var response map[string]interface{}
	body, _ := io.ReadAll(resp.Body)
	json.Unmarshal(body, &response)

	suite.Equal("Visit photos retrieved successfully", response["message"])
	data := response["data"].([]interface{})
	suite.Greater(len(data), 0)
}

// Error handling tests

func (suite *VisitorTestSuite) TestCreateVisitorTrainingWithInvalidData() {
	trainingData := map[string]interface{}{
		"student_enroll_id": 99999, // Non-existent ID
		"visitor_instructor_id": suite.testInstructor.ID,
	}

	jsonData, _ := json.Marshal(trainingData)
	req := httptest.NewRequest("POST", "/api/v1/visitor-trainings", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+suite.authToken)

	resp, err := suite.app.Test(req)
	suite.NoError(err)
	defer resp.Body.Close()

	suite.Equal(400, resp.StatusCode)

	var response map[string]interface{}
	body, _ := io.ReadAll(resp.Body)
	json.Unmarshal(body, &response)

	suite.Equal("STUDENT_ENROLLMENT_NOT_FOUND", response["code"])
}

func (suite *VisitorTestSuite) TestCreateVisitorScheduleWithDuplicateVisitNo() {
	scheduleData := map[string]interface{}{
		"visitor_training_id": suite.testTraining.ID,
		"visit_no":            1, // Same as existing schedule
		"comment":             "Duplicate visit number",
	}

	jsonData, _ := json.Marshal(scheduleData)
	req := httptest.NewRequest("POST", "/api/v1/visitor-schedules", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+suite.authToken)

	resp, err := suite.app.Test(req)
	suite.NoError(err)
	defer resp.Body.Close()

	suite.Equal(409, resp.StatusCode)

	var response map[string]interface{}
	body, _ := io.ReadAll(resp.Body)
	json.Unmarshal(body, &response)

	suite.Equal("VISITOR_SCHEDULE_EXISTS", response["code"])
}

func (suite *VisitorTestSuite) TestUploadVisitPhotoWithInvalidFile() {
	// Create multipart form with invalid file type
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	writer.WriteField("photo_no", "1")

	part, err := writer.CreateFormFile("file", "test.txt")
	suite.NoError(err)
	part.Write([]byte("not an image"))

	writer.Close()

	url := fmt.Sprintf("/api/v1/visitor-schedules/%d/photos", suite.testSchedule.ID)
	req := httptest.NewRequest("POST", url, &buf)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Authorization", "Bearer "+suite.authToken)

	resp, err := suite.app.Test(req)
	suite.NoError(err)
	defer resp.Body.Close()

	suite.Equal(400, resp.StatusCode)

	var response map[string]interface{}
	body, _ := io.ReadAll(resp.Body)
	json.Unmarshal(body, &response)

	suite.Equal("INVALID_FILE_TYPE", response["code"])
}

func (suite *VisitorTestSuite) TestUnauthorizedAccess() {
	req := httptest.NewRequest("GET", "/api/v1/visitor-trainings", nil)
	// No Authorization header

	resp, err := suite.app.Test(req)
	suite.NoError(err)
	defer resp.Body.Close()

	suite.Equal(401, resp.StatusCode)
}

func TestVisitorTestSuite(t *testing.T) {
	suite.Run(t, new(VisitorTestSuite))
}