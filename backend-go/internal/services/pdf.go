package services

import (
	"fmt"
	"path/filepath"
	"time"

	"backend-go/internal/models"

	"github.com/johnfercher/maroto/v2"
	"github.com/johnfercher/maroto/v2/pkg/components/col"
	"github.com/johnfercher/maroto/v2/pkg/components/row"
	"github.com/johnfercher/maroto/v2/pkg/components/text"
	"github.com/johnfercher/maroto/v2/pkg/config"
	"github.com/johnfercher/maroto/v2/pkg/consts/align"
	"github.com/johnfercher/maroto/v2/pkg/consts/fontstyle"
	"github.com/johnfercher/maroto/v2/pkg/core"
	"github.com/johnfercher/maroto/v2/pkg/props"
)

// PDFService handles PDF generation for various reports and letters
type PDFService struct {
	outputDir string
}

// NewPDFService creates a new PDF service instance
func NewPDFService(outputDir string) *PDFService {
	return &PDFService{
		outputDir: outputDir,
	}
}

// ReportType represents different types of reports
type ReportType string

const (
	ReportTypeStudentList        ReportType = "student_list"
	ReportTypeInternshipSummary  ReportType = "internship_summary"
	ReportTypeVisitorSchedule    ReportType = "visitor_schedule"
	ReportTypeCompanyEvaluation  ReportType = "company_evaluation"
	ReportTypeStudentEvaluation  ReportType = "student_evaluation"
)

// LetterType represents different types of letters
type LetterType string

const (
	LetterTypeCoopRequest    LetterType = "coop_request"
	LetterTypeReferral       LetterType = "referral"
	LetterTypeRecommendation LetterType = "recommendation"
	LetterTypeAcceptance     LetterType = "acceptance"
)

// ReportData contains data for generating reports
type ReportData struct {
	Title       string
	Students    []models.Student
	Companies   []models.Company
	Trainings   []models.StudentTraining
	Schedules   []models.VisitorSchedule
	GeneratedAt time.Time
	GeneratedBy string
}

// LetterData contains data for generating letters
type LetterData struct {
	Student     models.Student
	Company     *models.Company
	Training    *models.StudentTraining
	Instructor  *models.Instructor
	Recipient   string
	Subject     string
	Content     string
	Language    models.DocumentLanguage
	GeneratedAt time.Time
	GeneratedBy string
}

// GenerateReport generates a PDF report based on the report type and data
func (s *PDFService) GenerateReport(reportType ReportType, data ReportData) (string, error) {
	cfg := config.NewBuilder().
		WithPageNumber().
		Build()

	mrt := maroto.New(cfg)
	m := maroto.NewMetricsDecorator(mrt)

	// Add header
	s.addReportHeader(m, data.Title, data.GeneratedAt, data.GeneratedBy)

	// Generate content based on report type
	switch reportType {
	case ReportTypeStudentList:
		s.generateStudentListReport(m, data.Students)
	case ReportTypeInternshipSummary:
		s.generateInternshipSummaryReport(m, data.Trainings)
	case ReportTypeVisitorSchedule:
		s.generateVisitorScheduleReport(m, data.Schedules)
	case ReportTypeCompanyEvaluation:
		s.generateCompanyEvaluationReport(m, data.Companies)
	default:
		return "", fmt.Errorf("unsupported report type: %s", reportType)
	}

	// Generate filename
	filename := fmt.Sprintf("%s_%s.pdf", reportType, time.Now().Format("20060102_150405"))
	filepath := filepath.Join(s.outputDir, filename)

	// Generate PDF
	document, err := m.Generate()
	if err != nil {
		return "", fmt.Errorf("failed to generate PDF: %w", err)
	}

	err = document.Save(filepath)
	if err != nil {
		return "", fmt.Errorf("failed to save PDF: %w", err)
	}

	return filename, nil
}

