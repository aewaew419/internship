package middleware

import (
	"log"
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"backend-go/internal/errors"
)

// ErrorHandler is the global error handler middleware for Fiber
func ErrorHandler() fiber.ErrorHandler {
	return func(c *fiber.Ctx, err error) error {
		// Log the error for debugging
		log.Printf("Error occurred: %v", err)

		// Handle different types of errors
		switch e := err.(type) {
		case *errors.AppError:
			// Handle custom application errors
			return c.Status(e.Code).JSON(errors.ErrorResponse{
				Success: false,
				Error:   *e,
			})

		case *fiber.Error:
			// Handle Fiber framework errors
			appErr := &errors.AppError{
				Code:    e.Code,
				Message: e.Message,
				Type:    getErrorTypeFromCode(e.Code),
			}
			return c.Status(e.Code).JSON(errors.ErrorResponse{
				Success: false,
				Error:   *appErr,
			})

		case validator.ValidationErrors:
			// Handle validation errors
			validationResponse := errors.HandleValidationError(e)
			return c.Status(http.StatusUnprocessableEntity).JSON(validationResponse)

		default:
			// Handle unknown errors
			appErr := &errors.AppError{
				Code:    http.StatusInternalServerError,
				Message: "Internal server error",
				Details: err.Error(),
				Type:    errors.ErrorTypeInternal,
			}
			return c.Status(http.StatusInternalServerError).JSON(errors.ErrorResponse{
				Success: false,
				Error:   *appErr,
			})
		}
	}
}

// getErrorTypeFromCode maps HTTP status codes to error types
func getErrorTypeFromCode(code int) string {
	switch code {
	case http.StatusBadRequest:
		return errors.ErrorTypeBadRequest
	case http.StatusUnauthorized:
		return errors.ErrorTypeAuth
	case http.StatusForbidden:
		return errors.ErrorTypeAuthorization
	case http.StatusNotFound:
		return errors.ErrorTypeNotFound
	case http.StatusConflict:
		return errors.ErrorTypeConflict
	case http.StatusUnprocessableEntity:
		return errors.ErrorTypeValidation
	case http.StatusInternalServerError:
		return errors.ErrorTypeInternal
	default:
		return errors.ErrorTypeInternal
	}
}

// RecoverMiddleware handles panics and converts them to errors
func RecoverMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("Panic recovered: %v", r)
				
				appErr := &errors.AppError{
					Code:    http.StatusInternalServerError,
					Message: "Internal server error",
					Details: "An unexpected error occurred",
					Type:    errors.ErrorTypeInternal,
				}
				
				c.Status(http.StatusInternalServerError).JSON(errors.ErrorResponse{
					Success: false,
					Error:   *appErr,
				})
			}
		}()
		
		return c.Next()
	}
}