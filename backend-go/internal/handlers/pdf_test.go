package handlers

import (
	"bytes"
	"encoding/json"
	"net/http/httptest"
	"os"
	"testing"

	"backend-go/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"gorm.io/gorm"
)

// MockDB is a mock implementation of gorm.DB for testing
type MockDB struct {
	mock.Mock
}

func (m *MockDB) First(dest interface{}, conds ...interface{}) *gorm.DB {
	args := m.Called(dest, conds)
	return args.Get(0).(*gorm.DB)
}

func (m *MockDB) Preload(query string, args ...interface{}) *gorm.DB {
	mockArgs := m.Called(query, args)
	return mockArgs.Get(0).(*gorm.DB)
}

func (m *MockDB) Find(dest interface{}, conds ...interface{}) *gorm.DB {
	args := m.Called(dest, conds)
	return args.Get(0).(*gorm.DB)
}

func (m *MockDB) Where(query interface{}, args ...interface{}) *gorm.DB {
	mockArgs := m.Called(query, args)
	return mockArgs.Get(0).(*gorm.DB)
}

func (m *MockDB) Model(value interface{}) *gorm.DB {
	args := m.Called(value)
	return args.Get(0).(*gorm.DB)
}

func (m *MockDB) Error() error {
	args := m.Called()
	return args.Error(0)
}

func TestPDFHandler_GenerateReport_ValidationError(t *testing.T) {
	// Setup
	outputDir := "test_pdf_output"
	os.MkdirAll(outputDir, 0755)
	defer os.RemoveAll(outputDir)

	pdfService := services.NewPDFService(outputDir)
	handler := NewPDFHandler(nil, pdfService)

	app := fiber.New()
	app.Post("/pdf/reports", func(c *fiber.Ctx) error {
		// Mock user authentication
		c.Locals("user_id", uint(1))
		return handler.GenerateReport(c)
	})

	// Test with invalid request body
	req := httptest.NewRequest("POST", "/pdf/reports", bytes.NewReader([]byte("invalid json")))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
}

func TestPDFHandler_GenerateReport_UnauthorizedError(t *testing.T) {
	// Setup
	outputDir := "test_pdf_output"
	os.MkdirAll(outputDir, 0755)
	defer os.RemoveAll(outputDir)

	pdfService := services.NewPDFService(outputDir)
	handler := NewPDFHandler(nil, pdfService)

	app := fiber.New()
	app.Post("/pdf/reports", handler.GenerateReport)

	// Test without authentication
	requestBody := map[string]interface{}{
		"report_type": "student_list",
		"title":       "Test Report",
	}
	body, _ := json.Marshal(requestBody)

	req := httptest.NewRequest("POST", "/pdf/reports", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusUnauthorized, resp.StatusCode)
}

func TestPDFHandler_GenerateLetter_ValidationError(t *testing.T) {
	// Setup
	outputDir := "test_pdf_output"
	os.MkdirAll(outputDir, 0755)
	defer os.RemoveAll(outputDir)

	pdfService := services.NewPDFService(outputDir)
	handler := NewPDFHandler(nil, pdfService)

	app := fiber.New()
	app.Post("/pdf/letters", func(c *fiber.Ctx) error {
		// Mock user authentication
		c.Locals("user_id", uint(1))
		return handler.GenerateLetter(c)
	})

	// Test with invalid request body
	req := httptest.NewRequest("POST", "/pdf/letters", bytes.NewReader([]byte("invalid json")))
	req.Header.Set("Content-Type", "application/json")

	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusBadRequest, resp.StatusCode)
}

func TestPDFHandler_DownloadPDF_FileNotFound(t *testing.T) {
	// Setup
	outputDir := "test_pdf_output"
	os.MkdirAll(outputDir, 0755)
	defer os.RemoveAll(outputDir)

	pdfService := services.NewPDFService(outputDir)
	handler := NewPDFHandler(nil, pdfService)

	app := fiber.New()
	app.Get("/pdf/download/:filename", handler.DownloadPDF)

	// Test with non-existent file
	req := httptest.NewRequest("GET", "/pdf/download/nonexistent.pdf", nil)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusNotFound, resp.StatusCode)
}

