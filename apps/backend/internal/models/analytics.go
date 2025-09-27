package models

import (
	"encoding/json"
	"time"

	"gorm.io/gorm"
)

// ReportType represents the report type enum
type ReportType string

const (
	ReportTypeStudentProgress   ReportType = "student_progress"
	ReportTypeCompanyPerformance ReportType = "company_performance"
	ReportTypeEvaluationSummary ReportType = "evaluation_summary"
	ReportTypeAttendance        ReportType = "attendance"
	ReportTypeStatistics        ReportType = "statistics"
	ReportTypeCustom            ReportType = "custom"
)

// ReportFormat represents the report format enum
type ReportFormat string

const (
	ReportFormatPDF   ReportFormat = "pdf"
	ReportFormatExcel ReportFormat = "excel"
	ReportFormatCSV   ReportFormat = "csv"
	ReportFormatJSON  ReportFormat = "json"
)

// ReportStatus represents the report status enum
type ReportStatus string

const (
	ReportStatusPending   ReportStatus = "pending"
	ReportStatusGenerating ReportStatus = "generating"
	ReportStatusCompleted ReportStatus = "completed"
	ReportStatusFailed    ReportStatus = "failed"
)

// Report represents the reports table
type Report struct {
	ID          uint         `gorm:"primaryKey;autoIncrement" json:"id"`
	Title       string       `gorm:"not null" json:"title"`
	Description string       `gorm:"type:text" json:"description"`
	ReportType  ReportType   `gorm:"not null" json:"report_type"`
	Format      ReportFormat `gorm:"not null" json:"format"`
	Status      ReportStatus `gorm:"not null;default:pending" json:"status"`
	Parameters  json.RawMessage `gorm:"type:json" json:"parameters"`
	FilePath    string       `json:"file_path"`
	FileSize    int64        `json:"file_size"`
	GeneratedBy uint         `gorm:"not null" json:"generated_by"`
	GeneratedAt *time.Time   `json:"generated_at"`
	ExpiresAt   *time.Time   `json:"expires_at"`
	DownloadCount int        `gorm:"default:0" json:"download_count"`
	IsPublic    bool         `gorm:"default:false" json:"is_public"`
	CreatedAt   time.Time    `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time    `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	Generator User `gorm:"foreignKey:GeneratedBy;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"generator,omitempty"`
}

// TableName specifies the table name for Report model
func (Report) TableName() string {
	return "reports"
}

// Dashboard represents the dashboards table
type Dashboard struct {
	ID          uint            `gorm:"primaryKey;autoIncrement" json:"id"`
	Name        string          `gorm:"not null" json:"name"`
	Description string          `gorm:"type:text" json:"description"`
	Layout      json.RawMessage `gorm:"type:json;not null" json:"layout"`
	IsDefault   bool            `gorm:"default:false" json:"is_default"`
	IsPublic    bool            `gorm:"default:false" json:"is_public"`
	OwnerID     uint            `gorm:"not null" json:"owner_id"`
	CreatedAt   time.Time       `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time       `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	Owner   User            `gorm:"foreignKey:OwnerID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"owner,omitempty"`
	Widgets []DashboardWidget `gorm:"foreignKey:DashboardID" json:"widgets,omitempty"`
}

// TableName specifies the table name for Dashboard model
func (Dashboard) TableName() string {
	return "dashboards"
}

// DashboardWidget represents the dashboard_widgets table
type DashboardWidget struct {
	ID          uint            `gorm:"primaryKey;autoIncrement" json:"id"`
	DashboardID uint            `gorm:"not null" json:"dashboard_id"`
	WidgetType  string          `gorm:"not null" json:"widget_type"`
	Title       string          `gorm:"not null" json:"title"`
	Position    json.RawMessage `gorm:"type:json;not null" json:"position"`
	Config      json.RawMessage `gorm:"type:json" json:"config"`
	DataSource  string          `json:"data_source"`
	RefreshRate int             `gorm:"default:300" json:"refresh_rate"` // seconds
	IsVisible   bool            `gorm:"default:true" json:"is_visible"`
	CreatedAt   time.Time       `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time       `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	Dashboard Dashboard `gorm:"foreignKey:DashboardID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"dashboard,omitempty"`
}

// TableName specifies the table name for DashboardWidget model
func (DashboardWidget) TableName() string {
	return "dashboard_widgets"
}

// Metric represents the metrics table
type Metric struct {
	ID          uint            `gorm:"primaryKey;autoIncrement" json:"id"`
	Name        string          `gorm:"not null;uniqueIndex" json:"name"`
	DisplayName string          `gorm:"not null" json:"display_name"`
	Description string          `gorm:"type:text" json:"description"`
	MetricType  string          `gorm:"not null" json:"metric_type"` // counter, gauge, histogram
	Unit        string          `json:"unit"`
	Query       string          `gorm:"type:text" json:"query"`
	Config      json.RawMessage `gorm:"type:json" json:"config"`
	IsActive    bool            `gorm:"default:true" json:"is_active"`
	CreatedAt   time.Time       `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time       `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	Values []MetricValue `gorm:"foreignKey:MetricID" json:"values,omitempty"`
}

// TableName specifies the table name for Metric model
func (Metric) TableName() string {
	return "metrics"
}

// MetricValue represents the metric_values table
type MetricValue struct {
	ID        uint      `gorm:"primaryKey;autoIncrement" json:"id"`
	MetricID  uint      `gorm:"not null" json:"metric_id"`
	Value     float64   `gorm:"not null" json:"value"`
	Labels    json.RawMessage `gorm:"type:json" json:"labels"`
	Timestamp time.Time `gorm:"not null" json:"timestamp"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`

	// Relationships
	Metric Metric `gorm:"foreignKey:MetricID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"metric,omitempty"`
}

