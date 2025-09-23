package tests

import (
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gofiber/fiber/v2"
	"github.com/stretchr/testify/assert"
	
	"backend-go/internal/validation"
)

func TestValidateStruct(t *testing.T) {
	type TestStruct struct {
		Email    string `json:"email" validate:"required,email"`
		Password string `json:"password" validate:"required,password"`
		Phone    string `json:"phone" validate:"required,phone"`
		StudentID string `json:"student_id" validate:"required,student_id"`
		Age      int    `json:"age" validate:"required,gte=18"`
	}

	t.Run("Valid struct passes validation", func(t *testing.T) {
		testData := TestStruct{
			Email:     "test@example.com",
			Password:  "password123",
			Phone:     "0812345678",
			StudentID: "12345678",
			Age:       20,
		}

		err := validation.ValidateStruct(testData)
		assert.NoError(t, err)
	})

	t.Run("Invalid struct fails validation", func(t *testing.T) {
		testData := TestStruct{
			Email:     "invalid-email",
			Password:  "123", // Too short
			Phone:     "123",  // Invalid format
			StudentID: "abc",  // Invalid format
			Age:       15,     // Too young
		}

		err := validation.ValidateStruct(testData)
		assert.Error(t, err)
	})
}

func TestCustomValidators(t *testing.T) {
	type PasswordTest struct {
		Password string `validate:"password"`
	}

	type PhoneTest struct {
		Phone string `validate:"phone"`
	}

	type StudentIDTest struct {
		StudentID string `validate:"student_id"`
	}

	t.Run("Password validation", func(t *testing.T) {
		tests := []struct {
			password string
			valid    bool
		}{
			{"password123", true},   // Valid: has letters and numbers, 8+ chars
			{"Password1", true},     // Valid: has letters and numbers, 8+ chars
			{"12345678", false},     // Invalid: only numbers
			{"password", false},     // Invalid: only letters
			{"Pass1", false},        // Invalid: too short
			{"", false},             // Invalid: empty
		}

		for _, test := range tests {
			data := PasswordTest{Password: test.password}
			err := validation.ValidateStruct(data)
			
			if test.valid {
				assert.NoError(t, err, "Password '%s' should be valid", test.password)
			} else {
				assert.Error(t, err, "Password '%s' should be invalid", test.password)
			}
		}
	})

	t.Run("Phone validation", func(t *testing.T) {
		tests := []struct {
			phone string
			valid bool
		}{
			{"0812345678", true},     // Valid Thai mobile
			{"0234567890", true},     // Valid Thai landline
			{"081-234-5678", true},   // Valid with dashes
			{"081 234 5678", true},   // Valid with spaces
			{"(081) 234-5678", true}, // Valid with parentheses
			{"1234567890", false},    // Invalid: doesn't start with 0
			{"081234567", false},     // Invalid: too short
			{"08123456789", false},   // Invalid: too long
			{"081234567a", false},    // Invalid: contains letter
			{"", false},              // Invalid: empty
		}

		for _, test := range tests {
			data := PhoneTest{Phone: test.phone}
			err := validation.ValidateStruct(data)
			
			if test.valid {
				assert.NoError(t, err, "Phone '%s' should be valid", test.phone)
			} else {
				assert.Error(t, err, "Phone '%s' should be invalid", test.phone)
			}
		}
	})

	t.Run("Student ID validation", func(t *testing.T) {
		tests := []struct {
			studentID string
			valid     bool
		}{
			{"12345678", true},    // Valid: 8 digits
			{"123456789", true},   // Valid: 9 digits
			{"1234567890", true},  // Valid: 10 digits
			{"1234567", false},    // Invalid: too short
			{"12345678901", false}, // Invalid: too long
			{"1234567a", false},   // Invalid: contains letter
			{"", false},           // Invalid: empty
		}

		for _, test := range tests {
			data := StudentIDTest{StudentID: test.studentID}
			err := validation.ValidateStruct(data)
			
			if test.valid {
				assert.NoError(t, err, "Student ID '%s' should be valid", test.studentID)
			} else {
				assert.Error(t, err, "Student ID '%s' should be invalid", test.studentID)
			}
		}
	})
}

func TestParseAndValidate(t *testing.T) {
	type TestRequest struct {
		Email string `json:"email" validate:"required,email"`
		Name  string `json:"name" validate:"required,min=2"`
	}

	app := fiber.New()

	t.Run("Valid request body", func(t *testing.T) {
		app.Post("/test-valid", func(c *fiber.Ctx) error {
			var req TestRequest
			if err := validation.ParseAndValidate(c, &req); err != nil {
				return err
			}
			return c.JSON(fiber.Map{"success": true, "data": req})
		})

		reqBody := `{"email": "test@example.com", "name": "John Doe"}`
		req := httptest.NewRequest("POST", "/test-valid", strings.NewReader(reqBody))
		req.Header.Set("Content-Type", "application/json")
		
		resp, err := app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 200, resp.StatusCode)
	})

	t.Run("Invalid JSON format", func(t *testing.T) {
		app.Post("/test-invalid-json", func(c *fiber.Ctx) error {
			var req TestRequest
			return validation.ParseAndValidate(c, &req)
		})

		reqBody := `{"email": "test@example.com", "name":}` // Invalid JSON
		req := httptest.NewRequest("POST", "/test-invalid-json", strings.NewReader(reqBody))
		req.Header.Set("Content-Type", "application/json")
		
		resp, err := app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 400, resp.StatusCode)
	})

	t.Run("Validation failure", func(t *testing.T) {
		app.Post("/test-validation-fail", func(c *fiber.Ctx) error {
			var req TestRequest
			return validation.ParseAndValidate(c, &req)
		})

		reqBody := `{"email": "invalid-email", "name": "A"}` // Invalid email and name too short
		req := httptest.NewRequest("POST", "/test-validation-fail", strings.NewReader(reqBody))
		req.Header.Set("Content-Type", "application/json")
		
		resp, err := app.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, 422, resp.StatusCode)
	})
}