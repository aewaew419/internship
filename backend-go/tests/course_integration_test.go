package tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"backend-go/internal/config"
	"backend-go/internal/database"
	"backend-go/internal/models"
	"backend-go/internal/routes"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	"gorm.io/gorm"
)

type CourseIntegrationTestSuite struct {
	suite.Suite
	app           *fiber.App
	db            *gorm.DB
	cfg           *config.Config
	authToken     string
	testCourse    *models.Course
	testSection   *models.CourseSection
	testStudent   *models.Student
	testInstructor *models.Instructor
	testCurriculum *models.Curriculum
}

func (suite *CourseIntegrationTestSuite) SetupSuite() {
	// Load test configuration
	cfg := config.Load()
	suite.cfg = cfg

	// Connect to test database
	db, err := database.Connect(cfg)
	suite.Require().NoError(err)
	suite.db = db

	// Auto-migrate tables
	err = database.AutoMigrate(db)
	suite.Require().NoError(err)

	// Create Fiber app
	suite.app = fiber.New()

	// Setup routes
	routes.Setup(suite.app, db, cfg)

	// Create test data and get auth token
	suite.createTestData()
	suite.authToken = suite.getAuthToken()
}

func (suite *CourseIntegrationTestSuite) TearDownSuite() {
	// Clean up test data
	suite.cleanupTestData()
}

func (suite *CourseIntegrationTestSuite) createTestData() {
	// Create test role first
	role := &models.Role{
		Name:        "admin",
		Description: "Administrator role",
	}
	suite.db.Create(role)

	// Create test faculty
	faculty := &models.Faculty{
		FacultyNameEN: "Test Faculty",
		FacultyNameTH: "คณะทดสอบ",
		CampusID:      1, // Assuming campus exists
	}
	suite.db.Create(faculty)

	// Create test program
	program := &models.Program{
		ProgramNameEN: "Test Program",
		ProgramNameTH: "หลักสูตรทดสอบ",
		FacultyID:     faculty.ID,
	}
	suite.db.Create(program)

	// Create test curriculum
	curriculum := &models.Curriculum{
		CurriculumNameEN: "Test Curriculum",
		CurriculumNameTH: "หลักสูตรทดสอบ",
		ProgramID:        program.ID,
	}
	suite.db.Create(curriculum)
	suite.testCurriculum = curriculum

	// Create test user for authentication
	user := &models.User{
		Email:    "coursetest@example.com",
		Password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
		RoleID:   role.ID,
	}
	suite.db.Create(user)

	// Create test student
	student := &models.Student{
		UserID:       user.ID,
		StudentID:    "TEST-STU-001",
		Name:         "Test Student",
		Surname:      "Test",
		FacultyID:    faculty.ID,
		ProgramID:    program.ID,
		CurriculumID: curriculum.ID,
		User:         *user,
	}
	suite.db.Create(student)
	suite.testStudent = student

	// Create test instructor
	instructor := &models.Instructor{
		UserID:    user.ID,
		StaffID:   "TEST-INS-001",
		Name:      "Test Instructor",
		Surname:   "Test",
		FacultyID: faculty.ID,
		ProgramID: program.ID,
		User:      *user,
	}
	suite.db.Create(instructor)
	suite.testInstructor = instructor

	// Create test course
	course := &models.Course{
		CurriculumID:  curriculum.ID,
		Code:          "TEST-101",
		Name:          "Test Course",
		Credits:       3,
		Description:   "Test course for integration tests",
		Prerequisites: "None",
	}
	suite.db.Create(course)
	suite.testCourse = course

	// Create test course section
	section := &models.CourseSection{
		CourseID:    course.ID,
		Section:     "01",
		Semester:    "1",
		Year:        2024,
		MaxStudents: 30,
		Schedule:    "MWF 10:00-11:00",
	}
	suite.db.Create(section)
	suite.testSection = section
}

func (suite *CourseIntegrationTestSuite) cleanupTestData() {
	// Delete in reverse order of creation to avoid foreign key constraints
	suite.db.Where("course_id = ?", suite.testCourse.ID).Delete(&models.CourseSection{})
	suite.db.Delete(suite.testCourse)
	suite.db.Delete(suite.testStudent)
	suite.db.Delete(suite.testInstructor)
	suite.db.Delete(suite.testCurriculum)
	suite.db.Where("email = ?", "coursetest@example.com").Delete(&models.User{})
}

