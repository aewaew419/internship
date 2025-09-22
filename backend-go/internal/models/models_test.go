package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestAllModels tests that all models are included in the AllModels function
func TestAllModels(t *testing.T) {
	models := AllModels()
	
	// Verify we have all expected models
	expectedCount := 27 // Total number of models including visitor and evaluation models
	assert.Len(t, models, expectedCount)
	
	// Verify specific models are included
	modelTypes := make(map[string]bool)
	for _, model := range models {
		switch model.(type) {
		case *Role:
			modelTypes["Role"] = true
		case *Permission:
			modelTypes["Permission"] = true
		case *User:
			modelTypes["User"] = true
		case *Student:
			modelTypes["Student"] = true
		case *Instructor:
			modelTypes["Instructor"] = true
		case *Staff:
			modelTypes["Staff"] = true
		case *Campus:
			modelTypes["Campus"] = true
		case *Faculty:
			modelTypes["Faculty"] = true
		case *Program:
			modelTypes["Program"] = true
		case *Curriculum:
			modelTypes["Curriculum"] = true
		case *Major:
			modelTypes["Major"] = true
		case *Course:
			modelTypes["Course"] = true
		case *CourseSection:
			modelTypes["CourseSection"] = true
		case *StudentEnroll:
			modelTypes["StudentEnroll"] = true
		case *CourseInstructor:
			modelTypes["CourseInstructor"] = true
		case *CourseCommittee:
			modelTypes["CourseCommittee"] = true
		}
	}
	
	// Verify all core models are present
	require.True(t, modelTypes["Role"])
	require.True(t, modelTypes["Permission"])
	require.True(t, modelTypes["User"])
	require.True(t, modelTypes["Student"])
	require.True(t, modelTypes["Instructor"])
	require.True(t, modelTypes["Staff"])
	require.True(t, modelTypes["Campus"])
	require.True(t, modelTypes["Faculty"])
	require.True(t, modelTypes["Program"])
	require.True(t, modelTypes["Curriculum"])
	require.True(t, modelTypes["Major"])
}