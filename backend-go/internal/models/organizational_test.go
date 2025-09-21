package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestOrganizationalModels(t *testing.T) {
	t.Run("Campus TableName", func(t *testing.T) {
		campus := Campus{}
		assert.Equal(t, "campuses", campus.TableName())
	})

	t.Run("Faculty TableName", func(t *testing.T) {
		faculty := Faculty{}
		assert.Equal(t, "faculties", faculty.TableName())
	})

	t.Run("Program TableName", func(t *testing.T) {
		program := Program{}
		assert.Equal(t, "programs", program.TableName())
	})

	t.Run("Curriculum TableName", func(t *testing.T) {
		curriculum := Curriculum{}
		assert.Equal(t, "curriculums", curriculum.TableName())
	})

	t.Run("Major TableName", func(t *testing.T) {
		major := Major{}
		assert.Equal(t, "majors", major.TableName())
	})

	t.Run("Campus Struct Fields", func(t *testing.T) {
		campus := Campus{
			ID:           1,
			CampusNameEN: "Main Campus",
			CampusNameTH: "วิทยาเขตหลัก",
		}

		assert.Equal(t, uint(1), campus.ID)
		assert.Equal(t, "Main Campus", campus.CampusNameEN)
		assert.Equal(t, "วิทยาเขตหลัก", campus.CampusNameTH)
	})

	t.Run("Faculty Struct Fields", func(t *testing.T) {
		faculty := Faculty{
			ID:            1,
			FacultyNameEN: "Engineering",
			FacultyNameTH: "วิศวกรรมศาสตร์",
			CampusID:      2,
		}

		assert.Equal(t, uint(1), faculty.ID)
		assert.Equal(t, "Engineering", faculty.FacultyNameEN)
		assert.Equal(t, "วิศวกรรมศาสตร์", faculty.FacultyNameTH)
		assert.Equal(t, uint(2), faculty.CampusID)
	})

	t.Run("Program Struct Fields", func(t *testing.T) {
		program := Program{
			ID:            1,
			ProgramNameEN: "Computer Engineering",
			ProgramNameTH: "วิศวกรรมคอมพิวเตอร์",
			FacultyID:     3,
		}

		assert.Equal(t, uint(1), program.ID)
		assert.Equal(t, "Computer Engineering", program.ProgramNameEN)
		assert.Equal(t, "วิศวกรรมคอมพิวเตอร์", program.ProgramNameTH)
		assert.Equal(t, uint(3), program.FacultyID)
	})

	t.Run("Curriculum Struct Fields", func(t *testing.T) {
		curriculum := Curriculum{
			ID:               1,
			CurriculumNameEN: "Computer Engineering 2023",
			CurriculumNameTH: "วิศวกรรมคอมพิวเตอร์ 2566",
			ProgramID:        4,
		}

		assert.Equal(t, uint(1), curriculum.ID)
		assert.Equal(t, "Computer Engineering 2023", curriculum.CurriculumNameEN)
		assert.Equal(t, "วิศวกรรมคอมพิวเตอร์ 2566", curriculum.CurriculumNameTH)
		assert.Equal(t, uint(4), curriculum.ProgramID)
	})

	t.Run("Major Struct Fields", func(t *testing.T) {
		major := Major{
			ID:           1,
			MajorNameEN:  "Software Engineering",
			MajorNameTH:  "วิศวกรรมซอฟต์แวร์",
			CurriculumID: 5,
		}

		assert.Equal(t, uint(1), major.ID)
		assert.Equal(t, "Software Engineering", major.MajorNameEN)
		assert.Equal(t, "วิศวกรรมซอฟต์แวร์", major.MajorNameTH)
		assert.Equal(t, uint(5), major.CurriculumID)
	})
}