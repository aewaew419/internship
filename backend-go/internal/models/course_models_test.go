package models

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestCourseModels(t *testing.T) {
	t.Run("Course TableName", func(t *testing.T) {
		course := Course{}
		assert.Equal(t, "courses", course.TableName())
	})

	t.Run("CourseSection TableName", func(t *testing.T) {
		courseSection := CourseSection{}
		assert.Equal(t, "course_sections", courseSection.TableName())
	})

	t.Run("StudentEnroll TableName", func(t *testing.T) {
		studentEnroll := StudentEnroll{}
		assert.Equal(t, "student_enrolls", studentEnroll.TableName())
	})

	t.Run("CourseInstructor TableName", func(t *testing.T) {
		courseInstructor := CourseInstructor{}
		assert.Equal(t, "course_instructors", courseInstructor.TableName())
	})

	t.Run("CourseCommittee TableName", func(t *testing.T) {
		courseCommittee := CourseCommittee{}
		assert.Equal(t, "course_committees", courseCommittee.TableName())
	})

	t.Run("StudentEnrollStatus TableName", func(t *testing.T) {
		studentEnrollStatus := StudentEnrollStatus{}
		assert.Equal(t, "student_enroll_statuses", studentEnrollStatus.TableName())
	})

	t.Run("Staff TableName", func(t *testing.T) {
		staff := Staff{}
		assert.Equal(t, "staffs", staff.TableName())
	})

	t.Run("Course Struct Fields", func(t *testing.T) {
		course := Course{
			ID:            1,
			CurriculumID:  2,
			Code:          "CPE101",
			Name:          "Introduction to Programming",
			Credits:       3,
			Description:   "Basic programming concepts",
			Prerequisites: "None",
		}

		assert.Equal(t, uint(1), course.ID)
		assert.Equal(t, uint(2), course.CurriculumID)
		assert.Equal(t, "CPE101", course.Code)
		assert.Equal(t, "Introduction to Programming", course.Name)
		assert.Equal(t, 3, course.Credits)
		assert.Equal(t, "Basic programming concepts", course.Description)
		assert.Equal(t, "None", course.Prerequisites)
	})

	t.Run("CourseSection Struct Fields", func(t *testing.T) {
		courseSection := CourseSection{
			ID:          1,
			CourseID:    2,
			Section:     "01",
			Semester:    "1",
			Year:        2024,
			MaxStudents: 30,
			Schedule:    "Mon 9:00-12:00",
		}

		assert.Equal(t, uint(1), courseSection.ID)
		assert.Equal(t, uint(2), courseSection.CourseID)
		assert.Equal(t, "01", courseSection.Section)
		assert.Equal(t, "1", courseSection.Semester)
		assert.Equal(t, 2024, courseSection.Year)
		assert.Equal(t, 30, courseSection.MaxStudents)
		assert.Equal(t, "Mon 9:00-12:00", courseSection.Schedule)
	})

	t.Run("StudentEnroll Struct Fields", func(t *testing.T) {
		gradePoints := 3.5
		grade := "A"

		studentEnroll := StudentEnroll{
			ID:              1,
			StudentID:       10,
			CourseSectionID: 20,
			Status:          "enrolled",
			Grade:           &grade,
			GradePoints:     &gradePoints,
		}

		assert.Equal(t, uint(1), studentEnroll.ID)
		assert.Equal(t, uint(10), studentEnroll.StudentID)
		assert.Equal(t, uint(20), studentEnroll.CourseSectionID)
		assert.Equal(t, "enrolled", studentEnroll.Status)
		assert.Equal(t, "A", *studentEnroll.Grade)
		assert.Equal(t, 3.5, *studentEnroll.GradePoints)
	})

	t.Run("CourseInstructor Struct Fields", func(t *testing.T) {
		courseInstructor := CourseInstructor{
			ID:              1,
			InstructorID:    10,
			CourseSectionID: 20,
			Role:            "instructor",
		}

		assert.Equal(t, uint(1), courseInstructor.ID)
		assert.Equal(t, uint(10), courseInstructor.InstructorID)
		assert.Equal(t, uint(20), courseInstructor.CourseSectionID)
		assert.Equal(t, "instructor", courseInstructor.Role)
	})

	t.Run("CourseCommittee Struct Fields", func(t *testing.T) {
		courseCommittee := CourseCommittee{
			ID:              1,
			InstructorID:    10,
			CourseSectionID: 20,
			Role:            "chair",
		}

		assert.Equal(t, uint(1), courseCommittee.ID)
		assert.Equal(t, uint(10), courseCommittee.InstructorID)
		assert.Equal(t, uint(20), courseCommittee.CourseSectionID)
		assert.Equal(t, "chair", courseCommittee.Role)
	})

	t.Run("StudentEnrollStatus Struct Fields", func(t *testing.T) {
		gpa := 3.75
		instructorID := uint(5)

		studentEnrollStatus := StudentEnrollStatus{
			ID:           1,
			StudentID:    10,
			Semester:     "1",
			Year:         2024,
			Status:       "active",
			GPA:          &gpa,
			Credits:      18,
			InstructorID: &instructorID,
		}

		assert.Equal(t, uint(1), studentEnrollStatus.ID)
		assert.Equal(t, uint(10), studentEnrollStatus.StudentID)
		assert.Equal(t, "1", studentEnrollStatus.Semester)
		assert.Equal(t, 2024, studentEnrollStatus.Year)
		assert.Equal(t, "active", studentEnrollStatus.Status)
		assert.Equal(t, 3.75, *studentEnrollStatus.GPA)
		assert.Equal(t, 18, studentEnrollStatus.Credits)
		assert.Equal(t, uint(5), *studentEnrollStatus.InstructorID)
	})

	t.Run("Staff Struct Fields", func(t *testing.T) {
		staff := Staff{
			ID:      1,
			UserID:  10,
			StaffID: "S001",
		}

		assert.Equal(t, uint(1), staff.ID)
		assert.Equal(t, uint(10), staff.UserID)
		assert.Equal(t, "S001", staff.StaffID)
	})
}