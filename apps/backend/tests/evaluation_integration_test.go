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
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setupEvaluationTestApp(t *testing.T) (*fiber.App, *gorm.DB, func()) {
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
	evaluationHandler := handlers.NewEvaluationHandler(db)

	// Setup routes
	api := app.Group("/api/v1")
	evaluations := api.Group("/evaluations", authMiddleware)
	
	evaluations.Get("/summary/:studentTrainingId", evaluationHandler.GetEvaluationSummary)
	evaluations.Get("/", evaluationHandler.GetEvaluationsByType)
	evaluations.Get("/overdue", evaluationHandler.GetOverdueEvaluations)
	evaluations.Get("/stats", evaluationHandler.GetEvaluationStats)
	evaluations.Get("/student/:studentTrainingId/status", evaluationHandler.CheckStudentEvaluationStatus)
	evaluations.Get("/instructor/:instructorId/assignments", evaluationHandler.GetInstructorAssignments)
	evaluations.Get("/types", evaluationHandler.GetEvaluationTypes)
	evaluations.Get("/statuses", evaluationHandler.GetEvaluationStatuses)
	evaluations.Post("/trackers", evaluationHandler.CreateEvaluationTrackers)
	evaluations.Post("/complete", evaluationHandler.MarkEvaluationCompleted)
	evaluations.Post("/update-overdue", evaluationHandler.UpdateOverdueEvaluations)
	evaluations.Put("/:id/status", evaluationHandler.UpdateEvaluationStatus)
	evaluations.Put("/:id/assign", evaluationHandler.AssignEvaluator)

	cleanup := func() {
		sqlDB, _ := db.DB()
		sqlDB.Close()
	}

	return app, db, cleanup
}

