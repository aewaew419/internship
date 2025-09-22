package models

import (
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
)

func TestVisitorModelsStructure(t *testing.T) {
	t.Run("VisitorTraining TableName", func(t *testing.T) {
		vt := VisitorTraining{}
		assert.Equal(t, "visitor_trainings", vt.TableName())
	})

	t.Run("VisitorSchedule TableName", func(t *testing.T) {
		vs := VisitorSchedule{}
		assert.Equal(t, "visitor_schedules", vs.TableName())
	})

	t.Run("VisitorEvaluateStudent TableName", func(t *testing.T) {
		ves := VisitorEvaluateStudent{}
		assert.Equal(t, "visitor_evaluate_students", ves.TableName())
	})

	t.Run("VisitorEvaluateCompany TableName", func(t *testing.T) {
		vec := VisitorEvaluateCompany{}
		assert.Equal(t, "visitor_evaluate_companies", vec.TableName())
	})

	t.Run("StudentEvaluateCompany TableName", func(t *testing.T) {
		sec := StudentEvaluateCompany{}
		assert.Equal(t, "student_evaluate_companies", sec.TableName())
	})

	t.Run("VisitsPicture TableName", func(t *testing.T) {
		vp := VisitsPicture{}
		assert.Equal(t, "visits_pictures", vp.TableName())
	})

	t.Run("CompanyPicture TableName", func(t *testing.T) {
		cp := CompanyPicture{}
		assert.Equal(t, "company_pictures", cp.TableName())
	})
}

func TestVisitorTrainingStruct(t *testing.T) {
	t.Run("VisitorTraining Struct Fields", func(t *testing.T) {
		vt := VisitorTraining{
			ID:                  1,
			StudentEnrollID:     10,
			VisitorInstructorID: 20,
		}

		assert.Equal(t, uint(1), vt.ID)
		assert.Equal(t, uint(10), vt.StudentEnrollID)
		assert.Equal(t, uint(20), vt.VisitorInstructorID)
	})
}

func TestVisitorScheduleStruct(t *testing.T) {
	t.Run("VisitorSchedule Struct Fields", func(t *testing.T) {
		visitTime := time.Now()
		comment := "Test visit"
		
		vs := VisitorSchedule{
			ID:                1,
			VisitorTrainingID: 10,
			VisitNo:           1,
			VisitAt:           &visitTime,
			Comment:           &comment,
		}

		assert.Equal(t, uint(1), vs.ID)
		assert.Equal(t, uint(10), vs.VisitorTrainingID)
		assert.Equal(t, 1, vs.VisitNo)
		assert.Equal(t, visitTime, *vs.VisitAt)
		assert.Equal(t, "Test visit", *vs.Comment)
	})

	t.Run("VisitMode Constants", func(t *testing.T) {
		assert.Equal(t, VisitMode("onsite"), VisitModeOnsite)
		assert.Equal(t, VisitMode("online"), VisitModeOnline)
	})

	t.Run("VisitStatus Constants", func(t *testing.T) {
		assert.Equal(t, VisitStatus("scheduled"), VisitStatusScheduled)
		assert.Equal(t, VisitStatus("completed"), VisitStatusCompleted)
		assert.Equal(t, VisitStatus("skipped"), VisitStatusSkipped)
		assert.Equal(t, VisitStatus("cancelled"), VisitStatusCancelled)
	})
}

func TestVisitorEvaluateStudentStruct(t *testing.T) {
	t.Run("VisitorEvaluateStudent Struct Fields", func(t *testing.T) {
		ves := VisitorEvaluateStudent{
			ID:                1,
			Score:             85,
			Questions:         `{"technical_skills": 4, "communication": 5}`,
			Comment:           "Good performance",
			VisitorTrainingID: 10,
		}

		assert.Equal(t, uint(1), ves.ID)
		assert.Equal(t, 85, ves.Score)
		assert.Equal(t, `{"technical_skills": 4, "communication": 5}`, ves.Questions)
		assert.Equal(t, "Good performance", ves.Comment)
		assert.Equal(t, uint(10), ves.VisitorTrainingID)
	})
}

func TestVisitorEvaluateCompanyStruct(t *testing.T) {
	t.Run("VisitorEvaluateCompany Struct Fields", func(t *testing.T) {
		studentTrainingID := uint(20)
		
		vec := VisitorEvaluateCompany{
			ID:                1,
			Score:             90,
			Questions:         `{"facilities": 5, "supervision": 4}`,
			Comment:           "Excellent company",
			VisitorTrainingID: 10,
			StudentTrainingID: &studentTrainingID,
		}

		assert.Equal(t, uint(1), vec.ID)
		assert.Equal(t, 90, vec.Score)
		assert.Equal(t, `{"facilities": 5, "supervision": 4}`, vec.Questions)
		assert.Equal(t, "Excellent company", vec.Comment)
		assert.Equal(t, uint(10), vec.VisitorTrainingID)
		assert.Equal(t, uint(20), *vec.StudentTrainingID)
	})
}