func TestPDFHandler_DownloadPDF_Success(t *testing.T) {
	// Setup
	outputDir := "test_pdf_output"
	os.MkdirAll(outputDir, 0755)
	defer os.RemoveAll(outputDir)

	// Create a test PDF file
	testFilename := "test.pdf"
	testContent := []byte("test pdf content")
	err := os.WriteFile("uploads/pdf/"+testFilename, testContent, 0644)
	if err != nil {
		// Create the directory if it doesn't exist
		os.MkdirAll("uploads/pdf", 0755)
		err = os.WriteFile("uploads/pdf/"+testFilename, testContent, 0644)
		assert.NoError(t, err)
	}
	defer os.Remove("uploads/pdf/" + testFilename)

	pdfService := services.NewPDFService(outputDir)
	handler := NewPDFHandler(nil, pdfService)

	app := fiber.New()
	app.Get("/pdf/download/:filename", handler.DownloadPDF)

	// Test with existing file
	req := httptest.NewRequest("GET", "/pdf/download/"+testFilename, nil)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusOK, resp.StatusCode)
	assert.Equal(t, "application/pdf", resp.Header.Get("Content-Type"))
}

func TestPDFHandler_ListPDFs_EmptyDirectory(t *testing.T) {
	// Setup
	outputDir := "test_pdf_output"
	os.MkdirAll(outputDir, 0755)
	defer os.RemoveAll(outputDir)

	// Ensure uploads/pdf directory exists but is empty
	os.MkdirAll("uploads/pdf", 0755)

	pdfService := services.NewPDFService(outputDir)
	handler := NewPDFHandler(nil, pdfService)

	app := fiber.New()
	app.Get("/pdf/list", handler.ListPDFs)

	req := httptest.NewRequest("GET", "/pdf/list", nil)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusOK, resp.StatusCode)

	var response map[string]interface{}
	err = json.NewDecoder(resp.Body).Decode(&response)
	assert.NoError(t, err)
	assert.Contains(t, response, "data")
	assert.Contains(t, response, "pagination")
}

func TestPDFHandler_DeletePDF_FileNotFound(t *testing.T) {
	// Setup
	outputDir := "test_pdf_output"
	os.MkdirAll(outputDir, 0755)
	defer os.RemoveAll(outputDir)

	pdfService := services.NewPDFService(outputDir)
	handler := NewPDFHandler(nil, pdfService)

	app := fiber.New()
	app.Delete("/pdf/:filename", handler.DeletePDF)

	// Test with non-existent file
	req := httptest.NewRequest("DELETE", "/pdf/nonexistent.pdf", nil)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusNotFound, resp.StatusCode)
}

func TestPDFHandler_DeletePDF_Success(t *testing.T) {
	// Setup
	outputDir := "test_pdf_output"
	os.MkdirAll(outputDir, 0755)
	defer os.RemoveAll(outputDir)

	// Create a test PDF file
	testFilename := "test_delete.pdf"
	testContent := []byte("test pdf content")
	os.MkdirAll("uploads/pdf", 0755)
	err := os.WriteFile("uploads/pdf/"+testFilename, testContent, 0644)
	assert.NoError(t, err)

	pdfService := services.NewPDFService(outputDir)
	handler := NewPDFHandler(nil, pdfService)

	app := fiber.New()
	app.Delete("/pdf/:filename", handler.DeletePDF)

	// Test deleting existing file
	req := httptest.NewRequest("DELETE", "/pdf/"+testFilename, nil)
	resp, err := app.Test(req)
	assert.NoError(t, err)
	assert.Equal(t, fiber.StatusOK, resp.StatusCode)

	// Verify file was deleted
	_, err = os.Stat("uploads/pdf/" + testFilename)
	assert.True(t, os.IsNotExist(err))
}