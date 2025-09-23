package services

import (
	"crypto/rand"
	"errors"
	"fmt"
	"math/big"
	"regexp"
	"strings"
	"unicode"

	"golang.org/x/crypto/bcrypt"
)

// PasswordSecurityService handles password security operations
type PasswordSecurityService struct {
	config PasswordSecurityConfig
}

// PasswordSecurityConfig contains configuration for password security
type PasswordSecurityConfig struct {
	// Hashing configuration
	BcryptCost int    `json:"bcrypt_cost"`
	Pepper     string `json:"pepper,omitempty"`

	// Validation configuration
	MinLength            int      `json:"min_length"`
	MaxLength            int      `json:"max_length"`
	RequireUppercase     bool     `json:"require_uppercase"`
	RequireLowercase     bool     `json:"require_lowercase"`
	RequireNumbers       bool     `json:"require_numbers"`
	RequireSpecialChars  bool     `json:"require_special_chars"`
	ForbiddenPasswords   []string `json:"forbidden_passwords"`
	ForbiddenPatterns    []string `json:"forbidden_patterns"`
	MinUniqueCharacters  int      `json:"min_unique_characters"`
	MaxRepeatingChars    int      `json:"max_repeating_chars"`
	PreventCommonWords   bool     `json:"prevent_common_words"`
	PreventPersonalInfo  bool     `json:"prevent_personal_info"`
}

// PasswordStrengthResult represents the result of password strength validation
type PasswordStrengthResult struct {
	IsValid      bool                       `json:"is_valid"`
	Score        int                        `json:"score"` // 0-4 (0=very weak, 4=very strong)
	Feedback     []string                   `json:"feedback"`
	Requirements PasswordRequirementsResult `json:"requirements"`
	Entropy      float64                    `json:"entropy"`
	TimeToCrack  string                     `json:"time_to_crack"`
}

// PasswordRequirementsResult shows which requirements are met
type PasswordRequirementsResult struct {
	MinLength           bool `json:"min_length"`
	MaxLength           bool `json:"max_length"`
	HasUppercase        bool `json:"has_uppercase"`
	HasLowercase        bool `json:"has_lowercase"`
	HasNumbers          bool `json:"has_numbers"`
	HasSpecialChars     bool `json:"has_special_chars"`
	NoForbiddenWords    bool `json:"no_forbidden_words"`
	NoForbiddenPatterns bool `json:"no_forbidden_patterns"`
	UniqueCharacters    bool `json:"unique_characters"`
	NoRepeatingChars    bool `json:"no_repeating_chars"`
}

// PasswordGenerationOptions contains options for password generation
type PasswordGenerationOptions struct {
	Length              int  `json:"length"`
	IncludeUppercase    bool `json:"include_uppercase"`
	IncludeLowercase    bool `json:"include_lowercase"`
	IncludeNumbers      bool `json:"include_numbers"`
	IncludeSpecialChars bool `json:"include_special_chars"`
	ExcludeSimilar      bool `json:"exclude_similar"` // Exclude similar looking characters (0, O, l, 1, etc.)
	ExcludeAmbiguous    bool `json:"exclude_ambiguous"` // Exclude ambiguous characters
}

// Common weak passwords list (subset for demonstration)
var commonWeakPasswords = []string{
	"password", "123456", "password123", "admin", "qwerty", "letmein",
	"welcome", "monkey", "1234567890", "abc123", "password1", "123456789",
	"welcome123", "admin123", "root", "toor", "pass", "test", "guest",
	"user", "login", "changeme", "newpassword", "secret", "default",
}

// Common Thai weak passwords
var commonThaiWeakPasswords = []string{
	"รหัsผ่าน", "123456", "password", "admin", "qwerty", "ผู้ใช้",
	"รหัส", "เข้าสู่ระบบ", "ทดสอบ", "แขก", "ผู้ดูแลระบบ",
}

// Character sets for password generation
const (
	uppercaseChars    = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	lowercaseChars    = "abcdefghijklmnopqrstuvwxyz"
	numberChars       = "0123456789"
	specialChars      = "!@#$%^&*()_+-=[]{}|;:,.<>?"
	similarChars      = "0O1lI|"
	ambiguousChars    = "{}[]()~,;.<>"
)

