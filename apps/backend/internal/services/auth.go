package services

import (
	"errors"
	"fmt"

	"backend-go/internal/models"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// AuthService handles authentication operations
type AuthService struct {
	db         *gorm.DB
	jwtService *JWTService
}

// NewAuthService creates a new authentication service instance
func NewAuthService(db *gorm.DB, jwtService *JWTService) *AuthService {
	return &AuthService{
		db:         db,
		jwtService: jwtService,
	}
}

// LoginRequest represents the login request payload
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
}

// LoginResponse represents the login response
type LoginResponse struct {
	AccessToken  string      `json:"access_token"`
	RefreshToken string      `json:"refresh_token"`
	TokenType    string      `json:"token_type"`
	ExpiresIn    int         `json:"expires_in"`
	User         models.User `json:"user"`
}

// RegisterRequest represents the user registration request
type RegisterRequest struct {
	StudentID       string `json:"student_id" validate:"required"`
	FullName        string `json:"full_name"`
	Email           string `json:"email" validate:"required,email"`
	Password        string `json:"password" validate:"required,min=6"`
	ConfirmPassword string `json:"confirm_password" validate:"required"`
}

// PasswordResetRequest represents the password reset request
type PasswordResetRequest struct {
	Email string `json:"email" validate:"required,email"`
}

// PasswordResetConfirmRequest represents the password reset confirmation
type PasswordResetConfirmRequest struct {
	Token           string `json:"token" validate:"required"`
	Password        string `json:"password" validate:"required,min=6"`
	ConfirmPassword string `json:"confirm_password" validate:"required"`
}

// ChangePasswordRequest represents the change password request
type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" validate:"required"`
	NewPassword     string `json:"new_password" validate:"required,min=6"`
	ConfirmPassword string `json:"confirm_password" validate:"required"`
}

// StudentLoginRequest represents the student login request payload
type StudentLoginRequest struct {
	StudentID string `json:"student_id" validate:"required"`
	Password  string `json:"password" validate:"required,min=6"`
}

// StudentRegisterRequest represents the student registration request
type StudentRegisterRequest struct {
	StudentID       string `json:"student_id" validate:"required"`
	Email           string `json:"email" validate:"required,email"`
	Password        string `json:"password" validate:"required,min=8"`
	ConfirmPassword string `json:"confirm_password" validate:"required"`
	FullName        string `json:"full_name" validate:"required"`
}

// Login authenticates a user and returns JWT tokens
func (a *AuthService) Login(req LoginRequest) (*LoginResponse, error) {
	var user models.User
	
	// Find user by email with role information
	err := a.db.Preload("Role").Where("email = ?", req.Email).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("invalid credentials")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Check password
	if !user.CheckPassword(req.Password) {
		return nil, errors.New("invalid credentials")
	}

	// Generate tokens
	accessToken, err := a.jwtService.GenerateTokenForUser(&user, TokenTypeAccess, []string{}, false, "")
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshToken, err := a.jwtService.GenerateTokenForUser(&user, TokenTypeRefresh, []string{}, false, "")
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	// Remove password from response
	user.Password = ""

	return &LoginResponse{
		AccessToken:  accessToken.Token,
		RefreshToken: refreshToken.Token,
		TokenType:    "Bearer",
		ExpiresIn:    24 * 60 * 60, // 24 hours in seconds
		User:         user,
	}, nil
}

// Register creates a new user account
func (a *AuthService) Register(req RegisterRequest) (*models.User, error) {
	// Validate password confirmation
	if req.Password != req.ConfirmPassword {
		return nil, errors.New("passwords do not match")
	}

	// Check if user already exists
	var existingUser models.User
	err := a.db.Where("email = ?", req.Email).First(&existingUser).Error
	if err == nil {
		return nil, errors.New("user with this email already exists")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Create new user
	user := models.User{
		FullName: req.FullName,
		Email:    req.Email,
		Password: req.Password, // Will be hashed by BeforeCreate hook
		StudentID: req.StudentID, // Assuming StudentID is in the request
	}

	err = a.db.Create(&user).Error
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Load user information
	err = a.db.First(&user, "student_id = ?", user.StudentID).Error
	if err != nil {
		return nil, fmt.Errorf("failed to load user data: %w", err)
	}

	// Remove password from response
	user.Password = ""

	return &user, nil
}

// RefreshToken generates a new access token from a refresh token
func (a *AuthService) RefreshToken(refreshToken string) (*LoginResponse, error) {
	// Validate refresh token
	claims, err := a.jwtService.ValidateToken(refreshToken)
	if err != nil {
		return nil, errors.New("invalid refresh token")
	}

	// Get user from database to ensure they still exist and are active
	var user models.User
	err = a.db.First(&user, "student_id = ?", claims.Claims.UserID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Generate new tokens
	accessToken, err := a.jwtService.GenerateTokenForUser(&user, TokenTypeAccess, []string{}, false, "")
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	newRefreshToken, err := a.jwtService.GenerateTokenForUser(&user, TokenTypeRefresh, []string{}, false, "")
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	// Remove password from response
	user.Password = ""

	return &LoginResponse{
		AccessToken:  accessToken.Token,
		RefreshToken: newRefreshToken.Token,
		TokenType:    "Bearer",
		ExpiresIn:    24 * 60 * 60, // 24 hours in seconds
		User:         user,
	}, nil
}

// ChangePassword changes the user's password
func (a *AuthService) ChangePassword(userID string, req ChangePasswordRequest) error {
	// Validate password confirmation
	if req.NewPassword != req.ConfirmPassword {
		return errors.New("passwords do not match")
	}

	// Get user
	var user models.User
	err := a.db.Where("student_id = ?", userID).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("user not found")
		}
		return fmt.Errorf("database error: %w", err)
	}

	// Verify current password
	if !user.CheckPassword(req.CurrentPassword) {
		return errors.New("current password is incorrect")
	}

	// Update password
	user.Password = req.NewPassword // Will be hashed by BeforeUpdate hook
	err = a.db.Save(&user).Error
	if err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	return nil
}