// GenerateLetter generates a PDF letter based on the letter type and data
func (s *PDFService) GenerateLetter(letterType LetterType, data LetterData) (string, error) {
	cfg := config.NewBuilder().
		WithPageNumber().
		Build()

	mrt := maroto.New(cfg)
	m := maroto.NewMetricsDecorator(mrt)

	// Add letterhead
	s.addLetterHeader(m, data.Language)

	// Generate content based on letter type
	switch letterType {
	case LetterTypeCoopRequest:
		s.generateCoopRequestLetter(m, data)
	case LetterTypeReferral:
		s.generateReferralLetter(m, data)
	case LetterTypeRecommendation:
		s.generateRecommendationLetter(m, data)
	case LetterTypeAcceptance:
		s.generateAcceptanceLetter(m, data)
	default:
		return "", fmt.Errorf("unsupported letter type: %s", letterType)
	}

	// Add footer
	s.addLetterFooter(m, data.GeneratedAt, data.GeneratedBy)

	// Generate filename
	filename := fmt.Sprintf("%s_%s_%s.pdf", letterType, data.Student.StudentID, time.Now().Format("20060102_150405"))
	filepath := filepath.Join(s.outputDir, filename)

	// Generate PDF
	document, err := m.Generate()
	if err != nil {
		return "", fmt.Errorf("failed to generate PDF: %w", err)
	}

	err = document.Save(filepath)
	if err != nil {
		return "", fmt.Errorf("failed to save PDF: %w", err)
	}

	return filename, nil
}

// addReportHeader adds a header to the report
func (s *PDFService) addReportHeader(m core.Maroto, title string, generatedAt time.Time, generatedBy string) {
	m.AddRows(
		row.New(20).Add(
			col.New(12).Add(
				text.New(title, props.Text{
					Top:   3,
					Style: fontstyle.Bold,
					Align: align.Center,
					Size:  16,
				}),
			),
		),
		row.New(10).Add(
			col.New(6).Add(
				text.New(fmt.Sprintf("Generated: %s", generatedAt.Format("2006-01-02 15:04:05")), props.Text{
					Size: 10,
				}),
			),
			col.New(6).Add(
				text.New(fmt.Sprintf("Generated by: %s", generatedBy), props.Text{
					Size:  10,
					Align: align.Right,
				}),
			),
		),
		row.New(5), // Spacer
	)
}

// generateStudentListReport generates a student list report
func (s *PDFService) generateStudentListReport(m core.Maroto, students []models.Student) {
	// Add table header
	m.AddRow(10,
		col.New(1).Add(text.New("No.", props.Text{Style: fontstyle.Bold, Size: 10})),
		col.New(2).Add(text.New("Student ID", props.Text{Style: fontstyle.Bold, Size: 10})),
		col.New(4).Add(text.New("Name", props.Text{Style: fontstyle.Bold, Size: 10})),
		col.New(3).Add(text.New("Email", props.Text{Style: fontstyle.Bold, Size: 10})),
		col.New(2).Add(text.New("GPAX", props.Text{Style: fontstyle.Bold, Size: 10})),
	)

	// Add student data
	for i, student := range students {
		m.AddRow(8,
			col.New(1).Add(text.New(fmt.Sprintf("%d", i+1), props.Text{Size: 9})),
			col.New(2).Add(text.New(student.StudentID, props.Text{Size: 9})),
			col.New(4).Add(text.New(student.GetFullName(), props.Text{Size: 9})),
			col.New(3).Add(text.New(student.Email, props.Text{Size: 9})),
			col.New(2).Add(text.New(fmt.Sprintf("%.2f", student.GPAX), props.Text{Size: 9})),
		)
	}
}

// generateInternshipSummaryReport generates an internship summary report
func (s *PDFService) generateInternshipSummaryReport(m core.Maroto, trainings []models.StudentTraining) {
	// Add table header
	m.AddRow(10,
		col.New(2).Add(text.New("Student", props.Text{Style: fontstyle.Bold, Size: 10})),
		col.New(3).Add(text.New("Company", props.Text{Style: fontstyle.Bold, Size: 10})),
		col.New(2).Add(text.New("Start Date", props.Text{Style: fontstyle.Bold, Size: 10})),
		col.New(2).Add(text.New("End Date", props.Text{Style: fontstyle.Bold, Size: 10})),
		col.New(3).Add(text.New("Position", props.Text{Style: fontstyle.Bold, Size: 10})),
	)

	// Add training data
	for _, training := range trainings {
		studentName := "N/A"
		if training.StudentEnroll.Student.ID != 0 {
			studentName = training.StudentEnroll.Student.GetFullName()
		}

		companyName := "N/A"
		if training.Company != nil {
			companyName = training.Company.CompanyNameEn
		}

		m.AddRow(8,
			col.New(2).Add(text.New(studentName, props.Text{Size: 9})),
			col.New(3).Add(text.New(companyName, props.Text{Size: 9})),
			col.New(2).Add(text.New(training.StartDate.Format("2006-01-02"), props.Text{Size: 9})),
			col.New(2).Add(text.New(training.EndDate.Format("2006-01-02"), props.Text{Size: 9})),
			col.New(3).Add(text.New(training.Position, props.Text{Size: 9})),
		)
	}
}

