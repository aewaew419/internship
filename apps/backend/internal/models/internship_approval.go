package models

import (
	"encoding/json"
	"time"

	"gorm.io/gorm"
)

// InternshipApprovalStatus represents the approval status enum
type InternshipApprovalStatus string

const (
	StatusRegistered   InternshipApprovalStatus = "registered"
	StatusTApproved    InternshipApprovalStatus = "t.approved"
	StatusCApproved    InternshipApprovalStatus = "c.approved"
	StatusDocApproved  InternshipApprovalStatus = "doc.approved"
	StatusDocCancel    InternshipApprovalStatus = "doc.cancel"
	StatusApprove      InternshipApprovalStatus = "approve"
	StatusDenied       InternshipApprovalStatus = "denied"
	StatusPending      InternshipApprovalStatus = "pending"
)

// CommitteeVote represents a single committee member vote
type CommitteeVote struct {
	InstructorID uint      `json:"instructor_id"`
	Vote         string    `json:"vote"` // "approve" or "reject"
	Remarks      string    `json:"remarks"`
	VotedAt      time.Time `json:"voted_at"`
}

// StatusTransition represents a status change record
type StatusTransition struct {
	FromStatus InternshipApprovalStatus `json:"from_status"`
	ToStatus   InternshipApprovalStatus `json:"to_status"`
	ChangedBy  uint                     `json:"changed_by"`
	ChangedAt  time.Time                `json:"changed_at"`
	Reason     string                   `json:"reason"`
}

// InternshipApproval represents the internship approval workflow
type InternshipApproval struct {
	ID                uint                     `gorm:"primaryKey;autoIncrement" json:"id"`
	StudentEnrollID   uint                     `gorm:"column:student_enroll_id;not null;uniqueIndex" json:"student_enroll_id"`
	Status            InternshipApprovalStatus `gorm:"not null;default:registered" json:"status"`
	AdvisorID         *uint                    `gorm:"column:advisor_id" json:"advisor_id"`
	AdvisorApprovedAt *time.Time               `gorm:"column:advisor_approved_at" json:"advisor_approved_at"`
	CommitteeVotes    json.RawMessage          `gorm:"type:json" json:"committee_votes"`
	StatusHistory     json.RawMessage          `gorm:"type:json" json:"status_history"`
	Remarks           string                   `gorm:"type:text" json:"remarks"`
	CreatedAt         time.Time                `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt         time.Time                `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	StudentEnroll StudentEnroll `gorm:"foreignKey:StudentEnrollID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"student_enroll,omitempty"`
	Advisor       *Instructor   `gorm:"foreignKey:AdvisorID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL" json:"advisor,omitempty"`
}

// TableName specifies the table name for InternshipApproval model
func (InternshipApproval) TableName() string {
	return "internship_approvals"
}

// GetCommitteeVotes returns parsed committee votes
func (ia *InternshipApproval) GetCommitteeVotes() ([]CommitteeVote, error) {
	if ia.CommitteeVotes == nil {
		return []CommitteeVote{}, nil
	}

	var votes []CommitteeVote
	err := json.Unmarshal(ia.CommitteeVotes, &votes)
	if err != nil {
		return nil, err
	}
	return votes, nil
}

// SetCommitteeVotes sets committee votes as JSON
func (ia *InternshipApproval) SetCommitteeVotes(votes []CommitteeVote) error {
	data, err := json.Marshal(votes)
	if err != nil {
		return err
	}
	ia.CommitteeVotes = data
	return nil
}

// GetStatusHistory returns parsed status history
func (ia *InternshipApproval) GetStatusHistory() ([]StatusTransition, error) {
	if ia.StatusHistory == nil {
		return []StatusTransition{}, nil
	}

	var history []StatusTransition
	err := json.Unmarshal(ia.StatusHistory, &history)
	if err != nil {
		return nil, err
	}
	return history, nil
}

// SetStatusHistory sets status history as JSON
func (ia *InternshipApproval) SetStatusHistory(history []StatusTransition) error {
	data, err := json.Marshal(history)
	if err != nil {
		return err
	}
	ia.StatusHistory = data
	return nil
}

// AddStatusTransition adds a new status transition to history
func (ia *InternshipApproval) AddStatusTransition(fromStatus, toStatus InternshipApprovalStatus, changedBy uint, reason string) error {
	history, err := ia.GetStatusHistory()
	if err != nil {
		return err
	}

	transition := StatusTransition{
		FromStatus: fromStatus,
		ToStatus:   toStatus,
		ChangedBy:  changedBy,
		ChangedAt:  time.Now(),
		Reason:     reason,
	}

	history = append(history, transition)
	return ia.SetStatusHistory(history)
}

