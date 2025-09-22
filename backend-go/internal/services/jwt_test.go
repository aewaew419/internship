package services

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestJWTService_GenerateToken(t *testing.T) {
	jwtService := NewJWTService("test-secret-key")

	token, err := jwtService.GenerateToken(1, "test@example.com", 2)
	
	require.NoError(t, err)
	assert.NotEmpty(t, token)
}

func TestJWTService_ValidateToken(t *testing.T) {
	jwtService := NewJWTService("test-secret-key")

	// Generate a token
	token, err := jwtService.GenerateToken(1, "test@example.com", 2)
	require.NoError(t, err)

	// Validate the token
	claims, err := jwtService.ValidateToken(token)
	require.NoError(t, err)
	
	assert.Equal(t, uint(1), claims.UserID)
	assert.Equal(t, "test@example.com", claims.Email)
	assert.Equal(t, uint(2), claims.RoleID)
	assert.Equal(t, "internship-system", claims.Issuer)
}

func TestJWTService_ValidateToken_InvalidToken(t *testing.T) {
	jwtService := NewJWTService("test-secret-key")

	// Test with invalid token
	_, err := jwtService.ValidateToken("invalid-token")
	assert.Error(t, err)
}

func TestJWTService_ValidateToken_WrongSecret(t *testing.T) {
	jwtService1 := NewJWTService("secret-1")
	jwtService2 := NewJWTService("secret-2")

	// Generate token with first service
	token, err := jwtService1.GenerateToken(1, "test@example.com", 2)
	require.NoError(t, err)

	// Try to validate with second service (different secret)
	_, err = jwtService2.ValidateToken(token)
	assert.Error(t, err)
}

func TestJWTService_GenerateRefreshToken(t *testing.T) {
	jwtService := NewJWTService("test-secret-key")

	refreshToken, err := jwtService.GenerateRefreshToken(1, "test@example.com", 2)
	
	require.NoError(t, err)
	assert.NotEmpty(t, refreshToken)

	// Validate the refresh token
	claims, err := jwtService.ValidateToken(refreshToken)
	require.NoError(t, err)
	
	assert.Equal(t, uint(1), claims.UserID)
	assert.Equal(t, "test@example.com", claims.Email)
	assert.Equal(t, uint(2), claims.RoleID)
}

func TestJWTService_RefreshToken(t *testing.T) {
	jwtService := NewJWTService("test-secret-key")

	// Generate refresh token
	refreshToken, err := jwtService.GenerateRefreshToken(1, "test@example.com", 2)
	require.NoError(t, err)

	// Use refresh token to generate new access token
	newAccessToken, err := jwtService.RefreshToken(refreshToken)
	require.NoError(t, err)
	assert.NotEmpty(t, newAccessToken)

	// Validate the new access token
	claims, err := jwtService.ValidateToken(newAccessToken)
	require.NoError(t, err)
	
	assert.Equal(t, uint(1), claims.UserID)
	assert.Equal(t, "test@example.com", claims.Email)
	assert.Equal(t, uint(2), claims.RoleID)
}

func TestJWTService_GeneratePasswordResetToken(t *testing.T) {
	jwtService := NewJWTService("test-secret-key")

	resetToken, err := jwtService.GeneratePasswordResetToken(1, "test@example.com")
	
	require.NoError(t, err)
	assert.NotEmpty(t, resetToken)

	// Validate the reset token
	claims, err := jwtService.ValidateToken(resetToken)
	require.NoError(t, err)
	
	assert.Equal(t, uint(1), claims.UserID)
	assert.Equal(t, "test@example.com", claims.Email)
	assert.Equal(t, uint(0), claims.RoleID) // Should be 0 for reset tokens
}

func TestJWTService_TokenExpiration(t *testing.T) {
	jwtService := NewJWTService("test-secret-key")

	// Create a token that expires immediately (for testing)
	claims := JWTClaims{
		UserID: 1,
		Email:  "test@example.com",
		RoleID: 2,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(-1 * time.Hour)), // Expired 1 hour ago
			IssuedAt:  jwt.NewNumericDate(time.Now().Add(-2 * time.Hour)),
			NotBefore: jwt.NewNumericDate(time.Now().Add(-2 * time.Hour)),
			Issuer:    "internship-system",
			Subject:   "test@example.com",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte("test-secret-key"))
	require.NoError(t, err)

	// Try to validate expired token
	_, err = jwtService.ValidateToken(tokenString)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "token is expired")
}

func TestJWTService_TokenNotYetValid(t *testing.T) {
	jwtService := NewJWTService("test-secret-key")

	// Create a token that is not yet valid (for testing)
	claims := JWTClaims{
		UserID: 1,
		Email:  "test@example.com",
		RoleID: 2,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
			NotBefore: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)), // Valid 1 hour from now
			Issuer:    "internship-system",
			Subject:   "test@example.com",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte("test-secret-key"))
	require.NoError(t, err)

	// Try to validate token that's not yet valid
	_, err = jwtService.ValidateToken(tokenString)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "token is not valid yet")
}