// generateVisitorScheduleReport generates a visitor schedule report
func (s *PDFService) generateVisitorScheduleReport(m core.Maroto, schedules []models.VisitorSchedule) {
	// Add table header
	m.AddRow(10,
		col.New(2).Add(text.New("Visitor", props.Text{Style: fontstyle.Bold, Size: 10})),
		col.New(2).Add(text.New("Student", props.Text{Style: fontstyle.Bold, Size: 10})),
		col.New(2).Add(text.New("Visit No.", props.Text{Style: fontstyle.Bold, Size: 10})),
		col.New(3).Add(text.New("Visit Date", props.Text{Style: fontstyle.Bold, Size: 10})),
		col.New(3).Add(text.New("Comment", props.Text{Style: fontstyle.Bold, Size: 10})),
	)

	// Add schedule data
	for _, schedule := range schedules {
		visitorName := "N/A"
		studentName := "N/A"
		visitDate := "Not scheduled"

		// Get visitor name from instructor
		visitorName = schedule.Training.Visitor.GetFullName()

		// Get student name
		if schedule.Training.StudentEnroll.Student.ID != 0 {
			studentName = schedule.Training.StudentEnroll.Student.GetFullName()
		}

		if schedule.VisitAt != nil {
			visitDate = schedule.VisitAt.Format("2006-01-02 15:04")
		}

		comment := ""
		if schedule.Comment != nil {
			comment = *schedule.Comment
		}

		m.AddRow(8,
			col.New(2).Add(text.New(visitorName, props.Text{Size: 9})),
			col.New(2).Add(text.New(studentName, props.Text{Size: 9})),
			col.New(2).Add(text.New(fmt.Sprintf("%d", schedule.VisitNo), props.Text{Size: 9})),
			col.New(3).Add(text.New(visitDate, props.Text{Size: 9})),
			col.New(3).Add(text.New(comment, props.Text{Size: 9})),
		)
	}
}

// generateCompanyEvaluationReport generates a company evaluation report
func (s *PDFService) generateCompanyEvaluationReport(m core.Maroto, companies []models.Company) {
	// Add table header
	m.AddRow(10,
		col.New(1).Add(text.New("No.", props.Text{Style: fontstyle.Bold, Size: 10})),
		col.New(4).Add(text.New("Company Name", props.Text{Style: fontstyle.Bold, Size: 10})),
		col.New(3).Add(text.New("Type", props.Text{Style: fontstyle.Bold, Size: 10})),
		col.New(4).Add(text.New("Contact", props.Text{Style: fontstyle.Bold, Size: 10})),
	)

	// Add company data
	for i, company := range companies {
		m.AddRow(8,
			col.New(1).Add(text.New(fmt.Sprintf("%d", i+1), props.Text{Size: 9})),
			col.New(4).Add(text.New(company.CompanyNameEn, props.Text{Size: 9})),
			col.New(3).Add(text.New(company.CompanyType, props.Text{Size: 9})),
			col.New(4).Add(text.New(company.CompanyEmail, props.Text{Size: 9})),
		)
	}
}

