package handlers

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

	"backend-go/internal/models"
	"backend-go/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/xuri/excelize/v2"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func setupUserTestApp(t *testing.T) (*fiber.App, *gorm.DB, func()) {
	// Setup test database
	db, err := gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	if err != nil {
		t.Skip("Skipping database tests - SQLite not available")
		return nil, nil, func() {}
	}

	// Auto migrate
	err = db.AutoMigrate(
		&models.Role{},
		&models.User{},
		&models.Student{},
		&models.Instructor{},
		&models.Staff{},
	)
	require.NoError(t, err)

	// Create test roles
	testRole := models.Role{
		ID:   1,
		Name: "student",
	}
	adminRole := models.Role{
		ID:   2,
		Name: "admin",
	}
	err = db.Create(&testRole).Error
	require.NoError(t, err)
	err = db.Create(&adminRole).Error
	require.NoError(t, err)

	// Setup Fiber app
	app := fiber.New()

	// Setup services and handlers
	userService := services.NewUserService(db)
	userHandler := NewUserHandler(userService)

	// Setup routes
	api := app.Group("/api/v1")
	api.Get("/users", userHandler.GetUsers)
	api.Get("/users/stats", userHandler.GetUserStats)
	api.Get("/users/:id", userHandler.GetUser)
	api.Post("/users", userHandler.CreateUser)
	api.Put("/users/:id", userHandler.UpdateUser)
	api.Delete("/users/:id", userHandler.DeleteUser)
	api.Delete("/users/bulk", userHandler.BulkDeleteUsers)
	api.Post("/users/bulk-excel", userHandler.BulkCreateFromExcel)

	cleanup := func() {
		sqlDB, _ := db.DB()
		sqlDB.Close()
	}

	return app, db, cleanup
}

func createTestUsers(t *testing.T, db *gorm.DB, count int) []models.User {
	var users []models.User
	for i := 1; i <= count; i++ {
		fullName := fmt.Sprintf("Test User %d", i)
		user := models.User{
			FullName: &fullName,
			Email:    fmt.Sprintf("test%d@example.com", i),
			Password: "password123",
			RoleID:   1, // student role
		}
		err := db.Create(&user).Error
		require.NoError(t, err)
		
		// Remove password for comparison
		user.Password = ""
		users = append(users, user)
	}
	return users
}

func TestUserHandler_GetUsers(t *testing.T) {
	app, db, cleanup := setupUserTestApp(t)
	defer cleanup()

	// Create test users
	createTestUsers(t, db, 5)

	tests := []struct {
		name           string
		query          string
		expectedStatus int
		expectedCount  int
	}{
		{
			name:           "Get all users with default pagination",
			query:          "",
			expectedStatus: 200,
			expectedCount:  5,
		},
		{
			name:           "Get users with pagination",
			query:          "?page=1&limit=3",
			expectedStatus: 200,
			expectedCount:  3,
		},
		{
			name:           "Get users with search",
			query:          "?search=Test User 1",
			expectedStatus: 200,
			expectedCount:  1,
		},
		{
			name:           "Get users with role filter",
			query:          "?role_id=1",
			expectedStatus: 200,
			expectedCount:  5,
		},
		{
			name:           "Get users with sorting",
			query:          "?sort_by=email&sort_desc=true",
			expectedStatus: 200,
			expectedCount:  5,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", "/api/v1/users"+tt.query, nil)
			resp, err := app.Test(req)
			require.NoError(t, err)

			assert.Equal(t, tt.expectedStatus, resp.StatusCode)

			if tt.expectedStatus == 200 {
				body, err := io.ReadAll(resp.Body)
				require.NoError(t, err)

				var response map[string]interface{}
				err = json.Unmarshal(body, &response)
				require.NoError(t, err)

				data := response["data"].(map[string]interface{})
				users := data["data"].([]interface{})
				assert.Equal(t, tt.expectedCount, len(users))
			}
		})
	}
}

