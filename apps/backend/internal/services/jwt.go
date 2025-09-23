package services

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"gorm.io/gorm"

	"backend-go/internal/models"
)

// TokenType represents different types of tokens
type TokenType string

const (
	TokenTypeAccess        TokenType = "access"
	TokenTypeRefresh       TokenType = "refresh"
	TokenTypePasswordReset TokenType = "password_reset"
	TokenTypeEmailVerify   TokenType = "email_verify"
)

// UserType represents the type of user for polymorphic relationships
type UserType string

const (
	UserTypeStudent    UserType = "User"
	UserTypeSuperAdmin UserType = "SuperAdmin"
)

// JWTClaims represents the enhanced JWT claims structure
type JWTClaims struct {
	UserID        string    `json:"user_id"`        // student_id or admin id
	UserType      UserType  `json:"user_type"`      // "User" or "SuperAdmin"
	Email         string    `json:"email"`
	TokenType     TokenType `json:"token_type"`
	Abilities     []string  `json:"abilities"`
	TokenID       string    `json:"jti"`            // JWT ID for revocation
	DeviceInfo    string    `json:"device_info"`    // Device fingerprint
	jwt.RegisteredClaims
}

// TokenVerificationResult represents the result of token verification
type TokenVerificationResult struct {
	IsValid   bool                    `json:"is_valid"`
	User      interface{}             `json:"user,omitempty"`      // *models.User or *models.SuperAdmin
	Claims    *JWTClaims             `json:"claims,omitempty"`
	Token     *models.AccessToken    `json:"token,omitempty"`
	Abilities []string               `json:"abilities"`
	ExpiresAt time.Time              `json:"expires_at"`
	Error     string                 `json:"error,omitempty"`
}

// JWTConfig represents JWT configuration
type JWTConfig struct {
	SecretKey       string
	Issuer          string
	Audience        string
	AccessTokenTTL  time.Duration
	RefreshTokenTTL time.Duration
	RememberTokenTTL time.Duration
	ResetTokenTTL   time.Duration
	VerifyTokenTTL  time.Duration
}

// JWTService handles enhanced JWT token operations
type JWTService struct {
	config    *JWTConfig
	secretKey []byte
	db        *gorm.DB
}

// NewJWTService creates a new enhanced JWT service instance
func NewJWTService(config *JWTConfig, db *gorm.DB) *JWTService {
	if config == nil {
		config = &JWTConfig{
			SecretKey:       "default-secret-key",
			Issuer:          "internship-system",
			Audience:        "internship-users",
			AccessTokenTTL:  15 * time.Minute,
			RefreshTokenTTL: 7 * 24 * time.Hour,
			RememberTokenTTL: 30 * 24 * time.Hour,
			ResetTokenTTL:   1 * time.Hour,
			VerifyTokenTTL:  24 * time.Hour,
		}
	}

	return &JWTService{
		config:    config,
		secretKey: []byte(config.SecretKey),
		db:        db,
	}
}

// GenerateTokenForUser generates a new JWT token for a student user
func (j *JWTService) GenerateTokenForUser(user *models.User, tokenType TokenType, abilities []string, rememberMe bool, deviceInfo string) (*models.AccessToken, error) {
	return j.generateToken(user.StudentID, UserTypeStudent, user.Email, tokenType, abilities, rememberMe, deviceInfo)
}

// GenerateTokenForSuperAdmin generates a new JWT token for a super admin
func (j *JWTService) GenerateTokenForSuperAdmin(admin *models.SuperAdmin, tokenType TokenType, abilities []string, rememberMe bool, deviceInfo string) (*models.AccessToken, error) {
	return j.generateToken(fmt.Sprintf("%d", admin.ID), UserTypeSuperAdmin, admin.Email, tokenType, abilities, rememberMe, deviceInfo)
}