// addLetterHeader adds a letterhead to the document
func (s *PDFService) addLetterHeader(m core.Maroto, language models.DocumentLanguage) {
	var universityName, facultyName, departmentName string
	
	if language == models.DocumentLanguageTH {
		universityName = "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี"
		facultyName = "คณะเทคโนโลยีสารสนเทศ"
		departmentName = "ภาควิชาเทคโนโลยีสารสนเทศ"
	} else {
		universityName = "King Mongkut's University of Technology Thonburi"
		facultyName = "Faculty of Information Technology"
		departmentName = "Department of Information Technology"
	}

	m.AddRows(
		row.New(15).Add(
			col.New(12).Add(
				text.New(universityName, props.Text{
					Top:   3,
					Style: fontstyle.Bold,
					Align: align.Center,
					Size:  14,
				}),
			),
		),
		row.New(10).Add(
			col.New(12).Add(
				text.New(facultyName, props.Text{
					Style: fontstyle.Bold,
					Align: align.Center,
					Size:  12,
				}),
			),
		),
		row.New(10).Add(
			col.New(12).Add(
				text.New(departmentName, props.Text{
					Align: align.Center,
					Size:  11,
				}),
			),
		),
		row.New(15), // Spacer
	)
}

// generateCoopRequestLetter generates a cooperative education request letter
func (s *PDFService) generateCoopRequestLetter(m core.Maroto, data LetterData) {
	var subject, salutation, content, closing string
	
	if data.Language == models.DocumentLanguageTH {
		subject = "ขอความอนุเคราะห์รับนักศึกษาเข้าฝึกงาน"
		salutation = "เรียน " + data.Recipient
		content = fmt.Sprintf(`
ด้วยคณะเทคโนโลยีสารสนเทศ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี มีความประสงค์จะส่งนักศึกษา
เข้าฝึกงานในสถานประกอบการของท่าน เพื่อให้นักศึกษาได้รับประสบการณ์ตรงจากการปฏิบัติงานจริง

รายละเอียดนักศึกษา:
ชื่อ-นามสกุล: %s
รหัสนักศึกษา: %s
อีเมล: %s
เกรดเฉลี่ย: %.2f

จึงเรียนมาเพื่อโปรดพิจารณา หากท่านมีความประสงค์จะรับนักศึกษาเข้าฝึกงาน
กรุณาติดต่อกลับมายังคณะฯ เพื่อดำเนินการในขั้นตอนต่อไป`,
			data.Student.GetFullName(),
			data.Student.StudentID,
			data.Student.Email,
			data.Student.GPAX)
		closing = "ขอแสดงความนับถือ"
	} else {
		subject = "Request for Student Internship Placement"
		salutation = "Dear " + data.Recipient
		content = fmt.Sprintf(`
The Faculty of Information Technology, King Mongkut's University of Technology Thonburi,
would like to request your consideration for accepting our student for internship training
at your organization to provide practical work experience.

Student Details:
Name: %s
Student ID: %s
Email: %s
GPA: %.2f

We would be grateful if you could consider accepting our student for internship.
Please contact the faculty for further arrangements if you are interested.`,
			data.Student.GetFullName(),
			data.Student.StudentID,
			data.Student.Email,
			data.Student.GPAX)
		closing = "Sincerely yours,"
	}

	// Add subject
	m.AddRow(10,
		col.New(12).Add(
			text.New("เรื่อง: "+subject, props.Text{
				Style: fontstyle.Bold,
				Size:  12,
			}),
		),
	)

	// Add salutation
	m.AddRow(10,
		col.New(12).Add(
			text.New(salutation, props.Text{
				Size: 11,
			}),
		),
	)

	// Add content
	m.AddRow(80,
		col.New(12).Add(
			text.New(content, props.Text{
				Size: 11,
				Top:  5,
			}),
		),
	)

	// Add closing
	m.AddRow(20,
		col.New(12).Add(
			text.New(closing, props.Text{
				Size:  11,
				Align: align.Right,
				Top:   10,
			}),
		),
	)
}

