package services

import (
	"strings"
	"testing"
)

func TestNewPasswordSecurityService(t *testing.T) {
	// Test with default config
	service := NewPasswordSecurityService(PasswordSecurityConfig{})
	
	if service.config.BcryptCost != 12 {
		t.Errorf("Expected default bcrypt cost 12, got %d", service.config.BcryptCost)
	}
	
	if service.config.MinLength != 8 {
		t.Errorf("Expected default min length 8, got %d", service.config.MinLength)
	}
	
	if service.config.MaxLength != 128 {
		t.Errorf("Expected default max length 128, got %d", service.config.MaxLength)
	}
	
	// Test with custom config
	customConfig := PasswordSecurityConfig{
		BcryptCost:          10,
		MinLength:           12,
		MaxLength:           64,
		RequireUppercase:    true,
		RequireLowercase:    true,
		RequireNumbers:      true,
		RequireSpecialChars: false,
	}
	
	customService := NewPasswordSecurityService(customConfig)
	if customService.config.BcryptCost != 10 {
		t.Errorf("Expected custom bcrypt cost 10, got %d", customService.config.BcryptCost)
	}
}

func TestHashPassword(t *testing.T) {
	service := NewPasswordSecurityService(PasswordSecurityConfig{})
	
	tests := []struct {
		name     string
		password string
		wantErr  bool
	}{
		{
			name:     "Valid password",
			password: "TestPassword123!",
			wantErr:  false,
		},
		{
			name:     "Empty password",
			password: "",
			wantErr:  true,
		},
		{
			name:     "Simple password",
			password: "password",
			wantErr:  false,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			hash, err := service.HashPassword(tt.password)
			
			if tt.wantErr {
				if err == nil {
					t.Errorf("Expected error for password '%s', got none", tt.password)
				}
				return
			}
			
			if err != nil {
				t.Errorf("Unexpected error: %v", err)
				return
			}
			
			if hash == "" {
				t.Error("Expected non-empty hash")
			}
			
			if hash == tt.password {
				t.Error("Hash should not equal original password")
			}
		})
	}
}

func TestVerifyPassword(t *testing.T) {
	service := NewPasswordSecurityService(PasswordSecurityConfig{})
	
	password := "TestPassword123!"
	hash, err := service.HashPassword(password)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}
	
	tests := []struct {
		name     string
		password string
		hash     string
		want     bool
		wantErr  bool
	}{
		{
			name:     "Correct password",
			password: password,
			hash:     hash,
			want:     true,
			wantErr:  false,
		},
		{
			name:     "Wrong password",
			password: "WrongPassword",
			hash:     hash,
			want:     false,
			wantErr:  false,
		},
		{
			name:     "Empty password",
			password: "",
			hash:     hash,
			want:     false,
			wantErr:  true,
		},
		{
			name:     "Empty hash",
			password: password,
			hash:     "",
			want:     false,
			wantErr:  true,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := service.VerifyPassword(tt.password, tt.hash)
			
			if tt.wantErr {
				if err == nil {
					t.Error("Expected error, got none")
				}
				return
			}
			
			if err != nil {
				t.Errorf("Unexpected error: %v", err)
				return
			}
			
			if result != tt.want {
				t.Errorf("Expected %v, got %v", tt.want, result)
			}
		})
	}
}

