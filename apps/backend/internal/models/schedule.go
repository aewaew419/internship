package models

import (
	"time"

	"gorm.io/gorm"
)

// ScheduleType represents the schedule type enum
type ScheduleType string

const (
	ScheduleTypeVisit        ScheduleType = "visit"
	ScheduleTypeMeeting      ScheduleType = "meeting"
	ScheduleTypePresentation ScheduleType = "presentation"
	ScheduleTypeEvaluation   ScheduleType = "evaluation"
	ScheduleTypeDeadline     ScheduleType = "deadline"
	ScheduleTypeReminder     ScheduleType = "reminder"
)

// ScheduleStatus represents the schedule status enum
type ScheduleStatus string

const (
	ScheduleStatusScheduled ScheduleStatus = "scheduled"
	ScheduleStatusConfirmed ScheduleStatus = "confirmed"
	ScheduleStatusCompleted ScheduleStatus = "completed"
	ScheduleStatusCancelled ScheduleStatus = "cancelled"
	ScheduleStatusPostponed ScheduleStatus = "postponed"
)

// RecurrenceType represents the recurrence type enum
type RecurrenceType string

const (
	RecurrenceNone    RecurrenceType = "none"
	RecurrenceDaily   RecurrenceType = "daily"
	RecurrenceWeekly  RecurrenceType = "weekly"
	RecurrenceMonthly RecurrenceType = "monthly"
	RecurrenceYearly  RecurrenceType = "yearly"
)

// Schedule represents the schedules table
type Schedule struct {
	ID                uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	Title             string         `gorm:"not null" json:"title"`
	Description       string         `gorm:"type:text" json:"description"`
	ScheduleType      ScheduleType   `gorm:"not null" json:"schedule_type"`
	Status            ScheduleStatus `gorm:"not null;default:scheduled" json:"status"`
	StartTime         time.Time      `gorm:"not null" json:"start_time"`
	EndTime           time.Time      `gorm:"not null" json:"end_time"`
	Location          string         `json:"location"`
	IsAllDay          bool           `gorm:"default:false" json:"is_all_day"`
	RecurrenceType    RecurrenceType `gorm:"default:none" json:"recurrence_type"`
	RecurrenceEnd     *time.Time     `json:"recurrence_end"`
	StudentTrainingID *uint          `json:"student_training_id"`
	CreatedBy         uint           `gorm:"not null" json:"created_by"`
	CreatedAt         time.Time      `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt         time.Time      `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	StudentTraining *StudentTraining    `gorm:"foreignKey:StudentTrainingID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL" json:"student_training,omitempty"`
	Creator         User                `gorm:"foreignKey:CreatedBy;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"creator,omitempty"`
	Participants    []ScheduleParticipant `gorm:"foreignKey:ScheduleID" json:"participants,omitempty"`
	Notifications   []ScheduleNotification `gorm:"foreignKey:ScheduleID" json:"notifications,omitempty"`
}

// TableName specifies the table name for Schedule model
func (Schedule) TableName() string {
	return "schedules"
}

// ScheduleParticipant represents the schedule_participants table
type ScheduleParticipant struct {
	ID         uint   `gorm:"primaryKey;autoIncrement" json:"id"`
	ScheduleID uint   `gorm:"not null" json:"schedule_id"`
	UserID     uint   `gorm:"not null" json:"user_id"`
	Role       string `gorm:"not null" json:"role"` // organizer, participant, optional
	Status     string `gorm:"default:pending" json:"status"` // pending, accepted, declined
	CreatedAt  time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt  time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	Schedule Schedule `gorm:"foreignKey:ScheduleID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"schedule,omitempty"`
	User     User     `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"user,omitempty"`
}

// TableName specifies the table name for ScheduleParticipant model
func (ScheduleParticipant) TableName() string {
	return "schedule_participants"
}

// ScheduleNotification represents the schedule_notifications table
type ScheduleNotification struct {
	ID           uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	ScheduleID   uint      `gorm:"not null" json:"schedule_id"`
	UserID       uint      `gorm:"not null" json:"user_id"`
	NotifyBefore int       `gorm:"not null" json:"notify_before"` // minutes before event
	NotifyAt     time.Time `gorm:"not null" json:"notify_at"`
	IsSent       bool      `gorm:"default:false" json:"is_sent"`
	SentAt       *time.Time `json:"sent_at"`
	CreatedAt    time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt    time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	Schedule Schedule `gorm:"foreignKey:ScheduleID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"schedule,omitempty"`
	User     User     `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"user,omitempty"`
}

// TableName specifies the table name for ScheduleNotification model
func (ScheduleNotification) TableName() string {
	return "schedule_notifications"
}

