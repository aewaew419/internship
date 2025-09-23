# Password Security Service Documentation

## Overview

The `PasswordSecurityService` is a comprehensive password security solution that provides advanced password hashing, validation, strength assessment, and secure password generation capabilities. It's designed to meet the requirements of the authentication system enhancement for the Mac Pro Tasks project.

## Features

### 🔐 Password Hashing
- **bcrypt** hashing with configurable cost factor
- Optional **pepper** support for additional security
- Secure password verification

### 🛡️ Password Strength Validation
- Comprehensive strength assessment (0-4 score)
- Detailed requirement checking
- Entropy calculation
- Time-to-crack estimation
- Thai language support

### 🎯 Security Requirements
- Configurable character requirements (uppercase, lowercase, numbers, special chars)
- Forbidden password detection (common weak passwords)
- Pattern-based validation (regex patterns)
- Unique character counting
- Repeating character limits

### 🔧 Password Generation
- Cryptographically secure password generation
- Customizable character sets
- Similar character exclusion (0, O, l, 1, etc.)
- Ambiguous character exclusion

## Configuration

### Basic Configuration

```go
config := services.PasswordSecurityConfig{
    // Hashing
    BcryptCost: 12,
    Pepper:     "optional-secret-pepper",
    
    // Length requirements
    MinLength: 8,
    MaxLength: 128,
    
    // Character requirements
    RequireUppercase:    true,
    RequireLowercase:    true,
    RequireNumbers:      true,
    RequireSpecialChars: true,
    
    // Security requirements
    MinUniqueCharacters: 4,
    MaxRepeatingChars:   2,
    
    // Forbidden content
    ForbiddenPasswords: []string{"password", "123456"},
    ForbiddenPatterns:  []string{`\d{6,}`, `(.)\1{3,}`},
}

service := services.NewPasswordSecurityService(config)
```

### Environment-Based Configuration

```go
// Use predefined configurations
prodConfig := config.GetProductionPasswordSecurityConfig()
devConfig := config.GetDevelopmentPasswordSecurityConfig()

// Or create from environment variables
envConfig := config.PasswordSecurityConfigFromEnv()
```

## Usage Examples

### 1. Password Hashing and Verification

```go
// Hash a password
hashedPassword, err := service.HashPassword("MySecurePassword123!")
if err != nil {
    log.Fatal(err)
}

// Verify password
isValid, err := service.VerifyPassword("MySecurePassword123!", hashedPassword)
if err != nil {
    log.Fatal(err)
}

if isValid {
    fmt.Println("Password is correct")
}
```

### 2. Password Strength Validation

```go
result := service.ValidatePasswordStrength("MyPassword123!")

fmt.Printf("Valid: %v\n", result.IsValid)
fmt.Printf("Score: %d/4\n", result.Score)
fmt.Printf("Entropy: %.2f bits\n", result.Entropy)
fmt.Printf("Time to crack: %s\n", result.TimeToCrack)

if !result.IsValid {
    fmt.Printf("Issues: %v\n", result.Feedback)
}

// Check specific requirements
if !result.Requirements.HasUppercase {
    fmt.Println("Password needs uppercase letters")
}
```

### 3. Secure Password Generation

```go
options := services.PasswordGenerationOptions{
    Length:              16,
    IncludeUppercase:    true,
    IncludeLowercase:    true,
    IncludeNumbers:      true,
    IncludeSpecialChars: true,
    ExcludeSimilar:      true,  // Exclude 0, O, l, 1, etc.
    ExcludeAmbiguous:    true,  // Exclude {}, [], etc.
}

password, err := service.GenerateSecurePassword(options)
if err != nil {
    log.Fatal(err)
}

fmt.Printf("Generated password: %s\n", password)
```

## Integration with Authentication Service

### Enhanced Auth Service

```go
// Initialize services
passwordService := services.NewPasswordSecurityService(config)
authService := services.NewEnhancedAuthService(db, jwtService, passwordService)

// Student registration with password validation
func RegisterStudent(req StudentRegistrationRequest) error {
    // Password strength is automatically validated
    user, err := authService.StudentRegister(req)
    if err != nil {
        return err // Will include password validation errors
    }
    
    return nil
}

// Password change with validation
func ChangePassword(studentID, current, new, confirm string) error {
    return authService.ChangePassword(studentID, current, new, confirm)
}
```

### API Endpoint Integration

```go
// Password validation endpoint for real-time feedback
func ValidatePasswordEndpoint(c *gin.Context) {
    var req struct {
        Password string `json:"password"`
    }
    
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    result := authService.ValidatePasswordStrength(req.Password)
    c.JSON(200, result)
}

// Secure password generation endpoint
func GeneratePasswordEndpoint(c *gin.Context) {
    var req struct {
        Length int `json:"length"`
    }
    
    c.ShouldBindJSON(&req)
    
    password, err := authService.GenerateSecurePassword(req.Length)
    if err != nil {
        c.JSON(500, gin.H{"error": err.Error()})
        return
    }
    
    c.JSON(200, gin.H{"password": password})
}
```

## Password Strength Scoring

The service uses a 0-4 scoring system:

- **0**: Very weak (fails basic requirements)
- **1**: Weak (meets minimum length and basic character types)
- **2**: Fair (includes multiple character types)
- **3**: Good (strong character diversity, good length)
- **4**: Excellent (very strong, long, diverse)

### Scoring Factors

1. **Character Diversity**: Different character types (uppercase, lowercase, numbers, special)
2. **Length**: Longer passwords get bonus points
3. **Uniqueness**: More unique characters increase score
4. **Patterns**: Common patterns reduce score
5. **Forbidden Content**: Weak passwords get penalized

## Security Features

### Forbidden Password Detection