func createTestEvaluationData(t *testing.T, db *gorm.DB) (uint, uint, uint, string) {
	// Create test user
	user := &models.User{
		Email:    "test@example.com",
		Password: "hashedpassword",
		Role:     "student",
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

	// Create test company
	company := &models.Company{
		CompanyNameTh: "บริษัท ทดสอบ จำกัด",
		CompanyNameEn: "Test Company Ltd.",
	}
	err = db.Create(company).Error
	require.NoError(t, err)

	// Create test student training
	studentTraining := &models.StudentTraining{
		StudentEnrollID: studentEnroll.ID,
		CompanyID:       company.ID,
		StartDate:       time.Now(),
		EndDate:         time.Now().AddDate(0, 3, 0), // 3 months later
	}
	err = db.Create(studentTraining).Error
	require.NoError(t, err)

	// Create JWT token for authentication
	jwtService := services.NewJWTService("test-secret")
	token, err := jwtService.GenerateToken(user.ID, user.Role)
	require.NoError(t, err)

	return studentTraining.ID, user.ID, company.ID, token
}

func TestEvaluationWorkflow(t *testing.T) {
	app, db, cleanup := setupEvaluationTestApp(t)
	defer cleanup()

	studentTrainingID, userID, _, token := createTestEvaluationData(t, db)

	t.Run("Create Evaluation Trackers", func(t *testing.T) {
		requestBody := map[string]interface{}{
			"student_training_id": studentTrainingID,
		}
		body, _ := json.Marshal(requestBody)

		req := httptest.NewRequest("POST", "/api/v1/evaluations/trackers", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusCreated, resp.StatusCode)

		var response map[string]interface{}
		err = json.NewDecoder(resp.Body).Decode(&response)
		require.NoError(t, err)
		assert.Contains(t, response["message"], "created")
	})

	t.Run("Get Evaluation Summary", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/evaluations/summary/"+strconv.Itoa(int(studentTrainingID)), nil)
		req.Header.Set("Authorization", "Bearer "+token)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusOK, resp.StatusCode)

		var response services.EvaluationSummary
		err = json.NewDecoder(resp.Body).Decode(&response)
		require.NoError(t, err)
		assert.Equal(t, studentTrainingID, response.StudentTrainingID)
		assert.Len(t, response.Evaluations, 3) // Should have 3 evaluation types
	})

	t.Run("Get Evaluations by Type", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/evaluations?type=student_company&page=1&limit=10", nil)
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

	t.Run("Update Evaluation Status", func(t *testing.T) {
		// First get an evaluation ID
		var evaluation models.EvaluationStatusTracker
		err := db.Where("student_training_id = ?", studentTrainingID).First(&evaluation).Error
		require.NoError(t, err)

		requestBody := map[string]interface{}{
			"status":  models.EvalStatusInProgress,
			"remarks": "Started evaluation",
		}
		body, _ := json.Marshal(requestBody)

		req := httptest.NewRequest("PUT", "/api/v1/evaluations/"+strconv.Itoa(int(evaluation.ID))+"/status", bytes.NewReader(body))
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

	t.Run("Assign Evaluator", func(t *testing.T) {
		// First get an evaluation ID
		var evaluation models.EvaluationStatusTracker
		err := db.Where("student_training_id = ? AND evaluation_type = ?", studentTrainingID, models.EvalTypeVisitorStudent).First(&evaluation).Error
		require.NoError(t, err)

		dueDate := time.Now().AddDate(0, 0, 7) // 7 days from now
		requestBody := map[string]interface{}{
			"evaluator_id": userID,
			"due_date":     dueDate.Format(time.RFC3339),
		}
		body, _ := json.Marshal(requestBody)

		req := httptest.NewRequest("PUT", "/api/v1/evaluations/"+strconv.Itoa(int(evaluation.ID))+"/assign", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusOK, resp.StatusCode)

		var response map[string]interface{}
		err = json.NewDecoder(resp.Body).Decode(&response)
		require.NoError(t, err)
		assert.Contains(t, response["message"], "assigned")
	})

	t.Run("Mark Evaluation Completed", func(t *testing.T) {
		requestBody := map[string]interface{}{
			"student_training_id": studentTrainingID,
			"evaluation_type":     models.EvalTypeStudentCompany,
		}
		body, _ := json.Marshal(requestBody)

		req := httptest.NewRequest("POST", "/api/v1/evaluations/complete", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusOK, resp.StatusCode)

		var response map[string]interface{}
		err = json.NewDecoder(resp.Body).Decode(&response)
		require.NoError(t, err)
		assert.Contains(t, response["message"], "completed")
	})

	t.Run("Check Student Evaluation Status", func(t *testing.T) {
		// First create a student evaluation
		studentEval := &models.StudentEvaluateCompany{
			StudentTrainingID: studentTrainingID,
			Score:             85,
			Questions:         "Test questions",
			Comment:           "Good performance",
		}
		err := db.Create(studentEval).Error
		require.NoError(t, err)

		req := httptest.NewRequest("GET", "/api/v1/evaluations/student/"+strconv.Itoa(int(studentTrainingID))+"/status", nil)
		req.Header.Set("Authorization", "Bearer "+token)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusOK, resp.StatusCode)

		var response map[string]interface{}
		err = json.NewDecoder(resp.Body).Decode(&response)
		require.NoError(t, err)
		assert.True(t, response["has_evaluated"].(bool))
		assert.Contains(t, response, "evaluation_date")
	})

	t.Run("Get Instructor Assignments", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/evaluations/instructor/"+strconv.Itoa(int(userID))+"/assignments", nil)
		req.Header.Set("Authorization", "Bearer "+token)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusOK, resp.StatusCode)

		var response map[string]interface{}
		err = json.NewDecoder(resp.Body).Decode(&response)
		require.NoError(t, err)
		assert.Contains(t, response, "data")
	})

	t.Run("Get Overdue Evaluations", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/evaluations/overdue", nil)
		req.Header.Set("Authorization", "Bearer "+token)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusOK, resp.StatusCode)

		var response map[string]interface{}
		err = json.NewDecoder(resp.Body).Decode(&response)
		require.NoError(t, err)
		assert.Contains(t, response, "data")
	})

	t.Run("Get Evaluation Stats", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/evaluations/stats", nil)
		req.Header.Set("Authorization", "Bearer "+token)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusOK, resp.StatusCode)

		var response map[string]interface{}
		err = json.NewDecoder(resp.Body).Decode(&response)
		require.NoError(t, err)
		assert.Contains(t, response, "by_status")
		assert.Contains(t, response, "by_type")
		assert.Contains(t, response, "overdue_count")
	})

	t.Run("Update Overdue Evaluations", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/api/v1/evaluations/update-overdue", nil)
		req.Header.Set("Authorization", "Bearer "+token)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusOK, resp.StatusCode)

		var response map[string]interface{}
		err = json.NewDecoder(resp.Body).Decode(&response)
		require.NoError(t, err)
		assert.Contains(t, response["message"], "updated")
	})

	t.Run("Get Evaluation Types", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/evaluations/types", nil)
		req.Header.Set("Authorization", "Bearer "+token)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusOK, resp.StatusCode)

		var response map[string]interface{}
		err = json.NewDecoder(resp.Body).Decode(&response)
		require.NoError(t, err)
		assert.Contains(t, response, "types")
	})

	t.Run("Get Evaluation Statuses", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/evaluations/statuses", nil)
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

func TestEvaluationErrorCases(t *testing.T) {
	app, db, cleanup := setupEvaluationTestApp(t)
	defer cleanup()

	_, _, _, token := createTestEvaluationData(t, db)

	t.Run("Invalid Student Training ID", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/evaluations/summary/invalid", nil)
		req.Header.Set("Authorization", "Bearer "+token)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
	})

	t.Run("Student Training Not Found", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/evaluations/summary/99999", nil)
		req.Header.Set("Authorization", "Bearer "+token)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusInternalServerError, resp.StatusCode)
	})

	t.Run("Missing Type Parameter", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/api/v1/evaluations", nil)
		req.Header.Set("Authorization", "Bearer "+token)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
	})

	t.Run("Invalid Evaluation ID", func(t *testing.T) {
		requestBody := map[string]interface{}{
			"status":  models.EvalStatusCompleted,
			"remarks": "Test remarks",
		}
		body, _ := json.Marshal(requestBody)

		req := httptest.NewRequest("PUT", "/api/v1/evaluations/invalid/status", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
	})

	t.Run("Invalid Request Body", func(t *testing.T) {
		req := httptest.NewRequest("POST", "/api/v1/evaluations/trackers", bytes.NewReader([]byte("invalid json")))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+token)

		resp, err := app.Test(req)
		require.NoError(t, err)
		assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
	})
}