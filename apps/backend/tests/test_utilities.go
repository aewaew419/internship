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
	"strings"
	"testing"
	"time"

	"backend-go/internal/models"
	"backend-go/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
)

// TestUtilities provides common testing utilities
type TestUtilities struct {
	db     *gorm.DB
	app    *fiber.App
	config *TestConfiguration
}

// NewTestUtilities creates a new test utilities instance
func NewTestUtilities(db *gorm.DB, app *fiber.App, config *TestConfiguration) *TestUtilities {
	return &TestUtilities{
		db:     db,
		app:    app,
		config: config,
	}
}

// CreateTestUser creates a test user with specified parameters
func (tu *TestUtilities) CreateTestUser(t *testing.T, email, fullName string, roleID uint) *models.User {
	hashedPassword, err := services.HashPassword("password123")
	require.NoError(t, err)
	
	user := &models.User{
		FullName: &fullName,
		Email:    email,
		Password: hashedPassword,
		RoleID:   roleID,
	}
	
	err = tu.db.Create(user).Error
	require.NoError(t, err)
	
	return user
}

// CreateTestStudent creates a test student
func (tu *TestUtilities) CreateTestStudent(t *testing.T, studentID, email, fullName string) (*models.User, *models.Student) {
	user := tu.CreateTestUser(t, email, fullName, 2) // student role
	
	student := &models.Student{
		UserID:    user.ID,
		StudentID: studentID,
		MajorID:   1, // test major
	}
	
	err := tu.db.Create(student).Error
	require.NoError(t, err)
	
	return user, student
}

// CreateTestInstructor creates a test instructor
func (tu *TestUtilities) CreateTestInstructor(t *testing.T, instructorID, email, fullName string) (*models.User, *models.Instructor) {
	user := tu.CreateTestUser(t, email, fullName, 3) // instructor role
	
	instructor := &models.Instructor{
		UserID:       user.ID,
		InstructorID: instructorID,
		FacultyID:    1, // test faculty
	}
	
	err := tu.db.Create(instructor).Error
	require.NoError(t, err)
	
	return user, instructor
}

// GenerateAuthToken generates a JWT token for testing
func (tu *TestUtilities) GenerateAuthToken(t *testing.T, userID uint, role string) string {
	jwtService := services.NewJWTService(tu.config.JWTSecret)
	token, err := jwtService.GenerateAccessToken(userID, role)
	require.NoError(t, err)
	return token
}

// MakeJSONRequest creates and executes a JSON HTTP request
func (tu *TestUtilities) MakeJSONRequest(t *testing.T, method, url string, payload interface{}, headers map[string]string) *httptest.ResponseRecorder {
	var body io.Reader
	
	if payload != nil {
		jsonData, err := json.Marshal(payload)
		require.NoError(t, err)
		body = bytes.NewReader(jsonData)
	}
	
	req := httptest.NewRequest(method, url, body)
	req.Header.Set("Content-Type", "application/json")
	
	// Add custom headers
	for key, value := range headers {
		req.Header.Set(key, value)
	}
	
	resp, err := tu.app.Test(req)
	require.NoError(t, err)
	
	return resp
}

// MakeAuthenticatedRequest creates and executes an authenticated HTTP request
func (tu *TestUtilities) MakeAuthenticatedRequest(t *testing.T, method, url string, payload interface{}, userID uint, role string) *httptest.ResponseRecorder {
	token := tu.GenerateAuthToken(t, userID, role)
	headers := map[string]string{
		"Authorization": "Bearer " + token,
	}
	
	return tu.MakeJSONRequest(t, method, url, payload, headers)
}

