package tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http/httptest"
	"strconv"
	"sync"
	"testing"
	"time"

	"backend-go/internal/config"
	"backend-go/internal/models"
	"backend-go/internal/routes"
	"backend-go/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

// ComprehensiveTestSuite provides a complete test suite for the Go backend
type ComprehensiveTestSuite struct {
	suite.Suite
	app        *fiber.App
	db         *gorm.DB
	config     *config.Config
	testConfig *TestConfig
}

// SetupSuite runs once before all tests in the suite
func (suite *ComprehensiveTestSuite) SetupSuite() {
	// Set test environment variables
	suite.testConfig = GetTestConfig()

	// Load test configuration
	suite.config = config.Load()
	suite.config.JWTSecret = suite.testConfig.JWTSecret

	// Try to connect to MySQL test database
	var err error
	
	// First try MySQL connection
	mysqlDSN := "root:password@tcp(localhost:3306)/internship_test_db?charset=utf8mb4&parseTime=True&loc=Local"

	suite.db, err = gorm.Open(mysql.Open(mysqlDSN), &gorm.Config{})
	if err != nil {
		suite.T().Logf("MySQL connection failed: %v", err)
		suite.T().Skip("Skipping tests: no database connection available")
		return
	}

	// Test database connection
	sqlDB, err := suite.db.DB()
	if err != nil {
		suite.T().Skip("Skipping tests: database connection failed")
		return
	}

	err = sqlDB.Ping()
	if err != nil {
		suite.T().Skip("Skipping tests: database ping failed")
		return
	}

	// Run migrations
	err = suite.migrateTestDatabase()
	if err != nil {
		suite.T().Logf("Migration failed: %v", err)
		suite.T().Skip("Skipping tests: database migration failed")
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
func (suite *ComprehensiveTestSuite) TearDownSuite() {
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
func (suite *ComprehensiveTestSuite) SetupTest() {
	if suite.db != nil {
		// Clean up any test-specific data before each test
		suite.db.Where("email LIKE ?", "%test%").Delete(&models.User{})
		suite.db.Where("email LIKE ?", "%temp%").Delete(&models.User{})
	}
}

// migrateTestDatabase runs all necessary migrations for testing
func (suite *ComprehensiveTestSuite) migrateTestDatabase() error {
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

// createTestData creates basic test data needed for tests
func (suite *ComprehensiveTestSuite) createTestData() {
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

	// Create organizational structure
	s
}

// createOrganizationalData creates campus
func (suite *ComprehensiveTestSuite) createOrganizationalData() {
	// Create test campus
	campus := models.Campus{ID: 1}
	vapus
	eError

		suite.db.Create(&campus)
	}

y
	faculty := models.Faculty{ID: 1, CampusID: 1}
	var existingFaculty models.Faculty
	err = suite.db.Where(or
	if err == gorm.ErrRecordNotFou
		suite.db.Create(&faculty)
	}

	// Create test program
	p
ram
	err = suite.db.Where("
	if err == gorm.ErrRecordNotFound {
		suite.db.Create(&program)
	}

	// Create test major
	m 1}
ajor
	err = suite.db.Where("
	if err == gorm.ErrRecordNotFound {
		suite.db.Create(&major)
	}

	// Create test company
	cy{ID: 1}
ompany
	err = suite.db.Where
	if err == gorm.ErrRecordNotFound {
		suite.db.Create(&company)
	}
}

//
() {
	// Clean up in reverse
	suite.db.Where("1 = 1").Delete(&ictures{})
	suite.db.Where("1 = 1").Delete(&mo
	suite.db.Where("1 = 1").Delete(&models.StudentEvaluateCompany{})
	suite.db.Where("1 = 1").Delete(&mo)
	suite.db.Where("1 = 1").De
	s)
	
)
	suite.db.Where("1 = 1").Delete(&models.StudentEnrollStatu})
	suite.db.Where("1 = 1").Delete(&models.StudentEnroll{})
	suite.db.Where("1 = 1").Delete(&models.Cours
	suite.db.Where("1 = 1").Delete(&models.CourseInstructor{
	suite.db.Where("1 = 1").Delete(&models.CourseSection{})
	suite.db.Where("1 = 1").Delete(&models.Course{})
	suite.db.Where("1 = 1").Delete(&models.Staff{})
	suite.db.Where("1 = 1").Delete(&models.Instructor{})
	suite.db.Where("1 = 1").Delete(&models.Student{})
	suite.db.Where("1 = 1").Delete(&models.User{})
}

// CreateTestUser creates a test user with specified role
func (suite *ComprehensiveTestSuite) CreateTestUser(email, {
	hashedPassword, _ := services.HashPassword("password123")
	user := &models.User{
		FullName: &fullName,
		Email:    email,
		Password: hashedPassword,
		RoleID:   roleID,
	}
	

	suite.Require().NoError(err)
	
	return user
}

// GetAuthToken ge
func (suite *ComprehensiveT
	jwtService := serv
	tole)
	err)
	return token
}

// Test Auth
fs() {
ite.T()

	t.Run("POST /api/v1/login", func(t *testing.T) {
		// Register user first
	
		
		payload := map[strig{
			"email":    "logintecom",
			"password": "password123",
		}
	
		body, _ := json.Marshal(payload)
		req := httptest.NewRequest(ody))
	)
		
	q)

		assert.Equal(t, 200, resp.StatusCode)
	})

	 {
		user := suite.CreateTestUser("me
		token := suite.GetAuthadmin")
		
		req := httptest.NewRequest("GET"il)
		
		
		resp, err := suite.app.Test(req)
		assert.NoError(t, err)
	
	})
}

// Test User Management Endpoints
func (suite *ComprehensiveTestSuite) TestUserManagementEndpoints() {
	t := suite.T()
	adminUser := suite.CreateTestUser("admin@example.com", "Ad
	adminToken := suite.GetAuthT")

	
 users
		for i := 1; i <= 5; i++ {
			suite.CreateTestUser(fmt.Sprintf("user%d@example.com", i), fmt.Sp2)
		}
		
		req := httptest.NewRequest("GET", "/api/v1/users?p nil)
		req.Header.Set("Authorization", "B
		
		resp, err := suite.app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
	})

	tng.T) {
		user := suite.CreateTestUser("ge)
		
		req := httptest.NewRequest("GET", "/api/v1/users/")
		n)
		
		resp, err := suite.app(req)
		assert.NoError(t, err)
		aCode)
})
}