func TestValidatePasswordStrength(t *testing.T) {
	config := PasswordSecurityConfig{
		MinLength:           8,
		MaxLength:           128,
		RequireUppercase:    true,
		RequireLowercase:    true,
		RequireNumbers:      true,
		RequireSpecialChars: true,
		MinUniqueCharacters: 4,
		MaxRepeatingChars:   2,
	}
	service := NewPasswordSecurityService(config)
	
	tests := []struct {
		name            string
		password        string
		expectedValid   bool
		expectedScore   int
		expectedMinScore int
	}{
		{
			name:            "Very strong password",
			password:        "MyStr0ng!P@ssw0rd2023",
			expectedValid:   true,
			expectedMinScore: 3,
		},
		{
			name:            "Good password",
			password:        "GoodPass123!",
			expectedValid:   true,
			expectedMinScore: 2,
		},
		{
			name:            "Weak password - no uppercase",
			password:        "weakpass123!",
			expectedValid:   false,
			expectedScore:   0,
		},
		{
			name:            "Weak password - no special chars",
			password:        "WeakPass123",
			expectedValid:   false,
			expectedScore:   0,
		},
		{
			name:            "Weak password - too short",
			password:        "Wp1!",
			expectedValid:   false,
			expectedScore:   0,
		},
		{
			name:            "Weak password - common word",
			password:        "Password123!",
			expectedValid:   false,
			expectedScore:   0,
		},
		{
			name:            "Weak password - repeating chars",
			password:        "Passsss123!",
			expectedValid:   false,
			expectedScore:   0,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := service.ValidatePasswordStrength(tt.password)
			
			if result.IsValid != tt.expectedValid {
				t.Errorf("Expected valid=%v, got %v", tt.expectedValid, result.IsValid)
			}
			
			if tt.expectedMinScore > 0 && result.Score < tt.expectedMinScore {
				t.Errorf("Expected score >= %d, got %d", tt.expectedMinScore, result.Score)
			}
			
			if tt.expectedScore > 0 && result.Score != tt.expectedScore {
				t.Errorf("Expected score %d, got %d", tt.expectedScore, result.Score)
			}
			
			// Check that feedback is provided for invalid passwords
			if !result.IsValid && len(result.Feedback) == 0 {
				t.Error("Expected feedback for invalid password")
			}
			
			// Check entropy calculation
			if result.Entropy < 0 {
				t.Error("Entropy should not be negative")
			}
			
			// Check time to crack estimation
			if result.TimeToCrack == "" {
				t.Error("Time to crack should not be empty")
			}
		})
	}
}

func TestPasswordRequirements(t *testing.T) {
	config := PasswordSecurityConfig{
		MinLength:           8,
		MaxLength:           20,
		RequireUppercase:    true,
		RequireLowercase:    true,
		RequireNumbers:      true,
		RequireSpecialChars: true,
		MinUniqueCharacters: 4,
		MaxRepeatingChars:   2,
	}
	service := NewPasswordSecurityService(config)
	
	tests := []struct {
		name     string
		password string
		checks   map[string]bool
	}{
		{
			name:     "All requirements met",
			password: "GoodPass123!",
			checks: map[string]bool{
				"MinLength":        true,
				"MaxLength":        true,
				"HasUppercase":     true,
				"HasLowercase":     true,
				"HasNumbers":       true,
				"HasSpecialChars":  true,
				"UniqueCharacters": true,
				"NoRepeatingChars": true,
			},
		},
		{
			name:     "Missing uppercase",
			password: "goodpass123!",
			checks: map[string]bool{
				"HasUppercase": false,
			},
		},
		{
			name:     "Too short",
			password: "Gp1!",
			checks: map[string]bool{
				"MinLength": false,
			},
		},
		{
			name:     "Too many repeating chars",
			password: "Goooood123!",
			checks: map[string]bool{
				"NoRepeatingChars": false,
			},
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := service.checkPasswordRequirements(tt.password)
			
			for check, expected := range tt.checks {
				var actual bool
				switch check {
				case "MinLength":
					actual = req.MinLength
				case "MaxLength":
					actual = req.MaxLength
				case "HasUppercase":
					actual = req.HasUppercase
				case "HasLowercase":
					actual = req.HasLowercase
				case "HasNumbers":
					actual = req.HasNumbers
				case "HasSpecialChars":
					actual = req.HasSpecialChars
				case "UniqueCharacters":
					actual = req.UniqueCharacters
				case "NoRepeatingChars":
					actual = req.NoRepeatingChars
				}
				
				if actual != expected {
					t.Errorf("Check %s: expected %v, got %v", check, expected, actual)
				}
			}
		})
	}
}