func TestUserHandler_GetUser(t *testing.T) {
	app, db, cleanup := setupUserTestApp(t)
	defer cleanup()

	// Create test user
	users := createTestUsers(t, db, 1)
	testUser := users[0]

	tests := []struct {
		name           string
		userID         string
		expectedStatus int
	}{
		{
			name:           "Get existing user",
			userID:         strconv.Itoa(int(testUser.ID)),
			expectedStatus: 200,
		},
		{
			name:           "Get non-existing user",
			userID:         "999",
			expectedStatus: 404,
		},
		{
			name:           "Get user with invalid ID",
			userID:         "invalid",
			expectedStatus: 400,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", "/api/v1/users/"+tt.userID, nil)
			resp, err := app.Test(req)
			require.NoError(t, err)

			assert.Equal(t, tt.expectedStatus, resp.StatusCode)

			if tt.expectedStatus == 200 {
				body, err := io.ReadAll(resp.Body)
				require.NoError(t, err)

				var response map[string]interface{}
				err = json.Unmarshal(body, &response)
				require.NoError(t, err)

				userData := response["data"].(map[string]interface{})
				assert.Equal(t, testUser.Email, userData["email"])
			}
		})
	}
}

func TestUserHandler_CreateUser(t *testing.T) {
	app, _, cleanup := setupUserTestApp(t)
	defer cleanup()

	tests := []struct {
		name           string
		payload        map[string]interface{}
		expectedStatus int
	}{
		{
			name: "Create valid user",
			payload: map[string]interface{}{
				"full_name": "New User",
				"email":     "newuser@example.com",
				"password":  "password123",
				"role_id":   1,
			},
			expectedStatus: 201,
		},
		{
			name: "Create user with duplicate email",
			payload: map[string]interface{}{
				"full_name": "Duplicate User",
				"email":     "newuser@example.com", // Same as above
				"password":  "password123",
				"role_id":   1,
			},
			expectedStatus: 409,
		},
		{
			name: "Create user with invalid role",
			payload: map[string]interface{}{
				"full_name": "Invalid Role User",
				"email":     "invalidrole@example.com",
				"password":  "password123",
				"role_id":   999,
			},
			expectedStatus: 400,
		},
		{
			name: "Create user with missing required fields",
			payload: map[string]interface{}{
				"full_name": "Incomplete User",
			},
			expectedStatus: 400,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			payloadBytes, _ := json.Marshal(tt.payload)
			req := httptest.NewRequest("POST", "/api/v1/users", bytes.NewReader(payloadBytes))
			req.Header.Set("Content-Type", "application/json")

			resp, err := app.Test(req)
			require.NoError(t, err)

			assert.Equal(t, tt.expectedStatus, resp.StatusCode)
		})
	}
}

func TestUserHandler_UpdateUser(t *testing.T) {
	app, db, cleanup := setupUserTestApp(t)
	defer cleanup()

	// Create test user
	users := createTestUsers(t, db, 1)
	testUser := users[0]

	tests := []struct {
		name           string
		userID         string
		payload        map[string]interface{}
		expectedStatus int
	}{
		{
			name:   "Update user full name",
			userID: strconv.Itoa(int(testUser.ID)),
			payload: map[string]interface{}{
				"full_name": "Updated Name",
			},
			expectedStatus: 200,
		},
		{
			name:   "Update user email",
			userID: strconv.Itoa(int(testUser.ID)),
			payload: map[string]interface{}{
				"email": "updated@example.com",
			},
			expectedStatus: 200,
		},
		{
			name:   "Update non-existing user",
			userID: "999",
			payload: map[string]interface{}{
				"full_name": "Non-existing User",
			},
			expectedStatus: 404,
		},
		{
			name:   "Update user with invalid ID",
			userID: "invalid",
			payload: map[string]interface{}{
				"full_name": "Invalid ID User",
			},
			expectedStatus: 400,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			payloadBytes, _ := json.Marshal(tt.payload)
			req := httptest.NewRequest("PUT", "/api/v1/users/"+tt.userID, bytes.NewReader(payloadBytes))
			req.Header.Set("Content-Type", "application/json")

			resp, err := app.Test(req)
			require.NoError(t, err)

			assert.Equal(t, tt.expectedStatus, resp.StatusCode)
		})
	}
}

func TestUserHandler_DeleteUser(t *testing.T) {
	app, db, cleanup := setupUserTestApp(t)
	defer cleanup()

	// Create test users
	users := createTestUsers(t, db, 2)

	tests := []struct {
		name           string
		userID         string
		expectedStatus int
	}{
		{
			name:           "Delete existing user",
			userID:         strconv.Itoa(int(users[0].ID)),
			expectedStatus: 200,
		},
		{
			name:           "Delete non-existing user",
			userID:         "999",
			expectedStatus: 404,
		},
		{
			name:           "Delete user with invalid ID",
			userID:         "invalid",
			expectedStatus: 400,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("DELETE", "/api/v1/users/"+tt.userID, nil)
			resp, err := app.Test(req)
			require.NoError(t, err)

			assert.Equal(t, tt.expectedStatus, resp.StatusCode)
		})
	}
}