func (suite *CourseIntegrationTestSuite) getAuthToken() string {
	loginData := map[string]string{
		"email":    "coursetest@example.com",
		"password": "password",
	}

	jsonData, _ := json.Marshal(loginData)
	req := httptest.NewRequest("POST", "/api/v1/login", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")

	resp, _ := suite.app.Test(req)
	defer resp.Body.Close()

	var response map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&response)

	if data, ok := response["data"].(map[string]interface{}); ok {
		if token, ok := data["token"].(string); ok {
			return token
		}
	}

	return ""
}

func (suite *CourseIntegrationTestSuite) makeAuthenticatedRequest(method, url string, body interface{}) *http.Response {
	var jsonData []byte
	if body != nil {
		jsonData, _ = json.Marshal(body)
	}

	req := httptest.NewRequest(method, url, bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+suite.authToken)

	resp, _ := suite.app.Test(req)
	return resp
}

// Test Course CRUD Operations

func (suite *CourseIntegrationTestSuite) TestGetCourses() {
	resp := suite.makeAuthenticatedRequest("GET", "/api/v1/courses", nil)
	defer resp.Body.Close()

	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)

	var response map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&response)

	assert.Contains(suite.T(), response, "data")
	assert.Contains(suite.T(), response, "pagination")
}

func (suite *CourseIntegrationTestSuite) TestGetCourseByID() {
	url := fmt.Sprintf("/api/v1/courses/%d", suite.testCourse.ID)
	resp := suite.makeAuthenticatedRequest("GET", url, nil)
	defer resp.Body.Close()

	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)

	var response map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&response)

	assert.Contains(suite.T(), response, "data")
	data := response["data"].(map[string]interface{})
	assert.Equal(suite.T(), suite.testCourse.Code, data["code"])
	assert.Equal(suite.T(), suite.testCourse.Name, data["name"])
}

func (suite *CourseIntegrationTestSuite) TestCreateCourse() {
	courseData := map[string]interface{}{
		"curriculum_id":  suite.testCurriculum.ID,
		"code":           "TEST-102",
		"name":           "New Test Course",
		"credits":        4,
		"description":    "A new test course",
		"prerequisites":  "TEST-101",
	}

	resp := suite.makeAuthenticatedRequest("POST", "/api/v1/courses", courseData)
	defer resp.Body.Close()

	assert.Equal(suite.T(), http.StatusCreated, resp.StatusCode)

	var response map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&response)

	assert.Contains(suite.T(), response, "message")
	assert.Contains(suite.T(), response, "data")

	// Clean up created course
	suite.db.Where("code = ?", "TEST-102").Delete(&models.Course{})
}

func (suite *CourseIntegrationTestSuite) TestUpdateCourse() {
	updateData := map[string]interface{}{
		"name":        "Updated Test Course",
		"description": "Updated description",
	}

	url := fmt.Sprintf("/api/v1/courses/%d", suite.testCourse.ID)
	resp := suite.makeAuthenticatedRequest("PUT", url, updateData)
	defer resp.Body.Close()

	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)

	var response map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&response)

	assert.Contains(suite.T(), response, "message")
	assert.Equal(suite.T(), "Course updated successfully", response["message"])
}

func (suite *CourseIntegrationTestSuite) TestDeleteCourse() {
	// Create a course to delete
	courseToDelete := &models.Course{
		CurriculumID:  suite.testCurriculum.ID,
		Code:          "DELETE-TEST",
		Name:          "Course to Delete",
		Credits:       3,
		Description:   "This course will be deleted",
		Prerequisites: "None",
	}
	suite.db.Create(courseToDelete)

	url := fmt.Sprintf("/api/v1/courses/%d", courseToDelete.ID)
	resp := suite.makeAuthenticatedRequest("DELETE", url, nil)
	defer resp.Body.Close()

	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)

	var response map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&response)

	assert.Contains(suite.T(), response, "message")
	assert.Equal(suite.T(), "Course deleted successfully", response["message"])

	// Verify course is deleted
	var deletedCourse models.Course
	err := suite.db.First(&deletedCourse, courseToDelete.ID).Error
	assert.Error(suite.T(), err)
	assert.Equal(suite.T(), gorm.ErrRecordNotFound, err)
}