func TestGenerateSecurePassword(t *testing.T) {
	service := NewPasswordSecurityService(PasswordSecurityConfig{})
	
	tests := []struct {
		name    string
		options PasswordGenerationOptions
		wantErr bool
	}{
		{
			name: "Default options",
			options: PasswordGenerationOptions{
				Length:              16,
				IncludeUppercase:    true,
				IncludeLowercase:    true,
				IncludeNumbers:      true,
				IncludeSpecialChars: true,
			},
			wantErr: false,
		},
		{
			name: "Long password",
			options: PasswordGenerationOptions{
				Length:              32,
				IncludeUppercase:    true,
				IncludeLowercase:    true,
				IncludeNumbers:      true,
				IncludeSpecialChars: true,
			},
			wantErr: false,
		},
		{
			name: "Letters only",
			options: PasswordGenerationOptions{
				Length:           12,
				IncludeUppercase: true,
				IncludeLowercase: true,
			},
			wantErr: false,
		},
		{
			name: "Exclude similar chars",
			options: PasswordGenerationOptions{
				Length:              16,
				IncludeUppercase:    true,
				IncludeLowercase:    true,
				IncludeNumbers:      true,
				IncludeSpecialChars: true,
				ExcludeSimilar:      true,
			},
			wantErr: false,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			password, err := service.GenerateSecurePassword(tt.options)
			
			if tt.wantErr {
				if err == nil {
					t.Error("Expected error, got none")
				}
				return
			}
			
			if err != nil {
				t.Errorf("Unexpected error: %v", err)
				return
			}
			
			// Check password length
			expectedLength := tt.options.Length
			if expectedLength == 0 {
				expectedLength = 16 // default
			}
			
			if len(password) != expectedLength {
				t.Errorf("Expected length %d, got %d", expectedLength, len(password))
			}
			
			// Check character types if required
			if tt.options.IncludeUppercase {
				if !service.hasUppercase(password) {
					t.Error("Expected uppercase characters")
				}
			}
			
			if tt.options.IncludeLowercase {
				if !service.hasLowercase(password) {
					t.Error("Expected lowercase characters")
				}
			}
			
			if tt.options.IncludeNumbers {
				if !service.hasNumbers(password) {
					t.Error("Expected numbers")
				}
			}
			
			if tt.options.IncludeSpecialChars {
				if !service.hasSpecialChars(password) {
					t.Error("Expected special characters")
				}
			}
			
			// Check for similar characters if excluded
			if tt.options.ExcludeSimilar {
				for _, char := range similarChars {
					if strings.ContainsRune(password, char) {
						t.Errorf("Found similar character '%c' in password when excluded", char)
					}
				}
			}
		})
	}
}

func TestPasswordWithPepper(t *testing.T) {
	config := PasswordSecurityConfig{
		Pepper: "secret-pepper-123",
	}
	service := NewPasswordSecurityService(config)
	
	password := "TestPassword123!"
	
	// Hash password with pepper
	hash, err := service.HashPassword(password)
	if err != nil {
		t.Fatalf("Failed to hash password: %v", err)
	}
	
	// Verify with correct password
	valid, err := service.VerifyPassword(password, hash)
	if err != nil {
		t.Fatalf("Failed to verify password: %v", err)
	}
	
	if !valid {
		t.Error("Password verification should succeed with correct password")
	}
	
	// Verify with wrong password
	valid, err = service.VerifyPassword("WrongPassword", hash)
	if err != nil {
		t.Fatalf("Failed to verify password: %v", err)
	}
	
	if valid {
		t.Error("Password verification should fail with wrong password")
	}
}

func TestHelperFunctions(t *testing.T) {
	service := NewPasswordSecurityService(PasswordSecurityConfig{})
	
	// Test character type detection
	tests := []struct {
		password    string
		hasUpper    bool
		hasLower    bool
		hasNumbers  bool
		hasSpecial  bool
		uniqueCount int
		maxRepeat   int
	}{
		{
			password:    "Password123!",
			hasUpper:    true,
			hasLower:    true,
			hasNumbers:  true,
			hasSpecial:  true,
			uniqueCount: 11,
			maxRepeat:   2, // 'ss' in Password
		},
		{
			password:    "lowercase",
			hasUpper:    false,
			hasLower:    true,
			hasNumbers:  false,
			hasSpecial:  false,
			uniqueCount: 8,
			maxRepeat:   1,
		},
		{
			password:    "UPPERCASE",
			hasUpper:    true,
			hasLower:    false,
			hasNumbers:  false,
			hasSpecial:  false,
			uniqueCount: 7,
			maxRepeat:   1,
		},
		{
			password:    "1234567890",
			hasUpper:    false,
			hasLower:    false,
			hasNumbers:  true,
			hasSpecial:  false,
			uniqueCount: 10,
			maxRepeat:   1,
		},
		{
			password:    "!@#$%^&*()",
			hasUpper:    false,
			hasLower:    false,
			hasNumbers:  false,
			hasSpecial:  true,
			uniqueCount: 10,
			maxRepeat:   1,
		},
		{
			password:    "aaabbbccc",
			hasUpper:    false,
			hasLower:    true,
			hasNumbers:  false,
			hasSpecial:  false,
			uniqueCount: 3,
			maxRepeat:   3,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.password, func(t *testing.T) {
			if service.hasUppercase(tt.password) != tt.hasUpper {
				t.Errorf("hasUppercase: expected %v, got %v", tt.hasUpper, service.hasUppercase(tt.password))
			}
			
			if service.hasLowercase(tt.password) != tt.hasLower {
				t.Errorf("hasLowercase: expected %v, got %v", tt.hasLower, service.hasLowercase(tt.password))
			}
			
			if service.hasNumbers(tt.password) != tt.hasNumbers {
				t.Errorf("hasNumbers: expected %v, got %v", tt.hasNumbers, service.hasNumbers(tt.password))
			}
			
			if service.hasSpecialChars(tt.password) != tt.hasSpecial {
				t.Errorf("hasSpecialChars: expected %v, got %v", tt.hasSpecial, service.hasSpecialChars(tt.password))
			}
			
			if service.countUniqueCharacters(tt.password) != tt.uniqueCount {
				t.Errorf("countUniqueCharacters: expected %d, got %d", tt.uniqueCount, service.countUniqueCharacters(tt.password))
			}
			
			if service.maxRepeatingChars(tt.password) != tt.maxRepeat {
				t.Errorf("maxRepeatingChars: expected %d, got %d", tt.maxRepeat, service.maxRepeatingChars(tt.password))
			}
		})
	}
}

