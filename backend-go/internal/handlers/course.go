package handlers

import (
	"strconv"

	"backend-go/internal/models"
	"backend-go/internal/services"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

// CourseHandler handles course management HTTP requests
type CourseHandler struct {
	courseService *services.CourseService
	validator     *validator.Validate
}

// NewCourseHandler creates a new course handler instance
func NewCourseHandler(courseService *services.CourseService) *CourseHandler {
	return &CourseHandler{
		courseService: courseService,
		validator:     validator.New(),
	}
}

// GetValidator returns the validator instance (for testing purposes)
func (h *CourseHandler) GetValidator() *validator.Validate {
	return h.validator
}

// Course request/response structures
type CreateCourseRequest struct {
	CurriculumID  uint   `json:"curriculum_id" validate:"required"`
	Code          string `json:"code" validate:"required,min=3,max=20"`
	Name          string `json:"name" validate:"required,min=3,max=255"`
	Credits       int    `json:"credits" validate:"required,min=1,max=10"`
	Description   string `json:"description"`
	Prerequisites string `json:"prerequisites"`
}

type UpdateCourseRequest struct {
	CurriculumID  uint   `json:"curriculum_id"`
	Code          string `json:"code" validate:"omitempty,min=3,max=20"`
	Name          string `json:"name" validate:"omitempty,min=3,max=255"`
	Credits       int    `json:"credits" validate:"omitempty,min=1,max=10"`
	Description   string `json:"description"`
	Prerequisites string `json:"prerequisites"`
}

type CreateCourseSectionRequest struct {
	CourseID    uint   `json:"course_id" validate:"required"`
	Section     string `json:"section" validate:"required,min=1,max=10"`
	Semester    string `json:"semester" validate:"required,oneof=1 2 3"`
	Year        int    `json:"year" validate:"required,min=2020,max=2030"`
	MaxStudents int    `json:"max_students" validate:"omitempty,min=1,max=200"`
	Schedule    string `json:"schedule"`
}

type UpdateCourseSectionRequest struct {
	CourseID    uint   `json:"course_id"`
	Section     string `json:"section" validate:"omitempty,min=1,max=10"`
	Semester    string `json:"semester" validate:"omitempty,oneof=1 2 3"`
	Year        int    `json:"year" validate:"omitempty,min=2020,max=2030"`
	MaxStudents int    `json:"max_students" validate:"omitempty,min=1,max=200"`
	Schedule    string `json:"schedule"`
}

type AssignInstructorRequest struct {
	InstructorID    uint   `json:"instructor_id" validate:"required"`
	CourseSectionID uint   `json:"course_section_id" validate:"required"`
	Role            string `json:"role" validate:"required,oneof=instructor assistant coordinator"`
}

type AssignCommitteeRequest struct {
	InstructorID    uint   `json:"instructor_id" validate:"required"`
	CourseSectionID uint   `json:"course_section_id" validate:"required"`
	Role            string `json:"role" validate:"required,oneof=chair member secretary"`
}

type UpdateEnrollmentStatusRequest struct {
	Status      string   `json:"status" validate:"required,oneof=enrolled dropped completed"`
	Grade       *string  `json:"grade"`
	GradePoints *float64 `json:"grade_points" validate:"omitempty,min=0,max=4"`
}

type CreateEnrollmentStatusRequest struct {
	StudentID    uint     `json:"student_id" validate:"required"`
	Semester     string   `json:"semester" validate:"required,oneof=1 2 3"`
	Year         int      `json:"year" validate:"required,min=2020,max=2030"`
	Status       string   `json:"status" validate:"required,oneof=active inactive graduated dropped"`
	GPA          *float64 `json:"gpa" validate:"omitempty,min=0,max=4"`
	Credits      int      `json:"credits" validate:"omitempty,min=0"`
	InstructorID *uint    `json:"instructor_id"`
}

type UpdateEnrollmentStatusRecordRequest struct {
	StudentID    uint     `json:"student_id"`
	Semester     string   `json:"semester" validate:"omitempty,oneof=1 2 3"`
	Year         int      `json:"year" validate:"omitempty,min=2020,max=2030"`
	Status       string   `json:"status" validate:"omitempty,oneof=active inactive graduated dropped"`
	GPA          *float64 `json:"gpa" validate:"omitempty,min=0,max=4"`
	Credits      int      `json:"credits" validate:"omitempty,min=0"`
	InstructorID *uint    `json:"instructor_id"`
}

// GetCourses handles course listing requests with pagination, search, and filtering
// GET /api/v1/courses
func (h *CourseHandler) GetCourses(c *fiber.Ctx) error {
	// Parse query parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	search := c.Query("search", "")

	var curriculumID *uint
	if curriculumIDStr := c.Query("curriculum_id"); curriculumIDStr != "" {
		if id, err := strconv.ParseUint(curriculumIDStr, 10, 32); err == nil {
			curriculumIDUint := uint(id)
			curriculumID = &curriculumIDUint
		}
	}

	// Validate pagination parameters
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	courses, total, err := h.courseService.GetCourses(page, limit, search, curriculumID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve courses",
		})
	}

	return c.JSON(fiber.Map{
		"data": courses,
		"pagination": fiber.Map{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

// GetCourse handles single course retrieval requests
// GET /api/v1/courses/:id
func (h *CourseHandler) GetCourse(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid course ID",
		})
	}

	course, err := h.courseService.GetCourseByID(uint(id))
	if err != nil {
		if err.Error() == "course not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Course not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve course",
		})
	}

	return c.JSON(fiber.Map{
		"data": course,
	})
}

