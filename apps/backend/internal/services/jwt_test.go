package services

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"backend-go/internal/models"
)

// setupTestDB creates an in-memory SQLite database for testing
func setupTestDB(t *testing.T) *gorm.DB {
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)

	// Auto-migrate the models
	err = db.AutoMigrate(
		&models.User{},
		&models.SuperAdmin{},
		&models.AccessToken{},
		&models.SecurityLog{},
	)
	require.NoError(t, err)

	return db
}

// createTestUser creates a test user in the database
func createTestUser(t *testing.T, db *gorm.DB) *models.User {
	user := &models.User{
		StudentID: "12345678",
		Email:     "test@example.com",
		Password:  "password123",
		FullName:  "Test User",
		Status:    models.UserStatusActive,
	}

	err := db.Create(user).Error
	require.NoError(t, err)

	return user
}

// createTestSuperAdmin creates a test super admin in the database
func createTestSuperAdmin(t *testing.T, db *gorm.DB) *models.SuperAdmin {
	admin := &models.SuperAdmin{
		Email:    "admin@example.com",
		Password: "adminpass123",
		FullName: "Test Admin",
		Role:     models.AdminRoleSuperAdmin,
	}

	err := db.Create(admin).Error
	require.NoError(t, err)

	return admin
}

func TestJWTService_GenerateTokenForUser(t *testing.T) {
	db := setupTestDB(t)
	user := createTestUser(t, db)

	config := &JWTConfig{
		SecretKey:       "test-secret-key",
		Issuer:          "test-issuer",
		Audience:        "test-audience",
		AccessTokenTTL:  15 * time.Minute,
		RefreshTokenTTL: 7 * 24 * time.Hour,
	}

	jwtService := NewJWTService(config, db)

	abilities := []string{"users.read", "users.write"}
	accessToken, err := jwtService.GenerateTokenForUser(user, TokenTypeAccess, abilities, false, "test-device")

	assert.NoError(t, err)
	assert.NotNil(t, accessToken)
	assert.Equal(t, string(UserTypeStudent), accessToken.TokenableType)
	assert.Equal(t, user.StudentID, accessToken.TokenableID)
	assert.Equal(t, "access_token", accessToken.Name)
	assert.NotEmpty(t, accessToken.Token)

	// Verify abilities are stored correctly
	var storedAbilities []string
	err = json.Unmarshal([]byte(accessToken.Abilities), &storedAbilities)
	assert.NoError(t, err)
	assert.Equal(t, abilities, storedAbilities)

	// Verify token is stored in database
	var dbToken models.AccessToken
	err = db.Where("token = ?", accessToken.Token).First(&dbToken).Error
	assert.NoError(t, err)
	assert.Equal(t, accessToken.ID, dbToken.ID)
}

func TestJWTService_GenerateTokenForSuperAdmin(t *testing.T) {
	db := setupTestDB(t)
	admin := createTestSuperAdmin(t, db)

	config := &JWTConfig{
		SecretKey:       "test-secret-key",
		Issuer:          "test-issuer",
		Audience:        "test-audience",
		AccessTokenTTL:  15 * time.Minute,
		RefreshTokenTTL: 7 * 24 * time.Hour,
	}

	jwtService := NewJWTService(config, db)

	abilities := []string{"*"} // Super admin has all abilities
	accessToken, err := jwtService.GenerateTokenForSuperAdmin(admin, TokenTypeAccess, abilities, false, "admin-device")

	assert.NoError(t, err)
	assert.NotNil(t, accessToken)
	assert.Equal(t, string(UserTypeSuperAdmin), accessToken.TokenableType)
	assert.Equal(t, "1", accessToken.TokenableID) // First admin should have ID 1
	assert.Equal(t, "access_token", accessToken.Name)
	assert.NotEmpty(t, accessToken.Token)
}

