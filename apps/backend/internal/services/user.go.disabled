package services

import (
	"errors"
	"fmt"
	"strings"

	"backend-go/internal/models"
	"github.com/xuri/excelize/v2"
	"gorm.io/gorm"
)

// UserService handles user management operations
type UserService struct {
	db *gorm.DB
}

// NewUserService creates a new user service instance
func NewUserService(db *gorm.DB) *UserService {
	return &UserService{
		db: db,
	}
}

// UserListRequest represents the request for listing users
type UserListRequest struct {
	Page     int    `json:"page"`
	Limit    int    `json:"limit"`
	Search   string `json:"search"`
	RoleID   *uint  `json:"role_id"`
	SortBy   string `json:"sort_by"`
	SortDesc bool   `json:"sort_desc"`
}

// UserListResponse represents the response for listing users
type UserListResponse struct {
	Data       []models.User `json:"data"`
	Total      int64         `json:"total"`
	Page       int           `json:"page"`
	Limit      int           `json:"limit"`
	TotalPages int           `json:"total_pages"`
}

// CreateUserRequest represents the request for creating a user
type CreateUserRequest struct {
	FullName string `json:"full_name"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
	RoleID   uint   `json:"role_id" validate:"required"`
}

// UpdateUserRequest represents the request for updating a user
type UpdateUserRequest struct {
	FullName *string `json:"full_name"`
	Email    *string `json:"email" validate:"omitempty,email"`
	RoleID   *uint   `json:"role_id"`
}

// BulkDeleteRequest represents the request for bulk deleting users
type BulkDeleteRequest struct {
	UserIDs []uint `json:"user_ids" validate:"required,min=1"`
}

// BulkCreateFromExcelRequest represents the request for bulk creating users from Excel
type BulkCreateFromExcelRequest struct {
	FilePath string `json:"file_path" validate:"required"`
	RoleID   uint   `json:"role_id" validate:"required"`
}

// ExcelUserData represents user data from Excel file
type ExcelUserData struct {
	FullName string `json:"full_name"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

// GetUsers retrieves users with pagination, search, and filtering
func (s *UserService) GetUsers(req UserListRequest) (*UserListResponse, error) {
	var users []models.User
	var total int64

	// Build query
	query := s.db.Model(&models.User{}).Preload("Role")

	// Apply search filter
	if req.Search != "" {
		searchTerm := "%" + req.Search + "%"
		query = query.Where("full_name LIKE ? OR email LIKE ?", searchTerm, searchTerm)
	}

	// Apply role filter
	if req.RoleID != nil {
		query = query.Where("role_id = ?", *req.RoleID)
	}

	// Count total records
	if err := query.Count(&total).Error; err != nil {
		return nil, fmt.Errorf("failed to count users: %w", err)
	}

	// Apply sorting
	sortBy := "created_at"
	if req.SortBy != "" {
		// Validate sort field to prevent SQL injection
		allowedSortFields := []string{"id", "full_name", "email", "role_id", "created_at", "updated_at"}
		for _, field := range allowedSortFields {
			if req.SortBy == field {
				sortBy = req.SortBy
				break
			}
		}
	}

	sortOrder := "ASC"
	if req.SortDesc {
		sortOrder = "DESC"
	}
	query = query.Order(fmt.Sprintf("%s %s", sortBy, sortOrder))

	// Apply pagination
	if req.Limit <= 0 {
		req.Limit = 10
	}
	if req.Limit > 100 {
		req.Limit = 100 // Max limit to prevent abuse
	}
	if req.Page <= 0 {
		req.Page = 1
	}

	offset := (req.Page - 1) * req.Limit
	if err := query.Offset(offset).Limit(req.Limit).Find(&users).Error; err != nil {
		return nil, fmt.Errorf("failed to fetch users: %w", err)
	}

	// Remove passwords from response
	for i := range users {
		users[i].Password = ""
	}

	totalPages := int((total + int64(req.Limit) - 1) / int64(req.Limit))

	return &UserListResponse{
		Data:       users,
		Total:      total,
		Page:       req.Page,
		Limit:      req.Limit,
		TotalPages: totalPages,
	}, nil
}

// GetUserByID retrieves a user by ID
func (s *UserService) GetUserByID(id uint) (*models.User, error) {
	var user models.User
	err := s.db.Preload("Role").Preload("Student").Preload("Instructor").Preload("Staff").First(&user, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Remove password from response
	user.Password = ""

	return &user, nil
}

// CreateUser creates a new user
func (s *UserService) CreateUser(req CreateUserRequest) (*models.User, error) {
	// Check if user already exists
	var existingUser models.User
	err := s.db.Where("email = ?", req.Email).First(&existingUser).Error
	if err == nil {
		return nil, errors.New("user with this email already exists")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Validate role exists
	var role models.Role
	err = s.db.First(&role, req.RoleID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("invalid role")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Create new user
	user := models.User{
		FullName: &req.FullName,
		Email:    req.Email,
		Password: req.Password, // Will be hashed by BeforeCreate hook
		RoleID:   req.RoleID,
	}

	err = s.db.Create(&user).Error
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Load role information
	err = s.db.Preload("Role").First(&user, user.ID).Error
	if err != nil {
		return nil, fmt.Errorf("failed to load user data: %w", err)
	}

	// Remove password from response
	user.Password = ""

	return &user, nil
}

// UpdateUser updates an existing user
func (s *UserService) UpdateUser(id uint, req UpdateUserRequest) (*models.User, error) {
	var user models.User
	err := s.db.First(&user, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("user not found")
		}
		return nil, fmt.Errorf("database error: %w", err)
	}

	// Check if email is being updated and if it already exists
	if req.Email != nil && *req.Email != user.Email {
		var existingUser models.User
		err := s.db.Where("email = ? AND id != ?", *req.Email, id).First(&existingUser).Error
		if err == nil {
			return nil, errors.New("user with this email already exists")
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, fmt.Errorf("database error: %w", err)
		}
	}

	// Validate role if being updated
	if req.RoleID != nil {
		var role models.Role
		err = s.db.First(&role, *req.RoleID).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errors.New("invalid role")
			}
			return nil, fmt.Errorf("database error: %w", err)
		}
	}

	// Update fields
	if req.FullName != nil {
		user.FullName = req.FullName
	}
	if req.Email != nil {
		user.Email = *req.Email
	}
	if req.RoleID != nil {
		user.RoleID = *req.RoleID
	}

	err = s.db.Save(&user).Error
	if err != nil {
		return nil, fmt.Errorf("failed to update user: %w", err)
	}

	// Load role information
	err = s.db.Preload("Role").First(&user, user.ID).Error
	if err != nil {
		return nil, fmt.Errorf("failed to load user data: %w", err)
	}

	// Remove password from response
	user.Password = ""

	return &user, nil
}

// DeleteUser deletes a user by ID
func (s *UserService) DeleteUser(id uint) error {
	var user models.User
	err := s.db.First(&user, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("user not found")
		}
		return fmt.Errorf("database error: %w", err)
	}

	err = s.db.Delete(&user).Error
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	return nil
}

