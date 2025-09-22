package handlers

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http/httptest"
	"testing"

	"backend-go/internal/models"
	"backend-go/internal/services"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockInstructorService is a mock implementation of InstructorServiceInterface
type MockInstructorService struct {
	mock.Mock
}

func (m *MockInstructorService) GetInstructors(req services.InstructorListRequest) (*services.InstructorListResponse, error) {
	args := m.Called(req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*services.InstructorListResponse), args.Error(1)
}

func (m *MockInstructorService) GetInstructorByID(id uint) (*models.Instructor, error) {
	args := m.Called(id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Instructor), args.Error(1)
}

func (m *MockInstructorService) CreateInstructor(req services.CreateInstructorRequest) (*models.Instructor, error) {
	args := m.Called(req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Instructor), args.Error(1)
}

func (m *MockInstructorService) UpdateInstructor(id uint, req services.UpdateInstructorRequest) (*models.Instructor, error) {
	args := m.Called(id, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Instructor), args.Error(1)
}

func (m *MockInstructorService) DeleteInstructor(id uint) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockInstructorService) AssignInstructorToCourse(req services.CourseAssignmentRequest) (*models.CourseInstructor, error) {
	args := m.Called(req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.CourseInstructor), args.Error(1)
}

func (m *MockInstructorService) UpdateCourseAssignment(id uint, req services.UpdateCourseAssignmentRequest) (*models.CourseInstructor, error) {
	args := m.Called(id, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.CourseInstructor), args.Error(1)
}

func (m *MockInstructorService) RemoveCourseAssignment(id uint) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockInstructorService) GetInstructorCourseAssignments(instructorID uint) ([]models.CourseInstructor, error) {
	args := m.Called(instructorID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]models.CourseInstructor), args.Error(1)
}

func (m *MockInstructorService) ManageInstructorGrade(req services.InstructorGradeRequest) (*models.StudentEnrollStatus, error) {
	args := m.Called(req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.StudentEnrollStatus), args.Error(1)
}

func (m *MockInstructorService) RecordTrainingAttendance(req services.TrainingAttendanceRequest) error {
	args := m.Called(req)
	return args.Error(0)
}

func (m *MockInstructorService) GetInstructorStats() (map[string]interface{}, error) {
	args := m.Called()
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(map[string]interface{}), args.Error(1)
}

func TestInstructorHandler_GetInstructors(t *testing.T) {
	tests := []struct {
		name           string
		queryParams    string
		mockResponse   *services.InstructorListResponse
		mockError      error
		expectedStatus int
		expectedBody   string
	}{
		{
			name:        "successful retrieval",
			queryParams: "?page=1&limit=10",
			mockResponse: &services.InstructorListResponse{
				Data:       []models.Instructor{{ID: 1, Name: "John", Surname: "Doe"}},
				Total:      1,
				Page:       1,
				Limit:      10,
				TotalPages: 1,
			},
			mockError:      nil,
			expectedStatus: 200,
			expectedBody:   `"message":"Instructors retrieved successfully"`,
		},
		{
			name:           "service error",
			queryParams:    "",
			mockResponse:   nil,
			mockError:      errors.New("database error"),
			expectedStatus: 500,
			expectedBody:   `"error":"Failed to fetch instructors"`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup
			mockService := new(MockInstructorService)
			handler := NewInstructorHandler(mockService)
			app := fiber.New()
			app.Get("/instructors", handler.GetInstructors)

			// Mock expectations
			mockService.On("GetInstructors", mock.AnythingOfType("services.InstructorListRequest")).
				Return(tt.mockResponse, tt.mockError)

			// Test
			req := httptest.NewRequest("GET", "/instructors"+tt.queryParams, nil)
			resp, err := app.Test(req)

			// Assertions
			assert.NoError(t, err)
			assert.Equal(t, tt.expectedStatus, resp.StatusCode)

			var response map[string]interface{}
			err = json.NewDecoder(resp.Body).Decode(&response)
			assert.NoError(t, err)
			
			responseBody, _ := json.Marshal(response)
			assert.Contains(t, string(responseBody), tt.expectedBody)

			mockService.AssertExpectations(t)
		})
	}
}

