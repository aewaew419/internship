package handlers

import (
	"backend-go/internal/middleware"
	"backend-go/internal/services"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

// StudentAuthHandler handles student-specific authentication HTTP requests
type StudentAuthHandler struct {
	authService           *services.AuthService
	studentIdValidation   *services.StudentIdValidationService
	passwordSecurity      *services.PasswordSecurityService
	validator             *validator.Validate
}

// NewStudentAuthHandler creates a new student authentication handler instance
func NewStudentAuthHandler(
	authService *services.AuthService,
	studentIdValidation *services.StudentIdValidationService,
	passwordSecurity *services.PasswordSecurityService,
) *StudentAuthHandler {
	return &StudentAuthHandler{
		authService:         authService,
		studentIdValidation: studentIdValidation,
		passwordSecurity:    passwordSecurity,
		validator:           validator.New(),
	}
}

// StudentLoginRequest represents the student login request payload
type StudentLoginRequest struct {
	StudentID  string `json:"student_id" validate:"required"`
	Password   string `json:"password" validate:"required,min=6"`
	RememberMe bool   `json:"remember_me,omitempty"`
}

// StudentRegistrationRequest represents the student registration request
type StudentRegistrationRequest struct {
	StudentID       string `json:"student_id" validate:"required"`
	Email           string `json:"email" validate:"required,email"`
	Password        string `json:"password" validate:"required,min=8"`
	ConfirmPassword string `json:"confirm_password" validate:"required"`
	FullName        string `json:"full_name" validate:"required"`
}

// StudentLogin handles student login requests using student_id
// POST /api/v1/auth/student/login
func (h *StudentAuthHandler) StudentLogin(c *fiber.Ctx) error {
	var req StudentLoginRequest

	// Parse request body
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid request body",
			"code":    "INVALID_REQUEST_BODY",
			"message": "ข้อมูลที่ส่งมาไม่ถูกต้อง",
		})
	}

	// Validate request
	if err := h.validator.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Validation failed",
			"code":    "VALIDATION_ERROR",
			"message": "ข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง",
			"details": err.Error(),
		})
	}

	// Validate student ID format
	validation := h.studentIdValidation.ValidateFormat(req.StudentID)
	if !validation.IsValid {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid student ID format",
			"code":    "INVALID_STUDENT_ID_FORMAT",
			"message": "รูปแบบรหัสนักศึกษาไม่ถูกต้อง",
			"details": validation.Errors,
		})
	}

	// Create login request for auth service
	loginReq := services.StudentLoginRequest{
		StudentID: req.StudentID,
		Password:  req.Password,
	}

	// Authenticate student
	response, err := h.authService.StudentLogin(loginReq)
	if err != nil {
		switch err.Error() {
		case "invalid credentials":
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"error":   "Invalid student ID or password",
				"code":    "INVALID_CREDENTIALS",
				"message": "รหัสนักศึกษาหรือรหัสผ่านไม่ถูกต้อง",
			})
		case "user not found":
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"error":   "Student not found",
				"code":    "STUDENT_NOT_FOUND",
				"message": "ไม่พบข้อมูลนักศึกษา",
			})
		case "user inactive":
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"success": false,
				"error":   "Student account is inactive",
				"code":    "ACCOUNT_INACTIVE",
				"message": "บัญชีนักศึกษาถูกระงับการใช้งาน",
			})
		case "user suspended":
			return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
				"success": false,
				"error":   "Student account is suspended",
				"code":    "ACCOUNT_SUSPENDED",
				"message": "บัญชีนักศึกษาถูกระงับการใช้งาน",
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"success": false,
				"error":   "Internal server error",
				"code":    "INTERNAL_ERROR",
				"message": "เกิดข้อผิดพลาดภายในระบบ",
			})
		}
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "เข้าสู่ระบบสำเร็จ",
		"data":    response,
	})
}

