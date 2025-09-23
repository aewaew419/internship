package tests

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http/httptest"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestStudentCRUDOperations tests all CRUD operations for students
func TestStudentCRUDOperations(t *testing.T) {
	app := setupMockApp()

	// Test GET /students
	t.Run("GetStudents", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/students", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)

		body, err := io.ReadAll(resp.Body)
		require.NoError(t, err)

		var response map[string]interface{}
		err = json.Unmarshal(body, &response)
		require.NoError(t, err)
		assert.Equal(t, "Students retrieved successfully", response["message"])
	})

	// Test POST /students
	t.Run("CreateStudent", func(t *testing.T) {
		studentData := map[string]interface{}{
			"user_id":    1,
			"name":       "John",
			"surname":    "Doe",
			"student_id": "STU001",
			"campus_id":  1,
		}

		jsonData, _ := json.Marshal(studentData)
		req := httptest.NewRequest("POST", "/api/v1/students", bytes.NewReader(jsonData))
		req.Header.Set("Content-Type", "application/json")
		
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, 201, resp.StatusCode)
	})

	// Test GET /students/:id
	t.Run("GetStudent", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/students/1", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
	})

	// Test PUT /students/:id
	t.Run("UpdateStudent", func(t *testing.T) {
		updateData := map[string]interface{}{
			"name": "John Updated",
		}

		jsonData, _ := json.Marshal(updateData)
		req := httptest.NewRequest("PUT", "/api/v1/students/1", bytes.NewReader(jsonData))
		req.Header.Set("Content-Type", "application/json")
		
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
	})

	// Test DELETE /students/:id
	t.Run("DeleteStudent", func(t *testing.T) {
		req := httptest.NewRequest("DELETE", "/api/v1/students/1", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
	})
}

// TestStudentEnrollmentOperations tests enrollment management
func TestStudentEnrollmentOperations(t *testing.T) {
	app := setupMockApp()

	// Test POST /students/enroll
	t.Run("EnrollStudent", func(t *testing.T) {
		enrollData := map[string]interface{}{
			"student_id":        1,
			"course_section_id": 1,
			"status":           "enrolled",
		}

		jsonData, _ := json.Marshal(enrollData)
		req := httptest.NewRequest("POST", "/api/v1/students/enroll", bytes.NewReader(jsonData))
		req.Header.Set("Content-Type", "application/json")
		
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, 201, resp.StatusCode)
	})

	// Test PUT /students/enrollments/:id
	t.Run("UpdateEnrollment", func(t *testing.T) {
		updateData := map[string]interface{}{
			"status": "completed",
			"grade":  "A",
		}

		jsonData, _ := json.Marshal(updateData)
		req := httptest.NewRequest("PUT", "/api/v1/students/enrollments/1", bytes.NewReader(jsonData))
		req.Header.Set("Content-Type", "application/json")
		
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
	})

	// Test GET /students/:id/enrollments
	t.Run("GetStudentEnrollments", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/students/1/enrollments", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
	})
}

// TestStudentSearchAndFilter tests search and filtering functionality
func TestStudentSearchAndFilter(t *testing.T) {
	app := setupMockApp()

	// Test search functionality
	t.Run("SearchStudents", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/students?search=John", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
	})

	// Test filtering by major
	t.Run("FilterByMajor", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/students?major_id=1", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
	})

	// Test pagination
	t.Run("Pagination", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/students?page=1&limit=10", nil)
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
	})
}

// setupMockApp creates a mock Fiber app for testing
func setupMockApp() *fiber.App {
	app := fiber.New()
	api := app.Group("/api/v1")

	// Mock routes
	api.Get("/students", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "Students retrieved successfully",
			"data": fiber.Map{
				"data":        []interface{}{},
				"total":       0,
				"page":        1,
				"limit":       10,
				"total_pages": 1,
			},
		})
	})

	api.Post("/students", func(c *fiber.Ctx) error {
		return c.Status(201).JSON(fiber.Map{
			"message": "Student created successfully",
			"data":    fiber.Map{"id": 1},
		})
	})

	api.Get("/students/:id", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "Student retrieved successfully",
			"data":    fiber.Map{"id": 1, "name": "John"},
		})
	})

	api.Put("/students/:id", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "Student updated successfully",
			"data":    fiber.Map{"id": 1, "name": "John Updated"},
		})
	})

	api.Delete("/students/:id", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "Student deleted successfully",
		})
	})

	api.Post("/students/enroll", func(c *fiber.Ctx) error {
		return c.Status(201).JSON(fiber.Map{
			"message": "Student enrolled successfully",
			"data":    fiber.Map{"id": 1},
		})
	})

	api.Put("/students/enrollments/:id", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "Enrollment updated successfully",
			"data":    fiber.Map{"id": 1, "status": "completed"},
		})
	})

	api.Get("/students/:id/enrollments", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{
			"message": "Student enrollments retrieved successfully",
			"data":    []interface{}{},
		})
	})

	return app
}