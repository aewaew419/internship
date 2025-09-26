package tests

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"testing"
	"time"

	"backend-go/internal/config"
	"backend-go/internal/models"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/suite"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// EnhancedTestConfig provides comprehensive test configuration
type EnhancedTestConfig struct {
	DatabaseURL     string
	JWTSecret       string
	Environment     string
	LogLevel        string
	TestDataPath    string
	TempDir         string
	EnableLogging   bool
	EnableProfiling bool
	TestTimeout     time.Duration
	CleanupAfter    bool
}

// GetEnhancedTestConfig returns enhanced test configuration
func GetEnhancedTestConfig() *EnhancedTestConfig {
	tempDir := filepath.Join(os.TempDir(), fmt.Sprintf("backend_test_%d", time.Now().UnixNano()))
	
	return &EnhancedTestConfig{
		DatabaseURL:     fmt.Sprintf("file:%s/test.db?cache=shared&mode=rwc", tempDir),
		JWTSecret:       "enhanced-test-jwt-secret-key-for-comprehensive-testing",
		Environment:     "test",
		LogLevel:        "error", // Reduce noise in tests
		TestDataPath:    filepath.Join(tempDir, "test_data"),
		TempDir:         tempDir,
		EnableLogging:   false, // Disable by default for cleaner test output
		EnableProfiling: false,
		TestTimeout:     30 * time.Second,
		CleanupAfter:    true,
	}
}

// EnhancedTestSuite provides comprehensive test setup functionality
type EnhancedTestSuite struct {
	suite.Suite
	app           *fiber.App
	db            *gorm.DB
	config        *config.Config
	testConfig    *EnhancedTestConfig
	testUtilities *TestUtilities
	startTime     time.Time
}

// SetupSuite runs once before all tests in the suite
func (suite *EnhancedTestSuite) SetupSuite() {
	suite.startTime = time.Now()
	suite.testConfig = GetEnhancedTestConfig()
	
	// Create temporary directories
	err := os.MkdirAll(suite.testConfig.TempDir, 0755)
	if err != nil {
		suite.T().Skipf("Failed to create temp directory: %v", err)
		return
	}
	
	err = os.MkdirAll(suite.testConfig.TestDataPath, 0755)
	if err != nil {
		suite.T().Skipf("Failed to create test data directory: %v", err)
		return
	}
	
	// Set test environment variables
	suite.setTestEnvironment()
	
	// Load test configuration
	suite.config = config.Load()
	suite.config.JWTSecret = suite.testConfig.JWTSecret
	
	// Initialize test database
	suite.initializeTestDatabase()
	
	// Create test utilities
	suite.testUtilities = NewTestUtilities(suite.db, suite.app, &TestConfiguration{
		JWTSecret: suite.testConfig.JWTSecret,
	})
	
	// Setup test data
	suite.setupTestData()
	
	suite.T().Logf("Enhanced test suite setup completed in %v", time.Since(suite.startTime))
}

// TearDownSuite runs once after all tests in the suite
func (suite *EnhancedTestSuite) TearDownSuite() {
	if suite.db != nil {
		// Clean up test data if enabled
		if suite.testConfig.CleanupAfter {
			suite.cleanupAllTestData()
		}
		
		// Close database connection
		sqlDB, _ := suite.db.DB()
		if sqlDB != nil {
			sqlDB.Close()
		}
	}
	
	// Clean up temporary directories
	if suite.testConfig.CleanupAfter {
		os.RemoveAll(suite.testConfig.TempDir)
	}
	
	totalTime := time.Since(suite.startTime)
	suite.T().Logf("Enhanced test suite completed in %v", totalTime)
}

// SetupTest runs before each test
func (suite *EnhancedTestSuite) SetupTest() {
	// Clean up any test-specific data before each test
	suite.cleanupTransientTestData()
}

// TearDownTest runs after each test
func (suite *EnhancedTestSuite) TearDownTest() {
	// Clean up any test-specific data after each test
	suite.cleanupTransientTestData()
}

