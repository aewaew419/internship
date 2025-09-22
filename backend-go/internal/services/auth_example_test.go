package services

import (
	"fmt"
	"testing"

	"backend-go/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Example demonstrating how to use the authentication service
func ExampleAuthService_usage() {
	// Initialize JWT service
	jwtService := NewJWTService("your-secret-key")
	
	// Initialize auth service (with real database in production)
	_ = NewAuthService(nil, jwtService)
	
	// Example of generating tokens
	accessToken, err := jwtService.GenerateToken(1, "user@example.com", 2)
	if err != nil {
		fmt.Printf("Error generating token: %v\n", err)
		return
	}
	
	// Example of validating tokens
	claims, err := jwtService.ValidateToken(accessToken)
	if err != nil {
		fmt.Printf("Error validating token: %v\n", err)
		return
	}
	
	fmt.Printf("Token valid for user ID: %d, Email: %s\n", claims.UserID, claims.Email)
	
	// Example of password hashing
	hashedPassword, err := HashPassword("mypassword123")
	if err != nil {
		fmt.Printf("Error hashing password: %v\n", err)
		return
	}
	
	// Example of password verification
	isValid := CheckPassword("mypassword123", hashedPassword)
	fmt.Printf("Password is valid: %t\n", isValid)
	
	// Output:
	// Token valid for user ID: 1, Email: user@example.com
	// Password is valid: true
}

func TestAuthService_IntegrationExample(t *testing.T) {
	// This test demonstrates the complete authentication flow
	jwtService := NewJWTService("test-secret-key")
	
	// Test JWT token generation and validation
	userID := uint(1)
	email := "test@example.com"
	roleID := uint(2)
	
	// Generate access token
	accessToken, err := jwtService.GenerateToken(userID, email, roleID)
	require.NoError(t, err)
	assert.NotEmpty(t, accessToken)
	
	// Generate refresh token
	refreshToken, err := jwtService.GenerateRefreshToken(userID, email, roleID)
	require.NoError(t, err)
	assert.NotEmpty(t, refreshToken)
	
	// Validate access token
	claims, err := jwtService.ValidateToken(accessToken)
	require.NoError(t, err)
	assert.Equal(t, userID, claims.UserID)
	assert.Equal(t, email, claims.Email)
	assert.Equal(t, roleID, claims.RoleID)
	
	// Use refresh token to generate new access token
	newAccessToken, err := jwtService.RefreshToken(refreshToken)
	require.NoError(t, err)
	assert.NotEmpty(t, newAccessToken)
	// Note: tokens might be the same if generated at the exact same time
	
	// Validate new access token
	newClaims, err := jwtService.ValidateToken(newAccessToken)
	require.NoError(t, err)
	assert.Equal(t, userID, newClaims.UserID)
	assert.Equal(t, email, newClaims.Email)
	assert.Equal(t, roleID, newClaims.RoleID)
	
	// Test password hashing and verification
	password := "testpassword123"
	hashedPassword, err := HashPassword(password)
	require.NoError(t, err)
	
	assert.True(t, CheckPassword(password, hashedPassword))
	assert.False(t, CheckPassword("wrongpassword", hashedPassword))
	
	// Test User model password methods
	user := models.User{
		Email:    email,
		Password: password,
	}
	
	// Simulate BeforeCreate hook behavior
	hashedPwd, err := HashPassword(user.Password)
	require.NoError(t, err)
	user.Password = hashedPwd
	
	// Test CheckPassword method
	assert.True(t, user.CheckPassword(password))
	assert.False(t, user.CheckPassword("wrongpassword"))
}

func TestAuthService_RequestStructures(t *testing.T) {
	// Test all request structures are properly defined
	
	loginReq := LoginRequest{
		Email:    "test@example.com",
		Password: "password123",
	}
	assert.Equal(t, "test@example.com", loginReq.Email)
	assert.Equal(t, "password123", loginReq.Password)
	
	registerReq := RegisterRequest{
		FullName:        "Test User",
		Email:           "test@example.com",
		Password:        "password123",
		ConfirmPassword: "password123",
		RoleID:          1,
	}
	assert.Equal(t, "Test User", registerReq.FullName)
	assert.Equal(t, "test@example.com", registerReq.Email)
	assert.Equal(t, uint(1), registerReq.RoleID)
	
	changePasswordReq := ChangePasswordRequest{
		CurrentPassword: "oldpassword",
		NewPassword:     "newpassword123",
		ConfirmPassword: "newpassword123",
	}
	assert.Equal(t, "oldpassword", changePasswordReq.CurrentPassword)
	assert.Equal(t, "newpassword123", changePasswordReq.NewPassword)
	
	resetReq := PasswordResetRequest{
		Email: "test@example.com",
	}
	assert.Equal(t, "test@example.com", resetReq.Email)
	
	resetConfirmReq := PasswordResetConfirmRequest{
		Token:           "reset-token",
		Password:        "newpassword123",
		ConfirmPassword: "newpassword123",
	}
	assert.Equal(t, "reset-token", resetConfirmReq.Token)
	assert.Equal(t, "newpassword123", resetConfirmReq.Password)
}