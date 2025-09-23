package handlers

import (
	"strconv"

	"backend-go/internal/services"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

// InstructorHandler handles instructor management HTTP requests
type InstructorHandler struct {
	instructorService services.InstructorServiceInterface
	validator         *validator.Validate
}

// NewInstructorHandler creates a new instructor handler instance
func NewInstructorHandler(instructorService services.InstructorServiceInterface) *InstructorHandler {
	return &InstructorHandler{
		instructorService: instructorService,
		validator:         validator.New(),
	}
}

// GetValidator returns the validator instance (for testing purposes)
func (h *InstructorHandler) GetValidator() *validator.Validate {
	return h.validator
}

// GetInstructors handles instructor listing requests with pagination, search, and filtering
// GET /api/v1/instructors
func (h *InstructorHandler) GetInstructors(c *fiber.Ctx) error {
	// Parse query parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	search := c.Query("search", "")
	sortBy := c.Query("sort_by", "")
	sortDesc := c.Query("sort_desc", "false") == "true"

	var facultyID *uint
	if facultyIDStr := c.Query("faculty_id"); facultyIDStr != "" {
		if id, err := strconv.ParseUint(facultyIDStr, 10, 32); err == nil {
			facultyIDUint := uint(id)
			facultyID = &facultyIDUint
		}
	}

	var programID *uint
	if programIDStr := c.Query("program_id"); programIDStr != "" {
		if id, err := strconv.ParseUint(programIDStr, 10, 32); err == nil {
			programIDUint := uint(id)
			programID = &programIDUint
		}
	}

	req := services.InstructorListRequest{
		Page:      page,
		Limit:     limit,
		Search:    search,
		FacultyID: facultyID,
		ProgramID: programID,
		SortBy:    sortBy,
		SortDesc:  sortDesc,
	}

	response, err := h.instructorService.GetInstructors(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch instructors",
			"code":  "FETCH_INSTRUCTORS_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Instructors retrieved successfully",
		"data":    response,
	})
}

// GetInstructor handles single instructor retrieval requests
// GET /api/v1/instructors/:id
func (h *InstructorHandler) GetInstructor(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid instructor ID",
			"code":  "INVALID_INSTRUCTOR_ID",
		})
	}

	instructor, err := h.instructorService.GetInstructorByID(uint(id))
	if err != nil {
		if err.Error() == "instructor not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Instructor not found",
				"code":  "INSTRUCTOR_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch instructor",
			"code":  "FETCH_INSTRUCTOR_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Instructor retrieved successfully",
		"data":    instructor,
	})
}

// CreateInstructor handles instructor creation requests
// POST /api/v1/instructors
func (h *InstructorHandler) CreateInstructor(c *fiber.Ctx) error {
	var req services.CreateInstructorRequest

	// Parse request body
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
			"code":  "INVALID_REQUEST_BODY",
		})
	}

	// Validate request
	if err := h.validator.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"code":    "VALIDATION_ERROR",
			"details": err.Error(),
		})
	}

	instructor, err := h.instructorService.CreateInstructor(req)
	if err != nil {
		switch err.Error() {
		case "user not found":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "User not found",
				"code":  "USER_NOT_FOUND",
			})
		case "user is already an instructor":
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "User is already an instructor",
				"code":  "USER_ALREADY_INSTRUCTOR",
			})
		case "instructor with this staff ID already exists":
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Instructor with this staff ID already exists",
				"code":  "STAFF_ID_EXISTS",
			})
		case "invalid faculty":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid faculty specified",
				"code":  "INVALID_FACULTY",
			})
		case "invalid program":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid program specified",
				"code":  "INVALID_PROGRAM",
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to create instructor",
				"code":  "CREATE_INSTRUCTOR_ERROR",
			})
		}
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Instructor created successfully",
		"data":    instructor,
	})
}

// UpdateInstructor handles instructor update requests
// PUT /api/v1/instructors/:id
func (h *InstructorHandler) UpdateInstructor(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid instructor ID",
			"code":  "INVALID_INSTRUCTOR_ID",
		})
	}

	var req services.UpdateInstructorRequest

	// Parse request body
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
			"code":  "INVALID_REQUEST_BODY",
		})
	}

	// Validate request
	if err := h.validator.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"code":    "VALIDATION_ERROR",
			"details": err.Error(),
		})
	}

	instructor, err := h.instructorService.UpdateInstructor(uint(id), req)
	if err != nil {
		switch err.Error() {
		case "instructor not found":
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Instructor not found",
				"code":  "INSTRUCTOR_NOT_FOUND",
			})
		case "instructor with this staff ID already exists":
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Instructor with this staff ID already exists",
				"code":  "STAFF_ID_EXISTS",
			})
		case "invalid faculty":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid faculty specified",
				"code":  "INVALID_FACULTY",
			})
		case "invalid program":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid program specified",
				"code":  "INVALID_PROGRAM",
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to update instructor",
				"code":  "UPDATE_INSTRUCTOR_ERROR",
			})
		}
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Instructor updated successfully",
		"data":    instructor,
	})
}

// DeleteInstructor handles instructor deletion requests
// DELETE /api/v1/instructors/:id
func (h *InstructorHandler) DeleteInstructor(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid instructor ID",
			"code":  "INVALID_INSTRUCTOR_ID",
		})
	}

	err = h.instructorService.DeleteInstructor(uint(id))
	if err != nil {
		if err.Error() == "instructor not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Instructor not found",
				"code":  "INSTRUCTOR_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete instructor",
			"code":  "DELETE_INSTRUCTOR_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Instructor deleted successfully",
	})
}

