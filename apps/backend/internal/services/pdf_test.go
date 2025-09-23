package services

import (
	"os"
	"path/filepath"
	"testing"
	"time"

	"backend-go/internal/models"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/suite"
)

type PDFServiceTestSuite struct {
	suite.Suite
	pdfService  *PDFService
	outputDir   string
	testStudent models.Student
	testCompany models.Company
	testTraining models.StudentTraining
}

func (suite *PDFServiceTestSuite) SetupSuite() {
	// Create temporary output directory
	suite.outputDir = "test_pdf_output"
	err := os.MkdirAll(suite.outputDir, 0755)
	suite.Require().NoError(err)

	// Initialize PDF service
	suite.pdfService = NewPDFService(suite.outputDir)

	// Create test data
	suite.createTestData()
}

func (suite *PDFServiceTestSuite) TearDownSuite() {
	// Clean up output directory
	os.RemoveAll(suite.outputDir)
}

func (suite *PDFServiceTestSuite) createTestData() {
	// Create test student
	suite.testStudent = models.Student{
		ID:        1,
		Name:      "John",
		Surname:   "Doe",
		StudentID: "65130001",
		GPAX:      3.75,
		Email:     "john.doe@student.kmutt.ac.th",
	}

	// Create test company
	suite.testCompany = models.Company{
		ID:             1,
		CompanyNameEn:  "Tech Innovation Ltd.",
		CompanyNameTh:  "บริษัท เทค อินโนเวชั่น จำกัด",
		CompanyAddress: "123 Innovation Street, Bangkok 10400",
		CompanyEmail:   "hr@techinnovation.com",
		CompanyType:    "Technology",
	}

	// Create test training
	suite.testTraining = models.StudentTraining{
		ID:                     1,
		StartDate:              time.Date(2024, 6, 1, 0, 0, 0, 0, time.UTC),
		EndDate:                time.Date(2024, 10, 31, 0, 0, 0, 0, time.UTC),
		Coordinator:            "Jane Smith",
		CoordinatorEmail:       "jane.smith@techinnovation.com",
		CoordinatorPhoneNumber: "02-123-4567",
		Supervisor:             "Bob Johnson",
		SupervisorEmail:        "bob.johnson@techinnovation.com",
		SupervisorPhoneNumber:  "02-234-5678",
		Department:             "Software Development",
		Position:               "Junior Developer",
		JobDescription:         "Develop and maintain web applications using modern technologies",
		DocumentLanguage:       models.DocumentLanguageTH,
		Company:                &suite.testCompany,
	}
}

func (suite *PDFServiceTestSuite) TestNewPDFService() {
	service := NewPDFService("test_dir")
	assert.NotNil(suite.T(), service)
	assert.Equal(suite.T(), "test_dir", service.outputDir)
}

func (suite *PDFServiceTestSuite) TestGenerateStudentListReport() {
	// Prepare test data
	students := []models.Student{suite.testStudent}
	reportData := ReportData{
		Title:       "Student List Report",
		Students:    students,
		GeneratedAt: time.Now(),
		GeneratedBy: "Test Admin",
	}

	// Generate report
	filename, err := suite.pdfService.GenerateReport(ReportTypeStudentList, reportData)
	
	// Assert
	assert.NoError(suite.T(), err)
	assert.NotEmpty(suite.T(), filename)
	assert.Contains(suite.T(), filename, "student_list")
	assert.Contains(suite.T(), filename, ".pdf")

	// Check if file exists
	filePath := filepath.Join(suite.outputDir, filename)
	_, err = os.Stat(filePath)
	assert.NoError(suite.T(), err)

	// Check file size (should be greater than 0)
	fileInfo, err := os.Stat(filePath)
	assert.NoError(suite.T(), err)
	assert.Greater(suite.T(), fileInfo.Size(), int64(0))

	// Clean up
	os.Remove(filePath)
}