func TestInstructorHandler_GetInstructor(t *testing.T) {
	tests := []struct {
		name           string
		instructorID   string
		mockResponse   *models.Instructor
		mockError      error
		expectedStatus int
		expectedBody   string
	}{
		{
			name:         "successful retrieval",
			instructorID: "1",
			mockResponse: &models.Instructor{ID: 1, Name: "John", Surname: "Doe"},
			mockError:    nil,
			expectedStatus: 200,
			expectedBody: `"message":"Instructor retrieved successfully"`,
		},
		{
			name:           "instructor not found",
			instructorID:   "999",
			mockResponse:   nil,
			mockError:      errors.New("instructor not found"),
			expectedStatus: 404,
			expectedBody:   `"error":"Instructor not found"`,
		},
		{
			name:           "invalid instructor ID",
			instructorID:   "invalid",
			mockResponse:   nil,
			mockError:      nil,
			expectedStatus: 400,
			expectedBody:   `"error":"Invalid instructor ID"`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup
			mockService := new(MockInstructorService)
			handler := NewInstructorHandler(mockService)
			app := fiber.New()
			app.Get("/instructors/:id", handler.GetInstructor)

			// Mock expectations (only if ID is valid)
			if tt.instructorID != "invalid" {
				mockService.On("GetInstructorByID", mock.AnythingOfType("uint")).
					Return(tt.mockResponse, tt.mockError)
			}

			// Test
			req := httptest.NewRequest("GET", "/instructors/"+tt.instructorID, nil)
			resp, err := app.Test(req)

			// Assertions
			assert.NoError(t, err)
			assert.Equal(t, tt.expectedStatus, resp.StatusCode)

			var response map[string]interface{}
			err = json.NewDecoder(resp.Body).Decode(&response)
			assert.NoError(t, err)
			
			responseBody, _ := json.Marshal(response)
			assert.Contains(t, string(responseBody), tt.expectedBody)

			if tt.instructorID != "invalid" {
				mockService.AssertExpectations(t)
			}
		})
	}
}

func TestInstructorHandler_CreateInstructor(t *testing.T) {
	tests := []struct {
		name           string
		requestBody    map[string]interface{}
		mockResponse   *models.Instructor
		mockError      error
		expectedStatus int
		expectedBody   string
	}{
		{
			name: "successful creation",
			requestBody: map[string]interface{}{
				"user_id":    1,
				"staff_id":   "STAFF001",
				"name":       "John",
				"surname":    "Doe",
				"faculty_id": 1,
				"program_id": 1,
			},
			mockResponse:   &models.Instructor{ID: 1, Name: "John", Surname: "Doe"},
			mockError:      nil,
			expectedStatus: 201,
			expectedBody:   `"message":"Instructor created successfully"`,
		},
		{
			name: "user not found",
			requestBody: map[string]interface{}{
				"user_id":    999,
				"staff_id":   "STAFF001",
				"name":       "John",
				"surname":    "Doe",
				"faculty_id": 1,
				"program_id": 1,
			},
			mockResponse:   nil,
			mockError:      errors.New("user not found"),
			expectedStatus: 400,
			expectedBody:   `"error":"User not found"`,
		},
		{
			name: "validation error - missing required fields",
			requestBody: map[string]interface{}{
				"name": "John",
			},
			mockResponse:   nil,
			mockError:      nil,
			expectedStatus: 400,
			expectedBody:   `"error":"Validation failed"`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup
			mockService := new(MockInstructorService)
			handler := NewInstructorHandler(mockService)
			app := fiber.New()
			app.Post("/instructors", handler.CreateInstructor)

			// Mock expectations (only for valid requests)
			if tt.expectedStatus != 400 || tt.name == "user not found" {
				mockService.On("CreateInstructor", mock.AnythingOfType("services.CreateInstructorRequest")).
					Return(tt.mockResponse, tt.mockError)
			}

			// Test
			body, _ := json.Marshal(tt.requestBody)
			req := httptest.NewRequest("POST", "/instructors", bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			resp, err := app.Test(req)

			// Assertions
			assert.NoError(t, err)
			assert.Equal(t, tt.expectedStatus, resp.StatusCode)

			var response map[string]interface{}
			err = json.NewDecoder(resp.Body).Decode(&response)
			assert.NoError(t, err)
			
			responseBody, _ := json.Marshal(response)
			assert.Contains(t, string(responseBody), tt.expectedBody)

			if tt.expectedStatus != 400 || tt.name == "user not found" {
				mockService.AssertExpectations(t)
			}
		})
	}
}

