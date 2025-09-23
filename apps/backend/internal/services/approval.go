package services

import (
	"backend-go/internal/models"
	"errors"
	"time"

	"gorm.io/gorm"
)

// ApprovalService handles internship approval workflow operations
type ApprovalService struct {
	db *gorm.DB
}

// NewApprovalService creates a new approval service
func NewApprovalService(db *gorm.DB) *ApprovalService {
	return &ApprovalService{db: db}
}

// ApprovalStatusResponse represents the response for approval status
type ApprovalStatusResponse struct {
	StudentEnrollID     uint                                `json:"student_enroll_id"`
	CurrentStatus       models.InternshipApprovalStatus     `json:"current_status"`
	StatusText          string                              `json:"status_text"`
	StatusUpdatedAt     string                              `json:"status_updated_at"`
	CommitteeVotes      []models.CommitteeVote              `json:"committee_votes"`
	ApprovalPercentage  int                                 `json:"approval_percentage"`
	StatusHistory       []models.StatusTransition           `json:"status_history"`
	AdvisorID           *uint                               `json:"advisor_id"`
	AdvisorApprovalDate *string                             `json:"advisor_approval_date"`
	NeedsAttention      bool                                `json:"needs_attention"`
}

// CommitteeVotingData represents committee voting information
type CommitteeVotingData struct {
	StudentEnrollID        uint                   `json:"student_enroll_id"`
	TotalCommitteeMembers  int                    `json:"total_committee_members"`
	CurrentVotes           []models.CommitteeVote `json:"current_votes"`
	ApprovalPercentage     int                    `json:"approval_percentage"`
	VotingComplete         bool                   `json:"voting_complete"`
	FinalDecision          *string                `json:"final_decision"`
}

// GetApprovalStatus gets the current approval status for a student enrollment
func (s *ApprovalService) GetApprovalStatus(studentEnrollID uint) (*ApprovalStatusResponse, error) {
	approval, err := models.GetApprovalByStudentEnrollID(s.db, studentEnrollID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("approval record not found")
		}
		return nil, err
	}

	// Get committee votes
	votes, err := approval.GetCommitteeVotes()
	if err != nil {
		return nil, err
	}

	// Get status history
	history, err := approval.GetStatusHistory()
	if err != nil {
		return nil, err
	}

	// Calculate approval percentage
	approvalPercentage, err := approval.CalculateApprovalPercentage()
	if err != nil {
		return nil, err
	}

	// Check if needs administrative attention
	needsAttention := s.requiresAdministrativeAttention(approval)

	response := &ApprovalStatusResponse{
		StudentEnrollID:    studentEnrollID,
		CurrentStatus:      approval.Status,
		StatusText:         approval.GetStatusDisplayText(),
		StatusUpdatedAt:    approval.UpdatedAt.Format(time.RFC3339),
		CommitteeVotes:     votes,
		ApprovalPercentage: approvalPercentage,
		StatusHistory:      history,
		AdvisorID:          approval.AdvisorID,
		NeedsAttention:     needsAttention,
	}

	if approval.AdvisorApprovedAt != nil {
		approvalDate := approval.AdvisorApprovedAt.Format(time.RFC3339)
		response.AdvisorApprovalDate = &approvalDate
	}

	return response, nil
}

// GetCommitteeVotingData gets committee voting information
func (s *ApprovalService) GetCommitteeVotingData(studentEnrollID uint) (*CommitteeVotingData, error) {
	approval, err := models.GetApprovalByStudentEnrollID(s.db, studentEnrollID)
	if err != nil {
		return nil, err
	}

	votes, err := approval.GetCommitteeVotes()
	if err != nil {
		return nil, err
	}

	// Get total committee members from course committee
	var committeeCount int64
	err = s.db.Model(&models.CourseCommittee{}).
		Where("course_section_id = ?", approval.StudentEnroll.CourseSectionID).
		Count(&committeeCount).Error
	if err != nil {
		return nil, err
	}

	approvalPercentage, err := approval.CalculateApprovalPercentage()
	if err != nil {
		return nil, err
	}

	// Determine if voting is complete (simple majority)
	votingComplete := len(votes) >= int(committeeCount)/2+1
	
	var finalDecision *string
	if votingComplete {
		approveCount := 0
		rejectCount := 0
		for _, vote := range votes {
			if vote.Vote == "approve" {
				approveCount++
			} else if vote.Vote == "reject" {
				rejectCount++
			}
		}
		
		if approveCount > rejectCount {
			decision := "approved"
			finalDecision = &decision
		} else {
			decision := "rejected"
			finalDecision = &decision
		}
	}

	return &CommitteeVotingData{
		StudentEnrollID:       studentEnrollID,
		TotalCommitteeMembers: int(committeeCount),
		CurrentVotes:          votes,
		ApprovalPercentage:    approvalPercentage,
		VotingComplete:        votingComplete,
		FinalDecision:         finalDecision,
	}, nil
}