// CreateCourse handles course creation requests
// POST /api/v1/courses
func (h *CourseHandler) CreateCourse(c *fiber.Ctx) error {
	var req CreateCourseRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if err := h.validator.Struct(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Validation failed",
			"details": err.Error(),
		})
	}

	course := &models.Course{
		CurriculumID:  req.CurriculumID,
		Code:          req.Code,
		Name:          req.Name,
		Credits:       req.Credits,
		Description:   req.Description,
		Prerequisites: req.Prerequisites,
	}

	if err := h.courseService.CreateCourse(course); err != nil {
		if err.Error() == "curriculum not found" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Curriculum not found",
			})
		}
		if err.Error() == "course code already exists" {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Course code already exists",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create course",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Course created successfully",
		"data":    course,
	})
}

// UpdateCourse handles course update requests
// PUT /api/v1/courses/:id
func (h *CourseHandler) UpdateCourse(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid course ID",
		})
	}

	var req UpdateCourseRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if err := h.validator.Struct(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Validation failed",
			"details": err.Error(),
		})
	}

	updates := &models.Course{
		CurriculumID:  req.CurriculumID,
		Code:          req.Code,
		Name:          req.Name,
		Credits:       req.Credits,
		Description:   req.Description,
		Prerequisites: req.Prerequisites,
	}

	if err := h.courseService.UpdateCourse(uint(id), updates); err != nil {
		if err.Error() == "course not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Course not found",
			})
		}
		if err.Error() == "curriculum not found" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Curriculum not found",
			})
		}
		if err.Error() == "course code already exists" {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Course code already exists",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update course",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Course updated successfully",
	})
}

// DeleteCourse handles course deletion requests
// DELETE /api/v1/courses/:id
func (h *CourseHandler) DeleteCourse(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid course ID",
		})
	}

	if err := h.courseService.DeleteCourse(uint(id)); err != nil {
		if err.Error() == "course not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Course not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete course",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Course deleted successfully",
	})
}

// GetCourseSections handles course section listing requests with pagination and filtering
// GET /api/v1/course-sections
func (h *CourseHandler) GetCourseSections(c *fiber.Ctx) error {
	// Parse query parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	semester := c.Query("semester", "")

	var courseID *uint
	if courseIDStr := c.Query("course_id"); courseIDStr != "" {
		if id, err := strconv.ParseUint(courseIDStr, 10, 32); err == nil {
			courseIDUint := uint(id)
			courseID = &courseIDUint
		}
	}

	var year *int
	if yearStr := c.Query("year"); yearStr != "" {
		if y, err := strconv.Atoi(yearStr); err == nil {
			year = &y
		}
	}

	// Validate pagination parameters
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	sections, total, err := h.courseService.GetCourseSections(page, limit, courseID, semester, year)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve course sections",
		})
	}

	return c.JSON(fiber.Map{
		"data": sections,
		"pagination": fiber.Map{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

// GetCourseSection handles single course section retrieval requests
// GET /api/v1/course-sections/:id
func (h *CourseHandler) GetCourseSection(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid course section ID",
		})
	}

	section, err := h.courseService.GetCourseSectionByID(uint(id))
	if err != nil {
		if err.Error() == "course section not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Course section not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve course section",
		})
	}

	return c.JSON(fiber.Map{
		"data": section,
	})
}