// Test Course Section CRUD Operations

func (suite *CourseIntegrationTestSuite) TestGetCourseSections() {
	resp := suite.makeAuthenticatedRequest("GET", "/api/v1/course-sections", nil)
	defer resp.Body.Close()

	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)

	var response map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&response)

	assert.Contains(suite.T(), response, "data")
	assert.Contains(suite.T(), response, "pagination")
}

func (suite *CourseIntegrationTestSuite) TestGetCourseSectionByID() {
	url := fmt.Sprintf("/api/v1/course-sections/%d", suite.testSection.ID)
	resp := suite.makeAuthenticatedRequest("GET", url, nil)
	defer resp.Body.Close()

	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)

	var response map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&response)

	assert.Contains(suite.T(), response, "data")
	data := response["data"].(map[string]interface{})
	assert.Equal(suite.T(), suite.testSection.Section, data["section"])
	assert.Equal(suite.T(), suite.testSection.Semester, data["semester"])
}

func (suite *CourseIntegrationTestSuite) TestCreateCourseSection() {
	sectionData := map[string]interface{}{
		"course_id":    suite.testCourse.ID,
		"section":      "02",
		"semester":     "2",
		"year":         2024,
		"max_students": 25,
		"schedule":     "TTH 14:00-15:30",
	}

	resp := suite.makeAuthenticatedRequest("POST", "/api/v1/course-sections", sectionData)
	defer resp.Body.Close()

	assert.Equal(suite.T(), http.StatusCreated, resp.StatusCode)

	var response map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&response)

	assert.Contains(suite.T(), response, "message")
	assert.Contains(suite.T(), response, "data")

	// Clean up created section
	suite.db.Where("course_id = ? AND section = ? AND semester = ? AND year = ?", 
		suite.testCourse.ID, "02", "2", 2024).Delete(&models.CourseSection{})
}

func (suite *CourseIntegrationTestSuite) TestUpdateCourseSection() {
	updateData := map[string]interface{}{
		"max_students": 35,
		"schedule":     "MWF 11:00-12:00",
	}

	url := fmt.Sprintf("/api/v1/course-sections/%d", suite.testSection.ID)
	resp := suite.makeAuthenticatedRequest("PUT", url, updateData)
	defer resp.Body.Close()

	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)

	var response map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&response)

	assert.Contains(suite.T(), response, "message")
	assert.Equal(suite.T(), "Course section updated successfully", response["message"])
}

func (suite *CourseIntegrationTestSuite) TestDeleteCourseSection() {
	// Create a section to delete
	sectionToDelete := &models.CourseSection{
		CourseID:    suite.testCourse.ID,
		Section:     "DELETE",
		Semester:    "3",
		Year:        2024,
		MaxStudents: 30,
		Schedule:    "To be deleted",
	}
	suite.db.Create(sectionToDelete)

	url := fmt.Sprintf("/api/v1/course-sections/%d", sectionToDelete.ID)
	resp := suite.makeAuthenticatedRequest("DELETE", url, nil)
	defer resp.Body.Close()

	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)

	var response map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&response)

	assert.Contains(suite.T(), response, "message")
	assert.Equal(suite.T(), "Course section deleted successfully", response["message"])

	// Verify section is deleted
	var deletedSection models.CourseSection
	err := suite.db.First(&deletedSection, sectionToDelete.ID).Error
	assert.Error(suite.T(), err)
	assert.Equal(suite.T(), gorm.ErrRecordNotFound, err)
}

// Test Instructor Assignment Operations

