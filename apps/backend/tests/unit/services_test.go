package unit

import (
	"fmt"
	"testing"
	"time"

	"backend-go/internal/models"
	"backend-go/internal/services"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/stretchr/testify/suite"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

// ServicesTestSuite tests all service layer functionality
type ServicesTestSuite struct {
	suite.Suite
	db *gorm.DB
}

func (suite *ServicesTestSuite) SetupSuite() {
	var err error
	suite.db, err = gorm.Open(sqlite.Open("file::memory:?cache=shared"), &gorm.Config{})
	if err != nil {
		suite.T().Skipf("Skipping database tests - SQLite not available: %v", err)
		return
	}

	// Auto migrate all models
	err = suite.db.AutoMigrate(
		&models.Role{},
		&models.User{},
		&models.Student{},
		&models.Instructor{},
		&models.Course{},
		&models.Company{},
	)
	suite.Require().NoError(err)

	// Create test data
	suite.createTestData()
}

func (suite *ServicesTestSuite) TearDownSuite() {
	if suite.db != nil {
		sqlDB, _ := suite.db.DB()
		if sqlDB != nil {
			sqlDB.Close()
		}
	}
}

func (suite *ServicesTestSuite) SetupTest() {
	if suite.db == nil {
		suite.T().Skip("Database not available")
		return
	}
	// Clean test data before each test
	suite.db.Where("email LIKE ?", "%test%").Delete(&models.User{})
}

func (suite *ServicesTestSuite) createTestData() {
	// Create test roles
	roles := []models.Role{
		{ID: 1, Name: "admin"},
		{ID: 2, Name: "student"},
		{ID: 3, Name: "instructor"},
	}
	for _, role := range roles {
		suite.db.Create(&role)
	}
}

// Test JWT Service
func (suite *ServicesTestSuite) TestJWTService() {
	jwtService := services.NewJWTService("test-secret-key")

	t := suite.T()

	t.Run("GenerateToken", func(t *testing.T) {
		token, err := jwtService.GenerateToken(1, "test@example.com", 1)
		assert.NoError(t, err)
		assert.NotEmpty(t, token)
	})

	t.Run("GenerateRefreshToken", func(t *testing.T) {
		token, err := jwtService.GenerateRefreshToken(1, "test@example.com", 1)
		assert.NoError(t, err)
		assert.NotEmpty(t, token)
	})

	t.Run("ValidateToken", func(t *testing.T) {
		token, err := jwtService.GenerateToken(1, "test@example.com", 1)
		require.NoError(t, err)

		claims, err := jwtService.ValidateToken(token)
		assert.NoError(t, err)
		assert.Equal(t, uint(1), claims.UserID)
		assert.Equal(t, uint(1), claims.RoleID)
	})

	t.Run("ValidateInvalidToken", func(t *testing.T) {
		_, err := jwtService.ValidateToken("invalid-token")
		assert.Error(t, err)
	})

	t.Run("GeneratePasswordResetToken", func(t *testing.T) {
		token, err := jwtService.GeneratePasswordResetToken(1, "test@example.com")
		assert.NoError(t, err)
		assert.NotEmpty(t, token)
	})

	t.Run("ValidatePasswordResetToken", func(t *testing.T) {
		token, err := jwtService.GeneratePasswordResetToken(1, "test@example.com")
		require.NoError(t, err)

		claims, err := jwtService.ValidateToken(token)
		assert.NoError(t, err)
		assert.Equal(t, uint(1), claims.UserID)
		assert.Equal(t, "test@example.com", claims.Email)
	})
}

// Test Auth Service
func (suite *ServicesTestSuite) TestAuthService() {
	jwtService := services.NewJWTService("test-secret")
	authService := services.NewAuthService(suite.db, jwtService)

	t := suite.T()

	t.Run("Register", func(t *testing.T) {
		request := services.RegisterRequest{
			FullName:        "Test User",
			Email:           "testregister@example.com",
			Password:        "password123",
			ConfirmPassword: "password123",
			RoleID:          1,
		}

		response, err := authService.Register(request)
		assert.NoError(t, err)
		assert.NotNil(t, response)
		assert.Equal(t, "testregister@example.com", response.Email)
	})

	t.Run("RegisterDuplicateEmail", func(t *testing.T) {
		// First registration
		request := services.RegisterRequest{
			FullName:        "Test User 1",
			Email:           "duplicate@example.com",
			Password:        "password123",
			ConfirmPassword: "password123",
			RoleID:          1,
		}
		_, err := authService.Register(request)
		assert.NoError(t, err)

		// Second registration with same email
		request.FullName = "Test User 2"
		_, err = authService.Register(request)
		assert.Error(t, err)
	})

	t.Run("Login", func(t *testing.T) {
		// Register user first
		registerReq := services.RegisterRequest{
			FullName:        "Login Test User",
			Email:           "logintest@example.com",
			Password:        "password123",
			ConfirmPassword: "password123",
			RoleID:          1,
		}
		_, err := authService.Register(registerReq)
		require.NoError(t, err)

		// Login
		loginReq := services.LoginRequest{
			Email:    "logintest@example.com",
			Password: "password123",
		}

		response, err := authService.Login(loginReq)
		assert.NoError(t, err)
		assert.NotEmpty(t, response.AccessToken)
		assert.NotEmpty(t, response.RefreshToken)
	})

	t.Run("LoginInvalidCredentials", func(t *testing.T) {
		loginReq := services.LoginRequest{
			Email:    "nonexistent@example.com",
			Password: "wrongpassword",
		}

		_, err := authService.Login(loginReq)
		assert.Error(t, err)
	})
}

// Test User Service
func (suite *ServicesTestSuite) TestUserService() {
	userService := services.NewUserService(suite.db)

	t := suite.T()

	t.Run("CreateUser", func(t *testing.T) {
		request := services.CreateUserRequest{
			FullName: "Service Test User",
			Email:    "servicetest@example.com",
			Password: "password123",
			RoleID:   1,
		}

		user, err := userService.CreateUser(request)
		assert.NoError(t, err)
		assert.Equal(t, "servicetest@example.com", user.Email)
		assert.Equal(t, "Service Test User", *user.FullName)
	})

	t.Run("GetUsers", func(t *testing.T) {
		// Create test users
		for i := 1; i <= 5; i++ {
			request := services.CreateUserRequest{
				FullName: fmt.Sprintf("Paginated User %d", i),
				Email:    fmt.Sprintf("paginated%d@example.com", i),
				Password: "password123",
				RoleID:   1,
			}
			userService.CreateUser(request)
		}

		params := services.UserListRequest{
			Page:  1,
			Limit: 3,
		}

		result, err := userService.GetUsers(params)
		assert.NoError(t, err)
		assert.Len(t, result.Data, 3)
		assert.True(t, result.Total >= 5)
	})

	t.Run("GetUserByID", func(t *testing.T) {
		// Create test user
		request := services.CreateUserRequest{
			FullName: "Get By ID User",
			Email:    "getbyid@example.com",
			Password: "password123",
			RoleID:   1,
		}
		createdUser, err := userService.CreateUser(request)
		require.NoError(t, err)

		// Get user by ID
		user, err := userService.GetUserByID(createdUser.ID)
		assert.NoError(t, err)
		assert.Equal(t, createdUser.ID, user.ID)
		assert.Equal(t, createdUser.Email, user.Email)
	})

	t.Run("UpdateUser", func(t *testing.T) {
		// Create test user
		request := services.CreateUserRequest{
			FullName: "Update Test User",
			Email:    "updatetest@example.com",
			Password: "password123",
			RoleID:   1,
		}
		createdUser, err := userService.CreateUser(request)
		require.NoError(t, err)

		// Update user
		newFullName := "Updated Test User"
		updateRequest := services.UpdateUserRequest{
			FullName: &newFullName,
		}

		updatedUser, err := userService.UpdateUser(createdUser.ID, updateRequest)
		assert.NoError(t, err)
		assert.Equal(t, newFullName, *updatedUser.FullName)
	})

	t.Run("DeleteUser", func(t *testing.T) {
		// Create test user
		request := services.CreateUserRequest{
			FullName: "Delete Test User",
			Email:    "deletetest@example.com",
			Password: "password123",
			RoleID:   1,
		}
		createdUser, err := userService.CreateUser(request)
		require.NoError(t, err)

		// Delete user
		err = userService.DeleteUser(createdUser.ID)
		assert.NoError(t, err)

		// Verify user is deleted
		_, err = userService.GetUserByID(createdUser.ID)
		assert.Error(t, err)
	})
}

// Test Student Service
func (suite *ServicesTestSuite) TestStudentService() {
	t := suite.T()

	t.Run("CreateStudent", func(t *testing.T) {
		// Create user first
		userService := services.NewUserService(suite.db)
		userRequest := services.CreateUserRequest{
			FullName: "Student Test User",
			Email:    "studenttest@example.com",
			Password: "password123",
			RoleID:   2, // student role
		}
		user, err := userService.CreateUser(userRequest)
		require.NoError(t, err)

		// For this test, we'll just verify the user was created
		// Student service would need to be implemented separately
		assert.Equal(t, "studenttest@example.com", user.Email)
		assert.Equal(t, uint(2), user.RoleID)
	})
}

// Test Password Utilities
func (suite *ServicesTestSuite) TestPasswordUtilities() {
	t := suite.T()

	t.Run("HashPassword", func(t *testing.T) {
		password := "testpassword123"
		hashedPassword, err := services.HashPassword(password)
		
		assert.NoError(t, err)
		assert.NotEmpty(t, hashedPassword)
		assert.NotEqual(t, password, hashedPassword)
	})

	t.Run("CheckPassword", func(t *testing.T) {
		password := "testpassword123"
		hashedPassword, err := services.HashPassword(password)
		require.NoError(t, err)

		// Test correct password
		assert.True(t, services.CheckPassword(password, hashedPassword))
		
		// Test incorrect password
		assert.False(t, services.CheckPassword("wrongpassword", hashedPassword))
	})
}

// Test Logger Service
func (suite *ServicesTestSuite) TestLoggerService() {
	t := suite.T()

	t.Run("NewLogger", func(t *testing.T) {
		config := services.LoggerConfig{
			Level:       services.INFO,
			ServiceName: "test",
		}
		logger := services.NewLogger(config)
		assert.NotNil(t, logger)
	})

	t.Run("LogLevels", func(t *testing.T) {
		config := services.LoggerConfig{
			Level:       services.DEBUG,
			ServiceName: "test",
		}
		logger := services.NewLogger(config)
		
		// These should not panic
		logger.Info("Test info message")
		logger.Error("Test error message")
		logger.Debug("Test debug message")
		logger.Warn("Test warning message")
	})
}

// Test PDF Service
func (suite *ServicesTestSuite) TestPDFService() {
	pdfService := services.NewPDFService("/tmp")

	t := suite.T()

	t.Run("GenerateReport", func(t *testing.T) {
		data := services.ReportData{
			Title:       "Test Report",
			GeneratedAt: time.Now(),
			GeneratedBy: "Test User",
		}

		filename, err := pdfService.GenerateReport(services.ReportTypeStudentList, data)
		assert.NoError(t, err)
		assert.NotEmpty(t, filename)
		assert.Contains(t, filename, "student_list")
	})

	t.Run("GenerateLetter", func(t *testing.T) {
		// Create test student and company
		student := models.Student{
			StudentID: "STU001",
			Email:     "test@example.com",
			GPAX:      3.50,
		}
		
		company := models.Company{
			CompanyNameEn: "Test Company",
			CompanyNameTh: "บริษัท ทดสอบ",
		}

		training := models.StudentTraining{
			Position:   "Software Developer",
			Department: "IT Department",
			StartDate:  time.Now(),
			EndDate:    time.Now().AddDate(0, 6, 0),
		}

		data := services.LetterData{
			Student:     student,
			Company:     &company,
			Training:    &training,
			Recipient:   "HR Manager",
			Language:    models.DocumentLanguageEN,
			GeneratedAt: time.Now(),
			GeneratedBy: "Test User",
		}

		filename, err := pdfService.GenerateLetter(services.LetterTypeCoopRequest, data)
		assert.NoError(t, err)
		assert.NotEmpty(t, filename)
		assert.Contains(t, filename, "coop_request")
	})
}

func TestServicesTestSuite(t *testing.T) {
	suite.Run(t, new(ServicesTestSuite))
}