func (suite *PDFServiceTestSuite) TestGenerateInternshipSummaryReport() {
	// Prepare test data
	trainings := []models.StudentTraining{suite.testTraining}
	reportData := ReportData{
		Title:       "Internship Summary Report",
		Trainings:   trainings,
		GeneratedAt: time.Now(),
		GeneratedBy: "Test Admin",
	}

	// Generate report
	filename, err := suite.pdfService.GenerateReport(ReportTypeInternshipSummary, reportData)
	
	// Assert
	assert.NoError(suite.T(), err)
	assert.NotEmpty(suite.T(), filename)
	assert.Contains(suite.T(), filename, "internship_summary")
	assert.Contains(suite.T(), filename, ".pdf")

	// Check if file exists
	filePath := filepath.Join(suite.outputDir, filename)
	_, err = os.Stat(filePath)
	assert.NoError(suite.T(), err)

	// Clean up
	os.Remove(filePath)
}

func (suite *PDFServiceTestSuite) TestGenerateCompanyEvaluationReport() {
	// Prepare test data
	companies := []models.Company{suite.testCompany}
	reportData := ReportData{
		Title:       "Company Evaluation Report",
		Companies:   companies,
		GeneratedAt: time.Now(),
		GeneratedBy: "Test Admin",
	}

	// Generate report
	filename, err := suite.pdfService.GenerateReport(ReportTypeCompanyEvaluation, reportData)
	
	// Assert
	assert.NoError(suite.T(), err)
	assert.NotEmpty(suite.T(), filename)
	assert.Contains(suite.T(), filename, "company_evaluation")
	assert.Contains(suite.T(), filename, ".pdf")

	// Check if file exists
	filePath := filepath.Join(suite.outputDir, filename)
	_, err = os.Stat(filePath)
	assert.NoError(suite.T(), err)

	// Clean up
	os.Remove(filePath)
}

func (suite *PDFServiceTestSuite) TestGenerateCoopRequestLetterThai() {
	// Prepare test data
	letterData := LetterData{
		Student:     suite.testStudent,
		Company:     &suite.testCompany,
		Training:    &suite.testTraining,
		Recipient:   "ผู้จัดการฝ่ายบุคคล",
		Language:    models.DocumentLanguageTH,
		GeneratedAt: time.Now(),
		GeneratedBy: "Test Admin",
	}

	// Generate letter
	filename, err := suite.pdfService.GenerateLetter(LetterTypeCoopRequest, letterData)
	
	// Assert
	assert.NoError(suite.T(), err)
	assert.NotEmpty(suite.T(), filename)
	assert.Contains(suite.T(), filename, "coop_request")
	assert.Contains(suite.T(), filename, suite.testStudent.StudentID)
	assert.Contains(suite.T(), filename, ".pdf")

	// Check if file exists
	filePath := filepath.Join(suite.outputDir, filename)
	_, err = os.Stat(filePath)
	assert.NoError(suite.T(), err)

	// Clean up
	os.Remove(filePath)
}

func (suite *PDFServiceTestSuite) TestGenerateCoopRequestLetterEnglish() {
	// Prepare test data
	letterData := LetterData{
		Student:     suite.testStudent,
		Company:     &suite.testCompany,
		Training:    &suite.testTraining,
		Recipient:   "HR Manager",
		Language:    models.DocumentLanguageEN,
		GeneratedAt: time.Now(),
		GeneratedBy: "Test Admin",
	}

	// Generate letter
	filename, err := suite.pdfService.GenerateLetter(LetterTypeCoopRequest, letterData)
	
	// Assert
	assert.NoError(suite.T(), err)
	assert.NotEmpty(suite.T(), filename)
	assert.Contains(suite.T(), filename, "coop_request")
	assert.Contains(suite.T(), filename, ".pdf")

	// Check if file exists
	filePath := filepath.Join(suite.outputDir, filename)
	_, err = os.Stat(filePath)
	assert.NoError(suite.T(), err)

	// Clean up
	os.Remove(filePath)
}

func (suite *PDFServiceTestSuite) TestGenerateReferralLetter() {
	// Prepare test data
	letterData := LetterData{
		Student:     suite.testStudent,
		Company:     &suite.testCompany,
		Training:    &suite.testTraining,
		Recipient:   "Company Manager",
		Language:    models.DocumentLanguageEN,
		GeneratedAt: time.Now(),
		GeneratedBy: "Test Admin",
	}

	// Generate letter
	filename, err := suite.pdfService.GenerateLetter(LetterTypeReferral, letterData)
	
	// Assert
	assert.NoError(suite.T(), err)
	assert.NotEmpty(suite.T(), filename)
	assert.Contains(suite.T(), filename, "referral")
	assert.Contains(suite.T(), filename, ".pdf")

	// Check if file exists
	filePath := filepath.Join(suite.outputDir, filename)
	_, err = os.Stat(filePath)
	assert.NoError(suite.T(), err)

	// Clean up
	os.Remove(filePath)
}

