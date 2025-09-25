package tests

import (
	"fmt"
	"time"

	"backend-go/internal/models"
	"backend-go/internal/services"

	"gorm.io/gorm"
)

// TestSeeder provides database seeding functionality for tests
type TestSeeder struct {
	db *gorm.DB
}

// NewTestSeeder creates a new test seeder instance
func NewTestSeeder(db *gorm.DB) *TestSeeder {
	return &TestSeeder{db: db}
}

// SeedAll seeds all test data
func (ts *TestSeeder) SeedAll() error {
	if err := ts.SeedRoles(); err != nil {
		return fmt.Errorf("failed to seed roles: %w", err)
	}
	
	if err := ts.SeedPermissions(); err != nil {
		return fmt.Errorf("failed to seed permissions: %w", err)
	}
	
	if err := ts.SeedOrganizationalStructure(); err != nil {
		return fmt.Errorf("failed to seed organizational structure: %w", err)
	}
	
	if err := ts.SeedCompanies(); err != nil {
		return fmt.Errorf("failed to seed companies: %w", err)
	}
	
	if err := ts.SeedUsers(); err != nil {
		return fmt.Errorf("failed to seed users: %w", err)
	}
	
	if err := ts.SeedCourses(); err != nil {
		return fmt.Errorf("failed to seed courses: %w", err)
	}
	
	return nil
}

// SeedRoles seeds test roles
func (ts *TestSeeder) SeedRoles() error {
	roles := []models.Role{
		{ID: 1, Name: "super_admin"},
		{ID: 2, Name: "admin"},
		{ID: 3, Name: "student"},
		{ID: 4, Name: "instructor"},
		{ID: 5, Name: "staff"},
		{ID: 6, Name: "visitor"},
		{ID: 7, Name: "company_supervisor"},
	}
	
	for _, role := range roles {
		var existingRole models.Role
		err := ts.db.Where("name = ?", role.Name).First(&existingRole).Error
		if err == gorm.ErrRecordNotFound {
			if err := ts.db.Create(&role).Error; err != nil {
				return err
			}
		}
	}
	
	return nil
}

// SeedPermissions seeds test permissions
func (ts *TestSeeder) SeedPermissions() error {
	permissions := []models.Permission{
		// User management
		{ID: 1, Name: "users.read"},
		{ID: 2, Name: "users.create"},
		{ID: 3, Name: "users.update"},
		{ID: 4, Name: "users.delete"},
		{ID: 5, Name: "users.bulk_import"},
		{ID: 6, Name: "users.bulk_export"},
		
		// Student management
		{ID: 7, Name: "students.read"},
		{ID: 8, Name: "students.create"},
		{ID: 9, Name: "students.update"},
		{ID: 10, Name: "students.delete"},
		{ID: 11, Name: "students.enroll"},
		{ID: 12, Name: "students.evaluate"},
		
		// Instructor management
		{ID: 13, Name: "instructors.read"},
		{ID: 14, Name: "instructors.create"},
		{ID: 15, Name: "instructors.update"},
		{ID: 16, Name: "instructors.delete"},
		{ID: 17, Name: "instructors.assign_courses"},
		
		// Course management
		{ID: 18, Name: "courses.read"},
		{ID: 19, Name: "courses.create"},
		{ID: 20, Name: "courses.update"},
		{ID: 21, Name: "courses.delete"},
		{ID: 22, Name: "courses.manage_sections"},
		
		// Company management
		{ID: 23, Name: "companies.read"},
		{ID: 24, Name: "companies.create"},
		{ID: 25, Name: "companies.update"},
		{ID: 26, Name: "companies.delete"},
		
		// Evaluation management
		{ID: 27, Name: "evaluations.read"},
		{ID: 28, Name: "evaluations.create"},
		{ID: 29, Name: "evaluations.update"},
		{ID: 30, Name: "evaluations.delete"},
		{ID: 31, Name: "evaluations.approve"},
		
		// Report management
		{ID: 32, Name: "reports.read"},
		{ID: 33, Name: "reports.create"},
		{ID: 34, Name: "reports.export"},
		{ID: 35, Name: "reports.pdf_generate"},
		
		// System administration
		{ID: 36, Name: "system.admin"},
		{ID: 37, Name: "system.config"},
		{ID: 38, Name: "system.logs"},
		{ID: 39, Name: "system.backup"},
		{ID: 40, Name: "system.restore"},
	}
	
	for _, permission := range permissions {
		var existingPermission models.Permission
		err := ts.db.Where("name = ?", permission.Name).First(&existingPermission).Error
		if err == gorm.ErrRecordNotFound {
			if err := ts.db.Create(&permission).Error; err != nil {
				return err
			}
		}
	}
	
	return nil
}