// StudentRegister handles student registration requests
// POST /api/v1/auth/student/register
func (h *StudentAuthHandler) StudentRegister(c *fiber.Ctx) error {
	var req StudentRegistrationRequest

	// Parse request body
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid request body",
			"code":    "INVALID_REQUEST_BODY",
			"message": "ข้อมูลที่ส่งมาไม่ถูกต้อง",
		})
	}

	// Validate request
	if err := h.validator.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Validation failed",
			"code":    "VALIDATION_ERROR",
			"message": "ข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง",
			"details": err.Error(),
		})
	}

	// Validate student ID format
	validation := h.studentIdValidation.ValidateFormat(req.StudentID)
	if !validation.IsValid {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid student ID format",
			"code":    "INVALID_STUDENT_ID_FORMAT",
			"message": "รูปแบบรหัสนักศึกษาไม่ถูกต้อง",
			"details": validation.Errors,
		})
	}

	// Check student ID uniqueness
	exists, err := h.studentIdValidation.CheckUniqueness(req.StudentID)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Failed to check student ID uniqueness",
			"code":    "UNIQUENESS_CHECK_ERROR",
			"message": "ไม่สามารถตรวจสอบรหัสนักศึกษาได้",
		})
	}
	if exists {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"success": false,
			"error":   "Student ID already exists",
			"code":    "STUDENT_ID_EXISTS",
			"message": "รหัสนักศึกษานี้ถูกใช้งานแล้ว",
		})
	}

	// Validate password strength
	if !h.passwordSecurity.ValidatePasswordStrengthSimple(req.Password) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Password does not meet security requirements",
			"code":    "WEAK_PASSWORD",
			"message": "รหัสผ่านไม่ปลอดภัยเพียงพอ ต้องมีอย่างน้อย 8 ตัวอักษร ประกอบด้วยตัวพิมพ์ใหญ่ พิมพ์เล็ก ตัวเลข และอักขระพิเศษ",
		})
	}

	// Create registration request for auth service
	registerReq := services.StudentRegisterRequest{
		StudentID:       req.StudentID,
		Email:           req.Email,
		Password:        req.Password,
		ConfirmPassword: req.ConfirmPassword,
		FullName:        req.FullName,
	}

	// Register student
	user, err := h.authService.StudentRegister(registerReq)
	if err != nil {
		switch err.Error() {
		case "passwords do not match":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"success": false,
				"error":   "Passwords do not match",
				"code":    "PASSWORD_MISMATCH",
				"message": "รหัสผ่านไม่ตรงกัน",
			})
		case "user with this email already exists":
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"success": false,
				"error":   "Email already exists",
				"code":    "EMAIL_EXISTS",
				"message": "อีเมลนี้ถูกใช้งานแล้ว",
			})
		case "user with this student_id already exists":
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"success": false,
				"error":   "Student ID already exists",
				"code":    "STUDENT_ID_EXISTS",
				"message": "รหัสนักศึกษานี้ถูกใช้งานแล้ว",
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"success": false,
				"error":   "Internal server error",
				"code":    "INTERNAL_ERROR",
				"message": "เกิดข้อผิดพลาดภายในระบบ",
			})
		}
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"success": true,
		"message": "ลงทะเบียนสำเร็จ",
		"data":    user,
	})
}

// StudentForgotPassword handles student password reset requests
// POST /api/v1/auth/student/forgot-password
func (h *StudentAuthHandler) StudentForgotPassword(c *fiber.Ctx) error {
	var req struct {
		Email string `json:"email" validate:"required,email"`
	}

	// Parse request body
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid request body",
			"code":    "INVALID_REQUEST_BODY",
			"message": "ข้อมูลที่ส่งมาไม่ถูกต้อง",
		})
	}

	// Validate request
	if err := h.validator.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Validation failed",
			"code":    "VALIDATION_ERROR",
			"message": "รูปแบบอีเมลไม่ถูกต้อง",
			"details": err.Error(),
		})
	}

	// Request password reset
	resetReq := services.PasswordResetRequest{
		Email: req.Email,
	}

	err := h.authService.RequestPasswordReset(resetReq)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error":   "Internal server error",
			"code":    "INTERNAL_ERROR",
			"message": "เกิดข้อผิดพลาดภายในระบบ",
		})
	}

	// Always return success for security (don't reveal if email exists)
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "หากอีเมลที่ระบุมีอยู่ในระบบ ลิงก์รีเซ็ตรหัสผ่านจะถูกส่งไปยังอีเมลดังกล่าว",
	})
}

