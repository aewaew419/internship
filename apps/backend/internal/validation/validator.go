package validation

import (
	"reflect"
	"strings"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
	"backend-go/internal/errors"
	"backend-go/internal/services"
)

var validate *validator.Validate
var db *gorm.DB
var studentIdValidator *services.StudentIdValidationService
var emailValidator *services.EmailValidationService
var sanitizer *services.InputSanitizationService

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
	
	// Initialize services
	sanitizer = services.NewInputSanitizationService()
	
	// Register custom validators
	registerCustomValidators()
}

// InitializeValidation initializes validation services with database connection
func InitializeValidation(database *gorm.DB) {
	db = database
	studentIdValidator = services.NewStudentIdValidationService(db)
	emailValidator = services.NewEmailValidationService(db)
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
	// Register enhanced password validation
	validate.RegisterValidation("password", validatePassword)
	
	// Register custom phone number validation
	validate.RegisterValidation("phone", validatePhone)
	
	// Register enhanced student ID validation
	validate.RegisterValidation("student_id", validateStudentID)
	
	// Register enhanced email validation
	validate.RegisterValidation("email_enhanced", validateEmailEnhanced)
	
	// Register Thai name validation
	validate.RegisterValidation("thai_name", validateThaiName)
	
	// Register safe input validation (no dangerous content)
	validate.RegisterValidation("safe_input", validateSafeInput)
}

// validatePassword validates password strength with enhanced security requirements
func validatePassword(fl validator.FieldLevel) bool {
	password := fl.Field().String()
	
	// Password must be at least 8 characters
	if len(password) < 8 {
		return false
	}
	
	// Password must not exceed 128 characters
	if len(password) > 128 {
		return false
	}
	
	// Check for required character types
	hasUpper := false
	hasLower := false
	hasNumber := false
	hasSpecial := false
	
	for _, char := range password {
		switch {
		case char >= 'A' && char <= 'Z':
			hasUpper = true
		case char >= 'a' && char <= 'z':
			hasLower = true
		case char >= '0' && char <= '9':
			hasNumber = true
		case strings.ContainsRune("!@#$%^&*()_+-=[]{}|;':\",./<>?", char):
			hasSpecial = true
		}
	}
	
	// All character types must be present
	return hasUpper && hasLower && hasNumber && hasSpecial
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

// validateStudentID validates student ID format using enhanced validation service
func validateStudentID(fl validator.FieldLevel) bool {
	studentID := fl.Field().String()
	
	// Use sanitizer to clean the input first
	cleanStudentID := sanitizer.SanitizeStudentID(studentID)
	
	// If no validator service available, use basic validation
	if studentIdValidator == nil {
		// Basic validation: should be 11 digits
		if len(cleanStudentID) != 11 {
			return false
		}
		
		// All characters should be digits
		for _, char := range cleanStudentID {
			if char < '0' || char > '9' {
				return false
			}
		}
		return true
	}
	
	// Use enhanced validation service
	result := studentIdValidator.ValidateFormat(cleanStudentID)
	return result.IsValid
}