package services

import (
	"errors"

	"backend-go/internal/models"
	"gorm.io/gorm"
)

// CourseService handles course-related business logic
type CourseService struct {
	db *gorm.DB
}

// NewCourseService creates a new course service instance
func NewCourseService(db *gorm.DB) *CourseService {
	return &CourseService{db: db}
}

// GetCourses retrieves courses with pagination, search, and filtering
func (s *CourseService) GetCourses(page, limit int, search string, curriculumID *uint) ([]models.Course, int64, error) {
	var courses []models.Course
	var total int64

	query := s.db.Model(&models.Course{}).Preload("Curriculum").Preload("Sections")

	// Apply search filter
	if search != "" {
		query = query.Where("code LIKE ? OR name LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	// Apply curriculum filter
	if curriculumID != nil {
		query = query.Where("curriculum_id = ?", *curriculumID)
	}

	// Count total records
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination
	offset := (page - 1) * limit
	if err := query.Offset(offset).Limit(limit).Find(&courses).Error; err != nil {
		return nil, 0, err
	}

	return courses, total, nil
}

// GetCourseByID retrieves a course by ID with relationships
func (s *CourseService) GetCourseByID(id uint) (*models.Course, error) {
	var course models.Course
	err := s.db.Preload("Curriculum").Preload("Sections").First(&course, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("course not found")
		}
		return nil, err
	}
	return &course, nil
}

// CreateCourse creates a new course
func (s *CourseService) CreateCourse(course *models.Course) error {
	// Check if curriculum exists
	var curriculum models.Curriculum
	if err := s.db.First(&curriculum, course.CurriculumID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("curriculum not found")
		}
		return err
	}

	// Check if course code already exists
	var existingCourse models.Course
	if err := s.db.Where("code = ?", course.Code).First(&existingCourse).Error; err == nil {
		return errors.New("course code already exists")
	}

	return s.db.Create(course).Error
}

// UpdateCourse updates an existing course
func (s *CourseService) UpdateCourse(id uint, updates *models.Course) error {
	var course models.Course
	if err := s.db.First(&course, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("course not found")
		}
		return err
	}

	// Check if curriculum exists if being updated
	if updates.CurriculumID != 0 && updates.CurriculumID != course.CurriculumID {
		var curriculum models.Curriculum
		if err := s.db.First(&curriculum, updates.CurriculumID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("curriculum not found")
			}
			return err
		}
	}

	// Check if course code already exists (excluding current course)
	if updates.Code != "" && updates.Code != course.Code {
		var existingCourse models.Course
		if err := s.db.Where("code = ? AND id != ?", updates.Code, id).First(&existingCourse).Error; err == nil {
			return errors.New("course code already exists")
		}
	}

	return s.db.Model(&course).Updates(updates).Error
}

// DeleteCourse deletes a course
func (s *CourseService) DeleteCourse(id uint) error {
	var course models.Course
	if err := s.db.First(&course, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("course not found")
		}
		return err
	}

	return s.db.Delete(&course).Error
}

// GetCourseSections retrieves course sections with pagination and filtering
func (s *CourseService) GetCourseSections(page, limit int, courseID *uint, semester string, year *int) ([]models.CourseSection, int64, error) {
	var sections []models.CourseSection
	var total int64

	query := s.db.Model(&models.CourseSection{}).
		Preload("Course").
		Preload("StudentEnrolls").
		Preload("CourseInstructors.Instructor.User").
		Preload("CourseCommittees.Instructor.User")

	// Apply filters
	if courseID != nil {
		query = query.Where("course_id = ?", *courseID)
	}
	if semester != "" {
		query = query.Where("semester = ?", semester)
	}
	if year != nil {
		query = query.Where("year = ?", *year)
	}

	// Count total records
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination
	offset := (page - 1) * limit
	if err := query.Offset(offset).Limit(limit).Find(&sections).Error; err != nil {
		return nil, 0, err
	}

	return sections, total, nil
}

// GetCourseSectionByID retrieves a course section by ID with relationships
func (s *CourseService) GetCourseSectionByID(id uint) (*models.CourseSection, error) {
	var section models.CourseSection
	err := s.db.Preload("Course").
		Preload("StudentEnrolls.Student.User").
		Preload("CourseInstructors.Instructor.User").
		Preload("CourseCommittees.Instructor.User").
		First(&section, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("course section not found")
		}
		return nil, err
	}
	return &section, nil
}

