package validation

import (
	"reflect"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"backend-go/internal/errors"
)

var validate *validator.Validate

func init() {
	validate = validator.New()
	
	// Register custom tag name function to use json tags
	validate.RegisterTagNameFunc(func(fld reflect.StructField) string {
		name := strings.SplitN(fld.Tag.Get("json"), ",", 2)[0]
		if name == "-" {
			return ""
		}
		return name
	})
	
	// Register custom validators
	registerCustomValidators()
}

// ValidateStruct validates a struct and returns formatted errors
func ValidateStruct(s interface{}) error {
	return validate.Struct(s)
}

// ValidateAndRespond validates a struct and sends error response if validation fails
func ValidateAndRespond(c *fiber.Ctx, s interface{}) error {
	if err := ValidateStruct(s); err != nil {
		return errors.SendValidationError(c, err)
	}
	return nil
}

// ParseAndValidate parses request body and validates it
func ParseAndValidate(c *fiber.Ctx, s interface{}) error {
	// Parse the request body
	if err := c.BodyParser(s); err != nil {
		return errors.SendError(c, errors.NewBadRequestError("Invalid request body format"))
	}
	
	// Validate the parsed struct
	if err := ValidateStruct(s); err != nil {
		return errors.SendValidationError(c, err)
	}
	
	return nil
}

// registerCustomValidators registers custom validation rules
func registerCustomValidators() {
	// Register custom password validation
	validate.RegisterValidation("password", validatePassword)
	
	// Register custom phone number validation
	validate.RegisterValidation("phone", validatePhone)
	
	// Register custom student ID validation
	validate.RegisterValidation("student_id", validateStudentID)
}

// validatePassword validates password strength
func validatePassword(fl validator.FieldLevel) bool {
	password := fl.Field().String()
	
	// Password must be at least 8 characters
	if len(password) < 8 {
		return false
	}
	
	// Password must contain at least one letter and one number
	hasLetter := false
	hasNumber := false
	
	for _, char := range password {
		if char >= 'a' && char <= 'z' || char >= 'A' && char <= 'Z' {
			hasLetter = true
		}
		if char >= '0' && char <= '9' {
			hasNumber = true
		}
	}
	
	return hasLetter && hasNumber
}

// validatePhone validates Thai phone number format
func validatePhone(fl validator.FieldLevel) bool {
	phone := fl.Field().String()
	
	// Remove common separators
	phone = strings.ReplaceAll(phone, "-", "")
	phone = strings.ReplaceAll(phone, " ", "")
	phone = strings.ReplaceAll(phone, "(", "")
	phone = strings.ReplaceAll(phone, ")", "")
	
	// Check if it's a valid Thai phone number (10 digits starting with 0)
	if len(phone) == 10 && phone[0] == '0' {
		for _, char := range phone[1:] {
			if char < '0' || char > '9' {
				return false
			}
		}
		return true
	}
	
	return false
}

// validateStudentID validates student ID format
func validateStudentID(fl validator.FieldLevel) bool {
	studentID := fl.Field().String()
	
	// Student ID should be 8-10 digits
	if len(studentID) < 8 || len(studentID) > 10 {
		return false
	}
	
	// All characters should be digits
	for _, char := range studentID {
		if char < '0' || char > '9' {
			return false
		}
	}
	
	return true
}