// TableName specifies the table name for MetricValue model
func (MetricValue) TableName() string {
	return "metric_values"
}

// Analytics represents the analytics table
type Analytics struct {
	ID         uint            `gorm:"primaryKey;autoIncrement" json:"id"`
	EventType  string          `gorm:"not null" json:"event_type"`
	EntityType string          `gorm:"not null" json:"entity_type"`
	EntityID   uint            `json:"entity_id"`
	UserID     *uint           `json:"user_id"`
	Properties json.RawMessage `gorm:"type:json" json:"properties"`
	Timestamp  time.Time       `gorm:"not null" json:"timestamp"`
	IPAddress  string          `json:"ip_address"`
	UserAgent  string          `json:"user_agent"`
	CreatedAt  time.Time       `gorm:"autoCreateTime" json:"created_at"`

	// Relationships
	User *User `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL" json:"user,omitempty"`
}

// TableName specifies the table name for Analytics model
func (Analytics) TableName() string {
	return "analytics"
}

// ExportJob represents the export_jobs table
type ExportJob struct {
	ID          uint         `gorm:"primaryKey;autoIncrement" json:"id"`
	JobType     string       `gorm:"not null" json:"job_type"`
	Status      ReportStatus `gorm:"not null;default:pending" json:"status"`
	Parameters  json.RawMessage `gorm:"type:json" json:"parameters"`
	FilePath    string       `json:"file_path"`
	FileSize    int64        `json:"file_size"`
	Progress    int          `gorm:"default:0" json:"progress"` // 0-100
	ErrorMessage string      `gorm:"type:text" json:"error_message"`
	RequestedBy uint         `gorm:"not null" json:"requested_by"`
	StartedAt   *time.Time   `json:"started_at"`
	CompletedAt *time.Time   `json:"completed_at"`
	ExpiresAt   *time.Time   `json:"expires_at"`
	CreatedAt   time.Time    `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time    `gorm:"autoUpdateTime" json:"updated_at"`

	// Relationships
	Requester User `gorm:"foreignKey:RequestedBy;constraint:OnUpdate:CASCADE,OnDelete:CASCADE" json:"requester,omitempty"`
}

// TableName specifies the table name for ExportJob model
func (ExportJob) TableName() string {
	return "export_jobs"
}

// GetParameters returns parsed parameters from JSON
func (r *Report) GetParameters() (map[string]interface{}, error) {
	if r.Parameters == nil {
		return make(map[string]interface{}), nil
	}

	var params map[string]interface{}
	err := json.Unmarshal(r.Parameters, &params)
	if err != nil {
		return nil, err
	}
	return params, nil
}

// SetParameters sets parameters as JSON
func (r *Report) SetParameters(params map[string]interface{}) error {
	data, err := json.Marshal(params)
	if err != nil {
		return err
	}
	r.Parameters = data
	return nil
}

// GetLayout returns parsed layout from JSON
func (d *Dashboard) GetLayout() (map[string]interface{}, error) {
	if d.Layout == nil {
		return make(map[string]interface{}), nil
	}

	var layout map[string]interface{}
	err := json.Unmarshal(d.Layout, &layout)
	if err != nil {
		return nil, err
	}
	return layout, nil
}

// SetLayout sets layout as JSON
func (d *Dashboard) SetLayout(layout map[string]interface{}) error {
	data, err := json.Marshal(layout)
	if err != nil {
		return err
	}
	d.Layout = data
	return nil
}

// GetPosition returns parsed position from JSON
func (dw *DashboardWidget) GetPosition() (map[string]interface{}, error) {
	if dw.Position == nil {
		return make(map[string]interface{}), nil
	}

	var position map[string]interface{}
	err := json.Unmarshal(dw.Position, &position)
	if err != nil {
		return nil, err
	}
	return position, nil
}

// SetPosition sets position as JSON
func (dw *DashboardWidget) SetPosition(position map[string]interface{}) error {
	data, err := json.Marshal(position)
	if err != nil {
		return err
	}
	dw.Position = data
	return nil
}

// GetConfig returns parsed config from JSON
func (dw *DashboardWidget) GetConfig() (map[string]interface{}, error) {
	if dw.Config == nil {
		return make(map[string]interface{}), nil
	}

	var config map[string]interface{}
	err := json.Unmarshal(dw.Config, &config)
	if err != nil {
		return nil, err
	}
	return config, nil
}

// SetConfig sets config as JSON
func (dw *DashboardWidget) SetConfig(config map[string]interface{}) error {
	data, err := json.Marshal(config)
	if err != nil {
		return err
	}
	dw.Config = data
	return nil
}

// IsExpired checks if the report is expired
func (r *Report) IsExpired() bool {
	if r.ExpiresAt == nil {
		return false
	}
	return r.ExpiresAt.Before(time.Now())
}

// GetTypeDisplayText returns Thai display text for report type
func (r *Report) GetTypeDisplayText() string {
	typeTexts := map[ReportType]string{
		ReportTypeStudentProgress:    "ความก้าวหน้านักศึกษา",
		ReportTypeCompanyPerformance: "ประสิทธิภาพบริษัท",
		ReportTypeEvaluationSummary:  "สรุปการประเมิน",
		ReportTypeAttendance:         "การเข้าร่วม",
		ReportTypeStatistics:         "สถิติ",
		ReportTypeCustom:             "กำหนดเอง",
	}

	if text, exists := typeTexts[r.ReportType]; exists {
		return text
	}
	return string(r.ReportType)
}