// NewPasswordSecurityService creates a new password security service
func NewPasswordSecurityService(config PasswordSecurityConfig) *PasswordSecurityService {
	// Set default values if not provided
	if config.BcryptCost == 0 {
		config.BcryptCost = 12 // Higher cost for better security
	}
	if config.MinLength == 0 {
		config.MinLength = 8
	}
	if config.MaxLength == 0 {
		config.MaxLength = 128
	}
	if config.MinUniqueCharacters == 0 {
		config.MinUniqueCharacters = 4
	}
	if config.MaxRepeatingChars == 0 {
		config.MaxRepeatingChars = 2
	}

	// Set default requirements
	if !config.RequireUppercase && !config.RequireLowercase && 
	   !config.RequireNumbers && !config.RequireSpecialChars {
		config.RequireUppercase = true
		config.RequireLowercase = true
		config.RequireNumbers = true
		config.RequireSpecialChars = true
	}

	return &PasswordSecurityService{
		config: config,
	}
}

// HashPassword hashes a password using bcrypt with optional pepper
func (p *PasswordSecurityService) HashPassword(password string) (string, error) {
	if password == "" {
		return "", errors.New("password cannot be empty")
	}

	// Add pepper if configured
	passwordToHash := password
	if p.config.Pepper != "" {
		passwordToHash = password + p.config.Pepper
	}

	// Generate hash
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(passwordToHash), p.config.BcryptCost)
	if err != nil {
		return "", fmt.Errorf("failed to hash password: %w", err)
	}

	return string(hashedPassword), nil
}

// VerifyPassword verifies if a password matches its hash
func (p *PasswordSecurityService) VerifyPassword(password, hash string) (bool, error) {
	if password == "" || hash == "" {
		return false, errors.New("password and hash cannot be empty")
	}

	// Add pepper if configured
	passwordToVerify := password
	if p.config.Pepper != "" {
		passwordToVerify = password + p.config.Pepper
	}

	// Compare password with hash
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(passwordToVerify))
	if err != nil {
		if errors.Is(err, bcrypt.ErrMismatchedHashAndPassword) {
			return false, nil
		}
		return false, fmt.Errorf("failed to verify password: %w", err)
	}

	return true, nil
}

// ValidatePasswordStrength validates password strength and returns detailed results
func (p *PasswordSecurityService) ValidatePasswordStrength(password string) PasswordStrengthResult {
	result := PasswordStrengthResult{
		Feedback: []string{},
		Score:    0,
	}

	// Check basic requirements
	result.Requirements = p.checkPasswordRequirements(password)
	
	// Calculate overall validity
	result.IsValid = p.isPasswordValid(result.Requirements)
	
	// Calculate strength score (0-4)
	result.Score = p.calculatePasswordScore(password, result.Requirements)
	
	// Calculate entropy
	result.Entropy = p.calculatePasswordEntropy(password)
	
	// Estimate time to crack
	result.TimeToCrack = p.estimateTimeToCrack(result.Entropy)
	
	// Generate feedback
	result.Feedback = p.generatePasswordFeedback(password, result.Requirements, result.Score)

	return result
}

// checkPasswordRequirements checks if password meets all requirements
func (p *PasswordSecurityService) checkPasswordRequirements(password string) PasswordRequirementsResult {
	req := PasswordRequirementsResult{}

	// Length checks
	req.MinLength = len(password) >= p.config.MinLength
	req.MaxLength = len(password) <= p.config.MaxLength

	// Character type checks
	req.HasUppercase = p.hasUppercase(password) || !p.config.RequireUppercase
	req.HasLowercase = p.hasLowercase(password) || !p.config.RequireLowercase
	req.HasNumbers = p.hasNumbers(password) || !p.config.RequireNumbers
	req.HasSpecialChars = p.hasSpecialChars(password) || !p.config.RequireSpecialChars

	// Forbidden words and patterns
	req.NoForbiddenWords = !p.containsForbiddenWords(password)
	req.NoForbiddenPatterns = !p.containsForbiddenPatterns(password)

	// Unique characters
	req.UniqueCharacters = p.countUniqueCharacters(password) >= p.config.MinUniqueCharacters

	// Repeating characters
	req.NoRepeatingChars = p.maxRepeatingChars(password) <= p.config.MaxRepeatingChars

	return req
}