// generateReferralLetter generates a student referral letter
func (s *PDFService) generateReferralLetter(m core.Maroto, data LetterData) {
	var subject, salutation, content, closing string
	
	if data.Language == models.DocumentLanguageTH {
		subject = "หนังสือส่งตัวนักศึกษาเข้าฝึกงาน"
		salutation = "เรียน " + data.Recipient
		content = fmt.Sprintf(`
ตามที่ท่านได้ให้ความอนุเคราะห์รับนักศึกษาของคณะเทคโนโลยีสารสนเทศ 
มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี เข้าฝึกงานในสถานประกอบการของท่าน นั้น

บัดนี้ คณะฯ ขอส่งตัวนักศึกษา ดังรายละเอียดต่อไปนี้

ชื่อ-นามสกุล: %s
รหัสนักศึกษา: %s
อีเมล: %s
ระยะเวลาฝึกงาน: %s ถึง %s

จึงเรียนมาเพื่อทราบ และขอขอบพระคุณท่านที่ให้ความอนุเคราะห์ในครั้งนี้`,
			data.Student.GetFullName(),
			data.Student.StudentID,
			data.Student.Email,
			data.Training.StartDate.Format("2 มกราคม 2006"),
			data.Training.EndDate.Format("2 มกราคม 2006"))
		closing = "ขอแสดงความนับถือ"
	} else {
		subject = "Student Referral Letter for Internship"
		salutation = "Dear " + data.Recipient
		content = fmt.Sprintf(`
Following your kind acceptance of our student from the Faculty of Information Technology,
King Mongkut's University of Technology Thonburi, for internship training at your organization.

We would like to refer the following student:

Name: %s
Student ID: %s
Email: %s
Internship Period: %s to %s

Thank you for your kind cooperation and support.`,
			data.Student.GetFullName(),
			data.Student.StudentID,
			data.Student.Email,
			data.Training.StartDate.Format("January 2, 2006"),
			data.Training.EndDate.Format("January 2, 2006"))
		closing = "Sincerely yours,"
	}

	// Add subject
	m.AddRow(10,
		col.New(12).Add(
			text.New("เรื่อง: "+subject, props.Text{
				Style: fontstyle.Bold,
				Size:  12,
			}),
		),
	)

	// Add salutation
	m.AddRow(10,
		col.New(12).Add(
			text.New(salutation, props.Text{
				Size: 11,
			}),
		),
	)

	// Add content
	m.AddRow(60,
		col.New(12).Add(
			text.New(content, props.Text{
				Size: 11,
				Top:  5,
			}),
		),
	)

	// Add closing
	m.AddRow(20,
		col.New(12).Add(
			text.New(closing, props.Text{
				Size:  11,
				Align: align.Right,
				Top:   10,
			}),
		),
	)
}

// generateRecommendationLetter generates a student recommendation letter
func (s *PDFService) generateRecommendationLetter(m core.Maroto, data LetterData) {
	var subject, salutation, content, closing string
	
	if data.Language == models.DocumentLanguageTH {
		subject = "หนังสือรับรองนักศึกษา"
		salutation = "เรียน " + data.Recipient
		content = fmt.Sprintf(`
คณะเทคโนโลยีสารสนเทศ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี ขอรับรองว่า

นาย/นางสาว %s รหัสนักศึกษา %s เป็นนักศึกษาของคณะเทคโนโลยีสารสนเทศ
มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี มีผลการเรียนเฉลี่ย %.2f

นักศึกษาผู้นี้มีความประพฤติดี มีความรับผิดชอบ และมีความสามารถในด้านเทคโนโลยีสารสนเทศ
เหมาะสมที่จะเข้าฝึกงานในสถานประกอบการของท่าน

จึงเรียนมาเพื่อโปรดทราบ`,
			data.Student.GetFullName(),
			data.Student.StudentID,
			data.Student.GPAX)
		closing = "ขอแสดงความนับถือ"
	} else {
		subject = "Student Recommendation Letter"
		salutation = "To Whom It May Concern"
		content = fmt.Sprintf(`
The Faculty of Information Technology, King Mongkut's University of Technology Thonburi,
hereby certifies that:

Mr./Ms. %s, Student ID: %s, is a student of the Faculty of Information Technology,
King Mongkut's University of Technology Thonburi, with a GPA of %.2f

This student demonstrates good conduct, responsibility, and competency in information technology.
We highly recommend this student for internship training at your organization.

Thank you for your consideration.`,
			data.Student.GetFullName(),
			data.Student.StudentID,
			data.Student.GPAX)
		closing = "Sincerely yours,"
	}

	// Add subject
	m.AddRow(10,
		col.New(12).Add(
			text.New("เรื่อง: "+subject, props.Text{
				Style: fontstyle.Bold,
				Size:  12,
			}),
		),
	)

	// Add salutation
	m.AddRow(10,
		col.New(12).Add(
			text.New(salutation, props.Text{
				Size: 11,
			}),
		),
	)

	// Add content
	m.AddRow(60,
		col.New(12).Add(
			text.New(content, props.Text{
				Size: 11,
				Top:  5,
			}),
		),
	)

	// Add closing
	m.AddRow(20,
		col.New(12).Add(
			text.New(closing, props.Text{
				Size:  11,
				Align: align.Right,
				Top:   10,
			}),
		),
	)
}

