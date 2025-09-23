package fixtures

import (
	"backend-go/internal/models"
	"backend-go/internal/services"

	"gorm.io/gorm"
)

// DatabaseFixtures provides test data fixtures
type DatabaseFixtures struct {
	db *gorm.DB
}

// NewDatabaseFixtures creates a new database fixtures instance
func NewDatabaseFixtures(db *gorm.DB) *DatabaseFixtures {
	return &DatabaseFixtures{db: db}
}

// LoadAllFixtures loads all test fixtures
func (f *DatabaseFixtures) LoadAllFixtures() error {
	if err := f.LoadRoles(); err != nil {
		return err
	}
	if err := f.LoadPermissions(); err != nil {
		return err
	}
	if err := f.LoadOrganizationalData(); err != nil {
		return err
	}
	if err := f.LoadCompanies(); err != nil {
		return err
	}
	if err := f.LoadUsers(); err != nil {
		return err
	}
	if err := f.LoadStudents(); err != nil {
		return err
	}
	if err := f.LoadInstructors(); err != nil {
		return err
	}
	if err := f.LoadCourses(); err != nil {
		return err
	}
	return nil
}

// LoadRoles loads test roles
func (f *DatabaseFixtures) LoadRoles() error {
	roles := []models.Role{
		{ID: 1, Name: "admin", Description: stringPtr("System Administrator")},
		{ID: 2, Name: "student", Description: stringPtr("Student User")},
		{ID: 3, Name: "instructor", Description: stringPtr("Instructor User")},
		{ID: 4, Name: "staff", Description: stringPtr("Staff User")},
		{ID: 5, Name: "visitor", Description: stringPtr("Company Visitor")},
	}

	for _, role := range roles {
		var existingRole models.Role
		err := f.db.Where("name = ?", role.Name).First(&existingRole).Error
		if err == gorm.ErrRecordNotFound {
			if err := f.db.Create(&role).Error; err != nil {
				return err
			}
		}
	}
	return nil
}

// LoadPermissions loads test permissions
func (f *DatabaseFixtures) LoadPermissions() error {
	permissions := []models.Permission{
		{ID: 1, Name: "read_users", Description: stringPtr("Read user data")},
		{ID: 2, Name: "write_users", Description: stringPtr("Create and update users")},
		{ID: 3, Name: "delete_users", Description: stringPtr("Delete users")},
		{ID: 4, Name: "read_students", Description: stringPtr("Read student data")},
		{ID: 5, Name: "write_students", Description: stringPtr("Create and update students")},
		{ID: 6, Name: "delete_students", Description: stringPtr("Delete students")},
		{ID: 7, Name: "read_courses", Description: stringPtr("Read course data")},
		{ID: 8, Name: "write_courses", Description: stringPtr("Create and update courses")},
		{ID: 9, Name: "delete_courses", Description: stringPtr("Delete courses")},
		{ID: 10, Name: "read_instructors", Description: stringPtr("Read instructor data")},
		{ID: 11, Name: "write_instructors", Description: stringPtr("Create and update instructors")},
		{ID: 12, Name: "manage_evaluations", Description: stringPtr("Manage evaluations")},
		{ID: 13, Name: "generate_reports", Description: stringPtr("Generate PDF reports")},
		{ID: 14, Name: "manage_approvals", Description: stringPtr("Manage internship approvals")},
	}

	for _, permission := range permissions {
		var existingPermission models.Permission
		err := f.db.Where("name = ?", permission.Name).First(&existingPermission).Error
		if err == gorm.ErrRecordNotFound {
			if err := f.db.Create(&permission).Error; err != nil {
				return err
			}
		}
	}
	return nil
}