// Appointment represents the appointments table
type Appointment struct {
	ID                uint           `gorm:"primaryKey;autoIncrement" json:"id"`
	Title             string         `gorm:"not null" json:"title"`
	Description       string         `gorm:"type:text" json:"description"`
	AppointmentDate   time.Time      `gorm:"not null" json:"appointment_date"`
	Duration          int            `gorm:"not null" json:"duration"` // minutes
	Location          string         `json:"location"`
	Status            ScheduleStatus `gorm:"not null;default:scheduled" json:"status"`
	StudentTrainingID *uint          `json:"student_training_id"`
	RequestedBy       uint           `gorm:"not null" json:"requested_by"`
	ApprovedBy        *uint          `json:"approved_by"`
	ApprovedAt        *time.Time     `json:"approved_at"`
	Notes             string         `gorm:"type:text" json:"notes"`
	CreatedAt         time.Time      `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt         time.Time      `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	StudentTraining *StudentTraining `gorm:"foreignKey:StudentTrainingID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL" json:"student_training,omitempty"`
	Requester       User             `gorm:"foreignKey:RequestedBy;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"requester,omitempty"`
	Approver        *User            `gorm:"foreignKey:ApprovedBy;constraint:OnUpdate:CASCADE,OnDelete:SET NULL" json:"approver,omitempty"`
}

// TableName specifies the table name for Appointment model
func (Appointment) TableName() string {
	return "appointments"
}

// Calendar represents the calendars table
type Calendar struct {
	ID          uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	Name        string    `gorm:"not null" json:"name"`
	Description string    `gorm:"type:text" json:"description"`
	Color       string    `gorm:"default:#3498db" json:"color"`
	IsPublic    bool      `gorm:"default:false" json:"is_public"`
	OwnerID     uint      `gorm:"not null" json:"owner_id"`
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	Owner     User       `gorm:"foreignKey:OwnerID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"owner,omitempty"`
	Schedules []Schedule `gorm:"many2many:calendar_schedules" json:"schedules,omitempty"`
}

// TableName specifies the table name for Calendar model
func (Calendar) TableName() string {
	return "calendars"
}

// CalendarSchedule represents the calendar_schedules table (many-to-many)
type CalendarSchedule struct {
	CalendarID uint `gorm:"primaryKey" json:"calendar_id"`
	ScheduleID uint `gorm:"primaryKey" json:"schedule_id"`
	CreatedAt  time.Time `gorm:"autoCreateTime" json:"created_at"`

	// Relationships
	Calendar Calendar `gorm:"foreignKey:CalendarID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"calendar,omitempty"`
	Schedule Schedule `gorm:"foreignKey:ScheduleID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"schedule,omitempty"`
}

// TableName specifies the table name for CalendarSchedule model
func (CalendarSchedule) TableName() string {
	return "calendar_schedules"
}

// BeforeDelete hook to clean up related records when schedule is deleted
func (s *Schedule) BeforeDelete(tx *gorm.DB) error {
	// Delete all schedule participants
	if err := tx.Where("schedule_id = ?", s.ID).Delete(&ScheduleParticipant{}).Error; err != nil {
		return err
	}

	// Delete all schedule notifications
	if err := tx.Where("schedule_id = ?", s.ID).Delete(&ScheduleNotification{}).Error; err != nil {
		return err
	}

	// Delete calendar associations
	if err := tx.Where("schedule_id = ?", s.ID).Delete(&CalendarSchedule{}).Error; err != nil {
		return err
	}

	return nil
}

// GetTypeDisplayText returns Thai display text for schedule type
func (s *Schedule) GetTypeDisplayText() string {
	typeTexts := map[ScheduleType]string{
		ScheduleTypeVisit:        "การเยี่ยมชม",
		ScheduleTypeMeeting:      "การประชุม",
		ScheduleTypePresentation: "การนำเสนอ",
		ScheduleTypeEvaluation:   "การประเมิน",
		ScheduleTypeDeadline:     "กำหนดส่ง",
		ScheduleTypeReminder:     "การแจ้งเตือน",
	}

	if text, exists := typeTexts[s.ScheduleType]; exists {
		return text
	}
	return string(s.ScheduleType)
}

// GetStatusDisplayText returns Thai display text for schedule status
func (s *Schedule) GetStatusDisplayText() string {
	statusTexts := map[ScheduleStatus]string{
		ScheduleStatusScheduled: "กำหนดการ",
		ScheduleStatusConfirmed: "ยืนยันแล้ว",
		ScheduleStatusCompleted: "เสร็จสิ้น",
		ScheduleStatusCancelled: "ยกเลิก",
		ScheduleStatusPostponed: "เลื่อน",
	}

	if text, exists := statusTexts[s.Status]; exists {
		return text
	}
	return string(s.Status)
}

// IsUpcoming checks if the schedule is upcoming
func (s *Schedule) IsUpcoming() bool {
	return s.StartTime.After(time.Now())
}

// IsOverdue checks if the schedule is overdue
func (s *Schedule) IsOverdue() bool {
	return s.EndTime.Before(time.Now()) && s.Status != ScheduleStatusCompleted && s.Status != ScheduleStatusCancelled
}