// SeedOrganizationalStructure seeds organizational structure
func (ts *TestSeeder) SeedOrganizationalStructure() error {
	// Seed campuses
	campuses := []models.Campus{
		{ID: 1},
		{ID: 2},
	}
	
	for _, campus := range campuses {
		var existing models.Campus
		err := ts.db.Where("id = ?", campus.ID).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			if err := ts.db.Create(&campus).Error; err != nil {
				return err
			}
		}
	}
	
	// Seed faculties
	faculties := []models.Faculty{
		{ID: 1, CampusID: 1},
		{ID: 2, CampusID: 1},
		{ID: 3, CampusID: 2},
	}
	
	for _, faculty := range faculties {
		var existing models.Faculty
		err := ts.db.Where("id = ?", faculty.ID).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			if err := ts.db.Create(&faculty).Error; err != nil {
				return err
			}
		}
	}
	
	// Seed programs
	programs := []models.Program{
		{ID: 1, FacultyID: 1},
		{ID: 2, FacultyID: 1},
		{ID: 3, FacultyID: 2},
		{ID: 4, FacultyID: 3},
	}
	
	for _, program := range programs {
		var existing models.Program
		err := ts.db.Where("id = ?", program.ID).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			if err := ts.db.Create(&program).Error; err != nil {
				return err
			}
		}
	}
	
	// Seed majors
	majors := []models.Major{
		{ID: 1, ProgramID: 1},
		{ID: 2, ProgramID: 1},
		{ID: 3, ProgramID: 2},
		{ID: 4, ProgramID: 3},
		{ID: 5, ProgramID: 4},
	}
	
	for _, major := range majors {
		var existing models.Major
		err := ts.db.Where("id = ?", major.ID).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			if err := ts.db.Create(&major).Error; err != nil {
				return err
			}
		}
	}
	
	return nil
}

// SeedCompanies seeds test companies
func (ts *TestSeeder) SeedCompanies() error {
	companies := []models.Company{
		{ID: 1},
		{ID: 2},
		{ID: 3},
		{ID: 4},
		{ID: 5},
	}
	
	for _, company := range companies {
		var existing models.Company
		err := ts.db.Where("id = ?", company.ID).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			if err := ts.db.Create(&company).Error; err != nil {
				return err
			}
		}
	}
	
	return nil
}

