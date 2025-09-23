# JWT Token Service Documentation

## Overview

The JWT Token Service provides comprehensive token management for the authentication system, supporting both student users and super admins with enhanced security features.

## Features

### 1. Multi-User Type Support
- **Student Users**: Uses `student_id` as identifier
- **Super Admins**: Uses numeric `id` as identifier
- Polymorphic token relationships

### 2. Token Types
- **Access Token**: Short-lived tokens for API access (15 minutes default)
- **Refresh Token**: Long-lived tokens for token renewal (7 days default)
- **Remember Token**: Extended access tokens for "remember me" functionality (30 days default)
- **Password Reset Token**: Short-lived tokens for password reset (1 hour default)
- **Email Verification Token**: Tokens for email verification (24 hours default)

### 3. Security Features
- **Token Revocation**: Individual and bulk token revocation
- **Token Blacklisting**: Database-backed token validation
- **Abilities/Permissions**: Fine-grained permission system
- **Device Tracking**: Device fingerprinting for security
- **JWT ID (JTI)**: Unique token identifiers for revocation
- **Automatic Cleanup**: Expired token cleanup

## Configuration

```go
type JWTConfig struct {
    SecretKey       string        // JWT signing secret
    Issuer          string        // Token issuer
    Audience        string        // Token audience
    AccessTokenTTL  time.Duration // Access token lifetime
    RefreshTokenTTL time.Duration // Refresh token lifetime
    RememberTokenTTL time.Duration // Remember token lifetime
    ResetTokenTTL   time.Duration // Password reset token lifetime
    VerifyTokenTTL  time.Duration // Email verification token lifetime
}
```

## Usage Examples

### 1. Initialize JWT Service

```go
config := &JWTConfig{
    SecretKey:       "your-secret-key",
    Issuer:          "internship-system",
    Audience:        "internship-users",
    AccessTokenTTL:  15 * time.Minute,
    RefreshTokenTTL: 7 * 24 * time.Hour,
    RememberTokenTTL: 30 * 24 * time.Hour,
    ResetTokenTTL:   1 * time.Hour,
    VerifyTokenTTL:  24 * time.Hour,
}

jwtService := NewJWTService(config, db)
```

### 2. Generate Token for Student User

```go
// For regular login
abilities := []string{"users.read", "courses.read"}
accessToken, err := jwtService.GenerateTokenForUser(
    user, 
    TokenTypeAccess, 
    abilities, 
    false, // rememberMe
    "device-fingerprint"
)

// For "remember me" login
accessToken, err := jwtService.GenerateTokenForUser(
    user, 
    TokenTypeAccess, 
    abilities, 
    true, // rememberMe - extends token lifetime
    "device-fingerprint"
)
```

### 3. Generate Token for Super Admin

```go
abilities := []string{"*"} // All permissions for super admin
accessToken, err := jwtService.GenerateTokenForSuperAdmin(
    admin, 
    TokenTypeAccess, 
    abilities, 
    false,
    "admin-device"
)
```

### 4. Validate Token

```go
result, err := jwtService.ValidateToken(tokenString)
if err != nil || !result.IsValid {
    // Handle invalid token
    return errors.New("invalid token")
}

// Access user data
switch result.Claims.UserType {
case UserTypeStudent:
    user := result.User.(*models.User)
    // Handle student user
case UserTypeSuperAdmin:
    admin := result.User.(*models.SuperAdmin)
    // Handle super admin
}

// Check permissions
if jwtService.HasAbility(result.Abilities, "users.write") {
    // User has permission to write users
}
```

### 5. Refresh Token

```go
// Generate refresh token
refreshToken, err := jwtService.GenerateTokenForUser(
    user, 
    TokenTypeRefresh, 
    abilities, 
    false,
    "device-fingerprint"
)

// Use refresh token to get new access token
newAccessToken, err := jwtService.RefreshToken(refreshToken.Token)
```

### 6. Token Revocation

```go
// Revoke specific token
err := jwtService.RevokeToken(tokenString)

// Revoke all tokens for a user
err := jwtService.RevokeAllTokens(user.StudentID, UserTypeStudent)

// Revoke all tokens except current one
err := jwtService.RevokeAllTokensExcept(
    user.StudentID, 
    UserTypeStudent, 
    currentTokenString
)
```

### 7. Password Reset Token

```go
resetToken, err := jwtService.GeneratePasswordResetToken(
    user.StudentID,
    UserTypeStudent,
    user.Email
)

// Validate reset token
result, err := jwtService.ValidateToken(resetToken.Token)
if err == nil && result.Claims.TokenType == TokenTypePasswordReset {
    // Valid password reset token
}
```