func (suite *CourseIntegrationTestSuite) TestAssignInstructorToCourse() {
	assignmentData := map[string]interface{}{
		"instructor_id":     suite.testInstructor.ID,
		"course_section_id": suite.testSection.ID,
		"role":              "instructor",
	}

	resp := suite.makeAuthenticatedRequest("POST", "/api/v1/courses/assign-instructor", assignmentData)
	defer resp.Body.Close()

	assert.Equal(suite.T(), http.StatusCreated, resp.StatusCode)

	var response map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&response)

	assert.Contains(suite.T(), response, "message")
	assert.Equal(suite.T(), "Instructor assigned to course successfully", response["message"])

	// Verify assignment was created
	var assignment models.CourseInstructor
	err := suite.db.Where("instructor_id = ? AND course_section_id = ?", 
		suite.testInstructor.ID, suite.testSection.ID).First(&assignment).Error
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "instructor", assignment.Role)

	// Clean up
	suite.db.Delete(&assignment)
}

func (suite *CourseIntegrationTestSuite) TestUpdateInstructorAssignment() {
	// Create an assignment first
	assignment := &models.CourseInstructor{
		InstructorID:    suite.testInstructor.ID,
		CourseSectionID: suite.testSection.ID,
		Role:            "assistant",
	}
	suite.db.Create(assignment)

	updateData := map[string]interface{}{
		"role": "coordinator",
	}

	url := fmt.Sprintf("/api/v1/courses/instructor-assignments/%d", assignment.ID)
	resp := suite.makeAuthenticatedRequest("PUT", url, updateData)
	defer resp.Body.Close()

	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)

	var response map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&response)

	assert.Contains(suite.T(), response, "message")
	assert.Equal(suite.T(), "Instructor assignment updated successfully", response["message"])

	// Verify update
	var updatedAssignment models.CourseInstructor
	suite.db.First(&updatedAssignment, assignment.ID)
	assert.Equal(suite.T(), "coordinator", updatedAssignment.Role)

	// Clean up
	suite.db.Delete(&updatedAssignment)
}

func (suite *CourseIntegrationTestSuite) TestRemoveInstructorFromCourse() {
	// Create an assignment first
	assignment := &models.CourseInstructor{
		InstructorID:    suite.testInstructor.ID,
		CourseSectionID: suite.testSection.ID,
		Role:            "instructor",
	}
	suite.db.Create(assignment)

	url := fmt.Sprintf("/api/v1/courses/instructor-assignments/%d", assignment.ID)
	resp := suite.makeAuthenticatedRequest("DELETE", url, nil)
	defer resp.Body.Close()

	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)

	var response map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&response)

	assert.Contains(suite.T(), response, "message")
	assert.Equal(suite.T(), "Instructor removed from course successfully", response["message"])

	// Verify assignment is deleted
	var deletedAssignment models.CourseInstructor
	err := suite.db.First(&deletedAssignment, assignment.ID).Error
	assert.Error(suite.T(), err)
	assert.Equal(suite.T(), gorm.ErrRecordNotFound, err)
}

// Test Committee Assignment Operations

func (suite *CourseIntegrationTestSuite) TestAssignCommitteeMember() {
	assignmentData := map[string]interface{}{
		"instructor_id":     suite.testInstructor.ID,
		"course_section_id": suite.testSection.ID,
		"role":              "member",
	}

	resp := suite.makeAuthenticatedRequest("POST", "/api/v1/courses/assign-committee", assignmentData)
	defer resp.Body.Close()

	assert.Equal(suite.T(), http.StatusCreated, resp.StatusCode)

	var response map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&response)

	assert.Contains(suite.T(), response, "message")
	assert.Equal(suite.T(), "Committee member assigned to course successfully", response["message"])

	// Verify assignment was created
	var assignment models.CourseCommittee
	err := suite.db.Where("instructor_id = ? AND course_section_id = ?", 
		suite.testInstructor.ID, suite.testSection.ID).First(&assignment).Error
	assert.NoError(suite.T(), err)
	assert.Equal(suite.T(), "member", assignment.Role)

	// Clean up
	suite.db.Delete(&assignment)
}