// AdvisorApproval handles advisor approval or rejection
func (s *ApprovalService) AdvisorApproval(studentEnrollID uint, advisorID uint, approved bool, remarks string) error {
	approval, err := models.GetApprovalByStudentEnrollID(s.db, studentEnrollID)
	if err != nil {
		return err
	}

	// Validate current status allows advisor approval
	if approval.Status != models.StatusRegistered && approval.Status != models.StatusPending {
		return errors.New("enrollment is not in a state that allows advisor approval")
	}

	// Validate advisor
	if approval.AdvisorID == nil || *approval.AdvisorID != advisorID {
		return errors.New("user is not the assigned advisor for this enrollment")
	}

	// Determine new status
	var newStatus models.InternshipApprovalStatus
	if approved {
		newStatus = models.StatusTApproved
	} else {
		newStatus = models.StatusDenied
	}

	// Check if transition is valid
	if !approval.CanTransitionTo(newStatus) {
		return errors.New("invalid status transition")
	}

	// Update approval record
	oldStatus := approval.Status
	approval.Status = newStatus
	approval.Remarks = remarks
	
	if approved {
		now := time.Now()
		approval.AdvisorApprovedAt = &now
	}

	// Add status transition
	err = approval.AddStatusTransition(oldStatus, newStatus, advisorID, remarks)
	if err != nil {
		return err
	}

	return s.db.Save(approval).Error
}

// CommitteeMemberVote handles committee member voting
func (s *ApprovalService) CommitteeMemberVote(studentEnrollID uint, instructorID uint, vote, remarks string) error {
	if vote != "approve" && vote != "reject" {
		return errors.New("vote must be either 'approve' or 'reject'")
	}

	approval, err := models.GetApprovalByStudentEnrollID(s.db, studentEnrollID)
	if err != nil {
		return err
	}

	// Validate current status allows committee voting
	if approval.Status != models.StatusTApproved {
		return errors.New("enrollment is not in a state that allows committee voting")
	}

	// Verify instructor is a committee member
	var committee models.CourseCommittee
	err = s.db.Where("course_section_id = ? AND instructor_id = ?", 
		approval.StudentEnroll.CourseSectionID, instructorID).
		First(&committee).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("instructor is not a committee member for this course")
		}
		return err
	}

	// Check if instructor has already voted
	hasVoted, err := approval.HasInstructorVoted(instructorID)
	if err != nil {
		return err
	}
	if hasVoted {
		return errors.New("instructor has already voted on this application")
	}

	// Add the vote
	err = approval.AddCommitteeVote(instructorID, vote, remarks)
	if err != nil {
		return err
	}

	// Check if voting is complete and update status if needed
	votes, err := approval.GetCommitteeVotes()
	if err != nil {
		return err
	}

	// Get total committee members
	var committeeCount int64
	err = s.db.Model(&models.CourseCommittee{}).
		Where("course_section_id = ?", approval.StudentEnroll.CourseSectionID).
		Count(&committeeCount).Error
	if err != nil {
		return err
	}

	// Check if we have enough votes for a decision (simple majority)
	if len(votes) >= int(committeeCount)/2+1 {
		approveCount := 0
		for _, v := range votes {
			if v.Vote == "approve" {
				approveCount++
			}
		}

		var newStatus models.InternshipApprovalStatus
		if approveCount > len(votes)/2 {
			newStatus = models.StatusCApproved
		} else {
			newStatus = models.StatusDenied
		}

		// Update status if it changed
		if approval.Status != newStatus {
			oldStatus := approval.Status
			approval.Status = newStatus
			
			err = approval.AddStatusTransition(oldStatus, newStatus, instructorID, "Committee voting completed")
			if err != nil {
				return err
			}
		}
	}

	return s.db.Save(approval).Error
}

// UpdateApprovalStatus updates the approval status manually (admin function)
func (s *ApprovalService) UpdateApprovalStatus(studentEnrollID uint, newStatus models.InternshipApprovalStatus, changedBy uint, reason string) error {
	approval, err := models.GetApprovalByStudentEnrollID(s.db, studentEnrollID)
	if err != nil {
		return err
	}

	// Check if transition is valid
	if !approval.CanTransitionTo(newStatus) {
		return errors.New("invalid status transition")
	}

	oldStatus := approval.Status
	approval.Status = newStatus

	// Add status transition
	err = approval.AddStatusTransition(oldStatus, newStatus, changedBy, reason)
	if err != nil {
		return err
	}

	return s.db.Save(approval).Error
}

// CreateApprovalRecord creates a new approval record for student enrollment
func (s *ApprovalService) CreateApprovalRecord(studentEnrollID uint, advisorID *uint) (*models.InternshipApproval, error) {
	return models.CreateApprovalRecord(s.db, studentEnrollID, advisorID)
}

// GetApprovalsByStatus gets approvals by status
func (s *ApprovalService) GetApprovalsByStatus(status models.InternshipApprovalStatus, limit, offset int) ([]models.InternshipApproval, error) {
	var approvals []models.InternshipApproval
	err := s.db.Where("status = ?", status).
		Preload("StudentEnroll").
		Preload("StudentEnroll.Student").
		Preload("StudentEnroll.CourseSection").
		Preload("Advisor").
		Limit(limit).
		Offset(offset).
		Find(&approvals).Error
	
	return approvals, err
}

// requiresAdministrativeAttention checks if approval requires admin attention
func (s *ApprovalService) requiresAdministrativeAttention(approval *models.InternshipApproval) bool {
	// Check if stuck in intermediate states
	stuckStates := []models.InternshipApprovalStatus{
		models.StatusTApproved,
		models.StatusDocApproved,
	}
	
	for _, state := range stuckStates {
		if approval.Status == state {
			// Check if it's been in this state for more than 7 days
			if time.Since(approval.UpdatedAt).Hours() > 168 { // 7 days
				return true
			}
		}
	}

	return false
}