// LoadOrganizationalData loads campus, faculty, program, major data
func (f *DatabaseFixtures) LoadOrganizationalData() error {
	// Load campuses
	campuses := []models.Campus{
		{ID: 1, Name: "Main Campus", Code: "MAIN", Address: stringPtr("123 University Ave")},
		{ID: 2, Name: "North Campus", Code: "NORTH", Address: stringPtr("456 North St")},
	}

	for _, campus := range campuses {
		var existing models.Campus
		err := f.db.Where("code = ?", campus.Code).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			if err := f.db.Create(&campus).Error; err != nil {
				return err
			}
		}
	}

	// Load faculties
	faculties := []models.Faculty{
		{ID: 1, Name: "Faculty of Engineering", Code: "ENG", CampusID: 1},
		{ID: 2, Name: "Faculty of Science", Code: "SCI", CampusID: 1},
		{ID: 3, Name: "Faculty of Business", Code: "BUS", CampusID: 2},
	}

	for _, faculty := range faculties {
		var existing models.Faculty
		err := f.db.Where("code = ?", faculty.Code).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			if err := f.db.Create(&faculty).Error; err != nil {
				return err
			}
		}
	}

	// Load programs
	programs := []models.Program{
		{ID: 1, Name: "Computer Engineering", Code: "CPE", FacultyID: 1},
		{ID: 2, Name: "Software Engineering", Code: "SWE", FacultyID: 1},
		{ID: 3, Name: "Computer Science", Code: "CS", FacultyID: 2},
		{ID: 4, Name: "Business Administration", Code: "BA", FacultyID: 3},
	}

	for _, program := range programs {
		var existing models.Program
		err := f.db.Where("code = ?", program.Code).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			if err := f.db.Create(&program).Error; err != nil {
				return err
			}
		}
	}

	// Load majors
	majors := []models.Major{
		{ID: 1, Name: "Computer Engineering", Code: "CPE", ProgramID: 1},
		{ID: 2, Name: "Software Engineering", Code: "SWE", ProgramID: 2},
		{ID: 3, Name: "Computer Science", Code: "CS", ProgramID: 3},
		{ID: 4, Name: "Information Systems", Code: "IS", ProgramID: 3},
		{ID: 5, Name: "Business Administration", Code: "BA", ProgramID: 4},
	}

	for _, major := range majors {
		var existing models.Major
		err := f.db.Where("code = ?", major.Code).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			if err := f.db.Create(&major).Error; err != nil {
				return err
			}
		}
	}

	// Load curriculums
	curriculums := []models.Curriculum{
		{ID: 1, Name: "CPE 2566", Code: "CPE2566", Year: 2566, MajorID: 1},
		{ID: 2, Name: "SWE 2566", Code: "SWE2566", Year: 2566, MajorID: 2},
		{ID: 3, Name: "CS 2566", Code: "CS2566", Year: 2566, MajorID: 3},
	}

	for _, curriculum := range curriculums {
		var existing models.Curriculum
		err := f.db.Where("code = ?", curriculum.Code).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			if err := f.db.Create(&curriculum).Error; err != nil {
				return err
			}
		}
	}

	return nil
}

// LoadCompanies loads test companies
func (f *DatabaseFixtures) LoadCompanies() error {
	companies := []models.Company{
		{
			ID:          1,
			Name:        "Tech Solutions Ltd.",
			Code:        "TECH001",
			Address:     stringPtr("123 Tech Street, Bangkok"),
			Phone:       stringPtr("02-123-4567"),
			Email:       stringPtr("contact@techsolutions.com"),
			Website:     stringPtr("https://techsolutions.com"),
			Description: stringPtr("Leading technology solutions provider"),
		},
		{
			ID:          2,
			Name:        "Digital Innovation Co.",
			Code:        "DIG001",
			Address:     stringPtr("456 Innovation Ave, Bangkok"),
			Phone:       stringPtr("02-234-5678"),
			Email:       stringPtr("info@digitalinnovation.com"),
			Website:     stringPtr("https://digitalinnovation.com"),
			Description: stringPtr("Digital transformation specialists"),
		},
		{
			ID:          3,
			Name:        "Software Development Inc.",
			Code:        "SOFT001",
			Address:     stringPtr("789 Software Blvd, Bangkok"),
			Phone:       stringPtr("02-345-6789"),
			Email:       stringPtr("hr@softwaredev.com"),
			Website:     stringPtr("https://softwaredev.com"),
			Description: stringPtr("Custom software development company"),
		},
	}

	for _, company := range companies {
		var existing models.Company
		err := f.db.Where("code = ?", company.Code).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			if err := f.db.Create(&company).Error; err != nil {
				return err
			}
		}
	}
	return nil
}

// LoadUsers loads test users
func (f *DatabaseFixtures) LoadUsers() error {
	hashedPassword, _ := services.HashPassword("password123")

	users := []models.User{
		{
			ID:       1,
			FullName: stringPtr("System Administrator"),
			Email:    "admin@university.edu",
			Password: hashedPassword,
			RoleID:   1,
			IsActive: boolPtr(true),
		},
		{
			ID:       2,
			FullName: stringPtr("John Doe"),
			Email:    "john.doe@student.university.edu",
			Password: hashedPassword,
			RoleID:   2,
			IsActive: boolPtr(true),
		},
		{
			ID:       3,
			FullName: stringPtr("Jane Smith"),
			Email:    "jane.smith@student.university.edu",
			Password: hashedPassword,
			RoleID:   2,
			IsActive: boolPtr(true),
		},
		{
			ID:       4,
			FullName: stringPtr("Dr. Robert Johnson"),
			Email:    "robert.johnson@university.edu",
			Password: hashedPassword,
			RoleID:   3,
			IsActive: boolPtr(true),
		},
		{
			ID:       5,
			FullName: stringPtr("Prof. Sarah Wilson"),
			Email:    "sarah.wilson@university.edu",
			Password: hashedPassword,
			RoleID:   3,
			IsActive: boolPtr(true),
		},
		{
			ID:       6,
			FullName: stringPtr("Staff Member"),
			Email:    "staff@university.edu",
			Password: hashedPassword,
			RoleID:   4,
			IsActive: boolPtr(true),
		},
	}

	for _, user := range users {
		var existing models.User
		err := f.db.Where("email = ?", user.Email).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			if err := f.db.Create(&user).Error; err != nil {
				return err
			}
		}
	}
	return nil
}