The service detects and prevents:
- Common weak passwords (password, 123456, admin, etc.)
- Thai weak passwords (รหัสผ่าน, ผู้ใช้, etc.)
- University-related weak passwords (student, university, etc.)
- Custom forbidden passwords from configuration

### Pattern Detection

Prevents common patterns:
- Sequential numbers (123456, 987654)
- Sequential letters (abcdef, qwerty)
- Keyboard patterns (qwerty, asdf)
- Excessive character repetition (aaaa, 1111)

### Entropy Calculation

Calculates password entropy based on:
- Character set size
- Password length
- Character uniqueness
- Pattern detection

## Thai Language Support

The service includes comprehensive Thai language support:

### Thai Error Messages
- All feedback messages are provided in Thai
- Culturally appropriate error descriptions
- Clear, actionable suggestions

### Thai Weak Password Detection
- Common Thai passwords (รหัสผ่าน, ผู้ใช้)
- Thai keyboard patterns
- Thai educational terms

### Example Thai Feedback
```
"รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"
"รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่"
"รหัสผ่านไม่ควรใช้คำที่เดาได้ง่าย"
"รหัสผ่านมีความปลอดภัยดี"
```

## Performance Considerations

### Bcrypt Cost Factor
- **Development**: 10 (faster for testing)
- **Production**: 12-14 (recommended for security)
- **High Security**: 15+ (slower but more secure)

### Caching
- Password validation results can be cached for UI feedback
- Generated passwords should not be cached
- Hash verification is intentionally slow (bcrypt design)

### Memory Usage
- Service is stateless and thread-safe
- Minimal memory footprint
- No persistent state required

## Testing

The service includes comprehensive tests:

```bash
# Run all password security tests
go test ./internal/services -v -run TestPasswordSecurity

# Run specific test categories
go test ./internal/services -v -run TestHashPassword
go test ./internal/services -v -run TestValidatePasswordStrength
go test ./internal/services -v -run TestGenerateSecurePassword

# Run benchmarks
go test ./internal/services -bench=BenchmarkPassword
```

### Test Coverage
- ✅ Password hashing and verification
- ✅ Strength validation with various scenarios
- ✅ Secure password generation
- ✅ Configuration validation
- ✅ Thai language support
- ✅ Error handling
- ✅ Performance benchmarks

## Best Practices

### 1. Configuration
```go
// Use environment-specific configurations
if os.Getenv("ENV") == "production" {
    config = config.GetProductionPasswordSecurityConfig()
} else {
    config = config.GetDevelopmentPasswordSecurityConfig()
}
```

### 2. Error Handling
```go
// Always handle password service errors
hashedPassword, err := service.HashPassword(password)
if err != nil {
    log.Printf("Password hashing failed: %v", err)
    return errors.New("internal server error")
}
```

### 3. Security
```go
// Use pepper from environment variables
config.Pepper = os.Getenv("PASSWORD_PEPPER")

// Validate passwords before hashing
result := service.ValidatePasswordStrength(password)
if !result.IsValid {
    return fmt.Errorf("password validation failed: %v", result.Feedback)
}
```

### 4. User Experience
```go
// Provide real-time feedback
func validatePasswordRealtime(password string) {
    result := service.ValidatePasswordStrength(password)
    
    // Send feedback to frontend
    feedback := map[string]interface{}{
        "score":        result.Score,
        "isValid":      result.IsValid,
        "feedback":     result.Feedback,
        "requirements": result.Requirements,
    }
    
    // Update UI with feedback
}
```

## Migration from Existing System

### Step 1: Install New Service
```go
// Add to existing auth service
type AuthService struct {
    db                      *gorm.DB
    jwtService              *JWTService
    passwordSecurityService *PasswordSecurityService // Add this
}
```

### Step 2: Update Password Hashing
```go
// Replace existing bcrypt calls
// OLD:
// hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

// NEW:
hashedPassword, err := a.passwordSecurityService.HashPassword(password)
if err != nil {
    return fmt.Errorf("password hashing failed: %w", err)
}
```

### Step 3: Add Validation
```go
// Add password validation to registration
func (a *AuthService) Register(req RegisterRequest) error {
    // Validate password strength
    result := a.passwordSecurityService.ValidatePasswordStrength(req.Password)
    if !result.IsValid {
        return fmt.Errorf("password validation failed: %v", result.Feedback)
    }
    
    // Continue with existing registration logic...
}
```

## Troubleshooting

### Common Issues

1. **High CPU Usage**
   - Check bcrypt cost factor (should be 10-14)
   - Consider caching validation results for UI

2. **Memory Issues**
   - Service is stateless, check for memory leaks elsewhere
   - Ensure proper error handling

3. **Slow Performance**
   - bcrypt is intentionally slow for security
   - Use appropriate cost factor for environment
   - Consider async processing for batch operations

4. **Validation Too Strict**
   - Adjust configuration for your requirements
   - Use development config for testing
   - Customize forbidden passwords list

### Debug Mode
```go
// Enable debug logging
config.DebugMode = true
service := services.NewPasswordSecurityService(config)

// This will log detailed validation information
result := service.ValidatePasswordStrength(password)
```

## Security Considerations

1. **Pepper Storage**: Store pepper in environment variables, not in code
2. **Cost Factor**: Use appropriate bcrypt cost for your hardware
3. **Rate Limiting**: Implement rate limiting for password validation endpoints
4. **Logging**: Don't log actual passwords, only validation results
5. **Memory**: Clear password variables after use when possible

## Future Enhancements

- [ ] Integration with breach databases (HaveIBeenPwned)
- [ ] Machine learning-based pattern detection
- [ ] Biometric password strength assessment
- [ ] Advanced entropy calculation methods
- [ ] Password aging and rotation policies
- [ ] Multi-language support expansion