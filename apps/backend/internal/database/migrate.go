package database

import (
	"fmt"
	"log"

	"backend-go/internal/models"
	"gorm.io/gorm"
)

// Migrate runs automatic migration for all models
func Migrate(db *gorm.DB) error {
	log.Println("Starting database migration...")

	err := db.AutoMigrate(
		&models.Role{},
		&models.Permission{},
		&models.User{},
		&models.SuperAdmin{},        // New enhanced authentication model
		&models.AccessToken{},       // New token management model
		&models.SecurityLog{},       // New security logging model
		&models.Campus{},
		&models.Faculty{},
		&models.Program{},
		&models.Major{},
		&models.Curriculum{},
		&models.Student{},
		&models.Instructor{},
		&models.Staff{},
		&models.Course{},
		&models.CourseSection{},
		&models.CourseInstructor{},
		&models.CourseCommittee{},
		&models.StudentEnroll{},
		&models.StudentEnrollStatus{},
		&models.StudentTraining{},
		&models.Company{},
		&models.CompanyPicture{},
		&models.VisitorTraining{},
		&models.VisitorSchedule{},
		&models.VisitorEvaluateStudent{},
		&models.VisitorEvaluateCompany{},
		&models.StudentEvaluateCompany{},
		&models.VisitsPicture{},
	)
	
	if err != nil {
		return fmt.Errorf("failed to migrate models: %w", err)
	}

	log.Println("Database migration completed successfully")
	return nil
}

// AutoMigrate runs automatic migration for all models (alias for Migrate)
func AutoMigrate(db *gorm.DB) error {
	return Migrate(db)
}

// CreateIndexes creates additional database indexes for performance optimization
func CreateIndexes(db *gorm.DB) error {
	log.Println("Creating database indexes...")

	// Example indexes that will be created:
	indexes := []string{
		// Enhanced User authentication indexes
		"CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
		"CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)",
		"CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)",
		
		// Super Admin indexes
		"CREATE INDEX IF NOT EXISTS idx_super_admins_email ON super_admins(email)",
		"CREATE INDEX IF NOT EXISTS idx_super_admins_role ON super_admins(role)",
		"CREATE INDEX IF NOT EXISTS idx_super_admins_created_at ON super_admins(created_at)",
		
		// Access Token indexes
		"CREATE INDEX IF NOT EXISTS idx_access_tokens_token ON access_tokens(token)",
		"CREATE INDEX IF NOT EXISTS idx_access_tokens_tokenable ON access_tokens(tokenable_type, tokenable_id)",
		"CREATE INDEX IF NOT EXISTS idx_access_tokens_expires_at ON access_tokens(expires_at)",
		
		// Security Log indexes
		"CREATE INDEX IF NOT EXISTS idx_security_logs_user ON security_logs(user_type, user_id)",
		"CREATE INDEX IF NOT EXISTS idx_security_logs_action ON security_logs(action)",
		"CREATE INDEX IF NOT EXISTS idx_security_logs_ip_address ON security_logs(ip_address)",
		"CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at)",
		
		// Existing indexes
		"CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id)",
		"CREATE INDEX IF NOT EXISTS idx_students_major_id ON students(major_id)",
		"CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code)",
		"CREATE INDEX IF NOT EXISTS idx_student_enrolls_student_course ON student_enrolls(student_id, course_section_id)",
		"CREATE INDEX IF NOT EXISTS idx_visitor_schedules_date ON visitor_schedules(date)",
		"CREATE INDEX IF NOT EXISTS idx_student_trainings_status ON student_trainings(status)",
	}

	for _, indexSQL := range indexes {
		if err := db.Exec(indexSQL).Error; err != nil {
			log.Printf("Warning: Failed to create index: %s, Error: %v", indexSQL, err)
			// Continue with other indexes even if one fails
		}
	}

	log.Println("Database indexes creation completed")
	return nil
}

// DropAllTables drops all tables (use with caution, mainly for testing)
func DropAllTables(db *gorm.DB) error {
	log.Println("WARNING: Dropping all database tables...")

	// Get all table names
	var tables []string
	if err := db.Raw("SHOW TABLES").Scan(&tables).Error; err != nil {
		return fmt.Errorf("failed to get table names: %w", err)
	}

	// Disable foreign key checks
	if err := db.Exec("SET FOREIGN_KEY_CHECKS = 0").Error; err != nil {
		return fmt.Errorf("failed to disable foreign key checks: %w", err)
	}

	// Drop each table
	for _, table := range tables {
		if err := db.Exec(fmt.Sprintf("DROP TABLE IF EXISTS %s", table)).Error; err != nil {
			log.Printf("Warning: Failed to drop table %s: %v", table, err)
		}
	}

	// Re-enable foreign key checks
	if err := db.Exec("SET FOREIGN_KEY_CHECKS = 1").Error; err != nil {
		return fmt.Errorf("failed to re-enable foreign key checks: %w", err)
	}

	log.Println("All database tables dropped successfully")
	return nil
}

// SeedDatabase seeds the database with initial data
func SeedDatabase(db *gorm.DB) error {
	log.Println("Seeding database with initial data...")

	// This will be implemented when models are created
	// Example seeding:
	// - Create default admin user
	// - Create default roles and permissions
	// - Create sample campus/faculty data

	log.Println("Database seeding completed")
	return nil
}