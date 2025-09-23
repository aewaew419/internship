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

	"backend-go/internal/handlers"
	"backend-go/internal/models"
	"backend-go/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/suite"
)

// MockVisitorService is a mock implementation of VisitorService
type MockVisitorService struct {
	mock.Mock
}

func (m *MockVisitorService) GetVisitorTrainings(req services.VisitorTrainingListRequest) (*services.VisitorTrainingListResponse, error) {
	args := m.Called(req)
	return args.Get(0).(*services.VisitorTrainingListResponse), args.Error(1)
}

func (m *MockVisitorService) GetVisitorTrainingByID(id uint) (*models.VisitorTraining, error) {
	args := m.Called(id)
	return args.Get(0).(*models.VisitorTraining), args.Error(1)
}

func (m *MockVisitorService) CreateVisitorTraining(req services.CreateVisitorTrainingRequest) (*models.VisitorTraining, error) {
	args := m.Called(req)
	return args.Get(0).(*models.VisitorTraining), args.Error(1)
}

func (m *MockVisitorService) UpdateVisitorTraining(id uint, req services.UpdateVisitorTrainingRequest) (*models.VisitorTraining, error) {
	args := m.Called(id, req)
	return args.Get(0).(*models.VisitorTraining), args.Error(1)
}

func (m *MockVisitorService) DeleteVisitorTraining(id uint) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockVisitorService) GetVisitorSchedules(req services.VisitorScheduleListRequest) (*services.VisitorScheduleListResponse, error) {
	args := m.Called(req)
	return args.Get(0).(*services.VisitorScheduleListResponse), args.Error(1)
}

func (m *MockVisitorService) GetVisitorScheduleByID(id uint) (*models.VisitorSchedule, error) {
	args := m.Called(id)
	return args.Get(0).(*models.VisitorSchedule), args.Error(1)
}

func (m *MockVisitorService) CreateVisitorSchedule(req services.CreateVisitorScheduleRequest) (*models.VisitorSchedule, error) {
	args := m.Called(req)
	return args.Get(0).(*models.VisitorSchedule), args.Error(1)
}

func (m *MockVisitorService) UpdateVisitorSchedule(id uint, req services.UpdateVisitorScheduleRequest) (*models.VisitorSchedule, error) {
	args := m.Called(id, req)
	return args.Get(0).(*models.VisitorSchedule), args.Error(1)
}

func (m *MockVisitorService) DeleteVisitorSchedule(id uint) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockVisitorService) GetVisitorEvaluateStudents(visitorTrainingID uint) ([]models.VisitorEvaluateStudent, error) {
	args := m.Called(visitorTrainingID)
	return args.Get(0).([]models.VisitorEvaluateStudent), args.Error(1)
}

func (m *MockVisitorService) GetVisitorEvaluateStudentByID(id uint) (*models.VisitorEvaluateStudent, error) {
	args := m.Called(id)
	return args.Get(0).(*models.VisitorEvaluateStudent), args.Error(1)
}

func (m *MockVisitorService) CreateVisitorEvaluateStudent(req services.CreateVisitorEvaluateStudentRequest) (*models.VisitorEvaluateStudent, error) {
	args := m.Called(req)
	return args.Get(0).(*models.VisitorEvaluateStudent), args.Error(1)
}

func (m *MockVisitorService) UpdateVisitorEvaluateStudent(id uint, req services.UpdateVisitorEvaluateStudentRequest) (*models.VisitorEvaluateStudent, error) {
	args := m.Called(id, req)
	return args.Get(0).(*models.VisitorEvaluateStudent), args.Error(1)
}

func (m *MockVisitorService) DeleteVisitorEvaluateStudent(id uint) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockVisitorService) GetVisitorEvaluateCompanies(visitorTrainingID uint) ([]models.VisitorEvaluateCompany, error) {
	args := m.Called(visitorTrainingID)
	return args.Get(0).([]models.VisitorEvaluateCompany), args.Error(1)
}

func (m *MockVisitorService) GetVisitorEvaluateCompanyByID(id uint) (*models.VisitorEvaluateCompany, error) {
	args := m.Called(id)
	return args.Get(0).(*models.VisitorEvaluateCompany), args.Error(1)
}

