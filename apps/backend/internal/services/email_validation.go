package services

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/mail"
	"regexp"
	"strings"
	"time"

	"gorm.io/gorm"
)

// DomainValidationResult represents domain validation result
type DomainValidationResult struct {
	IsValid       bool     `json:"is_valid"`
	IsEducational bool     `json:"is_educational"`
	IsDisposable  bool     `json:"is_disposable"`
	Domain        string   `json:"domain"`
	Suggestions   []string `json:"suggestions"`
}

// EmailVerificationToken represents email verification token
type EmailVerificationToken struct {
	Token     string    `json:"token"`
	ExpiresAt time.Time `json:"expires_at"`
	Email     string    `json:"email"`
}

// EmailValidationResult represents comprehensive email validation result
type EmailValidationResult struct {
	IsValid     bool     `json:"is_valid"`
	Errors      []string `json:"errors"`
	Warnings    []string `json:"warnings"`
	Suggestions []string `json:"suggestions"`
}

// EmailValidationService handles email validation and management
type EmailValidationService struct {
	db *gorm.DB
}

// NewEmailValidationService creates a new email validation service
func NewEmailValidationService(db *gorm.DB) *EmailValidationService {
	return &EmailValidationService{db: db}
}

// Educational domain patterns
var educationalDomains = []string{
	".edu",
	".ac.th",
	".edu.th",
	".university.th",
	".ac.uk",
	".edu.au",
	".edu.sg",
	".edu.my",
}

// Common disposable email domains to block
var disposableDomains = []string{
	"10minutemail.com",
	"guerrillamail.com",
	"mailinator.com",
	"tempmail.org",
	"throwaway.email",
	"temp-mail.org",
	"yopmail.com",
	"maildrop.cc",
	"sharklasers.com",
	"guerrillamailblock.com",
}

// Allowed email domains for the system
var allowedDomains = []string{
	"gmail.com",
	"yahoo.com",
	"hotmail.com",
	"outlook.com",
	"live.com",
	"icloud.com",
	"protonmail.com",
	// Thai educational domains
	"student.chula.ac.th",
	"cp.su.ac.th",
	"kmitl.ac.th",
	"kmutt.ac.th",
	"ku.ac.th",
	"tu.ac.th",
	"buu.ac.th",
	"cmu.ac.th",
	"kku.ac.th",
	"psu.ac.th",
	"sut.ac.th",
}

// Common domain suggestions for typos
var domainSuggestions = map[string]string{
	"gmial.com":   "gmail.com",
	"gmai.com":    "gmail.com",
	"gmail.co":    "gmail.com",
	"yahooo.com":  "yahoo.com",
	"yaho.com":    "yahoo.com",
	"hotmial.com": "hotmail.com",
	"hotmai.com":  "hotmail.com",
	"outlok.com":  "outlook.com",
	"outloo.com":  "outlook.com",
}

// ValidateFormat validates email format using Go's built-in mail package
func (e *EmailValidationService) ValidateFormat(email string) bool {
	if email == "" {
		return false
	}

	cleanEmail := strings.TrimSpace(strings.ToLower(email))

	// Use Go's built-in email validation
	_, err := mail.ParseAddress(cleanEmail)
	if err != nil {
		return false
	}

	// Additional checks
	parts := strings.Split(cleanEmail, "@")
	if len(parts) != 2 {
		return false
	}

	localPart := parts[0]
	domain := parts[1]

	// Check local part length (max 64 characters)
	if len(localPart) > 64 {
		return false
	}

	// Check domain length (max 253 characters)
	if len(domain) > 253 {
		return false
	}

	// Check for consecutive dots
	if strings.Contains(cleanEmail, "..") {
		return false
	}

	// Check if starts or ends with dot
	if strings.HasPrefix(localPart, ".") || strings.HasSuffix(localPart, ".") {
		return false
	}

	return true
}

// CheckUniqueness checks if email is unique in the database for a specific user type
func (e *EmailValidationService) CheckUniqueness(email string, userType string) (bool, error) {
	cleanEmail := strings.TrimSpace(strings.ToLower(email))

	var count int64
	var err error

	if userType == "student" {
		err = e.db.Table("users").Where("email = ?", cleanEmail).Count(&count).Error
	} else {
		err = e.db.Table("super_admins").Where("email = ?", cleanEmail).Count(&count).Error
	}

	if err != nil {
		return false, err
	}

	return count == 0, nil
}