// CreateCourseSection handles course section creation requests
// POST /api/v1/course-sections
func (h *CourseHandler) CreateCourseSection(c *fiber.Ctx) error {
	var req CreateCourseSectionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if err := h.validator.Struct(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Validation failed",
			"details": err.Error(),
		})
	}

	section := &models.CourseSection{
		CourseID:    req.CourseID,
		Section:     req.Section,
		Semester:    req.Semester,
		Year:        req.Year,
		MaxStudents: req.MaxStudents,
		Schedule:    req.Schedule,
	}

	if section.MaxStudents == 0 {
		section.MaxStudents = 30 // Default value
	}

	if err := h.courseService.CreateCourseSection(section); err != nil {
		if err.Error() == "course not found" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Course not found",
			})
		}
		if err.Error() == "course section already exists for this course, semester, and year" {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Course section already exists for this course, semester, and year",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create course section",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Course section created successfully",
		"data":    section,
	})
}

// UpdateCourseSection handles course section update requests
// PUT /api/v1/course-sections/:id
func (h *CourseHandler) UpdateCourseSection(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid course section ID",
		})
	}

	var req UpdateCourseSectionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if err := h.validator.Struct(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Validation failed",
			"details": err.Error(),
		})
	}

	updates := &models.CourseSection{
		CourseID:    req.CourseID,
		Section:     req.Section,
		Semester:    req.Semester,
		Year:        req.Year,
		MaxStudents: req.MaxStudents,
		Schedule:    req.Schedule,
	}

	if err := h.courseService.UpdateCourseSection(uint(id), updates); err != nil {
		if err.Error() == "course section not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Course section not found",
			})
		}
		if err.Error() == "course not found" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Course not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update course section",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Course section updated successfully",
	})
}

// DeleteCourseSection handles course section deletion requests
// DELETE /api/v1/course-sections/:id
func (h *CourseHandler) DeleteCourseSection(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid course section ID",
		})
	}

	if err := h.courseService.DeleteCourseSection(uint(id)); err != nil {
		if err.Error() == "course section not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Course section not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete course section",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Course section deleted successfully",
	})
}

// AssignInstructorToCourse handles instructor assignment to course section requests
// POST /api/v1/courses/assign-instructor
func (h *CourseHandler) AssignInstructorToCourse(c *fiber.Ctx) error {
	var req AssignInstructorRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if err := h.validator.Struct(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Validation failed",
			"details": err.Error(),
		})
	}

	if err := h.courseService.AssignInstructorToCourse(req.InstructorID, req.CourseSectionID, req.Role); err != nil {
		if err.Error() == "instructor not found" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Instructor not found",
			})
		}
		if err.Error() == "course section not found" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Course section not found",
			})
		}
		if err.Error() == "instructor already assigned to this course section" {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Instructor already assigned to this course section",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to assign instructor to course",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Instructor assigned to course successfully",
	})
}

// RemoveInstructorFromCourse handles instructor removal from course section requests
// DELETE /api/v1/courses/instructor-assignments/:id
func (h *CourseHandler) RemoveInstructorFromCourse(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid assignment ID",
		})
	}

	if err := h.courseService.RemoveInstructorFromCourse(uint(id)); err != nil {
		if err.Error() == "instructor assignment not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Instructor assignment not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to remove instructor from course",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Instructor removed from course successfully",
	})
}

