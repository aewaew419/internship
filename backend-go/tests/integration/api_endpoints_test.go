package integration

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http/httptest"
	"os"
	"strconv"
	"testing"

	"backend-go/tests"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
	"github.com/xuri/excelize/v2"
)

// APIEndpointsTestSuite tests all API endpoints
type APIEndpointsTestSuite struct {
	tests.BaseTestSuite
}

// Test Authentication Endpoints
func (suite *APIEndpointsTestSuite) TestAuthenticationEndpoints() {
	t := suite.T()

	t.Run("POST /api/v1/register", func(t *testing.T) {
		payload := map[string]interface{}{
			"full_name":        "Integration Test User",
			"email":           "integration@example.com",
			"password":        "password123",
			"confirm_password": "password123",
			"role_id":         1,
		}
		
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest("POST", "/api/v1/register", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		
		resp, err := suite.app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 201, resp.StatusCode)
	})

	t.Run("POST /api/v1/login", func(t *testing.T) {
		// Register user first
		suite.CreateTestUser("logintest@example.com", "Login Test User", 1)
		
		payload := map[string]string{
			"email":    "logintest@example.com",
			"password": "password123",
		}
		
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest("POST", "/api/v1/login", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		
		resp, err := suite.app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
		
		var response map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&response)
		data := response["data"].(map[string]interface{})
		assert.Contains(t, data, "access_token")
		assert.Contains(t, data, "refresh_token")
	})

	t.Run("GET /api/v1/me", func(t *testing.T) {
		user := suite.CreateTestUser("metest@example.com", "Me Test User", 1)
		token := suite.GetAuthToken(user.ID, "admin")
		
		req := httptest.NewRequest("GET", "/api/v1/me", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		
		resp, err := suite.app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
		
		var response map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&response)
		userData := response["data"].(map[string]interface{})
		assert.Equal(t, "metest@example.com", userData["email"])
	})

	t.Run("POST /api/v1/change-password", func(t *testing.T) {
		user := suite.CreateTestUser("changepass@example.com", "Change Pass User", 1)
		token := suite.GetAuthToken(user.ID, "admin")
		
		payload := map[string]string{
			"current_password": "password123",
			"new_password":     "newpassword123",
			"confirm_password": "newpassword123",
		}
		
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest("POST", "/api/v1/change-password", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)
		
		resp, err := suite.app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
	})

	t.Run("POST /api/v1/logout", func(t *testing.T) {
		user := suite.CreateTestUser("logouttest@example.com", "Logout Test User", 1)
		token := suite.GetAuthToken(user.ID, "admin")
		
		req := httptest.NewRequest("POST", "/api/v1/logout", nil)
		req.Header.Set("Authorization", "Bearer "+token)
		
		resp, err := suite.app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
	})
}

// Test User Management Endpoints
func (suite *APIEndpointsTestSuite) TestUserManagementEndpoints() {
	t := suite.T()
	adminUser := suite.CreateTestUser("admin@example.com", "Admin User", 1)
	adminToken := suite.GetAuthToken(adminUser.ID, "admin")

	t.Run("GET /api/v1/users", func(t *testing.T) {
		// Create test users
		for i := 1; i <= 5; i++ {
			suite.CreateTestUser(fmt.Sprintf("user%d@example.com", i), fmt.Sprintf("User %d", i), 2)
		}
		
		req := httptest.NewRequest("GET", "/api/v1/users?page=1&limit=3", nil)
		req.Header.Set("Authorization", "Bearer "+adminToken)
		
		resp, err := suite.app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
		
		var response map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&response)
		data := response["data"].(map[string]interface{})
		users := data["data"].([]interface{})
		assert.Len(t, users, 3)
	})

	t.Run("POST /api/v1/users", func(t *testing.T) {
		payload := map[string]interface{}{
			"full_name": "Created User",
			"email":     "created@example.com",
			"password":  "password123",
			"role_id":   2,
		}
		
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest("POST", "/api/v1/users", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+adminToken)
		
		resp, err := suite.app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 201, resp.StatusCode)
	})

	t.Run("GET /api/v1/users/:id", func(t *testing.T) {
		user := suite.CreateTestUser("getuser@example.com", "Get User", 2)
		
		req := httptest.NewRequest("GET", "/api/v1/users/"+strconv.Itoa(int(user.ID)), nil)
		req.Header.Set("Authorization", "Bearer "+adminToken)
		
		resp, err := suite.app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
		
		var response map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&response)
		userData := response["data"].(map[string]interface{})
		assert.Equal(t, "getuser@example.com", userData["email"])
	})

	t.Run("PUT /api/v1/users/:id", func(t *testing.T) {
		user := suite.CreateTestUser("updateuser@example.com", "Update User", 2)
		
		payload := map[string]interface{}{
			"full_name": "Updated User Name",
		}
		
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest("PUT", "/api/v1/users/"+strconv.Itoa(int(user.ID)), bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+adminToken)
		
		resp, err := suite.app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
	})

	t.Run("DELETE /api/v1/users/:id", func(t *testing.T) {
		user := suite.CreateTestUser("deleteuser@example.com", "Delete User", 2)
		
		req := httptest.NewRequest("DELETE", "/api/v1/users/"+strconv.Itoa(int(user.ID)), nil)
		req.Header.Set("Authorization", "Bearer "+adminToken)
		
		resp, err := suite.app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
	})

	t.Run("GET /api/v1/users/stats", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/users/stats", nil)
		req.Header.Set("Authorization", "Bearer "+adminToken)
		
		resp, err := suite.app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
		
		var response map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&response)
		data := response["data"].(map[string]interface{})
		assert.Contains(t, data, "total_users")
	})
}