// ValidateDomain validates email domain and checks for educational/disposable domains
func (e *EmailValidationService) ValidateDomain(email string) DomainValidationResult {
	cleanEmail := strings.TrimSpace(strings.ToLower(email))
	parts := strings.Split(cleanEmail, "@")

	if len(parts) != 2 {
		return DomainValidationResult{
			IsValid:       false,
			IsEducational: false,
			IsDisposable:  false,
			Domain:        "",
			Suggestions:   []string{},
		}
	}

	domain := parts[1]

	result := DomainValidationResult{
		IsValid:       true,
		IsEducational: false,
		IsDisposable:  false,
		Domain:        domain,
		Suggestions:   []string{},
	}

	// Check if domain is disposable
	for _, disposable := range disposableDomains {
		if domain == disposable {
			result.IsDisposable = true
			result.IsValid = false
			break
		}
	}

	// Check if domain is educational
	for _, eduDomain := range educationalDomains {
		if strings.HasSuffix(domain, eduDomain) {
			result.IsEducational = true
			break
		}
	}

	// Check if domain is in allowed list
	isDomainAllowed := false
	for _, allowed := range allowedDomains {
		if domain == allowed {
			isDomainAllowed = true
			break
		}
	}

	if !isDomainAllowed && !result.IsEducational {
		result.IsValid = false
	}

	// Check for common typos and provide suggestions
	if suggestion, exists := domainSuggestions[domain]; exists {
		result.Suggestions = append(result.Suggestions, suggestion)
	}

	// Additional domain format validation
	if !e.isValidDomainFormat(domain) {
		result.IsValid = false
	}

	return result
}

// isValidDomainFormat checks if domain format is valid
func (e *EmailValidationService) isValidDomainFormat(domain string) bool {
	// Domain should not start or end with hyphen
	if strings.HasPrefix(domain, "-") || strings.HasSuffix(domain, "-") {
		return false
	}

	// Domain should have at least one dot
	if !strings.Contains(domain, ".") {
		return false
	}

	// Each part of domain should be valid
	parts := strings.Split(domain, ".")
	for _, part := range parts {
		if len(part) == 0 || len(part) > 63 {
			return false
		}

		// Should not start or end with hyphen
		if strings.HasPrefix(part, "-") || strings.HasSuffix(part, "-") {
			return false
		}

		// Should contain only alphanumeric characters and hyphens
		matched, _ := regexp.MatchString(`^[a-zA-Z0-9-]+$`, part)
		if !matched {
			return false
		}
	}

	return true
}

// GenerateVerificationToken generates email verification token
func (e *EmailValidationService) GenerateVerificationToken(email string) (EmailVerificationToken, error) {
	// Generate 32 random bytes
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return EmailVerificationToken{}, err
	}

	token := hex.EncodeToString(bytes)
	expiresAt := time.Now().Add(24 * time.Hour) // Token expires in 24 hours

	return EmailVerificationToken{
		Token:     token,
		ExpiresAt: expiresAt,
		Email:     strings.TrimSpace(strings.ToLower(email)),
	}, nil
}

// VerifyEmail verifies email using verification token
func (e *EmailValidationService) VerifyEmail(token string) (bool, error) {
	// In a real implementation, you would store verification tokens in database
	// For now, we'll implement a basic token validation

	if token == "" || len(token) != 64 {
		return false, nil
	}

	// Here you would:
	// 1. Find the verification token in database
	// 2. Check if it's not expired
	// 3. Update user's email_verified_at field
	// 4. Delete the verification token

	return true, nil
}