// Test Health Check Endpoints
fu
	t := suite.T()

	t.Run("GET /health", func(t  {
		r)
		
		resp, err := suite.app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
	})

	t.Run("GET /health/db",{
		req := httptest.NewRequest("GET", "/h
		
		resp, err := suite.app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
	})
}

ics
func (suite *ComprehensiveTestSuite) TestPerfstics() {
	t := suite.T()
	
	a1)
	adminToken := suite.GetAuthToken(adminUser.ID, "admin")

	t.T) {
		var wg sync.WaitGroup
		concurrency := 10
		requestsPerWorker := 5
		
		startTime := time.Now()
		
		for i := 0; i < concurrency; i++ {
			wg.Add(1)
			
	
	
				for j := 0; j < requestsPerWor; j++ {
					req := httptest.NewRequest("GET", "/api/v1/users/stats", nil)
					req.HeaderToken)
					
					resp, err := suite.app.Test(req)
)
					assert.Equal(t, 200, resp.StatusCode)
				}
			}(i)
		}
		
		)
		duration := time.Since(startTime)
		
		
		requestsPerSecond := float64(totds()
		
		t.Logf("Processed %d requests in %v (
		
	})
}

// Test Error Handling
func (suite *Comprehensiv
	t 

	t.Run("404 Not Found", func(t *testing.T) {
		req := httptest.NewRequest("GET", t", nil)
		
		resp, err := suite.app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, tusCode)
	})

	t.Run("401 Unauthorized", func(t 
		req := httptest.NewRequest("GET", "/api/v1/users", nil)
		
		resp, err := suite.app.Test(req)
		rr)
		assert.Equal(t, 401, resp.Status
	})
}

ons
func (suite *ComprehensiveTestSuite) TestDatabaseOpe() {
	t := suite.T()

	t.Run("Database Connection Health", func(t *testing.T) {
		sqlDB, err := suite.db.DB()
		
		
		err = sqlDB.Ping()
		assert.NoError(t, err, "Database shou")
	})

	t.Run("Model Relationships", func(t *testing.
		// Create user and student to test relationship
		user := suite.CreateTestUser("relationship@example.com",  2)
		
	ent{
.ID,
			StudentID: "REL001",
			MajorID:   1,
		}
		
		err := suite.db.Create(student).Error
, err)
		
		// Test preloading relatip
		var foundStudent modelsdent
		err = suite.db.ror

		assert.Equal(ter.ID)
	})
}

ayer
func (suite *er() {
	t := suite.T()

	t.Run("JWT Service", func(t *testing.T) {
")
		
		// Test token generation
		token, err := jwtService.n")
		assert.NoError(t, err)
		assert.NotEmpty(t, token)
		
		// Test token validation
		claims, err := jwtSe)
		assert.NoError(t, err)
.UserID)
	})

	t.Run("Password Hashing", funng.T) {
		password := "testp123"
	
		// Test hashing
		hashedPassword, err := servi)
		assert.NoError(t, err)
		assert.NotEmpty(t, hashedPassword)
word)
		
		// Test verification
		assert.True(t, services.Checword))

	})
}

// TestComprehensiveTestSuite ru
func TestComprehensiveTestSuite(t *testing.T) {
	suite.Run(t, new(ComprehensiveTestSuite))
}