func TestForbiddenWordsAndPatterns(t *testing.T) {
	config := PasswordSecurityConfig{
		ForbiddenPasswords: []string{"company", "secret"},
		ForbiddenPatterns:  []string{`\d{6,}`, `abc`}, // 6+ digits, "abc" sequence
	}
	service := NewPasswordSecurityService(config)
	
	tests := []struct {
		password           string
		hasForbiddenWords  bool
		hasForbiddenPattern bool
	}{
		{
			password:           "MyCompanyPassword",
			hasForbiddenWords:  true,
			hasForbiddenPattern: false,
		},
		{
			password:           "TopSecret123",
			hasForbiddenWords:  true,
			hasForbiddenPattern: false,
		},
		{
			password:           "Password123456",
			hasForbiddenWords:  true, // contains "password"
			hasForbiddenPattern: true, // contains 6+ digits
		},
		{
			password:           "MyAbcPassword",
			hasForbiddenWords:  true, // contains "password"
			hasForbiddenPattern: true, // contains "abc"
		},
		{
			password:           "GoodPass123!",
			hasForbiddenWords:  false,
			hasForbiddenPattern: false,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.password, func(t *testing.T) {
			hasWords := service.containsForbiddenWords(tt.password)
			hasPatterns := service.containsForbiddenPatterns(tt.password)
			
			if hasWords != tt.hasForbiddenWords {
				t.Errorf("containsForbiddenWords: expected %v, got %v", tt.hasForbiddenWords, hasWords)
			}
			
			if hasPatterns != tt.hasForbiddenPattern {
				t.Errorf("containsForbiddenPatterns: expected %v, got %v", tt.hasForbiddenPattern, hasPatterns)
			}
		})
	}
}

func BenchmarkHashPassword(b *testing.B) {
	service := NewPasswordSecurityService(PasswordSecurityConfig{})
	password := "TestPassword123!"
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := service.HashPassword(password)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkVerifyPassword(b *testing.B) {
	service := NewPasswordSecurityService(PasswordSecurityConfig{})
	password := "TestPassword123!"
	hash, err := service.HashPassword(password)
	if err != nil {
		b.Fatal(err)
	}
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := service.VerifyPassword(password, hash)
		if err != nil {
			b.Fatal(err)
		}
	}
}

func BenchmarkValidatePasswordStrength(b *testing.B) {
	service := NewPasswordSecurityService(PasswordSecurityConfig{})
	password := "TestPassword123!"
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = service.ValidatePasswordStrength(password)
	}
}

func BenchmarkGenerateSecurePassword(b *testing.B) {
	service := NewPasswordSecurityService(PasswordSecurityConfig{})
	options := PasswordGenerationOptions{
		Length:              16,
		IncludeUppercase:    true,
		IncludeLowercase:    true,
		IncludeNumbers:      true,
		IncludeSpecialChars: true,
	}
	
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, err := service.GenerateSecurePassword(options)
		if err != nil {
			b.Fatal(err)
		}
	}
}