// ValidateEmail performs comprehensive email validation combining all checks
func (e *EmailValidationService) ValidateEmail(email string, userType string) (EmailValidationResult, error) {
	result := EmailValidationResult{
		IsValid:     true,
		Errors:      []string{},
		Warnings:    []string{},
		Suggestions: []string{},
	}

	// Check if email is provided
	if email == "" {
		result.IsValid = false
		result.Errors = append(result.Errors, "อีเมลจำเป็นต้องกรอก")
		return result, nil
	}

	// Check format
	if !e.ValidateFormat(email) {
		result.IsValid = false
		result.Errors = append(result.Errors, "รูปแบบอีเมลไม่ถูกต้อง")
		return result, nil
	}

	// Check domain
	domainValidation := e.ValidateDomain(email)
	if !domainValidation.IsValid {
		result.IsValid = false

		if domainValidation.IsDisposable {
			result.Errors = append(result.Errors, "ไม่อนุญาตให้ใช้อีเมลชั่วคราว")
		} else {
			result.Errors = append(result.Errors, "โดเมนอีเมลนี้ไม่ได้รับอนุญาต")
		}
	}

	// Add suggestions if available
	result.Suggestions = append(result.Suggestions, domainValidation.Suggestions...)

	// Check uniqueness
	isUnique, err := e.CheckUniqueness(email, userType)
	if err != nil {
		return result, err
	}

	if !isUnique {
		result.IsValid = false
		result.Errors = append(result.Errors, "อีเมลนี้ถูกใช้งานแล้ว")
	}

	// Add warnings for educational domains
	if domainValidation.IsEducational {
		result.Warnings = append(result.Warnings, "คุณใช้อีเมลสถาบันการศึกษา กรุณาตรวจสอบให้แน่ใจว่าสามารถเข้าถึงได้")
	}

	return result, nil
}

// NormalizeEmail normalizes email address for storage
func (e *EmailValidationService) NormalizeEmail(email string) string {
	return strings.TrimSpace(strings.ToLower(email))
}

// BelongsToDomain checks if email belongs to a specific domain
func (e *EmailValidationService) BelongsToDomain(email, domain string) bool {
	parts := strings.Split(strings.ToLower(email), "@")
	if len(parts) != 2 {
		return false
	}
	return parts[1] == strings.ToLower(domain)
}

// ExtractDomain extracts domain from email address
func (e *EmailValidationService) ExtractDomain(email string) string {
	parts := strings.Split(strings.ToLower(email), "@")
	if len(parts) != 2 {
		return ""
	}
	return parts[1]
}

// IsEducationalEmail checks if email is from educational institution
func (e *EmailValidationService) IsEducationalEmail(email string) bool {
	domain := e.ExtractDomain(email)
	for _, eduDomain := range educationalDomains {
		if strings.HasSuffix(domain, eduDomain) {
			return true
		}
	}
	return false
}

// ValidateAndFormat validates and formats email for storage
func (e *EmailValidationService) ValidateAndFormat(email string, userType string) (string, error) {
	validation, err := e.ValidateEmail(email, userType)
	if err != nil {
		return "", err
	}

	if !validation.IsValid {
		return "", fmt.Errorf("อีเมลไม่ถูกต้อง: %s", strings.Join(validation.Errors, ", "))
	}

	return e.NormalizeEmail(email), nil
}

// BatchValidate validates multiple email addresses
func (e *EmailValidationService) BatchValidate(emails []string, userType string) ([]EmailValidationResult, error) {
	results := make([]EmailValidationResult, len(emails))

	for i, email := range emails {
		result, err := e.ValidateEmail(email, userType)
		if err != nil {
			return nil, err
		}
		results[i] = result
	}

	return results, nil
}

// GetEmailStatistics returns statistics about email domains
func (e *EmailValidationService) GetEmailStatistics() (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Total emails
	var totalCount int64
	if err := e.db.Table("users").Count(&totalCount).Error; err != nil {
		return nil, err
	}
	stats["total_emails"] = totalCount

	// Educational emails count
	var eduCount int64
	eduQuery := "("
	for i, domain := range educationalDomains {
		if i > 0 {
			eduQuery += " OR "
		}
		eduQuery += fmt.Sprintf("email LIKE '%%%s'", domain)
	}
	eduQuery += ")"

	if err := e.db.Table("users").Where(eduQuery).Count(&eduCount).Error; err != nil {
		return nil, err
	}
	stats["educational_emails"] = eduCount

	// Top domains
	type DomainCount struct {
		Domain string `json:"domain"`
		Count  int64  `json:"count"`
	}

	var domainCounts []DomainCount
	query := `
		SELECT 
			SUBSTRING_INDEX(email, '@', -1) as domain,
			COUNT(*) as count
		FROM users 
		GROUP BY domain 
		ORDER BY count DESC 
		LIMIT 10
	`

	if err := e.db.Raw(query).Scan(&domainCounts).Error; err != nil {
		return nil, err
	}
	stats["top_domains"] = domainCounts

	return stats, nil
}