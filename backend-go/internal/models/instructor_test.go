package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestInstructorModel(t *testing.T) {
	t.Run("Instructor TableName", func(t *testing.T) {
		instructor := Instructor{}
		assert.Equal(t, "instructors", instructor.TableName())
	})

	t.Run("GetFullName Method", func(t *testing.T) {
		instructor := Instructor{Name: "Jane", MiddleName: "Marie", Surname: "Smith"}
		assert.Equal(t, "Jane Marie Smith", instructor.GetFullName())

		instructorNoMiddle := Instructor{Name: "John", Surname: "Doe"}
		assert.Equal(t, "John Doe", instructorNoMiddle.GetFullName())

		instructorEmptyMiddle := Instructor{Name: "Bob", MiddleName: "", Surname: "Johnson"}
		assert.Equal(t, "Bob Johnson", instructorEmptyMiddle.GetFullName())
	})

	t.Run("Instructor Struct Fields", func(t *testing.T) {
		instructor := Instructor{
			ID:         1,
			UserID:     10,
			StaffID:    "T001",
			Name:       "Jane",
			MiddleName: "Marie",
			Surname:    "Smith",
			FacultyID:  5,
			ProgramID:  3,
		}

		assert.Equal(t, uint(1), instructor.ID)
		assert.Equal(t, uint(10), instructor.UserID)
		assert.Equal(t, "T001", instructor.StaffID)
		assert.Equal(t, "Jane", instructor.Name)
		assert.Equal(t, "Marie", instructor.MiddleName)
		assert.Equal(t, "Smith", instructor.Surname)
		assert.Equal(t, uint(5), instructor.FacultyID)
		assert.Equal(t, uint(3), instructor.ProgramID)
	})
}