// CanTransitionTo checks if status transition is valid
func (ia *InternshipApproval) CanTransitionTo(newStatus InternshipApprovalStatus) bool {
	validTransitions := map[InternshipApprovalStatus][]InternshipApprovalStatus{
		StatusRegistered:  {StatusTApproved, StatusDenied},
		StatusTApproved:   {StatusCApproved, StatusDenied},
		StatusCApproved:   {StatusDocApproved, StatusDocCancel},
		StatusDocApproved: {StatusApprove, StatusDocCancel},
		StatusDocCancel:   {}, // Final state
		StatusApprove:     {}, // Final state
		StatusDenied:      {StatusRegistered}, // Can restart process
		StatusPending:     {StatusTApproved, StatusDenied},
	}

	allowedTransitions, exists := validTransitions[ia.Status]
	if !exists {
		return false
	}

	for _, allowed := range allowedTransitions {
		if allowed == newStatus {
			return true
		}
	}
	return false
}

// GetStatusDisplayText returns Thai display text for status
func (ia *InternshipApproval) GetStatusDisplayText() string {
	statusTexts := map[InternshipApprovalStatus]string{
		StatusRegistered:  "ลงทะเบียนแล้ว",
		StatusTApproved:   "อนุมัติโดยอาจารย์ที่ปรึกษา",
		StatusCApproved:   "อนุมัติโดยคณะกรรมการ",
		StatusDocApproved: "อนุมัติเอกสาร",
		StatusDocCancel:   "ยกเลิกเอกสาร",
		StatusApprove:     "อนุมัติ",
		StatusDenied:      "ปฏิเสธ",
		StatusPending:     "รอดำเนินการ",
	}

	if text, exists := statusTexts[ia.Status]; exists {
		return text
	}
	return string(ia.Status)
}

// CalculateApprovalPercentage calculates approval percentage from committee votes
func (ia *InternshipApproval) CalculateApprovalPercentage() (int, error) {
	votes, err := ia.GetCommitteeVotes()
	if err != nil {
		return 0, err
	}

	if len(votes) == 0 {
		return 0, nil
	}

	approveCount := 0
	for _, vote := range votes {
		if vote.Vote == "approve" {
			approveCount++
		}
	}

	return (approveCount * 100) / len(votes), nil
}

// HasInstructorVoted checks if an instructor has already voted
func (ia *InternshipApproval) HasInstructorVoted(instructorID uint) (bool, error) {
	votes, err := ia.GetCommitteeVotes()
	if err != nil {
		return false, err
	}

	for _, vote := range votes {
		if vote.InstructorID == instructorID {
			return true, nil
		}
	}
	return false, nil
}

// AddCommitteeVote adds a new committee vote
func (ia *InternshipApproval) AddCommitteeVote(instructorID uint, vote, remarks string) error {
	votes, err := ia.GetCommitteeVotes()
	if err != nil {
		return err
	}

	newVote := CommitteeVote{
		InstructorID: instructorID,
		Vote:         vote,
		Remarks:      remarks,
		VotedAt:      time.Now(),
	}

	votes = append(votes, newVote)
	return ia.SetCommitteeVotes(votes)
}

// GetApprovalByStudentEnrollID finds approval record by student enrollment ID
func GetApprovalByStudentEnrollID(db *gorm.DB, studentEnrollID uint) (*InternshipApproval, error) {
	var approval InternshipApproval
	err := db.Where("student_enroll_id = ?", studentEnrollID).
		Preload("StudentEnroll").
		Preload("StudentEnroll.Student").
		Preload("StudentEnroll.CourseSection").
		Preload("Advisor").
		First(&approval).Error
	
	if err != nil {
		return nil, err
	}
	return &approval, nil
}

// CreateApprovalRecord creates a new approval record for student enrollment
func CreateApprovalRecord(db *gorm.DB, studentEnrollID uint, advisorID *uint) (*InternshipApproval, error) {
	approval := &InternshipApproval{
		StudentEnrollID: studentEnrollID,
		Status:          StatusRegistered,
		AdvisorID:       advisorID,
	}

	// Initialize empty JSON arrays
	approval.SetCommitteeVotes([]CommitteeVote{})
	approval.SetStatusHistory([]StatusTransition{})

	err := db.Create(approval).Error
	if err != nil {
		return nil, err
	}

	return approval, nil
}