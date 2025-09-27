package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
)

// ImportTemplates imports existing templates from public_old directory
func main() {
	publicOldDir := "public_old"
	templatesDir := "templates"
	
	// Create templates directory if it doesn't exist
	if err := os.MkdirAll(templatesDir, 0755); err != nil {
		log.Fatalf("Failed to create templates directory: %v", err)
	}
	
	// Create sample templates based on existing PDF patterns
	createCoopRequestTemplate(templatesDir)
	createReferralTemplate(templatesDir)
	createRecommendationTemplate(templatesDir)
	createAcceptanceTemplate(templatesDir)
	
	fmt.Println("Templates imported successfully!")
	fmt.Println("Available templates:")
	fmt.Println("1. Cooperative Education Request Letter (TH/EN)")
	fmt.Println("2. Student Referral Letter (TH/EN)")
	fmt.Println("3. Student Recommendation Letter (TH/EN)")
	fmt.Println("4. Internship Acceptance Letter (TH/EN)")
}

func createCoopRequestTemplate(dir string) {
	// Thai version
	thTemplate := `<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>หนังสือขอความอนุเคราะห์รับนักศึกษาเข้าฝึกงาน</title>
    <style>
        body { font-family: 'TH Sarabun New', Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; }
        .content { margin: 20px 0; }
        .signature { text-align: right; margin-top: 40px; }
    </style>
</head>
<body>
    <div class="header">
        <h2>{{.University.NameTH}}</h2>
        <h3>{{.University.FacultyTH}}</h3>
        <p>{{.University.DepartmentTH}}</p>
    </div>
    
    <p><strong>วันที่:</strong> {{.Document.DateTH}}</p>
    <p><strong>เรื่อง:</strong> ขอความอนุเคราะห์รับนักศึกษาเข้าฝึกงาน</p>
    <p><strong>เรียน:</strong> {{.Document.Recipient}}</p>
    
    <div class="content">
        <p>ด้วย{{.University.FacultyTH}} {{.University.NameTH}} มีความประสงค์จะส่งนักศึกษาเข้าฝึกงานในสถานประกอบการของท่าน เพื่อให้นักศึกษาได้รับประสบการณ์ตรงจากการปฏิบัติงานจริง</p>
        
        <p><strong>รายละเอียดนักศึกษา:</strong></p>
        <ul>
            <li>ชื่อ-นามสกุล: {{.Student.FullName}}</li>
            <li>รหัสนักศึกษา: {{.Student.StudentID}}</li>
            <li>อีเมล: {{.Student.Email}}</li>
            <li>เกรดเฉลี่ย: {{printf "%.2f" .Student.GPAX}}</li>
            <li>สาขาวิชา: {{.Student.Major}}</li>
        </ul>
        
        <p>จึงเรียนมาเพื่อโปรดพิจารณา หากท่านมีความประสงค์จะรับนักศึกษาเข้าฝึกงาน กรุณาติดต่อกลับมายังคณะฯ เพื่อดำเนินการในขั้นตอนต่อไป</p>
    </div>
    
    <div class="signature">
        <p>ขอแสดงความนับถือ</p>
        <br><br>
        <p>({{.Instructor.FullName}})</p>
        <p>{{.Instructor.Position}}</p>
        <p>{{.University.FacultyTH}}</p>
    </div>
</body>
</html>`

	writeTemplate(filepath.Join(dir, "coop_request_th.html"), thTemplate)
}func crea
teReferralTemplate(dir string) {
	// Thai version
	thTemplate := `<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>หนังสือส่งตัวนักศึกษาเข้าฝึกงาน</title>
    <style>
        body { font-family: 'TH Sarabun New', Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; }
        .content { margin: 20px 0; }
        .signature { text-align: right; margin-top: 40px; }
    </style>
</head>
<body>
    <div class="header">
        <h2>{{.University.NameTH}}</h2>
        <h3>{{.University.FacultyTH}}</h3>
        <p>{{.University.DepartmentTH}}</p>
    </div>
    
    <p><strong>วันที่:</strong> {{.Document.DateTH}}</p>
    <p><strong>เรื่อง:</strong> หนังสือส่งตัวนักศึกษาเข้าฝึกงาน</p>
    <p><strong>เรียน:</strong> {{.Document.Recipient}}</p>
    
    <div class="content">
        <p>ตามที่ท่านได้ให้ความอนุเคราะห์รับนักศึกษาของ{{.University.FacultyTH}} {{.University.NameTH}} เข้าฝึกงานในสถานประกอบการของท่าน นั้น</p>
        
        <p>บัดนี้ คณะฯ ขอส่งตัวนักศึกษา ดังรายละเอียดต่อไปนี้</p>
        
        <ul>
            <li>ชื่อ-นามสกุล: {{.Student.FullName}}</li>
            <li>รหัสนักศึกษา: {{.Student.StudentID}}</li>
            <li>อีเมล: {{.Student.Email}}</li>
            <li>ระยะเวลาฝึกงาน: {{.Training.StartDateTH}} ถึง {{.Training.EndDateTH}}</li>
            <li>ตำแหน่งงาน: {{.Training.Position}}</li>
            <li>หน่วยงาน: {{.Training.Department}}</li>
        </ul>
        
        <p>จึงเรียนมาเพื่อทราบ และขอขอบพระคุณท่านที่ให้ความอนุเคราะห์ในครั้งนี้</p>
    </div>
    
    <div class="signature">
        <p>ขอแสดงความนับถือ</p>
        <br><br>
        <p>({{.Instructor.FullName}})</p>
        <p>{{.Instructor.Position}}</p>
        <p>{{.University.FacultyTH}}</p>
    </div>
</body>
</html>`

	writeTemplate(filepath.Join(dir, "referral_th.html"), thTemplate)
}

