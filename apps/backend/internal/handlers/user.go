package handlers

import (
	"strconv"

	"backend-go/internal/middleware"
	"backend-go/internal/services"
	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
)

// UserHandler handles user management HTTP requests
type UserHandler struct {
	userService *services.UserService
	validator   *validator.Validate
}

// NewUserHandler creates a new user handler instance
func NewUserHandler(userService *services.UserService) *UserHandler {
	return &UserHandler{
		userService: userService,
		validator:   validator.New(),
	}
}

// GetValidator returns the validator instance (for testing purposes)
func (h *UserHandler) GetValidator() *validator.Validate {
	return h.validator
}

// GetUsers handles user listing requests with pagination, search, and filtering
// GET /api/v1/users
func (h *UserHandler) GetUsers(c *fiber.Ctx) error {
	// Parse query parameters
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	search := c.Query("search", "")
	sortBy := c.Query("sort_by", "")
	sortDesc := c.Query("sort_desc", "false") == "true"

	var roleID *uint
	if roleIDStr := c.Query("role_id"); roleIDStr != "" {
		if id, err := strconv.ParseUint(roleIDStr, 10, 32); err == nil {
			roleIDUint := uint(id)
			roleID = &roleIDUint
		}
	}

	req := services.UserListRequest{
		Page:     page,
		Limit:    limit,
		Search:   search,
		RoleID:   roleID,
		SortBy:   sortBy,
		SortDesc: sortDesc,
	}

	response, err := h.userService.GetUsers(req)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch users",
			"code":  "FETCH_USERS_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Users retrieved successfully",
		"data":    response,
	})
}

// GetUser handles single user retrieval requests
// GET /api/v1/users/:id
func (h *UserHandler) GetUser(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
			"code":  "INVALID_USER_ID",
		})
	}

	user, err := h.userService.GetUserByID(uint(id))
	if err != nil {
		if err.Error() == "user not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "User not found",
				"code":  "USER_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch user",
			"code":  "FETCH_USER_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "User retrieved successfully",
		"data":    user,
	})
}

// CreateUser handles user creation requests
// POST /api/v1/users
func (h *UserHandler) CreateUser(c *fiber.Ctx) error {
	var req services.CreateUserRequest

	// Parse request body
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
			"code":  "INVALID_REQUEST_BODY",
		})
	}

	// Validate request
	if err := h.validator.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"code":    "VALIDATION_ERROR",
			"details": err.Error(),
		})
	}

	user, err := h.userService.CreateUser(req)
	if err != nil {
		if err.Error() == "user with this email already exists" {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "User with this email already exists",
				"code":  "EMAIL_EXISTS",
			})
		}
		if err.Error() == "invalid role" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid role specified",
				"code":  "INVALID_ROLE",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create user",
			"code":  "CREATE_USER_ERROR",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "User created successfully",
		"data":    user,
	})
}

// UpdateUser handles user update requests
// PUT /api/v1/users/:id
func (h *UserHandler) UpdateUser(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
			"code":  "INVALID_USER_ID",
		})
	}

	var req services.UpdateUserRequest

	// Parse request body
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
			"code":  "INVALID_REQUEST_BODY",
		})
	}

	// Validate request
	if err := h.validator.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"code":    "VALIDATION_ERROR",
			"details": err.Error(),
		})
	}

	user, err := h.userService.UpdateUser(uint(id), req)
	if err != nil {
		if err.Error() == "user not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "User not found",
				"code":  "USER_NOT_FOUND",
			})
		}
		if err.Error() == "user with this email already exists" {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"error": "User with this email already exists",
				"code":  "EMAIL_EXISTS",
			})
		}
		if err.Error() == "invalid role" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid role specified",
				"code":  "INVALID_ROLE",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to update user",
			"code":  "UPDATE_USER_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "User updated successfully",
		"data":    user,
	})
}

