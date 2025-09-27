-- ข้อมูลตัวอย่างสำหรับระบบเอกสารทางราชการ
-- รันไฟล์นี้หลังจาก add-official-document-system.sql แล้ว

-- เพิ่มประเภทเอกสารทางราชการ
INSERT INTO official_document_types (code, name, name_th, name_en, description, document_format, language_support, number_format, template_th, template_en, requires_approval, approval_levels, created_by) VALUES

-- หนังสือขอความอนุเคราะห์
('COOP_REQ', 'หนังสือขอความอนุเคราะห์รับนักศึกษาเข้าฝึกงาน', 'หนังสือขอความอนุเคราะห์รับนักศึกษาเข้าฝึกงาน', 'Cooperative Education Request Letter', 
'หนังสือทางราชการขอความอนุเคราะห์จากบริษัทให้รับนักศึกษาเข้าฝึกงาน', 'official', 
'["th", "en"]', '{"th": "thai", "en": "arabic"}', 
'templates/official/coop_request_th.html', 'templates/official/coop_request_en.html', 
true, 2, 1),

-- หนังสือส่งตัวนักศึกษา
('STU_REF', 'หนังสือส่งตัวนักศึกษาเข้าฝึกงาน', 'หนังสือส่งตัวนักศึกษาเข้าฝึกงาน', 'Student Referral Letter', 
'หนังสือทางราชการส่งตัวนักศึกษาไปยังสถานประกอบการ', 'official', 
'["th", "en"]', '{"th": "thai", "en": "arabic"}', 
'templates/official/student_referral_th.html', 'templates/official/student_referral_en.html', 
true, 2, 1),

-- หนังสือรับรองนักศึกษา
('STU_CERT', 'หนังสือรับรองนักศึกษา', 'หนังสือรับรองนักศึกษา', 'Student Certification Letter', 
'หนังสือทางราชการรับรองสถานภาพนักศึกษา', 'certificate', 
'["th", "en"]', '{"th": "thai", "en": "arabic"}', 
'templates/official/student_cert_th.html', 'templates/official/student_cert_en.html', 
true, 1, 1),

-- หนังสือแจ้งผลการประเมิน
('EVAL_RESULT', 'หนังสือแจ้งผลการประเมินการฝึกงาน', 'หนังสือแจ้งผลการประเมินการฝึกงาน', 'Internship Evaluation Result Letter', 
'หนังสือทางราชการแจ้งผลการประเมินการฝึกงานของนักศึกษา', 'official', 
'["th", "en"]', '{"th": "thai", "en": "arabic"}', 
'templates/official/eval_result_th.html', 'templates/official/eval_result_en.html', 
true, 2, 1),

-- หนังสือขอบคุณ
('THANK_YOU', 'หนังสือขอบคุณสถานประกอบการ', 'หนังสือขอบคุณสถานประกอบการ', 'Thank You Letter to Company', 
'หนังสือทางราชการขอบคุณสถานประกอบการที่ให้ความอนุเคราะห์', 'letter', 
'["th", "en"]', '{"th": "thai", "en": "arabic"}', 
'templates/official/thank_you_th.html', 'templates/official/thank_you_en.html', 
true, 1, 1),

-- ใบรับรองการฝึกงาน
('INTERN_CERT', 'ใบรับรองการฝึกงาน', 'ใบรับรองการฝึกงาน', 'Internship Certificate', 
'ใบรับรองการฝึกงานสำหรับนักศึกษา', 'certificate', 
'["th", "en"]', '{"th": "thai", "en": "arabic"}', 
'templates/official/intern_cert_th.html', 'templates/official/intern_cert_en.html', 
true, 2, 1);

-- เพิ่มเทมเพลตเอกสารทางราชการ