// StudentResetPassword handles student password reset confirmation
// POST /api/v1/auth/student/reset-password
func (h *StudentAuthHandler) StudentResetPassword(c *fiber.Ctx) error {
	var req services.PasswordResetConfirmRequest

	// Parse request body
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid request body",
			"code":    "INVALID_REQUEST_BODY",
			"message": "ข้อมูลที่ส่งมาไม่ถูกต้อง",
		})
	}

	// Validate request
	if err := h.validator.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Validation failed",
			"code":    "VALIDATION_ERROR",
			"message": "ข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง",
			"details": err.Error(),
		})
	}

	// Validate password strength
	if !h.passwordSecurity.ValidatePasswordStrengthSimple(req.Password) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Password does not meet security requirements",
			"code":    "WEAK_PASSWORD",
			"message": "รหัสผ่านไม่ปลอดภัยเพียงพอ ต้องมีอย่างน้อย 8 ตัวอักษร ประกอบด้วยตัวพิมพ์ใหญ่ พิมพ์เล็ก ตัวเลข และอักขระพิเศษ",
		})
	}

	// Reset password
	err := h.authService.ResetPassword(req)
	if err != nil {
		switch err.Error() {
		case "passwords do not match":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"success": false,
				"error":   "Passwords do not match",
				"code":    "PASSWORD_MISMATCH",
				"message": "รหัสผ่านไม่ตรงกัน",
			})
		case "invalid or expired reset token":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"success": false,
				"error":   "Invalid or expired reset token",
				"code":    "INVALID_RESET_TOKEN",
				"message": "โทเค็นรีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุ",
			})
		case "user not found":
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"success": false,
				"error":   "User not found",
				"code":    "USER_NOT_FOUND",
				"message": "ไม่พบข้อมูลผู้ใช้",
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"success": false,
				"error":   "Internal server error",
				"code":    "INTERNAL_ERROR",
				"message": "เกิดข้อผิดพลาดภายในระบบ",
			})
		}
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "รีเซ็ตรหัสผ่านสำเร็จ",
	})
}

// StudentChangePassword handles student password change requests
// POST /api/v1/auth/student/change-password
func (h *StudentAuthHandler) StudentChangePassword(c *fiber.Ctx) error {
	// Get user ID from context (set by auth middleware)
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"success": false,
			"error":   "Authentication required",
			"code":    "AUTH_REQUIRED",
			"message": "จำเป็นต้องเข้าสู่ระบบ",
		})
	}

	var req services.ChangePasswordRequest

	// Parse request body
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Invalid request body",
			"code":    "INVALID_REQUEST_BODY",
			"message": "ข้อมูลที่ส่งมาไม่ถูกต้อง",
		})
	}

	// Validate request
	if err := h.validator.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Validation failed",
			"code":    "VALIDATION_ERROR",
			"message": "ข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง",
			"details": err.Error(),
		})
	}

	// Validate password strength
	if !h.passwordSecurity.ValidatePasswordStrengthSimple(req.NewPassword) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error":   "Password does not meet security requirements",
			"code":    "WEAK_PASSWORD",
			"message": "รหัสผ่านไม่ปลอดภัยเพียงพอ ต้องมีอย่างน้อย 8 ตัวอักษร ประกอบด้วยตัวพิมพ์ใหญ่ พิมพ์เล็ก ตัวเลข และอักขระพิเศษ",
		})
	}

	// Change password
	err := h.authService.ChangePassword(userID, req)
	if err != nil {
		switch err.Error() {
		case "passwords do not match":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"success": false,
				"error":   "New passwords do not match",
				"code":    "PASSWORD_MISMATCH",
				"message": "รหัสผ่านใหม่ไม่ตรงกัน",
			})
		case "current password is incorrect":
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"success": false,
				"error":   "Current password is incorrect",
				"code":    "INCORRECT_CURRENT_PASSWORD",
				"message": "รหัสผ่านปัจจุบันไม่ถูกต้อง",
			})
		case "user not found":
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"success": false,
				"error":   "User not found",
				"code":    "USER_NOT_FOUND",
				"message": "ไม่พบข้อมูลผู้ใช้",
			})
		default:
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"success": false,
				"error":   "Internal server error",
				"code":    "INTERNAL_ERROR",
				"message": "เกิดข้อผิดพลาดภายในระบบ",
			})
		}
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "เปลี่ยนรหัสผ่านสำเร็จ",
	})
}

// StudentLogout handles student logout requests
// POST /api/v1/auth/student/logout
func (h *StudentAuthHandler) StudentLogout(c *fiber.Ctx) error {
	// For JWT-based authentication, logout is typically handled client-side
	// by removing the token from storage. However, we can provide this endpoint
	// for consistency and future token blacklisting if needed.
	
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "ออกจากระบบสำเร็จ",
	})
}