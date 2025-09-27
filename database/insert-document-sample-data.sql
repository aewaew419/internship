-- ข้อมูลตัวอย่างสำหรับระบบจัดการเอกสารสหกิจศึกษา
-- รันไฟล์นี้หลังจาก add-document-tables.sql แล้ว

-- เพิ่มประเภทเอกสาร
INSERT INTO document_types (name, name_th, description, category, is_required, max_file_size, allowed_extensions, sort_order) VALUES
('coop_application', 'หนังสือขอความอนุเคราะห์รับนักศึกษาเข้าฝึกงาน', 'เอกสารขอความอนุเคราะห์จากบริษัทให้รับนักศึกษาเข้าฝึกงาน', 'application', true, 5242880, ARRAY['pdf', 'doc', 'docx'], 1),
('student_referral', 'หนังสือส่งตัวนักศึกษา', 'เอกสารส่งตัวนักศึกษาไปยังบริษัท', 'application', true, 5242880, ARRAY['pdf', 'doc', 'docx'], 2),
('acceptance_letter', 'หนังสือตอบรับเข้าฝึกงาน', 'เอกสารยืนยันการรับนักศึกษาเข้าฝึกงานจากบริษัท', 'certificate', true, 5242880, ARRAY['pdf', 'doc', 'docx'], 3),
('weekly_report', 'รายงานสัปดาห์', 'รายงานการฝึกงานประจำสัปดาห์', 'report', true, 10485760, ARRAY['pdf', 'doc', 'docx'], 4),
('monthly_report', 'รายงานประจำเดือน', 'รายงานการฝึกงานประจำเดือน', 'report', true, 10485760, ARRAY['pdf', 'doc', 'docx'], 5),
('final_report', 'รายงานฉบับสมบูรณ์', 'รายงานการฝึกงานฉบับสมบูรณ์', 'report', true, 52428800, ARRAY['pdf', 'doc', 'docx'], 6),
('evaluation_form', 'แบบประเมินจากบริษัท', 'แบบประเมินการฝึกงานจากบริษัท', 'evaluation', true, 5242880, ARRAY['pdf', 'doc', 'docx'], 7),
('presentation_slides', 'สไลด์นำเสนอ', 'สไลด์สำหรับการนำเสนอผลงาน', 'report', false, 52428800, ARRAY['pdf', 'ppt', 'pptx'], 8),
('certificate', 'หนังสือรับรอง', 'หนังสือรับรองการฝึกงาน', 'certificate', false, 5242880, ARRAY['pdf', 'doc', 'docx'], 9),
('other_document', 'เอกสารอื่นๆ', 'เอกสารอื่นๆ ที่เกี่ยวข้องกับการฝึกงาน', 'other', false, 10485760, ARRAY['pdf', 'doc', 'docx', 'jpg', 'png'], 10);

-- เพิ่มเทมเพลตเอกสาร
INSERT INTO document_templates (name, name_th, description, document_type_id, template_path, template_filename, template_size, is_default, version, created_by_id) VALUES
('หนังสือขอความอนุเคราะห์ (ไทย)', 'หนังสือขอความอนุเคราะห์รับนักศึกษาเข้าฝึกงาน (ภาษาไทย)', 'เทมเพลตหนังสือขอความอนุเคราะห์ภาษาไทย', 1, 'templates/coop_request_th.docx', 'coop_request_th.docx', 45678, true, '1.0', 1),
('Cooperation Request (English)', 'หนังสือขอความอนุเคราะห์รับนักศึกษาเข้าฝึกงาน (ภาษาอังกฤษ)', 'เทมเพลตหนังสือขอความอนุเคราะห์ภาษาอังกฤษ', 1, 'templates/coop_request_en.docx', 'coop_request_en.docx', 43210, false, '1.0', 1),
('หนังสือส่งตัวนักศึกษา (ไทย)', 'หนังสือส่งตัวนักศึกษา (ภาษาไทย)', 'เทมเพลตหนังสือส่งตัวนักศึกษาภาषาไทย', 2, 'templates/student_referral_th.docx', 'student_referral_th.docx', 42345, true, '1.0', 1),
('Student Referral (English)', 'หนังสือส่งตัวนักศึกษา (ภาษาอังกฤษ)', 'เทมเพลตหนังสือส่งตัวนักศึกษาภาษาอังกฤษ', 2, 'templates/student_referral_en.docx', 'student_referral_en.docx', 41234, false, '1.0', 1),
('รายงานสัปดาห์', 'แบบฟอร์มรายงานสัปดาห์', 'เทมเพลตรายงานการฝึกงานประจำสัปดาห์', 4, 'templates/weekly_report.docx', 'weekly_report.docx', 38765, true, '1.0', 1),
('รายงานประจำเดือน', 'แบบฟอร์มรายงานประจำเดือน', 'เทมเพลตรายงานการฝึกงานประจำเดือน', 5, 'templates/monthly_report.docx', 'monthly_report.docx', 41876, true, '1.0', 1),
('รายงานฉบับสมบูรณ์', 'แบบฟอร์มรายงานฉบับสมบูรณ์', 'เทมเพลตรายงานการฝึกงานฉบับสมบูรณ์', 6, 'templates/final_report.docx', 'final_report.docx', 67890, true, '1.0', 1),
('แบบประเมินจากบริษัท', 'แบบฟอร์มประเมินจากบริษัท', 'เทมเพลตแบบประเมินการฝึกงานจากบริษัท', 7, 'templates/evaluation_form.docx', 'evaluation_form.docx', 35432, true, '1.0', 1);