// RequestPasswordReset initiates a password reset process
func (a *AuthService) RequestPasswordReset(req PasswordResetRequest) error {
	// Check if user exists
	var user models.User
	err := a.db.Where("email = ?", req.Email).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			// Don't reveal if email exists or not for security
			return nil
		}
		return fmt.Errorf("database error: %w", err)
	}

	// Generate password reset token (valid for 1 hour)
	resetToken, err := a.jwtService.GeneratePasswordResetToken(user.StudentID, "User", user.Email)
	if err != nil {
		return fmt.Errorf("failed to generate reset token: %w", err)
	}

	// TODO: Send email with reset token
	// For now, we'll just log it (in production, this should send an email)
	fmt.Printf("Password reset token for %s: %s\n", user.Email, resetToken)

	return nil
}

// ResetPassword resets the user's password using a reset token
func (a *AuthService) ResetPassword(req PasswordResetConfirmRequest) error {
	// Validate password confirmation
	if req.Password != req.ConfirmPassword {
		return errors.New("passwords do not match")
	}

	// Validate reset token
	claims, err := a.jwtService.ValidateToken(req.Token)
	if err != nil {
		return errors.New("invalid or expired reset token")
	}

	// Get user
	var user models.User
	err = a.db.First(&user, "student_id = ?", claims.Claims.UserID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("user not found")
		}
		return fmt.Errorf("database error: %w", err)
	}

	// Update password
	user.Password = req.Password // Will be hashed by BeforeUpdate hook
	err = a.db.Save(&user).Error
	if err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	return nil
}

// GetUserByID retrieves a user by ID
func (a *AuthService) GetUserByID(userID string) (*models.User, error) {
	var user models.User
	err := a.db.Where("student_id = ?", userID).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Remove password from response
	user.Password = ""

	return &user, nil
}

// StudentLogin authenticates a student using student_id and returns JWT tokens
func (a *AuthService) StudentLogin(req StudentLoginRequest) (*LoginResponse, error) {
	var user models.User
	
	// Find user by student_id
	err := a.db.Where("student_id = ?", req.StudentID).First(&user).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("invalid credentials")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Check if user is active
	if !user.IsActive() {
		if user.Status == models.UserStatusInactive {
			return nil, errors.New("user inactive")
		}
		if user.Status == models.UserStatusSuspended {
			return nil, errors.New("user suspended")
		}
	}

	// Check password
	if !user.CheckPassword(req.Password) {
		return nil, errors.New("invalid credentials")
	}

	// Update last login timestamp
	err = user.UpdateLastLogin(a.db)
	if err != nil {
		// Log error but don't fail the login
		fmt.Printf("Failed to update last login for user %s: %v\n", user.StudentID, err)
	}

	// Generate tokens
	accessToken, err := a.jwtService.GenerateTokenForUser(&user, TokenTypeAccess, []string{}, false, "")
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshToken, err := a.jwtService.GenerateTokenForUser(&user, TokenTypeRefresh, []string{}, false, "")
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	// Remove password from response
	user.Password = ""

	return &LoginResponse{
		AccessToken:  accessToken.Token,
		RefreshToken: refreshToken.Token,
		TokenType:    "Bearer",
		ExpiresIn:    24 * 60 * 60, // 24 hours in seconds
		User:         user,
	}, nil
}

// StudentRegister creates a new student account
func (a *AuthService) StudentRegister(req StudentRegisterRequest) (*models.User, error) {
	// Validate password confirmation
	if req.Password != req.ConfirmPassword {
		return nil, errors.New("passwords do not match")
	}

	// Check if user already exists by student_id
	var existingUser models.User
	err := a.db.Where("student_id = ?", req.StudentID).First(&existingUser).Error
	if err == nil {
		return nil, errors.New("user with this student_id already exists")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("database error checking student_id: %w", err)
	}

	// Check if user already exists by email
	err = a.db.Where("email = ?", req.Email).First(&existingUser).Error
	if err == nil {
		return nil, errors.New("user with this email already exists")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("database error checking email: %w", err)
	}

	// Create new user
	user := models.User{
		StudentID: req.StudentID,
		Email:     req.Email,
		Password:  req.Password, // Will be hashed by BeforeCreate hook
		FullName:  req.FullName,
		Status:    models.UserStatusActive,
	}

	err = a.db.Create(&user).Error
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Load user information
	err = a.db.First(&user, "student_id = ?", user.StudentID).Error
	if err != nil {
		return nil, fmt.Errorf("failed to load user data: %w", err)
	}

	// Remove password from response
	user.Password = ""

	return &user, nil
}

// HashPassword hashes a password using bcrypt
func HashPassword(password string) (string, error) {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hashedPassword), nil
}

// CheckPassword verifies if a password matches its hash
func CheckPassword(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}