// setTestEnvironment sets up test environment variables
func (suite *EnhancedTestSuite) setTestEnvironment() {
	os.Setenv("ENVIRONMENT", suite.testConfig.Environment)
	os.Setenv("JWT_SECRET", suite.testConfig.JWTSecret)
	os.Setenv("LOG_LEVEL", suite.testConfig.LogLevel)
	os.Setenv("DATABASE_URL", suite.testConfig.DatabaseURL)
	
	// Disable external services in test mode
	os.Setenv("DISABLE_EXTERNAL_SERVICES", "true")
	os.Setenv("MOCK_EXTERNAL_APIS", "true")
}

// initializeTestDatabase sets up the test database
func (suite *EnhancedTestSuite) initializeTestDatabase() {
	var gormLogger logger.Interface
	
	if suite.testConfig.EnableLogging {
		gormLogger = logger.Default.LogMode(logger.Info)
	} else {
		gormLogger = logger.Default.LogMode(logger.Silent)
	}
	
	var err error
	suite.db, err = gorm.Open(postgres.Open(suite.testConfig.DatabaseURL), &gorm.Config{
		Logger: gormLogger,
		NowFunc: func() time.Time {
			return time.Now().UTC()
		},
	})
	
	if err != nil {
		suite.T().Skipf("Failed to connect to test database: %v", err)
		return
	}
	
	// Configure connection pool for testing
	sqlDB, err := suite.db.DB()
	if err != nil {
		suite.T().Skipf("Failed to get underlying sql.DB: %v", err)
		return
	}
	
	sqlDB.SetMaxIdleConns(2)
	sqlDB.SetMaxOpenConns(10)
	sqlDB.SetConnMaxLifetime(time.Hour)
	
	// Run migrations
	err = suite.migrateTestDatabase()
	if err != nil {
		suite.T().Skipf("Failed to migrate test database: %v", err)
		return
	}
	
	// Create Fiber app
	suite.createTestApp()
}

// migrateTestDatabase runs all necessary migrations for testing
func (suite *EnhancedTestSuite) migrateTestDatabase() error {
	// Enable foreign key constraints for SQLite
	suite.db.Exec("PRAGMA foreign_keys = ON")
	
	return suite.db.AutoMigrate(
		&models.Role{},
		&models.Permission{},
		&models.User{},
		&models.Campus{},
		&models.Faculty{},
		&models.Program{},
		&models.Major{},
		&models.Curriculum{},
		&models.Student{},
		&models.Instructor{},
		&models.Staff{},
		&models.Course{},
		&models.CourseSection{},
		&models.CourseInstructor{},
		&models.CourseCommittee{},
		&models.StudentEnroll{},
		&models.StudentEnrollStatus{},
		&models.StudentTraining{},
		&models.Company{},
		&models.VisitorTraining{},
		&models.VisitorSchedule{},
		&models.VisitorEvaluateStudent{},
		&models.VisitorEvaluateCompany{},
		&models.StudentEvaluateCompany{},
		&models.VisitsPictures{},
		&models.CompanyPictures{},
	)
}

// createTestApp creates and configures the Fiber app for testing
func (suite *EnhancedTestSuite) createTestApp() {
	suite.app = fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			message := err.Error()
			
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
				message = e.Message
			}
			
			return c.Status(code).JSON(fiber.Map{
				"error":   message,
				"code":    code,
				"success": false,
			})
		},
		DisableStartupMessage: true,
		ReadTimeout:           suite.testConfig.TestTimeout,
		WriteTimeout:          suite.testConfig.TestTimeout,
	})
	
	// Setup routes (this would be imported from your routes package)
	// routes.Setup(suite.app, suite.db, suite.config)
}

// setupTestData creates comprehensive test data
func (suite *EnhancedTestSuite) setupTestData() {
	// Create test roles with comprehensive permissions
	suite.createTestRoles()
	
	// Create test permissions
	suite.createTestPermissions()
	
	// Create test organizational structure
	suite.createTestOrganizationalStructure()
	
	// Create test companies
	suite.createTestCompanies()
	
	// Create test users with different roles
	suite.createTestUsers()
}

