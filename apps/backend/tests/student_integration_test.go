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

func TestStudentManagement(t *testing.T) {
	app := setupMockStudentApp()

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
		assert.NotNil(t, response["data"])
	})

	t.Run("CreateStudent", func(t *testing.T) {
		studentData := map[string]interface{}{
			"user_id":    3,
			"name":       "Alice",
			"surname":    "Johnson",
			"student_id": "STU003",
			"campus_id":  1,
			"gpax":       3.7,
		}

		jsonData, err := json.Marshal(studentData)
		require.NoError(t, err)

		req := httptest.NewRequest("POST", "/api/v1/students", bytes.NewReader(jsonData))
		req.Header.Set("Content-Type", "application/json")
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, 201, resp.StatusCode)

		body, err := io.ReadAll(resp.Body)
		require.NoError(t, err)

		var response map[string]interface{}
		err = json.Unmarshal(body, &response)
		require.NoError(t, err)

		assert.Equal(t, "Student created successfully", response["message"])
		assert.NotNil(t, response["data"])
	})

	t.Run("EnrollStudent", func(t *testing.T) {
		enrollmentData := map[string]interface{}{
			"student_id":        1,
			"course_section_id": 1,
			"status":           "enrolled",
		}

		jsonData, err := json.Marshal(enrollmentData)
		require.NoError(t, err)

		req := httptest.NewRequest("POST", "/api/v1/students/enroll", bytes.NewReader(jsonData))
		req.Header.Set("Content-Type", "application/json")
		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, 201, resp.StatusCode)

		body, err := io.ReadAll(resp.Body)
		require.NoError(t, err)

		var response map[string]interface{}
		err = json.Unmarshal(body, &response)
		require.NoError(t, err)

		assert.Equal(t, "Student enrolled successfully", response["message"])
		assert.NotNil(t, response["data"])
	})
}

func setupMockStudentApp() *fiber.App {
	app := fiber.New()
	api := app.Group("/api/v1")

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
		var req map[string]interface{}
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
		}
		
		return c.Status(201).JSON(fiber.Map{
			"message": "Student created successfully",
			"data":    req,
		})
	})

	api.Post("/students/enroll", func(c *fiber.Ctx) error {
		var req map[string]interface{}
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid request body"})
		}
		
		return c.Status(201).JSON(fiber.Map{
			"message": "Student enrolled successfully",
			"data":    req,
		})
	})

	return app
}