func (m *MockVisitorService) CreateVisitorEvaluateCompany(req services.CreateVisitorEvaluateCompanyRequest) (*models.VisitorEvaluateCompany, error) {
	args := m.Called(req)
	return args.Get(0).(*models.VisitorEvaluateCompany), args.Error(1)
}

func (m *MockVisitorService) UpdateVisitorEvaluateCompany(id uint, req services.UpdateVisitorEvaluateCompanyRequest) (*models.VisitorEvaluateCompany, error) {
	args := m.Called(id, req)
	return args.Get(0).(*models.VisitorEvaluateCompany), args.Error(1)
}

func (m *MockVisitorService) DeleteVisitorEvaluateCompany(id uint) error {
	args := m.Called(id)
	return args.Error(0)
}

func (m *MockVisitorService) GetVisitPhotos(visitorScheduleID uint) ([]models.VisitsPicture, error) {
	args := m.Called(visitorScheduleID)
	return args.Get(0).([]models.VisitsPicture), args.Error(1)
}

func (m *MockVisitorService) GetVisitPhotoByID(id uint) (*models.VisitsPicture, error) {
	args := m.Called(id)
	return args.Get(0).(*models.VisitsPicture), args.Error(1)
}

func (m *MockVisitorService) CreateVisitPhoto(visitorScheduleID uint, photoNo int, fileURL string) (*models.VisitsPicture, error) {
	args := m.Called(visitorScheduleID, photoNo, fileURL)
	return args.Get(0).(*models.VisitsPicture), args.Error(1)
}

func (m *MockVisitorService) UpdateVisitPhoto(id uint, fileURL string) (*models.VisitsPicture, error) {
	args := m.Called(id, fileURL)
	return args.Get(0).(*models.VisitsPicture), args.Error(1)
}

func (m *MockVisitorService) DeleteVisitPhoto(id uint) error {
	args := m.Called(id)
	return args.Error(0)
}

// VisitorHandlerTestSuite is the test suite for visitor handlers
type VisitorHandlerTestSuite struct {
	suite.Suite
	app            *fiber.App
	mockService    *MockVisitorService
	handler        *handlers.VisitorHandler
}

func (suite *VisitorHandlerTestSuite) SetupTest() {
	suite.mockService = new(MockVisitorService)
	suite.handler = handlers.NewVisitorHandler(suite.mockService)
	
	suite.app = fiber.New()
	
	// Setup routes
	api := suite.app.Group("/api/v1")
	
	// Visitor Training routes
	api.Get("/visitor-trainings", suite.handler.GetVisitorTrainings)
	api.Get("/visitor-trainings/:id", suite.handler.GetVisitorTraining)
	api.Post("/visitor-trainings", suite.handler.CreateVisitorTraining)
	api.Put("/visitor-trainings/:id", suite.handler.UpdateVisitorTraining)
	api.Delete("/visitor-trainings/:id", suite.handler.DeleteVisitorTraining)
	
	// Visitor Schedule routes
	api.Get("/visitor-schedules", suite.handler.GetVisitorSchedules)
	api.Get("/visitor-schedules/:id", suite.handler.GetVisitorSchedule)
	api.Post("/visitor-schedules", suite.handler.CreateVisitorSchedule)
	api.Put("/visitor-schedules/:id", suite.handler.UpdateVisitorSchedule)
	api.Delete("/visitor-schedules/:id", suite.handler.DeleteVisitorSchedule)
	
	// Visitor Evaluate Student routes
	api.Get("/visitor-trainings/:training_id/evaluate-students", suite.handler.GetVisitorEvaluateStudents)
	api.Get("/visitor-evaluate-students/:id", suite.handler.GetVisitorEvaluateStudent)
	api.Post("/visitor-evaluate-students", suite.handler.CreateVisitorEvaluateStudent)
	api.Put("/visitor-evaluate-students/:id", suite.handler.UpdateVisitorEvaluateStudent)
	api.Delete("/visitor-evaluate-students/:id", suite.handler.DeleteVisitorEvaluateStudent)
	
	// Visitor Evaluate Company routes
	api.Get("/visitor-trainings/:training_id/evaluate-companies", suite.handler.GetVisitorEvaluateCompanies)
	api.Get("/visitor-evaluate-companies/:id", suite.handler.GetVisitorEvaluateCompany)
	api.Post("/visitor-evaluate-companies", suite.handler.CreateVisitorEvaluateCompany)
	api.Put("/visitor-evaluate-companies/:id", suite.handler.UpdateVisitorEvaluateCompany)
	api.Delete("/visitor-evaluate-companies/:id", suite.handler.DeleteVisitorEvaluateCompany)
	
	// Visit Photo routes
	api.Get("/visitor-schedules/:schedule_id/photos", suite.handler.GetVisitPhotos)
	api.Get("/visit-photos/:id", suite.handler.GetVisitPhoto)
	api.Post("/visitor-schedules/:schedule_id/photos", suite.handler.UploadVisitPhoto)
	api.Put("/visit-photos/:id", suite.handler.UpdateVisitPhoto)
	api.Delete("/visit-photos/:id", suite.handler.DeleteVisitPhoto)
}