// SeedUsers seeds test users
func (ts *TestSeeder) SeedUsers() error {
	hashedPassword, err := services.HashPassword("password123")
	if err != nil {
		return err
	}
	
	users := []models.User{
		{
			ID:       1,
			FullName: StringPtr("Super Admin User"),
			Email:    "superadmin@test.com",
			Password: hashedPassword,
			RoleID:   1, // super_admin
		},
		{
			ID:       2,
			FullName: StringPtr("Admin User"),
			Email:    "admin@test.com",
			Password: hashedPassword,
			RoleID:   2, // admin
		},
		{
			ID:       3,
			FullName: StringPtr("Test Student"),
			Email:    "student@test.com",
			Password: hashedPassword,
			RoleID:   3, // student
		},
		{
			ID:       4,
			FullName: StringPtr("Test Instructor"),
			Email:    "instructor@test.com",
			Password: hashedPassword,
			RoleID:   4, // instructor
		},
		{
			ID:       5,
			FullName: StringPtr("Test Staff"),
			Email:    "staff@test.com",
			Password: hashedPassword,
			RoleID:   5, // staff
		},
	}
	
	for _, user := range users {
		var existing models.User
		err := ts.db.Where("email = ?", user.Email).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			if err := ts.db.Create(&user).Error; err != nil {
				return err
			}
		}
	}
	
	// Seed students
	students := []models.Student{
		{
			ID:        1,
			UserID:    3,
			StudentID: "STD001",
			MajorID:   1,
		},
		{
			ID:        2,
			UserID:    0, // Will create separate user
			StudentID: "STD002",
			MajorID:   2,
		},
	}
	
	for i, student := range students {
		if student.UserID == 0 {
			// Create user for this student
			studentUser := models.User{
				FullName: StringPtr(fmt.Sprintf("Test Student %d", i+2)),
				Email:    fmt.Sprintf("student%d@test.com", i+2),
				Password: hashedPassword,
				RoleID:   3, // student
			}
			
			if err := ts.db.Create(&studentUser).Error; err != nil {
				return err
			}
			
			student.UserID = studentUser.ID
		}
		
		var existing models.Student
		err := ts.db.Where("student_id = ?", student.StudentID).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			if err := ts.db.Create(&student).Error; err != nil {
				return err
			}
		}
	}
	
	// Seed instructors
	instructors := []models.Instructor{
		{
			ID:           1,
			UserID:       4,
			InstructorID: "INS001",
			FacultyID:    1,
		},
		{
			ID:           2,
			UserID:       0, // Will create separate user
			InstructorID: "INS002",
			FacultyID:    2,
		},
	}
	
	for i, instructor := range instructors {
		if instructor.UserID == 0 {
			// Create user for this instructor
			instructorUser := models.User{
				FullName: StringPtr(fmt.Sprintf("Test Instructor %d", i+2)),
				Email:    fmt.Sprintf("instructor%d@test.com", i+2),
				Password: hashedPassword,
				RoleID:   4, // instructor
			}
			
			if err := ts.db.Create(&instructorUser).Error; err != nil {
				return err
			}
			
			instructor.UserID = instructorUser.ID
		}
		
		var existing models.Instructor
		err := ts.db.Where("instructor_id = ?", instructor.InstructorID).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			if err := ts.db.Create(&instructor).Error; err != nil {
				return err
			}
		}
	}
	
	return nil
}

// SeedCourses seeds test courses
func (ts *TestSeeder) SeedCourses() error {
	courses := []models.Course{
		{
			ID:   1,
			Code: "CS101",
			// Name: "Introduction to Computer Science", // Check if field exists
			// Credits: UintPtr(3), // Check if field exists
		},
		{
			ID:   2,
			Code: "CS102",
			// Name: "Programming Fundamentals", // Check if field exists
			// Credits: UintPtr(4), // Check if field exists
		},
		{
			ID:   3,
			Code: "CS201",
			// Name: "Data Structures", // Check if field exists
			// Credits: UintPtr(3), // Check if field exists
		},
		{
			ID:   4,
			Code: "CS301",
			// Name: "Database Systems", // Check if field exists
			// Credits: UintPtr(3), // Check if field exists
		},
		{
			ID:   5,
			Code: "CS401",
			// Name: "Software Engineering", // Check if field exists
			// Credits: UintPtr(4), // Check if field exists
		},
	}
	
	for _, course := range courses {
		var existing models.Course
		err := ts.db.Where("code = ?", course.Code).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			if err := ts.db.Create(&course).Error; err != nil {
				return err
			}
		}
	}
	
	// Seed course sections
	sections := []models.CourseSection{
		{
			ID:       1,
			CourseID: 1,
			// Section: "A", // Check if field exists
			// Semester: "2024/1", // Check if field exists
			// Year: UintPtr(2024), // Check if field exists
		},
		{
			ID:       2,
			CourseID: 1,
			// Section: "B", // Check if field exists
			// Semester: "2024/1", // Check if field exists
			// Year: UintPtr(2024), // Check if field exists
		},
		{
			ID:       3,
			CourseID: 2,
			// Section: "A", // Check if field exists
			// Semester: "2024/1", // Check if field exists
			// Year: UintPtr(2024), // Check if field exists
		},
	}
	
	for _, section := range sections {
		var existing models.CourseSection
		err := ts.db.Where("id = ?", section.ID).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			if err := ts.db.Create(&section).Error; err != nil {
				return err
			}
		}
	}
	
	return nil
}

