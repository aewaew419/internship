package services

import (
	"encoding/json"
	"fmt"
	"html"
	"regexp"
	"strings"
)

// SanitizationOptions represents options for input sanitization
type SanitizationOptions struct {
	AllowHTML           bool     `json:"allow_html"`
	AllowedTags         []string `json:"allowed_tags"`
	MaxLength           int      `json:"max_length"`
	TrimWhitespace      bool     `json:"trim_whitespace"`
	RemoveControlChars  bool     `json:"remove_control_chars"`
}

// SanitizationResult represents the result of input sanitization
type SanitizationResult struct {
	Sanitized      string   `json:"sanitized"`
	WasModified    bool     `json:"was_modified"`
	RemovedContent []string `json:"removed_content"`
	Warnings       []string `json:"warnings"`
}

// ThreatAssessment represents danger assessment of input
type ThreatAssessment struct {
	IsDangerous bool     `json:"is_dangerous"`
	Threats     []string `json:"threats"`
	RiskLevel   string   `json:"risk_level"` // "low", "medium", "high"
}

// InputSanitizationService handles input sanitization and security validation
type InputSanitizationService struct{}

// NewInputSanitizationService creates a new input sanitization service
func NewInputSanitizationService() *InputSanitizationService {
	return &InputSanitizationService{}
}

// HTML entities for encoding
var htmlEntities = map[string]string{
	"&":  "&amp;",
	"<":  "&lt;",
	">":  "&gt;",
	"\"": "&quot;",
	"'":  "&#x27;",
	"/":  "&#x2F;",
}

// Dangerous HTML tags that should always be removed
var dangerousTags = []string{
	"script", "iframe", "object", "embed", "form", "input", "button",
	"textarea", "select", "option", "meta", "link", "style", "base", "applet",
}

// Dangerous attributes that should be removed
var dangerousAttributes = []string{
	"onload", "onerror", "onclick", "onmouseover", "onmouseout", "onfocus",
	"onblur", "onchange", "onsubmit", "onreset", "onselect", "onkeydown",
	"onkeyup", "onkeypress", "javascript:", "vbscript:", "data:",
}

// SQL injection patterns to detect and block
var sqlInjectionPatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?i)\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|SCRIPT)\b`),
	regexp.MustCompile(`(--|\#|\/\*|\*\/)`),
	regexp.MustCompile(`(?i)\b(OR|AND)\s+\d+\s*=\s*\d+`),
	regexp.MustCompile(`(?i)\b(OR|AND)\s+['"]?\w+['"]?\s*=\s*['"]?\w+['"]?`),
	regexp.MustCompile(`(?i)UNION\s+SELECT`),
	regexp.MustCompile(`(?i)DROP\s+TABLE`),
}

// Control characters regex
var controlCharsRegex = regexp.MustCompile(`[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]`)

