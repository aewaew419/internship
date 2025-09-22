package handlers

import (
	"testing"

	"backend-go/internal/services"
	"github.com/stretchr/testify/assert"
)

func TestStudentHandler_Creation(t *testing.T) {
	// Test that we can create a student handler without database
	handler := NewStudentHandler(nil)
	assert.NotNil(t, handler)
	assert.NotNil(t, handler.GetValidator())
}

func TestStudentService_Creation(t *testing.T) {
	// Test that we can create a student service
	service := services.NewStudentService(nil)
	assert.NotNil(t, service)
}