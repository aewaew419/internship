package tests

import (
	"testing"

	"backend-go/internal/handlers"
	"backend-go/internal/services"
	"github.com/stretchr/testify/assert"
	"gorm.io/gorm"
)

func TestCourseHandlerCreation(t *testing.T) {
	// Create mock database (nil is acceptable for this test)
	var db *gorm.DB

	// Create course service
	courseService := services.NewCourseService(db)
	assert.NotNil(t, courseService)

	// Create course handler
	courseHandler := handlers.NewCourseHandler(courseService)
	assert.NotNil(t, courseHandler)

	// Test validator is initialized
	validator := courseHandler.GetValidator()
	assert.NotNil(t, validator)
}

func TestCourseServiceCreation(t *testing.T) {
	// Create mock database (nil is acceptable for this test)
	var db *gorm.DB

	// Create course service
	courseService := services.NewCourseService(db)
	assert.NotNil(t, courseService)
}