func (suite *CourseIntegrationTestSuite) TestUpdateCommitteeAssignment() {
	// Create an assignment first
	assignment := &models.CourseCommittee{
		InstructorID:    suite.testInstructor.ID,
		CourseSectionID: suite.testSection.ID,
		Role:            "member",
	}
	suite.db.Create(assignment)

	updateData := map[string]interface{}{
		"role": "chair",
	}

	url := fmt.Sprintf("/api/v1/courses/committee-assignments/%d", assignment.ID)
	resp := suite.makeAuthenticatedRequest("PUT", url, updateData)
	defer resp.Body.Close()

	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)

	var response map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&response)

	assert.Contains(suite.T(), response, "message")
	assert.Equal(suite.T(), "Committee assignment updated successfully", response["message"])

	// Verify update
	var updatedAssignment models.CourseCommittee
	suite.db.First(&updatedAssignment, assignment.ID)
	assert.Equal(suite.T(), "chair", updatedAssignment.Role)

	// Clean up
	suite.db.Delete(&updatedAssignment)
}

func (suite *CourseIntegrationTestSuite) TestRemoveCommitteeMember() {
	// Create an assignment first
	assignment := &models.CourseCommittee{
		InstructorID:    suite.testInstructor.ID,
		CourseSectionID: suite.testSection.ID,
		Role:            "secretary",
	}
	suite.db.Create(assignment)

	url := fmt.Sprintf("/api/v1/courses/committee-assignments/%d", assignment.ID)
	resp := suite.makeAuthenticatedRequest("DELETE", url, nil)
	defer resp.Body.Close()

	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)

	var response map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&response)

	assert.Contains(suite.T(), response, "message")
	assert.Equal(suite.T(), "Committee member removed from course successfully", response["message"])

	// Verify assignment is deleted
	var deletedAssignment models.CourseCommittee
	err := suite.db.First(&deletedAssignment, assignment.ID).Error
	assert.Error(suite.T(), err)
	assert.Equal(suite.T(), gorm.ErrRecordNotFound, err)
}

// Test Student Enrollment Status Operations

func (suite *CourseIntegrationTestSuite) TestUpdateStudentEnrollmentStatus() {
	// Create a student enrollment first
	enrollment := &models.StudentEnroll{
		StudentID:       suite.testStudent.ID,
		CourseSectionID: suite.testSection.ID,
		Status:          "enrolled",
	}
	suite.db.Create(enrollment)

	updateData := map[string]interface{}{
		"status":       "completed",
		"grade":        "A",
		"grade_points": 4.0,
	}

	url := fmt.Sprintf("/api/v1/courses/enrollments/%d", enrollment.ID)
	resp := suite.makeAuthenticatedRequest("PUT", url, updateData)
	defer resp.Body.Close()

	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)

	var response map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&response)

	assert.Contains(suite.T(), response, "message")
	assert.Equal(suite.T(), "Student enrollment status updated successfully", response["message"])

	// Verify update
	var updatedEnrollment models.StudentEnroll
	suite.db.First(&updatedEnrollment, enrollment.ID)
	assert.Equal(suite.T(), "completed", updatedEnrollment.Status)
	assert.Equal(suite.T(), "A", *updatedEnrollment.Grade)
	assert.Equal(suite.T(), 4.0, *updatedEnrollment.GradePoints)

	// Clean up
	suite.db.Delete(&updatedEnrollment)
}

func (suite *CourseIntegrationTestSuite) TestGetStudentEnrollmentStatuses() {
	resp := suite.makeAuthenticatedRequest("GET", "/api/v1/student-enrollment-statuses", nil)
	defer resp.Body.Close()

	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)

	var response map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&response)

	assert.Contains(suite.T(), response, "data")
	assert.Contains(suite.T(), response, "pagination")
}

func (suite *CourseIntegrationTestSuite) TestCreateStudentEnrollmentStatus() {
	statusData := map[string]interface{}{
		"student_id":    suite.testStudent.ID,
		"semester":      "1",
		"year":          2024,
		"status":        "active",
		"gpa":           3.5,
		"credits":       15,
		"instructor_id": suite.testInstructor.ID,
	}

	resp := suite.makeAuthenticatedRequest("POST", "/api/v1/student-enrollment-statuses", statusData)
	defer resp.Body.Close()

	assert.Equal(suite.T(), http.StatusCreated, resp.StatusCode)

	var response map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&response)

	assert.Contains(suite.T(), response, "message")
	assert.Contains(suite.T(), response, "data")

	// Clean up created status
	suite.db.Where("student_id = ? AND semester = ? AND year = ?", 
		suite.testStudent.ID, "1", 2024).Delete(&models.StudentEnrollStatus{})
}