// createTestRoles creates comprehensive test roles
func (suite *EnhancedTestSuite) createTestRoles() {
	roles := []models.Role{
		{ID: 1, Name: "super_admin"},
		{ID: 2, Name: "admin"},
		{ID: 3, Name: "student"},
		{ID: 4, Name: "instructor"},
		{ID: 5, Name: "staff"},
		{ID: 6, Name: "visitor"},
		{ID: 7, Name: "company_supervisor"},
	}
	
	for _, role := range roles {
		var existingRole models.Role
		err := suite.db.Where("name = ?", role.Name).First(&existingRole).Error
		if err == gorm.ErrRecordNotFound {
			suite.db.Create(&role)
		}
	}
}

// createTestPermissions creates comprehensive test permissions
func (suite *EnhancedTestSuite) createTestPermissions() {
	permissions := []models.Permission{
		// User management permissions
		{ID: 1, Name: "users.read"},
		{ID: 2, Name: "users.create"},
		{ID: 3, Name: "users.update"},
		{ID: 4, Name: "users.delete"},
		
		// Student management permissions
		{ID: 5, Name: "students.read"},
		{ID: 6, Name: "students.create"},
		{ID: 7, Name: "students.update"},
		{ID: 8, Name: "students.delete"},
		
		// Course management permissions
		{ID: 9, Name: "courses.read"},
		{ID: 10, Name: "courses.create"},
		{ID: 11, Name: "courses.update"},
		{ID: 12, Name: "courses.delete"},
		
		// Evaluation permissions
		{ID: 13, Name: "evaluations.read"},
		{ID: 14, Name: "evaluations.create"},
		{ID: 15, Name: "evaluations.update"},
		{ID: 16, Name: "evaluations.delete"},
		
		// Report permissions
		{ID: 17, Name: "reports.read"},
		{ID: 18, Name: "reports.create"},
		{ID: 19, Name: "reports.export"},
		
		// System administration permissions
		{ID: 20, Name: "system.admin"},
		{ID: 21, Name: "system.config"},
		{ID: 22, Name: "system.logs"},
	}
	
	for _, permission := range permissions {
		var existingPermission models.Permission
		err := suite.db.Where("name = ?", permission.Name).First(&existingPermission).Error
		if err == gorm.ErrRecordNotFound {
			suite.db.Create(&permission)
		}
	}
}

// createTestOrganizationalStructure creates test organizational data
func (suite *EnhancedTestSuite) createTestOrganizationalStructure() {
	// Create test campus
	campus := models.Campus{ID: 1}
	var existingCampus models.Campus
	err := suite.db.Where("id = ?", campus.ID).First(&existingCampus).Error
	if err == gorm.ErrRecordNotFound {
		suite.db.Create(&campus)
	}
	
	// Create test faculty
	faculty := models.Faculty{ID: 1, CampusID: 1}
	var existingFaculty models.Faculty
	err = suite.db.Where("id = ?", faculty.ID).First(&existingFaculty).Error
	if err == gorm.ErrRecordNotFound {
		suite.db.Create(&faculty)
	}
	
	// Create test program
	program := models.Program{ID: 1, FacultyID: 1}
	var existingProgram models.Program
	err = suite.db.Where("id = ?", program.ID).First(&existingProgram).Error
	if err == gorm.ErrRecordNotFound {
		suite.db.Create(&program)
	}
	
	// Create test major
	major := models.Major{ID: 1, ProgramID: 1}
	var existingMajor models.Major
	err = suite.db.Where("id = ?", major.ID).First(&existingMajor).Error
	if err == gorm.ErrRecordNotFound {
		suite.db.Create(&major)
	}
}