// SanitizeString sanitizes string input by removing/encoding dangerous content
func (s *InputSanitizationService) SanitizeString(input string, options SanitizationOptions) SanitizationResult {
	if input == "" {
		return SanitizationResult{
			Sanitized:      "",
			WasModified:    false,
			RemovedContent: []string{},
			Warnings:       []string{},
		}
	}

	result := SanitizationResult{
		Sanitized:      input,
		WasModified:    false,
		RemovedContent: []string{},
		Warnings:       []string{},
	}

	originalInput := input

	// Trim whitespace if requested
	if options.TrimWhitespace {
		result.Sanitized = strings.TrimSpace(result.Sanitized)
	}

	// Remove control characters
	if options.RemoveControlChars {
		beforeControlChars := result.Sanitized
		result.Sanitized = controlCharsRegex.ReplaceAllString(result.Sanitized, "")
		if beforeControlChars != result.Sanitized {
			result.WasModified = true
			result.RemovedContent = append(result.RemovedContent, "control characters")
		}
	}

	// Check for SQL injection patterns
	sqlThreats := s.detectSQLInjection(result.Sanitized)
	if len(sqlThreats) > 0 {
		result.Warnings = append(result.Warnings, "Potential SQL injection patterns detected")
		// For security, we might want to reject the input entirely
		return SanitizationResult{
			Sanitized:      "",
			WasModified:    true,
			RemovedContent: []string{"dangerous SQL patterns"},
			Warnings:       []string{"Input contains potentially dangerous SQL patterns"},
		}
	}

	// Handle HTML content
	if !options.AllowHTML {
		// Encode all HTML entities
		beforeHTMLEncoding := result.Sanitized
		result.Sanitized = s.encodeHTMLEntities(result.Sanitized)
		if beforeHTMLEncoding != result.Sanitized {
			result.WasModified = true
			result.RemovedContent = append(result.RemovedContent, "HTML content")
		}
	} else {
		// Remove dangerous HTML tags and attributes
		beforeHTMLSanitization := result.Sanitized
		result.Sanitized = s.sanitizeHTML(result.Sanitized, options.AllowedTags)
		if beforeHTMLSanitization != result.Sanitized {
			result.WasModified = true
			result.RemovedContent = append(result.RemovedContent, "dangerous HTML elements")
		}
	}

	// Check maximum length
	if options.MaxLength > 0 && len(result.Sanitized) > options.MaxLength {
		result.Sanitized = result.Sanitized[:options.MaxLength]
		result.WasModified = true
		result.RemovedContent = append(result.RemovedContent, "excess length")
		result.Warnings = append(result.Warnings, fmt.Sprintf("Input truncated to %d characters", options.MaxLength))
	}

	// Check if input was modified
	if originalInput != result.Sanitized {
		result.WasModified = true
	}

	return result
}

// encodeHTMLEntities encodes HTML entities to prevent XSS
func (s *InputSanitizationService) encodeHTMLEntities(input string) string {
	return html.EscapeString(input)
}

// sanitizeHTML sanitizes HTML content by removing dangerous tags and attributes
func (s *InputSanitizationService) sanitizeHTML(input string, allowedTags []string) string {
	sanitized := input

	// Remove dangerous tags
	for _, tag := range dangerousTags {
		regex := regexp.MustCompile(fmt.Sprintf(`(?i)<\/?%s[^>]*>`, regexp.QuoteMeta(tag)))
		sanitized = regex.ReplaceAllString(sanitized, "")
	}

	// Remove dangerous attributes
	for _, attr := range dangerousAttributes {
		regex := regexp.MustCompile(fmt.Sprintf(`(?i)\s%s\s*=\s*[^\s>]*`, regexp.QuoteMeta(attr)))
		sanitized = regex.ReplaceAllString(sanitized, "")
	}

	// If allowedTags is specified, remove all other tags
	if len(allowedTags) > 0 {
		allowedTagsPattern := strings.Join(allowedTags, "|")
		regex := regexp.MustCompile(fmt.Sprintf(`(?i)<(?!\/?(?:%s)\b)[^>]+>`, allowedTagsPattern))
		sanitized = regex.ReplaceAllString(sanitized, "")
	}

	return sanitized
}

// detectSQLInjection detects potential SQL injection patterns
func (s *InputSanitizationService) detectSQLInjection(input string) []string {
	var detected []string

	for _, pattern := range sqlInjectionPatterns {
		matches := pattern.FindAllString(input, -1)
		if matches != nil {
			detected = append(detected, matches...)
		}
	}

	return detected
}

// SanitizeEmail sanitizes email input
func (s *InputSanitizationService) SanitizeEmail(email string) string {
	if email == "" {
		return ""
	}

	// Remove whitespace and convert to lowercase
	sanitized := strings.TrimSpace(strings.ToLower(email))

	// Remove any HTML entities
	sanitized = s.encodeHTMLEntities(sanitized)

	// Remove control characters
	sanitized = controlCharsRegex.ReplaceAllString(sanitized, "")

	// Basic email format validation (remove obviously invalid characters)
	validEmailRegex := regexp.MustCompile(`[^a-zA-Z0-9@._+-]`)
	sanitized = validEmailRegex.ReplaceAllString(sanitized, "")

	return sanitized
}