func (suite *CourseIntegrationTestSuite) TestUpdateStudentEnrollmentStatusRecord() {
	// Create a status record first
	status := &models.StudentEnrollStatus{
		StudentID:    suite.testStudent.ID,
		Semester:     "2",
		Year:         2024,
		Status:       "active",
		GPA:          nil,
		Credits:      12,
		InstructorID: &suite.testInstructor.ID,
	}
	suite.db.Create(status)

	gpa := 3.8
	updateData := map[string]interface{}{
		"status":  "inactive",
		"gpa":     gpa,
		"credits": 18,
	}

	url := fmt.Sprintf("/api/v1/student-enrollment-statuses/%d", status.ID)
	resp := suite.makeAuthenticatedRequest("PUT", url, updateData)
	defer resp.Body.Close()

	assert.Equal(suite.T(), http.StatusOK, resp.StatusCode)

	var response map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&response)

	assert.Contains(suite.T(), response, "message")
	assert.Equal(suite.T(), "Student enrollment status updated successfully", response["message"])

	// Verify update
	var updatedStatus models.StudentEnrollStatus
	suite.db.First(&updatedStatus, status.ID)
	assert.Equal(suite.T(), "inactive", updatedStatus.Status)
	assert.Equal(suite.T(), 3.8, *updatedStatus.GPA)
	assert.Equal(suite.T(), 18, updatedStatus.Credits)

	// Clean up
	suite.db.Delete(&updatedStatus)
}

// Test Error Cases

func (suite *CourseIntegrationTestSuite) TestGetCourseNotFound() {
	resp := suite.makeAuthenticatedRequest("GET", "/api/v1/courses/99999", nil)
	defer resp.Body.Close()

	assert.Equal(suite.T(), http.StatusNotFound, resp.StatusCode)

	var response map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&response)

	assert.Contains(suite.T(), response, "error")
	assert.Equal(suite.T(), "Course not found", response["error"])
}

func (suite *CourseIntegrationTestSuite) TestCreateCourseWithInvalidData() {
	courseData := map[string]interface{}{
		"curriculum_id": 99999, // Non-existent curriculum
		"code":          "INVALID",
		"name":          "Invalid Course",
		"credits":       3,
	}

	resp := suite.makeAuthenticatedRequest("POST", "/api/v1/courses", courseData)
	defer resp.Body.Close()

	assert.Equal(suite.T(), http.StatusBadRequest, resp.StatusCode)

	var response map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&response)

	assert.Contains(suite.T(), response, "error")
	assert.Equal(suite.T(), "Curriculum not found", response["error"])
}

func (suite *CourseIntegrationTestSuite) TestCreateDuplicateCourse() {
	courseData := map[string]interface{}{
		"curriculum_id":  suite.testCurriculum.ID,
		"code":           suite.testCourse.Code, // Duplicate code
		"name":           "Duplicate Course",
		"credits":        3,
		"description":    "This should fail",
		"prerequisites":  "None",
	}

	resp := suite.makeAuthenticatedRequest("POST", "/api/v1/courses", courseData)
	defer resp.Body.Close()

	assert.Equal(suite.T(), http.StatusConflict, resp.StatusCode)

	var response map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&response)

	assert.Contains(suite.T(), response, "error")
	assert.Equal(suite.T(), "Course code already exists", response["error"])
}

func (suite *CourseIntegrationTestSuite) TestUnauthorizedAccess() {
	req := httptest.NewRequest("GET", "/api/v1/courses", nil)
	req.Header.Set("Content-Type", "application/json")
	// No Authorization header

	resp, _ := suite.app.Test(req)
	defer resp.Body.Close()

	assert.Equal(suite.T(), http.StatusUnauthorized, resp.StatusCode)
}

// Run the test suite
func TestCourseIntegrationTestSuite(t *testing.T) {
	suite.Run(t, new(CourseIntegrationTestSuite))
}