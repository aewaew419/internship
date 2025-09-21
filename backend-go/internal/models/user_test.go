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
		fullName := "John Doe"
		user := User{FullName: &fullName, Email: "john@test.com"}
		assert.Equal(t, "John Doe", user.GetFullName())

		userWithoutName := User{Email: "jane@test.com"}
		assert.Equal(t, "jane@test.com", userWithoutName.GetFullName())

		// Test with empty full name
		emptyName := ""
		userWithEmptyName := User{FullName: &emptyName, Email: "empty@test.com"}
		assert.Equal(t, "empty@test.com", userWithEmptyName.GetFullName())
	})

	t.Run("User Struct Fields", func(t *testing.T) {
		fullName := "Test User"
		user := User{
			ID:       1,
			FullName: &fullName,
			Email:    "test@example.com",
			Password: "hashedpassword",
			RoleID:   1,
		}

		assert.Equal(t, uint(1), user.ID)
		assert.Equal(t, "Test User", *user.FullName)
		assert.Equal(t, "test@example.com", user.Email)
		assert.Equal(t, "hashedpassword", user.Password)
		assert.Equal(t, uint(1), user.RoleID)
	})
}