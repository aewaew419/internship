package errors

import (
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/go-playground/validator/v10"
	"gorm.io/gorm"
)

// AppError represents a structured application error
type AppError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
	Type    string `json:"type"`
}

// Error implements the error interface
func (e *AppError) Error() string {
	return e.Message
}

// ErrorResponse represents the standard error response format
type ErrorResponse struct {
	Success bool     `json:"success"`
	Error   AppError `json:"error"`
}

// ValidationError represents validation error details
type ValidationError struct {
	Field   string `json:"field"`
	Tag     string `json:"tag"`
	Value   string `json:"value"`
	Message string `json:"message"`
}

// ValidationErrorResponse represents validation error response
type ValidationErrorResponse struct {
	Success bool              `json:"success"`
	Error   AppError          `json:"error"`
	Errors  []ValidationError `json:"errors"`
}

// Error types
const (
	ErrorTypeValidation   = "validation"
	ErrorTypeDatabase     = "database"
	ErrorTypeAuth         = "authentication"
	ErrorTypeAuthorization = "authorization"
	ErrorTypeNotFound     = "not_found"
	ErrorTypeConflict     = "conflict"
	ErrorTypeInternal     = "internal"
	ErrorTypeBadRequest   = "bad_request"
)

// Predefined errors
var (
	ErrInternalServer     = NewAppError(http.StatusInternalServerError, "Internal server error", ErrorTypeInternal)
	ErrBadRequest         = NewAppError(http.StatusBadRequest, "Bad request", ErrorTypeBadRequest)
	ErrUnauthorized       = NewAppError(http.StatusUnauthorized, "Unauthorized", ErrorTypeAuth)
	ErrForbidden          = NewAppError(http.StatusForbidden, "Forbidden", ErrorTypeAuthorization)
	ErrNotFound           = NewAppError(http.StatusNotFound, "Resource not found", ErrorTypeNotFound)
	ErrConflict           = NewAppError(http.StatusConflict, "Resource conflict", ErrorTypeConflict)
	ErrValidationFailed   = NewAppError(http.StatusUnprocessableEntity, "Validation failed", ErrorTypeValidation)
	ErrInvalidCredentials = NewAppError(http.StatusUnauthorized, "Invalid credentials", ErrorTypeAuth)
	ErrTokenExpired       = NewAppError(http.StatusUnauthorized, "Token expired", ErrorTypeAuth)
	ErrTokenInvalid       = NewAppError(http.StatusUnauthorized, "Invalid token", ErrorTypeAuth)
)

// NewAppError creates a new application error
func NewAppError(code int, message, errorType string) *AppError {
	return &AppError{
		Code:    code,
		Message: message,
		Type:    errorType,
	}
}

// NewAppErrorWithDetails creates a new application error with details
func NewAppErrorWithDetails(code int, message, details, errorType string) *AppError {
	return &AppError{
		Code:    code,
		Message: message,
		Details: details,
		Type:    errorType,
	}
}

// WrapError wraps an existing error into AppError
func WrapError(err error, code int, message, errorType string) *AppError {
	return &AppError{
		Code:    code,
		Message: message,
		Details: err.Error(),
		Type:    errorType,
	}
}