// UpdateInstructorAssignment handles instructor assignment role update requests
// PUT /api/v1/courses/instructor-assignments/:id
func (h *CourseHandler) UpdateInstructorAssignment(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid assignment ID",
		})
	}

	var req struct {
		Role string `json:"role" validate:"required,oneof=instructor assistant coordinator"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if err := h.validator.Struct(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Validation failed",
			"details": err.Error(),
		})
	}

	if err := h.courseService.UpdateInstructorAssignment(uint(id), req.Role); err != nil {
		if err.Error() == "instructor assignment not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Instructor assignment not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update instructor assignment",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Instructor assignment updated successfully",
	})
}

// AssignCommitteeMember handles committee member assignment to course section requests
// POST /api/v1/courses/assign-committee
func (h *CourseHandler) AssignCommitteeMember(c *fiber.Ctx) error {
	var req AssignCommitteeRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if err := h.validator.Struct(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Validation failed",
			"details": err.Error(),
		})
	}

	if err := h.courseService.AssignCommitteeMember(req.InstructorID, req.CourseSectionID, req.Role); err != nil {
		if err.Error() == "instructor not found" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Instructor not found",
			})
		}
		if err.Error() == "course section not found" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Course section not found",
			})
		}
		if err.Error() == "instructor already assigned as committee member to this course section" {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Instructor already assigned as committee member to this course section",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to assign committee member to course",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Committee member assigned to course successfully",
	})
}

// RemoveCommitteeMember handles committee member removal from course section requests
// DELETE /api/v1/courses/committee-assignments/:id
func (h *CourseHandler) RemoveCommitteeMember(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid assignment ID",
		})
	}

	if err := h.courseService.RemoveCommitteeMember(uint(id)); err != nil {
		if err.Error() == "committee assignment not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Committee assignment not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to remove committee member from course",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Committee member removed from course successfully",
	})
}

// UpdateCommitteeAssignment handles committee assignment role update requests
// PUT /api/v1/courses/committee-assignments/:id
func (h *CourseHandler) UpdateCommitteeAssignment(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid assignment ID",
		})
	}

	var req struct {
		Role string `json:"role" validate:"required,oneof=chair member secretary"`
	}
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if err := h.validator.Struct(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Validation failed",
			"details": err.Error(),
		})
	}

	if err := h.courseService.UpdateCommitteeAssignment(uint(id), req.Role); err != nil {
		if err.Error() == "committee assignment not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Committee assignment not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update committee assignment",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Committee assignment updated successfully",
	})
}

// UpdateStudentEnrollmentStatus handles student enrollment status update requests
// PUT /api/v1/courses/enrollments/:id
func (h *CourseHandler) UpdateStudentEnrollmentStatus(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid enrollment ID",
		})
	}

	var req UpdateEnrollmentStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if err := h.validator.Struct(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Validation failed",
			"details": err.Error(),
		})
	}

	if err := h.courseService.UpdateStudentEnrollmentStatus(uint(id), req.Status, req.Grade, req.GradePoints); err != nil {
		if err.Error() == "student enrollment not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Student enrollment not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update student enrollment status",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Student enrollment status updated successfully",
	})
}

// GetStudentEnrollmentStatuses handles student enrollment status listing requests
// GET /api/v1/student-enrollment-statuses
func (h *CourseHandler) GetStudentEnrollmentStatuses(c *fiber.Ctx) error {
	// Parse query parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	semester := c.Query("semester", "")

	var studentID *uint
	if studentIDStr := c.Query("student_id"); studentIDStr != "" {
		if id, err := strconv.ParseUint(studentIDStr, 10, 32); err == nil {
			studentIDUint := uint(id)
			studentID = &studentIDUint
		}
	}

	var year *int
	if yearStr := c.Query("year"); yearStr != "" {
		if y, err := strconv.Atoi(yearStr); err == nil {
			year = &y
		}
	}

	// Validate pagination parameters
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}

	statuses, total, err := h.courseService.GetStudentEnrollmentStatuses(page, limit, studentID, semester, year)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to retrieve student enrollment statuses",
		})
	}

	return c.JSON(fiber.Map{
		"data": statuses,
		"pagination": fiber.Map{
			"page":  page,
			"limit": limit,
			"total": total,
		},
	})
}

// CreateStudentEnrollmentStatus handles student enrollment status creation requests
// POST /api/v1/student-enrollment-statuses
func (h *CourseHandler) CreateStudentEnrollmentStatus(c *fiber.Ctx) error {
	var req CreateEnrollmentStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if err := h.validator.Struct(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Validation failed",
			"details": err.Error(),
		})
	}

	status := &models.StudentEnrollStatus{
		StudentID:    req.StudentID,
		Semester:     req.Semester,
		Year:         req.Year,
		Status:       req.Status,
		GPA:          req.GPA,
		Credits:      req.Credits,
		InstructorID: req.InstructorID,
	}

	if err := h.courseService.CreateStudentEnrollmentStatus(status); err != nil {
		if err.Error() == "student not found" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Student not found",
			})
		}
		if err.Error() == "instructor not found" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Instructor not found",
			})
		}
		if err.Error() == "enrollment status already exists for this student, semester, and year" {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Enrollment status already exists for this student, semester, and year",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create student enrollment status",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Student enrollment status created successfully",
		"data":    status,
	})
}

// UpdateStudentEnrollmentStatusRecord handles student enrollment status record update requests
// PUT /api/v1/student-enrollment-statuses/:id
func (h *CourseHandler) UpdateStudentEnrollmentStatusRecord(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid enrollment status ID",
		})
	}

	var req UpdateEnrollmentStatusRecordRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
		})
	}

	if err := h.validator.Struct(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Validation failed",
			"details": err.Error(),
		})
	}

	updates := &models.StudentEnrollStatus{
		StudentID:    req.StudentID,
		Semester:     req.Semester,
		Year:         req.Year,
		Status:       req.Status,
		GPA:          req.GPA,
		Credits:      req.Credits,
		InstructorID: req.InstructorID,
	}

	if err := h.courseService.UpdateStudentEnrollmentStatusRecord(uint(id), updates); err != nil {
		if err.Error() == "enrollment status not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Enrollment status not found",
			})
		}
		if err.Error() == "student not found" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Student not found",
			})
		}
		if err.Error() == "instructor not found" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Instructor not found",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update student enrollment status",
		})
	}

	return c.JSON(fiber.Map{
		"message": "Student enrollment status updated successfully",
	})
}