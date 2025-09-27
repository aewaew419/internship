package models

import (
	"encoding/json"
	"time"

	"gorm.io/gorm"
)

// EvaluationFormType represents the evaluation form type enum
type EvaluationFormType string

const (
	FormTypeStudentSelf       EvaluationFormType = "student_self"
	FormTypeStudentCompany    EvaluationFormType = "student_company"
	FormTypeCompanyStudent    EvaluationFormType = "company_student"
	FormTypeVisitorStudent    EvaluationFormType = "visitor_student"
	FormTypeVisitorCompany    EvaluationFormType = "visitor_company"
	FormTypeInstructorStudent EvaluationFormType = "instructor_student"
)

// QuestionType represents the question type enum
type QuestionType string

const (
	QuestionTypeRating   QuestionType = "rating"
	QuestionTypeText     QuestionType = "text"
	QuestionTypeChoice   QuestionType = "choice"
	QuestionTypeCheckbox QuestionType = "checkbox"
	QuestionTypeScale    QuestionType = "scale"
)

// EvaluationQuestion represents a single question in an evaluation form
type EvaluationQuestion struct {
	ID          string       `json:"id"`
	Question    string       `json:"question"`
	Type        QuestionType `json:"type"`
	Required    bool         `json:"required"`
	Options     []string     `json:"options,omitempty"`
	MinValue    *int         `json:"min_value,omitempty"`
	MaxValue    *int         `json:"max_value,omitempty"`
	Weight      float64      `json:"weight"`
	Category    string       `json:"category"`
	Description string       `json:"description,omitempty"`
}

// EvaluationAnswer represents an answer to a question
type EvaluationAnswer struct {
	QuestionID string      `json:"question_id"`
	Answer     interface{} `json:"answer"`
	Score      *float64    `json:"score,omitempty"`
}

// EvaluationForm represents the evaluation_forms table
type EvaluationForm struct {
	ID          uint               `gorm:"primaryKey;autoIncrement" json:"id"`
	Name        string             `gorm:"not null" json:"name"`
	Description string             `gorm:"type:text" json:"description"`
	FormType    EvaluationFormType `gorm:"not null" json:"form_type"`
	Questions   json.RawMessage    `gorm:"type:json;not null" json:"questions"`
	IsActive    bool               `gorm:"default:true" json:"is_active"`
	Version     int                `gorm:"default:1" json:"version"`
	CreatedBy   uint               `gorm:"not null" json:"created_by"`
	CreatedAt   time.Time          `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time          `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	Creator     User                `gorm:"foreignKey:CreatedBy;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT" json:"creator,omitempty"`
	Submissions []EvaluationSubmission `gorm:"foreignKey:FormID" json:"submissions,omitempty"`
}

// TableName specifies the table name for EvaluationForm model
func (EvaluationForm) TableName() string {
	return "evaluation_forms"
}

// EvaluationSubmission represents the evaluation_submissions table
type EvaluationSubmission struct {
	ID                uint            `gorm:"primaryKey;autoIncrement" json:"id"`
	FormID            uint            `gorm:"not null" json:"form_id"`
	StudentTrainingID uint            `gorm:"not null" json:"student_training_id"`
	EvaluatorID       uint            `gorm:"not null" json:"evaluator_id"`
	Answers           json.RawMessage `gorm:"type:json;not null" json:"answers"`
	TotalScore        float64         `json:"total_score"`
	MaxScore          float64         `json:"max_score"`
	Percentage        float64         `json:"percentage"`
	Comments          string          `gorm:"type:text" json:"comments"`
	Status            string          `gorm:"default:draft" json:"status"` // draft, submitted, reviewed
	SubmittedAt       *time.Time      `json:"submitted_at"`
	ReviewedAt        *time.Time      `json:"reviewed_at"`
	ReviewedBy        *uint           `json:"reviewed_by"`
	CreatedAt         time.Time       `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt         time.Time       `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	Form            EvaluationForm  `gorm:"foreignKey:FormID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"form,omitempty"`
	StudentTraining StudentTraining `gorm:"foreignKey:StudentTrainingID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"student_training,omitempty"`
	Evaluator       User            `gorm:"foreignKey:EvaluatorID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"evaluator,omitempty"`
	Reviewer        *User           `gorm:"foreignKey:ReviewedBy;constraint:OnUpdate:CASCADE,OnDelete:SET NULL" json:"reviewer,omitempty"`
}

// TableName specifies the table name for EvaluationSubmission model
func (EvaluationSubmission) TableName() string {
	return "evaluation_submissions"
}