// Test Student Management Endpoints
func (suite *APIEndpointsTestSuite) TestStudentManagementEndpoints() {
	t := suite.T()
	adminUser := suite.CreateTestUser("admin2@example.com", "Admin User 2", 1)
	adminToken := suite.GetAuthToken(adminUser.ID, "admin")

	t.Run("GET /api/v1/students", func(t *testing.T) {
		// Create test students
		for i := 1; i <= 3; i++ {
			suite.CreateTestStudent(fmt.Sprintf("STU00%d", i), fmt.Sprintf("student%d@example.com", i), fmt.Sprintf("Student %d", i))
		}
		
		req := httptest.NewRequest("GET", "/api/v1/students", nil)
		req.Header.Set("Authorization", "Bearer "+adminToken)
		
		resp, err := suite.app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
		
		var response map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&response)
		data := response["data"].(map[string]interface{})
		students := data["data"].([]interface{})
		assert.GreaterOrEqual(t, len(students), 3)
	})

	t.Run("POST /api/v1/students", func(t *testing.T) {
		payload := map[string]interface{}{
			"full_name":  "New Student",
			"email":      "newstudent@example.com",
			"password":   "password123",
			"student_id": "STU999",
			"major_id":   1,
		}
		
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest("POST", "/api/v1/students", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+adminToken)
		
		resp, err := suite.app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 201, resp.StatusCode)
	})

	t.Run("GET /api/v1/students/:id", func(t *testing.T) {
		_, student := suite.CreateTestStudent("STU888", "getstudent@example.com", "Get Student")
		
		req := httptest.NewRequest("GET", "/api/v1/students/"+strconv.Itoa(int(student.ID)), nil)
		req.Header.Set("Authorization", "Bearer "+adminToken)
		
		resp, err := suite.app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
		
		var response map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&response)
		studentData := response["data"].(map[string]interface{})
		assert.Equal(t, "STU888", studentData["student_id"])
	})
}

// Test Instructor Management Endpoints
func (suite *APIEndpointsTestSuite) TestInstructorManagementEndpoints() {
	t := suite.T()
	adminUser := suite.CreateTestUser("admin3@example.com", "Admin User 3", 1)
	adminToken := suite.GetAuthToken(adminUser.ID, "admin")

	t.Run("GET /api/v1/instructors", func(t *testing.T) {
		// Create test instructors
		for i := 1; i <= 2; i++ {
			suite.CreateTestInstructor(fmt.Sprintf("INS00%d", i), fmt.Sprintf("instructor%d@example.com", i), fmt.Sprintf("Instructor %d", i))
		}
		
		req := httptest.NewRequest("GET", "/api/v1/instructors", nil)
		req.Header.Set("Authorization", "Bearer "+adminToken)
		
		resp, err := suite.app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
		
		var response map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&response)
		data := response["data"].(map[string]interface{})
		instructors := data["data"].([]interface{})
		assert.GreaterOrEqual(t, len(instructors), 2)
	})

	t.Run("POST /api/v1/instructors", func(t *testing.T) {
		payload := map[string]interface{}{
			"full_name":     "New Instructor",
			"email":         "newinstructor@example.com",
			"password":      "password123",
			"instructor_id": "INS999",
			"faculty_id":    1,
		}
		
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest("POST", "/api/v1/instructors", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+adminToken)
		
		resp, err := suite.app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 201, resp.StatusCode)
	})
}

// Test Course Management Endpoints
func (suite *APIEndpointsTestSuite) TestCourseManagementEndpoints() {
	t := suite.T()
	adminUser := suite.CreateTestUser("admin4@example.com", "Admin User 4", 1)
	adminToken := suite.GetAuthToken(adminUser.ID, "admin")

	t.Run("GET /api/v1/courses", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/courses", nil)
		req.Header.Set("Authorization", "Bearer "+adminToken)
		
		resp, err := suite.app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
	})

	t.Run("POST /api/v1/courses", func(t *testing.T) {
		payload := map[string]interface{}{
			"name":        "Test Course",
			"code":        "TC001",
			"credits":     3,
			"description": "Test course description",
		}
		
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest("POST", "/api/v1/courses", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+adminToken)
		
		resp, err := suite.app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 201, resp.StatusCode)
	})
}