// AssignInstructorToCourse handles instructor course assignment requests
// POST /api/v1/instructors/assign-course
func (h *InstructorHandler) AssignInstructorToCourse(c *fiber.Ctx) error {
	var req services.CourseAssignmentRequest

	// Parse request body
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
			"code":  "INVALID_REQUEST_BODY",
		})
	}

	// Validate request
	if err := h.validator.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"code":    "VALIDATION_ERROR",
			"details": err.Error(),
		})
	}

	assignment, err := h.instructorService.AssignInstructorToCourse(req)
	if err != nil {
		switch err.Error() {
		case "instructor not found":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Instructor not found",
				"code":  "INSTRUCTOR_NOT_FOUND",
			})
		case "course section not found":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Course section not found",
				"code":  "COURSE_SECTION_NOT_FOUND",
			})
		case "instructor is already assigned to this course section":
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Instructor is already assigned to this course section",
				"code":  "ALREADY_ASSIGNED",
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to assign instructor to course",
				"code":  "ASSIGN_COURSE_ERROR",
			})
		}
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Instructor assigned to course successfully",
		"data":    assignment,
	})
}

// UpdateCourseAssignment handles course assignment update requests
// PUT /api/v1/instructors/course-assignments/:id
func (h *InstructorHandler) UpdateCourseAssignment(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid assignment ID",
			"code":  "INVALID_ASSIGNMENT_ID",
		})
	}

	var req services.UpdateCourseAssignmentRequest

	// Parse request body
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
			"code":  "INVALID_REQUEST_BODY",
		})
	}

	// Validate request
	if err := h.validator.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"code":    "VALIDATION_ERROR",
			"details": err.Error(),
		})
	}

	assignment, err := h.instructorService.UpdateCourseAssignment(uint(id), req)
	if err != nil {
		if err.Error() == "course assignment not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Course assignment not found",
				"code":  "ASSIGNMENT_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update course assignment",
			"code":  "UPDATE_ASSIGNMENT_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Course assignment updated successfully",
		"data":    assignment,
	})
}

// RemoveCourseAssignment handles course assignment removal requests
// DELETE /api/v1/instructors/course-assignments/:id
func (h *InstructorHandler) RemoveCourseAssignment(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid assignment ID",
			"code":  "INVALID_ASSIGNMENT_ID",
		})
	}

	err = h.instructorService.RemoveCourseAssignment(uint(id))
	if err != nil {
		if err.Error() == "course assignment not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Course assignment not found",
				"code":  "ASSIGNMENT_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to remove course assignment",
			"code":  "REMOVE_ASSIGNMENT_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Course assignment removed successfully",
	})
}

// GetInstructorCourseAssignments handles requests to get all course assignments for an instructor
// GET /api/v1/instructors/:id/course-assignments
func (h *InstructorHandler) GetInstructorCourseAssignments(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid instructor ID",
			"code":  "INVALID_INSTRUCTOR_ID",
		})
	}

	assignments, err := h.instructorService.GetInstructorCourseAssignments(uint(id))
	if err != nil {
		if err.Error() == "instructor not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Instructor not found",
				"code":  "INSTRUCTOR_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch instructor course assignments",
			"code":  "FETCH_ASSIGNMENTS_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Instructor course assignments retrieved successfully",
		"data":    assignments,
	})
}

// ManageInstructorGrade handles instructor grade management requests
// POST /api/v1/instructors/manage-grade
func (h *InstructorHandler) ManageInstructorGrade(c *fiber.Ctx) error {
	var req services.InstructorGradeRequest

	// Parse request body
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
			"code":  "INVALID_REQUEST_BODY",
		})
	}

	// Validate request
	if err := h.validator.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"code":    "VALIDATION_ERROR",
			"details": err.Error(),
		})
	}

	enrollStatus, err := h.instructorService.ManageInstructorGrade(req)
	if err != nil {
		switch err.Error() {
		case "instructor not found":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Instructor not found",
				"code":  "INSTRUCTOR_NOT_FOUND",
			})
		case "student enrollment not found":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Student enrollment not found",
				"code":  "ENROLLMENT_NOT_FOUND",
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to manage instructor grade",
				"code":  "MANAGE_GRADE_ERROR",
			})
		}
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Instructor grade managed successfully",
		"data":    enrollStatus,
	})
}

// RecordTrainingAttendance handles training attendance recording requests
// POST /api/v1/instructors/record-attendance
func (h *InstructorHandler) RecordTrainingAttendance(c *fiber.Ctx) error {
	var req services.TrainingAttendanceRequest

	// Parse request body
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
			"code":  "INVALID_REQUEST_BODY",
		})
	}

	// Validate request
	if err := h.validator.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"code":    "VALIDATION_ERROR",
			"details": err.Error(),
		})
	}

	err := h.instructorService.RecordTrainingAttendance(req)
	if err != nil {
		switch err.Error() {
		case "instructor not found":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Instructor not found",
				"code":  "INSTRUCTOR_NOT_FOUND",
			})
		case "student training not found":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Student training not found",
				"code":  "TRAINING_NOT_FOUND",
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to record training attendance",
				"code":  "RECORD_ATTENDANCE_ERROR",
			})
		}
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Training attendance recorded successfully",
	})
}

// GetInstructorStats handles instructor statistics requests
// GET /api/v1/instructors/stats
func (h *InstructorHandler) GetInstructorStats(c *fiber.Ctx) error {
	stats, err := h.instructorService.GetInstructorStats()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch instructor statistics",
			"code":  "STATS_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Instructor statistics retrieved successfully",
		"data":    stats,
	})
}