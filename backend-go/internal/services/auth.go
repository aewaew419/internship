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
	FullName        string `json:"full_name"`
	Email           string `json:"email" validate:"required,email"`
	Password        string `json:"password" validate:"required,min=6"`
	ConfirmPassword string `json:"confirm_password" validate:"required"`
	RoleID          uint   `json:"role_id" validate:"required"`
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
	accessToken, err := a.jwtService.GenerateToken(user.ID, user.Email, user.RoleID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshToken, err := a.jwtService.GenerateRefreshToken(user.ID, user.Email, user.RoleID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	// Remove password from response
	user.Password = ""

	return &LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
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

	// Validate role exists
	var role models.Role
	err = a.db.First(&role, req.RoleID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("invalid role")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Create new user
	user := models.User{
		FullName: &req.FullName,
		Email:    req.Email,
		Password: req.Password, // Will be hashed by BeforeCreate hook
		RoleID:   req.RoleID,
	}

	err = a.db.Create(&user).Error
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Load role information
	err = a.db.Preload("Role").First(&user, user.ID).Error
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
	err = a.db.Preload("Role").First(&user, claims.UserID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Generate new tokens
	accessToken, err := a.jwtService.GenerateToken(user.ID, user.Email, user.RoleID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	newRefreshToken, err := a.jwtService.GenerateRefreshToken(user.ID, user.Email, user.RoleID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	// Remove password from response
	user.Password = ""

	return &LoginResponse{
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
		TokenType:    "Bearer",
		ExpiresIn:    24 * 60 * 60, // 24 hours in seconds
		User:         user,
	}, nil
}

// ChangePassword changes the user's password
func (a *AuthService) ChangePassword(userID uint, req ChangePasswordRequest) error {
	// Validate password confirmation
	if req.NewPassword != req.ConfirmPassword {
		return errors.New("passwords do not match")
	}

	// Get user
	var user models.User
	err := a.db.First(&user, userID).Error
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
	resetToken, err := a.jwtService.GeneratePasswordResetToken(user.ID, user.Email)
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
	err = a.db.First(&user, claims.UserID).Error
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
func (a *AuthService) GetUserByID(userID uint) (*models.User, error) {
	var user models.User
	err := a.db.Preload("Role").First(&user, userID).Error
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