// LoadStudents loads test students
func (f *DatabaseFixtures) LoadStudents() error {
	students := []models.Student{
		{
			ID:        1,
			UserID:    2,
			StudentID: "6401001",
			MajorID:   1,
			Year:      uintPtr(4),
			GPA:       floatPtr(3.25),
		},
		{
			ID:        2,
			UserID:    3,
			StudentID: "6401002",
			MajorID:   2,
			Year:      uintPtr(4),
			GPA:       floatPtr(3.75),
		},
	}

	for _, student := range students {
		var existing models.Student
		err := f.db.Where("student_id = ?", student.StudentID).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			if err := f.db.Create(&student).Error; err != nil {
				return err
			}
		}
	}
	return nil
}

// LoadInstructors loads test instructors
func (f *DatabaseFixtures) LoadInstructors() error {
	instructors := []models.Instructor{
		{
			ID:           1,
			UserID:       4,
			InstructorID: "INS001",
			FacultyID:    1,
			Position:     stringPtr("Assistant Professor"),
			Specialization: stringPtr("Software Engineering"),
		},
		{
			ID:           2,
			UserID:       5,
			InstructorID: "INS002",
			FacultyID:    1,
			Position:     stringPtr("Associate Professor"),
			Specialization: stringPtr("Computer Networks"),
		},
	}

	for _, instructor := range instructors {
		var existing models.Instructor
		err := f.db.Where("instructor_id = ?", instructor.InstructorID).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			if err := f.db.Create(&instructor).Error; err != nil {
				return err
			}
		}
	}
	return nil
}

// LoadCourses loads test courses
func (f *DatabaseFixtures) LoadCourses() error {
	courses := []models.Course{
		{
			ID:          1,
			Name:        "Software Engineering",
			Code:        "CPE401",
			Credits:     uintPtr(3),
			Description: stringPtr("Introduction to software engineering principles"),
		},
		{
			ID:          2,
			Name:        "Database Systems",
			Code:        "CPE402",
			Credits:     uintPtr(3),
			Description: stringPtr("Database design and implementation"),
		},
		{
			ID:          3,
			Name:        "Web Development",
			Code:        "CPE403",
			Credits:     uintPtr(3),
			Description: stringPtr("Modern web development technologies"),
		},
	}

	for _, course := range courses {
		var existing models.Course
		err := f.db.Where("code = ?", course.Code).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			if err := f.db.Create(&course).Error; err != nil {
				return err
			}
		}
	}
	return nil
}

// CleanupAllData removes all test data
func (f *DatabaseFixtures) CleanupAllData() error {
	// Clean up in reverse order of dependencies
	tables := []interface{}{
		&models.VisitsPictures{},
		&models.CompanyPictures{},
		&models.StudentEvaluateCompany{},
		&models.VisitorEvaluateCompany{},
		&models.VisitorEvaluateStudent{},
		&models.VisitorSchedule{},
		&models.VisitorTraining{},
		&models.Visitor{},
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
		&models.Curriculum{},
		&models.Major{},
		&models.Program{},
		&models.Faculty{},
		&models.Campus{},
		&models.Company{},
		&models.Permission{},
		&models.Role{},
		&models.InternshipApproval{},
		&models.EvaluationStatus{},
	}

	for _, table := range tables {
		if err := f.db.Where("1 = 1").Delete(table).Error; err != nil {
			return err
		}
	}
	return nil
}

// CleanupTestData removes only test-specific data (emails containing 'test' or 'temp')
func (f *DatabaseFixtures) CleanupTestData() error {
	// Clean up test users and related data
	f.db.Where("email LIKE ?", "%test%").Delete(&models.User{})
	f.db.Where("email LIKE ?", "%temp%").Delete(&models.User{})
	
	// Clean up test students
	f.db.Where("student_id LIKE ?", "TEST%").Delete(&models.Student{})
	
	// Clean up test instructors
	f.db.Where("instructor_id LIKE ?", "TEST%").Delete(&models.Instructor{})
	
	// Clean up test courses
	f.db.Where("code LIKE ?", "TEST%").Delete(&models.Course{})
	
	return nil
}

// Helper functions
func stringPtr(s string) *string {
	return &s
}

func boolPtr(b bool) *bool {
	return &b
}

func uintPtr(u uint) *uint {
	return &u
}

func floatPtr(f float64) *float64 {
	return &f
}