// isPasswordValid checks if all required conditions are met
func (p *PasswordSecurityService) isPasswordValid(req PasswordRequirementsResult) bool {
	return req.MinLength && req.MaxLength && req.HasUppercase && req.HasLowercase &&
		   req.HasNumbers && req.HasSpecialChars && req.NoForbiddenWords &&
		   req.NoForbiddenPatterns && req.UniqueCharacters && req.NoRepeatingChars
}

// calculatePasswordScore calculates password strength score (0-4)
func (p *PasswordSecurityService) calculatePasswordScore(password string, req PasswordRequirementsResult) int {
	score := 0

	// Base score for meeting minimum requirements
	if req.MinLength && req.HasLowercase {
		score = 1
	}

	// Additional points for character diversity
	charTypes := 0
	if p.hasLowercase(password) {
		charTypes++
	}
	if p.hasUppercase(password) {
		charTypes++
	}
	if p.hasNumbers(password) {
		charTypes++
	}
	if p.hasSpecialChars(password) {
		charTypes++
	}

	if charTypes >= 3 {
		score = 2
	}
	if charTypes >= 4 {
		score = 3
	}

	// Bonus for length
	if len(password) >= 12 {
		score++
	}

	// Penalty for common patterns
	if p.containsForbiddenWords(password) || p.containsForbiddenPatterns(password) {
		score = max(0, score-2)
	}

	// Ensure score is within bounds
	if score > 4 {
		score = 4
	}

	return score
}

// calculatePasswordEntropy calculates password entropy in bits
func (p *PasswordSecurityService) calculatePasswordEntropy(password string) float64 {
	if len(password) == 0 {
		return 0
	}

	// Calculate character set size
	charsetSize := 0
	if p.hasLowercase(password) {
		charsetSize += 26
	}
	if p.hasUppercase(password) {
		charsetSize += 26
	}
	if p.hasNumbers(password) {
		charsetSize += 10
	}
	if p.hasSpecialChars(password) {
		charsetSize += len(specialChars)
	}

	if charsetSize == 0 {
		return 0
	}

	// Entropy = log2(charset_size^password_length)
	// Simplified calculation
	entropy := float64(len(password)) * log2(float64(charsetSize))
	
	// Adjust for patterns and repetition
	uniqueChars := p.countUniqueCharacters(password)
	if uniqueChars < len(password) {
		entropy *= float64(uniqueChars) / float64(len(password))
	}

	return entropy
}

// estimateTimeToCrack estimates time to crack password based on entropy
func (p *PasswordSecurityService) estimateTimeToCrack(entropy float64) string {
	if entropy <= 0 {
		return "ทันที"
	}

	// Assume 1 billion guesses per second
	guessesPerSecond := 1e9
	totalGuesses := pow2(entropy) / 2 // Average case

	seconds := totalGuesses / guessesPerSecond

	if seconds < 1 {
		return "น้อยกว่า 1 วินาที"
	} else if seconds < 60 {
		return fmt.Sprintf("%.0f วินาที", seconds)
	} else if seconds < 3600 {
		return fmt.Sprintf("%.0f นาที", seconds/60)
	} else if seconds < 86400 {
		return fmt.Sprintf("%.0f ชั่วโมง", seconds/3600)
	} else if seconds < 31536000 {
		return fmt.Sprintf("%.0f วัน", seconds/86400)
	} else {
		return fmt.Sprintf("%.0f ปี", seconds/31536000)
	}
}

