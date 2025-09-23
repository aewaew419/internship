package errors

import (
	"net/http"

	"github.com/gofiber/fiber/v2"
)

// SendError sends a structured error response
func SendError(c *fiber.Ctx, err *AppError) error {
	return c.Status(err.Code).JSON(ErrorResponse{
		Success: false,
		Error:   *err,
	})
}

// SendValidationError sends a validation error response
func SendValidationError(c *fiber.Ctx, err error) error {
	validationResponse := HandleValidationError(err)
	return c.Status(http.StatusUnprocessableEntity).JSON(validationResponse)
}

// SendDatabaseError handles and sends database error response
func SendDatabaseError(c *fiber.Ctx, err error) error {
	appErr := HandleDatabaseError(err)
	if appErr == nil {
		return nil
	}
	return SendError(c, appErr)
}

// SendSuccess sends a successful response
func SendSuccess(c *fiber.Ctx, data interface{}) error {
	return c.JSON(fiber.Map{
		"success": true,
		"data":    data,
	})
}

// SendSuccessWithMessage sends a successful response with a message
func SendSuccessWithMessage(c *fiber.Ctx, message string, data interface{}) error {
	return c.JSON(fiber.Map{
		"success": true,
		"message": message,
		"data":    data,
	})
}

// SendPaginatedSuccess sends a paginated successful response
func SendPaginatedSuccess(c *fiber.Ctx, data interface{}, pagination map[string]interface{}) error {
	return c.JSON(fiber.Map{
		"success":    true,
		"data":       data,
		"pagination": pagination,
	})
}

// Common error creators for specific scenarios
func NewNotFoundError(resource string) *AppError {
	return NewAppError(
		http.StatusNotFound,
		resource+" not found",
		ErrorTypeNotFound,
	)
}

func NewUnauthorizedError(message string) *AppError {
	if message == "" {
		message = "Unauthorized access"
	}
	return NewAppError(
		http.StatusUnauthorized,
		message,
		ErrorTypeAuth,
	)
}

func NewForbiddenError(message string) *AppError {
	if message == "" {
		message = "Access forbidden"
	}
	return NewAppError(
		http.StatusForbidden,
		message,
		ErrorTypeAuthorization,
	)
}

func NewBadRequestError(message string) *AppError {
	if message == "" {
		message = "Bad request"
	}
	return NewAppError(
		http.StatusBadRequest,
		message,
		ErrorTypeBadRequest,
	)
}

func NewConflictError(message string) *AppError {
	if message == "" {
		message = "Resource conflict"
	}
	return NewAppError(
		http.StatusConflict,
		message,
		ErrorTypeConflict,
	)
}

func NewInternalServerError(message string) *AppError {
	if message == "" {
		message = "Internal server error"
	}
	return NewAppError(
		http.StatusInternalServerError,
		message,
		ErrorTypeInternal,
	)
}