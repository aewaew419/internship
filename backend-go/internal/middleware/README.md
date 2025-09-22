# Middleware Package

This package provides comprehensive middleware for the Go Fiber backend, including authentication, authorization, CORS, and logging functionality.

## Features

### Authentication Middleware
- JWT token validation
- Optional authentication support
- User context extraction helpers

### Role-Based Access Control (RBAC)
- Role-based authorization
- Permission-based authorization
- Pre-built role groups (Admin, Instructor, Staff, Student)
- Owner-or-admin access patterns

### CORS Middleware
- Configurable CORS policies
- Development and production configurations
- Custom origin validation

### Logging Middleware
- Request/response logging
- Structured logging
- Security event logging
- Request ID tracking

## Quick Start

```go
package main

import (
    "backend-go/internal/middleware"
    "backend-go/internal/services"
    "github.com/gofiber/fiber/v2"
    "gorm.io/gorm"
)

func main() {
    app := fiber.New()
    
    // Setup middleware
    config := middleware.MiddlewareConfig{
        JWTService:     jwtService,
        DB:             db,
        Environment:    "development",
        AllowedOrigins: []string{"http://localhost:3000"},
    }
    middleware.SetupMiddleware(app, config)
    
    // Create route groups
    publicAPI := middleware.PublicGroup(app, "/api/v1/public")
    authAPI := middleware.AuthGroup(app, "/api/v1", jwtService)
    adminAPI := middleware.AdminGroup(app, "/api/v1/admin", jwtService, db)
    
    app.Listen(":8080")
}
```

## Authentication Middleware

### AuthMiddleware
Validates JWT tokens and extracts user information.

```go
app.Use("/protected", middleware.AuthMiddleware(jwtService))
```

### OptionalAuthMiddleware
Allows both authenticated and unauthenticated requests.

```go
app.Use("/optional", middleware.OptionalAuthMiddleware(jwtService))
```

### Helper Functions
Extract user information from context:

```go
func handler(c *fiber.Ctx) error {
    userID, ok := middleware.GetUserID(c)
    userEmail, ok := middleware.GetUserEmail(c)
    roleID, ok := middleware.GetRoleID(c)
    claims, ok := middleware.GetClaims(c)
    
    return c.JSON(fiber.Map{"user_id": userID})
}
```

## Role-Based Access Control

### Role-Based Authorization
Restrict access based on user roles:

```go
// Allow only admins
app.Use("/admin", middleware.RoleBasedAuth(db, "admin"))

// Allow instructors and admins
app.Use("/instructor", middleware.RoleBasedAuth(db, "instructor", "admin"))
```

### Permission-Based Authorization
Restrict access based on specific permissions:

```go
app.Use("/users", middleware.PermissionBasedAuth(db, "read_users", "write_users"))
```

### Pre-built Role Groups
Convenient route groups for common access patterns:

```go
// Admin only
adminAPI := middleware.AdminGroup(app, "/admin", jwtService, db)

// Instructor or admin
instructorAPI := middleware.InstructorGroup(app, "/instructor", jwtService, db)

// Staff or admin
staffAPI := middleware.StaffGroup(app, "/staff", jwtService, db)

// Student and above (student, instructor, staff, admin)
studentAPI := middleware.StudentGroup(app, "/student", jwtService, db)
```

### Owner-or-Admin Pattern
Allow resource owners or admins to access resources:

```go
getUserIDFromResource := func(c *fiber.Ctx) (uint, error) {
    // Extract user ID from resource (e.g., from database)
    return resourceUserID, nil
}

app.Use("/profile/:id", middleware.OwnerOrAdmin(db, getUserIDFromResource))
```

## CORS Middleware

### Default CORS
Suitable for development with common localhost origins:

```go
app.Use(middleware.DefaultCORS())
```

### Production CORS
Restrictive CORS for production:

```go
allowedOrigins := []string{"https://yourdomain.com"}
app.Use(middleware.ProductionCORS(allowedOrigins))
```

### Development CORS
Permissive CORS for development:

```go
app.Use(middleware.DevelopmentCORS())
```

### Custom CORS
Custom origin validation:

```go
allowOriginFunc := func(origin string) bool {
    return strings.HasSuffix(origin, ".yourdomain.com")
}
app.Use(middleware.CustomCORS(allowOriginFunc))
```

## Logging Middleware

### Default Logger
Standard request logging:

```go
app.Use(middleware.DefaultLogger())
```

### Production Logger
JSON-formatted logging for production:

```go
app.Use(middleware.ProductionLogger())
```

### Structured Logger
Detailed structured logging with user information:

```go
app.Use(middleware.StructuredLogger())
```

### Request ID Logger
Adds request ID tracking:

```go
app.Use(middleware.RequestIDLogger())

// Extract request ID in handlers
func handler(c *fiber.Ctx) error {
    requestID, ok := middleware.GetRequestID(c)
    return c.JSON(fiber.Map{"request_id": requestID})
}
```

### Security Logger
Logs security-related events (401, 403, failed logins):

```go
app.Use(middleware.SecurityLogger())
```

## Configuration

### MiddlewareConfig
Central configuration for all middleware:

```go
config := middleware.MiddlewareConfig{
    JWTService:     jwtService,      // Required for auth
    DB:             db,              // Required for RBAC
    Environment:    "production",    // "development" or "production"
    AllowedOrigins: []string{        // CORS allowed origins
        "https://yourdomain.com",
        "https://app.yourdomain.com",
    },
}
middleware.SetupMiddleware(app, config)
```

## Error Responses

The middleware returns structured error responses:

```json
{
    "error": "Authorization header is required",
    "code": "MISSING_AUTH_HEADER"
}
```

Common error codes:
- `MISSING_AUTH_HEADER`: No Authorization header
- `INVALID_AUTH_FORMAT`: Invalid Authorization header format
- `MISSING_TOKEN`: No token provided
- `INVALID_TOKEN`: Invalid or expired token
- `AUTH_REQUIRED`: Authentication required
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions
- `ACCESS_DENIED`: Access denied to resource

## Testing

Run tests with:

```bash
# Run all tests
go test ./internal/middleware -v

# Run tests without database (skip RBAC tests)
go test ./internal/middleware -v -short
```

The package includes comprehensive tests for all middleware functionality.

## Dependencies

- `github.com/gofiber/fiber/v2` - Web framework
- `github.com/golang-jwt/jwt/v5` - JWT handling
- `gorm.io/gorm` - Database ORM
- `github.com/stretchr/testify` - Testing framework