// createTestCompanies creates test companies
func (suite *EnhancedTestSuite) createTestCompanies() {
	companies := []models.Company{
		{ID: 1},
		{ID: 2},
		{ID: 3},
	}
	
	for _, company := range companies {
		var existingCompany models.Company
		err := suite.db.Where("id = ?", company.ID).First(&existingCompany).Error
		if err == gorm.ErrRecordNotFound {
			suite.db.Create(&company)
		}
	}
}

// createTestUsers creates test users with different roles
func (suite *EnhancedTestSuite) createTestUsers() {
	// This will be called by individual tests as needed
	// to avoid conflicts between test cases
}

// cleanupTransientTestData removes data that should be cleaned between tests
func (suite *EnhancedTestSuite) cleanupTransientTestData() {
	// Clean up test users that might be created during tests
	suite.db.Where("email LIKE ?", "%test%").Delete(&models.User{})
	suite.db.Where("email LIKE ?", "%temp%").Delete(&models.User{})
	suite.db.Where("email LIKE ?", "%example.com").Delete(&models.User{})
	
	// Clean up test students
	suite.db.Where("student_id LIKE ?", "TEST%").Delete(&models.Student{})
	
	// Clean up test instructors
	suite.db.Where("instructor_id LIKE ?", "TEST%").Delete(&models.Instructor{})
	
	// Clean up test courses
	suite.db.Where("code LIKE ?", "TEST%").Delete(&models.Course{})
}

// cleanupAllTestData removes all test data from the database
func (suite *EnhancedTestSuite) cleanupAllTestData() {
	// Clean up in reverse order of dependencies
	tables := []interface{}{
		&models.VisitsPictures{},
		&models.CompanyPictures{},
		&models.StudentEvaluateCompany{},
		&models.VisitorEvaluateCompany{},
		&models.VisitorEvaluateStudent{},
		&models.VisitorSchedule{},
		&models.VisitorTraining{},
		&models.StudentTraining{},
		&models.StudentEnrollStatus{},
		&models.StudentEnroll{},
		&models.CourseCommittee{},
		&models.CourseInstructor{},
		&models.CourseSection{},
		&models.Course{},
		&models.Staff{},
		&models.Instructor{},
		&models.Student{},
		&models.User{},
		&models.Company{},
		&models.Curriculum{},
		&models.Major{},
		&models.Program{},
		&models.Faculty{},
		&models.Campus{},
		&models.Permission{},
		&models.Role{},
	}
	
	for _, table := range tables {
		suite.db.Where("1 = 1").Delete(table)
	}
}

// GetTestUtilities returns the test utilities instance
func (suite *EnhancedTestSuite) GetTestUtilities() *TestUtilities {
	return suite.testUtilities
}

// GetDB returns the test database instance
func (suite *EnhancedTestSuite) GetDB() *gorm.DB {
	return suite.db
}

// GetApp returns the test Fiber app instance
func (suite *EnhancedTestSuite) GetApp() *fiber.App {
	return suite.app
}

// GetConfig returns the test configuration
func (suite *EnhancedTestSuite) GetConfig() *config.Config {
	return suite.config
}

// LogTestInfo logs test information
func (suite *EnhancedTestSuite) LogTestInfo(format string, args ...interface{}) {
	if suite.testConfig.EnableLogging {
		log.Printf("[TEST] "+format, args...)
	}
}

// CreateTempFile creates a temporary file for testing
func (suite *EnhancedTestSuite) CreateTempFile(content string, extension string) string {
	tempFile := filepath.Join(suite.testConfig.TempDir, fmt.Sprintf("test_file_%d%s", time.Now().UnixNano(), extension))
	err := os.WriteFile(tempFile, []byte(content), 0644)
	suite.Require().NoError(err)
	return tempFile
}

// CreateTempDir creates a temporary directory for testing
func (suite *EnhancedTestSuite) CreateTempDir() string {
	tempDir := filepath.Join(suite.testConfig.TempDir, fmt.Sprintf("test_dir_%d", time.Now().UnixNano()))
	err := os.MkdirAll(tempDir, 0755)
	suite.Require().NoError(err)
	return tempDir
}