func TestJWTService_ValidateToken(t *testing.T) {
	db := setupTestDB(t)
	user := createTestUser(t, db)

	config := &JWTConfig{
		SecretKey:       "test-secret-key",
		Issuer:          "test-issuer",
		Audience:        "test-audience",
		AccessTokenTTL:  15 * time.Minute,
		RefreshTokenTTL: 7 * 24 * time.Hour,
	}

	jwtService := NewJWTService(config, db)

	// Generate token
	abilities := []string{"users.read"}
	accessToken, err := jwtService.GenerateTokenForUser(user, TokenTypeAccess, abilities, false, "test-device")
	require.NoError(t, err)

	// Validate token
	result, err := jwtService.ValidateToken(accessToken.Token)
	assert.NoError(t, err)
	assert.True(t, result.IsValid)
	assert.NotNil(t, result.User)
	assert.NotNil(t, result.Claims)
	assert.Equal(t, abilities, result.Abilities)

	// Check user data
	validatedUser := result.User.(*models.User)
	assert.Equal(t, user.StudentID, validatedUser.StudentID)
	assert.Equal(t, user.Email, validatedUser.Email)

	// Check claims
	assert.Equal(t, user.StudentID, result.Claims.UserID)
	assert.Equal(t, UserTypeStudent, result.Claims.UserType)
	assert.Equal(t, TokenTypeAccess, result.Claims.TokenType)
}

func TestJWTService_ValidateToken_Invalid(t *testing.T) {
	db := setupTestDB(t)

	config := &JWTConfig{
		SecretKey: "test-secret-key",
	}

	jwtService := NewJWTService(config, db)

	// Test with invalid token
	result, err := jwtService.ValidateToken("invalid-token")
	assert.Error(t, err)
	assert.False(t, result.IsValid)
	assert.NotEmpty(t, result.Error)
}

func TestJWTService_RefreshToken(t *testing.T) {
	db := setupTestDB(t)
	user := createTestUser(t, db)

	config := &JWTConfig{
		SecretKey:       "test-secret-key",
		Issuer:          "test-issuer",
		Audience:        "test-audience",
		AccessTokenTTL:  15 * time.Minute,
		RefreshTokenTTL: 7 * 24 * time.Hour,
	}

	jwtService := NewJWTService(config, db)

	// Generate refresh token
	abilities := []string{"users.read"}
	refreshToken, err := jwtService.GenerateTokenForUser(user, TokenTypeRefresh, abilities, false, "test-device")
	require.NoError(t, err)

	// Use refresh token to generate new access token
	newAccessToken, err := jwtService.RefreshToken(refreshToken.Token)
	assert.NoError(t, err)
	assert.NotNil(t, newAccessToken)
	assert.Equal(t, "access_token", newAccessToken.Name)
	assert.Equal(t, string(UserTypeStudent), newAccessToken.TokenableType)

	// Verify old refresh token is revoked
	result, err := jwtService.ValidateToken(refreshToken.Token)
	assert.Error(t, err)
	assert.False(t, result.IsValid)
}

func TestJWTService_RevokeToken(t *testing.T) {
	db := setupTestDB(t)
	user := createTestUser(t, db)

	config := &JWTConfig{
		SecretKey: "test-secret-key",
	}

	jwtService := NewJWTService(config, db)

	// Generate token
	accessToken, err := jwtService.GenerateTokenForUser(user, TokenTypeAccess, []string{"users.read"}, false, "test-device")
	require.NoError(t, err)

	// Validate token works
	result, err := jwtService.ValidateToken(accessToken.Token)
	assert.NoError(t, err)
	assert.True(t, result.IsValid)

	// Revoke token
	err = jwtService.RevokeToken(accessToken.Token)
	assert.NoError(t, err)

	// Validate token is now invalid
	result, err = jwtService.ValidateToken(accessToken.Token)
	assert.Error(t, err)
	assert.False(t, result.IsValid)
}

func TestJWTService_RevokeAllTokens(t *testing.T) {
	db := setupTestDB(t)
	user := createTestUser(t, db)

	config := &JWTConfig{
		SecretKey: "test-secret-key",
	}

	jwtService := NewJWTService(config, db)

	// Generate multiple tokens
	token1, err := jwtService.GenerateTokenForUser(user, TokenTypeAccess, []string{"users.read"}, false, "device1")
	require.NoError(t, err)

	token2, err := jwtService.GenerateTokenForUser(user, TokenTypeAccess, []string{"users.write"}, false, "device2")
	require.NoError(t, err)

	// Verify both tokens work
	result1, err := jwtService.ValidateToken(token1.Token)
	assert.NoError(t, err)
	assert.True(t, result1.IsValid)

	result2, err := jwtService.ValidateToken(token2.Token)
	assert.NoError(t, err)
	assert.True(t, result2.IsValid)

	// Revoke all tokens
	err = jwtService.RevokeAllTokens(user.StudentID, UserTypeStudent)
	assert.NoError(t, err)

	// Verify both tokens are now invalid
	result1, err = jwtService.ValidateToken(token1.Token)
	assert.Error(t, err)
	assert.False(t, result1.IsValid)

	result2, err = jwtService.ValidateToken(token2.Token)
	assert.Error(t, err)
	assert.False(t, result2.IsValid)
}