// BulkDeleteUsers deletes multiple users by IDs
func (s *UserService) BulkDeleteUsers(req BulkDeleteRequest) error {
	// Check if all users exist
	var count int64
	err := s.db.Model(&models.User{}).Where("id IN ?", req.UserIDs).Count(&count).Error
	if err != nil {
		return fmt.Errorf("database error: %w", err)
	}

	if count != int64(len(req.UserIDs)) {
		return errors.New("one or more users not found")
	}

	// Delete users
	err = s.db.Where("id IN ?", req.UserIDs).Delete(&models.User{}).Error
	if err != nil {
		return fmt.Errorf("failed to delete users: %w", err)
	}

	return nil
}

// BulkCreateFromExcel creates users from Excel file
func (s *UserService) BulkCreateFromExcel(req BulkCreateFromExcelRequest) ([]models.User, []string, error) {
	// Validate role exists
	var role models.Role
	err := s.db.First(&role, req.RoleID).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, errors.New("invalid role")
		}
		return nil, nil, fmt.Errorf("database error: %w", err)
	}

	// Open Excel file
	f, err := excelize.OpenFile(req.FilePath)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to open Excel file: %w", err)
	}
	defer func() {
		if err := f.Close(); err != nil {
			fmt.Printf("Error closing Excel file: %v\n", err)
		}
	}()

	// Get the first sheet
	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		return nil, nil, errors.New("no sheets found in Excel file")
	}

	rows, err := f.GetRows(sheets[0])
	if err != nil {
		return nil, nil, fmt.Errorf("failed to read Excel rows: %w", err)
	}

	if len(rows) < 2 {
		return nil, nil, errors.New("Excel file must have at least a header row and one data row")
	}

	// Parse header row to find column indices
	header := rows[0]
	fullNameCol, emailCol, passwordCol := -1, -1, -1

	for i, col := range header {
		switch strings.ToLower(strings.TrimSpace(col)) {
		case "full_name", "fullname", "name":
			fullNameCol = i
		case "email":
			emailCol = i
		case "password":
			passwordCol = i
		}
	}

	if emailCol == -1 {
		return nil, nil, errors.New("email column not found in Excel file")
	}

	var createdUsers []models.User
	var errorList []string

	// Process data rows
	for i, row := range rows[1:] {
		rowNum := i + 2 // Excel row number (1-indexed + header)

		if len(row) <= emailCol {
			errorList = append(errorList, fmt.Sprintf("Row %d: insufficient columns", rowNum))
			continue
		}

		email := strings.TrimSpace(row[emailCol])
		if email == "" {
			errorList = append(errorList, fmt.Sprintf("Row %d: email is required", rowNum))
			continue
		}

		var fullName string
		if fullNameCol != -1 && len(row) > fullNameCol {
			fullName = strings.TrimSpace(row[fullNameCol])
		}

		var password string
		if passwordCol != -1 && len(row) > passwordCol {
			password = strings.TrimSpace(row[passwordCol])
		}
		if password == "" {
			password = "password123" // Default password
		}

		// Check if user already exists
		var existingUser models.User
		err := s.db.Where("email = ?", email).First(&existingUser).Error
		if err == nil {
			errorList = append(errorList, fmt.Sprintf("Row %d: user with email %s already exists", rowNum, email))
			continue
		}
		if !errors.Is(err, gorm.ErrRecordNotFound) {
			errorList = append(errorList, fmt.Sprintf("Row %d: database error checking email %s", rowNum, email))
			continue
		}

		// Create user
		user := models.User{
			FullName: &fullName,
			Email:    email,
			Password: password, // Will be hashed by BeforeCreate hook
			RoleID:   req.RoleID,
		}

		err = s.db.Create(&user).Error
		if err != nil {
			errorList = append(errorList, fmt.Sprintf("Row %d: failed to create user %s: %v", rowNum, email, err))
			continue
		}

		// Load role information
		err = s.db.Preload("Role").First(&user, user.ID).Error
		if err != nil {
			errorList = append(errorList, fmt.Sprintf("Row %d: failed to load user data for %s", rowNum, email))
			continue
		}

		// Remove password from response
		user.Password = ""
		createdUsers = append(createdUsers, user)
	}

	return createdUsers, errorList, nil
}

// GetUserStats returns user statistics
func (s *UserService) GetUserStats() (map[string]interface{}, error) {
	var totalUsers int64
	err := s.db.Model(&models.User{}).Count(&totalUsers).Error
	if err != nil {
		return nil, fmt.Errorf("failed to count total users: %w", err)
	}

	// Count users by role
	var roleStats []struct {
		RoleID   uint   `json:"role_id"`
		RoleName string `json:"role_name"`
		Count    int64  `json:"count"`
	}

	err = s.db.Table("users").
		Select("users.role_id, roles.name as role_name, COUNT(*) as count").
		Joins("LEFT JOIN roles ON users.role_id = roles.id").
		Group("users.role_id, roles.name").
		Scan(&roleStats).Error
	if err != nil {
		return nil, fmt.Errorf("failed to get role statistics: %w", err)
	}

	return map[string]interface{}{
		"total_users": totalUsers,
		"by_role":     roleStats,
	}, nil
}