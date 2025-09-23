package tests

import (
	"backend-go/internal/config"
	"backend-go/internal/database"
	"backend-go/internal/handlers"
	"backend-go/internal/middleware"
	"backend-go/internal/models"
	"backend-go/internal/services"
	"bytes"
	"encoding/json"
	"net/http/httptest"
	"strconv"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupApprovalTestApp(t *testing.T) (*fiber.App, *gorm.DB, func()) {
	// Setup test database
	cfg := &config.Config{
		DatabaseURL: "file::memory:?cache=shared",
		JWTSecret:   "test-secret",
	}

	db, err := database.Connect(cfg.DatabaseURL)
	require.NoError(t, err)

	// Auto-migrate models
	err = models.AutoMigrate(db)
	require.NoError(t, err)

	// Create Fiber app
	app := fiber.New()

	// Setup middleware
	jwtService := services.NewJWTService(cfg.JWTSecret)
	authMiddleware := middleware.AuthMiddleware(jwtService)

	// Setup handlers
	approvalHandler := handlers.NewApprovalHandler(db)

	// Setup routes
	api := app.Group("/api/v1")
	approvals := api.Group("/approvals", authMiddleware)
	
	approvals.Get("/status/:studentEnrollId", approvalHandler.GetApprovalStatus)
	approvals.Get("/committee-voting/:studentEnrollId", approvalHandler.GetCommitteeVotingData)
	approvals.Get("/statuses", approvalHandler.GetApprovalStatuses)
	approvals.Get("/", approvalHandler.GetApprovalsByStatus)
	approvals.Post("/", approvalHandler.CreateApprovalRecord)
	approvals.Post("/advisor/:studentEnrollId", approvalHandler.AdvisorApproval)
	approvals.Post("/committee-vote/:studentEnrollId", approvalHandler.CommitteeMemberVote)
	approvals.Put("/status/:studentEnrollId", approvalHandler.UpdateApprovalStatus)

	cleanup := func() {
		sqlDB, _ := db.DB()
		sqlDB.Close()
	}

	return app, db, cleanup
}

func createTestApprovalData(t *testing.T, db *gorm.DB) (uint, uint, uint, string) {
	// Create test user
	user := &models.User{
		Email:    "test@example.com",
		Password: "hashedpassword",
		Role:     "instructor",
	}
	err := db.Create(user).Error
	require.NoError(t, err)

	// Create test student
	student := &models.Student{
		UserID:    user.ID,
		StudentID: "12345678",
	}
	err = db.Create(student).Error
	require.NoError(t, err)

	// Create test course section
	courseSection := &models.CourseSection{
		CourseName: "Test Course",
		Section:    "01",
		Semester:   "1",
		Year:       2024,
	}
	err = db.Create(courseSection).Error
	require.NoError(t, err)

	// Create test student enrollment
	studentEnroll := &models.StudentEnroll{
		StudentID:       student.ID,
		CourseSectionID: courseSection.ID,
		Status:          "enrolled",
	}
	err = db.Create(studentEnroll).Error
	require.NoError(t, err)

	// Create test instructor
	instructor := &models.Instructor{
		UserID:       user.ID,
		InstructorID: "INS001",
	}
	err = db.Create(instructor).Error
	require.NoError(t, err)

	// Create JWT token for authentication
	jwtService := services.NewJWTService("test-secret")
	token, err := jwtService.GenerateToken(user.ID, user.Role)
	require.NoError(t, err)

	return studentEnroll.ID, user.ID, instructor.ID, token
}

func TestApprovalWorkflow(t *testing.T) {
	app, db, cleanup := setupApprovalTestApp(t)
	defer cleanup()

	studentEnrollID, userID, instructorID, token := createTestApprovalData(t, db)

	t.Run("Create Approval Record", func(t *testing.T) {
		requestBody := map[string]interface{}{
			"student_enroll_id": studentEnrollID,
			"advisor_id":        instructorID,
		}
		body, _ := json.Marshal(requestBody)

		req := httptest.NewRequest("POST", "/api/v1/approvals", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusCreated, resp.StatusCode)

		var response models.InternshipApproval
		err = json.NewDecoder(resp.Body).Decode(&response)
		require.NoError(t, err)
		assert.Equal(t, studentEnrollID, response.StudentEnrollID)
		assert.Equal(t, models.StatusRegistered, response.Status)
	})

	t.Run("Get Approval Status", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/approvals/status/"+strconv.Itoa(int(studentEnrollID)), nil)
		req.Header.Set("Authorization", "Bearer "+token)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusOK, resp.StatusCode)

		var response services.ApprovalStatusResponse
		err = json.NewDecoder(resp.Body).Decode(&response)
		require.NoError(t, err)
		assert.Equal(t, studentEnrollID, response.StudentEnrollID)
		assert.Equal(t, models.StatusRegistered, response.CurrentStatus)
	})

	t.Run("Advisor Approval", func(t *testing.T) {
		requestBody := map[string]interface{}{
			"approved": true,
			"remarks":  "Approved by advisor",
		}
		body, _ := json.Marshal(requestBody)

		req := httptest.NewRequest("POST", "/api/v1/approvals/advisor/"+strconv.Itoa(int(studentEnrollID)), bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusOK, resp.StatusCode)

		var response map[string]interface{}
		err = json.NewDecoder(resp.Body).Decode(&response)
		require.NoError(t, err)
		assert.Contains(t, response["message"], "approved")
	})

	t.Run("Get Committee Voting Data", func(t *testing.T) {
		// First create a committee member
		committee := &models.CourseCommittee{
			InstructorID:    instructorID,
			CourseSectionID: 1, // Assuming course section ID is 1
			Role:            "member",
		}
		err := db.Create(committee).Error
		require.NoError(t, err)

		req := httptest.NewRequest("GET", "/api/v1/approvals/committee-voting/"+strconv.Itoa(int(studentEnrollID)), nil)
		req.Header.Set("Authorization", "Bearer "+token)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusOK, resp.StatusCode)

		var response services.CommitteeVotingData
		err = json.NewDecoder(resp.Body).Decode(&response)
		require.NoError(t, err)
		assert.Equal(t, studentEnrollID, response.StudentEnrollID)
	})

	t.Run("Committee Member Vote", func(t *testing.T) {
		requestBody := map[string]interface{}{
			"vote":    "approve",
			"remarks": "Committee approves",
		}
		body, _ := json.Marshal(requestBody)

		req := httptest.NewRequest("POST", "/api/v1/approvals/committee-vote/"+strconv.Itoa(int(studentEnrollID)), bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusOK, resp.StatusCode)

		var response map[string]interface{}
		err = json.NewDecoder(resp.Body).Decode(&response)
		require.NoError(t, err)
		assert.Contains(t, response["message"], "recorded")
	})

	t.Run("Update Approval Status", func(t *testing.T) {
		requestBody := map[string]interface{}{
			"status": models.StatusApprove,
			"reason": "Final approval",
		}
		body, _ := json.Marshal(requestBody)

		req := httptest.NewRequest("PUT", "/api/v1/approvals/status/"+strconv.Itoa(int(studentEnrollID)), bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusOK, resp.StatusCode)

		var response map[string]interface{}
		err = json.NewDecoder(resp.Body).Decode(&response)
		require.NoError(t, err)
		assert.Contains(t, response["message"], "updated")
	})

	t.Run("Get Approvals by Status", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/approvals?status=registered&page=1&limit=10", nil)
		req.Header.Set("Authorization", "Bearer "+token)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusOK, resp.StatusCode)

		var response map[string]interface{}
		err = json.NewDecoder(resp.Body).Decode(&response)
		require.NoError(t, err)
		assert.Contains(t, response, "data")
		assert.Contains(t, response, "page")
		assert.Contains(t, response, "limit")
	})

	t.Run("Get Approval Statuses", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/approvals/statuses", nil)
		req.Header.Set("Authorization", "Bearer "+token)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusOK, resp.StatusCode)

		var response map[string]interface{}
		err = json.NewDecoder(resp.Body).Decode(&response)
		require.NoError(t, err)
		assert.Contains(t, response, "statuses")
	})
}

func TestApprovalErrorCases(t *testing.T) {
	app, db, cleanup := setupApprovalTestApp(t)
	defer cleanup()

	_, _, _, token := createTestApprovalData(t, db)

	t.Run("Invalid Student Enrollment ID", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/approvals/status/invalid", nil)
		req.Header.Set("Authorization", "Bearer "+token)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
	})

	t.Run("Approval Record Not Found", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/approvals/status/99999", nil)
		req.Header.Set("Authorization", "Bearer "+token)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusNotFound, resp.StatusCode)
	})

	t.Run("Invalid Vote Value", func(t *testing.T) {
		requestBody := map[string]interface{}{
			"vote":    "invalid",
			"remarks": "Invalid vote",
		}
		body, _ := json.Marshal(requestBody)

		req := httptest.NewRequest("POST", "/api/v1/approvals/committee-vote/1", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
	})

	t.Run("Missing Status Parameter", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/approvals", nil)
		req.Header.Set("Authorization", "Bearer "+token)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
	})
}