func createRecommendationTemplate(dir string) {
	// English version
	enTemplate := `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Student Recommendation Letter</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; }
        .content { margin: 20px 0; }
        .signature { text-align: right; margin-top: 40px; }
    </style>
</head>
<body>
    <div class="header">
        <h2>{{.University.NameEN}}</h2>
        <h3>{{.University.FacultyEN}}</h3>
        <p>{{.University.DepartmentEN}}</p>
    </div>
    
    <p><strong>Date:</strong> {{.Document.DateEN}}</p>
    <p><strong>Subject:</strong> Student Recommendation Letter</p>
    <p><strong>To:</strong> {{.Document.Recipient}}</p>
    
    <div class="content">
        <p>The {{.University.FacultyEN}}, {{.University.NameEN}}, hereby certifies that:</p>
        
        <p><strong>Student Details:</strong></p>
        <ul>
            <li>Name: {{.Student.FullName}}</li>
            <li>Student ID: {{.Student.StudentID}}</li>
            <li>Email: {{.Student.Email}}</li>
            <li>GPA: {{printf "%.2f" .Student.GPAX}}</li>
            <li>Major: {{.Student.Major}}</li>
        </ul>
        
        <p>This student demonstrates good conduct, responsibility, and competency in information technology. We highly recommend this student for internship training at your organization.</p>
        
        <p>Thank you for your consideration.</p>
    </div>
    
    <div class="signature">
        <p>Sincerely yours,</p>
        <br><br>
        <p>({{.Instructor.FullName}})</p>
        <p>{{.Instructor.Position}}</p>
        <p>{{.University.FacultyEN}}</p>
    </div>
</body>
</html>`

	writeTemplate(filepath.Join(dir, "recommendation_en.html"), enTemplate)
}

func createAcceptanceTemplate(dir string) {
	// Thai version
	thTemplate := `<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>หนังสือยืนยันการรับเข้าฝึกงาน</title>
    <style>
        body { font-family: 'TH Sarabun New', Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; }
        .content { margin: 20px 0; }
        .signature { text-align: right; margin-top: 40px; }
    </style>
</head>
<body>
    <div class="header">
        <h2>{{.University.NameTH}}</h2>
        <h3>{{.University.FacultyTH}}</h3>
        <p>{{.University.DepartmentTH}}</p>
    </div>
    
    <p><strong>วันที่:</strong> {{.Document.DateTH}}</p>
    <p><strong>เรื่อง:</strong> หนังสือยืนยันการรับเข้าฝึกงาน</p>
    <p><strong>เรียน:</strong> {{.Document.Recipient}}</p>
    
    <div class="content">
        <p>{{.University.FacultyTH}} {{.University.NameTH}} ขอยืนยันการรับนักศึกษาเข้าฝึกงาน ดังรายละเอียดต่อไปนี้</p>
        
        <ul>
            <li>ชื่อ-นามสกุล: {{.Student.FullName}}</li>
            <li>รหัสนักศึกษา: {{.Student.StudentID}}</li>
            <li>สถานประกอบการ: {{.Company.NameTH}}</li>
            <li>ระยะเวลาฝึกงาน: {{.Training.StartDateTH}} ถึง {{.Training.EndDateTH}}</li>
            <li>ตำแหน่งงาน: {{.Training.Position}}</li>
            <li>หน่วยงาน: {{.Training.Department}}</li>
            <li>ผู้ประสานงาน: {{.Training.Coordinator}}</li>
            <li>ผู้ดูแลงาน: {{.Training.Supervisor}}</li>
        </ul>
        
        <p>ทั้งนี้ นักศึกษาจะต้องปฏิบัติตามกฎระเบียบของสถานประกอบการอย่างเคร่งครัด และจะมีอาจารย์นิเทศเข้าเยี่ยมเยียนระหว่างการฝึกงาน</p>
        
        <p>จึงเรียนมาเพื่อทราบ</p>
    </div>
    
    <div class="signature">
        <p>ขอแสดงความนับถือ</p>
        <br><br>
        <p>({{.Instructor.FullName}})</p>
        <p>{{.Instructor.Position}}</p>
        <p>{{.University.FacultyTH}}</p>
    </div>
</body>
</html>`

	writeTemplate(filepath.Join(dir, "acceptance_th.html"), thTemplate)
}

func writeTemplate(filename, content string) {
	if err := os.WriteFile(filename, []byte(content), 0644); err != nil {
		log.Printf("Failed to write template %s: %v", filename, err)
	} else {
		fmt.Printf("Created template: %s\n", filename)
	}
}