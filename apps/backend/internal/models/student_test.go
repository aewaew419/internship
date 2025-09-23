package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestStudentModel(t *testing.T) {
	t.Run("Student TableName", func(t *testing.T) {
		student := Student{}
		assert.Equal(t, "students", student.TableName())
	})

	t.Run("GetFullName Method", func(t *testing.T) {
		student := Student{Name: "John", MiddleName: "William", Surname: "Doe"}
		assert.Equal(t, "John William Doe", student.GetFullName())

		studentNoMiddle := Student{Name: "Jane", Surname: "Smith"}
		assert.Equal(t, "Jane Smith", studentNoMiddle.GetFullName())

		studentEmptyMiddle := Student{Name: "Bob", MiddleName: "", Surname: "Johnson"}
		assert.Equal(t, "Bob Johnson", studentEmptyMiddle.GetFullName())
	})

	t.Run("Student Struct Fields", func(t *testing.T) {
		majorID := uint(1)
		programID := uint(2)
		curriculumID := uint(3)
		facultyID := uint(4)

		student := Student{
			ID:           1,
			UserID:       10,
			Name:         "John",
			MiddleName:   "William",
			Surname:      "Doe",
			StudentID:    "60123456",
			GPAX:         3.75,
			PhoneNumber:  "0812345678",
			Email:        "john@test.com",
			Picture:      "profile.jpg",
			MajorID:      &majorID,
			ProgramID:    &programID,
			CurriculumID: &curriculumID,
			FacultyID:    &facultyID,
			CampusID:     5,
		}

		assert.Equal(t, uint(1), student.ID)
		assert.Equal(t, uint(10), student.UserID)
		assert.Equal(t, "John", student.Name)
		assert.Equal(t, "William", student.MiddleName)
		assert.Equal(t, "Doe", student.Surname)
		assert.Equal(t, "60123456", student.StudentID)
		assert.Equal(t, 3.75, student.GPAX)
		assert.Equal(t, "0812345678", student.PhoneNumber)
		assert.Equal(t, "john@test.com", student.Email)
		assert.Equal(t, "profile.jpg", student.Picture)
		assert.Equal(t, uint(1), *student.MajorID)
		assert.Equal(t, uint(2), *student.ProgramID)
		assert.Equal(t, uint(3), *student.CurriculumID)
		assert.Equal(t, uint(4), *student.FacultyID)
		assert.Equal(t, uint(5), student.CampusID)
	})

	t.Run("Student with Optional Nil Fields", func(t *testing.T) {
		student := Student{
			ID:        1,
			UserID:    10,
			Name:      "Jane",
			Surname:   "Smith",
			StudentID: "60987654",
			CampusID:  1,
			// Optional fields are nil
		}

		assert.Nil(t, student.MajorID)
		assert.Nil(t, student.ProgramID)
		assert.Nil(t, student.CurriculumID)
		assert.Nil(t, student.FacultyID)
		assert.Equal(t, "Jane Smith", student.GetFullName())
	})
}