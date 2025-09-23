package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestRolePermissionModel(t *testing.T) {
	t.Run("Role TableName", func(t *testing.T) {
		role := Role{}
		assert.Equal(t, "roles", role.TableName())
	})

	t.Run("Permission TableName", func(t *testing.T) {
		permission := Permission{}
		assert.Equal(t, "permissions", permission.TableName())
	})

	t.Run("RolePermission TableName", func(t *testing.T) {
		rolePermission := RolePermission{}
		assert.Equal(t, "role_permissions", rolePermission.TableName())
	})

	t.Run("Role Struct Fields", func(t *testing.T) {
		role := Role{
			ID:   1,
			Name: "admin",
		}

		assert.Equal(t, uint(1), role.ID)
		assert.Equal(t, "admin", role.Name)
	})

	t.Run("Permission Struct Fields", func(t *testing.T) {
		permission := Permission{
			ID:   1,
			Name: "read",
		}

		assert.Equal(t, uint(1), permission.ID)
		assert.Equal(t, "read", permission.Name)
	})

	t.Run("RolePermission Struct Fields", func(t *testing.T) {
		rolePermission := RolePermission{
			RoleID:       1,
			PermissionID: 2,
		}

		assert.Equal(t, uint(1), rolePermission.RoleID)
		assert.Equal(t, uint(2), rolePermission.PermissionID)
	})
}