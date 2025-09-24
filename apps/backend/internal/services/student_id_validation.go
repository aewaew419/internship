package services

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"
)

// StudentIdInfo represents parsed student ID information
type StudentIdInfo struct {
	Year       string `json:"year"`
	Faculty    string `json:"faculty"`
	Department string `json:"department"`
	Sequence   string `json:"sequence"`
	IsValid    bool   `json:"is_valid"`
}

// ValidationResult represents validation result with errors and warnings
type ValidationResult struct {
	IsValid  bool     `json:"is_valid"`
	Errors   []string `json:"errors"`
	Warnings []string `json:"warnings"`
}

// StudentIdValidationService handles student ID validation and management
type StudentIdValidationService struct {
	db *gorm.DB
}

// NewStudentIdValidationService creates a new student ID validation service
func NewStudentIdValidationService(db *gorm.DB) *StudentIdValidationService {
	return &StudentIdValidationService{db: db}
}

// Regular expression for student ID format validation
// Format: YYYYFFDDSSS (Year + Faculty + Department + Sequence)
// Example: 67010001234 (Year 67, Faculty 01, Department 00, Sequence 01234)
var studentIdRegex = regexp.MustCompile(`^(\d{2})(\d{2})(\d{2})(\d{5})$`)

// Valid faculty codes (can be extended based on university structure)
var validFacultyCodes = map[string]string{
	"01": "คณะวิศวกรรมศาสตร์",
	"02": "คณะวิทยาศาสตร์",
	"03": "คณะแพทยศาสตร์",
	"04": "คณะศิลปศาสตร์",
	"05": "คณะบริหารธุรกิจ",
	"06": "คณะศึกษาศาสตร์",
	"07": "คณะเกษตรศาสตร์",
	"08": "คณะสัตวแพทยศาสตร์",
	"09": "คณะทันตแพทยศาสตร์",
	"10": "คณะเภสัชศาสตร์",
	"11": "คณะพยาบาลศาสตร์",
	"12": "คณะสาธารณสุขศาสตร์",
	"13": "คณะศิลปกรรมศาสตร์",
	"14": "คณะสถาปัตยกรรมศาสตร์",
	"15": "คณะนิติศาสตร์",
}

// ValidateFormat validates student ID format and structure
func (s *StudentIdValidationService) ValidateFormat(studentId string) ValidationResult {
	result := ValidationResult{
		IsValid:  true,
		Errors:   []string{},
		Warnings: []string{},
	}

	// Check if student ID is provided
	if studentId == "" {
		result.IsValid = false
		result.Errors = append(result.Errors, "รหัสนักศึกษาจำเป็นต้องกรอก")
		return result
	}

	// Remove any whitespace
	cleanStudentId := strings.TrimSpace(studentId)

	// Check length
	if len(cleanStudentId) != 11 {
		result.IsValid = false
		result.Errors = append(result.Errors, "รหัสนักศึกษาต้องมี 11 หลัก")
		return result
	}

	// Check if contains only numbers
	if !regexp.MustCompile(`^\d+$`).MatchString(cleanStudentId) {
		result.IsValid = false
		result.Errors = append(result.Errors, "รหัสนักศึกษาต้องประกอบด้วยตัวเลขเท่านั้น")
		return result
	}

	// Check format using regex
	matches := studentIdRegex.FindStringSubmatch(cleanStudentId)
	if matches == nil {
		result.IsValid = false
		result.Errors = append(result.Errors, "รูปแบบรหัสนักศึกษาไม่ถูกต้อง (ต้องเป็น 11 หลัก: YYYYFFDDSSS)")
		return result
	}

	year := matches[1]
	faculty := matches[2]
	_ = matches[3] // department - not used in current validation
	sequence := matches[4]

	// Validate year (should be reasonable)
	currentYear := time.Now().Year()
	yearInt, _ := strconv.Atoi("20" + year)

	if yearInt < 2000 || yearInt > currentYear+1 {
		result.IsValid = false
		result.Errors = append(result.Errors, "ปีในรหัสนักศึกษาไม่ถูกต้อง")
	}

	// Validate faculty code
	if _, exists := validFacultyCodes[faculty]; !exists {
		result.Warnings = append(result.Warnings, fmt.Sprintf("รหัสคณะ %s อาจไม่ถูกต้อง", faculty))
	}

	// Validate sequence (should not be all zeros)
	if sequence == "00000" {
		result.IsValid = false
		result.Errors = append(result.Errors, "หมายเลขลำดับในรหัสนักศึกษาไม่ถูกต้อง")
	}

	return result
}

// CheckUniqueness checks if student ID is unique in the database
func (s *StudentIdValidationService) CheckUniqueness(studentId string) (bool, error) {
	var count int64
	err := s.db.Table("users").Where("student_id = ?", strings.TrimSpace(studentId)).Count(&count).Error
	if err != nil {
		return false, err
	}
	return count == 0, nil
}