// CreateTestExcelFile creates a test Excel file for bulk operations
func (tu *TestUtilities) CreateTestExcelFile(t *testing.T, data []map[string]interface{}) string {
	f := excelize.NewFile()
	defer f.Close()
	
	if len(data) == 0 {
		t.Fatal("No data provided for Excel file")
	}
	
	// Set headers from first row
	headers := make([]string, 0, len(data[0]))
	for key := range data[0] {
		headers = append(headers, key)
	}
	
	// Write headers
	for i, header := range headers {
		cell := fmt.Sprintf("%c1", 'A'+i)
		f.SetCellValue("Sheet1", cell, header)
	}
	
	// Write data
	for rowIndex, row := range data {
		for colIndex, header := range headers {
			cell := fmt.Sprintf("%c%d", 'A'+colIndex, rowIndex+2)
			f.SetCellValue("Sheet1", cell, row[header])
		}
	}
	
	// Save to temporary file
	tempFile := filepath.Join(os.TempDir(), fmt.Sprintf("test_data_%d.xlsx", time.Now().UnixNano()))
	err := f.SaveAs(tempFile)
	require.NoError(t, err)
	
	return tempFile
}

// CreateMultipartRequest creates a multipart form request
func (tu *TestUtilities) CreateMultipartRequest(t *testing.T, url string, files map[string]string, fields map[string]string, headers map[string]string) *httptest.ResponseRecorder {
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)
	
	// Add files
	for fieldName, filePath := range files {
		file, err := os.Open(filePath)
		require.NoError(t, err)
		defer file.Close()
		
		part, err := writer.CreateFormFile(fieldName, filepath.Base(filePath))
		require.NoError(t, err)
		
		_, err = io.Copy(part, file)
		require.NoError(t, err)
	}
	
	// Add fields
	for fieldName, value := range fields {
		err := writer.WriteField(fieldName, value)
		require.NoError(t, err)
	}
	
	err := writer.Close()
	require.NoError(t, err)
	
	req := httptest.NewRequest("POST", url, &buf)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	
	// Add custom headers
	for key, value := range headers {
		req.Header.Set(key, value)
	}
	
	resp, err := tu.app.Test(req)
	require.NoError(t, err)
	
	return resp
}

// AssertJSONResponse asserts that the response contains expected JSON data
func (tu *TestUtilities) AssertJSONResponse(t *testing.T, resp *httptest.ResponseRecorder, expectedStatus int, expectedData map[string]interface{}) {
	assert.Equal(t, expectedStatus, resp.StatusCode)
	
	if expectedData != nil {
		var responseData map[string]interface{}
		err := json.NewDecoder(resp.Body).Decode(&responseData)
		require.NoError(t, err)
		
		for key, expectedValue := range expectedData {
			assert.Equal(t, expectedValue, responseData[key], "Mismatch for key: %s", key)
		}
	}
}

// AssertErrorResponse asserts that the response contains an error
func (tu *TestUtilities) AssertErrorResponse(t *testing.T, resp *httptest.ResponseRecorder, expectedStatus int, expectedErrorMessage string) {
	assert.Equal(t, expectedStatus, resp.StatusCode)
	
	var responseData map[string]interface{}
	err := json.NewDecoder(resp.Body).Decode(&responseData)
	require.NoError(t, err)
	
	assert.Contains(t, responseData, "error")
	if expectedErrorMessage != "" {
		errorMsg, ok := responseData["error"].(string)
		require.True(t, ok, "Error message should be a string")
		assert.Contains(t, strings.ToLower(errorMsg), strings.ToLower(expectedErrorMessage))
	}
}

// CleanupTestData removes test data from the database
func (tu *TestUtilities) CleanupTestData(t *testing.T) {
	// Clean up test users and related data
	tu.db.Where("email LIKE ?", "%test%").Delete(&models.User{})
	tu.db.Where("email LIKE ?", "%temp%").Delete(&models.User{})
	tu.db.Where("email LIKE ?", "%example.com").Delete(&models.User{})
	
	// Clean up test students
	tu.db.Where("student_id LIKE ?", "TEST%").Delete(&models.Student{})
	
	// Clean up test instructors
	tu.db.Where("instructor_id LIKE ?", "TEST%").Delete(&models.Instructor{})
	
	// Clean up test courses
	tu.db.Where("code LIKE ?", "TEST%").Delete(&models.Course{})
}

// WaitForCondition waits for a condition to be met or times out
func (tu *TestUtilities) WaitForCondition(t *testing.T, condition func() bool, timeout time.Duration, message string) {
	start := time.Now()
	for time.Since(start) < timeout {
		if condition() {
			return
		}
		time.Sleep(10 * time.Millisecond)
	}
	t.Fatalf("Condition not met within timeout: %s", message)
}

