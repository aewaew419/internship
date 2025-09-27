package handlers

import (
	"backend-go/internal/middleware"
	"backend-go/internal/services"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

// AuthHandler handles authentication-related HTTP requests
type AuthHandler struct {
	authService *services.AuthService
	validator   *validator.Validate
}

// NewAuthHandler creates a new authentication handler instance
func NewAuthHandler(authService *services.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
		validator:   validator.New(),
	}
}

// Login handles user login requests
// POST /api/v1/login
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req services.LoginRequest

	// Parse request body
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error": "Invalid request body",
			"code":  "INVALID_REQUEST_BODY",
			"message": "ข้อมูลที่ส่งมาไม่ถูกต้อง",
		})
	}

	// Validate request
	if err := h.validator.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"success": false,
			"error": "Validation failed",
			"code":  "VALIDATION_ERROR",
			"message": "ข้อมูลไม่ครบถ้วนหรือไม่ถูกต้อง",
			"details": err.Error(),
		})
	}

	// Authenticate user
	response, err := h.authService.Login(req)
	if err != nil {
		if err.Error() == "invalid credentials" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"error": "Invalid email or password",
				"code":  "INVALID_CREDENTIALS",
				"message": "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"success": false,
			"error": "Internal server error",
			"code":  "INTERNAL_ERROR",
			"message": "เกิดข้อผิดพลาดภายในระบบ",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"success": true,
		"message": "Login successful",
		"data":    response,
	})
}

// Register handles user registration requests
// POST /api/v1/register
func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req services.RegisterRequest

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
			"error": "Validation failed",
			"code":  "VALIDATION_ERROR",
			"details": err.Error(),
		})
	}

	// Register user
	user, err := h.authService.Register(req)
	if err != nil {
		if err.Error() == "passwords do not match" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Passwords do not match",
				"code":  "PASSWORD_MISMATCH",
			})
		}
		if err.Error() == "user with this email already exists" {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "User with this email already exists",
				"code":  "EMAIL_EXISTS",
			})
		}
		if err.Error() == "invalid role" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid role specified",
				"code":  "INVALID_ROLE",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Internal server error",
			"code":  "INTERNAL_ERROR",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "User registered successfully",
		"data":    user,
	})
}

// Me handles user profile requests (get current user info)
// GET /api/v1/me
func (h *AuthHandler) Me(c *fiber.Ctx) error {
	// Get user ID from context (set by auth middleware)
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Authentication required",
			"code":  "AUTH_REQUIRED",
		})
	}

	// Get user information
	user, err := h.authService.GetUserByID(userID)
	if err != nil {
		if err.Error() == "user not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "User not found",
				"code":  "USER_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Internal server error",
			"code":  "INTERNAL_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "User profile retrieved successfully",
		"data":    user,
	})
}

// RefreshToken handles token refresh requests
// POST /api/v1/refresh-token
func (h *AuthHandler) RefreshToken(c *fiber.Ctx) error {
	var req struct {
		RefreshToken string `json:"refresh_token" validate:"required"`
	}

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
			"error": "Validation failed",
			"code":  "VALIDATION_ERROR",
			"details": err.Error(),
		})
	}

	// Refresh token
	response, err := h.authService.RefreshToken(req.RefreshToken)
	if err != nil {
		if err.Error() == "invalid refresh token" || err.Error() == "user not found" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid refresh token",
				"code":  "INVALID_REFRESH_TOKEN",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Internal server error",
			"code":  "INTERNAL_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Token refreshed successfully",
		"data":    response,
	})
}

// ChangePassword handles password change requests
// POST /api/v1/change-password
func (h *AuthHandler) ChangePassword(c *fiber.Ctx) error {
	// Get user ID from context (set by auth middleware)
	userID, ok := middleware.GetUserID(c)
	if !ok {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Authentication required",
			"code":  "AUTH_REQUIRED",
		})
	}

	var req services.ChangePasswordRequest

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
			"error": "Validation failed",
			"code":  "VALIDATION_ERROR",
			"details": err.Error(),
		})
	}

	// Change password
	err := h.authService.ChangePassword(userID, req)
	if err != nil {
		if err.Error() == "passwords do not match" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "New passwords do not match",
				"code":  "PASSWORD_MISMATCH",
			})
		}
		if err.Error() == "current password is incorrect" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Current password is incorrect",
				"code":  "INCORRECT_CURRENT_PASSWORD",
			})
		}
		if err.Error() == "user not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "User not found",
				"code":  "USER_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Internal server error",
			"code":  "INTERNAL_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Password changed successfully",
	})
}

// RequestPasswordReset handles password reset requests
// POST /api/v1/request-password-reset
func (h *AuthHandler) RequestPasswordReset(c *fiber.Ctx) error {
	var req services.PasswordResetRequest

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
			"error": "Validation failed",
			"code":  "VALIDATION_ERROR",
			"details": err.Error(),
		})
	}

	// Request password reset
	err := h.authService.RequestPasswordReset(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Internal server error",
			"code":  "INTERNAL_ERROR",
		})
	}

	// Always return success for security (don't reveal if email exists)
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "If the email exists, a password reset link has been sent",
	})
}

// ResetPassword handles password reset confirmation requests
// POST /api/v1/reset-password
func (h *AuthHandler) ResetPassword(c *fiber.Ctx) error {
	var req services.PasswordResetConfirmRequest

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
			"error": "Validation failed",
			"code":  "VALIDATION_ERROR",
			"details": err.Error(),
		})
	}

	// Reset password
	err := h.authService.ResetPassword(req)
	if err != nil {
		if err.Error() == "passwords do not match" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Passwords do not match",
				"code":  "PASSWORD_MISMATCH",
			})
		}
		if err.Error() == "invalid or expired reset token" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid or expired reset token",
				"code":  "INVALID_RESET_TOKEN",
			})
		}
		if err.Error() == "user not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "User not found",
				"code":  "USER_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Internal server error",
			"code":  "INTERNAL_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Password reset successfully",
	})
}

// Logout handles user logout requests
// POST /api/v1/logout
func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	// For JWT-based authentication, logout is typically handled client-side
	// by removing the token from storage. However, we can provide this endpoint
	// for consistency and future token blacklisting if needed.
	
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Logged out successfully",
	})
}