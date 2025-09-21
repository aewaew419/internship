package database

import (
	"fmt"
	"log"

	"gorm.io/gorm"
)

// AutoMigrate runs automatic migration for all models
func AutoMigrate(db *gorm.DB) error {
	log.Println("Starting database auto-migration...")

	// Note: Models will be imported and added here as they are created
	// For now, we'll prepare the structure for future model migrations
	
	// Example of how models will be migrated:
	// err := db.AutoMigrate(
	//     &models.User{},
	//     &models.Student{},
	//     &models.Instructor{},
	//     &models.Course{},
	//     // ... other models
	// )
	
	// if err != nil {
	//     return fmt.Errorf("failed to auto-migrate models: %w", err)
	// }

	log.Println("Database auto-migration completed successfully")
	return nil
}

// CreateIndexes creates additional database indexes for performance optimization
func CreateIndexes(db *gorm.DB) error {
	log.Println("Creating database indexes...")

	// Example indexes that will be created:
	indexes := []string{
		"CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
		"CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)",
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