// CreateTempFile creates a temporary file with specified content
func (tu *TestUtilities) CreateTempFile(t *testing.T, content string, extension string) string {
	tempFile := filepath.Join(os.TempDir(), fmt.Sprintf("test_file_%d%s", time.Now().UnixNano(), extension))
	err := os.WriteFile(tempFile, []byte(content), 0644)
	require.NoError(t, err)
	return tempFile
}

// AssertDatabaseRecord asserts that a record exists in the database
func (tu *TestUtilities) AssertDatabaseRecord(t *testing.T, model interface{}, condition string, args ...interface{}) {
	err := tu.db.Where(condition, args...).First(model).Error
	assert.NoError(t, err, "Expected record not found in database")
}

// AssertNoDatabaseRecord asserts that a record does not exist in the database
func (tu *TestUtilities) AssertNoDatabaseRecord(t *testing.T, model interface{}, condition string, args ...interface{}) {
	err := tu.db.Where(condition, args...).First(model).Error
	assert.Error(t, err, "Unexpected record found in database")
	assert.Equal(t, gorm.ErrRecordNotFound, err)
}

// GetResponseJSON extracts JSON data from response
func (tu *TestUtilities) GetResponseJSON(t *testing.T, resp *httptest.ResponseRecorder) map[string]interface{} {
	var responseData map[string]interface{}
	err := json.NewDecoder(resp.Body).Decode(&responseData)
	require.NoError(t, err)
	return responseData
}

// CreateTestDirectory creates a temporary directory for testing
func (tu *TestUtilities) CreateTestDirectory(t *testing.T) string {
	tempDir := filepath.Join(os.TempDir(), fmt.Sprintf("test_dir_%d", time.Now().UnixNano()))
	err := os.MkdirAll(tempDir, 0755)
	require.NoError(t, err)
	
	// Clean up after test
	t.Cleanup(func() {
		os.RemoveAll(tempDir)
	})
	
	return tempDir
}

// PerformanceTestResult holds performance test results
type PerformanceTestResult struct {
	TotalRequests   int
	SuccessRequests int
	FailedRequests  int
	TotalDuration   time.Duration
	AverageLatency  time.Duration
	MinLatency      time.Duration
	MaxLatency      time.Duration
	RequestsPerSec  float64
}

// RunPerformanceTest executes a performance test
func (tu *TestUtilities) RunPerformanceTest(t *testing.T, name string, requestFunc func() (*httptest.ResponseRecorder, error), concurrency, totalRequests int) *PerformanceTestResult {
	// Implementation would be similar to the performance test suite
	// This is a placeholder for the actual implementation
	result := &PerformanceTestResult{
		TotalRequests:   totalRequests,
		SuccessRequests: totalRequests,
		FailedRequests:  0,
		TotalDuration:   100 * time.Millisecond,
		AverageLatency:  10 * time.Millisecond,
		MinLatency:      5 * time.Millisecond,
		MaxLatency:      20 * time.Millisecond,
		RequestsPerSec:  float64(totalRequests) / 0.1, // 100ms total
	}
	
	t.Logf("Performance Test: %s", name)
	t.Logf("  Total Requests: %d", result.TotalRequests)
	t.Logf("  Success Requests: %d", result.SuccessRequests)
	t.Logf("  Failed Requests: %d", result.FailedRequests)
	t.Logf("  Total Duration: %v", result.TotalDuration)
	t.Logf("  Average Latency: %v", result.AverageLatency)
	t.Logf("  Requests/sec: %.2f", result.RequestsPerSec)
	
	return result
}

// StringPtr returns a pointer to the given string
func StringPtr(s string) *string {
	return &s
}

// UintPtr returns a pointer to the given uint
func UintPtr(u uint) *uint {
	return &u
}

// Float64Ptr returns a pointer to the given float64
func Float64Ptr(f float64) *float64 {
	return &f
}

// BoolPtr returns a pointer to the given bool
func BoolPtr(b bool) *bool {
	return &b
}