// HandleDatabaseError maps GORM errors to appropriate AppErrors
func HandleDatabaseError(err error) *AppError {
	if err == nil {
		return nil
	}

	// Handle GORM specific errors
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return NewAppError(http.StatusNotFound, "Record not found", ErrorTypeNotFound)
	}

	if errors.Is(err, gorm.ErrInvalidTransaction) {
		return NewAppError(http.StatusBadRequest, "Invalid transaction", ErrorTypeDatabase)
	}

	if errors.Is(err, gorm.ErrNotImplemented) {
		return NewAppError(http.StatusNotImplemented, "Operation not implemented", ErrorTypeDatabase)
	}

	if errors.Is(err, gorm.ErrMissingWhereClause) {
		return NewAppError(http.StatusBadRequest, "Missing where clause in query", ErrorTypeDatabase)
	}

	if errors.Is(err, gorm.ErrUnsupportedRelation) {
		return NewAppError(http.StatusBadRequest, "Unsupported relation", ErrorTypeDatabase)
	}

	if errors.Is(err, gorm.ErrPrimaryKeyRequired) {
		return NewAppError(http.StatusBadRequest, "Primary key required", ErrorTypeDatabase)
	}

	// Handle MySQL specific errors
	errStr := err.Error()
	
	// Duplicate entry error
	if strings.Contains(errStr, "Duplicate entry") || strings.Contains(errStr, "duplicate key") {
		return NewAppErrorWithDetails(
			http.StatusConflict,
			"Duplicate entry",
			"A record with this value already exists",
			ErrorTypeConflict,
		)
	}

	// Foreign key constraint error
	if strings.Contains(errStr, "foreign key constraint") || strings.Contains(errStr, "FOREIGN KEY") {
		return NewAppErrorWithDetails(
			http.StatusBadRequest,
			"Foreign key constraint violation",
			"Referenced record does not exist",
			ErrorTypeDatabase,
		)
	}

	// Data too long error
	if strings.Contains(errStr, "Data too long") {
		return NewAppErrorWithDetails(
			http.StatusBadRequest,
			"Data too long",
			"One or more fields exceed maximum length",
			ErrorTypeValidation,
		)
	}

	// Cannot be null error
	if strings.Contains(errStr, "cannot be null") || strings.Contains(errStr, "NOT NULL") {
		return NewAppErrorWithDetails(
			http.StatusBadRequest,
			"Required field missing",
			"One or more required fields are missing",
			ErrorTypeValidation,
		)
	}

	// Connection errors
	if strings.Contains(errStr, "connection refused") || strings.Contains(errStr, "no connection") {
		return NewAppErrorWithDetails(
			http.StatusServiceUnavailable,
			"Database connection error",
			"Unable to connect to database",
			ErrorTypeDatabase,
		)
	}

	// Default database error
	return WrapError(err, http.StatusInternalServerError, "Database operation failed", ErrorTypeDatabase)
}

// HandleValidationError converts validator errors to structured format
func HandleValidationError(err error) *ValidationErrorResponse {
	var validationErrors []ValidationError

	if validatorErrs, ok := err.(validator.ValidationErrors); ok {
		for _, fieldErr := range validatorErrs {
			validationError := ValidationError{
				Field: fieldErr.Field(),
				Tag:   fieldErr.Tag(),
				Value: fmt.Sprintf("%v", fieldErr.Value()),
			}

			// Generate human-readable messages based on validation tag
			switch fieldErr.Tag() {
			case "required":
				validationError.Message = fmt.Sprintf("%s is required", fieldErr.Field())
			case "email":
				validationError.Message = fmt.Sprintf("%s must be a valid email address", fieldErr.Field())
			case "min":
				validationError.Message = fmt.Sprintf("%s must be at least %s characters long", fieldErr.Field(), fieldErr.Param())
			case "max":
				validationError.Message = fmt.Sprintf("%s must be at most %s characters long", fieldErr.Field(), fieldErr.Param())
			case "len":
				validationError.Message = fmt.Sprintf("%s must be exactly %s characters long", fieldErr.Field(), fieldErr.Param())
			case "numeric":
				validationError.Message = fmt.Sprintf("%s must be numeric", fieldErr.Field())
			case "alpha":
				validationError.Message = fmt.Sprintf("%s must contain only letters", fieldErr.Field())
			case "alphanum":
				validationError.Message = fmt.Sprintf("%s must contain only letters and numbers", fieldErr.Field())
			case "url":
				validationError.Message = fmt.Sprintf("%s must be a valid URL", fieldErr.Field())
			case "uuid":
				validationError.Message = fmt.Sprintf("%s must be a valid UUID", fieldErr.Field())
			case "oneof":
				validationError.Message = fmt.Sprintf("%s must be one of: %s", fieldErr.Field(), fieldErr.Param())
			case "gt":
				validationError.Message = fmt.Sprintf("%s must be greater than %s", fieldErr.Field(), fieldErr.Param())
			case "gte":
				validationError.Message = fmt.Sprintf("%s must be greater than or equal to %s", fieldErr.Field(), fieldErr.Param())
			case "lt":
				validationError.Message = fmt.Sprintf("%s must be less than %s", fieldErr.Field(), fieldErr.Param())
			case "lte":
				validationError.Message = fmt.Sprintf("%s must be less than or equal to %s", fieldErr.Field(), fieldErr.Param())
			default:
				validationError.Message = fmt.Sprintf("%s is invalid", fieldErr.Field())
			}

			validationErrors = append(validationErrors, validationError)
		}
	}

	return &ValidationErrorResponse{
		Success: false,
		Error: AppError{
			Code:    http.StatusUnprocessableEntity,
			Message: "Validation failed",
			Type:    ErrorTypeValidation,
		},
		Errors: validationErrors,
	}
}