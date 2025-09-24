package handlers

import (
	"strconv"

	"backend-go/internal/services"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

// StudentHandler handles student management HTTP requests
type StudentHandler struct {
	studentService *services.StudentService
	validator      *validator.Validate
}

// NewStudentHandler creates a new student handler instance
func NewStudentHandler(studentService *services.StudentService) *StudentHandler {
	return &StudentHandler{
		studentService: studentService,
		validator:      validator.New(),
	}
}

// GetValidator returns the validator instance (for testing purposes)
func (h *StudentHandler) GetValidator() *validator.Validate {
	return h.validator
}

// GetStudents handles student listing requests with pagination, search, and filtering
// GET /api/v1/students
func (h *StudentHandler) GetStudents(c *fiber.Ctx) error {
	// Parse query parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	search := c.Query("search", "")
	sortBy := c.Query("sort_by", "")
	sortDesc := c.Query("sort_desc", "false") == "true"

	var majorID *uint
	if majorIDStr := c.Query("major_id"); majorIDStr != "" {
		if id, err := strconv.ParseUint(majorIDStr, 10, 32); err == nil {
			majorIDUint := uint(id)
			majorID = &majorIDUint
		}
	}

	var programID *uint
	if programIDStr := c.Query("program_id"); programIDStr != "" {
		if id, err := strconv.ParseUint(programIDStr, 10, 32); err == nil {
			programIDUint := uint(id)
			programID = &programIDUint
		}
	}

	var facultyID *uint
	if facultyIDStr := c.Query("faculty_id"); facultyIDStr != "" {
		if id, err := strconv.ParseUint(facultyIDStr, 10, 32); err == nil {
			facultyIDUint := uint(id)
			facultyID = &facultyIDUint
		}
	}

	var campusID *uint
	if campusIDStr := c.Query("campus_id"); campusIDStr != "" {
		if id, err := strconv.ParseUint(campusIDStr, 10, 32); err == nil {
			campusIDUint := uint(id)
			campusID = &campusIDUint
		}
	}

	req := services.StudentListRequest{
		Page:      page,
		Limit:     limit,
		Search:    search,
		MajorID:   majorID,
		ProgramID: programID,
		FacultyID: facultyID,
		CampusID:  campusID,
		SortBy:    sortBy,
		SortDesc:  sortDesc,
	}

	response, err := h.studentService.GetStudents(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch students",
			"code":  "FETCH_STUDENTS_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Students retrieved successfully",
		"data":    response,
	})
}

// GetStudent handles single student retrieval requests
// GET /api/v1/students/:id
func (h *StudentHandler) GetStudent(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid student ID",
			"code":  "INVALID_STUDENT_ID",
		})
	}

	student, err := h.studentService.GetStudentByID(uint(id))
	if err != nil {
		if err.Error() == "student not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Student not found",
				"code":  "STUDENT_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch student",
			"code":  "FETCH_STUDENT_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Student retrieved successfully",
		"data":    student,
	})
}

// CreateStudent handles student creation requests
// POST /api/v1/students
func (h *StudentHandler) CreateStudent(c *fiber.Ctx) error {
	var req services.CreateStudentRequest

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

	student, err := h.studentService.CreateStudent(req)
	if err != nil {
		switch err.Error() {
		case "user not found":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "User not found",
				"code":  "USER_NOT_FOUND",
			})
		case "student with this student ID already exists":
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Student with this student ID already exists",
				"code":  "STUDENT_ID_EXISTS",
			})
		case "user is already a student":
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "User is already a student",
				"code":  "USER_ALREADY_STUDENT",
			})
		case "invalid campus":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid campus specified",
				"code":  "INVALID_CAMPUS",
			})
		case "invalid major":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid major specified",
				"code":  "INVALID_MAJOR",
			})
		case "invalid program":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid program specified",
				"code":  "INVALID_PROGRAM",
			})
		case "invalid curriculum":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid curriculum specified",
				"code":  "INVALID_CURRICULUM",
			})
		case "invalid faculty":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid faculty specified",
				"code":  "INVALID_FACULTY",
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to create student",
				"code":  "CREATE_STUDENT_ERROR",
			})
		}
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Student created successfully",
		"data":    student,
	})
}