// CreateCourseSection creates a new course section
func (s *CourseService) CreateCourseSection(section *models.CourseSection) error {
	// Check if course exists
	var course models.Course
	if err := s.db.First(&course, section.CourseID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("course not found")
		}
		return err
	}

	// Check if section already exists for the same course, semester, and year
	var existingSection models.CourseSection
	if err := s.db.Where("course_id = ? AND section = ? AND semester = ? AND year = ?",
		section.CourseID, section.Section, section.Semester, section.Year).
		First(&existingSection).Error; err == nil {
		return errors.New("course section already exists for this course, semester, and year")
	}

	return s.db.Create(section).Error
}

// UpdateCourseSection updates an existing course section
func (s *CourseService) UpdateCourseSection(id uint, updates *models.CourseSection) error {
	var section models.CourseSection
	if err := s.db.First(&section, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("course section not found")
		}
		return err
	}

	// Check if course exists if being updated
	if updates.CourseID != 0 && updates.CourseID != section.CourseID {
		var course models.Course
		if err := s.db.First(&course, updates.CourseID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("course not found")
			}
			return err
		}
	}

	return s.db.Model(&section).Updates(updates).Error
}

// DeleteCourseSection deletes a course section
func (s *CourseService) DeleteCourseSection(id uint) error {
	var section models.CourseSection
	if err := s.db.First(&section, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("course section not found")
		}
		return err
	}

	return s.db.Delete(&section).Error
}

// AssignInstructorToCourse assigns an instructor to a course section
func (s *CourseService) AssignInstructorToCourse(instructorID, courseSectionID uint, role string) error {
	// Check if instructor exists
	var instructor models.Instructor
	if err := s.db.First(&instructor, instructorID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("instructor not found")
		}
		return err
	}

	// Check if course section exists
	var section models.CourseSection
	if err := s.db.First(&section, courseSectionID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("course section not found")
		}
		return err
	}

	// Check if assignment already exists
	var existingAssignment models.CourseInstructor
	if err := s.db.Where("instructor_id = ? AND course_section_id = ?", instructorID, courseSectionID).
		First(&existingAssignment).Error; err == nil {
		return errors.New("instructor already assigned to this course section")
	}

	assignment := &models.CourseInstructor{
		InstructorID:    instructorID,
		CourseSectionID: courseSectionID,
		Role:            role,
	}

	return s.db.Create(assignment).Error
}

// RemoveInstructorFromCourse removes an instructor assignment from a course section
func (s *CourseService) RemoveInstructorFromCourse(assignmentID uint) error {
	var assignment models.CourseInstructor
	if err := s.db.First(&assignment, assignmentID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("instructor assignment not found")
		}
		return err
	}

	return s.db.Delete(&assignment).Error
}

// UpdateInstructorAssignment updates an instructor's role in a course section
func (s *CourseService) UpdateInstructorAssignment(assignmentID uint, role string) error {
	var assignment models.CourseInstructor
	if err := s.db.First(&assignment, assignmentID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("instructor assignment not found")
		}
		return err
	}

	return s.db.Model(&assignment).Update("role", role).Error
}

// AssignCommitteeMember assigns an instructor as a committee member to a course section
func (s *CourseService) AssignCommitteeMember(instructorID, courseSectionID uint, role string) error {
	// Check if instructor exists
	var instructor models.Instructor
	if err := s.db.First(&instructor, instructorID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("instructor not found")
		}
		return err
	}

	// Check if course section exists
	var section models.CourseSection
	if err := s.db.First(&section, courseSectionID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("course section not found")
		}
		return err
	}

	// Check if committee assignment already exists
	var existingAssignment models.CourseCommittee
	if err := s.db.Where("instructor_id = ? AND course_section_id = ?", instructorID, courseSectionID).
		First(&existingAssignment).Error; err == nil {
		return errors.New("instructor already assigned as committee member to this course section")
	}

	assignment := &models.CourseCommittee{
		InstructorID:    instructorID,
		CourseSectionID: courseSectionID,
		Role:            role,
	}

	return s.db.Create(assignment).Error
}