// DeleteUser handles user deletion requests
// DELETE /api/v1/users/:id
func (h *UserHandler) DeleteUser(c *fiber.Ctx) error {
	id, err := strconv.ParseUint(c.Params("id"), 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid user ID",
			"code":  "INVALID_USER_ID",
		})
	}

	// Check if user is trying to delete themselves
	userID, ok := middleware.GetUserID(c)
	if ok && userID == uint(id) {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Cannot delete your own account",
			"code":  "CANNOT_DELETE_SELF",
		})
	}

	err = h.userService.DeleteUser(uint(id))
	if err != nil {
		if err.Error() == "user not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "User not found",
				"code":  "USER_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete user",
			"code":  "DELETE_USER_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "User deleted successfully",
	})
}

// BulkDeleteUsers handles bulk user deletion requests
// DELETE /api/v1/users/bulk
func (h *UserHandler) BulkDeleteUsers(c *fiber.Ctx) error {
	var req services.BulkDeleteRequest

	// Parse request body
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
			"code":  "INVALID_REQUEST_BODY",
		})
	}

	// Validate request
	if err := h.validator.Struct(req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error":   "Validation failed",
			"code":    "VALIDATION_ERROR",
			"details": err.Error(),
		})
	}

	// Check if user is trying to delete themselves
	userID, ok := middleware.GetUserID(c)
	if ok {
		for _, id := range req.UserIDs {
			if userID == id {
				return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
					"error": "Cannot delete your own account",
					"code":  "CANNOT_DELETE_SELF",
				})
			}
		}
	}

	err := h.userService.BulkDeleteUsers(req)
	if err != nil {
		if err.Error() == "one or more users not found" {
			return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
				"error": "One or more users not found",
				"code":  "USERS_NOT_FOUND",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to delete users",
			"code":  "BULK_DELETE_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "Users deleted successfully",
	})
}

// BulkCreateFromExcel handles bulk user creation from Excel file
// POST /api/v1/users/bulk-excel
func (h *UserHandler) BulkCreateFromExcel(c *fiber.Ctx) error {
	// Parse multipart form
	file, err := c.FormFile("file")
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Excel file is required",
			"code":  "FILE_REQUIRED",
		})
	}

	// Get role ID from form
	roleIDStr := c.FormValue("role_id")
	if roleIDStr == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Role ID is required",
			"code":  "ROLE_ID_REQUIRED",
		})
	}

	roleID, err := strconv.ParseUint(roleIDStr, 10, 32)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid role ID",
			"code":  "INVALID_ROLE_ID",
		})
	}

	// Save uploaded file temporarily
	tempFilePath := "/tmp/" + file.Filename
	if err := c.SaveFile(file, tempFilePath); err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to save uploaded file",
			"code":  "FILE_SAVE_ERROR",
		})
	}

	req := services.BulkCreateFromExcelRequest{
		FilePath: tempFilePath,
		RoleID:   uint(roleID),
	}

	createdUsers, errors, err := h.userService.BulkCreateFromExcel(req)
	if err != nil {
		if err.Error() == "invalid role" {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"error": "Invalid role specified",
				"code":  "INVALID_ROLE",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to process Excel file",
			"code":  "EXCEL_PROCESSING_ERROR",
		})
	}

	response := fiber.Map{
		"message":       "Excel file processed successfully",
		"created_users": createdUsers,
		"created_count": len(createdUsers),
	}

	if len(errors) > 0 {
		response["errors"] = errors
		response["error_count"] = len(errors)
	}

	return c.Status(fiber.StatusOK).JSON(response)
}

// GetUserStats handles user statistics requests
// GET /api/v1/users/stats
func (h *UserHandler) GetUserStats(c *fiber.Ctx) error {
	stats, err := h.userService.GetUserStats()
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to fetch user statistics",
			"code":  "STATS_ERROR",
		})
	}

	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"message": "User statistics retrieved successfully",
		"data":    stats,
	})
}