func (suite *VisitorHandlerTestSuite) TearDownTest() {
	suite.mockService.AssertExpectations(suite.T())
}

// Test Visitor Training handlers

func (suite *VisitorHandlerTestSuite) TestGetVisitorTrainings() {
	// Mock service response
	mockResponse := &services.VisitorTrainingListResponse{
		Data:       []models.VisitorTraining{{ID: 1}},
		Total:      1,
		Page:       1,
		Limit:      10,
		TotalPages: 1,
	}
	
	suite.mockService.On("GetVisitorTrainings", mock.AnythingOfType("services.VisitorTrainingListRequest")).Return(mockResponse, nil)
	
	req := httptest.NewRequest("GET", "/api/v1/visitor-trainings", nil)
	resp, err := suite.app.Test(req)
	suite.NoError(err)
	defer resp.Body.Close()
	
	suite.Equal(200, resp.StatusCode)
	
	var response map[string]interface{}
	body, _ := io.ReadAll(resp.Body)
	json.Unmarshal(body, &response)
	
	suite.Equal("Visitor trainings retrieved successfully", response["message"])
}

func (suite *VisitorHandlerTestSuite) TestGetVisitorTraining() {
	// Mock service response
	mockTraining := &models.VisitorTraining{
		ID:                  1,
		StudentEnrollID:     1,
		VisitorInstructorID: 1,
	}
	
	suite.mockService.On("GetVisitorTrainingByID", uint(1)).Return(mockTraining, nil)
	
	req := httptest.NewRequest("GET", "/api/v1/visitor-trainings/1", nil)
	resp, err := suite.app.Test(req)
	suite.NoError(err)
	defer resp.Body.Close()
	
	suite.Equal(200, resp.StatusCode)
	
	var response map[string]interface{}
	body, _ := io.ReadAll(resp.Body)
	json.Unmarshal(body, &response)
	
	suite.Equal("Visitor training retrieved successfully", response["message"])
	data := response["data"].(map[string]interface{})
	suite.Equal(float64(1), data["id"].(float64))
}

