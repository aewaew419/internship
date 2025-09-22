package middleware

import (
	"backend-go/internal/models"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

// RoleBasedAuth creates a role-based authorization middleware
func RoleBasedAuth(db *gorm.DB, allowedRoles ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Get user role ID from context
		roleID, ok := GetRoleID(c)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Authentication required",
				"code":  "AUTH_REQUIRED",
			})
		}

		// Get role information from database
		var role models.Role
		err := db.First(&role, roleID).Error
		if err != nil {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Invalid role",
				"code":  "INVALID_ROLE",
			})
		}

		// Check if user's role is in the allowed roles
		for _, allowedRole := range allowedRoles {
			if role.Name == allowedRole {
				// Store role name in context for convenience
				c.Locals("role_name", role.Name)
				return c.Next()
			}
		}

		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"error": "Insufficient permissions",
			"code":  "INSUFFICIENT_PERMISSIONS",
		})
	}
}

// PermissionBasedAuth creates a permission-based authorization middleware
func PermissionBasedAuth(db *gorm.DB, requiredPermissions ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Get user role ID from context
		roleID, ok := GetRoleID(c)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Authentication required",
				"code":  "AUTH_REQUIRED",
			})
		}

		// Get role with permissions from database
		var role models.Role
		err := db.Preload("Permissions").First(&role, roleID).Error
		if err != nil {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Invalid role",
				"code":  "INVALID_ROLE",
			})
		}

		// Create a map of user's permissions for quick lookup
		userPermissions := make(map[string]bool)
		for _, permission := range role.Permissions {
			userPermissions[permission.Name] = true
		}

		// Check if user has all required permissions
		for _, requiredPermission := range requiredPermissions {
			if !userPermissions[requiredPermission] {
				return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
					"error": "Insufficient permissions",
					"code":  "INSUFFICIENT_PERMISSIONS",
					"required_permission": requiredPermission,
				})
			}
		}

		// Store role and permissions in context for convenience
		c.Locals("role_name", role.Name)
		c.Locals("permissions", userPermissions)

		return c.Next()
	}
}

// AdminOnly creates a middleware that only allows admin users
func AdminOnly(db *gorm.DB) fiber.Handler {
	return RoleBasedAuth(db, "admin", "super_admin")
}

// InstructorOrAdmin creates a middleware that allows instructors and admins
func InstructorOrAdmin(db *gorm.DB) fiber.Handler {
	return RoleBasedAuth(db, "instructor", "admin", "super_admin")
}

// StudentOrAbove creates a middleware that allows students and above
func StudentOrAbove(db *gorm.DB) fiber.Handler {
	return RoleBasedAuth(db, "student", "instructor", "staff", "admin", "super_admin")
}

// StaffOrAdmin creates a middleware that allows staff and admins
func StaffOrAdmin(db *gorm.DB) fiber.Handler {
	return RoleBasedAuth(db, "staff", "admin", "super_admin")
}

// GetRoleName extracts the role name from the context
func GetRoleName(c *fiber.Ctx) (string, bool) {
	roleName, ok := c.Locals("role_name").(string)
	return roleName, ok
}

// GetPermissions extracts the permissions map from the context
func GetPermissions(c *fiber.Ctx) (map[string]bool, bool) {
	permissions, ok := c.Locals("permissions").(map[string]bool)
	return permissions, ok
}

// HasPermission checks if the current user has a specific permission
func HasPermission(c *fiber.Ctx, permission string) bool {
	permissions, ok := GetPermissions(c)
	if !ok {
		return false
	}
	return permissions[permission]
}

// OwnerOrAdmin creates a middleware that allows resource owners or admins
func OwnerOrAdmin(db *gorm.DB, getUserIDFromResource func(*fiber.Ctx) (uint, error)) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Get current user ID
		currentUserID, ok := GetUserID(c)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Authentication required",
				"code":  "AUTH_REQUIRED",
			})
		}

		// Get user role
		roleID, _ := GetRoleID(c)
		var role models.Role
		err := db.First(&role, roleID).Error
		if err != nil {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Invalid role",
				"code":  "INVALID_ROLE",
			})
		}

		// Check if user is admin
		if role.Name == "admin" || role.Name == "super_admin" {
			c.Locals("role_name", role.Name)
			return c.Next()
		}

		// Check if user owns the resource
		resourceUserID, err := getUserIDFromResource(c)
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid resource",
				"code":  "INVALID_RESOURCE",
			})
		}

		if currentUserID != resourceUserID {
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"error": "Access denied: You can only access your own resources",
				"code":  "ACCESS_DENIED",
			})
		}

		c.Locals("role_name", role.Name)
		return c.Next()
	}
}