-- เทมเพลตหนังสือขอความอนุเคราะห์ (ภาษาไทย)
INSERT INTO official_document_templates (document_type_id, name, language, template_content, template_css, template_variables, is_default, created_by) VALUES
(1, 'หนังสือขอความอนุเคราะห์ (ไทย)', 'th', 
'<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>หนังสือขอความอนุเคราะห์</title>
</head>
<body>
    <div class="header">
        <div class="logo">
            <img src="{{university_logo}}" alt="โลโก้มหาวิทยาลัย" />
        </div>
        <div class="university-info">
            <h1>{{university_name_th}}</h1>
            <h2>{{faculty_name_th}}</h2>
            <h3>{{department_name_th}}</h3>
        </div>
    </div>
    
    <div class="document-info">
        <div class="document-number">
            <span>ที่ {{document_number}}</span>
        </div>
        <div class="document-date">
            <span>วันที่ {{document_date_th}}</span>
        </div>
    </div>
    
    <div class="content">
        <div class="subject">
            <strong>เรื่อง</strong> {{subject}}
        </div>
        
        <div class="recipient">
            <strong>เรียน</strong> {{recipient}}
        </div>
        
        <div class="body">
            <p class="indent">{{opening_paragraph}}</p>
            
            <p class="indent">ในการนี้ มหาวิทยาลัยจึงขอส่งรายชื่อนักศึกษาที่ประสงค์จะเข้าฝึกงาน ดังนี้</p>
            
            <div class="student-info">
                <table>
                    <tr>
                        <td>ชื่อ-นามสกุล</td>
                        <td>{{student_name_th}}</td>
                    </tr>
                    <tr>
                        <td>รหัสนักศึกษา</td>
                        <td>{{student_id}}</td>
                    </tr>
                    <tr>
                        <td>สาขาวิชา</td>
                        <td>{{major_th}}</td>
                    </tr>
                    <tr>
                        <td>ชั้นปีที่</td>
                        <td>{{year_th}}</td>
                    </tr>
                    <tr>
                        <td>ระยะเวลาฝึกงาน</td>
                        <td>{{internship_period_th}}</td>
                    </tr>
                </table>
            </div>
            
            <p class="indent">{{closing_paragraph}}</p>
        </div>
        
        <div class="signature">
            <div class="signature-section">
                <p>ขอแสดงความนับถือ</p>
                <br><br><br>
                <p>({{signer_name_th}})</p>
                <p>{{signer_position_th}}</p>
            </div>
        </div>
    </div>
    
    <div class="footer">
        <div class="contact-info">
            <p>{{university_address_th}}</p>
            <p>โทรศัพท์: {{phone}} โทรสาร: {{fax}} อีเมล: {{email}}</p>
        </div>
    </div>
</body>
</html>',

'body { font-family: "TH Sarabun New", "Sarabun", sans-serif; font-size: 16pt; line-height: 1.5; margin: 0; padding: 20mm; }
.header { text-align: center; margin-bottom: 30px; }
.header .logo img { height: 80px; }
.header h1 { font-size: 18pt; font-weight: bold; margin: 10px 0 5px 0; }
.header h2 { font-size: 16pt; font-weight: bold; margin: 5px 0; }
.header h3 { font-size: 14pt; margin: 5px 0; }
.document-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
.content { margin-bottom: 30px; }
.subject, .recipient { margin-bottom: 15px; }
.body p { margin-bottom: 15px; }
.indent { text-indent: 2em; }
.student-info table { width: 100%; margin: 20px 0; }
.student-info td { padding: 5px; border-bottom: 1px dotted #ccc; }
.student-info td:first-child { width: 150px; font-weight: bold; }
.signature { margin-top: 50px; text-align: right; }
.signature-section { display: inline-block; text-align: center; }
.footer { margin-top: 30px; text-align: center; font-size: 12pt; color: #666; }',

'{"university_name_th": "ชื่อมหาวิทยาลัย", "faculty_name_th": "ชื่อคณะ", "department_name_th": "ชื่อภาควิชา", "document_number": "เลขที่เอกสาร", "document_date_th": "วันที่เอกสาร", "subject": "เรื่อง", "recipient": "ผู้รับ", "student_name_th": "ชื่อนักศึกษา", "student_id": "รหัสนักศึกษา", "major_th": "สาขาวิชา", "year_th": "ชั้นปี", "internship_period_th": "ระยะเวลาฝึกงาน", "signer_name_th": "ชื่อผู้ลงนาม", "signer_position_th": "ตำแหน่งผู้ลงนาม"}',

true, 1),

-- เทมเพลตหนังสือขอความอนุเคราะห์ (ภาษาอังกฤษ)
(1, 'Cooperation Request Letter (English)', 'en', 
'<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cooperative Education Request Letter</title>
</head>
<body>
    <div class="header">
        <div class="logo">
            <img src="{{university_logo}}" alt="University Logo" />
        </div>
        <div class="university-info">
            <h1>{{university_name_en}}</h1>
            <h2>{{faculty_name_en}}</h2>
            <h3>{{department_name_en}}</h3>
        </div>
    </div>
    
    <div class="document-info">
        <div class="document-number">
            <span>Ref: {{document_number}}</span>
        </div>
        <div class="document-date">
            <span>Date: {{document_date_en}}</span>
        </div>
    </div>
    
    <div class="content">
        <div class="subject">
            <strong>Subject:</strong> {{subject}}
        </div>
        
        <div class="recipient">
            <strong>To:</strong> {{recipient}}
        </div>
        
        <div class="body">
            <p>{{opening_paragraph}}</p>
            
            <p>We would like to submit the following student for your consideration:</p>
            
            <div class="student-info">
                <table>
                    <tr>
                        <td>Name</td>
                        <td>{{student_name_en}}</td>
                    </tr>
                    <tr>
                        <td>Student ID</td>
                        <td>{{student_id}}</td>
                    </tr>
                    <tr>
                        <td>Major</td>
                        <td>{{major_en}}</td>
                    </tr>
                    <tr>
                        <td>Year</td>
                        <td>{{year_en}}</td>
                    </tr>
                    <tr>
                        <td>Internship Period</td>
                        <td>{{internship_period_en}}</td>
                    </tr>
                </table>
            </div>
            
            <p>{{closing_paragraph}}</p>
        </div>
        
        <div class="signature">
            <div class="signature-section">
                <p>Sincerely yours,</p>
                <br><br><br>
                <p>({{signer_name_en}})</p>
                <p>{{signer_position_en}}</p>
            </div>
        </div>
    </div>
    
    <div class="footer">
        <div class="contact-info">
            <p>{{university_address_en}}</p>
            <p>Tel: {{phone}} Fax: {{fax}} Email: {{email}}</p>
        </div>
    </div>
</body>
</html>',

'body { font-family: "Times New Roman", serif; font-size: 12pt; line-height: 1.5; margin: 0; padding: 20mm; }
.header { text-align: center; margin-bottom: 30px; }
.header .logo img { height: 80px; }
.header h1 { font-size: 16pt; font-weight: bold; margin: 10px 0 5px 0; }
.header h2 { font-size: 14pt; font-weight: bold; margin: 5px 0; }
.header h3 { font-size: 12pt; margin: 5px 0; }
.document-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
.content { margin-bottom: 30px; }
.subject, .recipient { margin-bottom: 15px; }
.body p { margin-bottom: 15px; text-align: justify; }
.student-info table { width: 100%; margin: 20px 0; }
.student-info td { padding: 5px; border-bottom: 1px dotted #ccc; }
.student-info td:first-child { width: 150px; font-weight: bold; }
.signature { margin-top: 50px; text-align: right; }
.signature-section { display: inline-block; text-align: center; }
.footer { margin-top: 30px; text-align: center; font-size: 10pt; color: #666; }',

'{"university_name_en": "University Name", "faculty_name_en": "Faculty Name", "department_name_en": "Department Name", "document_number": "Document Number", "document_date_en": "Document Date", "subject": "Subject", "recipient": "Recipient", "student_name_en": "Student Name", "student_id": "Student ID", "major_en": "Major", "year_en": "Year", "internship_period_en": "Internship Period", "signer_name_en": "Signer Name", "signer_position_en": "Signer Position"}',

false, 1);

-- เพิ่มเอกสารทางราชการตัวอย่าง
INSERT INTO official_documents (document_type_id, document_number, document_year, language, number_display_format, title, subject, recipient, sender, content, student_training_id, company_id, variables, status, created_by) VALUES

-- หนังสือขอความอนุเคราะห์ (ภาษาไทย)
(1, 'COOP_REQ ๐๐๐๑/๒๕๖๗', 2567, 'th', 'thai', 
'หนังสือขอความอนุเคราะห์รับนักศึกษาเข้าฝึกงาน', 
'ขอความอนุเคราะห์รับนักศึกษาเข้าฝึกงาน', 
'ผู้จัดการฝ่ายทรัพยากรบุคคล บริษัท สมาร์ท โซลูชั่นส์ จำกัด', 
'คณะเทคโนโลยีสารสนเทศ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี', 
'ด้วยคณะเทคโนโลยีสารสนเทศ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี มีความประสงค์จะส่งนักศึกษาเข้าฝึกงานในสถานประกอบการของท่าน เพื่อให้นักศึกษาได้รับประสบการณ์ตรงจากการปฏิบัติงานจริง', 
1, 1, 
'{"university_name_th": "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี", "faculty_name_th": "คณะเทคโนโลยีสารสนเทศ", "department_name_th": "ภาควิชาวิทยาการคอมพิวเตอร์", "student_name_th": "นายทดสอบ ระบบ", "student_id": "๖๕๐๑๐๐๐๑", "major_th": "วิทยาการคอมพิวเตอร์", "year_th": "ชั้นปีที่ ๔", "internship_period_th": "๑ มิถุนายน ๒๕๖๗ - ๓๐ กันยายน ๒๕๖๗", "signer_name_th": "ผศ.ดร.สมชาย ใจดี", "signer_position_th": "หัวหน้าภาควิชาวิทยาการคอมพิวเตอร์"}',
'approved', 1),

-- หนังสือขอความอนุเคราะห์ (ภาษาอังกฤษ)
(1, 'COOP_REQ 0002/2024', 2024, 'en', 'arabic', 
'Cooperative Education Request Letter', 
'Request for Student Internship Placement', 
'Human Resources Manager, Smart Solutions Co., Ltd.', 
'Faculty of Information Technology, King Mongkut\'s University of Technology Thonburi', 
'The Faculty of Information Technology, King Mongkut\'s University of Technology Thonburi, would like to request your kind cooperation in accepting our student for internship training at your organization.', 
2, 2, 
'{"university_name_en": "King Mongkut\'s University of Technology Thonburi", "faculty_name_en": "Faculty of Information Technology", "department_name_en": "Department of Computer Science", "student_name_en": "Mr. Test System", "student_id": "65010002", "major_en": "Computer Science", "year_en": "4th Year", "internship_period_en": "June 15, 2024 - September 15, 2024", "signer_name_en": "Asst. Prof. Dr. Somchai Jaidee", "signer_position_en": "Head of Computer Science Department"}',
'approved', 1),

-- หนังสือส่งตัวนักศึกษา (ภาษาไทย)
(2, 'STU_REF ๐๐๐๑/๒๕๖๗', 2567, 'th', 'thai', 
'หนังสือส่งตัวนักศึกษาเข้าฝึกงาน', 
'ส่งตัวนักศึกษาเข้าฝึกงาน', 
'ผู้จัดการฝ่ายทรัพยากรบุคคล บริษัท เทค อินโนเวชั่น จำกัด', 
'คณะเทคโนโลยีสารสนเทศ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี', 
'อ้างถึงหนังสือของบริษัทฯ ที่ตอบรับนักศึกษาเข้าฝึกงาน ในการนี้ คณะฯ จึงขอส่งตัวนักศึกษาเข้าฝึกงาน ตามรายละเอียดที่แจ้งไว้', 
3, 2, 
'{"student_name_th": "นางสาวทดสอบ ระบบสอง", "student_id": "๖๕๐๑๐๐๐๓", "major_th": "เทคโนโลยีสารสนเทศ", "start_date_th": "๑๕ มิถุนายน ๒๕๖๗", "supervisor_name_th": "ผศ.ดร.สมหญิง รักเรียน"}',
'approved', 1);

-- เพิ่มการอนุมัติเอกสาร
INSERT INTO official_document_approvals (document_id, approval_level, approver_id, status, decision, comments, approved_at) VALUES
-- การอนุมัติเอกสารที่ 1 (ระดับ 1)
(1, 1, 12, 'approved', 'approve', 'เอกสารถูกต้องครบถ้วน', '2024-05-10 10:00:00'),
-- การอนุมัติเอกสารที่ 1 (ระดับ 2)
(1, 2, 1, 'approved', 'approve', 'อนุมัติให้ส่งเอกสาร', '2024-05-10 14:30:00'),

-- การอนุมัติเอกสารที่ 2 (ระดับ 1)
(2, 1, 13, 'approved', 'approve', 'เอกสารภาษาอังกฤษถูกต้อง', '2024-05-15 09:15:00'),
-- การอนุมัติเอกสารที่ 2 (ระดับ 2)
(2, 2, 1, 'approved', 'approve', 'อนุมัติให้ส่งเอกสาร', '2024-05-15 11:45:00'),

-- การอนุมัติเอกสารที่ 3 (ระดับ 1)
(3, 1, 12, 'approved', 'approve', 'ข้อมูลนักศึกษาถูกต้อง', '2024-06-01 08:30:00'),
-- การอนุมัติเอกสารที่ 3 (ระดับ 2)
(3, 2, 1, 'approved', 'approve', 'อนุมัติให้ส่งตัวนักศึกษา', '2024-06-01 10:00:00');

-- เพิ่มงานสร้าง PDF
INSERT INTO pdf_generation_jobs (document_id, status, output_path, output_filename, file_size, started_at, completed_at, processing_time, requested_by) VALUES
(1, 'completed', 'pdfs/official/2567/COOP_REQ_0001_2567.pdf', 'COOP_REQ_0001_2567.pdf', 245678, '2024-05-10 14:35:00', '2024-05-10 14:35:15', 15, 1),
(2, 'completed', 'pdfs/official/2024/COOP_REQ_0002_2024.pdf', 'COOP_REQ_0002_2024.pdf', 198765, '2024-05-15 11:50:00', '2024-05-15 11:50:12', 12, 1),
(3, 'completed', 'pdfs/official/2567/STU_REF_0001_2567.pdf', 'STU_REF_0001_2567.pdf', 187654, '2024-06-01 10:05:00', '2024-06-01 10:05:08', 8, 1);

-- อัพเดทข้อมูล PDF ในเอกสาร
UPDATE official_documents SET 
    pdf_generated = true,
    pdf_path = 'pdfs/official/2567/COOP_REQ_0001_2567.pdf',
    pdf_filename = 'COOP_REQ_0001_2567.pdf',
    pdf_size = 245678,
    pdf_generated_at = '2024-05-10 14:35:15',
    pdf_version = 1
WHERE id = 1;

UPDATE official_documents SET 
    pdf_generated = true,
    pdf_path = 'pdfs/official/2024/COOP_REQ_0002_2024.pdf',
    pdf_filename = 'COOP_REQ_0002_2024.pdf',
    pdf_size = 198765,
    pdf_generated_at = '2024-05-15 11:50:12',
    pdf_version = 1
WHERE id = 2;

UPDATE official_documents SET 
    pdf_generated = true,
    pdf_path = 'pdfs/official/2567/STU_REF_0001_2567.pdf',
    pdf_filename = 'STU_REF_0001_2567.pdf',
    pdf_size = 187654,
    pdf_generated_at = '2024-06-01 10:05:08',
    pdf_version = 1
WHERE id = 3;

-- เพิ่มการดาวน์โหลดเอกสาร
INSERT INTO official_document_downloads (document_id, user_id, download_type, ip_address, file_size, download_time) VALUES
(1, 1, 'pdf', '192.168.1.100', 245678, 3.2),
(1, 12, 'pdf', '192.168.1.101', 245678, 2.8),
(2, 1, 'pdf', '192.168.1.100', 198765, 2.5),
(2, 13, 'pdf', '192.168.1.102', 198765, 3.1),
(3, 1, 'pdf', '192.168.1.100', 187654, 2.3),
(3, 12, 'pdf', '192.168.1.101', 187654, 2.7);

-- สร้าง Views สำหรับการใช้งาน

-- View: สรุปเอกสารทางราชการ
CREATE OR REPLACE VIEW official_documents_summary AS
SELECT 
    od.id,
    od.document_number,
    od.document_year,
    odt.name_th as document_type_name,
    od.language,
    od.title,
    od.status,
    od.pdf_generated,
    CASE 
        WHEN od.language = 'th' THEN od.document_number
        ELSE thai_to_arabic_number(od.document_number)
    END as display_number,
    od.created_at,
    od.approved_at,
    CONCAT(u.first_name, ' ', u.last_name) as created_by_name
FROM official_documents od
JOIN official_document_types odt ON od.document_type_id = odt.id
JOIN users u ON od.created_by = u.id
ORDER BY od.created_at DESC;

-- View: สถานะการอนุมัติเอกสาร
CREATE OR REPLACE VIEW document_approval_status AS
SELECT 
    od.id as document_id,
    od.document_number,
    od.title,
    od.status,
    odt.approval_levels as total_levels,
    od.current_approval_level,
    COUNT(oda.id) as completed_approvals,
    COUNT(CASE WHEN oda.status = 'approved' THEN 1 END) as approved_count,
    COUNT(CASE WHEN oda.status = 'rejected' THEN 1 END) as rejected_count,
    COUNT(CASE WHEN oda.status = 'pending' THEN 1 END) as pending_count
FROM official_documents od
JOIN official_document_types odt ON od.document_type_id = odt.id
LEFT JOIN official_document_approvals oda ON od.id = oda.document_id
GROUP BY od.id, od.document_number, od.title, od.status, odt.approval_levels, od.current_approval_level
ORDER BY od.created_at DESC;

-- View: เอกสารที่ใช้เลขไทย vs เลขอารบิก
CREATE OR REPLACE VIEW documents_by_number_format AS
SELECT 
    od.language,
    od.number_display_format,
    COUNT(*) as document_count,
    COUNT(CASE WHEN od.pdf_generated THEN 1 END) as pdf_generated_count,
    ROUND(COUNT(CASE WHEN od.pdf_generated THEN 1 END) * 100.0 / COUNT(*), 2) as pdf_generation_rate
FROM official_documents od
GROUP BY od.language, od.number_display_format
ORDER BY od.language, od.number_display_format;

-- ทดสอบ Functions การแปลงเลข
SELECT 'ทดสอบการแปลงเลข' as title;

SELECT 
    'เลขอารบิก' as type,
    '12345' as original,
    arabic_to_thai_number('12345') as converted;

SELECT 
    'เลขไทย' as type,
    '๑๒๓๔๕' as original,
    thai_to_arabic_number('๑๒๓๔๕') as converted;

SELECT 
    'รูปแบบตามภาษา (ไทย)' as type,
    '2567' as original,
    format_number_by_language('2567', 'th') as converted;

SELECT 
    'รูปแบบตามภาษา (อังกฤษ)' as type,
    '๒๕๖๗' as original,
    format_number_by_language('๒๕๖๗', 'en') as converted;

-- ทดสอบการสร้างเลขที่เอกสาร
SELECT 'ทดสอบการสร้างเลขที่เอกสาร' as title;
SELECT generate_document_number('COOP_REQ', 2567) as next_document_number;

-- แสดงสรุปข้อมูล
SELECT 'สรุปเอกสารทางราชการ' as title;
SELECT * FROM official_documents_summary;

SELECT 'สถานะการอนุมัติ' as title;
SELECT * FROM document_approval_status;

SELECT 'การใช้เลขตามภาษา' as title;
SELECT * FROM documents_by_number_format;

COMMIT;