// SanitizeStudentID sanitizes student ID input
func (s *InputSanitizationService) SanitizeStudentID(studentID string) string {
	if studentID == "" {
		return ""
	}

	// Remove whitespace
	sanitized := strings.TrimSpace(studentID)

	// Remove any non-numeric characters
	numericRegex := regexp.MustCompile(`[^0-9]`)
	sanitized = numericRegex.ReplaceAllString(sanitized, "")

	// Remove control characters
	sanitized = controlCharsRegex.ReplaceAllString(sanitized, "")

	return sanitized
}

// SanitizePassword sanitizes password input (minimal sanitization to preserve special characters)
func (s *InputSanitizationService) SanitizePassword(password string) (string, error) {
	if password == "" {
		return "", nil
	}

	// Only remove control characters, preserve everything else
	sanitized := controlCharsRegex.ReplaceAllString(password, "")

	// Check for SQL injection patterns (passwords shouldn't contain SQL)
	sqlPatterns := s.detectSQLInjection(sanitized)
	if len(sqlPatterns) > 0 {
		return "", fmt.Errorf("password contains invalid characters")
	}

	return sanitized, nil
}

// SanitizeName sanitizes name input (allow letters, spaces, and common name characters)
func (s *InputSanitizationService) SanitizeName(name string) string {
	if name == "" {
		return ""
	}

	// Trim whitespace
	sanitized := strings.TrimSpace(name)

	// Remove HTML entities
	sanitized = s.encodeHTMLEntities(sanitized)

	// Remove control characters
	sanitized = controlCharsRegex.ReplaceAllString(sanitized, "")

	// Allow letters (including Thai), spaces, hyphens, apostrophes, and dots
	validNameRegex := regexp.MustCompile(`[^a-zA-Z\p{Thai}\s\-'.]`)
	sanitized = validNameRegex.ReplaceAllString(sanitized, "")

	// Remove multiple consecutive spaces
	multiSpaceRegex := regexp.MustCompile(`\s+`)
	sanitized = multiSpaceRegex.ReplaceAllString(sanitized, " ")

	return sanitized
}

// SanitizeText sanitizes general text input
func (s *InputSanitizationService) SanitizeText(text string, options SanitizationOptions) string {
	defaultOptions := SanitizationOptions{
		AllowHTML:          false,
		TrimWhitespace:     true,
		RemoveControlChars: true,
	}

	// Merge with provided options
	if options.MaxLength > 0 {
		defaultOptions.MaxLength = options.MaxLength
	}
	if len(options.AllowedTags) > 0 {
		defaultOptions.AllowedTags = options.AllowedTags
		defaultOptions.AllowHTML = options.AllowHTML
	}

	result := s.SanitizeString(text, defaultOptions)
	return result.Sanitized
}

// SanitizeJSON sanitizes JSON input
func (s *InputSanitizationService) SanitizeJSON(jsonString string) (interface{}, error) {
	if jsonString == "" {
		return nil, nil
	}

	// First sanitize the string
	sanitized := s.SanitizeString(jsonString, SanitizationOptions{
		AllowHTML:          false,
		TrimWhitespace:     true,
		RemoveControlChars: true,
	})

	// Then parse as JSON
	var parsed interface{}
	if err := json.Unmarshal([]byte(sanitized.Sanitized), &parsed); err != nil {
		return nil, fmt.Errorf("invalid JSON format: %w", err)
	}

	// Recursively sanitize string values in the object
	return s.sanitizeJSONObject(parsed), nil
}