func TestInstructorHandler_AssignInstructorToCourse(t *testing.T) {
	tests := []struct {
		name           string
		requestBody    map[string]interface{}
		mockResponse   *models.CourseInstructor
		mockError      error
		expectedStatus int
		expectedBody   string
	}{
		{
			name: "successful assignment",
			requestBody: map[string]interface{}{
				"instructor_id":     1,
				"course_section_id": 1,
				"role":              "instructor",
			},
			mockResponse:   &models.CourseInstructor{ID: 1, InstructorID: 1, CourseSectionID: 1, Role: "instructor"},
			mockError:      nil,
			expectedStatus: 201,
			expectedBody:   `"message":"Instructor assigned to course successfully"`,
		},
		{
			name: "instructor not found",
			requestBody: map[string]interface{}{
				"instructor_id":     999,
				"course_section_id": 1,
				"role":              "instructor",
			},
			mockResponse:   nil,
			mockError:      errors.New("instructor not found"),
			expectedStatus: 400,
			expectedBody:   `"error":"Instructor not found"`,
		},
		{
			name: "validation error - invalid role",
			requestBody: map[string]interface{}{
				"instructor_id":     1,
				"course_section_id": 1,
				"role":              "invalid_role",
			},
			mockResponse:   nil,
			mockError:      nil,
			expectedStatus: 400,
			expectedBody:   `"error":"Validation failed"`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup
			mockService := new(MockInstructorService)
			handler := NewInstructorHandler(mockService)
			app := fiber.New()
			app.Post("/instructors/assign-course", handler.AssignInstructorToCourse)

			// Mock expectations (only for valid requests)
			if tt.expectedStatus != 400 || tt.name == "instructor not found" {
				mockService.On("AssignInstructorToCourse", mock.AnythingOfType("services.CourseAssignmentRequest")).
					Return(tt.mockResponse, tt.mockError)
			}

			// Test
			body, _ := json.Marshal(tt.requestBody)
			req := httptest.NewRequest("POST", "/instructors/assign-course", bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			resp, err := app.Test(req)

			// Assertions
			assert.NoError(t, err)
			assert.Equal(t, tt.expectedStatus, resp.StatusCode)

			var response map[string]interface{}
			err = json.NewDecoder(resp.Body).Decode(&response)
			assert.NoError(t, err)
			
			responseBody, _ := json.Marshal(response)
			assert.Contains(t, string(responseBody), tt.expectedBody)

			if tt.expectedStatus != 400 || tt.name == "instructor not found" {
				mockService.AssertExpectations(t)
			}
		})
	}
}

func TestInstructorHandler_GetInstructorStats(t *testing.T) {
	tests := []struct {
		name           string
		mockResponse   map[string]interface{}
		mockError      error
		expectedStatus int
		expectedBody   string
	}{
		{
			name: "successful stats retrieval",
			mockResponse: map[string]interface{}{
				"total_instructors": 10,
				"instructors_by_faculty": []map[string]interface{}{
					{"faculty_id": 1, "faculty_name": "Engineering", "count": 5},
				},
			},
			mockError:      nil,
			expectedStatus: 200,
			expectedBody:   `"message":"Instructor statistics retrieved successfully"`,
		},
		{
			name:           "service error",
			mockResponse:   nil,
			mockError:      errors.New("database error"),
			expectedStatus: 500,
			expectedBody:   `"error":"Failed to fetch instructor statistics"`,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup
			mockService := new(MockInstructorService)
			handler := NewInstructorHandler(mockService)
			app := fiber.New()
			app.Get("/instructors/stats", handler.GetInstructorStats)

			// Mock expectations
			mockService.On("GetInstructorStats").Return(tt.mockResponse, tt.mockError)

			// Test
			req := httptest.NewRequest("GET", "/instructors/stats", nil)
			resp, err := app.Test(req)

			// Assertions
			assert.NoError(t, err)
			assert.Equal(t, tt.expectedStatus, resp.StatusCode)

			var response map[string]interface{}
			err = json.NewDecoder(resp.Body).Decode(&response)
			assert.NoError(t, err)
			
			responseBody, _ := json.Marshal(response)
			assert.Contains(t, string(responseBody), tt.expectedBody)

			mockService.AssertExpectations(t)
		})
	}
}