package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestUserModel(t *testing.T) {
	t.Run("User TableName", func(t *testing.T) {
		user := User{}
		assert.Equal(t, "users", user.TableName())
	})

	t.Run("CheckPassword Method", func(t *testing.T) {
		// Test with a known bcrypt hash
		user := User{Email: "test@example.com"}
		// This is a bcrypt hash of "password123" with cost 10
		user.Password = "$2a$10$ROJMY9cvqAMLthHfI781xOqzjO5PJirfvJ5GKvutl3gFPtZ.UlsXa"

		// Test correct password
		assert.True(t, user.CheckPassword("password123"))
		// Test incorrect password
		assert.False(t, user.CheckPassword("wrongpassword"))
		// Test empty password
		assert.False(t, user.CheckPassword(""))
	})

	t.Run("GetFullName Method", func(t *testing.T) {
		user := User{FullName: "John Doe", Email: "john@test.com"}
		assert.Equal(t, "John Doe", user.GetFullName())

		userWithoutName := User{Email: "jane@test.com"}
		assert.Equal(t, "jane@test.com", userWithoutName.GetFullName())

		// Test with empty full name
		userWithEmptyName := User{FullName: "", Email: "empty@test.com"}
		assert.Equal(t, "empty@test.com", userWithEmptyName.GetFullName())
	})

	t.Run("User Status Methods", func(t *testing.T) {
		user := User{
			StudentID: "12345678",
			Status:    UserStatusActive,
		}

		assert.True(t, user.IsActive())
		assert.Equal(t, "12345678", user.GetIdentifier())

		user.Status = UserStatusInactive
		assert.False(t, user.IsActive())
	})

	t.Run("User Struct Fields", func(t *testing.T) {
		user := User{
			StudentID: "12345678",
			FullName:  "Test User",
			Email:     "test@example.com",
			Password:  "hashedpassword",
			Status:    UserStatusActive,
		}

		assert.Equal(t, "12345678", user.StudentID)
		assert.Equal(t, "Test User", user.FullName)
		assert.Equal(t, "test@example.com", user.Email)
		assert.Equal(t, "hashedpassword", user.Password)
		assert.Equal(t, UserStatusActive, user.Status)
	})

	t.Run("Email Verification", func(t *testing.T) {
		user := User{StudentID: "12345678"}
		assert.False(t, user.IsEmailVerified())

		// Email verification would be set by the system
		// This test just checks the method works
	})
}