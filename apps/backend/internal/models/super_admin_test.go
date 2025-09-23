package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestSuperAdminModel(t *testing.T) {
	t.Run("SuperAdmin TableName", func(t *testing.T) {
		admin := SuperAdmin{}
		assert.Equal(t, "super_admins", admin.TableName())
	})

	t.Run("CheckPassword Method", func(t *testing.T) {
		// Test with a known bcrypt hash
		admin := SuperAdmin{Email: "admin@example.com"}
		// This is a bcrypt hash of "password123" with cost 10
		admin.Password = "$2a$10$ROJMY9cvqAMLthHfI781xOqzjO5PJirfvJ5GKvutl3gFPtZ.UlsXa"

		// Test correct password
		assert.True(t, admin.CheckPassword("password123"))
		// Test incorrect password
		assert.False(t, admin.CheckPassword("wrongpassword"))
		// Test empty password
		assert.False(t, admin.CheckPassword(""))
	})

	t.Run("HasPermission Method", func(t *testing.T) {
		superAdmin := SuperAdmin{Role: AdminRoleSuperAdmin}
		assert.True(t, superAdmin.HasPermission("any_permission"))

		systemAdmin := SuperAdmin{Role: AdminRoleSystemAdmin}
		assert.True(t, systemAdmin.HasPermission("users.read"))

		contentAdmin := SuperAdmin{Role: AdminRoleContentAdmin}
		assert.True(t, contentAdmin.HasPermission("content.read"))
	})

	t.Run("GetIdentifier Method", func(t *testing.T) {
		admin := SuperAdmin{ID: 123}
		assert.Equal(t, "123", admin.GetIdentifier())
	})

	t.Run("IsTwoFactorEnabled Method", func(t *testing.T) {
		secret := "test_secret"
		admin := SuperAdmin{
			TwoFactorEnabled: true,
			TwoFactorSecret:  &secret,
		}
		assert.True(t, admin.IsTwoFactorEnabled())

		adminWithoutSecret := SuperAdmin{
			TwoFactorEnabled: true,
			TwoFactorSecret:  nil,
		}
		assert.False(t, adminWithoutSecret.IsTwoFactorEnabled())

		adminDisabled := SuperAdmin{
			TwoFactorEnabled: false,
			TwoFactorSecret:  &secret,
		}
		assert.False(t, adminDisabled.IsTwoFactorEnabled())
	})

	t.Run("GetPermissions Method", func(t *testing.T) {
		superAdmin := SuperAdmin{Role: AdminRoleSuperAdmin}
		permissions := superAdmin.GetPermissions()
		assert.Contains(t, permissions, "*")

		systemAdmin := SuperAdmin{Role: AdminRoleSystemAdmin}
		permissions = systemAdmin.GetPermissions()
		assert.Contains(t, permissions, "users.read")
		assert.Contains(t, permissions, "users.write")
		assert.Contains(t, permissions, "system.read")
		assert.Contains(t, permissions, "system.write")

		contentAdmin := SuperAdmin{Role: AdminRoleContentAdmin}
		permissions = contentAdmin.GetPermissions()
		assert.Contains(t, permissions, "content.read")
		assert.Contains(t, permissions, "content.write")
		assert.Contains(t, permissions, "users.read")
	})

	t.Run("SuperAdmin Struct Fields", func(t *testing.T) {
		admin := SuperAdmin{
			ID:       1,
			Email:    "admin@example.com",
			Password: "hashedpassword",
			FullName: "Admin User",
			Role:     AdminRoleSuperAdmin,
		}

		assert.Equal(t, uint(1), admin.ID)
		assert.Equal(t, "admin@example.com", admin.Email)
		assert.Equal(t, "hashedpassword", admin.Password)
		assert.Equal(t, "Admin User", admin.FullName)
		assert.Equal(t, AdminRoleSuperAdmin, admin.Role)
	})
}