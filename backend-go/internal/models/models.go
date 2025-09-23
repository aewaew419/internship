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
		
		// Company and training
		&Company{},
		&CompanyPicture{},
		&StudentTraining{},
		
		// Visitor and evaluation system
		&VisitorTraining{},
		&VisitorSchedule{},
		&VisitorEvaluateStudent{},
		&VisitorEvaluateCompany{},
		&StudentEvaluateCompany{},
		&VisitsPicture{},
		
		// Approval and evaluation tracking models
		&InternshipApproval{},
		&EvaluationStatusTracker{},
	}
}

// AutoMigrate runs auto-migration for all models
func AutoMigrate(db *gorm.DB) error {
	return db.AutoMigrate(AllModels()...)
}