// generateToken is the internal method to generate tokens
func (j *JWTService) generateToken(userID string, userType UserType, email string, tokenType TokenType, abilities []string, rememberMe bool, deviceInfo string) (*models.AccessToken, error) {
	// Generate unique token ID for revocation
	tokenID, err := j.generateTokenID()
	if err != nil {
		return nil, fmt.Errorf("failed to generate token ID: %w", err)
	}

	// Determine expiration based on token type and remember me
	var expiresAt time.Time
	var tokenName string

	switch tokenType {
	case TokenTypeAccess:
		if rememberMe {
			expiresAt = time.Now().Add(j.config.RememberTokenTTL)
			tokenName = "remember_token"
		} else {
			expiresAt = time.Now().Add(j.config.AccessTokenTTL)
			tokenName = "access_token"
		}
	case TokenTypeRefresh:
		expiresAt = time.Now().Add(j.config.RefreshTokenTTL)
		tokenName = "refresh_token"
	case TokenTypePasswordReset:
		expiresAt = time.Now().Add(j.config.ResetTokenTTL)
		tokenName = "password_reset_token"
	case TokenTypeEmailVerify:
		expiresAt = time.Now().Add(j.config.VerifyTokenTTL)
		tokenName = "email_verify_token"
	default:
		return nil, errors.New("invalid token type")
	}

	// Create JWT claims
	claims := JWTClaims{
		UserID:     userID,
		UserType:   userType,
		Email:      email,
		TokenType:  tokenType,
		Abilities:  abilities,
		TokenID:    tokenID,
		DeviceInfo: deviceInfo,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    j.config.Issuer,
			Audience:  jwt.ClaimStrings{j.config.Audience},
			Subject:   email,
			ID:        tokenID,
		},
	}

	// Generate JWT token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(j.secretKey)
	if err != nil {
		return nil, fmt.Errorf("failed to sign token: %w", err)
	}

	// Convert abilities to JSON
	abilitiesJSON, err := json.Marshal(abilities)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal abilities: %w", err)
	}

	// Create access token record
	accessToken := &models.AccessToken{
		TokenableType: string(userType),
		TokenableID:   userID,
		Name:          tokenName,
		Token:         tokenString,
		Abilities:     string(abilitiesJSON),
		ExpiresAt:     expiresAt,
	}

	// Save to database
	if err := j.db.Create(accessToken).Error; err != nil {
		return nil, fmt.Errorf("failed to save access token: %w", err)
	}

	return accessToken, nil
}

// ValidateToken validates and parses a JWT token with comprehensive checks
func (j *JWTService) ValidateToken(tokenString string) (*TokenVerificationResult, error) {
	// Parse and validate JWT
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return j.secretKey, nil
	})

	result := &TokenVerificationResult{
		IsValid: false,
	}

	if err != nil {
		result.Error = fmt.Sprintf("token parsing failed: %v", err)
		return result, err
	}

	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid {
		result.Error = "invalid token claims"
		return result, errors.New("invalid token claims")
	}

	// Check if token exists in database and is not revoked
	var accessToken models.AccessToken
	if err := j.db.Where("token = ? AND expires_at > ?", tokenString, time.Now()).First(&accessToken).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			result.Error = "token not found or expired"
			return result, errors.New("token not found or expired")
		}
		result.Error = fmt.Sprintf("database error: %v", err)
		return result, err
	}

	// Update last used timestamp
	if err := accessToken.UpdateLastUsed(j.db); err != nil {
		// Log error but don't fail validation
		fmt.Printf("Warning: failed to update token last used: %v\n", err)
	}

	// Load user based on user type
	var user interface{}
	switch claims.UserType {
	case UserTypeStudent:
		var studentUser models.User
		if err := j.db.Where("student_id = ?", claims.UserID).First(&studentUser).Error; err != nil {
			result.Error = "user not found"
			return result, errors.New("user not found")
		}
		user = &studentUser
	case UserTypeSuperAdmin:
		var superAdmin models.SuperAdmin
		if err := j.db.Where("id = ?", claims.UserID).First(&superAdmin).Error; err != nil {
			result.Error = "admin not found"
			return result, errors.New("admin not found")
		}
		user = &superAdmin
	default:
		result.Error = "invalid user type"
		return result, errors.New("invalid user type")
	}

	// Parse abilities from access token
	var abilities []string
	if accessToken.Abilities != "" {
		if err := json.Unmarshal([]byte(accessToken.Abilities), &abilities); err != nil {
			abilities = []string{} // Default to empty if parsing fails
		}
	}

	result.IsValid = true
	result.User = user
	result.Claims = claims
	result.Token = &accessToken
	result.Abilities = abilities
	result.ExpiresAt = accessToken.ExpiresAt

	return result, nil
}