func TestUserHandler_BulkDeleteUsers(t *testing.T) {
	app, db, cleanup := setupUserTestApp(t)
	defer cleanup()

	// Create test users
	users := createTestUsers(t, db, 5)

	tests := []struct {
		name           string
		payload        map[string]interface{}
		expectedStatus int
	}{
		{
			name: "Bulk delete existing users",
			payload: map[string]interface{}{
				"user_ids": []uint{users[0].ID, users[1].ID},
			},
			expectedStatus: 200,
		},
		{
			name: "Bulk delete with non-existing user",
			payload: map[string]interface{}{
				"user_ids": []uint{users[2].ID, 999},
			},
			expectedStatus: 404,
		},
		{
			name: "Bulk delete with empty array",
			payload: map[string]interface{}{
				"user_ids": []uint{},
			},
			expectedStatus: 400,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			payloadBytes, _ := json.Marshal(tt.payload)
			req := httptest.NewRequest("DELETE", "/api/v1/users/bulk", bytes.NewReader(payloadBytes))
			req.Header.Set("Content-Type", "application/json")

			resp, err := app.Test(req)
			require.NoError(t, err)

			assert.Equal(t, tt.expectedStatus, resp.StatusCode)
		})
	}
}

func TestUserHandler_BulkCreateFromExcel(t *testing.T) {
	app, _, cleanup := setupUserTestApp(t)
	defer cleanup()

	// Create test Excel file
	f := excelize.NewFile()
	defer func() {
		if err := f.Close(); err != nil {
			fmt.Println(err)
		}
	}()

	// Set headers
	f.SetCellValue("Sheet1", "A1", "full_name")
	f.SetCellValue("Sheet1", "B1", "email")
	f.SetCellValue("Sheet1", "C1", "password")

	// Set data
	f.SetCellValue("Sheet1", "A2", "Excel User 1")
	f.SetCellValue("Sheet1", "B2", "excel1@example.com")
	f.SetCellValue("Sheet1", "C2", "password123")

	f.SetCellValue("Sheet1", "A3", "Excel User 2")
	f.SetCellValue("Sheet1", "B3", "excel2@example.com")
	f.SetCellValue("Sheet1", "C3", "password456")

	// Save to temporary file
	tempFile := "/tmp/test_users.xlsx"
	err := f.SaveAs(tempFile)
	require.NoError(t, err)
	defer os.Remove(tempFile)

	// Create multipart form
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	// Add file
	file, err := os.Open(tempFile)
	require.NoError(t, err)
	defer file.Close()

	part, err := writer.CreateFormFile("file", "test_users.xlsx")
	require.NoError(t, err)
	_, err = io.Copy(part, file)
	require.NoError(t, err)

	// Add role_id
	err = writer.WriteField("role_id", "1")
	require.NoError(t, err)

	err = writer.Close()
	require.NoError(t, err)

	// Test bulk create from Excel
	req := httptest.NewRequest("POST", "/api/v1/users/bulk-excel", &buf)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	resp, err := app.Test(req)
	require.NoError(t, err)

	assert.Equal(t, 200, resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)

	var response map[string]interface{}
	err = json.Unmarshal(body, &response)
	require.NoError(t, err)

	assert.Equal(t, float64(2), response["created_count"])
}

func TestUserHandler_GetUserStats(t *testing.T) {
	app, db, cleanup := setupUserTestApp(t)
	defer cleanup()

	// Create test users with different roles
	createTestUsers(t, db, 3) // 3 students

	// Create admin user
	adminUser := models.User{
		FullName: stringPtr("Admin User"),
		Email:    "admin@example.com",
		Password: "password123",
		RoleID:   2, // admin role
	}
	err := db.Create(&adminUser).Error
	require.NoError(t, err)

	req := httptest.NewRequest("GET", "/api/v1/users/stats", nil)
	resp, err := app.Test(req)
	require.NoError(t, err)

	assert.Equal(t, 200, resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)

	var response map[string]interface{}
	err = json.Unmarshal(body, &response)
	require.NoError(t, err)

	data := response["data"].(map[string]interface{})
	assert.Equal(t, float64(4), data["total_users"])

	byRole := data["by_role"].([]interface{})
	assert.Len(t, byRole, 2) // 2 different roles
}

func stringPtr(s string) *string {
	return &s
}