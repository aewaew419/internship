package models

import "gorm.io/gorm"

// AllModels returns a slice of all model structs for auto-migration
func AllModels() []interface{} {
	return []interface{}{
		// Core entities
		&Role{},
		&Permission{},
		&RolePermission{},
		&User{},
		
		// Organizational structure
		&Campus{},
		&Faculty{},
		&Program{},
		&Curriculum{},
		&Major{},
		
		// User types
		&Student{},
		&Instructor{},
		&Staff{},
		
		// Course management
		&Course{},
		&CourseSection{},
		&StudentEnroll{},
		&CourseInstructor{},
		&CourseCommittee{},
		&StudentEnrollStatus{},
	}
}

// AutoMigrate runs auto-migration for all models
func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(AllModels()...)
}