### 8. Email Verification Token

```go
verifyToken, err := jwtService.GenerateEmailVerificationToken(
    user.StudentID,
    UserTypeStudent,
    user.Email
)
```

## Token Structure

### JWT Claims
```go
type JWTClaims struct {
    UserID        string    `json:"user_id"`        // student_id or admin id
    UserType      UserType  `json:"user_type"`      // "User" or "SuperAdmin"
    Email         string    `json:"email"`
    TokenType     TokenType `json:"token_type"`
    Abilities     []string  `json:"abilities"`
    TokenID       string    `json:"jti"`            // JWT ID for revocation
    DeviceInfo    string    `json:"device_info"`    // Device fingerprint
    jwt.RegisteredClaims
}
```

### Database Token Record
```go
type AccessToken struct {
    ID            uint      `json:"id"`
    TokenableType string    `json:"tokenable_type"` // "User" or "SuperAdmin"
    TokenableID   string    `json:"tokenable_id"`   // student_id or admin id
    Name          string    `json:"name"`           // Token name/type
    Token         string    `json:"token"`          // JWT token string
    Abilities     string    `json:"abilities"`      // JSON array of abilities
    ExpiresAt     time.Time `json:"expires_at"`
    LastUsedAt    *time.Time `json:"last_used_at"`
    CreatedAt     time.Time `json:"created_at"`
    UpdatedAt     time.Time `json:"updated_at"`
}
```

## Permission System

### Ability Format
- **Exact Match**: `"users.read"` matches exactly `"users.read"`
- **Wildcard All**: `"*"` matches any permission
- **Wildcard Prefix**: `"users.*"` matches `"users.read"`, `"users.write"`, etc.

### Common Abilities
```go
// Student abilities
[]string{"courses.read", "assignments.read", "submissions.write"}

// Instructor abilities  
[]string{"courses.*", "students.read", "assignments.*"}

// Admin abilities
[]string{"*"} // All permissions

// Specific admin abilities
[]string{"users.*", "courses.*", "system.read"}
```

## Security Considerations

### 1. Token Storage
- Tokens are stored in database for revocation checking
- Expired tokens are automatically cleaned up
- Last used timestamp is tracked

### 2. Token Validation
- JWT signature verification
- Expiration time checking
- Database existence verification
- User existence verification

### 3. Device Tracking
- Device fingerprints stored in tokens
- Helps detect suspicious activity
- Can be used for device-based security

### 4. Token Rotation
- Refresh tokens are revoked when used
- New tokens generated with fresh expiration
- Prevents token replay attacks

## Maintenance

### Cleanup Expired Tokens
```go
// Run periodically (e.g., daily cron job)
err := jwtService.CleanupExpiredTokens()
```

### Monitor Active Tokens
```go
count, err := jwtService.GetActiveTokensCount(userID, userType)
if count > maxAllowedTokens {
    // Handle too many active sessions
}
```

## Error Handling

### Common Errors
- `"token parsing failed"`: Invalid JWT format
- `"token not found or expired"`: Token doesn't exist in database
- `"user not found"`: User referenced in token doesn't exist
- `"invalid user type"`: Unknown user type in token
- `"token is not a refresh token"`: Wrong token type for refresh operation

### Error Response Format
```go
type TokenVerificationResult struct {
    IsValid   bool        `json:"is_valid"`
    User      interface{} `json:"user,omitempty"`
    Claims    *JWTClaims  `json:"claims,omitempty"`
    Token     *AccessToken `json:"token,omitempty"`
    Abilities []string    `json:"abilities"`
    ExpiresAt time.Time   `json:"expires_at"`
    Error     string      `json:"error,omitempty"`
}
```

## Integration with Authentication Controllers

The JWT service integrates with authentication controllers to provide:

1. **Login Flow**: Generate access and refresh tokens
2. **Logout Flow**: Revoke tokens
3. **Token Refresh**: Exchange refresh tokens for new access tokens
4. **Password Reset**: Generate and validate reset tokens
5. **Email Verification**: Generate and validate verification tokens

## Testing

The service includes comprehensive tests covering:
- Token generation for both user types
- Token validation and verification
- Token refresh functionality
- Token revocation (individual and bulk)
- Permission checking
- Error handling scenarios
- Database integration

Run tests with:
```bash
go test ./internal/services -v -run TestJWTService
```