func (suite *PDFServiceTestSuite) TestGenerateRecommendationLetter() {
	// Prepare test data
	letterData := LetterData{
		Student:     suite.testStudent,
		Company:     &suite.testCompany,
		Training:    &suite.testTraining,
		Recipient:   "To Whom It May Concern",
		Language:    models.DocumentLanguageTH,
		GeneratedAt: time.Now(),
		GeneratedBy: "Test Admin",
	}

	// Generate letter
	filename, err := suite.pdfService.GenerateLetter(LetterTypeRecommendation, letterData)
	
	// Assert
	assert.NoError(suite.T(), err)
	assert.NotEmpty(suite.T(), filename)
	assert.Contains(suite.T(), filename, "recommendation")
	assert.Contains(suite.T(), filename, ".pdf")

	// Check if file exists
	filePath := filepath.Join(suite.outputDir, filename)
	_, err = os.Stat(filePath)
	assert.NoError(suite.T(), err)

	// Clean up
	os.Remove(filePath)
}

func (suite *PDFServiceTestSuite) TestGenerateAcceptanceLetter() {
	// Prepare test data
	letterData := LetterData{
		Student:     suite.testStudent,
		Company:     &suite.testCompany,
		Training:    &suite.testTraining,
		Recipient:   "Student Affairs Office",
		Language:    models.DocumentLanguageEN,
		GeneratedAt: time.Now(),
		GeneratedBy: "Test Admin",
	}

	// Generate letter
	filename, err := suite.pdfService.GenerateLetter(LetterTypeAcceptance, letterData)
	
	// Assert
	assert.NoError(suite.T(), err)
	assert.NotEmpty(suite.T(), filename)
	assert.Contains(suite.T(), filename, "acceptance")
	assert.Contains(suite.T(), filename, ".pdf")

	// Check if file exists
	filePath := filepath.Join(suite.outputDir, filename)
	_, err = os.Stat(filePath)
	assert.NoError(suite.T(), err)

	// Clean up
	os.Remove(filePath)
}

func (suite *PDFServiceTestSuite) TestUnsupportedReportType() {
	// Prepare test data with unsupported report type
	reportData := ReportData{
		Title:       "Unsupported Report",
		GeneratedAt: time.Now(),
		GeneratedBy: "Test Admin",
	}

	// Generate report with unsupported type
	filename, err := suite.pdfService.GenerateReport("unsupported_type", reportData)
	
	// Assert
	assert.Error(suite.T(), err)
	assert.Empty(suite.T(), filename)
	assert.Contains(suite.T(), err.Error(), "unsupported report type")
}

func (suite *PDFServiceTestSuite) TestUnsupportedLetterType() {
	// Prepare test data with unsupported letter type
	letterData := LetterData{
		Student:     suite.testStudent,
		Recipient:   "Test Recipient",
		Language:    models.DocumentLanguageTH,
		GeneratedAt: time.Now(),
		GeneratedBy: "Test Admin",
	}

	// Generate letter with unsupported type
	filename, err := suite.pdfService.GenerateLetter("unsupported_type", letterData)
	
	// Assert
	assert.Error(suite.T(), err)
	assert.Empty(suite.T(), filename)
	assert.Contains(suite.T(), err.Error(), "unsupported letter type")
}

func (suite *PDFServiceTestSuite) TestInvalidOutputDirectory() {
	// Create service with invalid directory (read-only)
	invalidService := NewPDFService("/invalid/readonly/path")
	
	reportData := ReportData{
		Title:       "Test Report",
		Students:    []models.Student{suite.testStudent},
		GeneratedAt: time.Now(),
		GeneratedBy: "Test Admin",
	}

	// Try to generate report
	filename, err := invalidService.GenerateReport(ReportTypeStudentList, reportData)
	
	// Assert
	assert.Error(suite.T(), err)
	assert.Empty(suite.T(), filename)
}

func TestPDFServiceTestSuite(t *testing.T) {
	suite.Run(t, new(PDFServiceTestSuite))
}