func (suite *VisitorHandlerTestSuite) TestCreateVisitorTraining() {
	// Mock service response
	mockTraining := &models.VisitorTraining{
		ID:                  1,
		StudentEnrollID:     1,
		VisitorInstructorID: 1,
	}
	
	suite.mockService.On("CreateVisitorTraining", mock.AnythingOfType("services.CreateVisitorTrainingRequest")).Return(mockTraining, nil)
	
	trainingData := map[string]interface{}{
		"student_enroll_id":     1,
		"visitor_instructor_id": 1,
	}
	
	jsonData, _ := json.Marshal(trainingData)
	req := httptest.NewRequest("POST", "/api/v1/visitor-trainings", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	resp, err := suite.app.Test(req)
	suite.NoError(err)
	defer resp.Body.Close()
	
	suite.Equal(201, resp.StatusCode)
	
	var response map[string]interface{}
	body, _ := io.ReadAll(resp.Body)
	json.Unmarshal(body, &response)
	
	suite.Equal("Visitor training created successfully", response["message"])
}

// Test Visitor Schedule handlers

func (suite *VisitorHandlerTestSuite) TestGetVisitorSchedules() {
	// Mock service response
	mockResponse := &services.VisitorScheduleListResponse{
		Data:       []models.VisitorSchedule{{ID: 1}},
		Total:      1,
		Page:       1,
		Limit:      10,
		TotalPages: 1,
	}
	
	suite.mockService.On("GetVisitorSchedules", mock.AnythingOfType("services.VisitorScheduleListRequest")).Return(mockResponse, nil)
	
	req := httptest.NewRequest("GET", "/api/v1/visitor-schedules", nil)
	resp, err := suite.app.Test(req)
	suite.NoError(err)
	defer resp.Body.Close()
	
	suite.Equal(200, resp.StatusCode)
	
	var response map[string]interface{}
	body, _ := io.ReadAll(resp.Body)
	json.Unmarshal(body, &response)
	
	suite.Equal("Visitor schedules retrieved successfully", response["message"])
}

func (suite *VisitorHandlerTestSuite) TestCreateVisitorSchedule() {
	// Mock service response
	visitAt := time.Now().Add(24 * time.Hour)
	mockSchedule := &models.VisitorSchedule{
		ID:                1,
		VisitorTrainingID: 1,
		VisitNo:           1,
		VisitAt:           &visitAt,
	}
	
	suite.mockService.On("CreateVisitorSchedule", mock.AnythingOfType("services.CreateVisitorScheduleRequest")).Return(mockSchedule, nil)
	
	scheduleData := map[string]interface{}{
		"visitor_training_id": 1,
		"visit_no":            1,
		"visit_at":            visitAt.Format(time.RFC3339),
		"comment":             "Test comment",
	}
	
	jsonData, _ := json.Marshal(scheduleData)
	req := httptest.NewRequest("POST", "/api/v1/visitor-schedules", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	resp, err := suite.app.Test(req)
	suite.NoError(err)
	defer resp.Body.Close()
	
	suite.Equal(201, resp.StatusCode)
	
	var response map[string]interface{}
	body, _ := io.ReadAll(resp.Body)
	json.Unmarshal(body, &response)
	
	suite.Equal("Visitor schedule created successfully", response["message"])
}

// Test Visitor Evaluate Student handlers

func (suite *VisitorHandlerTestSuite) TestGetVisitorEvaluateStudents() {
	// Mock service response
	mockEvaluations := []models.VisitorEvaluateStudent{
		{ID: 1, VisitorTrainingID: 1, Score: 85},
	}
	
	suite.mockService.On("GetVisitorEvaluateStudents", uint(1)).Return(mockEvaluations, nil)
	
	req := httptest.NewRequest("GET", "/api/v1/visitor-trainings/1/evaluate-students", nil)
	resp, err := suite.app.Test(req)
	suite.NoError(err)
	defer resp.Body.Close()
	
	suite.Equal(200, resp.StatusCode)
	
	var response map[string]interface{}
	body, _ := io.ReadAll(resp.Body)
	json.Unmarshal(body, &response)
	
	suite.Equal("Visitor evaluate students retrieved successfully", response["message"])
}

func (suite *VisitorHandlerTestSuite) TestCreateVisitorEvaluateStudent() {
	// Mock service response
	mockEvaluation := &models.VisitorEvaluateStudent{
		ID:                1,
		VisitorTrainingID: 1,
		Score:             85,
		Questions:         "Test questions",
		Comment:           "Test comment",
	}
	
	suite.mockService.On("CreateVisitorEvaluateStudent", mock.AnythingOfType("services.CreateVisitorEvaluateStudentRequest")).Return(mockEvaluation, nil)
	
	evaluationData := map[string]interface{}{
		"visitor_training_id": 1,
		"score":               85,
		"questions":           "Test questions",
		"comment":             "Test comment",
	}
	
	jsonData, _ := json.Marshal(evaluationData)
	req := httptest.NewRequest("POST", "/api/v1/visitor-evaluate-students", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	resp, err := suite.app.Test(req)
	suite.NoError(err)
	defer resp.Body.Close()
	
	suite.Equal(201, resp.StatusCode)
	
	var response map[string]interface{}
	body, _ := io.ReadAll(resp.Body)
	json.Unmarshal(body, &response)
	
	suite.Equal("Visitor evaluate student created successfully", response["message"])
}

// Test Visit Photo handlers

func (suite *VisitorHandlerTestSuite) TestGetVisitPhotos() {
	// Mock service response
	mockPhotos := []models.VisitsPicture{
		{ID: 1, VisitorScheduleID: 1, PhotoNo: 1, FileURL: "/uploads/test.jpg"},
	}
	
	suite.mockService.On("GetVisitPhotos", uint(1)).Return(mockPhotos, nil)
	
	req := httptest.NewRequest("GET", "/api/v1/visitor-schedules/1/photos", nil)
	resp, err := suite.app.Test(req)
	suite.NoError(err)
	defer resp.Body.Close()
	
	suite.Equal(200, resp.StatusCode)
	
	var response map[string]interface{}
	body, _ := io.ReadAll(resp.Body)
	json.Unmarshal(body, &response)
	
	suite.Equal("Visit photos retrieved successfully", response["message"])
}

func (suite *VisitorHandlerTestSuite) TestUploadVisitPhoto() {
	// Create uploads directory if it doesn't exist
	os.MkdirAll("uploads/visit-photos", 0755)
	
	// Create a test image file
	testImagePath := "test_image.jpg"
	testImageContent := []byte("fake image content")
	err := os.WriteFile(testImagePath, testImageContent, 0644)
	suite.NoError(err)
	defer os.Remove(testImagePath)
	
	// Mock service response
	mockPhoto := &models.VisitsPicture{
		ID:                1,
		VisitorScheduleID: 1,
		PhotoNo:           1,
		FileURL:           "/uploads/visit-photos/1_1_test_image.jpg",
	}
	
	suite.mockService.On("CreateVisitPhoto", uint(1), 1, mock.AnythingOfType("string")).Return(mockPhoto, nil)
	
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
	
	req := httptest.NewRequest("POST", "/api/v1/visitor-schedules/1/photos", &buf)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	
	resp, err := suite.app.Test(req)
	suite.NoError(err)
	defer resp.Body.Close()
	
	// Clean up uploaded file
	defer os.Remove("uploads/visit-photos/1_1_test_image.jpg")
	
	suite.Equal(201, resp.StatusCode)
	
	var response map[string]interface{}
	body, _ := io.ReadAll(resp.Body)
	json.Unmarshal(body, &response)
	
	suite.Equal("Visit photo uploaded successfully", response["message"])
}

// Test error handling

func (suite *VisitorHandlerTestSuite) TestGetVisitorTrainingNotFound() {
	suite.mockService.On("GetVisitorTrainingByID", uint(999)).Return((*models.VisitorTraining)(nil), fmt.Errorf("visitor training not found"))
	
	req := httptest.NewRequest("GET", "/api/v1/visitor-trainings/999", nil)
	resp, err := suite.app.Test(req)
	suite.NoError(err)
	defer resp.Body.Close()
	
	suite.Equal(404, resp.StatusCode)
	
	var response map[string]interface{}
	body, _ := io.ReadAll(resp.Body)
	json.Unmarshal(body, &response)
	
	suite.Equal("VISITOR_TRAINING_NOT_FOUND", response["code"])
}

func (suite *VisitorHandlerTestSuite) TestCreateVisitorTrainingWithInvalidData() {
	trainingData := map[string]interface{}{
		// Missing required fields
	}
	
	jsonData, _ := json.Marshal(trainingData)
	req := httptest.NewRequest("POST", "/api/v1/visitor-trainings", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	
	resp, err := suite.app.Test(req)
	suite.NoError(err)
	defer resp.Body.Close()
	
	suite.Equal(400, resp.StatusCode)
	
	var response map[string]interface{}
	body, _ := io.ReadAll(resp.Body)
	json.Unmarshal(body, &response)
	
	suite.Equal("VALIDATION_ERROR", response["code"])
}

func (suite *VisitorHandlerTestSuite) TestUploadVisitPhotoWithInvalidFileType() {
	// Create multipart form with invalid file type
	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)
	
	writer.WriteField("photo_no", "1")
	
	part, err := writer.CreateFormFile("file", "test.txt")
	suite.NoError(err)
	part.Write([]byte("not an image"))
	
	writer.Close()
	
	req := httptest.NewRequest("POST", "/api/v1/visitor-schedules/1/photos", &buf)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	
	resp, err := suite.app.Test(req)
	suite.NoError(err)
	defer resp.Body.Close()
	
	suite.Equal(400, resp.StatusCode)
	
	var response map[string]interface{}
	body, _ := io.ReadAll(resp.Body)
	json.Unmarshal(body, &response)
	
	suite.Equal("INVALID_FILE_TYPE", response["code"])
}

func TestVisitorHandlerTestSuite(t *testing.T) {
	suite.Run(t, new(VisitorHandlerTestSuite))
}