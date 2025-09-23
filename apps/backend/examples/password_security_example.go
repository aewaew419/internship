package main

import (
	"fmt"
	"log"

	"backend-go/internal/config"
	"backend-go/internal/services"
)

// Example demonstrating how to use the PasswordSecurityService
func main() {
	// Initialize password security service with production config
	passwordConfig := config.GetPasswordSecurityConfig()
	passwordService := services.NewPasswordSecurityService(passwordConfig)

	fmt.Println("=== Password Security Service Example ===\n")

	// Example 1: Password Strength Validation
	fmt.Println("1. Password Strength Validation:")
	testPasswords := []string{
		"weak",
		"Password123",
		"MyStr0ng!P@ssw0rd2023",
		"password123",
		"GoodPass123!",
	}

	for _, password := range testPasswords {
		result := passwordService.ValidatePasswordStrength(password)
		fmt.Printf("Password: %s\n", password)
		fmt.Printf("  Valid: %v, Score: %d/4\n", result.IsValid, result.Score)
		fmt.Printf("  Entropy: %.2f bits\n", result.Entropy)
		fmt.Printf("  Time to crack: %s\n", result.TimeToCrack)
		if len(result.Feedback) > 0 {
			fmt.Printf("  Feedback: %v\n", result.Feedback)
		}
		fmt.Println()
	}

	// Example 2: Password Hashing and Verification
	fmt.Println("2. Password Hashing and Verification:")
	testPassword := "MySecurePassword123!"
	
	// Hash the password
	hashedPassword, err := passwordService.HashPassword(testPassword)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}
	fmt.Printf("Original: %s\n", testPassword)
	fmt.Printf("Hashed: %s\n", hashedPassword)

	// Verify correct password
	isValid, err := passwordService.VerifyPassword(testPassword, hashedPassword)
	if err != nil {
		log.Fatalf("Failed to verify password: %v", err)
	}
	fmt.Printf("Verification (correct): %v\n", isValid)

	// Verify wrong password
	isValid, err = passwordService.VerifyPassword("WrongPassword", hashedPassword)
	if err != nil {
		log.Fatalf("Failed to verify password: %v", err)
	}
	fmt.Printf("Verification (wrong): %v\n", isValid)
	fmt.Println()

	// Example 3: Secure Password Generation
	fmt.Println("3. Secure Password Generation:")
	
	// Generate different types of passwords
	generationOptions := []services.PasswordGenerationOptions{
		{
			Length:              16,
			IncludeUppercase:    true,
			IncludeLowercase:    true,
			IncludeNumbers:      true,
			IncludeSpecialChars: true,
		},
		{
			Length:              12,
			IncludeUppercase:    true,
			IncludeLowercase:    true,
			IncludeNumbers:      true,
			IncludeSpecialChars: false,
		},
		{
			Length:              20,
			IncludeUppercase:    true,
			IncludeLowercase:    true,
			IncludeNumbers:      true,
			IncludeSpecialChars: true,
			ExcludeSimilar:      true,
			ExcludeAmbiguous:    true,
		},
	}

	for i, options := range generationOptions {
		password, err := passwordService.GenerateSecurePassword(options)
		if err != nil {
			log.Printf("Failed to generate password %d: %v", i+1, err)
			continue
		}
		
		fmt.Printf("Generated Password %d: %s\n", i+1, password)
		
		// Validate the generated password
		validation := passwordService.ValidatePasswordStrength(password)
		fmt.Printf("  Validation: Valid=%v, Score=%d/4\n", validation.IsValid, validation.Score)
		fmt.Println()
	}

	// Example 4: Configuration Examples
	fmt.Println("4. Configuration Examples:")
	
	// Development config (more lenient)
	devConfig := config.GetDevelopmentPasswordSecurityConfig()
	devService := services.NewPasswordSecurityService(devConfig)
	
	weakPassword := "pass123"
	devResult := devService.ValidatePasswordStrength(weakPassword)
	fmt.Printf("Development config - Password '%s': Valid=%v, Score=%d\n", 
		weakPassword, devResult.IsValid, devResult.Score)
	
	// Production config (stricter)
	prodConfig := config.GetProductionPasswordSecurityConfig()
	prodService := services.NewPasswordSecurityService(prodConfig)
	
	prodResult := prodService.ValidatePasswordStrength(weakPassword)
	fmt.Printf("Production config - Password '%s': Valid=%v, Score=%d\n", 
		weakPassword, prodResult.IsValid, prodResult.Score)
	fmt.Println()

	// Example 5: Thai Language Support
	fmt.Println("5. Thai Language Support:")
	thaiPasswords := []string{
		"รหัสผ่าน123",
		"MyThai!P@ss123",
		"StrongThaiPass2023!",
	}

	for _, password := range thaiPasswords {
		result := passwordService.ValidatePasswordStrength(password)
		fmt.Printf("Thai Password: %s\n", password)
		fmt.Printf("  Valid: %v, Score: %d/4\n", result.IsValid, result.Score)
		if len(result.Feedback) > 0 {
			fmt.Printf("  Feedback: %v\n", result.Feedback)
		}
		fmt.Println()
	}

	fmt.Println("=== Example Complete ===")
}

// ExampleIntegrationWithAuth demonstrates integration with authentication service
func ExampleIntegrationWithAuth() {
	// This would typically be called during application initialization
	
	// 1. Initialize password security service
	passwordConfig := config.GetPasswordSecurityConfig()
	passwordService := services.NewPasswordSecurityService(passwordConfig)
	
	// 2. Initialize other services (JWT, database, etc.)
	// db := initializeDatabase()
	// jwtService := services.NewJWTService(jwtConfig)
	
	// 3. Initialize enhanced auth service
	// authService := services.NewEnhancedAuthService(db, jwtService, passwordService)
	
	// 4. Use in registration endpoint
	registrationRequest := services.StudentRegistrationRequest{
		StudentID:       "64010001",
		Email:           "student@university.ac.th",
		Password:        "MySecurePassword123!",
		ConfirmPassword: "MySecurePassword123!",
		FullName:        "นักศึกษา ทดสอบ",
	}
	
	// Validate password before registration
	validation := passwordService.ValidatePasswordStrength(registrationRequest.Password)
	if !validation.IsValid {
		fmt.Printf("Registration failed: Password validation failed\n")
		fmt.Printf("Feedback: %v\n", validation.Feedback)
		return
	}
	
	fmt.Printf("Registration would succeed: Password is valid (Score: %d/4)\n", validation.Score)
	
	// 5. Use in login endpoint
	loginRequest := services.StudentLoginRequest{
		StudentID: "64010001",
		Password:  "MySecurePassword123!",
	}
	
	// Hash password for comparison (in real scenario, this would be from database)
	hashedPassword, _ := passwordService.HashPassword(loginRequest.Password)
	
	// Verify password during login
	isValid, err := passwordService.VerifyPassword(loginRequest.Password, hashedPassword)
	if err != nil {
		fmt.Printf("Login failed: Password verification error: %v\n", err)
		return
	}
	
	if isValid {
		fmt.Printf("Login would succeed: Password verification passed\n")
	} else {
		fmt.Printf("Login failed: Invalid password\n")
	}
}