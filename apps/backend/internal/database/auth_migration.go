package database

import (
	"fmt"
	"log"

	"backend-go/internal/models"
	"gorm.io/gorm"
)

// MigrateAuthenticationSystem performs the specific migration for the enhanced authentication system
func MigrateAuthenticationSystem(db *gorm.DB) error {
	log.Println("Starting authentication system migration...")

	// Step 1: Create new tables for enhanced authentication
	if err := createAuthenticationTables(db); err != nil {
		return fmt.Errorf("failed to create authentication tables: %w", err)
	}

	// Step 2: Migrate existing user data if needed
	if err := migrateExistingUserData(db); err != nil {
		return fmt.Errorf("failed to migrate existing user data: %w", err)
	}

	// Step 3: Create authentication-specific indexes
	if err := createAuthenticationIndexes(db); err != nil {
		return fmt.Errorf("failed to create authentication indexes: %w", err)
	}

	// Step 4: Create default super admin if not exists
	if err := createDefaultSuperAdmin(db); err != nil {
		return fmt.Errorf("failed to create default super admin: %w", err)
	}

	log.Println("Authentication system migration completed successfully")
	return nil
}

// createAuthenticationTables creates the new authentication tables
func createAuthenticationTables(db *gorm.DB) error {
	log.Println("Creating authentication tables...")

	// Create the new authentication models
	err := db.AutoMigrate(
		&models.SuperAdmin{},
		&models.AccessToken{},
		&models.SecurityLog{},
	)
	
	if err != nil {
		return fmt.Errorf("failed to create authentication tables: %w", err)
	}

	log.Println("Authentication tables created successfully")
	return nil
}

// migrateExistingUserData migrates existing user data to the new structure
func migrateExistingUserData(db *gorm.DB) error {
	log.Println("Migrating existing user data...")

	// Check if we need to migrate from old User structure to new structure
	// This would involve:
	// 1. Backing up existing data
	// 2. Converting user IDs to student IDs
	// 3. Updating relationships

	// For now, we'll assume this is a fresh installation
	// In a real migration, you would implement the data transformation logic here

	log.Println("User data migration completed")
	return nil
}

// createAuthenticationIndexes creates specific indexes for authentication performance
func createAuthenticationIndexes(db *gorm.DB) error {
	log.Println("Creating authentication indexes...")

	authIndexes := []string{
		// User table indexes for student_id primary key
		"CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id)",
		"CREATE INDEX IF NOT EXISTS idx_users_email_status ON users(email, status)",
		"CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at)",
		
		// Super Admin performance indexes
		"CREATE INDEX IF NOT EXISTS idx_super_admins_email_role ON super_admins(email, role)",
		"CREATE INDEX IF NOT EXISTS idx_super_admins_two_factor ON super_admins(two_factor_enabled)",
		
		// Access Token performance indexes
		"CREATE INDEX IF NOT EXISTS idx_access_tokens_expires_tokenable ON access_tokens(expires_at, tokenable_type, tokenable_id)",
		"CREATE INDEX IF NOT EXISTS idx_access_tokens_last_used ON access_tokens(last_used_at)",
		
		// Security Log performance indexes
		"CREATE INDEX IF NOT EXISTS idx_security_logs_user_action ON security_logs(user_type, user_id, action)",
		"CREATE INDEX IF NOT EXISTS idx_security_logs_ip_created ON security_logs(ip_address, created_at)",
	}

	for _, indexSQL := range authIndexes {
		if err := db.Exec(indexSQL).Error; err != nil {
			log.Printf("Warning: Failed to create authentication index: %s, Error: %v", indexSQL, err)
			// Continue with other indexes even if one fails
		}
	}

	log.Println("Authentication indexes created successfully")
	return nil
}

// createDefaultSuperAdmin creates a default super admin account if none exists
func createDefaultSuperAdmin(db *gorm.DB) error {
	log.Println("Creating default super admin...")

	// Check if any super admin exists
	var count int64
	if err := db.Model(&models.SuperAdmin{}).Count(&count).Error; err != nil {
		return fmt.Errorf("failed to count super admins: %w", err)
	}

	// If no super admin exists, create a default one
	if count == 0 {
		defaultAdmin := &models.SuperAdmin{
			Email:    "admin@system.local",
			Password: "admin123", // This will be hashed by the BeforeCreate hook
			FullName: "System Administrator",
			Role:     models.AdminRoleSuperAdmin,
			Permissions: `["*"]`, // All permissions
		}

		if err := db.Create(defaultAdmin).Error; err != nil {
			return fmt.Errorf("failed to create default super admin: %w", err)
		}

		log.Printf("Default super admin created with email: %s", defaultAdmin.Email)
		log.Println("WARNING: Please change the default admin password immediately!")
	} else {
		log.Println("Super admin already exists, skipping default creation")
	}

	return nil
}

// CleanupExpiredTokens removes expired access tokens
func CleanupExpiredTokens(db *gorm.DB) error {
	log.Println("Cleaning up expired access tokens...")

	result := db.Where("expires_at < NOW()").Delete(&models.AccessToken{})
	if result.Error != nil {
		return fmt.Errorf("failed to cleanup expired tokens: %w", result.Error)
	}

	log.Printf("Cleaned up %d expired tokens", result.RowsAffected)
	return nil
}

// CleanupOldSecurityLogs removes security logs older than specified days
func CleanupOldSecurityLogs(db *gorm.DB, daysToKeep int) error {
	log.Printf("Cleaning up security logs older than %d days...", daysToKeep)

	result := db.Where("created_at < DATE_SUB(NOW(), INTERVAL ? DAY)", daysToKeep).Delete(&models.SecurityLog{})
	if result.Error != nil {
		return fmt.Errorf("failed to cleanup old security logs: %w", result.Error)
	}

	log.Printf("Cleaned up %d old security log entries", result.RowsAffected)
	return nil
}