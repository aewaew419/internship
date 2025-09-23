package tests

import (
	"os"
	"testing"

	"backend-go/internal/config"
	"backend-go/internal/database"
	"backend-go/internal/models"
	"backend-go/internal/routes"
	"backend-go/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/suite"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// TestConfig holds configuration for test environment
type TestConfig struct {
	DatabaseURL string
	JWTSecret   string
	Environment string
}

// GetTestConfig returns test configuration
func GetTestConfig() *TestConfig {
	return &TestConfig{
		DatabaseURL: "file::memory:?cache=shared",
		JWTSecret:   "test-jwt-secret-key-for-testing-only",
		Environment: "test",
	}
}

// BaseTestSuite provides common test setup functionality
type BaseTestSuite struct {
	suite.Suite
	app        *fiber.App
	db         *gorm.DB
	config     *config.Config
	testConfig *TestConfig
}

// SetupSuite runs once before all tests in the suite
func (suite *BaseTestSuite) SetupSuite() {
	// Set test environment variables
	suite.testConfig = GetTestConfig()
	os.Setenv("ENVIRONMENT", suite.testConfig.Environment)
	os.Setenv("JWT_SECRET", suite.testConfig.JWTSecret)

	// Load test configuration
	suite.config = config.Load()
	suite.config.JWTSecret = suite.testConfig.JWTSecret

	// Initialize in-memory SQLite database for testing
	var err error
	suite.db, err = gorm.Open(sqlite.Open(suite.testConfig.DatabaseURL), &gorm.Config{})
	if err != nil {
		suite.T().Skipf("Skipping tests: database connection failed: %v", err)
		return
	}

	// Run migrations
	err = suite.migrateTestDatabase()
	if err != nil {
		suite.T().Skipf("Skipping tests: database migration failed: %v", err)
		return
	}

	// Create test data
	suite.createTestData()

	// Create Fiber app and setup routes
	suite.app = fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": err.Error(),
			})
		},
	})

	// Setup routes
	routes.Setup(suite.app, suite.db, suite.config)
}

// TearDownSuite runs once after all tests in the suite
func (suite *BaseTestSuite) TearDownSuite() {
	if suite.db != nil {
		// Clean up test data
		suite.cleanupTestData()
		
		// Close database connection
		sqlDB, _ := suite.db.DB()
		if sqlDB != nil {
			sqlDB.Close()
		}
	}
}

// SetupTest runs before each test
func (suite *BaseTestSuite) SetupTest() {
	// Clean up any test-specific data before each test
	suite.db.Where("email LIKE ?", "%test%").Delete(&models.User{})
	suite.db.Where("email LIKE ?", "%temp%").Delete(&models.User{})
}

// migrateTestDatabase runs all necessary migrations for testing
func (suite *BaseTestSuite) migrateTestDatabase() error {
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
		&models.Visitor{},
		&models.VisitorTraining{},
		&models.VisitorSchedule{},
		&models.VisitorEvaluateStudent{},
		&models.VisitorEvaluateCompany{},
		&models.StudentEvaluateCompany{},
		&models.VisitsPictures{},
		&models.CompanyPictures{},
		&models.InternshipApproval{},
		&models.EvaluationStatus{},
	)
}

// createTestData creates basic test data needed for tests
func (suite *BaseTestSuite) createTestData() {
	// Create test roles
	roles := []models.Role{
		{ID: 1, Name: "admin"},
		{ID: 2, Name: "student"},
		{ID: 3, Name: "instructor"},
		{ID: 4, Name: "staff"},
	}

	for _, role := range roles {
		var existingRole models.Role
		err := suite.db.Where("name = ?", role.Name).First(&existingRole).Error
		if err == gorm.ErrRecordNotFound {
			suite.db.Create(&role)
		}
	}

	// Create test permissions
	permissions := []models.Permission{
		{ID: 1, Name: "read_users"},
		{ID: 2, Name: "write_users"},
		{ID: 3, Name: "delete_users"},
		{ID: 4, Name: "read_students"},
		{ID: 5, Name: "write_students"},
		{ID: 6, Name: "read_courses"},
		{ID: 7, Name: "write_courses"},
	}

	for _, permission := range permissions {
		var existingPermission models.Permission
		err := suite.db.Where("name = ?", permission.Name).First(&existingPermission).Error
		if err == gorm.ErrRecordNotFound {
			suite.db.Create(&permission)
		}
	}

	// Create test campus
	campus := models.Campus{
		ID:   1,
		Name: "Test Campus",
		Code: "TC",
	}
	var existingCampus models.Campus
	err := suite.db.Where("code = ?", campus.Code).First(&existingCampus).Error
	if err == gorm.ErrRecordNotFound {
		suite.db.Create(&campus)
	}

	// Create test faculty
	faculty := models.Faculty{
		ID:       1,
		Name:     "Test Faculty",
		Code:     "TF",
		CampusID: 1,
	}
	var existingFaculty models.Faculty
	err = suite.db.Where("code = ?", faculty.Code).First(&existingFaculty).Error
	if err == gorm.ErrRecordNotFound {
		suite.db.Create(&faculty)
	}

	// Create test program
	program := models.Program{
		ID:        1,
		Name:      "Test Program",
		Code:      "TP",
		FacultyID: 1,
	}
	var existingProgram models.Program
	err = suite.db.Where("code = ?", program.Code).First(&existingProgram).Error
	if err == gorm.ErrRecordNotFound {
		suite.db.Create(&program)
	}

	// Create test major
	major := models.Major{
		ID:        1,
		Name:      "Test Major",
		Code:      "TM",
		ProgramID: 1,
	}
	var existingMajor models.Major
	err = suite.db.Where("code = ?", major.Code).First(&existingMajor).Error
	if err == gorm.ErrRecordNotFound {
		suite.db.Create(&major)
	}

	// Create test company
	company := models.Company{
		ID:   1,
		Name: "Test Company",
		Code: "TC001",
	}
	var existingCompany models.Company
	err = suite.db.Where("code = ?", company.Code).First(&existingCompany).Error
	if err == gorm.ErrRecordNotFound {
		suite.db.Create(&company)
	}
}

