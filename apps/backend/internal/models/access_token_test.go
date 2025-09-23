package models

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestAccessTokenModel(t *testing.T) {
	t.Run("AccessToken TableName", func(t *testing.T) {
		token := AccessToken{}
		assert.Equal(t, "access_tokens", token.TableName())
	})

	t.Run("IsExpired Method", func(t *testing.T) {
		// Test expired token
		expiredToken := AccessToken{
			ExpiresAt: time.Now().Add(-time.Hour),
		}
		assert.True(t, expiredToken.IsExpired())

		// Test valid token
		validToken := AccessToken{
			ExpiresAt: time.Now().Add(time.Hour),
		}
		assert.False(t, validToken.IsExpired())

		// Test token expiring exactly now (should be considered expired)
		nowToken := AccessToken{
			ExpiresAt: time.Now(),
		}
		// Give a small buffer for test execution time
		time.Sleep(time.Millisecond)
		assert.True(t, nowToken.IsExpired())
	})

	t.Run("AccessToken Struct Fields", func(t *testing.T) {
		expiresAt := time.Now().Add(time.Hour)
		token := AccessToken{
			ID:            1,
			TokenableType: "User",
			TokenableID:   "12345678",
			Name:          "auth_token",
			Token:         "sample_token_string",
			Abilities:     `["read", "write"]`,
			ExpiresAt:     expiresAt,
		}

		assert.Equal(t, uint(1), token.ID)
		assert.Equal(t, "User", token.TokenableType)
		assert.Equal(t, "12345678", token.TokenableID)
		assert.Equal(t, "auth_token", token.Name)
		assert.Equal(t, "sample_token_string", token.Token)
		assert.Equal(t, `["read", "write"]`, token.Abilities)
		assert.Equal(t, expiresAt, token.ExpiresAt)
	})

	t.Run("Polymorphic Relationships", func(t *testing.T) {
		// Test User token
		userToken := AccessToken{
			TokenableType: "User",
			TokenableID:   "12345678",
		}
		assert.Equal(t, "User", userToken.TokenableType)
		assert.Equal(t, "12345678", userToken.TokenableID)

		// Test SuperAdmin token
		adminToken := AccessToken{
			TokenableType: "SuperAdmin",
			TokenableID:   "1",
		}
		assert.Equal(t, "SuperAdmin", adminToken.TokenableType)
		assert.Equal(t, "1", adminToken.TokenableID)
	})
}