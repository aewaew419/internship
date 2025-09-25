package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"time"

	"github.com/gofiber/fiber/v2"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// SimpleUser represents a simple user structure for basic auth
type SimpleUser struct {
	StudentID    string    `json:"student_id" gorm:"primaryKey"`
	Email        string    `json:"email" gorm:"unique;not null"`
	Password     string    `json:"-" gorm:"not null"`
	FullName     string    `json:"full_name"`
	Role         string    `json:"role" gorm:"default:student"`
	IsActive     bool      `json:"is_active" gorm:"default:true"`
	LastLoginAt  *time.Time `json:"last_login_at"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (SimpleUser) TableName() string {
	return "users"
}

// SimpleAuthHandler handles simple authentication
type SimpleAuthHandler struct {
	db *gorm.DB
}

// NewSimpleAuthHandler creates a new simple auth handler
func NewSimpleAuthHandler(db *gorm.DB) *SimpleAuthHandler {
	return &SimpleAuthHandler{db: db}
}

// SimpleLogin handles basic login
func (h *SimpleAuthHandler) SimpleLogin(c *fiber.Ctx) error {
	var req struct {
		Email    string `json:"email" validate:"required,email"`
		Password string `json:"password" validate:"required"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
			"code":  "INVALID_REQUEST",
		})
	}

	// Find user by email
	var user SimpleUser
	if err := h.db.Where("email = ? AND is_active = ?", req.Email, true).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid credentials",
				"code":  "INVALID_CREDENTIALS",
			})
		}
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Database error",
			"code":  "DATABASE_ERROR",
		})
	}

	// Check password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"error": "Invalid credentials",
			"code":  "INVALID_CREDENTIALS",
		})
	}

	// Generate simple token
	tokenBytes := make([]byte, 32)
	rand.Read(tokenBytes)
	token := hex.EncodeToString(tokenBytes)

	// Update last login
	now := time.Now()
	h.db.Model(&user).Update("last_login_at", now)

	return c.JSON(fiber.Map{
		"message": "Login successful",
		"token":   token,
		"user": fiber.Map{
			"student_id": user.StudentID,
			"email":      user.Email,
			"full_name":  user.FullName,
			"role":       user.Role,
		},
	})
}

// SimpleRegister handles basic registration
func (h *SimpleAuthHandler) SimpleRegister(c *fiber.Ctx) error {
	var req struct {
		StudentID       string `json:"student_id" validate:"required"`
		Email           string `json:"email" validate:"required,email"`
		Password        string `json:"password" validate:"required,min=6"`
		ConfirmPassword string `json:"confirm_password" validate:"required"`
		FullName        string `json:"full_name"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Invalid request body",
			"code":  "INVALID_REQUEST",
		})
	}

	if req.Password != req.ConfirmPassword {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"error": "Passwords do not match",
			"code":  "PASSWORD_MISMATCH",
		})
	}

	// Check if user already exists
	var existingUser SimpleUser
	if err := h.db.Where("email = ? OR student_id = ?", req.Email, req.StudentID).First(&existingUser).Error; err == nil {
		return c.Status(fiber.StatusConflict).JSON(fiber.Map{
			"error": "User already exists",
			"code":  "USER_EXISTS",
		})
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to hash password",
			"code":  "HASH_ERROR",
		})
	}

	// Create user
	user := SimpleUser{
		StudentID: req.StudentID,
		Email:     req.Email,
		Password:  string(hashedPassword),
		FullName:  req.FullName,
		Role:      "student",
		IsActive:  true,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	if err := h.db.Create(&user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"error": "Failed to create user",
			"code":  "CREATE_ERROR",
		})
	}

	return c.Status(fiber.StatusCreated).JSON(fiber.Map{
		"message": "User created successfully",
		"user": fiber.Map{
			"student_id": user.StudentID,
			"email":      user.Email,
			"full_name":  user.FullName,
			"role":       user.Role,
		},
	})
}