// ParseStudentId parses student ID into its components
func (s *StudentIdValidationService) ParseStudentId(studentId string) StudentIdInfo {
	cleanStudentId := strings.TrimSpace(studentId)
	matches := studentIdRegex.FindStringSubmatch(cleanStudentId)

	if matches == nil {
		return StudentIdInfo{
			Year:       "",
			Faculty:    "",
			Department: "",
			Sequence:   "",
			IsValid:    false,
		}
	}

	return StudentIdInfo{
		Year:       matches[1],
		Faculty:    matches[2],
		Department: matches[3],
		Sequence:   matches[4],
		IsValid:    true,
	}
}

// GenerateStudentId generates a new student ID (for testing or migration purposes)
func (s *StudentIdValidationService) GenerateStudentId(year, faculty, department string) string {
	currentYear := time.Now().Year()
	
	if year == "" {
		year = fmt.Sprintf("%02d", currentYear%100)
	}
	if faculty == "" {
		faculty = "01"
	}
	if department == "" {
		department = "00"
	}

	// Generate a random sequence number
	sequence := fmt.Sprintf("%05d", time.Now().UnixNano()%99999)

	return fmt.Sprintf("%s%s%s%s", year, faculty, department, sequence)
}

// GetFacultyName returns faculty name from faculty code
func (s *StudentIdValidationService) GetFacultyName(facultyCode string) string {
	if name, exists := validFacultyCodes[facultyCode]; exists {
		return name
	}
	return "ไม่ทราบคณะ"
}

// ValidateAndFormat validates and formats student ID for storage
func (s *StudentIdValidationService) ValidateAndFormat(studentId string) (string, error) {
	validation := s.ValidateFormat(studentId)

	if !validation.IsValid {
		return "", fmt.Errorf("รหัสนักศึกษาไม่ถูกต้อง: %s", strings.Join(validation.Errors, ", "))
	}

	return strings.TrimSpace(studentId), nil
}

// BatchValidate validates multiple student IDs
func (s *StudentIdValidationService) BatchValidate(studentIds []string) []ValidationResult {
	results := make([]ValidationResult, len(studentIds))
	for i, id := range studentIds {
		results[i] = s.ValidateFormat(id)
	}
	return results
}

// BelongsToAcademicYear checks if student ID belongs to a specific academic year
func (s *StudentIdValidationService) BelongsToAcademicYear(studentId string, academicYear int) bool {
	parsed := s.ParseStudentId(studentId)
	if !parsed.IsValid {
		return false
	}

	yearInt, err := strconv.Atoi("20" + parsed.Year)
	if err != nil {
		return false
	}

	return yearInt == academicYear
}

// GetStudentsByFaculty returns count of students by faculty code
func (s *StudentIdValidationService) GetStudentsByFaculty(facultyCode string) (int64, error) {
	var count int64
	pattern := fmt.Sprintf("___%s%%", facultyCode) // Pattern: YYYFFDDSSS where FF is faculty code
	err := s.db.Table("users").Where("student_id LIKE ?", pattern).Count(&count).Error
	return count, err
}

// GetStudentsByYear returns count of students by academic year
func (s *StudentIdValidationService) GetStudentsByYear(year string) (int64, error) {
	var count int64
	pattern := fmt.Sprintf("%s%%", year) // Pattern: YYYYFFDDSSS where YYYY is year
	err := s.db.Table("users").Where("student_id LIKE ?", pattern).Count(&count).Error
	return count, err
}

// ValidateStudentIdExists checks if student ID exists in database
func (s *StudentIdValidationService) ValidateStudentIdExists(studentId string) (bool, error) {
	var count int64
	err := s.db.Table("users").Where("student_id = ?", strings.TrimSpace(studentId)).Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// GetStudentIdStatistics returns statistics about student IDs
func (s *StudentIdValidationService) GetStudentIdStatistics() (map[string]interface{}, error) {
	stats := make(map[string]interface{})

	// Total students
	var totalCount int64
	if err := s.db.Table("users").Count(&totalCount).Error; err != nil {
		return nil, err
	}
	stats["total_students"] = totalCount

	// Students by faculty
	facultyStats := make(map[string]int64)
	for code := range validFacultyCodes {
		count, err := s.GetStudentsByFaculty(code)
		if err != nil {
			return nil, err
		}
		facultyStats[code] = count
	}
	stats["by_faculty"] = facultyStats

	// Students by recent years
	currentYear := time.Now().Year()
	yearStats := make(map[string]int64)
	for i := 0; i < 5; i++ {
		year := fmt.Sprintf("%02d", (currentYear-i)%100)
		count, err := s.GetStudentsByYear(year)
		if err != nil {
			return nil, err
		}
		yearStats[fmt.Sprintf("20%s", year)] = count
	}
	stats["by_year"] = yearStats

	return stats, nil
}