// generateAcceptanceLetter generates an internship acceptance letter
func (s *PDFService) generateAcceptanceLetter(m core.Maroto, data LetterData) {
	var subject, salutation, content, closing string
	
	if data.Language == models.DocumentLanguageTH {
		subject = "หนังสือยืนยันการรับเข้าฝึกงาน"
		salutation = "เรียน " + data.Recipient
		content = fmt.Sprintf(`
คณะเทคโนโลยีสารสนเทศ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี 
ขอยืนยันการรับนักศึกษาเข้าฝึกงาน ดังรายละเอียดต่อไปนี้

ชื่อ-นามสกุล: %s
รหัสนักศึกษา: %s
สถานประกอบการ: %s
ระยะเวลาฝึกงาน: %s ถึง %s
ตำแหน่งงาน: %s
หน่วยงาน: %s

ทั้งนี้ นักศึกษาจะต้องปฏิบัติตามกฎระเบียบของสถานประกอบการอย่างเคร่งครัด
และจะมีอาจารย์นิเทศเข้าเยี่ยมเยียนระหว่างการฝึกงาน

จึงเรียนมาเพื่อทราบ`,
			data.Student.GetFullName(),
			data.Student.StudentID,
			data.Company.CompanyNameTh,
			data.Training.StartDate.Format("2 มกราคม 2006"),
			data.Training.EndDate.Format("2 มกราคม 2006"),
			data.Training.Position,
			data.Training.Department)
		closing = "ขอแสดงความนับถือ"
	} else {
		subject = "Internship Acceptance Confirmation"
		salutation = "Dear " + data.Recipient
		content = fmt.Sprintf(`
The Faculty of Information Technology, King Mongkut's University of Technology Thonburi,
confirms the acceptance of our student for internship training as follows:

Name: %s
Student ID: %s
Company: %s
Internship Period: %s to %s
Position: %s
Department: %s

The student is required to strictly follow the company's rules and regulations.
A faculty supervisor will visit during the internship period.

Thank you for your cooperation.`,
			data.Student.GetFullName(),
			data.Student.StudentID,
			data.Company.CompanyNameEn,
			data.Training.StartDate.Format("January 2, 2006"),
			data.Training.EndDate.Format("January 2, 2006"),
			data.Training.Position,
			data.Training.Department)
		closing = "Sincerely yours,"
	}

	// Add subject
	m.AddRow(10,
		col.New(12).Add(
			text.New("เรื่อง: "+subject, props.Text{
				Style: fontstyle.Bold,
				Size:  12,
			}),
		),
	)

	// Add salutation
	m.AddRow(10,
		col.New(12).Add(
			text.New(salutation, props.Text{
				Size: 11,
			}),
		),
	)

	// Add content
	m.AddRow(80,
		col.New(12).Add(
			text.New(content, props.Text{
				Size: 11,
				Top:  5,
			}),
		),
	)

	// Add closing
	m.AddRow(20,
		col.New(12).Add(
			text.New(closing, props.Text{
				Size:  11,
				Align: align.Right,
				Top:   10,
			}),
		),
	)
}

// addLetterFooter adds a footer to the letter
func (s *PDFService) addLetterFooter(m core.Maroto, generatedAt time.Time, generatedBy string) {
	m.AddRows(
		row.New(10), // Spacer
		row.New(8).Add(
			col.New(6).Add(
				text.New(fmt.Sprintf("Generated: %s", generatedAt.Format("2006-01-02 15:04:05")), props.Text{
					Size: 8,
				}),
			),
			col.New(6).Add(
				text.New(fmt.Sprintf("Generated by: %s", generatedBy), props.Text{
					Size:  8,
					Align: align.Right,
				}),
			),
		),
	)
}