func TestJWTService_HasAbility(t *testing.T) {
	db := setupTestDB(t)

	config := &JWTConfig{
		SecretKey: "test-secret-key",
	}

	jwtService := NewJWTService(config, db)

	tests := []struct {
		name           string
		abilities      []string
		requiredAbility string
		expected       bool
	}{
		{
			name:           "exact match",
			abilities:      []string{"users.read", "users.write"},
			requiredAbility: "users.read",
			expected:       true,
		},
		{
			name:           "wildcard all",
			abilities:      []string{"*"},
			requiredAbility: "anything",
			expected:       true,
		},
		{
			name:           "wildcard prefix",
			abilities:      []string{"users.*"},
			requiredAbility: "users.read",
			expected:       true,
		},
		{
			name:           "no match",
			abilities:      []string{"users.read"},
			requiredAbility: "admin.write",
			expected:       false,
		},
		{
			name:           "empty abilities",
			abilities:      []string{},
			requiredAbility: "users.read",
			expected:       false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := jwtService.HasAbility(tt.abilities, tt.requiredAbility)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestJWTService_ExtractTokenFromHeader(t *testing.T) {
	db := setupTestDB(t)

	config := &JWTConfig{
		SecretKey: "test-secret-key",
	}

	jwtService := NewJWTService(config, db)

	tests := []struct {
		name        string
		authHeader  string
		expectError bool
		expectedToken string
	}{
		{
			name:        "valid bearer token",
			authHeader:  "Bearer abc123",
			expectError: false,
			expectedToken: "abc123",
		},
		{
			name:        "valid bearer token lowercase",
			authHeader:  "bearer xyz789",
			expectError: false,
			expectedToken: "xyz789",
		},
		{
			name:        "empty header",
			authHeader:  "",
			expectError: true,
		},
		{
			name:        "invalid format",
			authHeader:  "InvalidFormat",
			expectError: true,
		},
		{
			name:        "missing token",
			authHeader:  "Bearer",
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			token, err := jwtService.ExtractTokenFromHeader(tt.authHeader)
			if tt.expectError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
				assert.Equal(t, tt.expectedToken, token)
			}
		})
	}
}

func TestJWTService_GetActiveTokensCount(t *testing.T) {
	db := setupTestDB(t)
	user := createTestUser(t, db)

	config := &JWTConfig{
		SecretKey: "test-secret-key",
	}

	jwtService := NewJWTService(config, db)

	// Initially should have 0 tokens
	count, err := jwtService.GetActiveTokensCount(user.StudentID, UserTypeStudent)
	assert.NoError(t, err)
	assert.Equal(t, int64(0), count)

	// Generate some tokens
	_, err = jwtService.GenerateTokenForUser(user, TokenTypeAccess, []string{"users.read"}, false, "device1")
	require.NoError(t, err)

	_, err = jwtService.GenerateTokenForUser(user, TokenTypeRefresh, []string{"users.read"}, false, "device1")
	require.NoError(t, err)

	// Should now have 2 tokens
	count, err = jwtService.GetActiveTokensCount(user.StudentID, UserTypeStudent)
	assert.NoError(t, err)
	assert.Equal(t, int64(2), count)
}

func TestJWTService_CleanupExpiredTokens(t *testing.T) {
	db := setupTestDB(t)
	user := createTestUser(t, db)

	config := &JWTConfig{
		SecretKey: "test-secret-key",
	}

	jwtService := NewJWTService(config, db)

	// Create a token and manually set it as expired
	accessToken, err := jwtService.GenerateTokenForUser(user, TokenTypeAccess, []string{"users.read"}, false, "device1")
	require.NoError(t, err)

	// Manually set expiration to past time
	expiredTime := time.Now().Add(-25 * time.Hour) // More than 24 hours ago
	err = db.Model(accessToken).Update("expires_at", expiredTime).Error
	require.NoError(t, err)

	// Verify token exists
	var count int64
	err = db.Model(&models.AccessToken{}).Count(&count).Error
	assert.NoError(t, err)
	assert.Equal(t, int64(1), count)

	// Cleanup expired tokens
	err = jwtService.CleanupExpiredTokens()
	assert.NoError(t, err)

	// Verify token is removed
	err = db.Model(&models.AccessToken{}).Count(&count).Error
	assert.NoError(t, err)
	assert.Equal(t, int64(0), count)
}