func TestStudentEvaluateCompanyStruct(t *testing.T) {
	t.Run("StudentEvaluateCompany Struct Fields", func(t *testing.T) {
		sec := StudentEvaluateCompany{
			ID:                1,
			Score:             88,
			Questions:         `{"overall_satisfaction": 4, "learning": 5}`,
			Comment:           "Great experience",
			StudentTrainingID: 10,
		}

		assert.Equal(t, uint(1), sec.ID)
		assert.Equal(t, 88, sec.Score)
		assert.Equal(t, `{"overall_satisfaction": 4, "learning": 5}`, sec.Questions)
		assert.Equal(t, "Great experience", sec.Comment)
		assert.Equal(t, uint(10), sec.StudentTrainingID)
	})
}

func TestVisitsPictureStruct(t *testing.T) {
	t.Run("VisitsPicture Struct Fields", func(t *testing.T) {
		vp := VisitsPicture{
			ID:                1,
			VisitorScheduleID: 10,
			PhotoNo:           1,
			FileURL:           "/uploads/visits/photo1.jpg",
		}

		assert.Equal(t, uint(1), vp.ID)
		assert.Equal(t, uint(10), vp.VisitorScheduleID)
		assert.Equal(t, 1, vp.PhotoNo)
		assert.Equal(t, "/uploads/visits/photo1.jpg", vp.FileURL)
	})
}

func TestCompanyPictureStruct(t *testing.T) {
	t.Run("CompanyPicture Struct Fields", func(t *testing.T) {
		picture := "company_logo.jpg"
		
		cp := CompanyPicture{
			ID:        1,
			Picture:   &picture,
			CompanyID: 10,
		}

		assert.Equal(t, uint(1), cp.ID)
		assert.Equal(t, "company_logo.jpg", *cp.Picture)
		assert.Equal(t, uint(10), cp.CompanyID)
	})

	t.Run("CompanyPicture with Nil Picture", func(t *testing.T) {
		cp := CompanyPicture{
			ID:        1,
			CompanyID: 10,
		}

		assert.Equal(t, uint(1), cp.ID)
		assert.Nil(t, cp.Picture)
		assert.Equal(t, uint(10), cp.CompanyID)
	})
}

func TestStudentTrainingStruct(t *testing.T) {
	t.Run("StudentTraining Struct Fields", func(t *testing.T) {
		companyID := uint(5)
		startDate := time.Now()
		endDate := time.Now().AddDate(0, 3, 0)
		
		st := StudentTraining{
			ID:                       1,
			StudentEnrollID:          10,
			StartDate:                startDate,
			EndDate:                  endDate,
			Coordinator:              "John Coordinator",
			CoordinatorPhoneNumber:   "02-111-1111",
			CoordinatorEmail:         "coordinator@company.com",
			Supervisor:               "Jane Supervisor",
			SupervisorPhoneNumber:    "02-222-2222",
			SupervisorEmail:          "supervisor@company.com",
			Department:               "IT Department",
			Position:                 "Software Developer Intern",
			JobDescription:           "Develop web applications",
			DocumentLanguage:         DocumentLanguageEN,
			CompanyID:                &companyID,
		}

		assert.Equal(t, uint(1), st.ID)
		assert.Equal(t, uint(10), st.StudentEnrollID)
		assert.Equal(t, startDate, st.StartDate)
		assert.Equal(t, endDate, st.EndDate)
		assert.Equal(t, "John Coordinator", st.Coordinator)
		assert.Equal(t, "02-111-1111", st.CoordinatorPhoneNumber)
		assert.Equal(t, "coordinator@company.com", st.CoordinatorEmail)
		assert.Equal(t, "Jane Supervisor", st.Supervisor)
		assert.Equal(t, "02-222-2222", st.SupervisorPhoneNumber)
		assert.Equal(t, "supervisor@company.com", st.SupervisorEmail)
		assert.Equal(t, "IT Department", st.Department)
		assert.Equal(t, "Software Developer Intern", st.Position)
		assert.Equal(t, "Develop web applications", st.JobDescription)
		assert.Equal(t, DocumentLanguageEN, st.DocumentLanguage)
		assert.Equal(t, uint(5), *st.CompanyID)
	})

	t.Run("DocumentLanguage Constants", func(t *testing.T) {
		assert.Equal(t, DocumentLanguage("th"), DocumentLanguageTH)
		assert.Equal(t, DocumentLanguage("en"), DocumentLanguageEN)
	})
}