package config

import (
	"backend-go/internal/services"
)

// GetPasswordSecurityConfig returns the password security configuration
func GetPasswordSecurityConfig() services.PasswordSecurityConfig {
	return services.PasswordSecurityConfig{
		// Hashing configuration
		BcryptCost: 12, // Higher cost for better security (recommended: 10-15)
		Pepper:     "", // Optional pepper for additional security (should be from env var)

		// Password length requirements
		MinLength: 8,   // Minimum password length
		MaxLength: 128, // Maximum password length

		// Character requirements
		RequireUppercase:    true, // Require at least one uppercase letter
		RequireLowercase:    true, // Require at least one lowercase letter
		RequireNumbers:      true, // Require at least one number
		RequireSpecialChars: true, // Require at least one special character

		// Security requirements
		MinUniqueCharacters: 4, // Minimum number of unique characters
		MaxRepeatingChars:   2, // Maximum consecutive repeating characters

		// Forbidden passwords (common weak passwords)
		ForbiddenPasswords: []string{
			// English common passwords
			"password", "123456", "password123", "admin", "qwerty", 
			"letmein", "welcome", "monkey", "1234567890", "abc123",
			"password1", "123456789", "welcome123", "admin123", 
			"root", "toor", "pass", "test", "guest", "user", 
			"login", "changeme", "newpassword", "secret", "default",

			// Thai common passwords
			"รหัสผ่าน", "ผู้ใช้", "รหัส", "เข้าสู่ระบบ", "ทดสอบ", 
			"แขก", "ผู้ดูแลระบบ", "ระบบ", "ข้อมูล",

			// University/Student related
			"student", "university", "college", "school", "education",
			"นักศึกษา", "มหาวิทยาลัย", "วิทยาลัย", "โรงเรียน", "การศึกษา",
		},

		// Forbidden patterns (regex patterns to avoid)
		ForbiddenPatterns: []string{
			`123456`,           // Sequential numbers
			`abcdef`,           // Sequential letters  
			`qwerty`,           // Keyboard patterns
			`(.)\1{3,}`,        // Same character repeated 4+ times
			`012345`,           // Sequential starting from 0
			`987654`,           // Reverse sequential
			`(?i)password`,     // Case-insensitive "password"
			`(?i)admin`,        // Case-insensitive "admin"
			`\d{8,}`,          // 8+ consecutive digits
			`[a-z]{8,}`,       // 8+ consecutive lowercase letters
			`[A-Z]{8,}`,       // 8+ consecutive uppercase letters
		},

		// Additional security settings
		PreventCommonWords:  true, // Prevent dictionary words
		PreventPersonalInfo: true, // Prevent personal information (if available)
	}
}

// GetDevelopmentPasswordSecurityConfig returns a more lenient config for development
func GetDevelopmentPasswordSecurityConfig() services.PasswordSecurityConfig {
	config := GetPasswordSecurityConfig()
	
	// More lenient settings for development
	config.BcryptCost = 10          // Lower cost for faster testing
	config.MinLength = 6            // Shorter minimum length
	config.RequireSpecialChars = false // Don't require special chars
	config.MinUniqueCharacters = 3  // Fewer unique characters required
	
	return config
}

// GetProductionPasswordSecurityConfig returns a strict config for production
func GetProductionPasswordSecurityConfig() services.PasswordSecurityConfig {
	config := GetPasswordSecurityConfig()
	
	// Stricter settings for production
	config.BcryptCost = 14          // Higher cost for better security
	config.MinLength = 12           // Longer minimum length
	config.MaxRepeatingChars = 1    // No repeating characters
	config.MinUniqueCharacters = 6  // More unique characters required
	
	// Add production-specific pepper from environment variable
	// config.Pepper = os.Getenv("PASSWORD_PEPPER")
	
	return config
}

// PasswordSecurityConfigFromEnv creates config from environment variables
func PasswordSecurityConfigFromEnv() services.PasswordSecurityConfig {
	// This function would read configuration from environment variables
	// For now, return the default production config
	return GetProductionPasswordSecurityConfig()
}