// RemoveCommitteeMember removes a committee member assignment from a course section
func (s *CourseService) RemoveCommitteeMember(assignmentID uint) error {
	var assignment models.CourseCommittee
	if err := s.db.First(&assignment, assignmentID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("committee assignment not found")
		}
		return err
	}

	return s.db.Delete(&assignment).Error
}

// UpdateCommitteeAssignment updates a committee member's role in a course section
func (s *CourseService) UpdateCommitteeAssignment(assignmentID uint, role string) error {
	var assignment models.CourseCommittee
	if err := s.db.First(&assignment, assignmentID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("committee assignment not found")
		}
		return err
	}

	return s.db.Model(&assignment).Update("role", role).Error
}

// UpdateStudentEnrollmentStatus updates a student's enrollment status
func (s *CourseService) UpdateStudentEnrollmentStatus(enrollmentID uint, status string, grade *string, gradePoints *float64) error {
	var enrollment models.StudentEnroll
	if err := s.db.First(&enrollment, enrollmentID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("student enrollment not found")
		}
		return err
	}

	updates := map[string]interface{}{
		"status": status,
	}

	if grade != nil {
		updates["grade"] = *grade
	}
	if gradePoints != nil {
		updates["grade_points"] = *gradePoints
	}

	return s.db.Model(&enrollment).Updates(updates).Error
}

// GetStudentEnrollmentStatuses retrieves student enrollment statuses with pagination and filtering
func (s *CourseService) GetStudentEnrollmentStatuses(page, limit int, studentID *uint, semester string, year *int) ([]models.StudentEnrollStatus, int64, error) {
	var statuses []models.StudentEnrollStatus
	var total int64

	query := s.db.Model(&models.StudentEnrollStatus{}).
		Preload("Student.User").
		Preload("Instructor.User")

	// Apply filters
	if studentID != nil {
		query = query.Where("student_id = ?", *studentID)
	}
	if semester != "" {
		query = query.Where("semester = ?", semester)
	}
	if year != nil {
		query = query.Where("year = ?", *year)
	}

	// Count total records
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination
	offset := (page - 1) * limit
	if err := query.Offset(offset).Limit(limit).Find(&statuses).Error; err != nil {
		return nil, 0, err
	}

	return statuses, total, nil
}

// CreateStudentEnrollmentStatus creates a new student enrollment status
func (s *CourseService) CreateStudentEnrollmentStatus(status *models.StudentEnrollStatus) error {
	// Check if student exists
	var student models.Student
	if err := s.db.First(&student, status.StudentID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("student not found")
		}
		return err
	}

	// Check if instructor exists (if provided)
	if status.InstructorID != nil {
		var instructor models.Instructor
		if err := s.db.First(&instructor, *status.InstructorID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("instructor not found")
			}
			return err
		}
	}

	// Check if status already exists for the same student, semester, and year
	var existingStatus models.StudentEnrollStatus
	if err := s.db.Where("student_id = ? AND semester = ? AND year = ?",
		status.StudentID, status.Semester, status.Year).
		First(&existingStatus).Error; err == nil {
		return errors.New("enrollment status already exists for this student, semester, and year")
	}

	return s.db.Create(status).Error
}

// UpdateStudentEnrollmentStatusRecord updates an existing student enrollment status record
func (s *CourseService) UpdateStudentEnrollmentStatusRecord(id uint, updates *models.StudentEnrollStatus) error {
	var status models.StudentEnrollStatus
	if err := s.db.First(&status, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("enrollment status not found")
		}
		return err
	}

	// Check if student exists if being updated
	if updates.StudentID != 0 && updates.StudentID != status.StudentID {
		var student models.Student
		if err := s.db.First(&student, updates.StudentID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("student not found")
			}
			return err
		}
	}

	// Check if instructor exists if being updated
	if updates.InstructorID != nil && (status.InstructorID == nil || *updates.InstructorID != *status.InstructorID) {
		var instructor models.Instructor
		if err := s.db.First(&instructor, *updates.InstructorID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errors.New("instructor not found")
			}
			return err
		}
	}

	return s.db.Model(&status).Updates(updates).Error
}