// sanitizeJSONObject recursively sanitizes string values in a JSON object
func (s *InputSanitizationService) sanitizeJSONObject(obj interface{}) interface{} {
	switch v := obj.(type) {
	case string:
		return s.SanitizeText(v, SanitizationOptions{})
	case []interface{}:
		for i, item := range v {
			v[i] = s.sanitizeJSONObject(item)
		}
		return v
	case map[string]interface{}:
		sanitized := make(map[string]interface{})
		for key, value := range v {
			sanitizedKey := s.SanitizeText(key, SanitizationOptions{})
			sanitized[sanitizedKey] = s.sanitizeJSONObject(value)
		}
		return sanitized
	default:
		return obj
	}
}

// SanitizeAuthRequest validates and sanitizes authentication request data
func (s *InputSanitizationService) SanitizeAuthRequest(data map[string]interface{}) map[string]interface{} {
	sanitized := make(map[string]interface{})

	for key, value := range data {
		if strValue, ok := value.(string); ok {
			switch key {
			case "student_id":
				sanitized[key] = s.SanitizeStudentID(strValue)
			case "email":
				sanitized[key] = s.SanitizeEmail(strValue)
			case "password", "confirm_password", "current_password", "new_password":
				if sanitizedPassword, err := s.SanitizePassword(strValue); err == nil {
					sanitized[key] = sanitizedPassword
				} else {
					sanitized[key] = ""
				}
			case "full_name":
				sanitized[key] = s.SanitizeName(strValue)
			default:
				sanitized[key] = s.SanitizeText(strValue, SanitizationOptions{})
			}
		} else {
			sanitized[key] = value
		}
	}

	return sanitized
}

// AssessDanger checks if input contains potentially dangerous content
func (s *InputSanitizationService) AssessDanger(input string) ThreatAssessment {
	threats := []string{}
	riskLevel := "low"

	// Check for SQL injection
	sqlPatterns := s.detectSQLInjection(input)
	if len(sqlPatterns) > 0 {
		threats = append(threats, "SQL injection patterns")
		riskLevel = "high"
	}

	// Check for XSS patterns
	xssRegex := regexp.MustCompile(`(?i)<script|javascript:|vbscript:|onload|onerror`)
	if xssRegex.MatchString(input) {
		threats = append(threats, "XSS patterns")
		riskLevel = "high"
	}

	// Check for path traversal
	pathTraversalRegex := regexp.MustCompile(`\.\.[\/\\]|\.\.%2f|\.\.%5c`)
	if pathTraversalRegex.MatchString(input) {
		threats = append(threats, "Path traversal patterns")
		if riskLevel == "low" {
			riskLevel = "medium"
		}
	}

	// Check for command injection
	commandInjectionRegex := regexp.MustCompile(`[;&|` + "`" + `$(){}[\]]`)
	if commandInjectionRegex.MatchString(input) {
		threats = append(threats, "Command injection characters")
		if riskLevel == "low" {
			riskLevel = "medium"
		}
	}

	return ThreatAssessment{
		IsDangerous: len(threats) > 0,
		Threats:     threats,
		RiskLevel:   riskLevel,
	}
}

// AssessRequestDanger assesses danger level of the entire request
func (s *InputSanitizationService) AssessRequestDanger(data map[string]interface{}) ThreatAssessment {
	allThreats := []string{}
	highestRisk := "low"

	// Check each string field in the request
	for key, value := range data {
		if strValue, ok := value.(string); ok {
			assessment := s.AssessDanger(strValue)
			if assessment.IsDangerous {
				for _, threat := range assessment.Threats {
					allThreats = append(allThreats, fmt.Sprintf("%s: %s", key, threat))
				}

				// Update highest risk level
				if assessment.RiskLevel == "high" || (assessment.RiskLevel == "medium" && highestRisk == "low") {
					highestRisk = assessment.RiskLevel
				}
			}
		}
	}

	return ThreatAssessment{
		IsDangerous: len(allThreats) > 0,
		Threats:     allThreats,
		RiskLevel:   highestRisk,
	}
}