// UpdateStudent handles student update requests
// PUT /api/v1/students/:id
func (h *StudentHandler) UpdateStudent(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid student ID",
			"code":  "INVALID_STUDENT_ID",
		})
	}

	var req services.UpdateStudentRequest

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

	student, err := h.studentService.UpdateStudent(uint(id), req)
	if err != nil {
		switch err.Error() {
		case "student not found":
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Student not found",
				"code":  "STUDENT_NOT_FOUND",
			})
		case "student with this student ID already exists":
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Student with this student ID already exists",
				"code":  "STUDENT_ID_EXISTS",
			})
		case "invalid campus":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid campus specified",
				"code":  "INVALID_CAMPUS",
			})
		case "invalid major":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid major specified",
				"code":  "INVALID_MAJOR",
			})
		case "invalid program":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid program specified",
				"code":  "INVALID_PROGRAM",
			})
		case "invalid curriculum":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid curriculum specified",
				"code":  "INVALID_CURRICULUM",
			})
		case "invalid faculty":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid faculty specified",
				"code":  "INVALID_FACULTY",
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to update student",
				"code":  "UPDATE_STUDENT_ERROR",
			})
		}
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Student updated successfully",
		"data":    student,
	})
}

// DeleteStudent handles student deletion requests
// DELETE /api/v1/students/:id
func (h *StudentHandler) DeleteStudent(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid student ID",
			"code":  "INVALID_STUDENT_ID",
		})
	}

	err = h.studentService.DeleteStudent(uint(id))
	if err != nil {
		if err.Error() == "student not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Student not found",
				"code":  "STUDENT_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete student",
			"code":  "DELETE_STUDENT_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Student deleted successfully",
	})
}

// EnrollStudent handles student enrollment requests
// POST /api/v1/students/enroll
func (h *StudentHandler) EnrollStudent(c *fiber.Ctx) error {
	var req services.StudentEnrollmentRequest

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

	enrollment, err := h.studentService.EnrollStudent(req)
	if err != nil {
		switch err.Error() {
		case "student not found":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Student not found",
				"code":  "STUDENT_NOT_FOUND",
			})
		case "course section not found":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Course section not found",
				"code":  "COURSE_SECTION_NOT_FOUND",
			})
		case "student is already enrolled in this course section":
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "Student is already enrolled in this course section",
				"code":  "ALREADY_ENROLLED",
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Failed to enroll student",
				"code":  "ENROLL_STUDENT_ERROR",
			})
		}
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "Student enrolled successfully",
		"data":    enrollment,
	})
}

// UpdateEnrollment handles enrollment update requests
// PUT /api/v1/students/enrollments/:id
func (h *StudentHandler) UpdateEnrollment(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid enrollment ID",
			"code":  "INVALID_ENROLLMENT_ID",
		})
	}

	var req services.UpdateEnrollmentRequest

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

	enrollment, err := h.studentService.UpdateEnrollment(uint(id), req)
	if err != nil {
		if err.Error() == "enrollment not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Enrollment not found",
				"code":  "ENROLLMENT_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update enrollment",
			"code":  "UPDATE_ENROLLMENT_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Enrollment updated successfully",
		"data":    enrollment,
	})
}

// GetStudentEnrollments handles requests to get all enrollments for a student
// GET /api/v1/students/:id/enrollments
func (h *StudentHandler) GetStudentEnrollments(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid student ID",
			"code":  "INVALID_STUDENT_ID",
		})
	}

	enrollments, err := h.studentService.GetStudentEnrollments(uint(id))
	if err != nil {
		if err.Error() == "student not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "Student not found",
				"code":  "STUDENT_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch student enrollments",
			"code":  "FETCH_ENROLLMENTS_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Student enrollments retrieved successfully",
		"data":    enrollments,
	})
}

// GetStudentStats handles student statistics requests
// GET /api/v1/students/stats
func (h *StudentHandler) GetStudentStats(c *fiber.Ctx) error {
	stats, err := h.studentService.GetStudentStats()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch student statistics",
			"code":  "STATS_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Student statistics retrieved successfully",
		"data":    stats,
	})
}