// RefreshToken generates a new access token from a valid refresh token
func (j *JWTService) RefreshToken(refreshTokenString string) (*models.AccessToken, error) {
	// Validate refresh token
	result, err := j.ValidateToken(refreshTokenString)
	if err != nil || !result.IsValid {
		return nil, fmt.Errorf("invalid refresh token: %w", err)
	}

	// Check if it's actually a refresh token
	if result.Claims.TokenType != TokenTypeRefresh {
		return nil, errors.New("token is not a refresh token")
	}

	// Revoke the old refresh token
	if err := j.RevokeToken(refreshTokenString); err != nil {
		// Log error but continue
		fmt.Printf("Warning: failed to revoke old refresh token: %v\n", err)
	}

	// Generate new access token based on user type
	switch result.Claims.UserType {
	case UserTypeStudent:
		user := result.User.(*models.User)
		return j.GenerateTokenForUser(user, TokenTypeAccess, result.Abilities, false, result.Claims.DeviceInfo)
	case UserTypeSuperAdmin:
		admin := result.User.(*models.SuperAdmin)
		return j.GenerateTokenForSuperAdmin(admin, TokenTypeAccess, result.Abilities, false, result.Claims.DeviceInfo)
	default:
		return nil, errors.New("invalid user type in refresh token")
	}
}

// RevokeToken revokes a specific token
func (j *JWTService) RevokeToken(tokenString string) error {
	var accessToken models.AccessToken
	if err := j.db.Where("token = ?", tokenString).First(&accessToken).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil // Token doesn't exist, consider it revoked
		}
		return fmt.Errorf("failed to find token: %w", err)
	}

	return accessToken.Revoke(j.db)
}

// RevokeAllTokens revokes all tokens for a user
func (j *JWTService) RevokeAllTokens(userID string, userType UserType) error {
	return j.db.Model(&models.AccessToken{}).
		Where("tokenable_type = ? AND tokenable_id = ? AND expires_at > ?", string(userType), userID, time.Now()).
		Update("expires_at", time.Now().Add(-time.Hour)).Error
}

// RevokeAllTokensExcept revokes all tokens for a user except the specified one
func (j *JWTService) RevokeAllTokensExcept(userID string, userType UserType, exceptToken string) error {
	return j.db.Model(&models.AccessToken{}).
		Where("tokenable_type = ? AND tokenable_id = ? AND token != ? AND expires_at > ?", 
			string(userType), userID, exceptToken, time.Now()).
		Update("expires_at", time.Now().Add(-time.Hour)).Error
}

// CleanupExpiredTokens removes expired tokens from the database
func (j *JWTService) CleanupExpiredTokens() error {
	return j.db.Where("expires_at < ?", time.Now().Add(-24*time.Hour)).Delete(&models.AccessToken{}).Error
}

// GetActiveTokensCount returns the number of active tokens for a user
func (j *JWTService) GetActiveTokensCount(userID string, userType UserType) (int64, error) {
	var count int64
	err := j.db.Model(&models.AccessToken{}).
		Where("tokenable_type = ? AND tokenable_id = ? AND expires_at > ?", string(userType), userID, time.Now()).
		Count(&count).Error
	return count, err
}

// GeneratePasswordResetToken generates a password reset token
func (j *JWTService) GeneratePasswordResetToken(userID string, userType UserType, email string) (*models.AccessToken, error) {
	abilities := []string{"password:reset"}
	return j.generateToken(userID, userType, email, TokenTypePasswordReset, abilities, false, "")
}

// GenerateEmailVerificationToken generates an email verification token
func (j *JWTService) GenerateEmailVerificationToken(userID string, userType UserType, email string) (*models.AccessToken, error) {
	abilities := []string{"email:verify"}
	return j.generateToken(userID, userType, email, TokenTypeEmailVerify, abilities, false, "")
}

// generateTokenID generates a unique token ID for JWT ID claim
func (j *JWTService) generateTokenID() (string, error) {
	bytes := make([]byte, 16)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// ExtractTokenFromHeader extracts JWT token from Authorization header
func (j *JWTService) ExtractTokenFromHeader(authHeader string) (string, error) {
	if authHeader == "" {
		return "", errors.New("authorization header is empty")
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
		return "", errors.New("invalid authorization header format")
	}

	return parts[1], nil
}

// HasAbility checks if the token has a specific ability
func (j *JWTService) HasAbility(abilities []string, requiredAbility string) bool {
	for _, ability := range abilities {
		if ability == "*" || ability == requiredAbility {
			return true
		}
		// Support wildcard matching (e.g., "users.*" matches "users.read")
		if strings.HasSuffix(ability, "*") {
			prefix := strings.TrimSuffix(ability, "*")
			if strings.HasPrefix(requiredAbility, prefix) {
				return true
			}
		}
	}
	return false
}