-- เพิ่มเอกสารตัวอย่าง (สำหรับนักศึกษาที่มีอยู่)
INSERT INTO documents (title, title_th, description, document_type_id, status, file_path, file_name, original_filename, file_size, mime_type, file_hash, student_id, internship_id, uploaded_by_id, due_date, metadata, tags) VALUES
-- เอกสารของนักศึกษา test001
('Cooperation Request Letter', 'หนังสือขอความอนุเคราะห์', 'หนังสือขอความอนุเคราะห์รับเข้าฝึกงานที่บริษัท Smart Solutions', 1, 'approved', 'documents/2024/test001/coop_request_001.pdf', 'coop_request_001.pdf', 'หนังสือขอความอนุเคราะห์_test001.pdf', 234567, 'application/pdf', 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456', 1, 1, 15, '2024-05-15 23:59:59', '{"company": "Smart Solutions", "position": "Frontend Developer"}', ARRAY['coop', 'application', 'approved']),

('Weekly Report #1', 'รายงานสัปดาห์ที่ 1', 'รายงานการฝึกงานสัปดาห์ที่ 1', 4, 'approved', 'documents/2024/test001/weekly_report_001.pdf', 'weekly_report_001.pdf', 'รายงานสัปดาห์ที่1_test001.pdf', 156789, 'application/pdf', 'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567', 1, 1, 15, '2024-06-07 23:59:59', '{"week": 1, "period": "2024-06-01 to 2024-06-07"}', ARRAY['weekly', 'report', 'approved']),

('Weekly Report #2', 'รายงานสัปดาห์ที่ 2', 'รายงานการฝึกงานสัปดาห์ที่ 2', 4, 'approved', 'documents/2024/test001/weekly_report_002.pdf', 'weekly_report_002.pdf', 'รายงานสัปดาห์ที่2_test001.pdf', 167890, 'application/pdf', 'c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678', 1, 1, 15, '2024-06-14 23:59:59', '{"week": 2, "period": "2024-06-08 to 2024-06-14"}', ARRAY['weekly', 'report', 'approved']),

-- เอกสารของนักศึกษา u6800001
('Student Referral Letter', 'หนังสือส่งตัวนักศึกษา', 'หนังสือส่งตัวนักศึกษาไปยังบริษัท Tech Innovation', 2, 'approved', 'documents/2024/u6800001/referral_001.pdf', 'referral_001.pdf', 'หนังสือส่งตัว_u6800001.pdf', 198765, 'application/pdf', 'd4e5f6789012345678901234567890abcdef1234567890abcdef123456789', 3, 2, 16, '2024-06-10 23:59:59', '{"company": "Tech Innovation", "position": "Backend Developer"}', ARRAY['referral', 'approved']),

('Monthly Report #1', 'รายงานประจำเดือน มิถุนายน', 'รายงานการฝึกงานประจำเดือนมิถุนายน 2024', 5, 'under_review', 'documents/2024/u6800001/monthly_report_001.pdf', 'monthly_report_001.pdf', 'รายงานเดือนมิถุนายน_u6800001.pdf', 345678, 'application/pdf', 'e5f6789012345678901234567890abcdef1234567890abcdef1234567890', 3, 2, 16, '2024-07-05 23:59:59', '{"month": "June", "year": 2024}', ARRAY['monthly', 'report', 'under_review']),

-- เอกสารของนักศึกษา u6800002
('Cooperation Request', 'หนังสือขอความอนุเคราะห์', 'หนังสือขอความอนุเคราะห์รับเข้าฝึกงานที่บริษัท Digital Future', 1, 'submitted', 'documents/2024/u6800002/coop_request_002.pdf', 'coop_request_002.pdf', 'หนังสือขอความอนุเคราะห์_u6800002.pdf', 245678, 'application/pdf', 'f6789012345678901234567890abcdef1234567890abcdef12345678901', 4, 3, 17, '2024-06-25 23:59:59', '{"company": "Digital Future", "position": "Full Stack Developer"}', ARRAY['coop', 'application', 'submitted']),

-- เอกสารของนักศึกษา u6800003
('Final Report', 'รายงานฉบับสมบูรณ์', 'รายงานการฝึกงานฉบับสมบูรณ์', 6, 'approved', 'documents/2024/u6800003/final_report_001.pdf', 'final_report_001.pdf', 'รายงานฉบับสมบูรณ์_u6800003.pdf', 1234567, 'application/pdf', '789012345678901234567890abcdef1234567890abcdef123456789012', 5, 4, 18, '2024-08-10 23:59:59', '{"internship_period": "2024-05-15 to 2024-08-15"}', ARRAY['final', 'report', 'approved']),

('Company Evaluation', 'แบบประเมินจากบริษัท', 'แบบประเมินการฝึกงานจากบริษัท Smart Solutions', 7, 'approved', 'documents/2024/u6800003/evaluation_001.pdf', 'evaluation_001.pdf', 'แบบประเมิน_u6800003.pdf', 187654, 'application/pdf', '89012345678901234567890abcdef1234567890abcdef1234567890123', 5, 4, 18, '2024-08-20 23:59:59', '{"evaluator": "HR Manager", "score": 4.5}', ARRAY['evaluation', 'approved']);

-- เพิ่มการอนุมัติเอกสาร
INSERT INTO document_approvals (document_id, approver_id, approval_level, status, decision, comments, approved_at) VALUES
-- การอนุมัติเอกสารของ test001
(1, 12, 1, 'approved', 'approve', 'เอกสารถูกต้องครบถ้วน อนุมัติแล้ว', '2024-05-16 10:30:00'),
(2, 12, 1, 'approved', 'approve', 'รายงานมีรายละเอียดครบถ้วน', '2024-06-08 14:15:00'),
(3, 12, 1, 'approved', 'approve', 'รายงานดีมาก', '2024-06-15 09:45:00'),

-- การอนุมัติเอกสารของ u6800001
(4, 13, 1, 'approved', 'approve', 'หนังสือส่งตัวถูกต้อง', '2024-06-11 11:20:00'),
(5, 13, 1, 'pending', NULL, NULL, NULL),

-- การอนุมัติเอกสารของ u6800002
(6, 14, 1, 'pending', NULL, NULL, NULL),

-- การอนุมัติเอกสารของ u6800003
(7, 12, 1, 'approved', 'approve', 'รายงานมีคุณภาพสูง เนื้อหาครบถ้วน', '2024-08-11 16:30:00'),
(8, 12, 1, 'approved', 'approve', 'การประเมินจากบริษัทดีมาก', '2024-08-21 10:15:00');

-- เพิ่มความคิดเห็นเอกสาร
INSERT INTO document_comments (document_id, user_id, comment, comment_type, is_internal) VALUES
(1, 12, 'เอกสารมีรูปแบบถูกต้องตามมาตรฐาน', 'general', false),
(2, 12, 'รายงานมีรายละเอียดดี แต่ควรเพิ่มภาพประกอบ', 'suggestion', false),
(2, 15, 'ขอบคุณสำหรับคำแนะนำครับ จะปรับปรุงในรายงานหน้า', 'general', false),
(5, 13, 'กรุณาตรวจสอบตัวเลขในหน้า 3 อีกครั้ง', 'correction', false),
(5, 16, 'ได้แก้ไขแล้วครับ', 'general', false),
(7, 12, 'รายงานนี้เป็นตัวอย่างที่ดีสำหรับรุ่นน้อง', 'general', true);

-- เพิ่มการแชร์เอกสาร
INSERT INTO document_shares (document_id, shared_by_id, shared_with_id, permission, expires_at) VALUES
(7, 18, 12, 'view', '2024-12-31 23:59:59'), -- แชร์รายงานฉบับสมบูรณ์กับอาจารย์
(7, 18, 13, 'view', '2024-12-31 23:59:59'), -- แชร์รายงานฉบับสมบูรณ์กับอาจารย์อีกคน
(1, 15, 16, 'view', '2024-12-31 23:59:59'); -- แชร์หนังสือขอความอนุเคราะห์กับเพื่อน

-- เพิ่มการดาวน์โหลดเอกสาร
INSERT INTO document_downloads (document_id, user_id, ip_address, download_type, file_size, download_time) VALUES
(1, 15, '192.168.1.100', 'direct', 234567, 2.5),
(1, 12, '192.168.1.101', 'preview', 234567, 1.2),
(2, 15, '192.168.1.100', 'direct', 156789, 1.8),
(2, 12, '192.168.1.101', 'direct', 156789, 1.5),
(7, 12, '192.168.1.101', 'direct', 1234567, 15.3),
(7, 13, '192.168.1.102', 'direct', 1234567, 12.7);

-- เพิ่มการแจ้งเตือนเอกสาร
INSERT INTO document_notifications (document_id, user_id, notification_type, title, message, is_read, send_email, email_sent) VALUES
(5, 16, 'due_soon', 'เอกสารใกล้ครบกำหนด', 'รายงานประจำเดือนของคุณจะครบกำหนดในอีก 3 วัน', false, true, true),
(6, 17, 'due_soon', 'เอกสารใกล้ครบกำหนด', 'หนังสือขอความอนุเคราะห์ของคุณจะครบกำหนดในอีก 5 วัน', false, true, true),
(1, 15, 'approved', 'เอกสารได้รับการอนุมัติ', 'หนังสือขอความอนุเคราะห์ของคุณได้รับการอนุมัติแล้ว', true, true, true),
(2, 15, 'approved', 'เอกสารได้รับการอนุมัติ', 'รายงานสัปดาห์ที่ 1 ของคุณได้รับการอนุมัติแล้ว', true, true, true),
(2, 15, 'comment_added', 'มีความคิดเห็นใหม่', 'อาจารย์ได้แสดงความคิดเห็นในรายงานสัปดาห์ที่ 1 ของคุณ', false, true, true);

-- อัพเดทจำนวนการใช้งานเทมเพลต
UPDATE document_templates SET usage_count = 3 WHERE id = 1; -- coop request template
UPDATE document_templates SET usage_count = 1 WHERE id = 3; -- student referral template
UPDATE document_templates SET usage_count = 2 WHERE id = 5; -- weekly report template
UPDATE document_templates SET usage_count = 1 WHERE id = 6; -- monthly report template
UPDATE document_templates SET usage_count = 1 WHERE id = 7; -- final report template
UPDATE document_templates SET usage_count = 1 WHERE id = 8; -- evaluation template

-- สร้าง view สำหรับสถิติเอกสาร
CREATE OR REPLACE VIEW document_statistics AS
SELECT 
    dt.name_th as document_type,
    COUNT(d.id) as total_documents,
    COUNT(CASE WHEN d.status = 'draft' THEN 1 END) as draft_count,
    COUNT(CASE WHEN d.status = 'submitted' THEN 1 END) as submitted_count,
    COUNT(CASE WHEN d.status = 'under_review' THEN 1 END) as under_review_count,
    COUNT(CASE WHEN d.status = 'approved' THEN 1 END) as approved_count,
    COUNT(CASE WHEN d.status = 'rejected' THEN 1 END) as rejected_count,
    AVG(d.file_size) as avg_file_size
FROM document_types dt
LEFT JOIN documents d ON dt.id = d.document_type_id
GROUP BY dt.id, dt.name_th
ORDER BY dt.sort_order;

-- สร้าง view สำหรับเอกสารที่ใกล้ครบกำหนด
CREATE OR REPLACE VIEW documents_due_soon AS
SELECT 
    d.id,
    d.title_th,
    dt.name_th as document_type,
    CONCAT(u.first_name, ' ', u.last_name) as student_name,
    s.student_id,
    d.due_date,
    EXTRACT(DAY FROM (d.due_date - CURRENT_TIMESTAMP)) as days_remaining,
    d.status
FROM documents d
JOIN document_types dt ON d.document_type_id = dt.id
JOIN students s ON d.student_id = s.id
JOIN users u ON s.user_id = u.id
WHERE d.due_date IS NOT NULL 
    AND d.due_date > CURRENT_TIMESTAMP 
    AND d.due_date <= CURRENT_TIMESTAMP + INTERVAL '7 days'
    AND d.status NOT IN ('approved', 'rejected')
ORDER BY d.due_date ASC;

-- สร้าง view สำหรับเอกสารที่เกินกำหนด
CREATE OR REPLACE VIEW documents_overdue AS
SELECT 
    d.id,
    d.title_th,
    dt.name_th as document_type,
    CONCAT(u.first_name, ' ', u.last_name) as student_name,
    s.student_id,
    d.due_date,
    EXTRACT(DAY FROM (CURRENT_TIMESTAMP - d.due_date)) as days_overdue,
    d.status
FROM documents d
JOIN document_types dt ON d.document_type_id = dt.id
JOIN students s ON d.student_id = s.id
JOIN users u ON s.user_id = u.id
WHERE d.due_date IS NOT NULL 
    AND d.due_date < CURRENT_TIMESTAMP
    AND d.status NOT IN ('approved', 'rejected')
ORDER BY d.due_date ASC;

COMMIT;