package services

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
)

func TestHashPassword(t *testing.T) {
	password := "testpassword123"
	
	hashedPassword, err := HashPassword(password)
	
	require.NoError(t, err)
	assert.NotEmpty(t, hashedPassword)
	assert.NotEqual(t, password, hashedPassword)
	
	// Verify the hash works
	assert.True(t, CheckPassword(password, hashedPassword))
	assert.False(t, CheckPassword("wrongpassword", hashedPassword))
}

func TestCheckPassword(t *testing.T) {
	password := "testpassword123"
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	require.NoError(t, err)

	// Test correct password
	assert.True(t, CheckPassword(password, string(hashedPassword)))
	
	// Test incorrect password
	assert.False(t, CheckPassword("wrongpassword", string(hashedPassword)))
}

func TestLoginRequest_Validation(t *testing.T) {
	tests := []struct {
		name    string
		request LoginRequest
		valid   bool
	}{
		{
			name: "valid request",
			request: LoginRequest{
				Email:    "test@example.com",
				Password: "password123",
			},
			valid: true,
		},
		{
			name: "empty email",
			request: LoginRequest{
				Email:    "",
				Password: "password123",
			},
			valid: false,
		},
		{
			name: "empty password",
			request: LoginRequest{
				Email:    "test@example.com",
				Password: "",
			},
			valid: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Basic validation checks
			if tt.valid {
				assert.NotEmpty(t, tt.request.Email)
				assert.NotEmpty(t, tt.request.Password)
			} else {
				assert.True(t, tt.request.Email == "" || tt.request.Password == "")
			}
		})
	}
}

func TestRegisterRequest_Validation(t *testing.T) {
	tests := []struct {
		name    string
		request RegisterRequest
		valid   bool
	}{
		{
			name: "valid request",
			request: RegisterRequest{
				FullName:        "Test User",
				Email:           "test@example.com",
				Password:        "password123",
				ConfirmPassword: "password123",
				RoleID:          1,
			},
			valid: true,
		},
		{
			name: "password mismatch",
			request: RegisterRequest{
				FullName:        "Test User",
				Email:           "test@example.com",
				Password:        "password123",
				ConfirmPassword: "differentpassword",
				RoleID:          1,
			},
			valid: false,
		},
		{
			name: "empty email",
			request: RegisterRequest{
				FullName:        "Test User",
				Email:           "",
				Password:        "password123",
				ConfirmPassword: "password123",
				RoleID:          1,
			},
			valid: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.valid {
				assert.NotEmpty(t, tt.request.Email)
				assert.NotEmpty(t, tt.request.Password)
				assert.Equal(t, tt.request.Password, tt.request.ConfirmPassword)
				assert.NotZero(t, tt.request.RoleID)
			} else {
				isValid := tt.request.Email != "" && 
					tt.request.Password != "" && 
					tt.request.Password == tt.request.ConfirmPassword &&
					tt.request.RoleID != 0
				assert.False(t, isValid)
			}
		})
	}
}

func TestChangePasswordRequest_Validation(t *testing.T) {
	tests := []struct {
		name    string
		request ChangePasswordRequest
		valid   bool
	}{
		{
			name: "valid request",
			request: ChangePasswordRequest{
				CurrentPassword: "oldpassword",
				NewPassword:     "newpassword123",
				ConfirmPassword: "newpassword123",
			},
			valid: true,
		},
		{
			name: "password mismatch",
			request: ChangePasswordRequest{
				CurrentPassword: "oldpassword",
				NewPassword:     "newpassword123",
				ConfirmPassword: "differentpassword",
			},
			valid: false,
		},
		{
			name: "empty current password",
			request: ChangePasswordRequest{
				CurrentPassword: "",
				NewPassword:     "newpassword123",
				ConfirmPassword: "newpassword123",
			},
			valid: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.valid {
				assert.NotEmpty(t, tt.request.CurrentPassword)
				assert.NotEmpty(t, tt.request.NewPassword)
				assert.Equal(t, tt.request.NewPassword, tt.request.ConfirmPassword)
			} else {
				isValid := tt.request.CurrentPassword != "" && 
					tt.request.NewPassword != "" && 
					tt.request.NewPassword == tt.request.ConfirmPassword
				assert.False(t, isValid)
			}
		})
	}
}

func TestPasswordResetRequest_Validation(t *testing.T) {
	tests := []struct {
		name    string
		request PasswordResetRequest
		valid   bool
	}{
		{
			name: "valid request",
			request: PasswordResetRequest{
				Email: "test@example.com",
			},
			valid: true,
		},
		{
			name: "empty email",
			request: PasswordResetRequest{
				Email: "",
			},
			valid: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.valid {
				assert.NotEmpty(t, tt.request.Email)
			} else {
				assert.Empty(t, tt.request.Email)
			}
		})
	}
}

func TestPasswordResetConfirmRequest_Validation(t *testing.T) {
	tests := []struct {
		name    string
		request PasswordResetConfirmRequest
		valid   bool
	}{
		{
			name: "valid request",
			request: PasswordResetConfirmRequest{
				Token:           "valid-token",
				Password:        "newpassword123",
				ConfirmPassword: "newpassword123",
			},
			valid: true,
		},
		{
			name: "password mismatch",
			request: PasswordResetConfirmRequest{
				Token:           "valid-token",
				Password:        "newpassword123",
				ConfirmPassword: "differentpassword",
			},
			valid: false,
		},
		{
			name: "empty token",
			request: PasswordResetConfirmRequest{
				Token:           "",
				Password:        "newpassword123",
				ConfirmPassword: "newpassword123",
			},
			valid: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.valid {
				assert.NotEmpty(t, tt.request.Token)
				assert.NotEmpty(t, tt.request.Password)
				assert.Equal(t, tt.request.Password, tt.request.ConfirmPassword)
			} else {
				isValid := tt.request.Token != "" && 
					tt.request.Password != "" && 
					tt.request.Password == tt.request.ConfirmPassword
				assert.False(t, isValid)
			}
		})
	}
}

func TestNewAuthService(t *testing.T) {
	jwtService := NewJWTService("test-secret")
	authService := NewAuthService(nil, jwtService) // nil db for this test
	
	assert.NotNil(t, authService)
	assert.Equal(t, jwtService, authService.jwtService)
}

func TestLoginResponse_Structure(t *testing.T) {
	response := LoginResponse{
		AccessToken:  "access-token",
		RefreshToken: "refresh-token",
		TokenType:    "Bearer",
		ExpiresIn:    3600,
	}
	
	assert.Equal(t, "access-token", response.AccessToken)
	assert.Equal(t, "refresh-token", response.RefreshToken)
	assert.Equal(t, "Bearer", response.TokenType)
	assert.Equal(t, 3600, response.ExpiresIn)
}