// generatePasswordFeedback generates helpful feedback for password improvement
func (p *PasswordSecurityService) generatePasswordFeedback(password string, req PasswordRequirementsResult, score int) []string {
	feedback := []string{}

	// Length feedback
	if !req.MinLength {
		feedback = append(feedback, fmt.Sprintf("รหัสผ่านต้องมีอย่างน้อย %d ตัวอักษร", p.config.MinLength))
	}
	if !req.MaxLength {
		feedback = append(feedback, fmt.Sprintf("รหัสผ่านต้องไม่เกิน %d ตัวอักษร", p.config.MaxLength))
	}

	// Character type feedback
	if p.config.RequireUppercase && !p.hasUppercase(password) {
		feedback = append(feedback, "รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่")
	}
	if p.config.RequireLowercase && !p.hasLowercase(password) {
		feedback = append(feedback, "รหัสผ่านต้องมีตัวอักษรพิมพ์เล็ก")
	}
	if p.config.RequireNumbers && !p.hasNumbers(password) {
		feedback = append(feedback, "รหัสผ่านต้องมีตัวเลข")
	}
	if p.config.RequireSpecialChars && !p.hasSpecialChars(password) {
		feedback = append(feedback, "รหัสผ่านต้องมีอักขระพิเศษ (!@#$%^&* เป็นต้น)")
	}

	// Security feedback
	if !req.NoForbiddenWords {
		feedback = append(feedback, "รหัสผ่านไม่ควรใช้คำที่เดาได้ง่าย")
	}
	if !req.NoForbiddenPatterns {
		feedback = append(feedback, "รหัสผ่านไม่ควรใช้รูปแบบที่เดาได้ง่าย เช่น 123456 หรือ abcdef")
	}
	if !req.UniqueCharacters {
		feedback = append(feedback, fmt.Sprintf("รหัสผ่านควรมีตัวอักษรที่แตกต่างกันอย่างน้อย %d ตัว", p.config.MinUniqueCharacters))
	}
	if !req.NoRepeatingChars {
		feedback = append(feedback, fmt.Sprintf("รหัสผ่านไม่ควรมีตัวอักษรซ้ำกันเกิน %d ตัวติดต่อกัน", p.config.MaxRepeatingChars))
	}

	// Positive feedback for strong passwords
	if score >= 3 && len(feedback) == 0 {
		feedback = append(feedback, "รหัสผ่านมีความปลอดภัยดี")
	}
	if score >= 4 {
		feedback = append(feedback, "รหัสผ่านมีความปลอดภัยสูงมาก")
	}

	// Suggestions for improvement
	if score < 3 {
		if len(password) < 12 {
			feedback = append(feedback, "แนะนำให้ใช้รหัสผ่านยาวอย่างน้อย 12 ตัวอักษร")
		}
		feedback = append(feedback, "ใช้การผสมผสานตัวอักษรพิมพ์ใหญ่ พิมพ์เล็ก ตัวเลข และอักขระพิเศษ")
	}

	return feedback
}

// GenerateSecurePassword generates a cryptographically secure password
func (p *PasswordSecurityService) GenerateSecurePassword(options PasswordGenerationOptions) (string, error) {
	// Set default options
	if options.Length == 0 {
		options.Length = 16
	}
	if !options.IncludeUppercase && !options.IncludeLowercase && 
	   !options.IncludeNumbers && !options.IncludeSpecialChars {
		options.IncludeUppercase = true
		options.IncludeLowercase = true
		options.IncludeNumbers = true
		options.IncludeSpecialChars = true
	}

	// Build character set
	charset := ""
	requiredChars := ""

	if options.IncludeLowercase {
		chars := lowercaseChars
		if options.ExcludeSimilar {
			chars = removeSimilarChars(chars)
		}
		charset += chars
		requiredChars += string(chars[0]) // Ensure at least one
	}

	if options.IncludeUppercase {
		chars := uppercaseChars
		if options.ExcludeSimilar {
			chars = removeSimilarChars(chars)
		}
		charset += chars
		requiredChars += string(chars[0])
	}

	if options.IncludeNumbers {
		chars := numberChars
		if options.ExcludeSimilar {
			chars = removeSimilarChars(chars)
		}
		charset += chars
		requiredChars += string(chars[0])
	}

	if options.IncludeSpecialChars {
		chars := specialChars
		if options.ExcludeAmbiguous {
			chars = removeAmbiguousChars(chars)
		}
		charset += chars
		requiredChars += string(chars[0])
	}

	if len(charset) == 0 {
		return "", errors.New("no character types selected")
	}

	// Generate password
	password := make([]byte, options.Length)
	
	// First, add required characters to ensure all types are included
	for i, char := range requiredChars {
		if i < options.Length {
			password[i] = byte(char)
		}
	}

	// Fill the rest randomly
	for i := len(requiredChars); i < options.Length; i++ {
		randomIndex, err := rand.Int(rand.Reader, big.NewInt(int64(len(charset))))
		if err != nil {
			return "", fmt.Errorf("failed to generate random number: %w", err)
		}
		password[i] = charset[randomIndex.Int64()]
	}

	// Shuffle the password to avoid predictable patterns
	for i := len(password) - 1; i > 0; i-- {
		j, err := rand.Int(rand.Reader, big.NewInt(int64(i+1)))
		if err != nil {
			return "", fmt.Errorf("failed to generate random number for shuffle: %w", err)
		}
		password[i], password[j.Int64()] = password[j.Int64()], password[i]
	}

	return string(password), nil
}