// Test File Upload Endpoints
func (suite *APIEndpointsTestSuite) TestFileUploadEndpoints() {
	t := suite.T()
	adminUser := suite.CreateTestUser("admin5@example.com", "Admin User 5", 1)
	adminToken := suite.GetAuthToken(adminUser.ID, "admin")

	t.Run("POST /api/v1/users/bulk-excel", func(t *testing.T) {
		// Create test Excel file
		f := excelize.NewFile()
		defer f.Close()

		// Set headers
		f.SetCellValue("Sheet1", "A1", "full_name")
		f.SetCellValue("Sheet1", "B1", "email")
		f.SetCellValue("Sheet1", "C1", "password")

		// Set data
		f.SetCellValue("Sheet1", "A2", "Excel User 1")
		f.SetCellValue("Sheet1", "B2", "excel1@example.com")
		f.SetCellValue("Sheet1", "C2", "password123")

		// Save to temporary file
		tempFile := "/tmp/test_users.xlsx"
		err := f.SaveAs(tempFile)
		suite.Require().NoError(err)
		defer os.Remove(tempFile)

		// Create multipart form
		var buf bytes.Buffer
		writer := multipart.NewWriter(&buf)

		// Add file
		file, err := os.Open(tempFile)
		suite.Require().NoError(err)
		defer file.Close()

		part, err := writer.CreateFormFile("file", "test_users.xlsx")
		suite.Require().NoError(err)
		_, err = io.Copy(part, file)
		suite.Require().NoError(err)

		// Add role_id
		err = writer.WriteField("role_id", "2")
		suite.Require().NoError(err)

		err = writer.Close()
		suite.Require().NoError(err)

		// Test bulk create from Excel
		req := httptest.NewRequest("POST", "/api/v1/users/bulk-excel", &buf)
		req.Header.Set("Content-Type", writer.FormDataContentType())
		req.Header.Set("Authorization", "Bearer "+adminToken)

		resp, err := suite.app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
	})
}

// Test PDF Generation Endpoints
func (suite *APIEndpointsTestSuite) TestPDFGenerationEndpoints() {
	t := suite.T()
	adminUser := suite.CreateTestUser("admin6@example.com", "Admin User 6", 1)
	adminToken := suite.GetAuthToken(adminUser.ID, "admin")

	t.Run("POST /api/v1/pdf/internship-letter", func(t *testing.T) {
		payload := map[string]interface{}{
			"student_name":    "Test Student",
			"student_id":      "STU001",
			"company_name":    "Test Company",
			"position":        "Software Developer",
			"start_date":      "2024-01-01",
			"end_date":        "2024-06-30",
			"instructor_name": "Test Instructor",
		}
		
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest("POST", "/api/v1/pdf/internship-letter", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+adminToken)
		
		resp, err := suite.app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
		assert.Equal(t, "application/pdf", resp.Header.Get("Content-Type"))
	})

	t.Run("POST /api/v1/pdf/report", func(t *testing.T) {
		payload := map[string]interface{}{
			"report_type": "student_list",
			"title":       "Student List Report",
			"filters": map[string]interface{}{
				"major_id": 1,
			},
		}
		
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest("POST", "/api/v1/pdf/report", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+adminToken)
		
		resp, err := suite.app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
		assert.Equal(t, "application/pdf", resp.Header.Get("Content-Type"))
	})
}

// Test Health Check Endpoints
func (suite *APIEndpointsTestSuite) TestHealthCheckEndpoints() {
	t := suite.T()

	t.Run("GET /health", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/health", nil)
		
		resp, err := suite.app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
		
		var response map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&response)
		assert.Equal(t, "ok", response["status"])
	})

	t.Run("GET /health/db", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/health/db", nil)
		
		resp, err := suite.app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
		
		var response map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&response)
		assert.Equal(t, "ok", response["status"])
	})
}

// Test Error Handling
func (suite *APIEndpointsTestSuite) TestErrorHandling() {
	t := suite.T()

	t.Run("404 Not Found", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/nonexistent", nil)
		
		resp, err := suite.app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 404, resp.StatusCode)
	})

	t.Run("401 Unauthorized", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/users", nil)
		
		resp, err := suite.app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 401, resp.StatusCode)
	})

	t.Run("400 Bad Request", func(t *testing.T) {
		payload := map[string]interface{}{
			"invalid": "data",
		}
		
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest("POST", "/api/v1/register", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		
		resp, err := suite.app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 400, resp.StatusCode)
	})
}

func TestAPIEndpointsTestSuite(t *testing.T) {
	suite.Run(t, new(APIEndpointsTestSuite))
}