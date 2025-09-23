package tests

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
	
	"backend-go/internal/errors"
	"backend-go/internal/middleware"
	"backend-go/internal/validation"
)

func TestAppError(t *testing.T) {
	t.Run("NewAppError creates error correctly", func(t *testing.T) {
		err := errors.NewAppError(404, "Not found", errors.ErrorTypeNotFound)
		
		assert.Equal(t, 404, err.Code)
		assert.Equal(t, "Not found", err.Message)
		assert.Equal(t, errors.ErrorTypeNotFound, err.Type)
		assert.Equal(t, "Not found", err.Error())
	})

	t.Run("NewAppErrorWithDetails creates error with details", func(t *testing.T) {
		err := errors.NewAppErrorWithDetails(400, "Bad request", "Invalid input", errors.ErrorTypeBadRequest)
		
		assert.Equal(t, 400, err.Code)
		assert.Equal(t, "Bad request", err.Message)
		assert.Equal(t, "Invalid input", err.Details)
		assert.Equal(t, errors.ErrorTypeBadRequest, err.Type)
	})

	t.Run("WrapError wraps existing error", func(t *testing.T) {
		originalErr := gorm.ErrRecordNotFound
		wrappedErr := errors.WrapError(originalErr, 404, "User not found", errors.ErrorTypeNotFound)
		
		assert.Equal(t, 404, wrappedErr.Code)
		assert.Equal(t, "User not found", wrappedErr.Message)
		assert.Equal(t, originalErr.Error(), wrappedErr.Details)
		assert.Equal(t, errors.ErrorTypeNotFound, wrappedErr.Type)
	})
}

func TestHandleDatabaseError(t *testing.T) {
	t.Run("Handle GORM ErrRecordNotFound", func(t *testing.T) {
		err := errors.HandleDatabaseError(gorm.ErrRecordNotFound)
		
		assert.NotNil(t, err)
		assert.Equal(t, http.StatusNotFound, err.Code)
		assert.Equal(t, "Record not found", err.Message)
		assert.Equal(t, errors.ErrorTypeNotFound, err.Type)
	})

	t.Run("Handle duplicate entry error", func(t *testing.T) {
		duplicateErr := &mockError{message: "Error 1062: Duplicate entry 'test@example.com' for key 'email'"}
		err := errors.HandleDatabaseError(duplicateErr)
		
		assert.NotNil(t, err)
		assert.Equal(t, http.StatusConflict, err.Code)
		assert.Equal(t, "Duplicate entry", err.Message)
		assert.Equal(t, errors.ErrorTypeConflict, err.Type)
	})

	t.Run("Handle foreign key constraint error", func(t *testing.T) {
		fkErr := &mockError{message: "Error 1452: Cannot add or update a child row: a foreign key constraint fails"}
		err := errors.HandleDatabaseError(fkErr)
		
		assert.NotNil(t, err)
		assert.Equal(t, http.StatusBadRequest, err.Code)
		assert.Equal(t, "Foreign key constraint violation", err.Message)
		assert.Equal(t, errors.ErrorTypeDatabase, err.Type)
	})

	t.Run("Handle nil error", func(t *testing.T) {
		err := errors.HandleDatabaseError(nil)
		assert.Nil(t, err)
	})
}

func TestHandleValidationError(t *testing.T) {
	// Create a test struct for validation
	type TestStruct struct {
		Email    string `json:"email" validate:"required,email"`
		Password string `json:"password" validate:"required,min=8"`
		Age      int    `json:"age" validate:"required,gte=18"`
	}

	t.Run("Handle validation errors", func(t *testing.T) {
		validate := validator.New()
		testData := TestStruct{
			Email:    "invalid-email",
			Password: "123",
			Age:      15,
		}

		err := validate.Struct(testData)
		assert.NotNil(t, err)

		validationResponse := errors.HandleValidationError(err)
		
		assert.False(t, validationResponse.Success)
		assert.Equal(t, http.StatusUnprocessableEntity, validationResponse.Error.Code)
		assert.Equal(t, "Validation failed", validationResponse.Error.Message)
		assert.Equal(t, errors.ErrorTypeValidation, validationResponse.Error.Type)
		assert.Len(t, validationResponse.Errors, 3) // email, password, age errors
	})
}

func TestErrorHandlerMiddleware(t *testing.T) {
	app := fiber.New(fiber.Config{
		ErrorHandler: middleware.ErrorHandler(),
	})

	t.Run("Handle AppError", func(t *testing.T) {
		app.Get("/app-error", func(c *fiber.Ctx) error {
			return errors.NewNotFoundError("User")
		})

		req := httptest.NewRequest("GET", "/app-error", nil)
		resp, err := app.Test(req)
		
		assert.NoError(t, err)
		assert.Equal(t, http.StatusNotFound, resp.StatusCode)

		var response errors.ErrorResponse
		json.NewDecoder(resp.Body).Decode(&response)
		
		assert.False(t, response.Success)
		assert.Equal(t, "User not found", response.Error.Message)
		assert.Equal(t, errors.ErrorTypeNotFound, response.Error.Type)
	})

	t.Run("Handle Fiber Error", func(t *testing.T) {
		app.Get("/fiber-error", func(c *fiber.Ctx) error {
			return fiber.NewError(fiber.StatusBadRequest, "Invalid request")
		})

		req := httptest.NewRequest("GET", "/fiber-error", nil)
		resp, err := app.Test(req)
		
		assert.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)

		var response errors.ErrorResponse
		json.NewDecoder(resp.Body).Decode(&response)
		
		assert.False(t, response.Success)
		assert.Equal(t, "Invalid request", response.Error.Message)
	})

	t.Run("Handle validation error", func(t *testing.T) {
		type TestRequest struct {
			Email string `json:"email" validate:"required,email"`
		}

		app.Post("/validation-error", func(c *fiber.Ctx) error {
			var req TestRequest
			return validation.ParseAndValidate(c, &req)
		})

		reqBody := `{"email": "invalid-email"}`
		req := httptest.NewRequest("POST", "/validation-error", strings.NewReader(reqBody))
		req.Header.Set("Content-Type", "application/json")
		
		resp, err := app.Test(req)
		
		assert.NoError(t, err)
		assert.Equal(t, http.StatusUnprocessableEntity, resp.StatusCode)

		var response errors.ValidationErrorResponse
		json.NewDecoder(resp.Body).Decode(&response)
		
		assert.False(t, response.Success)
		assert.Equal(t, "Validation failed", response.Error.Message)
		assert.Greater(t, len(response.Errors), 0)
	})
}

func TestErrorUtils(t *testing.T) {
	app := fiber.New()

	t.Run("SendError", func(t *testing.T) {
		app.Get("/send-error", func(c *fiber.Ctx) error {
			err := errors.NewBadRequestError("Invalid input")
			return errors.SendError(c, err)
		})

		req := httptest.NewRequest("GET", "/send-error", nil)
		resp, err := app.Test(req)
		
		assert.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)
	})

	t.Run("SendSuccess", func(t *testing.T) {
		app.Get("/send-success", func(c *fiber.Ctx) error {
			return errors.SendSuccess(c, fiber.Map{"message": "Success"})
		})

		req := httptest.NewRequest("GET", "/send-success", nil)
		resp, err := app.Test(req)
		
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var response map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&response)
		
		assert.True(t, response["success"].(bool))
		assert.NotNil(t, response["data"])
	})
}

// mockError is a helper for testing database errors
type mockError struct {
	message string
}

func (e *mockError) Error() string {
	return e.message
}