// Helper functions

func (p *PasswordSecurityService) hasUppercase(s string) bool {
	for _, r := range s {
		if unicode.IsUpper(r) {
			return true
		}
	}
	return false
}

func (p *PasswordSecurityService) hasLowercase(s string) bool {
	for _, r := range s {
		if unicode.IsLower(r) {
			return true
		}
	}
	return false
}

func (p *PasswordSecurityService) hasNumbers(s string) bool {
	for _, r := range s {
		if unicode.IsDigit(r) {
			return true
		}
	}
	return false
}

func (p *PasswordSecurityService) hasSpecialChars(s string) bool {
	for _, r := range s {
		if strings.ContainsRune(specialChars, r) {
			return true
		}
	}
	return false
}

func (p *PasswordSecurityService) containsForbiddenWords(password string) bool {
	lowerPassword := strings.ToLower(password)
	
	// Check configured forbidden passwords
	for _, forbidden := range p.config.ForbiddenPasswords {
		if strings.Contains(lowerPassword, strings.ToLower(forbidden)) {
			return true
		}
	}
	
	// Check common weak passwords
	for _, weak := range commonWeakPasswords {
		if strings.Contains(lowerPassword, weak) {
			return true
		}
	}
	
	// Check Thai weak passwords
	for _, weak := range commonThaiWeakPasswords {
		if strings.Contains(password, weak) {
			return true
		}
	}
	
	return false
}

func (p *PasswordSecurityService) containsForbiddenPatterns(password string) bool {
	// Check configured forbidden patterns
	for _, pattern := range p.config.ForbiddenPatterns {
		matched, _ := regexp.MatchString(pattern, password)
		if matched {
			return true
		}
	}
	
	// Check common patterns
	commonPatterns := []string{
		`123456`,     // Sequential numbers
		`abcdef`,     // Sequential letters
		`qwerty`,     // Keyboard patterns
		`(.)\1{3,}`,  // Same character repeated 4+ times
		`012345`,     // Sequential starting from 0
		`987654`,     // Reverse sequential
	}
	
	for _, pattern := range commonPatterns {
		matched, _ := regexp.MatchString(pattern, strings.ToLower(password))
		if matched {
			return true
		}
	}
	
	return false
}

func (p *PasswordSecurityService) countUniqueCharacters(password string) int {
	unique := make(map[rune]bool)
	for _, r := range password {
		unique[r] = true
	}
	return len(unique)
}

func (p *PasswordSecurityService) maxRepeatingChars(password string) int {
	if len(password) == 0 {
		return 0
	}
	
	maxCount := 1
	currentCount := 1
	
	for i := 1; i < len(password); i++ {
		if password[i] == password[i-1] {
			currentCount++
		} else {
			if currentCount > maxCount {
				maxCount = currentCount
			}
			currentCount = 1
		}
	}
	
	if currentCount > maxCount {
		maxCount = currentCount
	}
	
	return maxCount
}

func removeSimilarChars(charset string) string {
	result := ""
	for _, char := range charset {
		if !strings.ContainsRune(similarChars, char) {
			result += string(char)
		}
	}
	return result
}

func removeAmbiguousChars(charset string) string {
	result := ""
	for _, char := range charset {
		if !strings.ContainsRune(ambiguousChars, char) {
			result += string(char)
		}
	}
	return result
}

// Mathematical helper functions
func log2(x float64) float64 {
	return 0.6931471805599453 * logN(x) // ln(2) * ln(x) = log2(x)
}

func logN(x float64) float64 {
	// Simple natural logarithm approximation
	if x <= 0 {
		return 0
	}
	// Using series expansion for ln(x)
	// This is a simplified implementation
	return 2.302585092994046 * log10Approx(x) // ln(10) * log10(x) = ln(x)
}

func log10Approx(x float64) float64 {
	if x <= 0 {
		return 0
	}
	// Simple log10 approximation
	count := 0.0
	for x >= 10 {
		x /= 10
		count++
	}
	for x < 1 {
		x *= 10
		count--
	}
	// Linear approximation for 1 <= x < 10
	return count + (x-1)/2.3
}

func pow2(x float64) float64 {
	if x <= 0 {
		return 1
	}
	// Simple 2^x approximation
	result := 1.0
	for i := 0; i < int(x); i++ {
		result *= 2
	}
	return result
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}