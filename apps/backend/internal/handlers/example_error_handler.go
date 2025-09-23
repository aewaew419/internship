package handlers

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
	
	"backend-go/internal/errors"
	"backend-go/internal/models"
	"backend-go/internal/validation"
)

// ExampleHandler demonstrates proper error handling usage
type ExampleHandler struct {
	db *gorm.DB
}

// NewExampleHandler creates a new example handler
func NewExampleHandler(db *gorm.DB) *ExampleHandler {
	return &ExampleHandler{db: db}
}

// CreateUserRequest represents the request body for creating a user
type CreateUserRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,password"`
	FullName string `json:"full_name" validate:"required,min=2"`
	RoleID   uint   `json:"role_id" validate:"required,min=1"`
}

// UpdateUserRequest represents the request body for updating a user
type UpdateUserRequest struct {
	FullName string `json:"full_name" validate:"omitempty,min=2"`
	RoleID   uint   `json:"role_id" validate:"omitempty,min=1"`
}

// CreateUser demonstrates validation and database error handling
func (h *ExampleHandler) CreateUser(c *fiber.Ctx) error {
	var req CreateUserRequest
	
	// Parse and validate request - automatically handles validation errors
	if err := validation.ParseAndValidate(c, &req); err != nil {
		return err
	}
	
	// Check if user already exists
	var existingUser models.User
	err := h.db.Where("email = ?", req.Email).First(&existingUser).Error
	if err == nil {
		// User exists - return conflict error
		return errors.SendError(c, errors.NewConflictError("User with this email already exists"))
	}
	if err != gorm.ErrRecordNotFound {
		// Database error occurred
		return errors.SendDatabaseError(c, err)
	}
	
	// Create new user
	user := models.User{
		Email:    req.Email,
		Password: req.Password, // Will be hashed by BeforeCreate hook
		FullName: &req.FullName,
		RoleID:   req.RoleID,
	}
	
	if err := h.db.Create(&user).Error; err != nil {
		return errors.SendDatabaseError(c, err)
	}
	
	// Remove password from response
	user.Password = ""
	
	return errors.SendSuccessWithMessage(c, "User created successfully", user)
}

// GetUser demonstrates not found error handling
func (h *ExampleHandler) GetUser(c *fiber.Ctx) error {
	userID, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return errors.SendError(c, errors.NewBadRequestError("Invalid user ID"))
	}
	
	var user models.User
	err = h.db.First(&user, userID).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return errors.SendError(c, errors.NewNotFoundError("User"))
		}
		return errors.SendDatabaseError(c, err)
	}
	
	// Remove password from response
	user.Password = ""
	
	return errors.SendSuccess(c, user)
}

// UpdateUser demonstrates partial validation and update error handling
func (h *ExampleHandler) UpdateUser(c *fiber.Ctx) error {
	userID, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return errors.SendError(c, errors.NewBadRequestError("Invalid user ID"))
	}
	
	var req UpdateUserRequest
	if err := validation.ParseAndValidate(c, &req); err != nil {
		return err
	}
	
	// Check if user exists
	var user models.User
	err = h.db.First(&user, userID).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return errors.SendError(c, errors.NewNotFoundError("User"))
		}
		return errors.SendDatabaseError(c, err)
	}
	
	// Update only provided fields
	updates := make(map[string]interface{})
	if req.FullName != "" {
		updates["full_name"] = req.FullName
	}
	if req.RoleID != 0 {
		updates["role_id"] = req.RoleID
	}
	
	if len(updates) == 0 {
		return errors.SendError(c, errors.NewBadRequestError("No fields to update"))
	}
	
	err = h.db.Model(&user).Updates(updates).Error
	if err != nil {
		return errors.SendDatabaseError(c, err)
	}
	
	// Fetch updated user
	err = h.db.First(&user, userID).Error
	if err != nil {
		return errors.SendDatabaseError(c, err)
	}
	
	// Remove password from response
	user.Password = ""
	
	return errors.SendSuccessWithMessage(c, "User updated successfully", user)
}

// DeleteUser demonstrates soft delete error handling
func (h *ExampleHandler) DeleteUser(c *fiber.Ctx) error {
	userID, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return errors.SendError(c, errors.NewBadRequestError("Invalid user ID"))
	}
	
	// Check if user exists
	var user models.User
	err = h.db.First(&user, userID).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return errors.SendError(c, errors.NewNotFoundError("User"))
		}
		return errors.SendDatabaseError(c, err)
	}
	
	// Soft delete the user
	err = h.db.Delete(&user).Error
	if err != nil {
		return errors.SendDatabaseError(c, err)
	}
	
	return errors.SendSuccessWithMessage(c, "User deleted successfully", nil)
}

// GetUsers demonstrates pagination and query error handling
func (h *ExampleHandler) GetUsers(c *fiber.Ctx) error {
	// Parse pagination parameters
	page, err := strconv.Atoi(c.Query("page", "1"))
	if err != nil || page < 1 {
		return errors.SendError(c, errors.NewBadRequestError("Invalid page number"))
	}
	
	limit, err := strconv.Atoi(c.Query("limit", "10"))
	if err != nil || limit < 1 || limit > 100 {
		return errors.SendError(c, errors.NewBadRequestError("Invalid limit (must be between 1 and 100)"))
	}
	
	offset := (page - 1) * limit
	
	// Parse search parameter
	search := c.Query("search", "")
	
	// Build query
	query := h.db.Model(&models.User{})
	if search != "" {
		query = query.Where("full_name LIKE ? OR email LIKE ?", 
			"%"+search+"%", "%"+search+"%")
	}
	
	// Get total count
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return errors.SendDatabaseError(c, err)
	}
	
	// Get users
	var users []models.User
	err = query.Select("id, email, full_name, role_id, created_at, updated_at").
		Offset(offset).
		Limit(limit).
		Find(&users).Error
	if err != nil {
		return errors.SendDatabaseError(c, err)
	}
	
	// Calculate pagination info
	totalPages := (total + int64(limit) - 1) / int64(limit)
	
	pagination := map[string]interface{}{
		"page":        page,
		"limit":       limit,
		"total":       total,
		"total_pages": totalPages,
		"has_next":    page < int(totalPages),
		"has_prev":    page > 1,
	}
	
	return errors.SendPaginatedSuccess(c, users, pagination)
}

// SimulateError demonstrates different types of errors for testing
func (h *ExampleHandler) SimulateError(c *fiber.Ctx) error {
	errorType := c.Query("type", "internal")
	
	switch errorType {
	case "validation":
		// Simulate validation error
		var req CreateUserRequest
		return validation.ParseAndValidate(c, &req)
		
	case "not_found":
		return errors.SendError(c, errors.NewNotFoundError("Resource"))
		
	case "unauthorized":
		return errors.SendError(c, errors.NewUnauthorizedError("Invalid token"))
		
	case "forbidden":
		return errors.SendError(c, errors.NewForbiddenError("Insufficient permissions"))
		
	case "conflict":
		return errors.SendError(c, errors.NewConflictError("Resource already exists"))
		
	case "bad_request":
		return errors.SendError(c, errors.NewBadRequestError("Invalid request parameters"))
		
	case "database":
		// Simulate database error
		return errors.SendDatabaseError(c, gorm.ErrRecordNotFound)
		
	case "panic":
		// Simulate panic (will be caught by recover middleware)
		panic("Simulated panic for testing")
		
	default:
		return errors.SendError(c, errors.NewInternalServerError("Simulated internal server error"))
	}
}