// EvaluationCriteria represents the evaluation_criteria table
type EvaluationCriteria struct {
	ID          uint    `gorm:"primaryKey;autoIncrement" json:"id"`
	Name        string  `gorm:"not null" json:"name"`
	Description string  `gorm:"type:text" json:"description"`
	Category    string  `gorm:"not null" json:"category"`
	Weight      float64 `gorm:"not null" json:"weight"`
	MinScore    float64 `gorm:"default:0" json:"min_score"`
	MaxScore    float64 `gorm:"default:5" json:"max_score"`
	IsActive    bool    `gorm:"default:true" json:"is_active"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

// TableName specifies the table name for EvaluationCriteria model
func (EvaluationCriteria) TableName() string {
	return "evaluation_criteria"
}

// EvaluationReport represents the evaluation_reports table
type EvaluationReport struct {
	ID                uint            `gorm:"primaryKey;autoIncrement" json:"id"`
	StudentTrainingID uint            `gorm:"not null" json:"student_training_id"`
	ReportType        string          `gorm:"not null" json:"report_type"` // summary, detailed, comparison
	Data              json.RawMessage `gorm:"type:json;not null" json:"data"`
	GeneratedBy       uint            `gorm:"not null" json:"generated_by"`
	GeneratedAt       time.Time       `gorm:"autoCreateTime" json:"generated_at"`
	CreatedAt         time.Time       `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt         time.Time       `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	StudentTraining StudentTraining `gorm:"foreignKey:StudentTrainingID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"student_training,omitempty"`
	Generator       User            `gorm:"foreignKey:GeneratedBy;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"generator,omitempty"`
}

// TableName specifies the table name for EvaluationReport model
func (EvaluationReport) TableName() string {
	return "evaluation_reports"
}

// GetQuestions returns parsed questions from JSON
func (ef *EvaluationForm) GetQuestions() ([]EvaluationQuestion, error) {
	if ef.Questions == nil {
		return []EvaluationQuestion{}, nil
	}

	var questions []EvaluationQuestion
	err := json.Unmarshal(ef.Questions, &questions)
	if err != nil {
		return nil, err
	}
	return questions, nil
}

// SetQuestions sets questions as JSON
func (ef *EvaluationForm) SetQuestions(questions []EvaluationQuestion) error {
	data, err := json.Marshal(questions)
	if err != nil {
		return err
	}
	ef.Questions = data
	return nil
}

// GetAnswers returns parsed answers from JSON
func (es *EvaluationSubmission) GetAnswers() ([]EvaluationAnswer, error) {
	if es.Answers == nil {
		return []EvaluationAnswer{}, nil
	}

	var answers []EvaluationAnswer
	err := json.Unmarshal(es.Answers, &answers)
	if err != nil {
		return nil, err
	}
	return answers, nil
}

// SetAnswers sets answers as JSON
func (es *EvaluationSubmission) SetAnswers(answers []EvaluationAnswer) error {
	data, err := json.Marshal(answers)
	if err != nil {
		return err
	}
	es.Answers = data
	return nil
}

// CalculateScore calculates the total score and percentage
func (es *EvaluationSubmission) CalculateScore(form *EvaluationForm) error {
	questions, err := form.GetQuestions()
	if err != nil {
		return err
	}

	answers, err := es.GetAnswers()
	if err != nil {
		return err
	}

	var totalScore, maxScore float64

	// Create a map for quick answer lookup
	answerMap := make(map[string]EvaluationAnswer)
	for _, answer := range answers {
		answerMap[answer.QuestionID] = answer
	}

	// Calculate scores based on questions and answers
	for _, question := range questions {
		if answer, exists := answerMap[question.ID]; exists {
			if answer.Score != nil {
				totalScore += *answer.Score * question.Weight
			}
		}
		
		// Calculate max possible score for this question
		if question.MaxValue != nil {
			maxScore += float64(*question.MaxValue) * question.Weight
		} else {
			maxScore += 5.0 * question.Weight // Default max score
		}
	}

	es.TotalScore = totalScore
	es.MaxScore = maxScore
	if maxScore > 0 {
		es.Percentage = (totalScore / maxScore) * 100
	}

	return nil
}

// GetFormTypeDisplayText returns Thai display text for form type
func (ef *EvaluationForm) GetFormTypeDisplayText() string {
	typeTexts := map[EvaluationFormType]string{
		FormTypeStudentSelf:       "นักศึกษาประเมินตนเอง",
		FormTypeStudentCompany:    "นักศึกษาประเมินบริษัท",
		FormTypeCompanyStudent:    "บริษัทประเมินนักศึกษา",
		FormTypeVisitorStudent:    "ผู้เยี่ยมชมประเมินนักศึกษา",
		FormTypeVisitorCompany:    "ผู้เยี่ยมชมประเมินบริษัท",
		FormTypeInstructorStudent: "อาจารย์ประเมินนักศึกษา",
	}

	if text, exists := typeTexts[ef.FormType]; exists {
		return text
	}
	return string(ef.FormType)
}