// SeedMinimalData seeds only essential data for basic tests
func (ts *TestSeeder) SeedMinimalData() error {
	if err := ts.SeedRoles(); err != nil {
		return err
	}
	
	if err := ts.SeedOrganizationalStructure(); err != nil {
		return err
	}
	
	// Create one test user for each role
	hashedPassword, err := services.HashPassword("password123")
	if err != nil {
		return err
	}
	
	users := []models.User{
		{
			FullName: StringPtr("Test Admin"),
			Email:    "admin@test.com",
			Password: hashedPassword,
			RoleID:   2, // admin
		},
		{
			FullName: StringPtr("Test Student"),
			Email:    "student@test.com",
			Password: hashedPassword,
			RoleID:   3, // student
		},
	}
	
	for _, user := range users {
		var existing models.User
		err := ts.db.Where("email = ?", user.Email).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			if err := ts.db.Create(&user).Error; err != nil {
				return err
			}
		}
	}
	
	return nil
}

// CleanAll removes all seeded data
func (ts *TestSeeder) CleanAll() error {
	// Clean in reverse order of dependencies
	tables := []interface{}{
		&models.VisitsPictures{},
		&models.CompanyPictures{},
		&models.StudentEvaluateCompany{},
		&models.VisitorEvaluateCompany{},
		&models.VisitorEvaluateStudent{},
		&models.VisitorSchedule{},
		&models.VisitorTraining{},
		&models.StudentTraining{},
		&models.StudentEnrollStatus{},
		&models.StudentEnroll{},
		&models.CourseCommittee{},
		&models.CourseInstructor{},
		&models.CourseSection{},
		&models.Course{},
		&models.Staff{},
		&models.Instructor{},
		&models.Student{},
		&models.User{},
		&models.Company{},
		&models.Curriculum{},
		&models.Major{},
		&models.Program{},
		&models.Faculty{},
		&models.Campus{},
		&models.Permission{},
		&models.Role{},
	}
	
	for _, table := range tables {
		if err := ts.db.Where("1 = 1").Delete(table).Error; err != nil {
			return err
		}
	}
	
	return nil
}

// SeedPerformanceTestData seeds data for performance testing
func (ts *TestSeeder) SeedPerformanceTestData(userCount, courseCount int) error {
	// Seed basic structure first
	if err := ts.SeedMinimalData(); err != nil {
		return err
	}
	
	hashedPassword, err := services.HashPassword("password123")
	if err != nil {
		return err
	}
	
	// Create many users for performance testing
	for i := 0; i < userCount; i++ {
		user := models.User{
			FullName: StringPtr(fmt.Sprintf("Performance User %d", i+1)),
			Email:    fmt.Sprintf("perfuser%d@test.com", i+1),
			Password: hashedPassword,
			RoleID:   3, // student
		}
		
		if err := ts.db.Create(&user).Error; err != nil {
			return err
		}
		
		// Create student record
		student := models.Student{
			UserID:    user.ID,
			StudentID: fmt.Sprintf("PERF%04d", i+1),
			MajorID:   1,
		}
		
		if err := ts.db.Create(&student).Error; err != nil {
			return err
		}
	}
	
	// Create many courses for performance testing
	for i := 0; i < courseCount; i++ {
		course := models.Course{
			Code: fmt.Sprintf("PERF%03d", i+1),
		}
		
		if err := ts.db.Create(&course).Error; err != nil {
			return err
		}
	}
	
	return nil
}

// GetSeededUserByRole returns a seeded user by role name
func (ts *TestSeeder) GetSeededUserByRole(roleName string) (*models.User, error) {
	var role models.Role
	if err := ts.db.Where("name = ?", roleName).First(&role).Error; err != nil {
		return nil, err
	}
	
	var user models.User
	if err := ts.db.Where("role_id = ?", role.ID).First(&user).Error; err != nil {
		return nil, err
	}
	
	return &user, nil
}

// GetSeededStudentByID returns a seeded student by student ID
func (ts *TestSeeder) GetSeededStudentByID(studentID string) (*models.Student, error) {
	var student models.Student
	if err := ts.db.Where("student_id = ?", studentID).First(&student).Error; err != nil {
		return nil, err
	}
	
	return &student, nil
}

// GetSeededCourseByCode returns a seeded course by course code
func (ts *TestSeeder) GetSeededCourseByCode(courseCode string) (*models.Course, error) {
	var course models.Course
	if err := ts.db.Where("code = ?", courseCode).First(&course).Error; err != nil {
		return nil, err
	}
	
	return &course, nil
}