// cleanupTestData removes all test data from the database
func (suite *BaseTestSuite) cleanupTestData() {
	// Clean up in reverse order of dependencies
	suite.db.Where("1 = 1").Delete(&models.VisitsPictures{})
	suite.db.Where("1 = 1").Delete(&models.CompanyPictures{})
	suite.db.Where("1 = 1").Delete(&models.StudentEvaluateCompany{})
	suite.db.Where("1 = 1").Delete(&models.VisitorEvaluateCompany{})
	suite.db.Where("1 = 1").Delete(&models.VisitorEvaluateStudent{})
	suite.db.Where("1 = 1").Delete(&models.VisitorSchedule{})
	suite.db.Where("1 = 1").Delete(&models.VisitorTraining{})
	suite.db.Where("1 = 1").Delete(&models.Visitor{})
	suite.db.Where("1 = 1").Delete(&models.StudentTraining{})
	suite.db.Where("1 = 1").Delete(&models.StudentEnrollStatus{})
	suite.db.Where("1 = 1").Delete(&models.StudentEnroll{})
	suite.db.Where("1 = 1").Delete(&models.CourseCommittee{})
	suite.db.Where("1 = 1").Delete(&models.CourseInstructor{})
	suite.db.Where("1 = 1").Delete(&models.CourseSection{})
	suite.db.Where("1 = 1").Delete(&models.Course{})
	suite.db.Where("1 = 1").Delete(&models.Staff{})
	suite.db.Where("1 = 1").Delete(&models.Instructor{})
	suite.db.Where("1 = 1").Delete(&models.Student{})
	suite.db.Where("1 = 1").Delete(&models.User{})
	suite.db.Where("1 = 1").Delete(&models.InternshipApproval{})
	suite.db.Where("1 = 1").Delete(&models.EvaluationStatus{})
}

// CreateTestUser creates a test user with specified role
func (suite *BaseTestSuite) CreateTestUser(email, fullName string, roleID uint) *models.User {
	hashedPassword, _ := services.HashPassword("password123")
	user := &models.User{
		FullName: &fullName,
		Email:    email,
		Password: hashedPassword,
		RoleID:   roleID,
	}
	
	err := suite.db.Create(user).Error
	suite.Require().NoError(err)
	
	return user
}

// CreateTestStudent creates a test student
func (suite *BaseTestSuite) CreateTestStudent(studentID, email, fullName string) (*models.User, *models.Student) {
	user := suite.CreateTestUser(email, fullName, 2) // student role
	
	student := &models.Student{
		UserID:    user.ID,
		StudentID: studentID,
		MajorID:   1, // test major
	}
	
	err := suite.db.Create(student).Error
	suite.Require().NoError(err)
	
	return user, student
}

// CreateTestInstructor creates a test instructor
func (suite *BaseTestSuite) CreateTestInstructor(instructorID, email, fullName string) (*models.User, *models.Instructor) {
	user := suite.CreateTestUser(email, fullName, 3) // instructor role
	
	instructor := &models.Instructor{
		UserID:       user.ID,
		InstructorID: instructorID,
		FacultyID:    1, // test faculty
	}
	
	err := suite.db.Create(instructor).Error
	suite.Require().NoError(err)
	
	return user, instructor
}

// GetAuthToken generates a JWT token for testing
func (suite *BaseTestSuite) GetAuthToken(userID uint, role string) string {
	jwtService := services.NewJWTService(suite.config.JWTSecret)
	token, err := jwtService.GenerateAccessToken(userID, role)
	suite.Require().NoError(err)
	return token
}

// StringPtr returns a pointer to the given string
func StringPtr(s string) *string {
	return &s
}

// UintPtr returns a pointer to the given uint
func UintPtr(u uint) *uint {
	return &u
}