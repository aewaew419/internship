# Error Handling System

This package provides a comprehensive error handling system for the Go Fiber backend application. It includes structured error responses, database error mapping, validation error handling, and global error middleware.

## Features

- **Structured Error Responses**: Consistent JSON error format across the application
- **Database Error Mapping**: Automatic mapping of GORM/MySQL errors to appropriate HTTP status codes
- **Validation Error Handling**: Human-readable validation error messages with field-level details
- **Global Error Handler**: Centralized error handling middleware for Fiber
- **Panic Recovery**: Automatic recovery from panics with proper error responses
- **Custom Validation Rules**: Built-in validators for passwords, phone numbers, and student IDs

## Usage

### 1. Setting up Error Handling Middleware

```go
import (
    "github.com/gofiber/fiber/v2"
    "backend-go/internal/middleware"
)

app := fiber.New(fiber.Config{
    ErrorHandler: middleware.ErrorHandler(),
})

// Add panic recovery middleware
app.Use(middleware.RecoverMiddleware())
```

### 2. Using Error Utilities in Handlers

```go
import (
    "backend-go/internal/errors"
    "backend-go/internal/validation"
)

func CreateUser(c *fiber.Ctx) error {
    var req CreateUserRequest
    
    // Parse and validate request - automatically handles validation errors
    if err := validation.ParseAndValidate(c, &req); err != nil {
        return err
    }
    
    // Check if user exists
    var existingUser models.User
    err := db.Where("email = ?", req.Email).First(&existingUser).Error
    if err == nil {
        // User exists - return conflict error
        return errors.SendError(c, errors.NewConflictError("User with this email already exists"))
    }
    if err != gorm.ErrRecordNotFound {
        // Database error occurred
        return errors.SendDatabaseError(c, err)
    }
    
    // Create user...
    if err := db.Create(&user).Error; err != nil {
        return errors.SendDatabaseError(c, err)
    }
    
    return errors.SendSuccessWithMessage(c, "User created successfully", user)
}
```

### 3. Error Response Formats

#### Standard Error Response
```json
{
    "success": false,
    "error": {
        "code": 404,
        "message": "User not found",
        "details": "Additional error details (optional)",
        "type": "not_found"
    }
}
```

#### Validation Error Response
```json
{
    "success": false,
    "error": {
        "code": 422,
        "message": "Validation failed",
        "type": "validation"
    },
    "errors": [
        {
            "field": "email",
            "tag": "email",
            "value": "invalid-email",
            "message": "email must be a valid email address"
        },
        {
            "field": "password",
            "tag": "password",
            "value": "123",
            "message": "password is invalid"
        }
    ]
}
```

#### Success Response
```json
{
    "success": true,
    "message": "Operation completed successfully",
    "data": {
        "id": 1,
        "email": "user@example.com"
    }
}
```

### 4. Custom Validation Rules

The system includes custom validation rules:

```go
type UserRequest struct {
    Email     string `json:"email" validate:"required,email"`
    Password  string `json:"password" validate:"required,password"`      // Min 8 chars, letters + numbers
    Phone     string `json:"phone" validate:"required,phone"`            // Thai phone format
    StudentID string `json:"student_id" validate:"required,student_id"`  // 8-10 digits
}
```

### 5. Available Error Types

- `ErrorTypeValidation`: Validation errors (422)
- `ErrorTypeDatabase`: Database operation errors
- `ErrorTypeAuth`: Authentication errors (401)
- `ErrorTypeAuthorization`: Authorization errors (403)
- `ErrorTypeNotFound`: Resource not found (404)
- `ErrorTypeConflict`: Resource conflicts (409)
- `ErrorTypeBadRequest`: Bad request errors (400)
- `ErrorTypeInternal`: Internal server errors (500)

### 6. Predefined Errors

```go
// Use predefined errors for common scenarios
return errors.SendError(c, errors.ErrNotFound)
return errors.SendError(c, errors.ErrUnauthorized)
return errors.SendError(c, errors.ErrConflict)

// Or create custom errors
return errors.SendError(c, errors.NewNotFoundError("User"))
return errors.SendError(c, errors.NewUnauthorizedError("Invalid token"))
return errors.SendError(c, errors.NewConflictError("Email already exists"))
```

### 7. Database Error Handling

The system automatically maps common database errors:

- `gorm.ErrRecordNotFound` → 404 Not Found
- Duplicate entry errors → 409 Conflict
- Foreign key constraint errors → 400 Bad Request
- Data too long errors → 400 Bad Request (validation type)
- NOT NULL constraint errors → 400 Bad Request (validation type)
- Connection errors → 503 Service Unavailable

### 8. Utility Functions

```go
// Send different types of responses
errors.SendError(c, appError)
errors.SendSuccess(c, data)
errors.SendSuccessWithMessage(c, "Success message", data)
errors.SendPaginatedSuccess(c, data, pagination)
errors.SendDatabaseError(c, dbError)
errors.SendValidationError(c, validationError)
```

## Testing

The error handling system includes comprehensive tests:

```bash
# Run all error handling tests
go test ./tests/errors_test.go ./tests/validation_test.go ./tests/error_integration_test.go -v

# Run specific test files
go test ./tests/errors_test.go -v
go test ./tests/validation_test.go -v
go test ./tests/error_integration_test.go -v
```

## Best Practices

1. **Always use the error utilities**: Don't create raw Fiber errors, use the provided utilities
2. **Handle database errors consistently**: Use `SendDatabaseError` for all database operations
3. **Validate input early**: Use `ParseAndValidate` for request parsing and validation
4. **Provide meaningful error messages**: Use descriptive messages that help users understand the issue
5. **Log errors appropriately**: The middleware automatically logs errors for debugging
6. **Use appropriate HTTP status codes**: The system maps errors to correct status codes automatically
7. **Handle panics gracefully**: The recover middleware ensures panics don't crash the application

## Error Flow

1. **Request comes in** → Middleware processes request
2. **Handler processes** → Uses validation and error utilities
3. **Error occurs** → Handler returns error using utilities
4. **Global error handler** → Catches error and formats response
5. **Response sent** → Structured JSON error response to client

This system ensures consistent, predictable error handling throughout the application while providing detailed information for debugging and user feedback.